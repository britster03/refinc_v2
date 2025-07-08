from fastapi import APIRouter, HTTPException, status, Depends, Request
from typing import List, Optional
import json
from slowapi import Limiter
from slowapi.util import get_remote_address

from models import UserResponse, UserUpdate, PasswordUpdate, UserSearchFilter, SuccessResponse, EmployeeSearchResponse, DetailedEmployeeProfile, EmployeeProfileUpdate, CandidateSearchResponse, DetailedCandidateProfile, CandidateProfileUpdate
from auth_utils import get_current_user, format_user_response, AuthUtils
from database import DatabaseManager
from routers.notifications import NotificationService, NotificationType

# Rate limiter
limiter = Limiter(key_func=get_remote_address)

router = APIRouter()

@router.get("/profile", response_model=UserResponse)
async def get_user_profile(current_user = Depends(get_current_user)):
    """Get current user's profile"""
    return format_user_response(current_user)

@router.put("/profile", response_model=UserResponse)
async def update_user_profile(profile_data: UserUpdate, current_user = Depends(get_current_user)):
    """Update current user's profile"""
    
    # Prepare update data
    update_data = {}
    for field, value in profile_data.dict(exclude_unset=True).items():
        if value is not None:
            if field == "skills":
                update_data[field] = json.dumps(value)
            else:
                update_data[field] = value
    
    if not update_data:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No valid fields provided for update"
        )
    
    # Update user in database
    success = DatabaseManager.update_user(current_user["id"], **update_data)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to update profile"
        )
    
    # Get updated user data
    updated_user = DatabaseManager.get_user_by_id(current_user["id"])
    if not updated_user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    # Create profile update notification
    try:
        await NotificationService.create_notification(
            user_id=current_user["id"],
            notification_type=NotificationType.PROFILE_UPDATED
        )
    except Exception as e:
        # Don't fail the whole request if notification fails
        print(f"Failed to create profile update notification: {str(e)}")
    
    return format_user_response(updated_user)

@router.post("/change-password", response_model=SuccessResponse)
async def change_password(password_data: PasswordUpdate, current_user = Depends(get_current_user)):
    """Change user password"""
    
    # Verify current password
    if not AuthUtils.verify_password(password_data.current_password, current_user["password_hash"]):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Current password is incorrect"
        )
    
    # Hash new password
    new_password_hash = AuthUtils.get_password_hash(password_data.new_password)
    
    # Update password in database
    success = DatabaseManager.update_user(current_user["id"], password_hash=new_password_hash)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to update password"
        )
    
    return SuccessResponse(
        success=True,
        message="Password updated successfully"
    )

@router.get("/search", response_model=List[UserResponse])
async def search_users(
    role: Optional[str] = None,
    department: Optional[str] = None,
    company: Optional[str] = None,
    search: Optional[str] = None,
    limit: int = 20,
    offset: int = 0,
    current_user = Depends(get_current_user)
):
    """Search for users (employees for candidates, candidates for employees)"""
    
    # Build search query
    where_conditions = ["is_active = TRUE"]
    params = []
    
    if role:
        where_conditions.append("role = ?")
        params.append(role)
    
    if department:
        where_conditions.append("department LIKE ?")
        params.append(f"%{department}%")
    
    if company:
        where_conditions.append("company LIKE ?")
        params.append(f"%{company}%")
    
    # General search across name, position, department
    if search:
        where_conditions.append("(name LIKE ? OR position LIKE ? OR department LIKE ?)")
        search_term = f"%{search}%"
        params.extend([search_term, search_term, search_term])
    
    # Exclude current user
    where_conditions.append("id != ?")
    params.append(current_user["id"])
    
    where_clause = " AND ".join(where_conditions)
    
    query = f"""
        SELECT * FROM users 
        WHERE {where_clause}
        ORDER BY rating DESC, name ASC
        LIMIT ? OFFSET ?
    """
    params.extend([limit, offset])
    
    users = DatabaseManager.execute_query(query, tuple(params), fetch_all=True)
    
    return [format_user_response(user) for user in users]

@router.get("/employees", response_model=List[UserResponse])
@limiter.limit("30/minute")
async def search_employees(
    request: Request,
    company: Optional[str] = None,
    search: Optional[str] = None,
    department: Optional[str] = None,
    skills: Optional[str] = None,  # Comma-separated skills
    sort_by: Optional[str] = "rating",  # rating, name, experience
    limit: int = 20,
    offset: int = 0,
    current_user = Depends(get_current_user)
):
    """Search for employees specifically for candidates"""
    
    # Only allow candidates to search for employees
    if current_user.get("role") != "candidate":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only candidates can search for employees"
        )
    
    # Build search query for employees only
    where_conditions = ["is_active = TRUE", "role = 'employee'"]
    params = []
    
    if company:
        where_conditions.append("company LIKE ?")
        params.append(f"%{company}%")
    
    if department:
        where_conditions.append("department LIKE ?")
        params.append(f"%{department}%")
    
    if search:
        where_conditions.append("(name LIKE ? OR position LIKE ? OR department LIKE ? OR company LIKE ?)")
        search_term = f"%{search}%"
        params.extend([search_term, search_term, search_term, search_term])
    
    if skills:
        skill_list = [skill.strip() for skill in skills.split(",")]
        skill_conditions = []
        for skill in skill_list:
            skill_conditions.append("skills LIKE ?")
            params.append(f'%"{skill}"%')
        
        if skill_conditions:
            where_conditions.append(f"({' OR '.join(skill_conditions)})")
    
    # Exclude current user
    where_conditions.append("id != ?")
    params.append(current_user["id"])
    
    where_clause = " AND ".join(where_conditions)
    
    # Determine sort order
    if sort_by == "name":
        order_by = "name ASC"
    elif sort_by == "experience":
        order_by = "experience_years DESC, rating DESC"
    else:  # Default to rating
        order_by = "rating DESC, name ASC"
    
    query = f"""
        SELECT * FROM users 
        WHERE {where_clause}
        ORDER BY {order_by}
        LIMIT ? OFFSET ?
    """
    params.extend([limit, offset])
    
    users = DatabaseManager.execute_query(query, tuple(params), fetch_all=True)
    
    return [format_user_response(user) for user in users]

