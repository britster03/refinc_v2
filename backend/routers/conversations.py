from fastapi import APIRouter, HTTPException, Depends, Query, status
from fastapi.security import HTTPBearer
from typing import List, Optional, Dict, Any
from datetime import datetime, timedelta
import json
import stripe
import os
import sqlite3
from models import (
    PremiumConversationCreate, PremiumConversationUpdate, PremiumConversationResponse,
    PremiumMessageCreate, PremiumMessageResponse, PaymentIntentCreate, PaymentIntentResponse,
    EmployeeSettings, EmployeeSettingsUpdate, PremiumEmployee, EmployeeAnalytics,
    ConversationFilters, PaymentConfirm, RefundRequest, RefundResponse,
    UserResponse, WebSocketMessage, CouponValidation, CouponValidationResponse
)
from database import DatabaseManager
from auth_utils import get_current_user

# Initialize Stripe
stripe.api_key = os.getenv("STRIPE_SECRET_KEY")

router = APIRouter()
security = HTTPBearer()

# Coupon validation function
async def validate_coupon_code(code: str, original_amount: float) -> CouponValidationResponse:
    """Validate coupon code and calculate discount"""
    # Development coupons for testing
    dev_coupons = {
        "DEV100": {"discount_type": "percentage", "discount_value": 100, "description": "100% off for development"},
        "DEV50": {"discount_type": "percentage", "discount_value": 50, "description": "50% off for development"},
        "FREE": {"discount_type": "percentage", "discount_value": 100, "description": "Free session"}
    }
    
    code_upper = code.upper()
    
    if code_upper in dev_coupons:
        coupon = dev_coupons[code_upper]
        if coupon["discount_type"] == "percentage":
            discount_amount = (original_amount * coupon["discount_value"]) / 100
        else:  # fixed
            discount_amount = min(coupon["discount_value"], original_amount)
        
        final_amount = max(0, original_amount - discount_amount)
        
        return CouponValidationResponse(
            valid=True,
            discount_amount=discount_amount,
            final_amount=final_amount,
            message=f"Applied {coupon['description']}"
        )
    
    return CouponValidationResponse(
        valid=False,
        discount_amount=0,
        final_amount=original_amount,
        message="Invalid coupon code"
    )

@router.post("/validate-coupon", response_model=CouponValidationResponse)
async def validate_coupon(coupon_data: CouponValidation):
    """Validate a coupon code"""
    return await validate_coupon_code(coupon_data.code, coupon_data.original_amount)

# Employee endpoints
@router.get("/employees", response_model=List[PremiumEmployee])
async def get_premium_employees(
    search: Optional[str] = Query(None),
    expertise: Optional[str] = Query(None),
    min_rating: Optional[float] = Query(None),
    max_rate: Optional[float] = Query(None),
    available_only: bool = Query(True),
    limit: int = Query(20, le=100),
    offset: int = Query(0, ge=0)
):
    """Get list of available premium conversation employees"""
    try:
        # Build dynamic query
        conditions = ["u.role = 'employee'", "es.is_available = 1"] if available_only else ["u.role = 'employee'"]
        params = []

        if search:
            conditions.append("(u.name LIKE ? OR u.position LIKE ? OR u.company LIKE ?)")
            search_term = f"%{search}%"
            params.extend([search_term, search_term, search_term])

        if expertise:
            conditions.append("es.expertise LIKE ?")
            params.append(f"%{expertise}%")

        if min_rating is not None:
            conditions.append("u.rating >= ?")
            params.append(min_rating)

        if max_rate is not None:
            conditions.append("es.hourly_rate <= ?")
            params.append(max_rate)

        where_clause = " AND ".join(conditions) if conditions else "1=1"

        query = f"""
            SELECT 
                u.id, u.name, u.email, u.position, u.company, u.department,
                u.avatar_url, u.rating, u.total_referrals, u.successful_referrals,
                COALESCE(es.hourly_rate, 50.0) as hourly_rate, 
                COALESCE(es.expertise, '[]') as expertise, 
                COALESCE(es.bio, '') as bio, 
                COALESCE(es.is_available, 1) as is_available,
                COALESCE(es.response_time_hours, 24) as response_time_hours, 
                COALESCE(es.max_daily_sessions, 8) as max_daily_sessions,
                COUNT(pc.id) as total_sessions,
                AVG(pc.rating) as avg_session_rating
            FROM users u
            LEFT JOIN employee_settings es ON u.id = es.user_id
            LEFT JOIN premium_conversations pc ON u.id = pc.employee_id AND pc.status = 'completed'
            WHERE {where_clause}
            GROUP BY u.id
            ORDER BY u.rating DESC, es.hourly_rate ASC
            LIMIT ? OFFSET ?
        """
        
        params.extend([limit, offset])
        employees = DatabaseManager.execute_query(query, tuple(params), fetch_all=True)

        # Get availability for each employee
        result = []
        for emp in employees:
            availability_query = """
                SELECT day_of_week, start_time, end_time, timezone
                FROM employee_availability
                WHERE user_id = ?
                ORDER BY day_of_week, start_time
            """
            availability = DatabaseManager.execute_query(
                availability_query, (emp['id'],), fetch_all=True
            )

            result.append(PremiumEmployee(
                id=emp['id'],
                name=emp['name'],
                email=emp['email'],
                position=emp['position'] or "",
                company=emp['company'] or "",
                department=emp['department'] or "",
                avatar_url=emp['avatar_url'],
                rating=float(emp['rating'] or 0),
                total_sessions=int(emp['total_sessions'] or 0),
                response_time=f"< {emp['response_time_hours'] or 24} hours",
                hourly_rate=float(emp['hourly_rate'] or 50),
                expertise=json.loads(emp['expertise'] or '[]'),
                availability=[
                    {
                        "day_of_week": slot['day_of_week'],
                        "start_time": slot['start_time'],
                        "end_time": slot['end_time'],
                        "timezone": slot['timezone']
                    } for slot in availability
                ],
                is_available=bool(emp['is_available']),
                bio=emp['bio']
            ))

        return result

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch employees: {str(e)}")

