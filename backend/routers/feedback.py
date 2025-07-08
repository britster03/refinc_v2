from fastapi import APIRouter, Depends, HTTPException, status, Request
from fastapi.security import HTTPBearer
from database import DatabaseManager
from models import (
    FeedbackCreate, 
    FeedbackResponse, 
    FeedbackType,
    EmployeeRatingRecalculation
)
from auth_utils import get_current_user
import json
import re
from datetime import datetime
from typing import Dict, Any, List
import logging

router = APIRouter(prefix="/feedback", tags=["feedback"])
security = HTTPBearer()
logger = logging.getLogger(__name__)

def analyze_feedback_sentiment(feedback_text: str) -> Dict[str, Any]:
    """
    Advanced sentiment analysis for feedback text.
    Returns sentiment score and analysis metadata.
    """
    
    # Negative sentiment indicators for fell-through feedback
    negative_patterns = {
        "no_response": [
            r"\b(no.{0,10}response|didn.t.{0,10}hear|never.{0,10}responded|ignored|ghosted)\b",
            r"\b(silent|unresponsive|didn.t.{0,10}reply|no.{0,10}communication)\b"
        ],
        "poor_experience": [
            r"\b(unprofessional|rude|disorganized|chaotic|poor.{0,10}process)\b",
            r"\b(waste.{0,10}time|disappointing|frustrating|terrible)\b"
        ],
        "system_issues": [
            r"\b(broken.{0,10}process|system.{0,10}problem|technical.{0,10}issue)\b",
            r"\b(confusing.{0,10}process|unclear.{0,10}next.{0,10}steps)\b"
        ]
    }
    
    # Calculate sentiment score based on patterns
    total_negative_matches = 0
    category_matches = {}
    
    text_lower = feedback_text.lower()
    
    for category, patterns in negative_patterns.items():
        matches = 0
        for pattern in patterns:
            matches += len(re.findall(pattern, text_lower, re.IGNORECASE))
        category_matches[category] = matches
        total_negative_matches += matches
    
    # Calculate sentiment score (-1 to 1, where -1 is most negative)
    text_length = len(feedback_text.split())
    sentiment_score = max(-1.0, -0.1 * total_negative_matches / max(text_length / 10, 1))
    
    # Determine primary issue category
    primary_category = max(category_matches.items(), key=lambda x: x[1])[0] if total_negative_matches > 0 else "general"
    
    return {
        "sentiment_score": round(sentiment_score, 3),
        "confidence": min(0.95, 0.5 + (total_negative_matches * 0.1)),
        "primary_category": primary_category,
        "category_matches": category_matches,
        "text_length": text_length,
        "negative_indicators": total_negative_matches
    }

def calculate_rating_impact(feedback_type: FeedbackType, sentiment_score: float) -> int:
    """
    Calculate the rating impact based on feedback type and sentiment.
    Returns a value between -2 and 0.
    """
    
    base_impacts = {
        FeedbackType.NO_RESPONSE: -2,          # Most severe
        FeedbackType.POOR_REFERRAL_QUALITY: -2,  # Most severe
        FeedbackType.NO_INTERVIEW: -1,         # Moderate
        FeedbackType.REJECTED_AFTER_INTERVIEW: 0,  # Neutral (normal outcome)
        FeedbackType.DECLINED_OFFER: 0,        # Neutral (candidate choice)
        FeedbackType.POSITION_FILLED: 0,       # Neutral (external factor)
        FeedbackType.OTHER: -1                 # Moderate
    }
    
    base_impact = base_impacts.get(feedback_type, -1)
    
    # Adjust based on sentiment (-1 = very negative, 0 = neutral)
    if sentiment_score < -0.7:  # Very negative sentiment
        return max(-2, base_impact - 1)
    elif sentiment_score < -0.3:  # Moderately negative
        return base_impact
    else:  # Less negative
        return min(0, base_impact + 1)