@router.get("/companies", response_model=List[str])
async def get_companies(current_user = Depends(get_current_user)):
    """Get list of all companies that have employees registered"""
    
    query = """
        SELECT DISTINCT company 
        FROM users 
        WHERE role = 'employee' AND company IS NOT NULL AND company != '' AND is_active = TRUE
        ORDER BY company ASC
    """
    
    companies = DatabaseManager.execute_query(query, (), fetch_all=True)
    return [company["company"] for company in companies if company["company"]]

@router.get("/departments", response_model=List[str])
async def get_departments(
    company: Optional[str] = None,
    current_user = Depends(get_current_user)
):
    """Get list of departments, optionally filtered by company"""
    
    where_conditions = ["role = 'employee'", "department IS NOT NULL", "department != ''", "is_active = TRUE"]
    params = []
    
    if company:
        where_conditions.append("company = ?")
        params.append(company)
    
    where_clause = " AND ".join(where_conditions)
    
    query = f"""
        SELECT DISTINCT department 
        FROM users 
        WHERE {where_clause}
        ORDER BY department ASC
    """
    
    departments = DatabaseManager.execute_query(query, tuple(params), fetch_all=True)
    return [dept["department"] for dept in departments if dept["department"]]

@router.get("/search-data/employees", response_model=EmployeeSearchResponse)
async def get_employee_search_data(
    company: Optional[str] = None,
    search: Optional[str] = None,
    department: Optional[str] = None,
    skills: Optional[str] = None,
    sort_by: Optional[str] = "rating",
    limit: int = 20,
    offset: int = 0,
    current_user = Depends(get_current_user)
):
    """Get all data needed for employee search page including employees, companies, and departments"""
    
    # Only allow candidates to search for employees
    if current_user.get("role") != "candidate":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only candidates can search for employees"
        )
    
    # Get employees using the same logic as search_employees
    where_conditions = ["is_active = TRUE", "role = 'employee'"]
    params = []
    count_params = []
    
    if company:
        where_conditions.append("company LIKE ?")
        params.append(f"%{company}%")
        count_params.append(f"%{company}%")
    
    if department:
        where_conditions.append("department LIKE ?")
        params.append(f"%{department}%")
        count_params.append(f"%{department}%")
    
    if search:
        where_conditions.append("(name LIKE ? OR position LIKE ? OR department LIKE ? OR company LIKE ?)")
        search_term = f"%{search}%"
        params.extend([search_term, search_term, search_term, search_term])
        count_params.extend([search_term, search_term, search_term, search_term])
    
    if skills:
        skill_list = [skill.strip() for skill in skills.split(",")]
        skill_conditions = []
        for skill in skill_list:
            skill_conditions.append("skills LIKE ?")
            params.append(f'%"{skill}"%')
            count_params.append(f'%"{skill}"%')
        
        if skill_conditions:
            where_conditions.append(f"({' OR '.join(skill_conditions)})")
    
    # Exclude current user
    where_conditions.append("id != ?")
    params.append(current_user["id"])
    count_params.append(current_user["id"])
    
    where_clause = " AND ".join(where_conditions)
    
    # Get total count
    count_query = f"SELECT COUNT(*) as count FROM users WHERE {where_clause}"
    count_result = DatabaseManager.execute_query(count_query, tuple(count_params), fetch_one=True)
    total_count = count_result["count"] if count_result else 0
    
    # Determine sort order
    if sort_by == "name":
        order_by = "name ASC"
    elif sort_by == "experience":
        order_by = "experience_years DESC, rating DESC"
    else:  # Default to rating
        order_by = "rating DESC, name ASC"
    
    # Get employees
    employees_query = f"""
        SELECT * FROM users 
        WHERE {where_clause}
        ORDER BY {order_by}
        LIMIT ? OFFSET ?
    """
    params.extend([limit, offset])
    
    employees_data = DatabaseManager.execute_query(employees_query, tuple(params), fetch_all=True)
    employees = [format_user_response(employee) for employee in employees_data]
    
    # Get all companies
    companies_query = """
        SELECT DISTINCT company 
        FROM users 
        WHERE role = 'employee' AND company IS NOT NULL AND company != '' AND is_active = TRUE
        ORDER BY company ASC
    """
    companies_data = DatabaseManager.execute_query(companies_query, (), fetch_all=True)
    companies = [comp["company"] for comp in companies_data if comp["company"]]
    
    # Get departments (filtered by company if specified)
    dept_where_conditions = ["role = 'employee'", "department IS NOT NULL", "department != ''", "is_active = TRUE"]
    dept_params = []
    
    if company:
        dept_where_conditions.append("company LIKE ?")
        dept_params.append(f"%{company}%")
    
    dept_where_clause = " AND ".join(dept_where_conditions)
    departments_query = f"""
        SELECT DISTINCT department 
        FROM users 
        WHERE {dept_where_clause}
        ORDER BY department ASC
    """
    departments_data = DatabaseManager.execute_query(departments_query, tuple(dept_params), fetch_all=True)
    departments = [dept["department"] for dept in departments_data if dept["department"]]
    
    return EmployeeSearchResponse(
        employees=employees,
        total_count=total_count,
        companies=companies,
        departments=departments
    )

