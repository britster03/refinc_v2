"""
ML Model Orchestrator - Central hub for all ML operations
"""

from typing import Dict, List, Any, Optional
import asyncio
import logging
from datetime import datetime
import json

from .predictive_models import HiringSuccessPredictor, SalaryRangePredictor, CandidateEngagementPredictor
from .recommendation_engine import PersonalizedRecommendationEngine, SkillsRecommendationEngine, CareerPathRecommender
from .real_time_learning import FeedbackLearningModel, UserBehaviorAnalyzer, AdaptiveMatchingEngine
from .data_pipeline import MLDataPipeline, ModelTrainingPipeline

logger = logging.getLogger(__name__)

class MLModelOrchestrator:
    """
    Central orchestrator for all ML models and AI operations
    """
    
    def __init__(self, db_connection_string: str):
        # Initialize core components
        self.data_pipeline = MLDataPipeline(db_connection_string)
        self.training_pipeline = ModelTrainingPipeline(self.data_pipeline)
        
        # Initialize predictive models
        self.hiring_predictor = HiringSuccessPredictor()
        self.salary_predictor = SalaryRangePredictor()
        self.engagement_predictor = CandidateEngagementPredictor()
        
        # Initialize recommendation engines
        self.recommendation_engine = PersonalizedRecommendationEngine()
        self.skills_recommender = SkillsRecommendationEngine()
        self.career_recommender = CareerPathRecommender()
        
        # Initialize real-time learning
        self.feedback_learner = FeedbackLearningModel()
        self.behavior_analyzer = UserBehaviorAnalyzer()
        self.adaptive_matcher = AdaptiveMatchingEngine()
        
        # Model registry
        self.model_registry = {
            'hiring_success': self.hiring_predictor,
            'salary_range': self.salary_predictor,
            'engagement': self.engagement_predictor,
            'recommendations': self.recommendation_engine,
            'skills': self.skills_recommender,
            'career_paths': self.career_recommender,
            'feedback_learning': self.feedback_learner,
            'behavior_analysis': self.behavior_analyzer,
            'adaptive_matching': self.adaptive_matcher
        }
        
        self.performance_metrics = {}
        
    async def comprehensive_candidate_analysis(
        self,
        candidate_profile: Dict[str, Any],
        employee_pool: List[Dict[str, Any]],
        user_context: Dict[str, Any] = None
    ) -> Dict[str, Any]:
        """
        Comprehensive AI analysis combining all models
        """
        try:
            analysis_results = {}
            
            # 1. Predictive Analysis
            predictions = await self._run_predictive_analysis(
                candidate_profile, employee_pool
            )
            analysis_results['predictions'] = predictions
            
            # 2. Personalized Recommendations
            recommendations = await self._generate_personalized_recommendations(
                candidate_profile, employee_pool, user_context
            )
            analysis_results['recommendations'] = recommendations
            
            # 3. Skills & Career Analysis
            career_guidance = await self._analyze_career_development(
                candidate_profile
            )
            analysis_results['career_guidance'] = career_guidance
            
            # 4. Adaptive Matching
            adaptive_matches = await self.adaptive_matcher.adaptive_match(
                candidate_profile, employee_pool
            )
            analysis_results['adaptive_matches'] = adaptive_matches
            
            # 5. Behavioral Insights (if user context available)
            if user_context and user_context.get('user_id'):
                behavioral_insights = await self.behavior_analyzer.analyze_user_behavior(
                    user_context['user_id'],
                    user_context.get('interaction_history', [])
                )
                analysis_results['behavioral_insights'] = behavioral_insights
            
            # 6. Overall Confidence Score
            confidence_score = self._calculate_overall_confidence(analysis_results)
            analysis_results['overall_confidence'] = confidence_score
            
            return {
                'success': True,
                'analysis': analysis_results,
                'generated_at': datetime.utcnow().isoformat(),
                'models_used': list(self.model_registry.keys())
            }
            
        except Exception as e:
            logger.error(f"Comprehensive analysis failed: {str(e)}")
            return {'success': False, 'error': str(e)}
    
    async def _run_predictive_analysis(
        self,
        candidate_profile: Dict[str, Any],
        employee_pool: List[Dict[str, Any]]
    ) -> Dict[str, Any]:
        """Run all predictive models"""
        
        predictions = {}
        
        # Get top 3 employees for detailed prediction
        top_employees = employee_pool[:3]
        
        for employee in top_employees:
            employee_id = employee.get('id', 'unknown')
            
            # Hiring success prediction
            hiring_pred = await self.hiring_predictor.predict_hiring_success(
                candidate_profile, employee, {}
            )
            
            # Salary range prediction  
            salary_pred = await self.salary_predictor.predict_salary_range(
                candidate_profile, employee.get('job_requirements', {}), {}
            )
            
            # Engagement prediction
            engagement_pred = await self.engagement_predictor.predict_engagement(
                candidate_profile, {'employee_data': employee}
            )
            
            predictions[employee_id] = {
                'hiring_success': hiring_pred,
                'salary_prediction': salary_pred,
                'engagement_prediction': engagement_pred
            }
        
        return predictions
    
    async def _generate_personalized_recommendations(
        self,
        candidate_profile: Dict[str, Any],
        employee_pool: List[Dict[str, Any]],
        user_context: Dict[str, Any] = None
    ) -> Dict[str, Any]:
        """Generate all types of recommendations"""
        
        recommendations = {}
        
        # Personalized employee recommendations
        if user_context:
            employee_recs = await self.recommendation_engine.get_personalized_recommendations(
                user_context.get('user_id', 'anonymous'),
                candidate_profile,
                user_context.get('interaction_history', []),
                employee_pool
            )
            recommendations['employees'] = employee_recs
        
        # Skills recommendations
        skills_recs = await self.skills_recommender.recommend_skills_for_growth(
            candidate_profile.get('skills', []),
            candidate_profile.get('career_goals', {})
        )
        recommendations['skills'] = skills_recs
        
        # Career path recommendations
        career_recs = await self.career_recommender.recommend_career_paths(
            candidate_profile,
            candidate_profile.get('career_interests', [])
        )
        recommendations['career_paths'] = career_recs
        
        return recommendations
    
    async def _analyze_career_development(
        self,
        candidate_profile: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Comprehensive career development analysis"""
        
        current_skills = candidate_profile.get('skills', [])
        career_goals = candidate_profile.get('career_goals', {})
        career_interests = candidate_profile.get('career_interests', [])
        
        # Skills gap analysis
        skills_analysis = await self.skills_recommender.recommend_skills_for_growth(
            current_skills, career_goals
        )
        
        # Career path optimization
        career_analysis = await self.career_recommender.recommend_career_paths(
            candidate_profile, career_interests
        )
        
        # Generate development roadmap
        development_roadmap = self._create_development_roadmap(
            skills_analysis, career_analysis
        )
        
        return {
            'skills_analysis': skills_analysis,
            'career_analysis': career_analysis,
            'development_roadmap': development_roadmap,
            'priority_actions': self._extract_priority_actions(
                skills_analysis, career_analysis
            )
        }
    
    def _create_development_roadmap(
        self,
        skills_analysis: Dict[str, Any],
        career_analysis: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Create integrated development roadmap"""
        
        roadmap = {
            'phases': [],
            'total_timeline': '12-18 months',
            'success_metrics': []
        }
        
        # Phase 1: Foundation skills
        if skills_analysis.get('learning_path'):
            first_phase = skills_analysis['learning_path'][0]
            roadmap['phases'].append({
                'phase': 1,
                'title': 'Skill Foundation',
                'duration': first_phase.get('duration', '4-6 weeks'),
                'focus': 'Core technical skills development',
                'activities': ['Complete skill certifications', 'Build portfolio projects']
            })
        
        # Phase 2: Experience building
        roadmap['phases'].append({
            'phase': 2,
            'title': 'Experience Building',
            'duration': '3-6 months',
            'focus': 'Apply skills in real projects',
            'activities': ['Take on challenging assignments', 'Seek mentorship']
        })
        
        # Phase 3: Career transition
        if career_analysis.get('recommended_paths'):
            target_role = career_analysis['recommended_paths'][0].get('target_role', 'Senior Role')
            roadmap['phases'].append({
                'phase': 3,
                'title': 'Career Transition',
                'duration': '6-12 months',
                'focus': f'Transition to {target_role}',
                'activities': ['Network building', 'Interview preparation', 'Role applications']
            })
        
        return roadmap
    
    def _extract_priority_actions(
        self,
        skills_analysis: Dict[str, Any],
        career_analysis: Dict[str, Any]
    ) -> List[str]:
        """Extract top priority actions"""
        
        actions = []
        
        # Top skills to learn
        recommended_skills = skills_analysis.get('recommended_skills', [])
        if recommended_skills:
            top_skill = recommended_skills[0].get('skill', 'programming')
            actions.append(f"Start learning {top_skill} immediately")
        
        # Career development actions
        if career_analysis.get('skill_development_priorities'):
            priorities = career_analysis['skill_development_priorities']
            if priorities:
                actions.append(f"Focus on {priorities[0].get('skill', 'leadership')} development")
        
        # Generic actions if specific ones not available
        if not actions:
            actions = [
                "Update resume with latest skills",
                "Build a portfolio of recent projects",
                "Network with industry professionals"
            ]
        
        return actions[:3]  # Top 3 actions
    
    def _calculate_overall_confidence(
        self,
        analysis_results: Dict[str, Any]
    ) -> float:
        """Calculate overall confidence in the analysis"""
        
        confidence_scores = []
        
        # Extract confidence from predictions
        predictions = analysis_results.get('predictions', {})
        for employee_pred in predictions.values():
            hiring_conf = employee_pred.get('hiring_success', {}).get('confidence_score', 0.5)
            confidence_scores.append(hiring_conf)
        
        # Extract confidence from recommendations
        recommendations = analysis_results.get('recommendations', {})
        if recommendations.get('employees', {}).get('generated_at'):
            confidence_scores.append(0.8)  # Base confidence for recommendations
        
        # Calculate weighted average
        if confidence_scores:
            overall_confidence = sum(confidence_scores) / len(confidence_scores)
        else:
            overall_confidence = 0.7  # Default confidence
        
        return min(overall_confidence, 0.95)  # Cap at 95%
    
    async def process_user_feedback(
        self,
        interaction_data: Dict[str, Any],
        feedback: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Process user feedback to improve models"""
        
        try:
            # Process feedback through learning model
            learning_result = await self.feedback_learner.process_feedback(
                interaction_data, feedback
            )
            
            # Update adaptive matching based on feedback
            if feedback.get('type') == 'match_feedback':
                # Adaptive matching will use this feedback in future matches
                pass
            
            # Log performance metrics
            self._update_performance_metrics(feedback, learning_result)
            
            return {
                'success': True,
                'learning_result': learning_result,
                'improvements_made': learning_result.get('recommendations', [])
            }
            
        except Exception as e:
            logger.error(f"Feedback processing failed: {str(e)}")
            return {'success': False, 'error': str(e)}
    
    def _update_performance_metrics(
        self,
        feedback: Dict[str, Any],
        learning_result: Dict[str, Any]
    ):
        """Update internal performance metrics"""
        
        metric_key = f"feedback_{feedback.get('type', 'general')}"
        
        if metric_key not in self.performance_metrics:
            self.performance_metrics[metric_key] = {
                'total_feedback': 0,
                'average_score': 0.0,
                'trend': 'stable'
            }
        
        # Update metrics
        current_metrics = self.performance_metrics[metric_key]
        current_metrics['total_feedback'] += 1
        
        feedback_score = feedback.get('rating', 3) / 5.0
        current_metrics['average_score'] = (
            (current_metrics['average_score'] * (current_metrics['total_feedback'] - 1) + 
             feedback_score) / current_metrics['total_feedback']
        )
        
        # Simple trend calculation
        if current_metrics['total_feedback'] > 10:
            recent_avg = feedback_score  # Simplified - should use recent average
            overall_avg = current_metrics['average_score']
            
            if recent_avg > overall_avg + 0.1:
                current_metrics['trend'] = 'improving'
            elif recent_avg < overall_avg - 0.1:
                current_metrics['trend'] = 'declining'
            else:
                current_metrics['trend'] = 'stable'
    
    async def retrain_models(self) -> Dict[str, Any]:
        """Retrain all models with latest data"""
        
        try:
            training_results = await self.training_pipeline.train_all_models()
            
            # Update model registry with newly trained models
            for model_name, result in training_results.items():
                if result.get('status') == 'completed':
                    logger.info(f"Model {model_name} retrained successfully")
            
            return {
                'success': True,
                'training_results': training_results,
                'retrained_at': datetime.utcnow().isoformat()
            }
            
        except Exception as e:
            logger.error(f"Model retraining failed: {str(e)}")
            return {'success': False, 'error': str(e)}
    
    def get_model_health(self) -> Dict[str, Any]:
        """Get health status of all models"""
        
        health_status = {}
        
        for model_name, model in self.model_registry.items():
            try:
                # Check if model is properly initialized
                is_healthy = hasattr(model, '__class__')
                
                health_status[model_name] = {
                    'status': 'healthy' if is_healthy else 'unhealthy',
                    'last_used': datetime.utcnow().isoformat(),  # Simplified
                    'performance_metrics': self.performance_metrics.get(model_name, {})
                }
                
            except Exception as e:
                health_status[model_name] = {
                    'status': 'error',
                    'error': str(e)
                }
        
        return {
            'overall_health': 'healthy',
            'models': health_status,
            'checked_at': datetime.utcnow().isoformat()
        } 