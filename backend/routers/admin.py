from fastapi import APIRouter, HTTPException, status, Depends, Query
from datetime import datetime, timedelta
import json
from typing import List, Optional, Dict, Any

from models import SuccessResponse, UserResponse
from auth_utils import get_current_user
from database import DatabaseManager
from services.email_service import EmailService, EmailTemplate

router = APIRouter(prefix="/admin", tags=["Admin"])

def verify_admin_access(current_user = Depends(get_current_user)):
    """Verify that the current user has admin access"""
    if current_user.get("role") != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required"
        )
    return current_user

@router.get("/dashboard-stats")
async def get_dashboard_stats(admin_user = Depends(verify_admin_access)):
    """Get admin dashboard statistics"""
    
    try:
        # Get user statistics
        user_stats = DatabaseManager.execute_query("""
            SELECT 
                role,
                COUNT(*) as count,
                SUM(CASE WHEN beta_approved = 1 THEN 1 ELSE 0 END) as approved_count,
                SUM(CASE WHEN is_verified = 1 THEN 1 ELSE 0 END) as verified_count
            FROM users 
            WHERE role != 'admin'
            GROUP BY role
        """, fetch_all=True)
        
        # Get waitlist statistics
        waitlist_stats = DatabaseManager.execute_query("""
            SELECT 
                status,
                COUNT(*) as count
            FROM waitlist
            GROUP BY status
        """, fetch_all=True)
        
        # Get recent activity
        recent_registrations = DatabaseManager.execute_query("""
            SELECT COUNT(*) as count
            FROM users 
            WHERE created_at >= datetime('now', '-7 days')
            AND role != 'admin'
        """, fetch_one=True)
        
        recent_waitlist = DatabaseManager.execute_query("""
            SELECT COUNT(*) as count
            FROM waitlist 
            WHERE created_at >= datetime('now', '-7 days')
        """, fetch_one=True)
        
        return {
            "success": True,
            "stats": {
                "users": {
                    "by_role": {stat["role"]: {
                        "total": stat["count"],
                        "approved": stat["approved_count"],
                        "verified": stat["verified_count"]
                    } for stat in user_stats}
                },
                "waitlist": {
                    "by_status": {stat["status"]: stat["count"] for stat in waitlist_stats}
                },
                "recent_activity": {
                    "new_registrations_7d": recent_registrations["count"] if recent_registrations else 0,
                    "new_waitlist_7d": recent_waitlist["count"] if recent_waitlist else 0
                }
            }
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get dashboard stats: {str(e)}"
        )

@router.get("/users")
async def get_all_users(
    admin_user = Depends(verify_admin_access),
    page: int = Query(1, ge=1),
    limit: int = Query(50, ge=1, le=100),
    role: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    search: Optional[str] = Query(None)
):
    """Get paginated list of all users with filtering"""
    
    try:
        # Build WHERE conditions
        conditions = ["role != 'admin'"]
        params = []
        
        if role:
            conditions.append("role = ?")
            params.append(role)
            
        if status == "verified":
            conditions.append("is_verified = 1")
        elif status == "unverified":
            conditions.append("is_verified = 0")
        elif status == "beta_approved":
            conditions.append("beta_approved = 1")
        elif status == "beta_pending":
            conditions.append("beta_approved = 0")
            
        if search:
            conditions.append("(name LIKE ? OR email LIKE ? OR company LIKE ?)")
            search_term = f"%{search}%"
            params.extend([search_term, search_term, search_term])
        
        where_clause = " AND ".join(conditions)
        offset = (page - 1) * limit
        
        # Get total count
        count_query = f"SELECT COUNT(*) as total FROM users WHERE {where_clause}"
        total_result = DatabaseManager.execute_query(count_query, params, fetch_one=True)
        total = total_result["total"] if total_result else 0
        
        # Get users
        users_query = f"""
            SELECT 
                id, email, name, role, company, position, department,
                is_verified, beta_approved, is_active,
                created_at, approval_date, admin_notes,
                total_referrals, successful_referrals
            FROM users 
            WHERE {where_clause}
            ORDER BY created_at DESC
            LIMIT ? OFFSET ?
        """
        params.extend([limit, offset])
        
        users = DatabaseManager.execute_query(users_query, params, fetch_all=True)
        
        return {
            "success": True,
            "data": {
                "users": users,
                "pagination": {
                    "page": page,
                    "limit": limit,
                    "total": total,
                    "total_pages": (total + limit - 1) // limit
                }
            }
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get users: {str(e)}"
        )