@router.get("/{user_id}/profile", response_model=DetailedEmployeeProfile)
@limiter.limit("60/minute")
async def get_employee_detailed_profile(
    request: Request,
    user_id: int, 
    current_user = Depends(get_current_user)
):
    """Get detailed employee profile with complete data from all related tables"""
    
    # Input validation
    if user_id <= 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid user ID"
        )
    
    # Get the employee data
    user = DatabaseManager.execute_query(
        "SELECT * FROM users WHERE id = ? AND is_active = TRUE AND role = 'employee'",
        (user_id,),
        fetch_one=True
    )
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Employee not found"
        )
    
    # Log profile view activity for the current user (viewer), not the profile being viewed
    # Only log if the user is viewing someone else's profile (not their own)
    if current_user["id"] != user_id:
        DatabaseManager.execute_query(
            "INSERT INTO user_activity_logs (user_id, activity_type, activity_data) VALUES (?, ?, ?)",
            (current_user["id"], "profile_view", json.dumps({"viewed_user_id": user_id}))
        )
    
    try:
        # Get referral statistics
        total_referrals = DatabaseManager.execute_query(
            "SELECT COUNT(*) as count FROM referrals WHERE employee_id = ?",
            (user_id,),
            fetch_one=True
        )["count"]
        
        successful_referrals = DatabaseManager.execute_query(
            "SELECT COUNT(*) as count FROM referrals WHERE employee_id = ? AND status IN ('hired', 'offer_extended')",
            (user_id,),
            fetch_one=True
        )["count"]
        
        # Calculate success rate
        success_rate = round((successful_referrals / total_referrals) * 100, 1) if total_referrals > 0 else 0.0
        
        # Get average feedback score
        avg_feedback_result = DatabaseManager.execute_query(
            "SELECT AVG(feedback_score) as avg_score FROM referrals WHERE employee_id = ? AND feedback_score IS NOT NULL",
            (user_id,),
            fetch_one=True
        )
        avg_feedback_score = round(avg_feedback_result["avg_score"], 2) if avg_feedback_result and avg_feedback_result["avg_score"] else 0.0
        
        # Get recent activity count
        recent_activity = DatabaseManager.execute_query(
            "SELECT COUNT(*) as count FROM referrals WHERE employee_id = ? AND created_at >= datetime('now', '-30 days')",
            (user_id,),
            fetch_one=True
        )["count"]
        
        # Calculate response time from message data (if conversations exist)
        response_time_result = DatabaseManager.execute_query(
            """
            SELECT AVG(
                (julianday(m2.created_at) - julianday(m1.created_at)) * 24 * 60
            ) as avg_minutes
            FROM messages m1
            JOIN messages m2 ON m1.conversation_id = m2.conversation_id
            JOIN conversations c ON m1.conversation_id = c.id
            WHERE c.employee_id = ? 
            AND m1.sender_id != ? 
            AND m2.sender_id = ?
            AND m2.created_at > m1.created_at
            LIMIT 50
            """,
            (user_id, user_id, user_id),
            fetch_one=True
        )
        
        # Format response time
        if response_time_result and response_time_result["avg_minutes"]:
            minutes = response_time_result["avg_minutes"]
            if minutes < 60:
                response_time = f"< {int(minutes)} minutes"
            elif minutes < 1440:  # 24 hours
                response_time = f"< {int(minutes/60)} hours"
            else:
                response_time = f"< {int(minutes/1440)} days"
        else:
            response_time = "< 2 hours"  # Default for new employees
        
        # Get most recent activity to check if user is actually online or logged out
        most_recent_activity = DatabaseManager.execute_query(
            """
            SELECT activity_type, created_at
            FROM user_activity_logs 
            WHERE user_id = ?
            ORDER BY id DESC
            LIMIT 1
            """,
            (user_id,),
            fetch_one=True
        )
        
        # Determine actual online status
        user_updated_at = user.get("updated_at", user["created_at"])
        is_logged_out = False
        last_active_timestamp = user_updated_at
        
        if most_recent_activity:
            # If most recent activity was logout, mark as logged out
            if most_recent_activity["activity_type"] == "logout":
                is_logged_out = True
                last_active_timestamp = most_recent_activity["created_at"]
            # If most recent activity was login or other activity, use that timestamp
            elif most_recent_activity["created_at"] > user_updated_at:
                last_active_timestamp = most_recent_activity["created_at"]
        
        # Calculate display text for last activity
        try:
            from datetime import datetime, timezone
            
            if is_logged_out:
                # User is logged out
                if isinstance(last_active_timestamp, str):
                    if "T" in last_active_timestamp:
                        if last_active_timestamp.endswith("Z"):
                            last_dt = datetime.fromisoformat(last_active_timestamp.replace("Z", "+00:00"))
                        elif "+" in last_active_timestamp:
                            last_dt = datetime.fromisoformat(last_active_timestamp)
                        else:
                            last_dt = datetime.fromisoformat(last_active_timestamp).replace(tzinfo=timezone.utc)
                    else:
                        last_dt = datetime.strptime(last_active_timestamp, "%Y-%m-%d %H:%M:%S").replace(tzinfo=timezone.utc)
                else:
                    last_dt = last_active_timestamp
                    if last_dt.tzinfo is None:
                        last_dt = last_dt.replace(tzinfo=timezone.utc)
                
                now = datetime.now(timezone.utc)
                diff = now - last_dt
                if diff.days > 0:
                    last_active = f"Offline {diff.days} days ago"
                elif diff.seconds > 3600:
                    last_active = f"Offline {diff.seconds // 3600} hours ago"
                else:
                    last_active = f"Offline {diff.seconds // 60} minutes ago"
            else:
                # User is online, check how recently they were active
                if isinstance(last_active_timestamp, str):
                    if "T" in last_active_timestamp:
                        if last_active_timestamp.endswith("Z"):
                            last_dt = datetime.fromisoformat(last_active_timestamp.replace("Z", "+00:00"))
                        elif "+" in last_active_timestamp:
                            last_dt = datetime.fromisoformat(last_active_timestamp)
                        else:
                            last_dt = datetime.fromisoformat(last_active_timestamp).replace(tzinfo=timezone.utc)
                    else:
                        last_dt = datetime.strptime(last_active_timestamp, "%Y-%m-%d %H:%M:%S").replace(tzinfo=timezone.utc)
                else:
                    last_dt = last_active_timestamp
                    if last_dt.tzinfo is None:
                        last_dt = last_dt.replace(tzinfo=timezone.utc)
                
                now = datetime.now(timezone.utc)
                diff = now - last_dt
                
                # If activity is very recent (less than 5 minutes), show as "Online"
                if diff.total_seconds() < 300:  # 5 minutes
                    last_active = "Online"
                elif diff.days > 0:
                    last_active = f"Active {diff.days} days ago"
                elif diff.seconds > 3600:
                    last_active = f"Active {diff.seconds // 3600} hours ago"
                else:
                    last_active = f"Active {diff.seconds // 60} minutes ago"
                    
        except Exception as e:
            print(f"Error parsing activity datetime: {e}")
            last_active = "Recently"
        
        # Get projects
        projects_data = DatabaseManager.execute_query(
            "SELECT * FROM user_projects WHERE user_id = ? ORDER BY is_current DESC, start_date DESC",
            (user_id,),
            fetch_all=True
        )
        
        projects = [
            {
                "id": p["id"],
                "name": p["name"],
                "description": p["description"],
                "technologies": json.loads(p["technologies"]) if p["technologies"] else [],
                "impact": p["impact"],
                "start_date": p["start_date"],
                "end_date": p["end_date"],
                "is_current": bool(p["is_current"]),
                "url": p["url"]
            }
            for p in projects_data
        ]
        
        # Get education
        education_data = DatabaseManager.execute_query(
            "SELECT * FROM user_education WHERE user_id = ? ORDER BY graduation_year DESC",
            (user_id,),
            fetch_all=True
        )
        
        education = [
            {
                "id": e["id"],
                "degree": e["degree"],
                "institution": e["institution"],
                "field_of_study": e["field_of_study"],
                "graduation_year": e["graduation_year"],
                "gpa": e["gpa"],
                "description": e["description"]
            }
            for e in education_data
        ]
        
        # Get certifications
        certifications_data = DatabaseManager.execute_query(
            "SELECT * FROM user_certifications WHERE user_id = ? ORDER BY issue_date DESC",
            (user_id,),
            fetch_all=True
        )
        
        certifications = [
            {
                "id": c["id"],
                "name": c["name"],
                "issuing_organization": c["issuing_organization"],
                "issue_date": c["issue_date"],
                "expiration_date": c["expiration_date"],
                "credential_id": c["credential_id"],
                "credential_url": c["credential_url"]
            }
            for c in certifications_data
        ]
        
        # Get languages
        languages_data = DatabaseManager.execute_query(
            "SELECT language, proficiency FROM user_languages WHERE user_id = ?",
            (user_id,),
            fetch_all=True
        )
        
        languages = [
            {
                "language": l["language"],
                "proficiency": l["proficiency"]
            }
            for l in languages_data
        ]
        
        # Get achievements
        achievements_data = DatabaseManager.execute_query(
            """
            SELECT ua.id, a.name as title, a.description, 
                   ua.completed_at as date_achieved, a.achievement_type as category,
                   NULL as verification_url
            FROM user_achievements ua
            JOIN achievements a ON ua.achievement_id = a.id
            WHERE ua.user_id = ? AND ua.is_completed = 1
            ORDER BY ua.completed_at DESC
            """,
            (user_id,),
            fetch_all=True
        )
        
        achievements = [
            {
                "id": a["id"],
                "title": a["title"],
                "description": a["description"],
                "date_achieved": a["date_achieved"],
                "category": a["category"],
                "verification_url": a["verification_url"]
            }
            for a in achievements_data
        ]
        
        # Get testimonials from referral feedback
        testimonials_data = DatabaseManager.execute_query(
            """
            SELECT r.id, r.feedback_comments, r.feedback_score, r.status, r.created_at,
                   c.name as candidate_name, c.position as candidate_position
            FROM referrals r
            JOIN users c ON r.candidate_id = c.id
            WHERE r.employee_id = ? AND r.feedback_comments IS NOT NULL
            ORDER BY r.created_at DESC
            LIMIT 10
            """,
            (user_id,),
            fetch_all=True
        )
        
        testimonials = [
            {
                "id": t["id"],
                "author": t["candidate_name"],
                "role": t["candidate_position"] or "Software Engineer",
                "content": t["feedback_comments"],
                "rating": t["feedback_score"] or 5,
                "outcome": (
                    "hired" if t["status"] == "hired" 
                    else "interview" if t["status"] in ["interview_scheduled", "interview_completed"] 
                    else "pending"
                ),
                "date": t["created_at"][:10] if t["created_at"] else "2024-01-01",
                "avatar": "/placeholder.svg?height=40&width=40"
            }
            for t in testimonials_data
        ]
        
        # Parse skills
        skills = json.loads(user["skills"]) if user["skills"] else []
        
        # Format joined date
        from datetime import datetime
        try:
            if user["created_at"]:
                created_at_str = user["created_at"]
                if isinstance(created_at_str, str):
                    if "T" in created_at_str:
                        if created_at_str.endswith("Z"):
                            created_dt = datetime.fromisoformat(created_at_str.replace("Z", "+00:00"))
                        elif "+" in created_at_str:
                            created_dt = datetime.fromisoformat(created_at_str)
                        else:
                            created_dt = datetime.fromisoformat(created_at_str)
                    else:
                        created_dt = datetime.strptime(created_at_str, "%Y-%m-%d %H:%M:%S")
                else:
                    created_dt = created_at_str
                joined_date = created_dt.strftime("%B %Y")
            else:
                joined_date = "Unknown"
        except Exception as e:
            print(f"Error parsing created_at datetime: {e}")
            joined_date = "Unknown"
        
        # Build the response with proper null handling
        profile = DetailedEmployeeProfile(
            # Basic info
            id=user["id"],
            name=user["name"] or "Unknown User",
            email=user["email"] or "",
            role=user["role"] or "employee",
            position=user["position"] or "Software Engineer",
            company=user["company"] or "Unknown Company",
            department=user["department"] or "Engineering",
            bio=user["bio"] or "No bio available",
            skills=skills,
            experience_years=user["experience_years"] or 0,
            avatar_url=user.get("avatar_url"),
            
            # Performance metrics
            rating=float(user["rating"] or 0.0),
            total_referrals=total_referrals,
            successful_referrals=successful_referrals,
            success_rate=success_rate,
            avg_feedback_score=avg_feedback_score,
            
            # Activity data
            response_time=response_time,
            last_active=last_active,
            recent_activity_count=recent_activity,
            
            # Status flags
            is_verified=bool(user["is_verified"]),
            is_premium_mentor=(user["rating"] or 0) >= 4.5,
            is_active=bool(user["is_active"]),
            
            # Rich profile data
            projects=projects,
            education=education,
            certifications=certifications,
            languages=languages,
            achievements=achievements,
            testimonials=testimonials,
            
            # Metadata
            location=f"{user['company'] or 'Unknown Company'}, CA",
            joined_date=joined_date,
            created_at=user["created_at"] or "",
            updated_at=user["updated_at"] or ""
        )
        
        return profile
        
    except Exception as e:
        import traceback
        print(f"Error in get_employee_detailed_profile for user {user_id}: {str(e)}")
        print(f"Traceback: {traceback.format_exc()}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error fetching profile data: {str(e)}"
        )