@router.get("/employees/{employee_id}", response_model=PremiumEmployee)
async def get_employee_details(employee_id: int):
    """Get detailed employee information"""
    try:
        query = """
            SELECT 
                u.id, u.name, u.email, u.position, u.company, u.department,
                u.avatar_url, u.rating, u.total_referrals, u.successful_referrals,
                COALESCE(es.hourly_rate, 50.0) as hourly_rate, 
                COALESCE(es.expertise, '[]') as expertise, 
                COALESCE(es.bio, '') as bio, 
                COALESCE(es.is_available, 1) as is_available,
                COALESCE(es.response_time_hours, 24) as response_time_hours, 
                COALESCE(es.max_daily_sessions, 8) as max_daily_sessions,
                COUNT(pc.id) as total_sessions,
                AVG(pc.rating) as avg_session_rating
            FROM users u
            LEFT JOIN employee_settings es ON u.id = es.user_id
            LEFT JOIN premium_conversations pc ON u.id = pc.employee_id AND pc.status = 'completed'
            WHERE u.id = ? AND u.role = 'employee'
            GROUP BY u.id
        """
        
        employee = DatabaseManager.execute_query(query, (employee_id,), fetch_one=True)
        if not employee:
            raise HTTPException(status_code=404, detail="Employee not found")

        # Get availability
        availability_query = """
            SELECT day_of_week, start_time, end_time, timezone
            FROM employee_availability
            WHERE user_id = ?
            ORDER BY day_of_week, start_time
        """
        availability = DatabaseManager.execute_query(
            availability_query, (employee_id,), fetch_all=True
        )

        return PremiumEmployee(
            id=employee['id'],
            name=employee['name'],
            email=employee['email'],
            position=employee['position'] or "",
            company=employee['company'] or "",
            department=employee['department'] or "",
            avatar_url=employee['avatar_url'],
            rating=float(employee['rating'] or 0),
            total_sessions=int(employee['total_sessions'] or 0),
            response_time=f"< {employee['response_time_hours'] or 24} hours",
            hourly_rate=float(employee['hourly_rate'] or 50),
            expertise=json.loads(employee['expertise'] or '[]'),
            availability=[
                {
                    "day_of_week": slot['day_of_week'],
                    "start_time": slot['start_time'],
                    "end_time": slot['end_time'],
                    "timezone": slot['timezone']
                } for slot in availability
            ],
            is_available=bool(employee['is_available']),
            bio=employee['bio']
        )

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch employee details: {str(e)}")

# Conversation booking endpoints
@router.post("/", response_model=PremiumConversationResponse)
async def create_premium_conversation(
    conversation: PremiumConversationCreate,
    current_user: dict = Depends(get_current_user)
):
    """Create a new premium conversation request"""
    try:
        # Verify user is a candidate
        if current_user.get('role') != 'candidate':
            raise HTTPException(status_code=403, detail="Only candidates can book premium conversations")

        # Get employee details and verify availability
        employee_query = """
            SELECT u.*, 
                   COALESCE(es.hourly_rate, 50.0) as hourly_rate, 
                   COALESCE(es.is_available, 1) as is_available, 
                   COALESCE(es.max_daily_sessions, 8) as max_daily_sessions
            FROM users u
            LEFT JOIN employee_settings es ON u.id = es.user_id
            WHERE u.id = ? AND u.role = 'employee'
        """
        employee = DatabaseManager.execute_query(employee_query, (conversation.employee_id,), fetch_one=True)
        
        if not employee:
            raise HTTPException(status_code=404, detail="Employee not found")
        
        if not employee['is_available']:
            raise HTTPException(status_code=400, detail="Employee is not available for premium conversations")

        # Check if employee has reached daily session limit
        today = datetime.now().date()
        daily_sessions_query = """
            SELECT COUNT(*) as count FROM premium_conversations
            WHERE employee_id = ? AND DATE(scheduled_time) = ? AND status NOT IN ('cancelled', 'declined')
        """
        daily_count = DatabaseManager.execute_query(
            daily_sessions_query, (conversation.employee_id, today), fetch_one=True
        )
        
        if daily_count['count'] >= employee['max_daily_sessions']:
            raise HTTPException(status_code=400, detail="Employee has reached daily session limit")

        # Calculate total amount
        hourly_rate = float(employee['hourly_rate'] or 50)
        total_amount = (conversation.duration_minutes / 60) * hourly_rate

        # Apply coupon if provided
        original_amount = total_amount
        coupon_discount = 0.0
        coupon_code_used = None
        if conversation.coupon_code:
            # Validate coupon
            coupon_result = await validate_coupon_code(conversation.coupon_code, original_amount)
            if coupon_result.valid:
                coupon_discount = coupon_result.discount_amount
                total_amount = coupon_result.final_amount
                coupon_code_used = conversation.coupon_code.upper()

        # Create conversation record
        insert_query = """
            INSERT INTO premium_conversations (
                candidate_id, employee_id, scheduled_time, duration_minutes,
                hourly_rate, total_amount, topic, candidate_message, status
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'pending')
        """
        
        conversation_id = DatabaseManager.execute_query(
            insert_query,
            (
                current_user['id'], conversation.employee_id, conversation.scheduled_time,
                conversation.duration_minutes, hourly_rate, total_amount,
                conversation.topic, conversation.candidate_message
            ),
            fetch_one=False
        )

        # Track coupon usage if coupon was used
        if coupon_code_used and coupon_discount > 0:
            DatabaseManager.execute_query(
                "INSERT INTO coupon_usage (coupon_code, user_id, conversation_id, discount_amount) VALUES (?, ?, ?, ?)",
                (coupon_code_used, current_user['id'], conversation_id, coupon_discount)
            )

        # Send notification to employee
        notification_query = """
            INSERT INTO notifications (user_id, type, title, message, data, priority)
            VALUES (?, 'premium_conversation_request', 'New Premium Conversation Request', ?, ?, 'high')
        """
        notification_data = json.dumps({
            "conversation_id": conversation_id,
            "candidate_name": current_user['name'],
            "topic": conversation.topic,
            "amount": total_amount
        })
        DatabaseManager.execute_query(
            notification_query,
            (
                conversation.employee_id,
                f"{current_user['name']} has requested a premium conversation about {conversation.topic}",
                notification_data
            )
        )

        # Return the created conversation by fetching it from database
        conv_query = """
            SELECT 
                pc.*,
                u_candidate.name as candidate_name, u_candidate.email as candidate_email, u_candidate.avatar_url as candidate_avatar,
                u_employee.name as employee_name, u_employee.email as employee_email, u_employee.avatar_url as employee_avatar,
                u_employee.position as employee_position, u_employee.company as employee_company,
                COALESCE(es.expertise, '[]') as employee_expertise
            FROM premium_conversations pc
            LEFT JOIN users u_candidate ON pc.candidate_id = u_candidate.id
            LEFT JOIN users u_employee ON pc.employee_id = u_employee.id
            LEFT JOIN employee_settings es ON pc.employee_id = es.user_id
            WHERE pc.id = ?
        """
        
        conv = DatabaseManager.execute_query(conv_query, (conversation_id,), fetch_one=True)
        
        return PremiumConversationResponse(
            id=conv['id'],
            candidate_id=conv['candidate_id'],
            employee_id=conv['employee_id'],
            status=conv['status'],
            scheduled_time=datetime.fromisoformat(conv['scheduled_time']),
            duration_minutes=conv['duration_minutes'],
            hourly_rate=conv['hourly_rate'],
            total_amount=conv['total_amount'],
            topic=conv['topic'],
            candidate_message=conv['candidate_message'],
            employee_response=conv['employee_response'],
            created_at=datetime.fromisoformat(conv['created_at']),
            updated_at=datetime.fromisoformat(conv['updated_at']),
            started_at=datetime.fromisoformat(conv['started_at']) if conv['started_at'] else None,
            ended_at=datetime.fromisoformat(conv['ended_at']) if conv['ended_at'] else None,
            payment_status=conv['payment_status'],
            payment_intent_id=conv['payment_intent_id'],
            rating=conv['rating'],
            feedback=conv['feedback'],
            candidate=UserResponse(
                id=conv['candidate_id'],
                email=conv['candidate_email'],
                name=conv['candidate_name'],
                role='candidate',
                avatar_url=conv['candidate_avatar'],
                is_verified=False,
                created_at=datetime.now(),
                updated_at=datetime.now()
            ) if conv['candidate_name'] else None,
            employee=PremiumEmployee(
                id=conv['employee_id'],
                name=conv['employee_name'],
                email=conv['employee_email'],
                position=conv['employee_position'] or "",
                company=conv['employee_company'] or "",
                department="",
                avatar_url=conv['employee_avatar'],
                rating=0.0,
                total_sessions=0,
                response_time="< 24 hours",
                hourly_rate=conv['hourly_rate'],
                expertise=json.loads(conv['employee_expertise'] or '[]'),
                availability=[],
                is_available=True,
                bio=""
            ) if conv['employee_name'] else None
        )

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to create conversation: {str(e)}")