async def update_employee_rating(employee_id: int) -> EmployeeRatingRecalculation:
    """
    Recalculate employee rating based on all feedback data.
    """
    
    try:
        # Get current rating
        current_user = DatabaseManager.execute_query(
            "SELECT rating FROM users WHERE id = ? AND role = 'employee'",
            (employee_id,),
            fetch_one=True
        )
        
        if not current_user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Employee not found"
            )
        
        old_rating = current_user["rating"] or 0.0
        
        # Get all feedback for this employee
        feedback_stats = DatabaseManager.execute_query("""
            SELECT 
                COUNT(*) as total_feedback,
                COUNT(CASE WHEN rating_impact < 0 THEN 1 END) as negative_feedback,
                COUNT(CASE WHEN rating_impact >= 0 THEN 1 END) as neutral_feedback,
                AVG(rating_impact) as avg_impact,
                COUNT(CASE WHEN feedback_type IN ('no_response', 'poor_referral_quality') THEN 1 END) as severe_issues
            FROM referral_feedback 
            WHERE employee_id = ?
        """, (employee_id,), fetch_one=True)
        
        # Get positive feedback from referrals
        referral_stats = DatabaseManager.execute_query("""
            SELECT 
                COUNT(*) as total_referrals,
                COUNT(CASE WHEN feedback_score >= 4 THEN 1 END) as positive_referrals,
                AVG(CASE WHEN feedback_score IS NOT NULL THEN feedback_score END) as avg_referral_rating,
                COUNT(CASE WHEN status IN ('hired', 'offer_extended') THEN 1 END) as successful_referrals
            FROM referrals 
            WHERE employee_id = ?
        """, (employee_id,), fetch_one=True)
        
        total_feedback = feedback_stats["total_feedback"] or 0
        negative_feedback = feedback_stats["negative_feedback"] or 0
        avg_impact = feedback_stats["avg_impact"] or 0
        severe_issues = feedback_stats["severe_issues"] or 0
        
        total_referrals = referral_stats["total_referrals"] or 0
        positive_referrals = referral_stats["positive_referrals"] or 0
        avg_referral_rating = referral_stats["avg_referral_rating"] or 3.0
        successful_referrals = referral_stats["successful_referrals"] or 0
        
        # Calculate new rating using weighted approach
        if total_referrals == 0:
            new_rating = 3.0  # Default rating for new employees
        else:
            # Base rating from positive feedback (3.0 to 5.0)
            base_rating = avg_referral_rating if avg_referral_rating else 3.0
            
            # Success rate bonus (0 to 0.5 points)
            success_rate = successful_referrals / total_referrals if total_referrals > 0 else 0
            success_bonus = success_rate * 0.5
            
            # Fell-through penalty
            if total_feedback > 0:
                # Penalty based on percentage of negative feedback and severity
                negative_rate = negative_feedback / total_referrals
                severe_rate = severe_issues / total_referrals
                
                penalty = (negative_rate * 0.5) + (severe_rate * 0.3) + (abs(avg_impact) * 0.2)
                penalty = min(penalty, 1.5)  # Cap penalty at 1.5 points
            else:
                penalty = 0
            
            new_rating = max(1.0, min(5.0, base_rating + success_bonus - penalty))
        
        new_rating = round(new_rating, 2)
        
        # Update employee rating
        DatabaseManager.execute_query(
            "UPDATE users SET rating = ?, updated_at = ? WHERE id = ?",
            (new_rating, datetime.utcnow().isoformat(), employee_id)
        )
        
        return EmployeeRatingRecalculation(
            employee_id=employee_id,
            old_rating=old_rating,
            new_rating=new_rating,
            total_feedback_count=total_feedback,
            positive_feedback_count=positive_referrals,
            negative_feedback_count=negative_feedback,
            fell_through_count=total_feedback
        )
        
    except Exception as e:
        logger.error(f"Error updating employee rating: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to update employee rating: {str(e)}"
        )