@router.put("/{user_id}/profile", response_model=DetailedEmployeeProfile)
@limiter.limit("10/minute")
async def update_employee_profile(
    request: Request,
    user_id: int,
    profile_data: EmployeeProfileUpdate,
    current_user = Depends(get_current_user)
):
    """Update employee profile with rich data"""
    
    # Only allow employees to update their own profile or admin access
    if current_user["id"] != user_id and current_user["role"] != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only update your own profile"
        )
    
    # Verify the user is an employee
    user = DatabaseManager.get_user_by_id(user_id)
    if not user or user["role"] != "employee":
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Employee not found"
        )
    
    try:
        # Update basic profile information
        update_data = {}
        for field in ["bio", "position", "department", "experience_years", "avatar_url", "company"]:
            value = getattr(profile_data, field, None)
            if value is not None:
                update_data[field] = value
        
        if profile_data.skills is not None:
            update_data["skills"] = json.dumps(profile_data.skills)
        
        if update_data:
            DatabaseManager.update_user(user_id, **update_data)
        
        # Update projects
        if profile_data.projects is not None:
            # Delete existing projects
            DatabaseManager.execute_query(
                "DELETE FROM user_projects WHERE user_id = ?",
                (user_id,)
            )
            
            # Add new projects
            for project in profile_data.projects:
                DatabaseManager.execute_query(
                    """
                    INSERT INTO user_projects (
                        user_id, name, description, technologies, impact,
                        start_date, end_date, is_current, url
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                    """,
                    (
                        user_id,
                        project.get("name", ""),
                        project.get("description"),
                        json.dumps(project.get("technologies", [])),
                        project.get("impact"),
                        project.get("start_date"),
                        project.get("end_date"),
                        project.get("is_current", False),
                        project.get("url")
                    )
                )
        
        # Update education
        if profile_data.education is not None:
            DatabaseManager.execute_query(
                "DELETE FROM user_education WHERE user_id = ?",
                (user_id,)
            )
            
            for edu in profile_data.education:
                DatabaseManager.execute_query(
                    """
                    INSERT INTO user_education (
                        user_id, degree, institution, field_of_study,
                        graduation_year, gpa, description
                    ) VALUES (?, ?, ?, ?, ?, ?, ?)
                    """,
                    (
                        user_id,
                        edu.get("degree", ""),
                        edu.get("institution", ""),
                        edu.get("field_of_study"),
                        edu.get("graduation_year"),
                        edu.get("gpa"),
                        edu.get("description")
                    )
                )
        
        # Update certifications
        if profile_data.certifications is not None:
            DatabaseManager.execute_query(
                "DELETE FROM user_certifications WHERE user_id = ?",
                (user_id,)
            )
            
            for cert in profile_data.certifications:
                DatabaseManager.execute_query(
                    """
                    INSERT INTO user_certifications (
                        user_id, name, issuing_organization, issue_date,
                        expiration_date, credential_id, credential_url
                    ) VALUES (?, ?, ?, ?, ?, ?, ?)
                    """,
                    (
                        user_id,
                        cert.get("name", ""),
                        cert.get("issuing_organization", ""),
                        cert.get("issue_date"),
                        cert.get("expiration_date"),
                        cert.get("credential_id"),
                        cert.get("credential_url")
                    )
                )
        
        # Update languages
        if profile_data.languages is not None:
            DatabaseManager.execute_query(
                "DELETE FROM user_languages WHERE user_id = ?",
                (user_id,)
            )
            
            for lang in profile_data.languages:
                DatabaseManager.execute_query(
                    """
                    INSERT INTO user_languages (user_id, language, proficiency)
                    VALUES (?, ?, ?)
                    """,
                    (user_id, lang.get("language", ""), lang.get("proficiency", "basic"))
                )
        
        # Update achievements
        if profile_data.achievements is not None:
            DatabaseManager.execute_query(
                "DELETE FROM user_achievements WHERE user_id = ?",
                (user_id,)
            )
            
            for achievement in profile_data.achievements:
                DatabaseManager.execute_query(
                    """
                    INSERT INTO user_achievements (
                        user_id, title, description, date_achieved, category, verification_url
                    ) VALUES (?, ?, ?, ?, ?, ?)
                    """,
                    (
                        user_id,
                        achievement.get("title", ""),
                        achievement.get("description"),
                        achievement.get("date_achieved"),
                        achievement.get("category", "professional"),
                        achievement.get("verification_url")
                    )
                )
        
        # Log the profile update
        DatabaseManager.execute_query(
            "INSERT INTO user_activity_logs (user_id, activity_type, activity_data) VALUES (?, ?, ?)",
            (user_id, "profile_update", json.dumps({"updated_sections": list(profile_data.dict(exclude_unset=True).keys())}))
        )
        
        # Create profile update notification
        try:
            await NotificationService.create_notification(
                user_id=user_id,
                notification_type=NotificationType.PROFILE_UPDATED
            )
        except Exception as e:
            # Don't fail the whole request if notification fails
            print(f"Failed to create profile update notification: {str(e)}")
        
        # Return updated profile
        return await get_employee_detailed_profile(request, user_id, current_user)
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to update profile: {str(e)}"
        )