@router.get("/waitlist")
async def get_waitlist_users(
    admin_user = Depends(verify_admin_access),
    page: int = Query(1, ge=1),
    limit: int = Query(50, ge=1, le=100),
    status: Optional[str] = Query(None),
    search: Optional[str] = Query(None)
):
    """Get paginated waitlist with filtering"""
    
    try:
        # Build WHERE conditions
        conditions = ["1=1"]
        params = []
        
        if status:
            conditions.append("status = ?")
            params.append(status)
            
        if search:
            conditions.append("(name LIKE ? OR email LIKE ? OR company LIKE ?)")
            search_term = f"%{search}%"
            params.extend([search_term, search_term, search_term])
        
        where_clause = " AND ".join(conditions)
        offset = (page - 1) * limit
        
        # Get total count
        count_query = f"SELECT COUNT(*) as total FROM waitlist WHERE {where_clause}"
        total_result = DatabaseManager.execute_query(count_query, params, fetch_one=True)
        total = total_result["total"] if total_result else 0
        
        # Get waitlist entries
        waitlist_query = f"""
            SELECT 
                w.*,
                u_reviewer.name as reviewer_name
            FROM waitlist w
            LEFT JOIN users u_reviewer ON w.reviewed_by = u_reviewer.id
            WHERE {where_clause}
            ORDER BY w.created_at DESC
            LIMIT ? OFFSET ?
        """
        params.extend([limit, offset])
        
        waitlist_entries = DatabaseManager.execute_query(waitlist_query, params, fetch_all=True)
        
        return {
            "success": True,
            "data": {
                "waitlist": waitlist_entries,
                "pagination": {
                    "page": page,
                    "limit": limit,
                    "total": total,
                    "total_pages": (total + limit - 1) // limit
                }
            }
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get waitlist: {str(e)}"
        )

@router.post("/users/{user_id}/approve-beta")
async def approve_user_beta(
    user_id: int,
    request_data: Dict[str, Any],
    admin_user = Depends(verify_admin_access)
):
    """Approve beta access for a user"""
    
    try:
        # Get user
        user = DatabaseManager.get_user_by_id(user_id)
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )
        
        new_role = request_data.get("role", user["role"])
        admin_notes = request_data.get("notes", "")
        
        # Update user
        DatabaseManager.execute_query("""
            UPDATE users 
            SET beta_approved = TRUE, 
                approval_date = CURRENT_TIMESTAMP,
                approved_by = ?,
                admin_notes = ?,
                role = ?
            WHERE id = ?
        """, (admin_user["id"], admin_notes, new_role, user_id))
        
        # Send approval email
        try:
            email_service = EmailService()
            await email_service.send_email(
                to_email=user["email"],
                subject="🎊 Your ReferralInc Beta Access is Approved!",
                template=EmailTemplate.BETA_APPROVAL,
                template_data={
                    "name": user["name"],
                    "dashboard_url": "http://localhost:3000/dashboard"
                }
            )
        except Exception as email_error:
            print(f"Failed to send approval email: {email_error}")
        
        # Log activity
        DatabaseManager.execute_query("""
            INSERT INTO user_activity_logs (user_id, activity_type, activity_data)
            VALUES (?, ?, ?)
        """, (user_id, "beta_approved", json.dumps({
            "approved_by": admin_user["id"],
            "admin_name": admin_user["name"],
            "new_role": new_role,
            "notes": admin_notes,
            "timestamp": datetime.utcnow().isoformat()
        })))
        
        return SuccessResponse(
            success=True,
            message=f"Beta access approved for {user['name']}"
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to approve beta access: {str(e)}"
        )

@router.post("/users/{user_id}/decline-beta")
async def decline_user_beta(
    user_id: int,
    request_data: Dict[str, Any],
    admin_user = Depends(verify_admin_access)
):
    """Decline beta access for a user"""
    
    try:
        # Get user
        user = DatabaseManager.get_user_by_id(user_id)
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )
        
        admin_notes = request_data.get("notes", "")
        
        # Update user
        DatabaseManager.execute_query("""
            UPDATE users 
            SET beta_approved = FALSE,
                admin_notes = ?,
                approval_date = CURRENT_TIMESTAMP,
                approved_by = ?
            WHERE id = ?
        """, (admin_notes, admin_user["id"], user_id))
        
        # Log activity
        DatabaseManager.execute_query("""
            INSERT INTO user_activity_logs (user_id, activity_type, activity_data)
            VALUES (?, ?, ?)
        """, (user_id, "beta_declined", json.dumps({
            "declined_by": admin_user["id"],
            "admin_name": admin_user["name"],
            "notes": admin_notes,
            "timestamp": datetime.utcnow().isoformat()
        })))
        
        return SuccessResponse(
            success=True,
            message=f"Beta access declined for {user['name']}"
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to decline beta access: {str(e)}"
        )