@router.get("/", response_model=List[PremiumConversationResponse])
async def get_conversations(
    status: Optional[str] = Query(None),
    date_from: Optional[datetime] = Query(None),
    date_to: Optional[datetime] = Query(None),
    employee_id: Optional[int] = Query(None),
    candidate_id: Optional[int] = Query(None),
    limit: int = Query(20, le=100),
    offset: int = Query(0, ge=0),
    current_user: dict = Depends(get_current_user)
):
    """Get conversations for current user"""
    try:
        # Base query
        base_query = """
            SELECT 
                pc.*,
                u_candidate.name as candidate_name, u_candidate.email as candidate_email, u_candidate.avatar_url as candidate_avatar,
                u_employee.name as employee_name, u_employee.email as employee_email, u_employee.avatar_url as employee_avatar,
                u_employee.position as employee_position, u_employee.company as employee_company,
                COALESCE(es.expertise, '[]') as employee_expertise
            FROM premium_conversations pc
            LEFT JOIN users u_candidate ON pc.candidate_id = u_candidate.id
            LEFT JOIN users u_employee ON pc.employee_id = u_employee.id
            LEFT JOIN employee_settings es ON pc.employee_id = es.user_id
        """
        
        # Build conditions based on user role and filters
        conditions = []
        params = []

        if current_user.get('role') == 'candidate':
            conditions.append("pc.candidate_id = ?")
            params.append(current_user['id'])
        elif current_user.get('role') == 'employee':
            conditions.append("pc.employee_id = ?")
            params.append(current_user['id'])
        else:
            raise HTTPException(status_code=403, detail="Access denied")

        if status:
            conditions.append("pc.status = ?")
            params.append(status)

        if date_from:
            conditions.append("pc.scheduled_time >= ?")
            params.append(date_from)

        if date_to:
            conditions.append("pc.scheduled_time <= ?")
            params.append(date_to)

        if employee_id and current_user.get('role') == 'candidate':
            conditions.append("pc.employee_id = ?")
            params.append(employee_id)

        if candidate_id and current_user.get('role') == 'employee':
            conditions.append("pc.candidate_id = ?")
            params.append(candidate_id)

        where_clause = " AND ".join(conditions) if conditions else "1=1"
        query = f"{base_query} WHERE {where_clause} ORDER BY pc.scheduled_time DESC LIMIT ? OFFSET ?"
        params.extend([limit, offset])

        conversations = DatabaseManager.execute_query(query, tuple(params), fetch_all=True)

        result = []
        for conv in conversations:
            result.append(PremiumConversationResponse(
                id=conv['id'],
                candidate_id=conv['candidate_id'],
                employee_id=conv['employee_id'],
                status=conv['status'],
                scheduled_time=datetime.fromisoformat(conv['scheduled_time']),
                duration_minutes=conv['duration_minutes'],
                hourly_rate=conv['hourly_rate'],
                total_amount=conv['total_amount'],
                topic=conv['topic'],
                candidate_message=conv['candidate_message'],
                employee_response=conv['employee_response'],
                created_at=datetime.fromisoformat(conv['created_at']),
                updated_at=datetime.fromisoformat(conv['updated_at']),
                started_at=datetime.fromisoformat(conv['started_at']) if conv['started_at'] else None,
                ended_at=datetime.fromisoformat(conv['ended_at']) if conv['ended_at'] else None,
                payment_status=conv['payment_status'],
                payment_intent_id=conv['payment_intent_id'],
                rating=conv['rating'],
                feedback=conv['feedback'],
                candidate=UserResponse(
                    id=conv['candidate_id'],
                    email=conv['candidate_email'],
                    name=conv['candidate_name'],
                    role='candidate',
                    avatar_url=conv['candidate_avatar'],
                    is_verified=False,
                    created_at=datetime.now(),
                    updated_at=datetime.now()
                ) if conv['candidate_name'] else None,
                employee=PremiumEmployee(
                    id=conv['employee_id'],
                    name=conv['employee_name'],
                    email=conv['employee_email'],
                    position=conv['employee_position'] or "",
                    company=conv['employee_company'] or "",
                    department="",
                    avatar_url=conv['employee_avatar'],
                    rating=0.0,
                    total_sessions=0,
                    response_time="< 24 hours",
                    hourly_rate=conv['hourly_rate'],
                    expertise=json.loads(conv['employee_expertise'] or '[]'),
                    availability=[],
                    is_available=True,
                    bio=""
                ) if conv['employee_name'] else None
            ))

        return result

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch conversations: {str(e)}")