# ================================
# CANDIDATE PROFILE ENDPOINTS
# ================================

@router.get("/search-data/candidates", response_model=CandidateSearchResponse)
@limiter.limit("30/minute")
async def get_candidate_search_data(
    request: Request,
    search: Optional[str] = None,
    department: Optional[str] = None,
    skills: Optional[str] = None,
    experience_min: Optional[int] = None,
    experience_max: Optional[int] = None,
    sort_by: Optional[str] = "name",
    limit: int = 20,
    offset: int = 0,
    current_user = Depends(get_current_user)
):
    """Search for candidates - only accessible by employees"""
    
    # Only allow employees to search for candidates
    if current_user.get("role") != "employee":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only employees can search for candidates"
        )
    
    # Build search query for candidates only
    where_conditions = ["is_active = TRUE", "role = 'candidate'"]
    params = []
    
    if department:
        where_conditions.append("department LIKE ?")
        params.append(f"%{department}%")
    
    if search:
        where_conditions.append("(name LIKE ? OR position LIKE ? OR department LIKE ? OR company LIKE ?)")
        search_term = f"%{search}%"
        params.extend([search_term, search_term, search_term, search_term])
    
    if skills:
        skill_list = [skill.strip() for skill in skills.split(",")]
        skill_conditions = []
        for skill in skill_list:
            skill_conditions.append("skills LIKE ?")
            params.append(f'%"{skill}"%')
        
        if skill_conditions:
            where_conditions.append(f"({' OR '.join(skill_conditions)})")
    
    if experience_min is not None:
        where_conditions.append("experience_years >= ?")
        params.append(experience_min)
    
    if experience_max is not None:
        where_conditions.append("experience_years <= ?")
        params.append(experience_max)
    
    # Exclude current user
    where_conditions.append("id != ?")
    params.append(current_user["id"])
    
    where_clause = " AND ".join(where_conditions)
    
    # Determine sort order
    if sort_by == "experience":
        order_by = "experience_years DESC, name ASC"
    else:  # Default to name
        order_by = "name ASC"
    
    # Get total count
    count_query = f"SELECT COUNT(*) as count FROM users WHERE {where_clause}"
    total_count = DatabaseManager.execute_query(count_query, tuple(params), fetch_one=True)["count"]
    
    # Get candidates
    query = f"""
        SELECT * FROM users 
        WHERE {where_clause}
        ORDER BY {order_by}
        LIMIT ? OFFSET ?
    """
    params.extend([limit, offset])
    
    candidates = DatabaseManager.execute_query(query, tuple(params), fetch_all=True)
    
    # Get departments for filter
    dept_query = """
        SELECT DISTINCT department FROM users 
        WHERE role = 'candidate' AND department IS NOT NULL AND department != ''
        ORDER BY department
    """
    departments = [row["department"] for row in DatabaseManager.execute_query(dept_query, fetch_all=True)]
    
    return CandidateSearchResponse(
        candidates=[format_user_response(candidate) for candidate in candidates],
        total_count=total_count,
        departments=departments
    )

