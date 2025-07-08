from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Request, Query
from fastapi.responses import FileResponse
from typing import List, Optional
from datetime import datetime
import json
import os
import uuid
from urllib.parse import unquote
from database import DatabaseManager
from auth_utils import get_current_user, rate_limiter
from routers.notifications import NotificationService, NotificationType
from ai_agents.job_matcher import JobMatcherAgent
from services.document_processor import DocumentProcessor
from models import (
    ReferralCreate, ReferralUpdate, ReferralResponse, ReferralStatus, 
    ReferralSearchFilter, UserResponse, FileUploadResponse, SuccessResponse,
    RejectionFeedbackAnalysisRequest
)
import groq
import asyncio

router = APIRouter()

# File upload configuration
UPLOAD_DIR = "uploads/resumes"
MAX_FILE_SIZE = 5 * 1024 * 1024  # 5MB
ALLOWED_EXTENSIONS = {".pdf", ".doc", ".docx"}

# Ensure upload directory exists
os.makedirs(UPLOAD_DIR, exist_ok=True)

def format_referral_response(referral_data: dict) -> dict:
    """Format referral data for API response"""
    
    # Get candidate info
    candidate = None
    if referral_data.get("candidate_id"):
        candidate_data = DatabaseManager.get_user_by_id(referral_data["candidate_id"])
        if candidate_data:
            # Parse skills if it's a JSON string
            skills = candidate_data.get("skills", [])
            if isinstance(skills, str):
                try:
                    skills = json.loads(skills)
                except (json.JSONDecodeError, TypeError):
                    skills = []
            
            candidate = {
                "id": candidate_data["id"],
                "name": candidate_data["name"],
                "email": candidate_data["email"],
                "role": candidate_data["role"],
                "avatar_url": candidate_data.get("avatar_url"),
                "department": candidate_data.get("department"),
                "position": candidate_data.get("position"),
                "company": candidate_data.get("company"),
                "bio": candidate_data.get("bio"),
                "skills": skills,
                "experience_years": candidate_data.get("experience_years"),
                "rating": candidate_data.get("rating", 0.0),
                "is_verified": candidate_data.get("is_verified", False),
                "created_at": candidate_data["created_at"],
                "updated_at": candidate_data["updated_at"]
            }
    
    # Get employee info
    employee = None
    if referral_data.get("employee_id"):
        employee_data = DatabaseManager.get_user_by_id(referral_data["employee_id"])
        if employee_data:
            # Parse skills if it's a JSON string
            skills = employee_data.get("skills", [])
            if isinstance(skills, str):
                try:
                    skills = json.loads(skills)
                except (json.JSONDecodeError, TypeError):
                    skills = []
            
            employee = {
                "id": employee_data["id"],
                "name": employee_data["name"],
                "email": employee_data["email"],
                "role": employee_data["role"],
                "avatar_url": employee_data.get("avatar_url"),
                "department": employee_data.get("department"),
                "position": employee_data.get("position"),
                "company": employee_data.get("company"),
                "bio": employee_data.get("bio"),
                "skills": skills,
                "experience_years": employee_data.get("experience_years"),
                "rating": employee_data.get("rating", 0.0),
                "is_verified": employee_data.get("is_verified", False),
                "created_at": employee_data["created_at"],
                "updated_at": employee_data["updated_at"]
            }
    
    # Parse feedback comments if exists
    feedback_comments = []
    if referral_data.get("feedback_comments"):
        try:
            feedback_comments = json.loads(referral_data["feedback_comments"])
        except (json.JSONDecodeError, TypeError):
            if isinstance(referral_data["feedback_comments"], str):
                feedback_comments = [referral_data["feedback_comments"]]
    
    # Convert old resume URLs to new format for backward compatibility
    resume_url = referral_data.get("resume_url")
    if resume_url:
        if resume_url.startswith("/uploads/resumes/"):
            # Extract filename from old URL and convert to new format
            filename = resume_url.split("/")[-1]
            resume_url = f"/referrals/files/{filename}"
        elif resume_url.startswith("/api/referrals/files/"):
            # Handle the intermediate incorrect format
            filename = resume_url.split("/")[-1]
            resume_url = f"/referrals/files/{filename}"

    # Parse rejection feedback analysis if exists
    rejection_feedback_analysis = None
    if referral_data.get("rejection_feedback_analysis"):
        try:
            rejection_feedback_analysis = json.loads(referral_data["rejection_feedback_analysis"])
        except (json.JSONDecodeError, TypeError):
            rejection_feedback_analysis = None

    return {
        "id": referral_data["id"],
        "candidate_id": referral_data["candidate_id"],
        "employee_id": referral_data["employee_id"],
        "position": referral_data["position"],
        "department": referral_data.get("department"),
        "company": referral_data["company"],
        "status": referral_data["status"],
        "notes": referral_data.get("notes"),
        "resume_url": resume_url,
        "job_description": referral_data.get("job_description"),
        "ai_analysis_score": referral_data.get("ai_analysis_score"),
        "ai_analysis_summary": referral_data.get("ai_analysis_summary"),
        "ai_analysis_details": json.loads(referral_data.get("ai_analysis_details")) if referral_data.get("ai_analysis_details") else None,
        "feedback_score": referral_data.get("feedback_score"),
        "feedback_comments": feedback_comments,
        "rejection_feedback": referral_data.get("rejection_feedback"),
        "rejection_feedback_analysis": rejection_feedback_analysis,
        "created_at": referral_data["created_at"],
        "updated_at": referral_data["updated_at"],
        "candidate": candidate,
        "employee": employee
    }