@router.get("/{conversation_id}")
async def get_conversation(
    conversation_id: int,
    current_user: dict = Depends(get_current_user)
):
    """Get detailed information about a specific conversation"""
    try:
        # Get conversation details with employee and candidate info
        query = """
            SELECT 
                pc.*,
                u_emp.name as emp_name, u_emp.email as emp_email, 
                u_emp.avatar_url as emp_avatar_url,
                u_cand.name as cand_name, u_cand.email as cand_email, 
                u_cand.avatar_url as cand_avatar_url,
                COALESCE(es.hourly_rate, 50.0) as emp_hourly_rate, 
                COALESCE(es.expertise, '[]') as emp_expertise, 
                COALESCE(es.bio, '') as emp_bio,
                COALESCE(AVG(pc_ratings.rating), 0) as emp_rating
            FROM premium_conversations pc
            LEFT JOIN users u_emp ON pc.employee_id = u_emp.id
            LEFT JOIN users u_cand ON pc.candidate_id = u_cand.id
            LEFT JOIN employee_settings es ON pc.employee_id = es.user_id
            LEFT JOIN premium_conversations pc_ratings ON pc.employee_id = pc_ratings.employee_id AND pc_ratings.rating IS NOT NULL
            WHERE pc.id = ?
            GROUP BY pc.id
        """
        
        conversation = DatabaseManager.execute_query(query, (conversation_id,), fetch_one=True)
        if not conversation:
            raise HTTPException(status_code=404, detail="Conversation not found")
        
        # Check if user has access to this conversation
        if (current_user["role"] == "candidate" and conversation["candidate_id"] != current_user["id"]) or \
           (current_user["role"] == "employee" and conversation["employee_id"] != current_user["id"]):
            raise HTTPException(status_code=403, detail="Access denied")
        
        # Get messages for this conversation
        messages_query = """
            SELECT pm.*, u.name as sender_name
            FROM premium_messages pm
            LEFT JOIN users u ON pm.sender_id = u.id
            WHERE pm.conversation_id = ?
            ORDER BY pm.created_at
        """
        
        messages = DatabaseManager.execute_query(messages_query, (conversation_id,), fetch_all=True)
        
        # Parse expertise as JSON
        expertise = []
        if conversation["emp_expertise"]:
            try:
                expertise = json.loads(conversation["emp_expertise"])
            except:
                expertise = []
        
        result = {
            "id": conversation["id"],
            "topic": conversation["topic"],
            "status": conversation["status"],
            "duration_minutes": conversation["duration_minutes"],
            "hourly_rate": conversation["hourly_rate"],
            "total_amount": conversation["total_amount"],
            "scheduled_datetime": conversation["scheduled_time"],  # Frontend expects scheduled_datetime
            "total_cost": conversation["total_amount"],  # Add total_cost for frontend compatibility
            "started_at": conversation["started_at"],  # Add session start time
            "ended_at": conversation["ended_at"],  # Add session end time
            "employee": {
                "id": conversation["employee_id"],
                "name": conversation["emp_name"],
                "email": conversation["emp_email"],
                "first_name": conversation["emp_name"].split()[0] if conversation["emp_name"] else "",
                "last_name": " ".join(conversation["emp_name"].split()[1:]) if conversation["emp_name"] and len(conversation["emp_name"].split()) > 1 else "",
                "rating": round(conversation["emp_rating"], 1),
                "expertise": expertise,
                "bio": conversation["emp_bio"] or "",
                "avatar_url": conversation["emp_avatar_url"]
            },
            "candidate": {
                "id": conversation["candidate_id"],
                "name": conversation["cand_name"],
                "email": conversation["cand_email"],
                "first_name": conversation["cand_name"].split()[0] if conversation["cand_name"] else "",
                "last_name": " ".join(conversation["cand_name"].split()[1:]) if conversation["cand_name"] and len(conversation["cand_name"].split()) > 1 else "",
                "avatar_url": conversation["cand_avatar_url"]
            },
            "messages": [
                {
                    "id": msg["id"],
                    "sender_id": msg["sender_id"],
                    "sender_role": msg["sender_type"],  # Frontend expects sender_role
                    "content": msg["content"],
                    "timestamp": msg["created_at"],  # Frontend expects timestamp
                    "file_url": msg["file_url"]
                }
                for msg in messages
            ]
        }
        
        return result
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching conversation: {str(e)}")

@router.patch("/{conversation_id}", response_model=PremiumConversationResponse)
async def update_conversation(
    conversation_id: int,
    updates: PremiumConversationUpdate,
    current_user: dict = Depends(get_current_user)
):
    """Update conversation (for employee responses, status changes, ratings)"""
    try:
        # Get conversation and verify access
        conv_query = """
            SELECT * FROM premium_conversations WHERE id = ?
        """
        conv = DatabaseManager.execute_query(conv_query, (conversation_id,), fetch_one=True)
        if not conv:
            raise HTTPException(status_code=404, detail="Conversation not found")
        
        # Check if user has access to this conversation
        if (current_user.get("role") == "candidate" and conv["candidate_id"] != current_user["id"]) or \
           (current_user.get("role") == "employee" and conv["employee_id"] != current_user["id"]):
            raise HTTPException(status_code=403, detail="Access denied")
        
        # Build update query dynamically
        set_clauses = []
        params = []

        if updates.status is not None:
            # Validate status transitions
            if current_user.get('role') == 'employee':
                if conv['status'] == 'pending' and updates.status in ['accepted', 'declined']:
                    set_clauses.append("status = ?")
                    params.append(updates.status)
                elif conv['status'] == 'accepted' and updates.status == 'in_progress':
                    set_clauses.append("status = ?")
                    set_clauses.append("started_at = ?")
                    params.extend([updates.status, datetime.now()])
                elif conv['status'] == 'in_progress' and updates.status == 'completed':
                    set_clauses.append("status = ?")
                    set_clauses.append("ended_at = ?")
                    params.extend([updates.status, datetime.now()])
                else:
                    raise HTTPException(status_code=400, detail="Invalid status transition")
            elif current_user.get('role') == 'candidate':
                if conv['status'] in ['pending', 'accepted'] and updates.status == 'cancelled':
                    set_clauses.append("status = ?")
                    params.append(updates.status)
                else:
                    raise HTTPException(status_code=400, detail="Invalid status transition")

        if updates.employee_response is not None and current_user.get('role') == 'employee':
            set_clauses.append("employee_response = ?")
            params.append(updates.employee_response)

        if updates.scheduled_time is not None and current_user.get('role') == 'employee':
            set_clauses.append("scheduled_time = ?")
            params.append(updates.scheduled_time)

        if updates.rating is not None and current_user.get('role') == 'candidate' and conv['status'] == 'completed':
            set_clauses.append("rating = ?")
            params.append(updates.rating)

        if updates.feedback is not None and current_user.get('role') == 'candidate' and conv['status'] == 'completed':
            set_clauses.append("feedback = ?")
            params.append(updates.feedback)

        if not set_clauses:
            raise HTTPException(status_code=400, detail="No valid updates provided")

        set_clauses.append("updated_at = ?")
        params.append(datetime.now())
        params.append(conversation_id)

        update_query = f"""
            UPDATE premium_conversations 
            SET {', '.join(set_clauses)}
            WHERE id = ?
        """
        
        DatabaseManager.execute_query(update_query, tuple(params))

        # Send notifications for status changes
        if updates.status:
            await send_status_notification(conversation_id, updates.status, current_user)

        # Return updated conversation by fetching it from database
        conv_query = """
            SELECT 
                pc.*,
                u_candidate.name as candidate_name, u_candidate.email as candidate_email, u_candidate.avatar_url as candidate_avatar,
                u_employee.name as employee_name, u_employee.email as employee_email, u_employee.avatar_url as employee_avatar,
                u_employee.position as employee_position, u_employee.company as employee_company,
                COALESCE(es.expertise, '[]') as employee_expertise
            FROM premium_conversations pc
            LEFT JOIN users u_candidate ON pc.candidate_id = u_candidate.id
            LEFT JOIN users u_employee ON pc.employee_id = u_employee.id
            LEFT JOIN employee_settings es ON pc.employee_id = es.user_id
            WHERE pc.id = ?
        """
        
        conv = DatabaseManager.execute_query(conv_query, (conversation_id,), fetch_one=True)
        
        return PremiumConversationResponse(
            id=conv['id'],
            candidate_id=conv['candidate_id'],
            employee_id=conv['employee_id'],
            status=conv['status'],
            scheduled_time=datetime.fromisoformat(conv['scheduled_time']),
            duration_minutes=conv['duration_minutes'],
            hourly_rate=conv['hourly_rate'],
            total_amount=conv['total_amount'],
            topic=conv['topic'],
            candidate_message=conv['candidate_message'],
            employee_response=conv['employee_response'],
            created_at=datetime.fromisoformat(conv['created_at']),
            updated_at=datetime.fromisoformat(conv['updated_at']),
            started_at=datetime.fromisoformat(conv['started_at']) if conv['started_at'] else None,
            ended_at=datetime.fromisoformat(conv['ended_at']) if conv['ended_at'] else None,
            payment_status=conv['payment_status'],
            payment_intent_id=conv['payment_intent_id'],
            rating=conv['rating'],
            feedback=conv['feedback'],
            candidate=UserResponse(
                id=conv['candidate_id'],
                email=conv['candidate_email'],
                name=conv['candidate_name'],
                role='candidate',
                avatar_url=conv['candidate_avatar'],
                is_verified=False,
                created_at=datetime.now(),
                updated_at=datetime.now()
            ) if conv['candidate_name'] else None,
            employee=PremiumEmployee(
                id=conv['employee_id'],
                name=conv['employee_name'],
                email=conv['employee_email'],
                position=conv['employee_position'] or "",
                company=conv['employee_company'] or "",
                department="",
                avatar_url=conv['employee_avatar'],
                rating=0.0,
                total_sessions=0,
                response_time="< 24 hours",
                hourly_rate=conv['hourly_rate'],
                expertise=json.loads(conv['employee_expertise'] or '[]'),
                availability=[],
                is_available=True,
                bio=""
            ) if conv['employee_name'] else None
        )

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to update conversation: {str(e)}")

