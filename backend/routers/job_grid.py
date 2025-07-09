"""
Job Grid Router for ReferralInc
Provides job application management with Kanban board functionality,
AI integration, and referral system integration
"""

import logging
from typing import Dict, Any, List, Optional
from datetime import datetime
import json

from fastapi import APIRouter, HTTPException, Depends, Query, BackgroundTasks
from fastapi.responses import JSONResponse

from models import (
    JobApplicationCreate, JobApplicationUpdate, JobApplicationResponse,
    JobApplicationFilter, JobApplicationBulkUpdate, JobRecommendation,
    JobApplicationAnalytics, JobApplicationStatus, JobApplicationSource,
    SuccessResponse, UserResponse
)
from auth_utils import get_current_user
from database import DatabaseManager
from ai_agents.assessment_coordinator import AssessmentCoordinator
from ai_agents.market_intelligence import MarketIntelligenceManager
from services.market_intelligence_service import MarketIntelligenceService

# Initialize router
router = APIRouter(prefix="/job-grid", tags=["job-grid"])
logger = logging.getLogger(__name__)

# Initialize AI services
assessment_coordinator = None  # AssessmentCoordinator will be provided by ai_analysis router when needed
market_intelligence_service = MarketIntelligenceService()

def format_job_application_response(job_app: dict) -> JobApplicationResponse:
    """Format job application database record to response model"""
    
    # Parse AI analysis data if exists
    ai_analysis_data = None
    if job_app.get("ai_analysis_data"):
        try:
            ai_analysis_data = json.loads(job_app["ai_analysis_data"])
        except (json.JSONDecodeError, TypeError):
            ai_analysis_data = None
    
    # Get referral employee info if exists
    referral_employee = None
    if job_app.get("referral_employee_id"):
        employee = DatabaseManager.execute_query(
            "SELECT id, name, email, avatar_url, position, company FROM users WHERE id = ?",
            (job_app["referral_employee_id"],),
            fetch_one=True
        )
        if employee:
            referral_employee = UserResponse(
                id=employee["id"],
                name=employee["name"],
                email=employee["email"],
                role="employee",
                avatar_url=employee.get("avatar_url"),
                position=employee.get("position"),
                company=employee.get("company"),
                is_verified=True,
                created_at=datetime.utcnow(),
                updated_at=datetime.utcnow()
            )
    
    return JobApplicationResponse(
        id=job_app["id"],
        company=job_app["company"],
        position=job_app["position"],
        department=job_app.get("department"),
        location=job_app.get("location"),
        salary_range=job_app.get("salary_range"),
        job_url=job_app.get("job_url"),
        job_description=job_app.get("job_description"),
        status=JobApplicationStatus(job_app["status"]),
        applied_date=datetime.fromisoformat(job_app["applied_date"]) if job_app.get("applied_date") else None,
        last_status_update=datetime.fromisoformat(job_app["last_status_update"]),
        ai_match_score=job_app.get("ai_match_score"),
        ai_analysis_data=ai_analysis_data,
        source=JobApplicationSource(job_app["source"]),
        notes=job_app.get("notes"),
        interview_date=datetime.fromisoformat(job_app["interview_date"]) if job_app.get("interview_date") else None,
        offer_date=datetime.fromisoformat(job_app["offer_date"]) if job_app.get("offer_date") else None,
        rejection_date=datetime.fromisoformat(job_app["rejection_date"]) if job_app.get("rejection_date") else None,
        rejection_reason=job_app.get("rejection_reason"),
        referral_id=job_app.get("referral_id"),
        referral_employee_id=job_app.get("referral_employee_id"),
        referral_status=job_app.get("referral_status"),
        created_at=datetime.fromisoformat(job_app["created_at"]),
        updated_at=datetime.fromisoformat(job_app["updated_at"]),
        referral_employee=referral_employee
    )