@router.post("/", response_model=ReferralResponse)
async def create_referral(
    request: Request,
    referral_data: ReferralCreate,
    current_user = Depends(get_current_user)
):
    """Create a new referral request"""
    
    # Log the incoming data for debugging
    print(f"Creating referral with data: {referral_data}")
    print(f"Current user: {current_user}")
    
    # Rate limiting check  
    if rate_limiter.is_rate_limited(f"create_referral_{current_user['id']}", max_attempts=10, window_minutes=1):
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Too many referral creation attempts. Please try again later."
        )
    
    # Only candidates can create referral requests
    if current_user["role"] != "candidate":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only candidates can create referral requests"
        )
    
    # Verify the employee exists and is active
    employee = DatabaseManager.get_user_by_id(referral_data.employee_id)
    if not employee or employee["role"] != "employee" or not employee["is_active"]:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Employee not found or inactive"
        )
    
    try:
        # Initialize AI analysis variables
        ai_analysis_score = None
        ai_analysis_summary = None
        ai_analysis_details = None
        
        # Perform job matching if both resume and job description are provided
        if referral_data.resume_url and referral_data.job_description:
            try:
                # Read resume content from file
                resume_content = None
                if referral_data.resume_url:
                    # Extract filename from URL and read the file
                    filename = referral_data.resume_url.split("/")[-1]
                    file_path = os.path.join(UPLOAD_DIR, filename)
                    
                    if os.path.exists(file_path):
                        # Initialize DocumentProcessor with GROQ client for potential vision processing
                        groq_api_key = os.getenv("GROQ_API_KEY")
                        groq_client = groq.Groq(api_key=groq_api_key) if groq_api_key else None
                        doc_processor = DocumentProcessor(groq_client)
                        
                        # Extract text from resume file
                        result = await doc_processor.process_document(file_path, use_vision=False)
                        if result['success'] and result['text']:
                            resume_content = result['text'].strip()
                            print(f"Successfully extracted {len(resume_content)} characters from resume using {result['metadata']['processing_method']}")
                        else:
                            print(f"Failed to extract text from resume file: {file_path}, error: {result.get('error', 'Unknown error')}")
                    else:
                        print(f"Resume file not found: {file_path}")
                
                if resume_content:
                    # Initialize job matcher
                    groq_api_key = os.getenv("GROQ_API_KEY")
                    if groq_api_key:
                        groq_client = groq.Groq(api_key=groq_api_key)
                        job_matcher = JobMatcherAgent(groq_client)
                        
                        # Perform job matching
                        match_input = {
                            "resume_text": resume_content,
                            "job_description": referral_data.job_description
                        }
                        
                        match_result = await job_matcher.process(match_input)
                        
                        if match_result.success:
                            ai_analysis_score = match_result.data.get("overall_match_score", 0) / 100.0  # Convert to 0-1 scale
                            ai_analysis_summary = f"AI analysis shows {match_result.data.get('overall_match_score', 0)}% match for {referral_data.position} role."
                            ai_analysis_details = json.dumps(match_result.data)
                        
            except Exception as e:
                print(f"Job matching failed: {str(e)}")
                # Continue with referral creation even if AI analysis fails
        
        # Insert the referral
        query = """
            INSERT INTO referrals (
                candidate_id, employee_id, position, department, company, 
                notes, resume_url, job_description, ai_analysis_score, 
                ai_analysis_summary, ai_analysis_details, status, created_at, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """
        
        now = datetime.utcnow().isoformat()
        
        result = DatabaseManager.execute_query(
            query,
            (
                current_user["id"],
                referral_data.employee_id,
                referral_data.position,
                referral_data.department,
                referral_data.company,
                referral_data.notes,
                referral_data.resume_url,
                referral_data.job_description,
                ai_analysis_score,
                ai_analysis_summary,
                ai_analysis_details,
                ReferralStatus.PENDING.value,
                now,
                now
            )
        )
        
        if not result:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to create referral"
            )
        
        # Get the created referral
        referral = DatabaseManager.execute_query(
            "SELECT * FROM referrals WHERE id = ?",
            (result,),
            fetch_one=True
        )
        
        if not referral:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to retrieve created referral"
            )
        
        # Create notification for the employee using NotificationService
        await NotificationService.create_referral_notification(
            referral_data={
                "id": result,
                "candidate_id": current_user["id"],
                "employee_id": referral_data.employee_id,
                "position": referral_data.position,
                "company": referral_data.company,
                "status": ReferralStatus.PENDING.value
            },
            notification_type=NotificationType.REFERRAL_RECEIVED,
            recipient_user_id=referral_data.employee_id
        )
        
        return format_referral_response(referral)
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create referral: {str(e)}"
        )