# Payment endpoints
@router.post("/{conversation_id}/payment-intent", response_model=PaymentIntentResponse)
async def create_payment_intent(
    conversation_id: int,
    payment_data: PaymentIntentCreate,
    current_user: dict = Depends(get_current_user)
):
    """Create Stripe payment intent for conversation"""
    try:
        # Get conversation and verify access
        conv_query = """
            SELECT * FROM premium_conversations WHERE id = ?
        """
        conv = DatabaseManager.execute_query(conv_query, (conversation_id,), fetch_one=True)
        if not conv:
            raise HTTPException(status_code=404, detail="Conversation not found")
        
        if current_user.get('role') != 'candidate' or conv['candidate_id'] != current_user['id']:
            raise HTTPException(status_code=403, detail="Only the candidate can create payment for this conversation")

        if conv['payment_status'] == 'completed':
            raise HTTPException(status_code=400, detail="Payment already completed")

        # Apply coupon if provided
        final_amount = conv['total_amount']
        if payment_data.coupon_code:
            coupon_result = await validate_coupon_code(payment_data.coupon_code, conv['total_amount'])
            if coupon_result.valid:
                final_amount = coupon_result.final_amount

        # Skip payment creation if amount is 0 (100% discount)
        if final_amount == 0:
            # Mark as paid immediately
            DatabaseManager.execute_query(
                "UPDATE premium_conversations SET payment_status = 'completed', payment_intent_id = ? WHERE id = ?",
                (f"free_coupon_{datetime.now().strftime('%Y%m%d_%H%M%S')}", conversation_id)
            )
            return PaymentIntentResponse(
                client_secret="free_session",
                payment_intent_id="free_session"
            )

        # Create payment intent with Stripe
        intent = stripe.PaymentIntent.create(
            amount=int(final_amount * 100),  # Convert to cents
            currency=payment_data.currency,
            payment_method=payment_data.payment_method_id,
            metadata={
                'conversation_id': conversation_id,
                'candidate_id': current_user['id'],
                'employee_id': conv['employee_id']
            },
            confirmation_method='manual',
            confirm=True,
            return_url=f"{os.getenv('FRONTEND_URL', 'http://localhost:3000')}/premium-conversations/{conversation_id}"
        )

        # Update conversation with payment intent ID
        update_query = """
            UPDATE premium_conversations 
            SET payment_intent_id = ?, stripe_payment_method_id = ?, updated_at = ?
            WHERE id = ?
        """
        DatabaseManager.execute_query(
            update_query,
            (intent.id, payment_data.payment_method_id, datetime.now(), conversation_id)
        )

        return PaymentIntentResponse(
            client_secret=intent.client_secret,
            payment_intent_id=intent.id
        )

    except stripe.error.StripeError as e:
        raise HTTPException(status_code=400, detail=f"Payment error: {str(e)}")
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to create payment intent: {str(e)}")

@router.post("/{conversation_id}/confirm-payment")
async def confirm_payment(
    conversation_id: int,
    payment_confirm: PaymentConfirm,
    current_user: dict = Depends(get_current_user)
):
    """Confirm payment and update conversation status"""
    try:
        # Get conversation and verify access
        conv_query = """
            SELECT * FROM premium_conversations WHERE id = ?
        """
        conv = DatabaseManager.execute_query(conv_query, (conversation_id,), fetch_one=True)
        if not conv:
            raise HTTPException(status_code=404, detail="Conversation not found")
        
        if current_user.get('role') != 'candidate' or conv['candidate_id'] != current_user['id']:
            raise HTTPException(status_code=403, detail="Access denied")

        # Retrieve payment intent from Stripe
        intent = stripe.PaymentIntent.retrieve(payment_confirm.payment_intent_id)
        
        if intent.status == 'succeeded':
            # Update conversation payment status
            update_query = """
                UPDATE premium_conversations 
                SET payment_status = 'completed', updated_at = ?
                WHERE id = ? AND payment_intent_id = ?
            """
            DatabaseManager.execute_query(
                update_query,
                (datetime.now(), conversation_id, payment_confirm.payment_intent_id)
            )

            # Notify employee that payment is complete and session is ready
            notification_query = """
                INSERT INTO notifications (user_id, type, title, message, data, priority)
                VALUES (?, 'payment_completed', 'Payment Received', ?, ?, 'medium')
            """
            notification_data = json.dumps({
                "conversation_id": conversation_id,
                "amount": conv['total_amount']
            })
            DatabaseManager.execute_query(
                notification_query,
                (
                    conv['employee_id'],
                    f"Payment of ${conv['total_amount']:.2f} received for your upcoming session",
                    notification_data
                )
            )

            return {"success": True, "message": "Payment confirmed successfully"}
        else:
            raise HTTPException(status_code=400, detail="Payment not successful")

    except stripe.error.StripeError as e:
        raise HTTPException(status_code=400, detail=f"Payment verification failed: {str(e)}")
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to confirm payment: {str(e)}")

