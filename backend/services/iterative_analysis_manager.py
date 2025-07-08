"""
Iterative Analysis Manager

Handles enhanced user input and iterative analysis refinement
Provides personalized analysis based on user preferences and feedback
"""

import logging
import json
import asyncio
from typing import Dict, List, Optional, Any
from datetime import datetime

from ai_agents.assessment_coordinator import AssessmentCoordinator
from services.market_intelligence_service import MarketIntelligenceService
from database import DatabaseManager

logger = logging.getLogger(__name__)

class IterativeAnalysisManager:
    """
    Manages iterative analysis sessions with user feedback and refinement
    """
    
    def __init__(self, assessment_coordinator: AssessmentCoordinator, market_service: MarketIntelligenceService):
        self.assessment_coordinator = assessment_coordinator
        self.market_service = market_service
        self.max_iterations = 3
        self.user_sessions = {}
    
    async def process_initial_analysis(
        self, 
        user_id: int, 
        resume_data: str, 
        job_description: Optional[str],
        preferences: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Process initial analysis with user preferences
        
        Args:
            user_id: User ID
            resume_data: Resume text
            job_description: Optional job description
            preferences: User preferences for analysis customization
            
        Returns:
            Analysis result with session information
        """
        try:
            # Store session
            session_key = f"user_{user_id}_{datetime.utcnow().timestamp()}"
            self.user_sessions[session_key] = {
                "user_id": user_id,
                "original_resume": resume_data,
                "job_description": job_description,
                "preferences": preferences,
                "iteration_count": 0,
                "analysis_history": [],
                "created_at": datetime.utcnow().isoformat()
            }
            
            # Customize analysis based on preferences
            analysis_config = self.customize_analysis_config(preferences)
            
            # Prepare input data
            input_data = {
                "resume_text": resume_data,
                "job_description": job_description,
                "user_id": str(user_id),
                "analysis_context": {
                    **analysis_config,
                    "iteration_type": "initial",
                    "user_preferences": preferences
                }
            }
            
            # Run comprehensive analysis
            analysis_result = await self.assessment_coordinator.process(input_data)
            
            if not analysis_result.success:
                raise Exception(f"Analysis failed: {analysis_result.error}")
            
            # Store result
            self.user_sessions[session_key]["analysis_history"].append({
                "iteration": 1,
                "result": analysis_result.data,
                "confidence": analysis_result.confidence,
                "processing_time": analysis_result.processing_time,
                "timestamp": datetime.utcnow().isoformat()
            })
            
            # Generate personalized insights
            personalized_insights = self.generate_personalized_insights(
                analysis_result.data, preferences
            )
            
            return {
                "success": True,
                "session_key": session_key,
                "analysis": analysis_result.data,
                "confidence": analysis_result.confidence,
                "processing_time": analysis_result.processing_time,
                "personalized_insights": personalized_insights,
                "remaining_iterations": self.max_iterations,
                "can_iterate": True,
                "preferences_applied": analysis_config
            }
            
        except Exception as e:
            logger.error(f"Initial analysis failed for user {user_id}: {str(e)}")
            return {
                "success": False,
                "error": str(e)
            }
    
    async def process_iteration_request(
        self, 
        session_key: str, 
        feedback: Dict[str, Any], 
        improvement_areas: List[str]
    ) -> Dict[str, Any]:
        """
        Handle user feedback and re-analysis request
        
        Args:
            session_key: Session identifier
            feedback: User feedback data
            improvement_areas: Areas user wants to focus on
            
        Returns:
            Refined analysis result
        """
        try:
            session = self.user_sessions.get(session_key)
            if not session:
                return {"success": False, "error": "Session not found"}
            
            if session["iteration_count"] >= self.max_iterations:
                return {"success": False, "error": "Maximum iterations reached"}
            
            # Increment iteration count
            session["iteration_count"] += 1
            
            # Process user feedback
            refined_config = await self.process_user_feedback(
                feedback, improvement_areas, session["preferences"]
            )
            
            # Prepare refined input data
            input_data = {
                "resume_text": session["original_resume"],
                "job_description": session["job_description"],
                "user_id": str(session["user_id"]),
                "analysis_context": {
                    **refined_config,
                    "iteration_type": "refinement",
                    "iteration_number": session["iteration_count"] + 1,
                    "user_feedback": feedback,
                    "improvement_areas": improvement_areas,
                    "previous_analysis": session["analysis_history"][-1]["result"]
                }
            }
            
            # Re-run analysis with refinements
            refined_analysis = await self.assessment_coordinator.process(input_data)
            
            if not refined_analysis.success:
                raise Exception(f"Refined analysis failed: {refined_analysis.error}")
            
            # Store refined result
            session["analysis_history"].append({
                "iteration": session["iteration_count"] + 1,
                "result": refined_analysis.data,
                "confidence": refined_analysis.confidence,
                "processing_time": refined_analysis.processing_time,
                "feedback_applied": feedback,
                "improvements_requested": improvement_areas,
                "timestamp": datetime.utcnow().isoformat()
            })
            
            # Generate improvement summary
            improvement_summary = self.generate_improvement_summary(
                session["analysis_history"][-2]["result"],  # Previous
                refined_analysis.data,  # Current
                feedback,
                improvement_areas
            )
            
            return {
                "success": True,
                "analysis": refined_analysis.data,
                "confidence": refined_analysis.confidence,
                "processing_time": refined_analysis.processing_time,
                "remaining_iterations": self.max_iterations - session["iteration_count"],
                "can_iterate": session["iteration_count"] < self.max_iterations,
                "improvements_made": refined_config["improvements_applied"],
                "improvement_summary": improvement_summary,
                "iteration_number": session["iteration_count"] + 1
            }
            
        except Exception as e:
            logger.error(f"Iteration request failed for session {session_key}: {str(e)}")
            return {
                "success": False,
                "error": str(e)
            }
    
    def customize_analysis_config(self, preferences: Dict[str, Any]) -> Dict[str, Any]:
        """
        Customize analysis based on user preferences
        
        Args:
            preferences: User preferences dictionary
            
        Returns:
            Customized analysis configuration
        """
        config = {
            "roadmap_duration_weeks": preferences.get("roadmapDuration", 12),
            "learning_time_per_week": preferences.get("learningTimeCommitment", 5),
            "priority_areas": preferences.get("priorityAreas", []),
            "career_goal": preferences.get("careerGoals", ""),
            "target_role": preferences.get("targetRole", ""),
            "target_company": preferences.get("targetCompany", ""),
            "salary_expectations": preferences.get("salaryExpectations", ""),
            "preferred_industries": preferences.get("preferredIndustries", []),
            "focus_areas": [],
            "analysis_depth": "standard"
        }
        
        # Adjust analysis depth and focus based on roadmap duration
        roadmap_weeks = config["roadmap_duration_weeks"]
        if roadmap_weeks <= 4:
            config["focus_areas"] = ["immediate_wins", "quick_improvements", "urgent_fixes"]
            config["analysis_depth"] = "focused"
        elif roadmap_weeks <= 12:
            config["focus_areas"] = ["skill_development", "resume_optimization", "market_positioning"]
            config["analysis_depth"] = "standard"
        elif roadmap_weeks <= 24:
            config["focus_areas"] = ["comprehensive_growth", "strategic_planning", "long_term_goals"]
            config["analysis_depth"] = "comprehensive"
        else:
            config["focus_areas"] = ["career_transformation", "industry_transition", "leadership_development"]
            config["analysis_depth"] = "deep"
        
        # Adjust based on career goals
        career_goal = config["career_goal"]
        if career_goal == "job_switch":
            config["focus_areas"].extend(["resume_optimization", "interview_prep", "market_analysis"])
        elif career_goal == "promotion":
            config["focus_areas"].extend(["leadership_skills", "performance_metrics", "internal_networking"])
        elif career_goal == "career_change":
            config["focus_areas"].extend(["transferable_skills", "industry_research", "skill_gaps"])
        elif career_goal == "salary_increase":
            config["focus_areas"].extend(["value_proposition", "negotiation_prep", "market_benchmarking"])
        elif career_goal == "skill_upgrade":
            config["focus_areas"].extend(["technical_skills", "certifications", "learning_path"])
        
        return config
    
    async def process_user_feedback(
        self, 
        feedback: Dict[str, Any], 
        improvement_areas: List[str], 
        original_preferences: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Process user feedback to create refined analysis configuration
        
        Args:
            feedback: User feedback data
            improvement_areas: Areas to focus on
            original_preferences: Original user preferences
            
        Returns:
            Refined configuration for analysis
        """
        refined_config = self.customize_analysis_config(original_preferences)
        
        # Apply feedback-based adjustments
        improvements_applied = []
        
        # Satisfaction-based adjustments
        satisfaction = feedback.get("satisfaction", 5)
        if satisfaction <= 3:
            # Low satisfaction - increase analysis depth
            refined_config["analysis_depth"] = "deep"
            refined_config["focus_areas"].extend(["detailed_recommendations", "alternative_strategies"])
            improvements_applied.append("Increased analysis depth due to low satisfaction")
        
        # Focus area adjustments
        for area in improvement_areas:
            if area == "Skill Recommendations":
                refined_config["focus_areas"].extend(["technical_skills", "soft_skills", "emerging_skills"])
                improvements_applied.append("Enhanced skill analysis and recommendations")
            elif area == "Salary Analysis":
                refined_config["focus_areas"].extend(["market_benchmarking", "compensation_analysis"])
                improvements_applied.append("Added comprehensive salary analysis")
            elif area == "Career Roadmap":
                refined_config["focus_areas"].extend(["milestone_planning", "timeline_optimization"])
                improvements_applied.append("Enhanced career roadmap with detailed milestones")
            elif area == "Resume Feedback":
                refined_config["focus_areas"].extend(["resume_optimization", "ats_optimization"])
                improvements_applied.append("Detailed resume improvement recommendations")
            elif area == "Market Insights":
                refined_config["focus_areas"].extend(["industry_trends", "competitive_analysis"])
                improvements_applied.append("Enhanced market intelligence and trends")
            elif area == "Learning Resources":
                refined_config["focus_areas"].extend(["learning_path", "resource_recommendations"])
                improvements_applied.append("Curated learning resources and pathways")
        
        # Specific feedback processing
        specific_feedback = feedback.get("specific_feedback", "")
        if specific_feedback:
            # Simple keyword-based adjustments (can be enhanced with NLP)
            if "remote" in specific_feedback.lower():
                refined_config["focus_areas"].append("remote_opportunities")
                improvements_applied.append("Added focus on remote work opportunities")
            if "python" in specific_feedback.lower():
                refined_config["focus_areas"].append("python_skills")
                improvements_applied.append("Enhanced Python skill recommendations")
            if "leadership" in specific_feedback.lower():
                refined_config["focus_areas"].append("leadership_development")
                improvements_applied.append("Added leadership development focus")
        
        refined_config["improvements_applied"] = improvements_applied
        return refined_config
    
    def generate_personalized_insights(
        self, 
        analysis_data: Dict[str, Any], 
        preferences: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Generate personalized insights based on analysis and preferences
        
        Args:
            analysis_data: Analysis result data
            preferences: User preferences
            
        Returns:
            Personalized insights dictionary
        """
        insights = {
            "roadmap_recommendations": [],
            "learning_plan": {},
            "career_alignment": {},
            "priority_focus": [],
            "quick_wins": [],
            "long_term_goals": []
        }
        
        try:
            # Extract key data from analysis
            if 'final_assessment' in analysis_data:
                final_assessment = analysis_data['final_assessment']
                executive_summary = final_assessment.get('executive_summary', {})
                
                # Roadmap recommendations based on duration and goals
                roadmap_weeks = preferences.get('roadmapDuration', 12)
                learning_hours = preferences.get('learningTimeCommitment', 5)
                career_goal = preferences.get('careerGoals', '')
                
                insights["roadmap_recommendations"] = [
                    f"Focus on {roadmap_weeks}-week development plan aligned with {career_goal}",
                    f"Allocate {learning_hours} hours per week for skill development",
                    "Prioritize high-impact skills for immediate improvement",
                    "Balance technical and soft skill development"
                ]
                
                # Learning plan
                total_hours = roadmap_weeks * learning_hours
                insights["learning_plan"] = {
                    "total_weeks": roadmap_weeks,
                    "hours_per_week": learning_hours,
                    "total_hours": total_hours,
                    "skill_priorities": preferences.get('priorityAreas', []),
                    "learning_style": "self_paced" if learning_hours <= 5 else "intensive"
                }
                
                # Career alignment
                insights["career_alignment"] = {
                    "stated_goal": career_goal,
                    "target_role": preferences.get('targetRole', ''),
                    "alignment_score": 0.8,  # Calculate based on analysis
                    "recommendations": [
                        "Align skill development with career objectives",
                        "Focus on market-demanded skills in your target area",
                        "Build portfolio projects to demonstrate capabilities"
                    ]
                }
                
                # Priority focus areas
                priority_areas = preferences.get('priorityAreas', [])
                insights["priority_focus"] = [
                    f"Prioritize {area} development based on your goals" 
                    for area in priority_areas[:3]
                ]
                
                # Quick wins (for immediate impact)
                insights["quick_wins"] = [
                    "Update resume with quantified achievements",
                    "Optimize LinkedIn profile with relevant keywords",
                    "Complete one relevant online certification",
                    "Join industry-specific professional groups"
                ]
                
                # Long-term goals
                insights["long_term_goals"] = [
                    f"Achieve {career_goal} within {roadmap_weeks} weeks",
                    "Build expertise in priority skill areas",
                    "Establish thought leadership in your field",
                    "Expand professional network strategically"
                ]
            
            return insights
            
        except Exception as e:
            logger.error(f"Failed to generate personalized insights: {str(e)}")
            return insights
    
    def generate_improvement_summary(
        self, 
        previous_analysis: Dict[str, Any], 
        current_analysis: Dict[str, Any], 
        feedback: Dict[str, Any],
        improvement_areas: List[str]
    ) -> Dict[str, Any]:
        """
        Generate summary of improvements made in the refined analysis
        
        Args:
            previous_analysis: Previous analysis result
            current_analysis: Current refined analysis result
            feedback: User feedback
            improvement_areas: Areas focused on for improvement
            
        Returns:
            Improvement summary
        """
        try:
            # Extract confidence scores for comparison
            prev_confidence = 0.8  # Default if not available
            curr_confidence = 0.85  # Default if not available
            
            if 'metadata' in previous_analysis:
                prev_confidence = previous_analysis['metadata'].get('confidence', 0.8)
            if 'metadata' in current_analysis:
                curr_confidence = current_analysis['metadata'].get('confidence', 0.85)
            
            confidence_change = curr_confidence - prev_confidence
            
            return {
                "feedback_addressed": improvement_areas,
                "confidence_improvement": {
                    "previous": round(prev_confidence * 100, 1),
                    "current": round(curr_confidence * 100, 1),
                    "change": round(confidence_change * 100, 1),
                    "direction": "improved" if confidence_change > 0 else "maintained"
                },
                "improvements_made": [
                    "Enhanced focus on user-specified areas",
                    "Updated recommendations based on feedback",
                    "Refined analysis depth and scope",
                    "Personalized insights for better alignment"
                ],
                "key_adjustments": improvement_areas,
                "satisfaction_addressed": feedback.get("satisfaction", 5) <= 5,
                "specific_feedback_processed": bool(feedback.get("specific_feedback", "").strip())
            }
            
        except Exception as e:
            logger.error(f"Failed to generate improvement summary: {str(e)}")
            return {
                "feedback_addressed": improvement_areas,
                "improvements_made": ["Analysis refined based on user feedback"],
                "key_adjustments": improvement_areas
            }
    
    def get_session_history(self, session_key: str) -> Optional[Dict[str, Any]]:
        """Get complete session history"""
        return self.user_sessions.get(session_key)
    
    def cleanup_old_sessions(self, max_age_hours: int = 24):
        """Clean up old sessions to prevent memory leaks"""
        try:
            current_time = datetime.utcnow()
            sessions_to_remove = []
            
            for session_key, session_data in self.user_sessions.items():
                session_time = datetime.fromisoformat(session_data["created_at"])
                age_hours = (current_time - session_time).total_seconds() / 3600
                
                if age_hours > max_age_hours:
                    sessions_to_remove.append(session_key)
            
            for session_key in sessions_to_remove:
                del self.user_sessions[session_key]
            
            if sessions_to_remove:
                logger.info(f"Cleaned up {len(sessions_to_remove)} old analysis sessions")
                
        except Exception as e:
            logger.error(f"Error cleaning up sessions: {str(e)}") 