# Specific routes must come before parameterized routes
@router.get("/companies", response_model=List[str])
async def get_companies(
    current_user = Depends(get_current_user)
):
    """Get list of companies that have employees for referrals"""
    
    try:
        companies = DatabaseManager.execute_query(
            """
            SELECT DISTINCT company 
            FROM users 
            WHERE role = 'employee' AND company IS NOT NULL AND company != '' AND is_active = TRUE
            ORDER BY company ASC
            """,
            fetch_all=True
        )
        
        return [company["company"] for company in companies]
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get companies: {str(e)}"
        )

@router.get("/employees", response_model=List[dict])
async def get_employees_for_referrals(
    company: Optional[str] = Query(None),
    department: Optional[str] = Query(None),
    limit: int = Query(20, le=50),
    current_user = Depends(get_current_user)
):
    """Get employees available for referrals"""
    
    try:
        where_conditions = ["role = 'employee'", "is_active = TRUE"]
        params = []
        
        if company:
            where_conditions.append("company = ?")
            params.append(company)
        
        if department:
            where_conditions.append("department = ?")
            params.append(department)
        
        where_clause = " AND ".join(where_conditions)
        
        query = f"""
            SELECT id, name, position, department, company, rating, avatar_url
            FROM users 
            WHERE {where_clause}
            ORDER BY rating DESC, name ASC
            LIMIT ?
        """
        params.append(limit)
        
        employees = DatabaseManager.execute_query(query, tuple(params), fetch_all=True)
        
        return [
            {
                "id": emp["id"],
                "name": emp["name"],
                "position": emp["position"] or "Employee",
                "department": emp["department"] or "Unknown",
                "company": emp["company"] or "Unknown",
                "rating": emp["rating"] or 0.0,
                "avatar_url": emp.get("avatar_url")
            }
            for emp in employees
        ]
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get employees: {str(e)}"
        )