# Messages endpoints
@router.get("/{conversation_id}/messages", response_model=List[PremiumMessageResponse])
async def get_conversation_messages(
    conversation_id: int,
    limit: int = Query(50, le=100),
    offset: int = Query(0, ge=0),
    current_user: dict = Depends(get_current_user)
):
    """Get messages for a conversation"""
    try:
        # Verify access to conversation
        conv_query = """
            SELECT * FROM premium_conversations WHERE id = ?
        """
        conv = DatabaseManager.execute_query(conv_query, (conversation_id,), fetch_one=True)
        if not conv:
            raise HTTPException(status_code=404, detail="Conversation not found")
        
        # Check if user has access to this conversation
        if (current_user.get("role") == "candidate" and conv["candidate_id"] != current_user["id"]) or \
           (current_user.get("role") == "employee" and conv["employee_id"] != current_user["id"]):
            raise HTTPException(status_code=403, detail="Access denied")

        query = """
            SELECT pm.*, u.name as sender_name, u.avatar_url as sender_avatar
            FROM premium_messages pm
            LEFT JOIN users u ON pm.sender_id = u.id
            WHERE pm.conversation_id = ?
            ORDER BY pm.created_at ASC
            LIMIT ? OFFSET ?
        """
        
        messages = DatabaseManager.execute_query(
            query, (conversation_id, limit, offset), fetch_all=True
        )

        result = []
        for msg in messages:
            result.append(PremiumMessageResponse(
                id=msg['id'],
                conversation_id=msg['conversation_id'],
                sender_id=msg['sender_id'],
                sender_type=msg['sender_type'],
                content=msg['content'],
                message_type=msg['message_type'],
                file_url=msg['file_url'],
                created_at=datetime.fromisoformat(msg['created_at']),
                read_at=datetime.fromisoformat(msg['read_at']) if msg['read_at'] else None
            ))

        return result

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch messages: {str(e)}")

@router.post("/{conversation_id}/messages", response_model=PremiumMessageResponse)
async def send_message(
    conversation_id: int,
    message: PremiumMessageCreate,
    current_user: dict = Depends(get_current_user)
):
    """Send a message in conversation"""
    try:
        # Verify access to conversation
        conv_query = """
            SELECT * FROM premium_conversations WHERE id = ?
        """
        conv = DatabaseManager.execute_query(conv_query, (conversation_id,), fetch_one=True)
        if not conv:
            raise HTTPException(status_code=404, detail="Conversation not found")
        
        # Check if user has access to this conversation
        if (current_user.get("role") == "candidate" and conv["candidate_id"] != current_user["id"]) or \
           (current_user.get("role") == "employee" and conv["employee_id"] != current_user["id"]):
            raise HTTPException(status_code=403, detail="Access denied")

        # Determine sender type
        sender_type = 'candidate' if current_user['id'] == conv['candidate_id'] else 'employee'

        # Insert message
        insert_query = """
            INSERT INTO premium_messages (
                conversation_id, sender_id, sender_type, content, message_type, file_url
            ) VALUES (?, ?, ?, ?, ?, ?)
        """
        
        message_id = DatabaseManager.execute_query(
            insert_query,
            (
                conversation_id, current_user['id'], sender_type,
                message.content, message.message_type, message.file_url
            ),
            fetch_one=False
        )

        # Get the created message
        query = """
            SELECT pm.*, u.name as sender_name, u.avatar_url as sender_avatar
            FROM premium_messages pm
            LEFT JOIN users u ON pm.sender_id = u.id
            WHERE pm.id = ?
        """
        
        msg = DatabaseManager.execute_query(query, (message_id,), fetch_one=True)

        return PremiumMessageResponse(
            id=msg['id'],
            conversation_id=msg['conversation_id'],
            sender_id=msg['sender_id'],
            sender_type=msg['sender_type'],
            content=msg['content'],
            message_type=msg['message_type'],
            file_url=msg['file_url'],
            created_at=datetime.fromisoformat(msg['created_at']),
            read_at=datetime.fromisoformat(msg['read_at']) if msg['read_at'] else None
        )

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to send message: {str(e)}")

# Employee settings endpoints
@router.get("/employee/settings", response_model=EmployeeSettings)
async def get_employee_settings(
    current_user: dict = Depends(get_current_user)
):
    """Get employee premium conversation settings"""
    try:
        if current_user.get('role') != 'employee':
            raise HTTPException(status_code=403, detail="Only employees can access these settings")

        query = """
            SELECT es.*, 
                   GROUP_CONCAT(
                       ea.day_of_week || '|' || ea.start_time || '|' || ea.end_time || '|' || ea.timezone,
                       ';'
                   ) as availability_data
            FROM employee_settings es
            LEFT JOIN employee_availability ea ON es.user_id = ea.user_id
            WHERE es.user_id = ?
            GROUP BY es.id
        """
        
        settings = DatabaseManager.execute_query(query, (current_user['id'],), fetch_one=True)
        
        if not settings:
            # Create default settings
            default_query = """
                INSERT INTO employee_settings (
                    user_id, is_available, hourly_rate, expertise, bio,
                    auto_accept_requests, max_daily_sessions, response_time_hours
                ) VALUES (?, 1, 50.0, '[]', '', 0, 8, 24)
            """
            DatabaseManager.execute_query(default_query, (current_user['id'],))
            
            return EmployeeSettings(
                is_available=True,
                hourly_rate=50.0,
                expertise=[],
                bio="",
                availability=[],
                auto_accept_requests=False,
                max_daily_sessions=8,
                response_time_hours=24
            )

        # Parse availability data
        availability = []
        if settings['availability_data']:
            for slot_data in settings['availability_data'].split(';'):
                if slot_data.strip():
                    parts = slot_data.split('|')
                    if len(parts) == 4:
                        from models import AvailabilitySlot
                        availability.append(AvailabilitySlot(
                            day_of_week=int(parts[0]),
                            start_time=parts[1],
                            end_time=parts[2],
                            timezone=parts[3]
                        ))

        return EmployeeSettings(
            is_available=bool(settings['is_available']),
            hourly_rate=float(settings['hourly_rate']),
            expertise=json.loads(settings['expertise'] or '[]'),
            bio=settings['bio'] or "",
            availability=availability,
            auto_accept_requests=bool(settings['auto_accept_requests']),
            max_daily_sessions=int(settings['max_daily_sessions']),
            response_time_hours=int(settings['response_time_hours'])
        )

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch employee settings: {str(e)}")