@router.post("/", response_model=FeedbackResponse)
async def submit_feedback(
    request: Request,
    feedback_data: FeedbackCreate,
    current_user = Depends(get_current_user)
):
    """
    Submit fell-through feedback for a referral.
    This will impact the employee's rating.
    """
    
    # Verify user is a candidate
    if current_user["role"] != "candidate":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only candidates can submit referral feedback"
        )
    
    try:
        # Get referral details and verify ownership
        referral = DatabaseManager.execute_query(
            "SELECT * FROM referrals WHERE id = ? AND candidate_id = ?",
            (feedback_data.referral_id, current_user["id"]),
            fetch_one=True
        )
        
        if not referral:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Referral not found or access denied"
            )
        
        # Check if feedback already exists
        existing_feedback = DatabaseManager.execute_query(
            "SELECT id FROM referral_feedback WHERE referral_id = ?",
            (feedback_data.referral_id,),
            fetch_one=True
        )
        
        if existing_feedback:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Feedback already submitted for this referral"
            )
        
        # Validate referral status (should be accepted or in progress)
        valid_statuses = ["reviewing", "interview_scheduled", "interview_completed", "rejected"]
        if referral["status"] not in valid_statuses:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Cannot submit fell-through feedback for referrals with status: {referral['status']}"
            )
        
        # Analyze sentiment
        sentiment_analysis = analyze_feedback_sentiment(feedback_data.feedback_text)
        
        # Calculate rating impact
        rating_impact = calculate_rating_impact(
            feedback_data.feedback_type, 
            sentiment_analysis["sentiment_score"]
        )
        
        # Insert feedback
        now = datetime.utcnow().isoformat()
        
        feedback_id = DatabaseManager.execute_query(
            """
            INSERT INTO referral_feedback (
                referral_id, candidate_id, employee_id, feedback_type, 
                feedback_text, rating_impact, sentiment_score, sentiment_analysis,
                metadata, created_at, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (
                feedback_data.referral_id,
                current_user["id"],
                referral["employee_id"],
                feedback_data.feedback_type.value,
                feedback_data.feedback_text,
                rating_impact,
                sentiment_analysis["sentiment_score"],
                json.dumps(sentiment_analysis),
                json.dumps(feedback_data.metadata) if feedback_data.metadata else None,
                now,
                now
            )
        )
        
        if not feedback_id:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to submit feedback"
            )
        
        # Update employee rating
        rating_update = await update_employee_rating(referral["employee_id"])
        
        # Log activity
        DatabaseManager.execute_query(
            """
            INSERT INTO user_activities (user_id, activity_type, metadata, created_at)
            VALUES (?, ?, ?, ?)
            """,
            (
                current_user["id"],
                "feedback_submitted",
                json.dumps({
                    "referral_id": feedback_data.referral_id,
                    "feedback_type": feedback_data.feedback_type.value,
                    "rating_impact": rating_impact,
                    "employee_id": referral["employee_id"],
                    "old_rating": rating_update.old_rating,
                    "new_rating": rating_update.new_rating
                }),
                now
            )
        )
        
        # Get the created feedback
        created_feedback = DatabaseManager.execute_query(
            "SELECT * FROM referral_feedback WHERE id = ?",
            (feedback_id,),
            fetch_one=True
        )
        
        return FeedbackResponse(
            id=created_feedback["id"],
            referral_id=created_feedback["referral_id"],
            candidate_id=created_feedback["candidate_id"],
            employee_id=created_feedback["employee_id"],
            feedback_type=FeedbackType(created_feedback["feedback_type"]),
            feedback_text=created_feedback["feedback_text"],
            rating_impact=created_feedback["rating_impact"],
            sentiment_score=created_feedback["sentiment_score"],
            sentiment_analysis=json.loads(created_feedback["sentiment_analysis"]) if created_feedback["sentiment_analysis"] else None,
            metadata=json.loads(created_feedback["metadata"]) if created_feedback["metadata"] else None,
            created_at=datetime.fromisoformat(created_feedback["created_at"]),
            updated_at=datetime.fromisoformat(created_feedback["updated_at"])
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error submitting feedback: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to submit feedback: {str(e)}"
        )

@router.get("/referral/{referral_id}", response_model=FeedbackResponse)
async def get_referral_feedback(
    referral_id: int,
    current_user = Depends(get_current_user)
):
    """
    Get feedback for a specific referral.
    """
    
    try:
        # Verify access to referral
        referral = DatabaseManager.execute_query(
            "SELECT * FROM referrals WHERE id = ? AND (candidate_id = ? OR employee_id = ?)",
            (referral_id, current_user["id"], current_user["id"]),
            fetch_one=True
        )
        
        if not referral:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Referral not found or access denied"
            )
        
        # Get feedback
        feedback = DatabaseManager.execute_query(
            "SELECT * FROM referral_feedback WHERE referral_id = ?",
            (referral_id,),
            fetch_one=True
        )
        
        if not feedback:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="No feedback found for this referral"
            )
        
        return FeedbackResponse(
            id=feedback["id"],
            referral_id=feedback["referral_id"],
            candidate_id=feedback["candidate_id"],
            employee_id=feedback["employee_id"],
            feedback_type=FeedbackType(feedback["feedback_type"]),
            feedback_text=feedback["feedback_text"],
            rating_impact=feedback["rating_impact"],
            sentiment_score=feedback["sentiment_score"],
            sentiment_analysis=json.loads(feedback["sentiment_analysis"]) if feedback["sentiment_analysis"] else None,
            metadata=json.loads(feedback["metadata"]) if feedback["metadata"] else None,
            created_at=datetime.fromisoformat(feedback["created_at"]),
            updated_at=datetime.fromisoformat(feedback["updated_at"])
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting referral feedback: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get feedback: {str(e)}"
        )

@router.get("/employee/{employee_id}/summary")
async def get_employee_feedback_summary(
    employee_id: int,
    current_user = Depends(get_current_user)
):
    """
    Get feedback summary for an employee.
    """
    
    try:
        # Get feedback summary
        summary = DatabaseManager.execute_query("""
            SELECT 
                COUNT(*) as total_feedback,
                COUNT(CASE WHEN rating_impact = -2 THEN 1 END) as severe_issues,
                COUNT(CASE WHEN rating_impact = -1 THEN 1 END) as moderate_issues,
                COUNT(CASE WHEN rating_impact = 0 THEN 1 END) as neutral_feedback,
                AVG(sentiment_score) as avg_sentiment,
                GROUP_CONCAT(DISTINCT feedback_type) as feedback_types
            FROM referral_feedback 
            WHERE employee_id = ?
        """, (employee_id,), fetch_one=True)
        
        # Get recent feedback
        recent_feedback = DatabaseManager.execute_query("""
            SELECT feedback_type, feedback_text, rating_impact, created_at
            FROM referral_feedback 
            WHERE employee_id = ?
            ORDER BY created_at DESC
            LIMIT 5
        """, (employee_id,), fetch_all=True)
        
        return {
            "employee_id": employee_id,
            "summary": summary,
            "recent_feedback": recent_feedback
        }
        
    except Exception as e:
        logger.error(f"Error getting feedback summary: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get feedback summary: {str(e)}"
        ) 