@router.post("/upload-resume", response_model=FileUploadResponse)
async def upload_resume(
    request: Request,
    file: UploadFile = File(...),
    current_user = Depends(get_current_user)
):
    """Upload a resume file"""
    
    # Only candidates can upload resumes
    if current_user["role"] != "candidate":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only candidates can upload resumes"
        )
    
    # Validate file type
    file_ext = os.path.splitext(file.filename or "")[1].lower()
    if file_ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"File type {file_ext} not allowed. Allowed types: {', '.join(ALLOWED_EXTENSIONS)}"
        )
    
    # Read file content to check size
    content = await file.read()
    if len(content) > MAX_FILE_SIZE:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"File size exceeds maximum limit of {MAX_FILE_SIZE // (1024*1024)}MB"
        )
    
    try:
        # Generate unique filename
        file_id = str(uuid.uuid4())
        filename = f"{file_id}_{file.filename}"
        file_path = os.path.join(UPLOAD_DIR, filename)
        
        # Save file
        with open(file_path, "wb") as f:
            f.write(content)
        
        # Generate file URL pointing to our backend file serving endpoint
        file_url = f"/referrals/files/{filename}"
        
        return FileUploadResponse(
            filename=filename,
            file_url=file_url,
            file_size=len(content),
            content_type=file.content_type or "application/octet-stream"
        )
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to upload file: {str(e)}"
        )

@router.get("/files/{filename}")
async def serve_file(
    filename: str,
    request: Request,
    download: bool = Query(False, description="Force download instead of inline viewing")
):
    """Serve uploaded resume files"""
    
    # For file downloads, we'll allow access without strict authentication
    # since these are temporary download links
    # In production, you might want to add token-based or time-limited access
    
    # URL decode the filename to handle spaces and special characters
    decoded_filename = unquote(filename)
    
    # Construct file path
    file_path = os.path.join(UPLOAD_DIR, decoded_filename)
    
    # Check if file exists
    if not os.path.exists(file_path):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"File not found: {decoded_filename}"
        )
    
    # Additional security: Check if the user has access to this file
    # You could add more specific checks here based on referral ownership
    
    # Determine media type based on file extension
    file_ext = os.path.splitext(decoded_filename)[1].lower()
    if file_ext == '.pdf':
        media_type = 'application/pdf'
    elif file_ext in ['.doc', '.docx']:
        media_type = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' if file_ext == '.docx' else 'application/msword'
    else:
        media_type = 'application/octet-stream'
    
    # Create response without filename to avoid forcing download
    if download:
        # If download is explicitly requested, set filename for download
        response = FileResponse(
            path=file_path,
            filename=decoded_filename,
            media_type=media_type
        )
    else:
        # For inline viewing, don't set filename
        response = FileResponse(
            path=file_path,
            media_type=media_type
        )
        # Set Content-Disposition to inline for browser viewing
        response.headers["Content-Disposition"] = "inline"
    
    # Add CORS headers for iframe embedding
    response.headers["Access-Control-Allow-Origin"] = "*"
    response.headers["Access-Control-Allow-Methods"] = "GET"
    response.headers["Access-Control-Allow-Headers"] = "*"
    
    # Remove X-Frame-Options to allow iframe embedding
    response.headers["X-Frame-Options"] = "ALLOWALL"
    
    return response

@router.get("/candidate/{candidate_id}", response_model=dict)
async def get_candidate_referrals(
    candidate_id: int,
    status_filter: Optional[str] = Query(None, alias="status"),
    limit: int = Query(20, le=100),
    offset: int = Query(0, ge=0),
    current_user = Depends(get_current_user)
):
    """Get referrals for a specific candidate"""
    
    # Only the candidate themselves or admin can access this
    if current_user["id"] != candidate_id and current_user["role"] != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only access your own referrals"
        )
    
    # Use the main get_referrals logic but force the candidate filter
    try:
        where_conditions = ["candidate_id = ?"]
        params = [candidate_id]
        
        if status_filter:
            where_conditions.append("status = ?")
            params.append(status_filter)
        
        where_clause = " AND ".join(where_conditions)
        
        # Get total count
        count_query = f"SELECT COUNT(*) as total FROM referrals WHERE {where_clause}"
        total_result = DatabaseManager.execute_query(count_query, tuple(params), fetch_one=True)
        total = total_result["total"] if total_result else 0
        
        # Get referrals
        query = f"""
            SELECT * FROM referrals 
            WHERE {where_clause}
            ORDER BY created_at DESC
            LIMIT ? OFFSET ?
        """
        params.extend([limit, offset])
        
        referrals = DatabaseManager.execute_query(query, tuple(params), fetch_all=True)
        
        # Format response
        formatted_referrals = [format_referral_response(ref) for ref in referrals]
        
        return {
            "referrals": formatted_referrals,
            "total": total,
            "limit": limit,
            "offset": offset
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get candidate referrals: {str(e)}"
        )