@router.post("/waitlist/{waitlist_id}/approve")
async def approve_waitlist_entry(
    waitlist_id: int,
    request_data: Dict[str, Any],
    admin_user = Depends(verify_admin_access)
):
    """Approve a waitlist entry and create user account"""
    
    try:
        # Get waitlist entry
        waitlist_entry = DatabaseManager.execute_query(
            "SELECT * FROM waitlist WHERE id = ?",
            (waitlist_id,),
            fetch_one=True
        )
        
        if not waitlist_entry:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Waitlist entry not found"
            )
        
        role = request_data.get("role", "candidate")
        admin_notes = request_data.get("notes", "")
        
        # Check if user already exists
        existing_user = DatabaseManager.get_user_by_email(waitlist_entry["email"])
        if existing_user:
            # Just approve beta access
            DatabaseManager.execute_query("""
                UPDATE users 
                SET beta_approved = TRUE,
                    approval_date = CURRENT_TIMESTAMP,
                    approved_by = ?,
                    admin_notes = ?,
                    role = ?
                WHERE id = ?
            """, (admin_user["id"], admin_notes, role, existing_user["id"]))
            
            user_id = existing_user["id"]
            user_name = existing_user["name"]
            user_email = existing_user["email"]
        else:
            # Create new user account with temporary password
            import secrets
            temp_password = secrets.token_urlsafe(12)
            from auth_utils import AuthUtils
            password_hash = AuthUtils.get_password_hash(temp_password)
            
            user_id = DatabaseManager.create_user(
                email=waitlist_entry["email"],
                password_hash=password_hash,
                name=waitlist_entry["name"],
                role=role,
                company=waitlist_entry["company"],
                position=waitlist_entry["position"]
            )
            
            # Approve beta immediately
            DatabaseManager.execute_query("""
                UPDATE users 
                SET beta_approved = TRUE,
                    approval_date = CURRENT_TIMESTAMP,
                    approved_by = ?,
                    admin_notes = ?
                WHERE id = ?
            """, (admin_user["id"], admin_notes, user_id))
            
            user_name = waitlist_entry["name"]
            user_email = waitlist_entry["email"]
        
        # Update waitlist status
        DatabaseManager.execute_query("""
            UPDATE waitlist 
            SET status = 'approved',
                reviewed_by = ?,
                reviewed_at = CURRENT_TIMESTAMP,
                admin_notes = ?
            WHERE id = ?
        """, (admin_user["id"], admin_notes, waitlist_id))
        
        # Send approval email
        try:
            email_service = EmailService()
            await email_service.send_email(
                to_email=user_email,
                subject="🎊 Welcome to ReferralInc - You're In!",
                template=EmailTemplate.BETA_APPROVAL,
                template_data={
                    "name": user_name,
                    "dashboard_url": "http://localhost:3000/dashboard"
                }
            )
        except Exception as email_error:
            print(f"Failed to send approval email: {email_error}")
        
        return SuccessResponse(
            success=True,
            message=f"Waitlist entry approved for {user_name}"
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to approve waitlist entry: {str(e)}"
        )

@router.post("/waitlist/{waitlist_id}/decline")
async def decline_waitlist_entry(
    waitlist_id: int,
    request_data: Dict[str, Any],
    admin_user = Depends(verify_admin_access)
):
    """Decline a waitlist entry"""
    
    try:
        admin_notes = request_data.get("notes", "")
        
        # Update waitlist status
        DatabaseManager.execute_query("""
            UPDATE waitlist 
            SET status = 'declined',
                reviewed_by = ?,
                reviewed_at = CURRENT_TIMESTAMP,
                admin_notes = ?
            WHERE id = ?
        """, (admin_user["id"], admin_notes, waitlist_id))
        
        return SuccessResponse(
            success=True,
            message="Waitlist entry declined"
        )
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to decline waitlist entry: {str(e)}"
        )

@router.get("/activity-logs")
async def get_activity_logs(
    admin_user = Depends(verify_admin_access),
    page: int = Query(1, ge=1),
    limit: int = Query(50, ge=1, le=100),
    user_id: Optional[int] = Query(None),
    activity_type: Optional[str] = Query(None)
):
    """Get admin activity logs"""
    
    try:
        conditions = ["1=1"]
        params = []
        
        if user_id:
            conditions.append("l.user_id = ?")
            params.append(user_id)
            
        if activity_type:
            conditions.append("l.activity_type = ?")
            params.append(activity_type)
        
        where_clause = " AND ".join(conditions)
        offset = (page - 1) * limit
        
        # Get logs
        logs_query = f"""
            SELECT 
                l.*,
                u.name as user_name,
                u.email as user_email
            FROM user_activity_logs l
            LEFT JOIN users u ON l.user_id = u.id
            WHERE {where_clause}
            ORDER BY l.created_at DESC
            LIMIT ? OFFSET ?
        """
        params.extend([limit, offset])
        
        logs = DatabaseManager.execute_query(logs_query, params, fetch_all=True)
        
        # Get total count
        count_query = f"SELECT COUNT(*) as total FROM user_activity_logs l WHERE {where_clause[:-12]}"  # Remove limit params
        total_result = DatabaseManager.execute_query(count_query, params[:-2], fetch_one=True)
        total = total_result["total"] if total_result else 0
        
        return {
            "success": True,
            "data": {
                "logs": logs,
                "pagination": {
                    "page": page,
                    "limit": limit,
                    "total": total,
                    "total_pages": (total + limit - 1) // limit
                }
            }
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get activity logs: {str(e)}"
        ) 