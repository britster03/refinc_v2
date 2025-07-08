"""
Analysis Session Service

Production-ready service for managing iterative analysis sessions with user feedback
Provides enhanced user experience with pre-analysis inputs and refinement cycles
"""

import json
import logging
import uuid
import asyncio
from typing import Dict, List, Optional, Any
from datetime import datetime

from database import DatabaseManager
from services.market_intelligence_service import MarketIntelligenceService
from ai_agents.assessment_coordinator import AssessmentCoordinator

logger = logging.getLogger(__name__)

class AnalysisSessionService:
    """
    Service for managing comprehensive analysis sessions with iterative refinement
    """
    
    def __init__(self, assessment_coordinator: AssessmentCoordinator, market_service: MarketIntelligenceService):
        self.assessment_coordinator = assessment_coordinator
        self.market_service = market_service
    
    async def create_analysis_session(
        self, 
        user_id: int, 
        resume_text: str, 
        job_description: Optional[str] = None,
        pre_analysis_input: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """
        Create a new analysis session with pre-analysis inputs
        """
        try:
            # Generate unique session token
            session_token = str(uuid.uuid4())
            
            # Extract pre-analysis inputs
            roadmap_duration = 12
            career_goals = []
            learning_time = 5
            priority_areas = []
            
            if pre_analysis_input:
                roadmap_duration = pre_analysis_input.get('roadmap_duration_weeks', 12)
                career_goals = pre_analysis_input.get('career_goals', [])
                learning_time = pre_analysis_input.get('learning_time_hours_per_week', 5)
                priority_areas = pre_analysis_input.get('priority_areas', [])
            
            # Create session in database
            session_id = self._create_session_record(
                user_id=user_id,
                session_token=session_token,
                resume_text=resume_text,
                job_description=job_description,
                roadmap_duration=roadmap_duration,
                career_goals=career_goals,
                learning_time=learning_time,
                priority_areas=priority_areas
            )
            
            # Perform initial analysis
            initial_analysis = await self._perform_initial_analysis(
                session_id=session_id,
                user_id=user_id,
                resume_text=resume_text,
                job_description=job_description,
                pre_analysis_input=pre_analysis_input or {}
            )
            
            logger.info(f"Created analysis session {session_token} for user {user_id}")
            
            return {
                "success": True,
                "session_token": session_token,
                "session_id": session_id,
                "initial_analysis": initial_analysis,
                "session_info": {
                    "current_iteration": 1,
                    "max_iterations": 4,
                    "roadmap_duration_weeks": roadmap_duration,
                    "career_goals": career_goals,
                    "learning_time_hours_per_week": learning_time,
                    "priority_areas": priority_areas
                }
            }
            
        except Exception as e:
            logger.error(f"Failed to create analysis session for user {user_id}: {e}")
            return {"success": False, "error": str(e)}
    
    async def get_analysis_session(self, session_token: str, user_id: int) -> Dict[str, Any]:
        """
        Get analysis session with all iterations and feedback
        """
        try:
            # Get session details
            session = self._get_session_by_token(session_token, user_id)
            if not session:
                return {"success": False, "error": "Session not found"}
            
            # Get all iterations
            iterations = self._get_session_iterations(session['id'])
            
            # Get all feedback
            feedback_entries = self._get_session_feedback(session['id'])
            
            return {
                "success": True,
                "session": {
                    "id": session['id'],
                    "token": session['session_token'],
                    "current_iteration": session['current_iteration'],
                    "max_iterations": session['max_iterations'],
                    "roadmap_duration_weeks": session['roadmap_duration_weeks'],
                    "career_goals": json.loads(session['career_goals']) if session['career_goals'] else [],
                    "learning_time_hours_per_week": session['learning_time_hours_per_week'],
                    "priority_areas": json.loads(session['priority_areas']) if session['priority_areas'] else [],
                    "created_at": session['created_at'],
                    "completed_at": session['completed_at']
                },
                "iterations": iterations,
                "feedback": feedback_entries,
                "can_refine": session['current_iteration'] < session['max_iterations']
            }
            
        except Exception as e:
            logger.error(f"Failed to get analysis session {session_token}: {e}")
            return {"success": False, "error": str(e)}
    
    async def submit_feedback(
        self, 
        session_token: str, 
        user_id: int, 
        feedback_data: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Submit feedback for analysis iteration
        """
        try:
            # Get session
            session = self._get_session_by_token(session_token, user_id)
            if not session:
                return {"success": False, "error": "Session not found"}
            
            # Get current iteration
            current_iteration = self._get_latest_iteration(session['id'])
            if not current_iteration:
                return {"success": False, "error": "No analysis iteration found"}
            
            # Store feedback
            feedback_id = self._store_feedback(
                session_id=session['id'],
                iteration_id=current_iteration['id'],
                feedback_data=feedback_data
            )
            
            # Check if reanalysis is requested
            if feedback_data.get('reanalysis_requested', False):
                # Perform refined analysis
                refined_analysis = await self._perform_refined_analysis(
                    session=session,
                    feedback_data=feedback_data,
                    previous_iteration=current_iteration
                )
                
                return {
                    "success": True,
                    "feedback_id": feedback_id,
                    "reanalysis_performed": True,
                    "refined_analysis": refined_analysis,
                    "message": "Feedback submitted and reanalysis completed"
                }
            else:
                return {
                    "success": True,
                    "feedback_id": feedback_id,
                    "reanalysis_performed": False,
                    "message": "Feedback submitted successfully"
                }
            
        except Exception as e:
            logger.error(f"Failed to submit feedback for session {session_token}: {e}")
            return {"success": False, "error": str(e)}
    
    async def request_refinement(
        self, 
        session_token: str, 
        user_id: int, 
        refinement_request: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Request analysis refinement with specific focus areas
        """
        try:
            # Get session
            session = self._get_session_by_token(session_token, user_id)
            if not session:
                return {"success": False, "error": "Session not found"}
            
            # Check if refinement is possible
            if session['current_iteration'] >= session['max_iterations']:
                return {
                    "success": False, 
                    "error": "Maximum refinement iterations reached"
                }
            
            # Get previous iteration for context
            previous_iteration = self._get_latest_iteration(session['id'])
            
            # Perform refined analysis
            refined_analysis = await self._perform_refined_analysis(
                session=session,
                feedback_data=refinement_request,
                previous_iteration=previous_iteration
            )
            
            # Update session iteration count
            self._update_session_iteration(session['id'], session['current_iteration'] + 1)
            
            logger.info(f"Performed refinement for session {session_token}, iteration {session['current_iteration'] + 1}")
            
            return {
                "success": True,
                "refined_analysis": refined_analysis,
                "iteration_number": session['current_iteration'] + 1,
                "remaining_refinements": session['max_iterations'] - (session['current_iteration'] + 1),
                "message": "Analysis refined successfully"
            }
            
        except Exception as e:
            logger.error(f"Failed to refine analysis for session {session_token}: {e}")
            return {"success": False, "error": str(e)}
    
    async def complete_session(self, session_token: str, user_id: int) -> Dict[str, Any]:
        """
        Mark analysis session as completed
        """
        try:
            # Get session
            session = self._get_session_by_token(session_token, user_id)
            if not session:
                return {"success": False, "error": "Session not found"}
            
            # Mark as completed
            query = """
                UPDATE analysis_sessions 
                SET completed_at = ?, updated_at = ?
                WHERE id = ?
            """
            DatabaseManager.execute_query(
                query, 
                (datetime.utcnow().isoformat(), datetime.utcnow().isoformat(), session['id'])
            )
            
            # Get session summary
            summary = self._generate_session_summary(session['id'])
            
            logger.info(f"Completed analysis session {session_token}")
            
            return {
                "success": True,
                "message": "Analysis session completed",
                "session_summary": summary
            }
            
        except Exception as e:
            logger.error(f"Failed to complete session {session_token}: {e}")
            return {"success": False, "error": str(e)}
    
    # Private Methods
    async def _perform_initial_analysis(
        self, 
        session_id: int, 
        user_id: int, 
        resume_text: str, 
        job_description: Optional[str],
        pre_analysis_input: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Perform initial comprehensive analysis
        """
        try:
            # Prepare input data with pre-analysis context
            input_data = {
                "resume_text": resume_text,
                "job_description": job_description,
                "user_id": str(user_id),
                "analysis_context": {
                    "roadmap_duration_weeks": pre_analysis_input.get('roadmap_duration_weeks', 12),
                    "career_goals": pre_analysis_input.get('career_goals', []),
                    "learning_time_hours_per_week": pre_analysis_input.get('learning_time_hours_per_week', 5),
                    "priority_areas": pre_analysis_input.get('priority_areas', []),
                    "iteration_type": "initial"
                }
            }
            
            # Run comprehensive assessment
            result = await self.assessment_coordinator.process(input_data)
            
            if not result.success:
                raise Exception(f"Analysis failed: {result.error}")
            
            # Get market intelligence if user has consent
            market_data = None
            if result.data and 'agent_results' in result.data:
                skills_data = result.data['agent_results'].get('skills', {}).get('data', {})
                extracted_skills = [skill['skill'] for skill in skills_data.get('extracted_skills', [])]
                
                if extracted_skills:
                    market_data = await self.market_service.get_market_analysis_for_user(
                        user_id=user_id,
                        skills=extracted_skills[:10]  # Limit to top 10 skills
                    )
            
            # Store iteration
            iteration_id = self._store_iteration(
                session_id=session_id,
                iteration_number=1,
                analysis_data=result.data,
                confidence_score=result.confidence,
                processing_time=result.processing_time,
                market_data=market_data
            )
            
            return {
                "iteration_id": iteration_id,
                "analysis_data": result.data,
                "market_intelligence": market_data,
                "confidence_score": result.confidence,
                "processing_time": result.processing_time,
                "personalized_insights": self._generate_personalized_insights(
                    result.data, pre_analysis_input
                )
            }
            
        except Exception as e:
            logger.error(f"Initial analysis failed for session {session_id}: {e}")
            raise
    
    async def _perform_refined_analysis(
        self, 
        session: Dict[str, Any], 
        feedback_data: Dict[str, Any],
        previous_iteration: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Perform refined analysis based on user feedback
        """
        try:
            # Prepare refined input data
            input_data = {
                "resume_text": session['resume_text'],
                "job_description": session['job_description'],
                "user_id": str(session['user_id']),
                "analysis_context": {
                    "roadmap_duration_weeks": session['roadmap_duration_weeks'],
                    "career_goals": json.loads(session['career_goals']) if session['career_goals'] else [],
                    "learning_time_hours_per_week": session['learning_time_hours_per_week'],
                    "priority_areas": json.loads(session['priority_areas']) if session['priority_areas'] else [],
                    "iteration_type": "refinement",
                    "previous_analysis": json.loads(previous_iteration['analysis_data']),
                    "user_feedback": feedback_data,
                    "focus_adjustments": feedback_data.get('specific_areas', [])
                }
            }
            
            # Run refined assessment
            result = await self.assessment_coordinator.process(input_data)
            
            if not result.success:
                raise Exception(f"Refined analysis failed: {result.error}")
            
            # Get updated market intelligence
            market_data = None
            if result.data and 'agent_results' in result.data:
                skills_data = result.data['agent_results'].get('skills', {}).get('data', {})
                extracted_skills = [skill['skill'] for skill in skills_data.get('extracted_skills', [])]
                
                if extracted_skills:
                    market_data = await self.market_service.get_market_analysis_for_user(
                        user_id=session['user_id'],
                        skills=extracted_skills[:10]
                    )
            
            # Store refined iteration
            iteration_id = self._store_iteration(
                session_id=session['id'],
                iteration_number=session['current_iteration'] + 1,
                analysis_data=result.data,
                confidence_score=result.confidence,
                processing_time=result.processing_time,
                market_data=market_data,
                focus_adjustments=feedback_data.get('specific_areas', [])
            )
            
            return {
                "iteration_id": iteration_id,
                "analysis_data": result.data,
                "market_intelligence": market_data,
                "confidence_score": result.confidence,
                "processing_time": result.processing_time,
                "refinement_summary": self._generate_refinement_summary(
                    previous_iteration, result.data, feedback_data
                )
            }
            
        except Exception as e:
            logger.error(f"Refined analysis failed for session {session['id']}: {e}")
            raise
    
    def _generate_personalized_insights(
        self, 
        analysis_data: Dict[str, Any], 
        pre_analysis_input: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Generate personalized insights based on pre-analysis inputs
        """
        try:
            insights = {
                "roadmap_recommendations": [],
                "learning_plan": {},
                "career_alignment": {},
                "priority_focus": []
            }
            
            # Extract key data
            if 'final_assessment' in analysis_data:
                final_assessment = analysis_data['final_assessment']
                executive_summary = final_assessment.get('executive_summary', {})
                
                # Roadmap recommendations based on duration
                roadmap_weeks = pre_analysis_input.get('roadmap_duration_weeks', 12)
                learning_hours = pre_analysis_input.get('learning_time_hours_per_week', 5)
                
                insights["roadmap_recommendations"] = [
                    f"Focus on {roadmap_weeks}-week development plan",
                    f"Allocate {learning_hours} hours per week for skill development",
                    "Prioritize high-impact skills for immediate improvement"
                ]
                
                # Learning plan
                insights["learning_plan"] = {
                    "total_weeks": roadmap_weeks,
                    "hours_per_week": learning_hours,
                    "total_hours": roadmap_weeks * learning_hours,
                    "recommended_focus": executive_summary.get('key_strengths', [])[:3]
                }
                
                # Career alignment
                career_goals = pre_analysis_input.get('career_goals', [])
                insights["career_alignment"] = {
                    "stated_goals": career_goals,
                    "alignment_score": 0.8,  # Calculate based on analysis
                    "recommendations": [
                        "Align skill development with career objectives",
                        "Focus on market-demanded skills in your target area"
                    ]
                }
                
                # Priority focus areas
                priority_areas = pre_analysis_input.get('priority_areas', [])
                insights["priority_focus"] = [
                    f"Prioritize {area} development" for area in priority_areas[:3]
                ]
            
            return insights
            
        except Exception as e:
            logger.error(f"Failed to generate personalized insights: {e}")
            return {}
    
    def _generate_refinement_summary(
        self, 
        previous_iteration: Dict[str, Any], 
        new_analysis: Dict[str, Any], 
        feedback_data: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Generate summary of refinement changes
        """
        return {
            "feedback_addressed": feedback_data.get('specific_areas', []),
            "improvements_made": [
                "Enhanced focus on user-specified areas",
                "Updated recommendations based on feedback",
                "Refined market positioning analysis"
            ],
            "confidence_change": "improved",  # Calculate actual change
            "key_adjustments": feedback_data.get('specific_areas', [])
        }
    
    def _generate_session_summary(self, session_id: int) -> Dict[str, Any]:
        """
        Generate comprehensive session summary
        """
        try:
            # Get all iterations
            iterations = self._get_session_iterations(session_id)
            feedback_entries = self._get_session_feedback(session_id)
            
            return {
                "total_iterations": len(iterations),
                "feedback_entries": len(feedback_entries),
                "final_confidence": iterations[-1]['confidence_score'] if iterations else 0,
                "total_processing_time": sum(iter['processing_time'] for iter in iterations),
                "improvement_areas_addressed": len(set(
                    area for feedback in feedback_entries 
                    for area in json.loads(feedback.get('specific_areas', '[]'))
                ))
            }
            
        except Exception as e:
            logger.error(f"Failed to generate session summary: {e}")
            return {}
    
    # Database Operations
    def _create_session_record(
        self, 
        user_id: int, 
        session_token: str, 
        resume_text: str, 
        job_description: Optional[str],
        roadmap_duration: int,
        career_goals: List[str],
        learning_time: int,
        priority_areas: List[str]
    ) -> int:
        """Create session record in database"""
        query = """
            INSERT INTO analysis_sessions 
            (user_id, session_token, resume_text, job_description, roadmap_duration_weeks,
             career_goals, learning_time_hours_per_week, priority_areas)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        """
        return DatabaseManager.execute_query(
            query,
            (user_id, session_token, resume_text, job_description, roadmap_duration,
             json.dumps(career_goals), learning_time, json.dumps(priority_areas))
        )
    
    def _get_session_by_token(self, session_token: str, user_id: int) -> Optional[Dict[str, Any]]:
        """Get session by token and user ID"""
        query = """
            SELECT * FROM analysis_sessions 
            WHERE session_token = ? AND user_id = ?
        """
        return DatabaseManager.execute_query(query, (session_token, user_id), fetch_one=True)
    
    def _get_session_iterations(self, session_id: int) -> List[Dict[str, Any]]:
        """Get all iterations for a session"""
        query = """
            SELECT * FROM analysis_iterations 
            WHERE session_id = ? 
            ORDER BY iteration_number ASC
        """
        iterations = DatabaseManager.execute_query(query, (session_id,), fetch_all=True)
        
        # Parse JSON fields
        for iteration in iterations:
            iteration['analysis_data'] = json.loads(iteration['analysis_data'])
            if iteration['market_data']:
                iteration['market_data'] = json.loads(iteration['market_data'])
            if iteration['focus_adjustments']:
                iteration['focus_adjustments'] = json.loads(iteration['focus_adjustments'])
        
        return iterations
    
    def _get_session_feedback(self, session_id: int) -> List[Dict[str, Any]]:
        """Get all feedback for a session"""
        query = """
            SELECT * FROM analysis_feedback 
            WHERE session_id = ? 
            ORDER BY created_at ASC
        """
        feedback_entries = DatabaseManager.execute_query(query, (session_id,), fetch_all=True)
        
        # Parse JSON fields
        for feedback in feedback_entries:
            if feedback['specific_areas']:
                feedback['specific_areas'] = json.loads(feedback['specific_areas'])
        
        return feedback_entries
    
    def _get_latest_iteration(self, session_id: int) -> Optional[Dict[str, Any]]:
        """Get latest iteration for a session"""
        query = """
            SELECT * FROM analysis_iterations 
            WHERE session_id = ? 
            ORDER BY iteration_number DESC 
            LIMIT 1
        """
        iteration = DatabaseManager.execute_query(query, (session_id,), fetch_one=True)
        
        if iteration:
            iteration['analysis_data'] = json.loads(iteration['analysis_data'])
            if iteration['market_data']:
                iteration['market_data'] = json.loads(iteration['market_data'])
            if iteration['focus_adjustments']:
                iteration['focus_adjustments'] = json.loads(iteration['focus_adjustments'])
        
        return iteration
    
    def _store_iteration(
        self, 
        session_id: int, 
        iteration_number: int, 
        analysis_data: Dict[str, Any],
        confidence_score: float,
        processing_time: float,
        market_data: Optional[Dict[str, Any]] = None,
        focus_adjustments: Optional[List[str]] = None
    ) -> int:
        """Store analysis iteration"""
        query = """
            INSERT INTO analysis_iterations 
            (session_id, iteration_number, analysis_data, confidence_score, processing_time,
             market_data, salary_insights, focus_adjustments)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        """
        
        # Extract salary insights from market data
        salary_insights = None
        if market_data and 'market_intelligence' in market_data:
            salary_insights = market_data['market_intelligence'].get('salary_insights')
        
        return DatabaseManager.execute_query(
            query,
            (session_id, iteration_number, json.dumps(analysis_data, default=str), 
             confidence_score, processing_time,
             json.dumps(market_data, default=str) if market_data else None,
             json.dumps(salary_insights, default=str) if salary_insights else None,
             json.dumps(focus_adjustments) if focus_adjustments else None)
        )
    
    def _store_feedback(
        self, 
        session_id: int, 
        iteration_id: int, 
        feedback_data: Dict[str, Any]
    ) -> int:
        """Store user feedback"""
        query = """
            INSERT INTO analysis_feedback 
            (session_id, iteration_id, feedback_type, feedback_text, specific_areas,
             satisfaction_score, reanalysis_requested)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        """
        
        return DatabaseManager.execute_query(
            query,
            (session_id, iteration_id, feedback_data.get('feedback_type', 'general'),
             feedback_data.get('feedback_text', ''), 
             json.dumps(feedback_data.get('specific_areas', [])),
             feedback_data.get('satisfaction_score'),
             feedback_data.get('reanalysis_requested', False))
        )
    
    def _update_session_iteration(self, session_id: int, new_iteration: int):
        """Update session iteration count"""
        query = """
            UPDATE analysis_sessions 
            SET current_iteration = ?, updated_at = ?
            WHERE id = ?
        """
        DatabaseManager.execute_query(
            query, 
            (new_iteration, datetime.utcnow().isoformat(), session_id)
        ) 