@router.get("/employee/{employee_id}", response_model=dict)
async def get_employee_referrals(
    employee_id: int,
    status_filter: Optional[str] = Query(None, alias="status"),
    limit: int = Query(20, le=100),
    offset: int = Query(0, ge=0),
    current_user = Depends(get_current_user)
):
    """Get referrals for a specific employee"""
    
    # Only the employee themselves or admin can access this
    if current_user["id"] != employee_id and current_user["role"] != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only access your own referrals"
        )
    
    # Use the main get_referrals logic but force the employee filter
    try:
        where_conditions = ["employee_id = ?"]
        params = [employee_id]
        
        if status_filter:
            where_conditions.append("status = ?")
            params.append(status_filter)
        
        where_clause = " AND ".join(where_conditions)
        
        # Get total count
        count_query = f"SELECT COUNT(*) as total FROM referrals WHERE {where_clause}"
        total_result = DatabaseManager.execute_query(count_query, tuple(params), fetch_one=True)
        total = total_result["total"] if total_result else 0
        
        # Get referrals
        query = f"""
            SELECT * FROM referrals 
            WHERE {where_clause}
            ORDER BY created_at DESC
            LIMIT ? OFFSET ?
        """
        params.extend([limit, offset])
        
        referrals = DatabaseManager.execute_query(query, tuple(params), fetch_all=True)
        
        # Format response
        formatted_referrals = [format_referral_response(ref) for ref in referrals]
        
        return {
            "referrals": formatted_referrals,
            "total": total,
            "limit": limit,
            "offset": offset
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get employee referrals: {str(e)}"
        )

@router.get("/", response_model=dict)
async def get_referrals(
    status_filter: Optional[str] = Query(None, alias="status"),
    company: Optional[str] = Query(None),
    department: Optional[str] = Query(None),
    date_from: Optional[str] = Query(None),
    date_to: Optional[str] = Query(None),
    limit: int = Query(20, le=100),
    offset: int = Query(0, ge=0),
    current_user = Depends(get_current_user)
):
    """Get referrals based on user role and filters"""
    
    try:
        # Build query based on user role
        if current_user["role"] == "candidate":
            # Candidates see their own referral requests
            where_conditions = ["candidate_id = ?"]
            params = [current_user["id"]]
        elif current_user["role"] == "employee":
            # Employees see referrals sent to them
            where_conditions = ["employee_id = ?"]
            params = [current_user["id"]]
        else:
            # Admins see all referrals
            where_conditions = []
            params = []
        
        # Apply filters
        if status_filter:
            where_conditions.append("status = ?")
            params.append(status_filter)
        
        if company:
            where_conditions.append("company LIKE ?")
            params.append(f"%{company}%")
        
        if department:
            where_conditions.append("department LIKE ?")
            params.append(f"%{department}%")
        
        if date_from:
            where_conditions.append("created_at >= ?")
            params.append(date_from)
        
        if date_to:
            where_conditions.append("created_at <= ?")
            params.append(date_to)
        
        # Build the query
        where_clause = " AND ".join(where_conditions) if where_conditions else "1=1"
        
        # Get total count
        count_query = f"SELECT COUNT(*) as total FROM referrals WHERE {where_clause}"
        total_result = DatabaseManager.execute_query(count_query, tuple(params), fetch_one=True)
        total = total_result["total"] if total_result else 0
        
        # Get referrals
        query = f"""
            SELECT * FROM referrals 
            WHERE {where_clause}
            ORDER BY created_at DESC
            LIMIT ? OFFSET ?
        """
        params.extend([limit, offset])
        
        referrals = DatabaseManager.execute_query(query, tuple(params), fetch_all=True)
        
        # Format response
        formatted_referrals = [format_referral_response(ref) for ref in referrals]
        
        return {
            "referrals": formatted_referrals,
            "total": total,
            "limit": limit,
            "offset": offset
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get referrals: {str(e)}"
        )