@router.patch("/employee/settings", response_model=EmployeeSettings)
async def update_employee_settings(
    settings_update: EmployeeSettingsUpdate,
    current_user: dict = Depends(get_current_user)
):
    """Update employee premium conversation settings"""
    try:
        if current_user.get('role') != 'employee':
            raise HTTPException(status_code=403, detail="Only employees can update these settings")

        # Build update query dynamically
        set_clauses = []
        params = []

        if settings_update.is_available is not None:
            set_clauses.append("is_available = ?")
            params.append(settings_update.is_available)

        if settings_update.hourly_rate is not None:
            if settings_update.hourly_rate < 10 or settings_update.hourly_rate > 500:
                raise HTTPException(status_code=400, detail="Hourly rate must be between $10 and $500")
            set_clauses.append("hourly_rate = ?")
            params.append(settings_update.hourly_rate)

        if settings_update.expertise is not None:
            set_clauses.append("expertise = ?")
            params.append(json.dumps(settings_update.expertise))

        if settings_update.bio is not None:
            set_clauses.append("bio = ?")
            params.append(settings_update.bio)

        if settings_update.auto_accept_requests is not None:
            set_clauses.append("auto_accept_requests = ?")
            params.append(settings_update.auto_accept_requests)

        if settings_update.max_daily_sessions is not None:
            if settings_update.max_daily_sessions < 1 or settings_update.max_daily_sessions > 20:
                raise HTTPException(status_code=400, detail="Max daily sessions must be between 1 and 20")
            set_clauses.append("max_daily_sessions = ?")
            params.append(settings_update.max_daily_sessions)

        if settings_update.response_time_hours is not None:
            if settings_update.response_time_hours < 1 or settings_update.response_time_hours > 168:
                raise HTTPException(status_code=400, detail="Response time must be between 1 and 168 hours")
            set_clauses.append("response_time_hours = ?")
            params.append(settings_update.response_time_hours)

        if set_clauses:
            set_clauses.append("updated_at = ?")
            params.append(datetime.now())
            params.append(current_user['id'])

            update_query = f"""
                UPDATE employee_settings 
                SET {', '.join(set_clauses)}
                WHERE user_id = ?
            """
            DatabaseManager.execute_query(update_query, tuple(params))

        # Update user profile if provided
        user_update_fields = []
        user_params = []

        if settings_update.position is not None:
            user_update_fields.append("position = ?")
            user_params.append(settings_update.position)
        if settings_update.company is not None:
            user_update_fields.append("company = ?")
            user_params.append(settings_update.company)
        if settings_update.department is not None:
            user_update_fields.append("department = ?")
            user_params.append(settings_update.department)
        if settings_update.experience_years is not None:
            user_update_fields.append("experience_years = ?")
            user_params.append(settings_update.experience_years)

        if user_update_fields:
            user_update_fields.append("updated_at = ?")
            user_params.append(datetime.now())
            user_params.append(current_user['id'])

            user_update_query = f"""
                UPDATE users 
                SET {', '.join(user_update_fields)}
                WHERE id = ?
            """
            DatabaseManager.execute_query(user_update_query, tuple(user_params))

        # Update availability if provided
        if settings_update.availability is not None:
            # Delete existing availability
            DatabaseManager.execute_query(
                "DELETE FROM employee_availability WHERE user_id = ?",
                (current_user['id'],)
            )

            # Insert new availability
            for slot in settings_update.availability:
                insert_query = """
                    INSERT INTO employee_availability (
                        user_id, day_of_week, start_time, end_time, timezone
                    ) VALUES (?, ?, ?, ?, ?)
                """
                DatabaseManager.execute_query(
                    insert_query,
                    (
                        current_user['id'], slot.day_of_week, slot.start_time,
                        slot.end_time, slot.timezone
                    )
                )

        # Return updated settings
        return await get_employee_settings(current_user)

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to update employee settings: {str(e)}")

@router.get("/employee/analytics", response_model=EmployeeAnalytics)
async def get_employee_analytics(
    current_user: dict = Depends(get_current_user)
):
    """Get employee analytics for premium conversations"""
    try:
        if current_user.get('role') != 'employee':
            raise HTTPException(status_code=403, detail="Only employees can access analytics")

        # Get basic stats
        stats_query = """
            SELECT 
                COUNT(*) as total_sessions,
                SUM(CASE WHEN status = 'completed' THEN total_amount ELSE 0 END) as total_earnings,
                AVG(CASE WHEN rating IS NOT NULL THEN rating ELSE NULL END) as average_rating,
                COUNT(CASE WHEN status = 'pending' THEN 1 ELSE NULL END) as pending_requests
            FROM premium_conversations
            WHERE employee_id = ?
        """
        stats = DatabaseManager.execute_query(stats_query, (current_user['id'],), fetch_one=True)

        # Get monthly earnings
        monthly_query = """
            SELECT 
                strftime('%Y-%m', scheduled_time) as month,
                SUM(CASE WHEN status = 'completed' THEN total_amount ELSE 0 END) as earnings,
                COUNT(CASE WHEN status = 'completed' THEN 1 ELSE NULL END) as sessions
            FROM premium_conversations
            WHERE employee_id = ? AND scheduled_time >= date('now', '-12 months')
            GROUP BY strftime('%Y-%m', scheduled_time)
            ORDER BY month
        """
        monthly_data = DatabaseManager.execute_query(monthly_query, (current_user['id'],), fetch_all=True)

        # Get rating distribution
        rating_query = """
            SELECT rating, COUNT(*) as count
            FROM premium_conversations
            WHERE employee_id = ? AND rating IS NOT NULL
            GROUP BY rating
        """
        rating_data = DatabaseManager.execute_query(rating_query, (current_user['id'],), fetch_all=True)

        # Get popular topics
        topics_query = """
            SELECT topic, COUNT(*) as count
            FROM premium_conversations
            WHERE employee_id = ? AND status = 'completed'
            GROUP BY topic
            ORDER BY count DESC
            LIMIT 10
        """
        topics_data = DatabaseManager.execute_query(topics_query, (current_user['id'],), fetch_all=True)

        return EmployeeAnalytics(
            total_earnings=float(stats['total_earnings'] or 0),
            total_sessions=int(stats['total_sessions'] or 0),
            average_rating=float(stats['average_rating'] or 0),
            pending_requests=int(stats['pending_requests'] or 0),
            monthly_earnings=[
                {"month": row['month'], "earnings": float(row['earnings']), "sessions": row['sessions']}
                for row in monthly_data
            ],
            rating_distribution={
                str(row['rating']): row['count'] for row in rating_data
            },
            popular_topics=[
                {"topic": row['topic'], "count": row['count']}
                for row in topics_data
            ]
        )

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch analytics: {str(e)}")

# Utility functions
async def send_status_notification(conversation_id: int, status: str, user: dict):
    """Send notification when conversation status changes"""
    try:
        # Get conversation details
        conv_query = """
            SELECT candidate_id, employee_id, topic, total_amount
            FROM premium_conversations
            WHERE id = ?
        """
        conv = DatabaseManager.execute_query(conv_query, (conversation_id,), fetch_one=True)
        
        if not conv:
            return

        # Determine recipient and message based on status
        notifications = []
        
        if status == 'accepted' and user.get('role') == 'employee':
            notifications.append({
                'user_id': conv['candidate_id'],
                'title': 'Conversation Request Accepted',
                'message': f'Your premium conversation request about "{conv["topic"]}" has been accepted!',
                'type': 'conversation_accepted'
            })
        elif status == 'declined' and user.get('role') == 'employee':
            notifications.append({
                'user_id': conv['candidate_id'],
                'title': 'Conversation Request Declined',
                'message': f'Your premium conversation request about "{conv["topic"]}" was declined.',
                'type': 'conversation_declined'
            })
        elif status == 'completed':
            notifications.extend([
                {
                    'user_id': conv['candidate_id'],
                    'title': 'Session Completed',
                    'message': 'Your premium conversation has been completed. Please leave a rating!',
                    'type': 'conversation_completed'
                },
                {
                    'user_id': conv['employee_id'],
                    'title': 'Session Completed',
                    'message': f'Premium conversation completed. ${conv["total_amount"]:.2f} will be processed.',
                    'type': 'conversation_completed'
                }
            ])

        # Insert notifications
        for notif in notifications:
            query = """
                INSERT INTO notifications (user_id, type, title, message, data, priority)
                VALUES (?, ?, ?, ?, ?, 'medium')
            """
            data = json.dumps({'conversation_id': conversation_id})
            DatabaseManager.execute_query(
                query,
                (notif['user_id'], notif['type'], notif['title'], notif['message'], data)
            )

    except Exception as e:
        print(f"Failed to send status notification: {e}")  # Log error but don't fail the main operation