@router.post("/", response_model=JobApplicationResponse)
async def create_job_application(
    job_data: JobApplicationCreate,
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """Create a new job application"""
    
    try:
        now = datetime.utcnow().isoformat()
        
        # Prepare AI analysis data
        ai_analysis_data_json = None
        if job_data.ai_analysis_data:
            ai_analysis_data_json = json.dumps(job_data.ai_analysis_data)
        
        # Insert job application
        query = """
            INSERT INTO job_applications (
                user_id, company, position, department, location, salary_range,
                job_url, job_description, notes, ai_match_score, ai_analysis_data,
                source, analysis_session_id, created_at, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """
        
        result = DatabaseManager.execute_query(
            query,
            (
                current_user["id"],
                job_data.company,
                job_data.position,
                job_data.department,
                job_data.location,
                job_data.salary_range,
                job_data.job_url,
                job_data.job_description,
                job_data.notes,
                job_data.ai_match_score,
                ai_analysis_data_json,
                job_data.source.value,
                job_data.analysis_session_id,
                now,
                now
            )
        )
        
        if not result:
            raise HTTPException(
                status_code=500,
                detail="Failed to create job application"
            )
        
        # Get the created job application
        job_app = DatabaseManager.execute_query(
            "SELECT * FROM job_applications WHERE id = ?",
            (result,),
            fetch_one=True
        )
        
        if not job_app:
            raise HTTPException(
                status_code=500,
                detail="Failed to retrieve created job application"
            )
        
        return format_job_application_response(job_app)
        
    except Exception as e:
        logger.error(f"Failed to create job application: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to create job application: {str(e)}"
        )

@router.get("/", response_model=Dict[str, Any])
async def get_job_applications(
    status: Optional[str] = Query(None),
    company: Optional[str] = Query(None),
    source: Optional[str] = Query(None),
    min_match_score: Optional[float] = Query(None),
    date_from: Optional[str] = Query(None),
    date_to: Optional[str] = Query(None),
    has_referral: Optional[bool] = Query(None),
    limit: int = Query(50, le=100),
    offset: int = Query(0, ge=0),
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """Get job applications with filters"""
    
    try:
        # Build query conditions
        where_conditions = ["user_id = ?"]
        params = [current_user["id"]]
        
        if status:
            where_conditions.append("status = ?")
            params.append(status)
        
        if company:
            where_conditions.append("company LIKE ?")
            params.append(f"%{company}%")
        
        if source:
            where_conditions.append("source = ?")
            params.append(source)
        
        if min_match_score is not None:
            where_conditions.append("ai_match_score >= ?")
            params.append(min_match_score)
        
        if date_from:
            where_conditions.append("created_at >= ?")
            params.append(date_from)
        
        if date_to:
            where_conditions.append("created_at <= ?")
            params.append(date_to)
        
        if has_referral is not None:
            if has_referral:
                where_conditions.append("referral_id IS NOT NULL")
            else:
                where_conditions.append("referral_id IS NULL")
        
        where_clause = " AND ".join(where_conditions)
        
        # Get total count
        count_query = f"SELECT COUNT(*) as total FROM job_applications WHERE {where_clause}"
        total_result = DatabaseManager.execute_query(count_query, tuple(params), fetch_one=True)
        total = total_result["total"] if total_result else 0
        
        # Get job applications
        query = f"""
            SELECT * FROM job_applications 
            WHERE {where_clause}
            ORDER BY last_status_update DESC, created_at DESC
            LIMIT ? OFFSET ?
        """
        params.extend([limit, offset])
        
        job_apps = DatabaseManager.execute_query(query, tuple(params), fetch_all=True)
        
        # Format response
        formatted_job_apps = [format_job_application_response(app) for app in job_apps]
        
        # Group by status for Kanban board
        kanban_data = {
            "not_applied": [],
            "applied": [],
            "pending": [],
            "interview": [],
            "rejected": [],
            "hired": []
        }
        
        for app in formatted_job_apps:
            kanban_data[app.status.value].append(app)
        
        return {
            "job_applications": formatted_job_apps,
            "kanban_data": kanban_data,
            "total": total,
            "limit": limit,
            "offset": offset
        }
        
    except Exception as e:
        logger.error(f"Failed to get job applications: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to get job applications: {str(e)}"
        )

@router.get("/{job_id}", response_model=JobApplicationResponse)
async def get_job_application(
    job_id: int,
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """Get a specific job application by ID"""
    
    job_app = DatabaseManager.execute_query(
        "SELECT * FROM job_applications WHERE id = ? AND user_id = ?",
        (job_id, current_user["id"]),
        fetch_one=True
    )
    
    if not job_app:
        raise HTTPException(
            status_code=404,
            detail="Job application not found"
        )
    
    return format_job_application_response(job_app)

@router.put("/{job_id}", response_model=JobApplicationResponse)
async def update_job_application(
    job_id: int,
    update_data: JobApplicationUpdate,
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """Update a job application"""
    
    # Get existing job application
    job_app = DatabaseManager.execute_query(
        "SELECT * FROM job_applications WHERE id = ? AND user_id = ?",
        (job_id, current_user["id"]),
        fetch_one=True
    )
    
    if not job_app:
        raise HTTPException(
            status_code=404,
            detail="Job application not found"
        )
    
    try:
        # Build update query
        update_fields = []
        params = []
        old_status = job_app["status"]
        
        # Track status change for automatic applied_date setting
        status_changed = False
        new_status = None
        
        if update_data.status is not None:
            new_status = update_data.status.value
            if new_status != old_status:
                status_changed = True
                update_fields.append("status = ?")
                params.append(new_status)
                
                # Automatically set applied_date when status changes to 'applied'
                if new_status == "applied" and not job_app.get("applied_date"):
                    update_fields.append("applied_date = ?")
                    params.append(datetime.utcnow().isoformat())
                
                # Set specific date fields based on status
                if new_status == "interview" and update_data.interview_date:
                    update_fields.append("interview_date = ?")
                    params.append(update_data.interview_date.isoformat())
                elif new_status == "hired" and update_data.offer_date:
                    update_fields.append("offer_date = ?")
                    params.append(update_data.offer_date.isoformat())
                elif new_status == "rejected":
                    if update_data.rejection_date:
                        update_fields.append("rejection_date = ?")
                        params.append(update_data.rejection_date.isoformat())
                    else:
                        update_fields.append("rejection_date = ?")
                        params.append(datetime.utcnow().isoformat())
        
        # Update other fields
        for field, value in [
            ("company", update_data.company),
            ("position", update_data.position),
            ("department", update_data.department),
            ("location", update_data.location),
            ("salary_range", update_data.salary_range),
            ("job_url", update_data.job_url),
            ("job_description", update_data.job_description),
            ("notes", update_data.notes),
            ("rejection_reason", update_data.rejection_reason)
        ]:
            if value is not None:
                update_fields.append(f"{field} = ?")
                params.append(value)
        
        # Handle date fields
        if update_data.interview_date is not None:
            update_fields.append("interview_date = ?")
            params.append(update_data.interview_date.isoformat())
        
        if update_data.offer_date is not None:
            update_fields.append("offer_date = ?")
            params.append(update_data.offer_date.isoformat())
        
        if not update_fields:
            raise HTTPException(
                status_code=400,
                detail="No fields to update"
            )
        
        # Add last_status_update if status changed
        if status_changed:
            update_fields.append("last_status_update = ?")
            params.append(datetime.utcnow().isoformat())
        
        # Add updated_at
        update_fields.append("updated_at = ?")
        params.append(datetime.utcnow().isoformat())
        
        # Add WHERE clause
        params.append(job_id)
        
        query = f"UPDATE job_applications SET {', '.join(update_fields)} WHERE id = ?"
        
        DatabaseManager.execute_query(query, tuple(params))
        
        # Add status history entry if status changed
        if status_changed:
            DatabaseManager.execute_query(
                """
                INSERT INTO job_application_status_history 
                (job_application_id, old_status, new_status, changed_at, notes)
                VALUES (?, ?, ?, ?, ?)
                """,
                (
                    job_id,
                    old_status,
                    new_status,
                    datetime.utcnow().isoformat(),
                    f"Status changed from {old_status} to {new_status}"
                )
            )
        
        # Get updated job application
        updated_job_app = DatabaseManager.execute_query(
            "SELECT * FROM job_applications WHERE id = ?",
            (job_id,),
            fetch_one=True
        )
        
        return format_job_application_response(updated_job_app)
        
    except Exception as e:
        logger.error(f"Failed to update job application: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to update job application: {str(e)}"
        )

@router.delete("/{job_id}", response_model=SuccessResponse)
async def delete_job_application(
    job_id: int,
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """Delete a job application"""
    
    job_app = DatabaseManager.execute_query(
        "SELECT * FROM job_applications WHERE id = ? AND user_id = ?",
        (job_id, current_user["id"]),
        fetch_one=True
    )
    
    if not job_app:
        raise HTTPException(
            status_code=404,
            detail="Job application not found"
        )
    
    try:
        DatabaseManager.execute_query(
            "DELETE FROM job_applications WHERE id = ?",
            (job_id,)
        )
        
        return SuccessResponse(
            success=True,
            message="Job application deleted successfully"
        )
        
    except Exception as e:
        logger.error(f"Failed to delete job application: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to delete job application: {str(e)}"
        )

@router.put("/bulk-update", response_model=SuccessResponse)
async def bulk_update_job_applications(
    bulk_update: JobApplicationBulkUpdate,
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """Bulk update multiple job applications"""
    
    if not bulk_update.job_application_ids:
        raise HTTPException(
            status_code=400,
            detail="No job application IDs provided"
        )
    
    try:
        # Verify all job applications belong to the current user
        placeholders = ",".join(["?" for _ in bulk_update.job_application_ids])
        verification_query = f"""
            SELECT id FROM job_applications 
            WHERE id IN ({placeholders}) AND user_id = ?
        """
        
        params = list(bulk_update.job_application_ids) + [current_user["id"]]
        verified_apps = DatabaseManager.execute_query(
            verification_query,
            tuple(params),
            fetch_all=True
        )
        
        verified_ids = [app["id"] for app in verified_apps]
        
        if len(verified_ids) != len(bulk_update.job_application_ids):
            raise HTTPException(
                status_code=403,
                detail="Some job applications not found or not owned by user"
            )
        
        # Build update query
        update_fields = []
        update_params = []
        
        if bulk_update.status is not None:
            update_fields.append("status = ?")
            update_params.append(bulk_update.status.value)
            
            # Auto-set applied_date for 'applied' status
            if bulk_update.status.value == "applied":
                update_fields.append("applied_date = CASE WHEN applied_date IS NULL THEN ? ELSE applied_date END")
                update_params.append(datetime.utcnow().isoformat())
            
            update_fields.append("last_status_update = ?")
            update_params.append(datetime.utcnow().isoformat())
        
        if bulk_update.notes is not None:
            update_fields.append("notes = ?")
            update_params.append(bulk_update.notes)
        
        if not update_fields:
            raise HTTPException(
                status_code=400,
                detail="No fields to update"
            )
        
        # Add updated_at
        update_fields.append("updated_at = ?")
        update_params.append(datetime.utcnow().isoformat())
        
        # Execute bulk update
        update_query = f"""
            UPDATE job_applications 
            SET {', '.join(update_fields)}
            WHERE id IN ({placeholders})
        """
        
        final_params = update_params + verified_ids
        DatabaseManager.execute_query(update_query, tuple(final_params))
        
        return SuccessResponse(
            success=True,
            message=f"Successfully updated {len(verified_ids)} job applications"
        )
        
    except Exception as e:
        logger.error(f"Failed to bulk update job applications: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to bulk update job applications: {str(e)}"
        )

@router.post("/from-ai-analysis", response_model=List[JobApplicationResponse])
async def create_jobs_from_ai_analysis(
    analysis_session_id: int,
    background_tasks: BackgroundTasks,
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """Create job applications from AI analysis recommendations"""
    
    try:
        # Get analysis session
        session = DatabaseManager.execute_query(
            "SELECT * FROM analysis_sessions WHERE id = ? AND user_id = ?",
            (analysis_session_id, current_user["id"]),
            fetch_one=True
        )
        
        if not session:
            raise HTTPException(
                status_code=404,
                detail="Analysis session not found"
            )
        
        # Get latest iteration
        iteration = DatabaseManager.execute_query(
            """
            SELECT * FROM analysis_iterations 
            WHERE session_id = ? 
            ORDER BY iteration_number DESC 
            LIMIT 1
            """,
            (analysis_session_id,),
            fetch_one=True
        )
        
        if not iteration:
            raise HTTPException(
                status_code=404,
                detail="No analysis iteration found"
            )
        
        # Parse analysis data
        try:
            analysis_data = json.loads(iteration["analysis_data"])
            market_data = json.loads(iteration["market_data"]) if iteration.get("market_data") else None
        except (json.JSONDecodeError, TypeError):
            raise HTTPException(
                status_code=400,
                detail="Invalid analysis data format"
            )
        
        # Extract job recommendations from analysis
        job_recommendations = []
        
        # Get skills from analysis
        skills_data = analysis_data.get("agent_results", {}).get("skills", {}).get("data", {})
        extracted_skills = [skill["skill"] for skill in skills_data.get("extracted_skills", [])]
        
        # Use market data to find job opportunities
        if market_data and market_data.get("job_postings"):
            for job in market_data["job_postings"][:10]:  # Limit to top 10 recommendations
                # Calculate match score based on skills overlap
                job_skills = job.get("required_skills", [])
                skills_match = [skill for skill in extracted_skills if any(
                    job_skill.lower() in skill.lower() or skill.lower() in job_skill.lower() 
                    for job_skill in job_skills
                )]
                
                match_score = min(95, max(60, (len(skills_match) / max(len(job_skills), 1)) * 100))
                
                job_recommendations.append({
                    "company": job.get("company", "Unknown Company"),
                    "position": job.get("title", "Software Engineer"),
                    "location": job.get("location", "Remote"),
                    "salary_range": job.get("salary_range", "Competitive"),
                    "job_url": job.get("url"),
                    "job_description": job.get("description", ""),
                    "ai_match_score": match_score,
                    "ai_analysis_data": {
                        "skills_match": skills_match,
                        "missing_skills": [skill for skill in job_skills if skill not in skills_match],
                        "match_reasons": [
                            f"Strong match in {skill}" for skill in skills_match[:3]
                        ],
                        "source_analysis": "ai_recommendation",
                        "analysis_session_id": analysis_session_id
                    }
                })
        
        # If no market data, create generic recommendations based on analysis
        if not job_recommendations:
            resume_data = analysis_data.get("agent_results", {}).get("resume", {}).get("data", {})
            experience = resume_data.get("experience", [])
            
            for exp in experience[:5]:  # Create recommendations based on experience
                match_score = 75 + (len(extracted_skills) * 2)  # Base score with skill bonus
                
                job_recommendations.append({
                    "company": f"Similar to {exp.get('company', 'Previous Company')}",
                    "position": exp.get("title", "Software Engineer"),
                    "location": "Remote / On-site",
                    "salary_range": "Competitive",
                    "job_description": f"Role similar to your experience at {exp.get('company', 'previous company')}",
                    "ai_match_score": min(95, match_score),
                    "ai_analysis_data": {
                        "skills_match": extracted_skills[:5],
                        "missing_skills": [],
                        "match_reasons": [
                            "Experience in similar role",
                            "Relevant skills identified",
                            "Career progression opportunity"
                        ],
                        "source_analysis": "experience_based",
                        "analysis_session_id": analysis_session_id
                    }
                })
        
        # Create job applications
        created_jobs = []
        now = datetime.utcnow().isoformat()
        
        for job_rec in job_recommendations:
            ai_analysis_data_json = json.dumps(job_rec["ai_analysis_data"])
            
            query = """
                INSERT INTO job_applications (
                    user_id, company, position, location, salary_range,
                    job_url, job_description, ai_match_score, ai_analysis_data,
                    source, analysis_session_id, created_at, updated_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """
            
            result = DatabaseManager.execute_query(
                query,
                (
                    current_user["id"],
                    job_rec["company"],
                    job_rec["position"],
                    job_rec["location"],
                    job_rec["salary_range"],
                    job_rec.get("job_url"),
                    job_rec["job_description"],
                    job_rec["ai_match_score"],
                    ai_analysis_data_json,
                    JobApplicationSource.AI_RECOMMENDATION.value,
                    analysis_session_id,
                    now,
                    now
                )
            )
            
            if result:
                job_app = DatabaseManager.execute_query(
                    "SELECT * FROM job_applications WHERE id = ?",
                    (result,),
                    fetch_one=True
                )
                if job_app:
                    created_jobs.append(format_job_application_response(job_app))
        
        logger.info(f"Created {len(created_jobs)} job applications from AI analysis for user {current_user['id']}")
        
        return created_jobs
        
    except Exception as e:
        logger.error(f"Failed to create jobs from AI analysis: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to create jobs from AI analysis: {str(e)}"
        )

@router.get("/analytics/dashboard", response_model=JobApplicationAnalytics)
async def get_job_application_analytics(
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """Get job application analytics for dashboard"""
    
    try:
        user_id = current_user["id"]
        
        # Get total applications
        total_result = DatabaseManager.execute_query(
            "SELECT COUNT(*) as total FROM job_applications WHERE user_id = ?",
            (user_id,),
            fetch_one=True
        )
        total_applications = total_result["total"] if total_result else 0
        
        # Get by status
        status_result = DatabaseManager.execute_query(
            """
            SELECT status, COUNT(*) as count 
            FROM job_applications 
            WHERE user_id = ? 
            GROUP BY status
            """,
            (user_id,),
            fetch_all=True
        )
        by_status = {row["status"]: row["count"] for row in status_result}
        
        # Get by source
        source_result = DatabaseManager.execute_query(
            """
            SELECT source, COUNT(*) as count 
            FROM job_applications 
            WHERE user_id = ? 
            GROUP BY source
            """,
            (user_id,),
            fetch_all=True
        )
        by_source = {row["source"]: row["count"] for row in source_result}
        
        # Get average match score
        avg_score_result = DatabaseManager.execute_query(
            """
            SELECT AVG(ai_match_score) as avg_score 
            FROM job_applications 
            WHERE user_id = ? AND ai_match_score IS NOT NULL
            """,
            (user_id,),
            fetch_one=True
        )
        average_match_score = avg_score_result["avg_score"] if avg_score_result and avg_score_result["avg_score"] else None
        
        # Get application trend (last 6 months by week)
        trend_result = DatabaseManager.execute_query(
            """
            SELECT 
                DATE(created_at) as date,
                COUNT(*) as count
            FROM job_applications 
            WHERE user_id = ? AND created_at >= datetime('now', '-6 months')
            GROUP BY DATE(created_at)
            ORDER BY date
            """,
            (user_id,),
            fetch_all=True
        )
        application_trend = [{"date": row["date"], "count": row["count"]} for row in trend_result]
        
        # Calculate success rate
        successful_count = by_status.get("hired", 0) + by_status.get("interview", 0)
        success_rate = (successful_count / total_applications * 100) if total_applications > 0 else 0
        
        # Get top companies
        companies_result = DatabaseManager.execute_query(
            """
            SELECT company, COUNT(*) as count 
            FROM job_applications 
            WHERE user_id = ? 
            GROUP BY company 
            ORDER BY count DESC 
            LIMIT 5
            """,
            (user_id,),
            fetch_all=True
        )
        top_companies = [{"company": row["company"], "count": row["count"]} for row in companies_result]
        
        # Get referral success rate
        referral_success_result = DatabaseManager.execute_query(
            """
            SELECT 
                COUNT(*) as total_referrals,
                SUM(CASE WHEN status IN ('hired', 'interview') THEN 1 ELSE 0 END) as successful_referrals
            FROM job_applications 
            WHERE user_id = ? AND referral_id IS NOT NULL
            """,
            (user_id,),
            fetch_one=True
        )
        
        referral_success_rate = None
        if referral_success_result and referral_success_result["total_referrals"] > 0:
            referral_success_rate = (referral_success_result["successful_referrals"] / 
                                   referral_success_result["total_referrals"] * 100)
        
        return JobApplicationAnalytics(
            total_applications=total_applications,
            by_status=by_status,
            by_source=by_source,
            average_match_score=average_match_score,
            application_trend=application_trend,
            success_rate=success_rate,
            top_companies=top_companies,
            referral_success_rate=referral_success_rate
        )
        
    except Exception as e:
        logger.error(f"Failed to get job application analytics: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to get job application analytics: {str(e)}"
        )

@router.get("/employees/{company}", response_model=List[UserResponse])
async def find_employees_at_company(
    company: str,
    limit: int = Query(10, le=50),
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """Find employees at a specific company for referral opportunities"""
    
    try:
        # Search for employees at the company
        employees = DatabaseManager.execute_query(
            """
            SELECT id, name, email, avatar_url, position, company, department, bio, skills, rating
            FROM users 
            WHERE role = 'employee' 
            AND is_active = 1 
            AND (company LIKE ? OR company = ?)
            ORDER BY rating DESC, total_referrals DESC
            LIMIT ?
            """,
            (f"%{company}%", company, limit),
            fetch_all=True
        )
        
        # Format response
        employee_list = []
        for emp in employees:
            skills = json.loads(emp["skills"]) if emp.get("skills") else []
            
            employee_list.append(UserResponse(
                id=emp["id"],
                name=emp["name"],
                email=emp["email"],
                role="employee",
                avatar_url=emp.get("avatar_url"),
                position=emp.get("position"),
                company=emp.get("company"),
                department=emp.get("department"),
                bio=emp.get("bio"),
                skills=skills,
                is_verified=True,
                created_at=datetime.utcnow(),
                updated_at=datetime.utcnow()
            ))
        
        return employee_list
        
    except Exception as e:
        logger.error(f"Failed to find employees at company: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to find employees at company: {str(e)}"
        )

@router.post("/{job_id}/request-referral", response_model=SuccessResponse)
async def request_referral_for_job(
    job_id: int,
    employee_id: int,
    background_tasks: BackgroundTasks,
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """Request a referral for a specific job application"""
    
    # Get job application
    job_app = DatabaseManager.execute_query(
        "SELECT * FROM job_applications WHERE id = ? AND user_id = ?",
        (job_id, current_user["id"]),
        fetch_one=True
    )
    
    if not job_app:
        raise HTTPException(
            status_code=404,
            detail="Job application not found"
        )
    
    # Get employee
    employee = DatabaseManager.execute_query(
        "SELECT * FROM users WHERE id = ? AND role = 'employee' AND is_active = 1",
        (employee_id,),
        fetch_one=True
    )
    
    if not employee:
        raise HTTPException(
            status_code=404,
            detail="Employee not found or inactive"
        )
    
    try:
        # Update job application with referral information
        DatabaseManager.execute_query(
            """
            UPDATE job_applications 
            SET referral_employee_id = ?, referral_status = 'requested', updated_at = ?
            WHERE id = ?
            """,
            (employee_id, datetime.utcnow().isoformat(), job_id)
        )
        
        # Create a referral entry (similar to the existing referral system)
        now = datetime.utcnow().isoformat()
        
        referral_result = DatabaseManager.execute_query(
            """
            INSERT INTO referrals (
                candidate_id, employee_id, position, company, status,
                notes, created_at, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (
                current_user["id"],
                employee_id,
                job_app["position"],
                job_app["company"],
                "pending",
                f"Referral request for {job_app['position']} position from job application",
                now,
                now
            )
        )
        
        # Update job application with referral ID
        if referral_result:
            DatabaseManager.execute_query(
                "UPDATE job_applications SET referral_id = ? WHERE id = ?",
                (referral_result, job_id)
            )
        
        # TODO: Send notification to employee (background task)
        
        return SuccessResponse(
            success=True,
            message="Referral request sent successfully"
        )
        
    except Exception as e:
        logger.error(f"Failed to request referral: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to request referral: {str(e)}"
        ) 