@router.get("/{referral_id}", response_model=ReferralResponse)
async def get_referral(
    referral_id: int,
    current_user = Depends(get_current_user)
):
    """Get a specific referral by ID"""
    
    referral = DatabaseManager.execute_query(
        "SELECT * FROM referrals WHERE id = ?",
        (referral_id,),
        fetch_one=True
    )
    
    if not referral:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Referral not found"
        )
    
    # Check permissions
    if (current_user["role"] == "candidate" and referral["candidate_id"] != current_user["id"]) or \
       (current_user["role"] == "employee" and referral["employee_id"] != current_user["id"]):
        if current_user["role"] != "admin":
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You don't have permission to view this referral"
            )
    
    return format_referral_response(referral)

@router.put("/{referral_id}", response_model=ReferralResponse)
async def update_referral(
    request: Request,
    referral_id: int,
    update_data: ReferralUpdate,
    current_user = Depends(get_current_user)
):
    """Update a referral"""
    
    # Get the referral
    referral = DatabaseManager.execute_query(
        "SELECT * FROM referrals WHERE id = ?",
        (referral_id,),
        fetch_one=True
    )
    
    if not referral:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Referral not found"
        )
    
    # Check permissions
    can_update = False
    if current_user["role"] == "admin":
        can_update = True
    elif current_user["role"] == "employee" and referral["employee_id"] == current_user["id"]:
        can_update = True
    elif current_user["role"] == "candidate" and referral["candidate_id"] == current_user["id"]:
        # Candidates can only update notes, not status
        if update_data.status is not None:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Candidates cannot update referral status"
            )
        can_update = True
    
    if not can_update:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You don't have permission to update this referral"
        )
    
    try:
        # Build update query
        update_fields = []
        params = []
        
        if update_data.status is not None:
            update_fields.append("status = ?")
            params.append(update_data.status)
        
        if update_data.notes is not None:
            update_fields.append("notes = ?")
            params.append(update_data.notes)
        
        if update_data.feedback_score is not None:
            update_fields.append("feedback_score = ?")
            params.append(update_data.feedback_score)
        
        if update_data.feedback_comments is not None:
            update_fields.append("feedback_comments = ?")
            params.append(json.dumps(update_data.feedback_comments))
        
        if update_data.rejection_feedback is not None:
            update_fields.append("rejection_feedback = ?")
            params.append(update_data.rejection_feedback)
        
        if not update_fields:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="No fields to update"
            )
        
        # Add updated_at
        update_fields.append("updated_at = ?")
        params.append(datetime.utcnow().isoformat())
        
        # Add WHERE clause
        params.append(referral_id)
        
        query = f"UPDATE referrals SET {', '.join(update_fields)} WHERE id = ?"
        
        DatabaseManager.execute_query(query, tuple(params))
        
        # Get updated referral
        updated_referral = DatabaseManager.execute_query(
            "SELECT * FROM referrals WHERE id = ?",
            (referral_id,),
            fetch_one=True
        )
        
        # Process rejection feedback with AI analysis
        if update_data.status == "rejected" and update_data.rejection_feedback:
            try:
                
                # Get candidate background for context
                candidate = DatabaseManager.execute_query(
                    "SELECT name, bio, skills, experience_years FROM users WHERE id = ?",
                    (referral["candidate_id"],),
                    fetch_one=True
                )
                
                candidate_background = ""
                if candidate:
                    skills_list = json.loads(candidate.get("skills", "[]")) if candidate.get("skills") else []
                    candidate_background = f"Name: {candidate.get('name', 'Unknown')}, " \
                                         f"Bio: {candidate.get('bio', 'Not provided')}, " \
                                         f"Skills: {', '.join(skills_list)}, " \
                                         f"Experience: {candidate.get('experience_years', 'Not specified')} years"
                
                # Prepare AI analysis request
                analysis_request = RejectionFeedbackAnalysisRequest(
                    feedback_text=update_data.rejection_feedback,
                    position=referral["position"],
                    company=referral["company"],
                    candidate_background=candidate_background
                )
                
                # Call the actual AI analysis endpoint
                try:
                    # Import the AI analysis function directly
                    from .ai_analysis import analyze_rejection_feedback
                    
                    # Create a proper analysis request
                    analysis_request = RejectionFeedbackAnalysisRequest(
                        feedback_text=update_data.rejection_feedback,
                        position=referral["position"],
                        company=referral["company"],
                        candidate_background=candidate_background
                    )
                    
                    # Call the AI analysis function
                    analysis_result = await analyze_rejection_feedback(
                        request=analysis_request,
                        current_user=current_user
                    )
                    
                    # Convert to dict for storage
                    ai_analysis = analysis_result.dict()
                    
                    # Store the AI analysis
                    DatabaseManager.execute_query(
                        "UPDATE referrals SET rejection_feedback_analysis = ? WHERE id = ?",
                        (json.dumps(ai_analysis), referral_id)
                    )
                    
                except Exception as ai_error:
                    print(f"AI analysis failed: {ai_error}")
                    # Continue without AI analysis if it fails
                    
            except Exception as e:
                print(f"Error processing rejection feedback: {e}")
                # Continue without failing the referral update

        # Send notification for status changes using NotificationService
        if update_data.status and update_data.status != referral["status"]:
            old_status = referral["status"]
            new_status = update_data.status
            
            # Create different notifications based on status change
            if new_status in ["reviewing", "interview_scheduled", "interview_completed", "offer_extended", "hired"]:
                # Send acceptance/positive update notification to candidate
                if new_status == "reviewing":
                    notification_type = NotificationType.REFERRAL_ACCEPTED
                else:
                    notification_type = NotificationType.REFERRAL_STATUS_UPDATE
                    
                await NotificationService.create_referral_notification(
                    referral_data={
                        "id": referral_id,
                        "candidate_id": referral["candidate_id"],
                        "employee_id": referral["employee_id"],
                        "position": referral["position"],
                        "company": referral["company"],
                        "status": new_status
                    },
                    notification_type=notification_type,
                    recipient_user_id=referral["candidate_id"]
                )
            elif new_status == "rejected":
                # Send rejection notification to candidate with feedback available info
                message_detail = "Your referral has been rejected."
                if update_data.rejection_feedback:
                    message_detail += " Feedback is available for review."
                
                await NotificationService.create_referral_notification(
                    referral_data={
                        "id": referral_id,
                        "candidate_id": referral["candidate_id"],
                        "employee_id": referral["employee_id"],
                        "position": referral["position"],
                        "company": referral["company"],
                        "status": new_status
                    },
                    notification_type=NotificationType.REFERRAL_REJECTED,
                    recipient_user_id=referral["candidate_id"]
                )
        
        return format_referral_response(updated_referral)
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to update referral: {str(e)}"
        )

@router.delete("/{referral_id}", response_model=SuccessResponse)
async def delete_referral(
    request: Request,
    referral_id: int,
    current_user = Depends(get_current_user)
):
    """Delete a referral"""
    
    # Get the referral
    referral = DatabaseManager.execute_query(
        "SELECT * FROM referrals WHERE id = ?",
        (referral_id,),
        fetch_one=True
    )
    
    if not referral:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Referral not found"
        )
    
    # Check permissions (only candidate who created it or admin can delete)
    if referral["candidate_id"] != current_user["id"] and current_user["role"] != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You don't have permission to delete this referral"
        )
    
    # Don't allow deletion if referral is in progress
    if referral["status"] not in ["pending", "rejected"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot delete referral that is in progress"
        )
    
    try:
        DatabaseManager.execute_query(
            "DELETE FROM referrals WHERE id = ?",
            (referral_id,)
        )
        
        return SuccessResponse(
            success=True,
            message="Referral deleted successfully"
        )
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to delete referral: {str(e)}"
        )