@router.post("/{conversation_id}/start")
async def start_session(
    conversation_id: int,
    current_user: dict = Depends(get_current_user)
):
    """Start a premium conversation session (employee only)"""
    if current_user["role"] != "employee":
        raise HTTPException(status_code=403, detail="Only employees can start sessions")
    
    try:
        # Check if conversation exists and employee has access
        query = """
            SELECT * FROM premium_conversations 
            WHERE id = ? AND employee_id = ? AND status = 'accepted'
        """
        
        conversation = DatabaseManager.execute_query(query, (conversation_id, current_user["id"]), fetch_one=True)
        if not conversation:
            raise HTTPException(status_code=404, detail="Conversation not found or cannot be started")
        
        # Update status to in_progress
        update_query = """
            UPDATE premium_conversations 
            SET status = 'in_progress', updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
        """
        DatabaseManager.execute_query(update_query, (conversation_id,))
        
        # Add system message
        message_query = """
            INSERT INTO premium_messages (conversation_id, sender_id, sender_type, content)
            VALUES (?, ?, 'employee', ?)
        """
        DatabaseManager.execute_query(message_query, (conversation_id, current_user["id"], "Session started by employee"))
        
        return {"message": "Session started successfully"}
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error starting session: {str(e)}")

@router.post("/{conversation_id}/end")
async def end_session(
    conversation_id: int,
    current_user: dict = Depends(get_current_user)
):
    """End a premium conversation session"""
    try:
        # Check if conversation exists and user has access
        query = """
            SELECT * FROM premium_conversations 
            WHERE id = ? AND (employee_id = ? OR candidate_id = ?) AND status = 'in_progress'
        """
        
        conversation = DatabaseManager.execute_query(query, (conversation_id, current_user["id"], current_user["id"]), fetch_one=True)
        if not conversation:
            raise HTTPException(status_code=404, detail="Conversation not found or cannot be ended")
        
        # Update status to completed
        update_query = """
            UPDATE premium_conversations 
            SET status = 'completed', updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
        """
        DatabaseManager.execute_query(update_query, (conversation_id,))
        
        # Add system message
        message_query = """
            INSERT INTO premium_messages (conversation_id, sender_id, sender_type, content)
            VALUES (?, ?, ?, ?)
        """
        DatabaseManager.execute_query(message_query, (conversation_id, current_user["id"], current_user["role"], "Session ended"))
        
        return {"message": "Session ended successfully"}
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error ending session: {str(e)}")

@router.post("/{conversation_id}/extend")
async def extend_session(
    conversation_id: int,
    request: dict,
    current_user: dict = Depends(get_current_user)
):
    """Extend a premium conversation session"""
    try:
        additional_minutes = request.get("additional_minutes", 15)
        
        # Check if conversation exists and user has access
        query = """
            SELECT pc.*, es.hourly_rate FROM premium_conversations pc
            LEFT JOIN employee_settings es ON pc.employee_id = es.employee_id
            WHERE pc.id = ? AND (pc.employee_id = ? OR pc.candidate_id = ?) AND pc.status = 'in_progress'
        """
        
        conversation = DatabaseManager.execute_query(query, (conversation_id, current_user["id"], current_user["id"]), fetch_one=True)
        if not conversation:
            raise HTTPException(status_code=404, detail="Conversation not found or cannot be extended")
        
        # Calculate additional cost
        hourly_rate = conversation["hourly_rate"]
        additional_cost = (additional_minutes / 60) * hourly_rate
        
        # Update conversation duration and cost
        update_query = """
            UPDATE premium_conversations 
            SET duration_minutes = duration_minutes + ?, 
                total_cost = total_cost + ?,
                updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
        """
        DatabaseManager.execute_query(update_query, (additional_minutes, additional_cost, conversation_id))
        
        # Add system message
        message_query = """
            INSERT INTO premium_messages (conversation_id, sender_id, sender_type, content)
            VALUES (?, ?, ?, ?)
        """
        DatabaseManager.execute_query(message_query, (conversation_id, current_user["id"], current_user["role"], f"Session extended by {additional_minutes} minutes"))
        
        return {
            "message": "Session extended successfully",
            "additional_minutes": additional_minutes,
            "additional_cost": additional_cost
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error extending session: {str(e)}")

@router.post("/{conversation_id}/rate")
async def rate_session(
    conversation_id: int,
    request: dict,
    current_user: dict = Depends(get_current_user)
):
    """Rate a completed premium conversation session (candidate only)"""
    if current_user["role"] != "candidate":
        raise HTTPException(status_code=403, detail="Only candidates can rate sessions")
    
    try:
        rating = request.get("rating")
        comment = request.get("comment", "")
        
        if not rating or rating < 1 or rating > 5:
            raise HTTPException(status_code=400, detail="Rating must be between 1 and 5")
        
        # Check if conversation exists and candidate has access
        query = """
            SELECT * FROM premium_conversations 
            WHERE id = ? AND candidate_id = ? AND status = 'completed'
        """
        
        conversation = DatabaseManager.execute_query(query, (conversation_id, current_user["id"]), fetch_one=True)
        if not conversation:
            raise HTTPException(status_code=404, detail="Conversation not found or not completed")
        
        # Check if rating already exists
        existing_query = """
            SELECT id FROM premium_conversation_ratings 
            WHERE conversation_id = ? AND candidate_id = ?
        """
        
        existing_rating = DatabaseManager.execute_query(existing_query, (conversation_id, current_user["id"]), fetch_one=True)
        
        if existing_rating:
            # Update existing rating
            update_query = """
                UPDATE premium_conversation_ratings 
                SET rating = ?, comment = ?, updated_at = CURRENT_TIMESTAMP
                WHERE conversation_id = ? AND candidate_id = ?
            """
            DatabaseManager.execute_query(update_query, (rating, comment, conversation_id, current_user["id"]))
        else:
            # Insert new rating
            insert_query = """
                INSERT INTO premium_conversation_ratings 
                (conversation_id, employee_id, candidate_id, rating, comment)
                VALUES (?, ?, ?, ?, ?)
            """
            DatabaseManager.execute_query(insert_query, (conversation_id, conversation["employee_id"], current_user["id"], rating, comment))
        
        return {"message": "Rating submitted successfully"}
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error submitting rating: {str(e)}") 