@router.get("/candidates/{candidate_id}/profile", response_model=DetailedCandidateProfile)
@limiter.limit("60/minute")
async def get_candidate_detailed_profile(
    request: Request,
    candidate_id: int, 
    current_user = Depends(get_current_user)
):
    """Get detailed candidate profile - accessible by employees and the candidate themselves"""
    
    # Only allow employees to view candidate profiles OR candidates to view their own profile
    if current_user.get("role") == "employee":
        # Employees can view any candidate profile
        pass
    elif current_user.get("role") == "candidate" and current_user["id"] == candidate_id:
        # Candidates can view their own profile
        pass
    else:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You don't have permission to view this profile"
        )
    
    # Get candidate user data
    candidate = DatabaseManager.get_user_by_id(candidate_id)
    if not candidate or candidate["role"] != "candidate":
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Candidate not found"
        )
    
    try:
        # Get projects
        projects = DatabaseManager.execute_query(
            """
            SELECT id, name, description, technologies, impact, start_date, 
                   end_date, is_current, url 
            FROM user_projects 
            WHERE user_id = ?
            ORDER BY is_current DESC, start_date DESC
            """,
            (candidate_id,),
            fetch_all=True
        )
        
        # Get education
        education = DatabaseManager.execute_query(
            """
            SELECT id, degree, institution, field_of_study, graduation_year, gpa, description
            FROM user_education 
            WHERE user_id = ?
            ORDER BY graduation_year DESC
            """,
            (candidate_id,),
            fetch_all=True
        )
        
        # Get certifications
        certifications = DatabaseManager.execute_query(
            """
            SELECT id, name, issuing_organization, issue_date, expiration_date, 
                   credential_id, credential_url
            FROM user_certifications 
            WHERE user_id = ?
            ORDER BY issue_date DESC
            """,
            (candidate_id,),
            fetch_all=True
        )
        
        # Get languages
        languages = DatabaseManager.execute_query(
            """
            SELECT language, proficiency
            FROM user_languages 
            WHERE user_id = ?
            ORDER BY language
            """,
            (candidate_id,),
            fetch_all=True
        )
        
        # Get achievements
        achievements = DatabaseManager.execute_query(
            """
            SELECT ua.id, a.name as title, a.description, 
                   ua.completed_at as date_achieved, a.achievement_type as category,
                   NULL as verification_url
            FROM user_achievements ua
            JOIN achievements a ON ua.achievement_id = a.id
            WHERE ua.user_id = ? AND ua.is_completed = 1
            ORDER BY ua.completed_at DESC
            """,
            (candidate_id,),
            fetch_all=True
        )
        
        # Get activity data
        recent_activity = DatabaseManager.execute_query(
            """
            SELECT COUNT(*) as count 
            FROM user_activity_logs 
            WHERE user_id = ? AND created_at > datetime('now', '-30 days')
            """,
            (candidate_id,),
            fetch_one=True
        )
        
        # Get most recent activity to check if user is actually online or logged out
        most_recent_activity = DatabaseManager.execute_query(
            """
            SELECT activity_type, created_at
            FROM user_activity_logs 
            WHERE user_id = ?
            ORDER BY id DESC
            LIMIT 1
            """,
            (candidate_id,),
            fetch_one=True
        )
        
        # Determine actual online status
        user_updated_at = candidate.get("updated_at", candidate["created_at"])
        is_logged_out = False
        last_active_timestamp = user_updated_at
        
        if most_recent_activity:
            # If most recent activity was logout, mark as logged out
            if most_recent_activity["activity_type"] == "logout":
                is_logged_out = True
                last_active_timestamp = most_recent_activity["created_at"]
            # If most recent activity was login or other activity, use that timestamp
            elif most_recent_activity["created_at"] > user_updated_at:
                last_active_timestamp = most_recent_activity["created_at"]
        
        # Format profile data
        profile_data = {
            # Basic info
            "id": candidate["id"],
            "name": candidate["name"],
            "email": candidate["email"],
            "role": candidate["role"],
            "position": candidate.get("position"),
            "company": candidate.get("company"),
            "department": candidate.get("department"),
            "bio": candidate.get("bio"),
            "skills": json.loads(candidate.get("skills", "[]")) if candidate.get("skills") else [],
            "experience_years": candidate.get("experience_years"),
            "avatar_url": candidate.get("avatar_url"),
            
            # Activity data
            "last_active": last_active_timestamp,
            "recent_activity_count": recent_activity["count"] if recent_activity else 0,
            "is_logged_out": is_logged_out,
            
            # Status flags
            "is_verified": bool(candidate.get("is_verified", False)),
            "is_active": bool(candidate.get("is_active", True)),
            
            # Rich profile data
            "projects": [
                {
                    "id": p["id"],
                    "name": p["name"],
                    "description": p["description"],
                    "technologies": json.loads(p["technologies"]) if p["technologies"] else [],
                    "impact": p["impact"],
                    "start_date": p["start_date"],
                    "end_date": p["end_date"],
                    "is_current": bool(p["is_current"]),
                    "url": p["url"]
                } for p in projects
            ],
            "education": [
                {
                    "id": e["id"],
                    "degree": e["degree"],
                    "institution": e["institution"],
                    "field_of_study": e["field_of_study"],
                    "graduation_year": e["graduation_year"],
                    "gpa": e["gpa"],
                    "description": e["description"]
                } for e in education
            ],
            "certifications": [
                {
                    "id": c["id"],
                    "name": c["name"],
                    "issuing_organization": c["issuing_organization"],
                    "issue_date": c["issue_date"],
                    "expiration_date": c["expiration_date"],
                    "credential_id": c["credential_id"],
                    "credential_url": c["credential_url"]
                } for c in certifications
            ],
            "languages": [
                {
                    "language": l["language"],
                    "proficiency": l["proficiency"]
                } for l in languages
            ],
            "achievements": [
                {
                    "id": a["id"],
                    "title": a["title"],
                    "description": a["description"],
                    "date_achieved": a["date_achieved"],
                    "category": a["category"],
                    "verification_url": a["verification_url"]
                } for a in achievements
            ],
            
            # Metadata
            "location": candidate.get("location"),
            "joined_date": candidate["created_at"],
            "created_at": candidate["created_at"],
            "updated_at": candidate["updated_at"]
        }
        
        return DetailedCandidateProfile(**profile_data)
        
    except Exception as e:
        import traceback
        print(f"Error in get_candidate_detailed_profile for user {candidate_id}: {str(e)}")
        print(f"Traceback: {traceback.format_exc()}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error fetching candidate profile data: {str(e)}"
        )

@router.put("/candidates/{candidate_id}/profile", response_model=DetailedCandidateProfile)
@limiter.limit("10/minute")
async def update_candidate_profile(
    request: Request,
    candidate_id: int,
    profile_data: CandidateProfileUpdate,
    current_user = Depends(get_current_user)
):
    """Update candidate profile with rich data - only candidates can update their own profile"""
    
    # Only allow candidates to update their own profile
    if current_user["id"] != candidate_id or current_user["role"] != "candidate":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only update your own profile"
        )
    
    # Verify the user is a candidate
    user = DatabaseManager.get_user_by_id(candidate_id)
    if not user or user["role"] != "candidate":
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Candidate not found"
        )
    
    try:
        # Update basic profile information
        update_data = {}
        for field in ["bio", "position", "department", "experience_years", "avatar_url", "company", "location"]:
            value = getattr(profile_data, field, None)
            if value is not None:
                update_data[field] = value
        
        if profile_data.skills is not None:
            update_data["skills"] = json.dumps(profile_data.skills)
        
        if update_data:
            DatabaseManager.update_user(candidate_id, **update_data)
        
        # Update projects
        if profile_data.projects is not None:
            # Delete existing projects
            DatabaseManager.execute_query(
                "DELETE FROM user_projects WHERE user_id = ?",
                (candidate_id,)
            )
            
            # Add new projects
            for project in profile_data.projects:
                DatabaseManager.execute_query(
                    """
                    INSERT INTO user_projects (
                        user_id, name, description, technologies, impact,
                        start_date, end_date, is_current, url
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                    """,
                    (
                        candidate_id,
                        project.get("name", ""),
                        project.get("description"),
                        json.dumps(project.get("technologies", [])),
                        project.get("impact"),
                        project.get("start_date"),
                        project.get("end_date"),
                        project.get("is_current", False),
                        project.get("url")
                    )
                )
        
        # Update education
        if profile_data.education is not None:
            DatabaseManager.execute_query(
                "DELETE FROM user_education WHERE user_id = ?",
                (candidate_id,)
            )
            
            for edu in profile_data.education:
                DatabaseManager.execute_query(
                    """
                    INSERT INTO user_education (
                        user_id, degree, institution, field_of_study,
                        graduation_year, gpa, description
                    ) VALUES (?, ?, ?, ?, ?, ?, ?)
                    """,
                    (
                        candidate_id,
                        edu.get("degree", ""),
                        edu.get("institution", ""),
                        edu.get("field_of_study"),
                        edu.get("graduation_year"),
                        edu.get("gpa"),
                        edu.get("description")
                    )
                )
        
        # Update certifications
        if profile_data.certifications is not None:
            DatabaseManager.execute_query(
                "DELETE FROM user_certifications WHERE user_id = ?",
                (candidate_id,)
            )
            
            for cert in profile_data.certifications:
                DatabaseManager.execute_query(
                    """
                    INSERT INTO user_certifications (
                        user_id, name, issuing_organization, issue_date,
                        expiration_date, credential_id, credential_url
                    ) VALUES (?, ?, ?, ?, ?, ?, ?)
                    """,
                    (
                        candidate_id,
                        cert.get("name", ""),
                        cert.get("issuing_organization", ""),
                        cert.get("issue_date"),
                        cert.get("expiration_date"),
                        cert.get("credential_id"),
                        cert.get("credential_url")
                    )
                )
        
        # Update languages
        if profile_data.languages is not None:
            DatabaseManager.execute_query(
                "DELETE FROM user_languages WHERE user_id = ?",
                (candidate_id,)
            )
            
            for lang in profile_data.languages:
                DatabaseManager.execute_query(
                    """
                    INSERT INTO user_languages (user_id, language, proficiency)
                    VALUES (?, ?, ?)
                    """,
                    (candidate_id, lang.get("language", ""), lang.get("proficiency", "basic"))
                )
        
        # Update achievements
        if profile_data.achievements is not None:
            DatabaseManager.execute_query(
                "DELETE FROM user_achievements WHERE user_id = ?",
                (candidate_id,)
            )
            
            for achievement in profile_data.achievements:
                DatabaseManager.execute_query(
                    """
                    INSERT INTO user_achievements (
                        user_id, title, description, date_achieved, category, verification_url
                    ) VALUES (?, ?, ?, ?, ?, ?)
                    """,
                    (
                        candidate_id,
                        achievement.get("title", ""),
                        achievement.get("description"),
                        achievement.get("date_achieved"),
                        achievement.get("category", "professional"),
                        achievement.get("verification_url")
                    )
                )
        
        # Log the profile update
        DatabaseManager.execute_query(
            "INSERT INTO user_activity_logs (user_id, activity_type, activity_data) VALUES (?, ?, ?)",
            (candidate_id, "profile_update", json.dumps({"updated_sections": list(profile_data.dict(exclude_unset=True).keys())}))
        )
        
        # Create profile update notification
        try:
            await NotificationService.create_notification(
                user_id=candidate_id,
                notification_type=NotificationType.PROFILE_UPDATED
            )
        except Exception as e:
            # Don't fail the whole request if notification fails
            print(f"Failed to create profile update notification: {str(e)}")
        
        # Return updated profile
        return await get_candidate_detailed_profile(request, candidate_id, current_user)
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to update candidate profile: {str(e)}"
        )

@router.get("/{user_id}", response_model=UserResponse)
async def get_user_by_id(user_id: int, current_user = Depends(get_current_user)):
    """Get user by ID (public profile)"""
    
    user = DatabaseManager.get_user_by_id(user_id)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    # Don't expose sensitive information in public profiles
    user_response = format_user_response(user)
    
    return user_response 