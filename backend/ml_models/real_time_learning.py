"""
Real-Time Learning and Adaptive ML Models

Models that continuously learn and adapt from:
- User feedback and interactions
- Behavioral patterns
- Performance metrics
- Market changes
"""

import numpy as np
import pandas as pd
from sklearn.linear_model import SGDClassifier, SGDRegressor
from sklearn.preprocessing import StandardScaler
import logging
from typing import Dict, List, Optional, Any, Tuple
from datetime import datetime, timedelta
import asyncio
import json
from collections import deque

logger = logging.getLogger(__name__)

class FeedbackLearningModel:
    """
    Continuously learning model that adapts based on user feedback
    """
    
    def __init__(self, model_type: str = "classification"):
        self.model_type = model_type
        
        if model_type == "classification":
            self.model = SGDClassifier(
                loss='log_loss',
                learning_rate='adaptive',
                eta0=0.01,
                random_state=42
            )
        else:
            self.model = SGDRegressor(
                loss='squared_error',
                learning_rate='adaptive',
                eta0=0.01,
                random_state=42
            )
        
        self.scaler = StandardScaler()
        self.feedback_buffer = deque(maxlen=1000)  # Store recent feedback
        self.is_initialized = False
        self.performance_history = []
        
    async def process_feedback(
        self,
        interaction_data: Dict[str, Any],
        feedback: Dict[str, Any],
        update_model: bool = True
    ) -> Dict[str, Any]:
        """
        Process user feedback and optionally update model
        
        Args:
            interaction_data: The original interaction/recommendation data
            feedback: User feedback (rating, success, etc.)
            update_model: Whether to immediately update the model
            
        Returns:
            Processing results and model performance metrics
        """
        try:
            # Store feedback in buffer
            feedback_entry = {
                "interaction_id": interaction_data.get("id"),
                "features": self._extract_features(interaction_data),
                "feedback_score": self._normalize_feedback(feedback),
                "timestamp": datetime.utcnow(),
                "feedback_type": feedback.get("type", "rating")
            }
            
            self.feedback_buffer.append(feedback_entry)
            
            if update_model and len(self.feedback_buffer) >= 10:
                model_update_result = await self._update_model_with_feedback()
            else:
                model_update_result = {"status": "feedback_stored", "model_updated": False}
            
            # Analyze feedback patterns
            feedback_analysis = self._analyze_feedback_patterns()
            
            return {
                "feedback_processed": True,
                "model_update": model_update_result,
                "feedback_analysis": feedback_analysis,
                "buffer_size": len(self.feedback_buffer),
                "recommendations": self._generate_improvement_recommendations(feedback_analysis)
            }
            
        except Exception as e:
            logger.error(f"Feedback processing failed: {str(e)}")
            return {"error": str(e), "feedback_processed": False}
    
    async def _update_model_with_feedback(self) -> Dict[str, Any]:
        """Update model with recent feedback"""
        try:
            # Prepare training data from feedback buffer
            recent_feedback = list(self.feedback_buffer)[-100:]  # Last 100 feedbacks
            
            if len(recent_feedback) < 5:
                return {"status": "insufficient_data", "model_updated": False}
            
            X = np.array([fb["features"] for fb in recent_feedback])
            y = np.array([fb["feedback_score"] for fb in recent_feedback])
            
            # Initialize or fit scaler
            if not self.is_initialized:
                X_scaled = self.scaler.fit_transform(X)
                self.model.fit(X_scaled, y)
                self.is_initialized = True
                update_type = "initial_training"
            else:
                X_scaled = self.scaler.transform(X)
                # Partial fit for online learning
                self.model.partial_fit(X_scaled, y)
                update_type = "incremental_update"
            
            # Evaluate model performance
            predictions = self.model.predict(X_scaled)
            performance_metrics = self._calculate_performance_metrics(y, predictions)
            
            self.performance_history.append({
                "timestamp": datetime.utcnow(),
                "metrics": performance_metrics,
                "update_type": update_type,
                "training_samples": len(recent_feedback)
            })
            
            return {
                "status": "success",
                "model_updated": True,
                "update_type": update_type,
                "performance_metrics": performance_metrics,
                "training_samples": len(recent_feedback)
            }
            
        except Exception as e:
            logger.error(f"Model update failed: {str(e)}")
            return {"status": "error", "error": str(e), "model_updated": False}
    
    def _extract_features(self, interaction_data: Dict[str, Any]) -> List[float]:
        """Extract features from interaction data"""
        # Extract relevant numerical features
        features = [
            interaction_data.get("match_score", 0.5),
            interaction_data.get("user_experience_years", 0),
            len(interaction_data.get("skills_matched", [])),
            interaction_data.get("salary_alignment", 0.5),
            interaction_data.get("location_match", 1.0),
            interaction_data.get("company_rating", 0.5),
            interaction_data.get("response_time_hours", 24),
            interaction_data.get("employee_success_rate", 0.5)
        ]
        
        return features
    
    def _normalize_feedback(self, feedback: Dict[str, Any]) -> float:
        """Normalize feedback to 0-1 scale"""
        feedback_type = feedback.get("type", "rating")
        
        if feedback_type == "rating":
            # Assume rating is 1-5 scale
            rating = feedback.get("rating", 3)
            return (rating - 1) / 4  # Normalize to 0-1
        
        elif feedback_type == "success":
            return 1.0 if feedback.get("successful", False) else 0.0
        
        elif feedback_type == "engagement":
            # Engagement score already 0-1
            return feedback.get("engagement_score", 0.5)
        
        else:
            return 0.5  # Default neutral score
    
    def _analyze_feedback_patterns(self) -> Dict[str, Any]:
        """Analyze patterns in recent feedback"""
        if len(self.feedback_buffer) < 5:
            return {"status": "insufficient_data"}
        
        recent_feedback = list(self.feedback_buffer)[-50:]  # Last 50 feedbacks
        scores = [fb["feedback_score"] for fb in recent_feedback]
        
        # Calculate basic statistics
        avg_score = np.mean(scores)
        score_trend = self._calculate_trend(scores)
        
        # Identify feedback types distribution
        feedback_types = {}
        for fb in recent_feedback:
            fb_type = fb.get("feedback_type", "unknown")
            feedback_types[fb_type] = feedback_types.get(fb_type, 0) + 1
        
        # Identify low-performing features
        low_performance_features = self._identify_problematic_features(recent_feedback)
        
        return {
            "average_feedback_score": avg_score,
            "feedback_trend": score_trend,
            "feedback_distribution": feedback_types,
            "problematic_areas": low_performance_features,
            "total_feedback_count": len(recent_feedback),
            "performance_category": self._categorize_performance(avg_score)
        }
    
    def _calculate_trend(self, scores: List[float]) -> str:
        """Calculate trend in feedback scores"""
        if len(scores) < 3:
            return "insufficient_data"
        
        # Simple trend calculation using first and last third
        first_third = np.mean(scores[:len(scores)//3])
        last_third = np.mean(scores[-len(scores)//3:])
        
        diff = last_third - first_third
        
        if diff > 0.1:
            return "improving"
        elif diff < -0.1:
            return "declining"
        else:
            return "stable"
    
    def _identify_problematic_features(self, feedback_data: List[Dict[str, Any]]) -> List[str]:
        """Identify features associated with low feedback scores"""
        problematic_areas = []
        
        # Group feedback by score ranges
        low_score_feedback = [fb for fb in feedback_data if fb["feedback_score"] < 0.4]
        
        if len(low_score_feedback) > len(feedback_data) * 0.3:  # More than 30% low scores
            # Analyze common characteristics of low-scoring interactions
            avg_features = np.mean([fb["features"] for fb in low_score_feedback], axis=0)
            
            feature_names = [
                "match_score", "experience_years", "skills_count", "salary_alignment",
                "location_match", "company_rating", "response_time", "success_rate"
            ]
            
            for i, (feature_val, feature_name) in enumerate(zip(avg_features, feature_names)):
                if feature_name == "match_score" and feature_val < 0.5:
                    problematic_areas.append("Low match scores")
                elif feature_name == "response_time" and feature_val > 48:
                    problematic_areas.append("Slow response times")
                elif feature_name == "salary_alignment" and feature_val < 0.4:
                    problematic_areas.append("Poor salary alignment")
        
        return problematic_areas
    
    def _categorize_performance(self, avg_score: float) -> str:
        """Categorize overall performance based on average score"""
        if avg_score >= 0.8:
            return "excellent"
        elif avg_score >= 0.6:
            return "good"
        elif avg_score >= 0.4:
            return "fair"
        else:
            return "poor"
    
    def _generate_improvement_recommendations(self, analysis: Dict[str, Any]) -> List[str]:
        """Generate recommendations for improvement based on analysis"""
        recommendations = []
        
        performance_category = analysis.get("performance_category", "fair")
        trend = analysis.get("feedback_trend", "stable")
        problematic_areas = analysis.get("problematic_areas", [])
        
        if performance_category in ["poor", "fair"]:
            recommendations.append("Review and improve matching algorithm parameters")
            
        if trend == "declining":
            recommendations.append("Investigate recent changes that may be affecting performance")
            
        if "Low match scores" in problematic_areas:
            recommendations.append("Enhance skills matching and compatibility scoring")
            
        if "Slow response times" in problematic_areas:
            recommendations.append("Optimize response time predictions and employee selection")
            
        if "Poor salary alignment" in problematic_areas:
            recommendations.append("Improve salary range prediction accuracy")
        
        if not recommendations:
            recommendations.append("Continue monitoring performance and gathering feedback")
        
        return recommendations
    
    def _calculate_performance_metrics(self, y_true: np.ndarray, y_pred: np.ndarray) -> Dict[str, float]:
        """Calculate performance metrics for model evaluation"""
        if self.model_type == "classification":
            # For classification, calculate accuracy
            accuracy = np.mean(y_true == y_pred)
            return {"accuracy": accuracy}
        else:
            # For regression, calculate MAE and RMSE
            mae = np.mean(np.abs(y_true - y_pred))
            rmse = np.sqrt(np.mean((y_true - y_pred) ** 2))
            return {"mae": mae, "rmse": rmse}


class UserBehaviorAnalyzer:
    """
    Analyzes user behavior patterns to improve personalization
    """
    
    def __init__(self):
        self.behavior_patterns = {}
        self.user_segments = {}
        
    async def analyze_user_behavior(
        self,
        user_id: str,
        interaction_history: List[Dict[str, Any]],
        time_window_days: int = 30
    ) -> Dict[str, Any]:
        """
        Analyze user behavior patterns
        
        Args:
            user_id: User identifier
            interaction_history: List of user interactions
            time_window_days: Analysis time window
            
        Returns:
            Behavioral analysis results
        """
        try:
            # Filter recent interactions
            cutoff_date = datetime.utcnow() - timedelta(days=time_window_days)
            recent_interactions = [
                interaction for interaction in interaction_history
                if datetime.fromisoformat(interaction.get("timestamp", "")) > cutoff_date
            ]
            
            if not recent_interactions:
                return {"status": "no_recent_activity", "user_id": user_id}
            
            # Analyze different behavior dimensions
            activity_pattern = self._analyze_activity_patterns(recent_interactions)
            preference_analysis = self._analyze_preferences(recent_interactions)
            engagement_analysis = self._analyze_engagement_levels(recent_interactions)
            success_patterns = self._analyze_success_patterns(recent_interactions)
            
            # Determine user segment
            user_segment = self._determine_user_segment(
                activity_pattern, preference_analysis, engagement_analysis
            )
            
            # Generate personalization recommendations
            personalization_recs = self._generate_personalization_recommendations(
                user_segment, preference_analysis, engagement_analysis
            )
            
            # Store user behavior profile
            self.behavior_patterns[user_id] = {
                "activity_pattern": activity_pattern,
                "preferences": preference_analysis,
                "engagement": engagement_analysis,
                "success_patterns": success_patterns,
                "user_segment": user_segment,
                "last_updated": datetime.utcnow(),
                "analysis_period": time_window_days
            }
            
            return {
                "user_id": user_id,
                "analysis_results": {
                    "activity_pattern": activity_pattern,
                    "preferences": preference_analysis,
                    "engagement": engagement_analysis,
                    "success_patterns": success_patterns,
                    "user_segment": user_segment
                },
                "personalization_recommendations": personalization_recs,
                "insights_count": len(recent_interactions)
            }
            
        except Exception as e:
            logger.error(f"Behavior analysis failed for user {user_id}: {str(e)}")
            return {"error": str(e), "user_id": user_id}
    
    def _analyze_activity_patterns(self, interactions: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Analyze user activity patterns"""
        if not interactions:
            return {"pattern": "inactive"}
        
        # Calculate activity frequency
        activity_frequency = len(interactions) / (30 if len(interactions) > 30 else len(interactions))
        
        # Analyze time patterns
        timestamps = [
            datetime.fromisoformat(interaction.get("timestamp", ""))
            for interaction in interactions
            if interaction.get("timestamp")
        ]
        
        if timestamps:
            hours = [ts.hour for ts in timestamps]
            days_of_week = [ts.weekday() for ts in timestamps]
            
            # Find peak activity hours
            hour_counts = {}
            for hour in hours:
                hour_counts[hour] = hour_counts.get(hour, 0) + 1
            
            peak_hour = max(hour_counts.items(), key=lambda x: x[1])[0] if hour_counts else 12
            
            # Determine activity pattern
            if activity_frequency > 2:
                pattern = "highly_active"
            elif activity_frequency > 0.5:
                pattern = "moderately_active"
            else:
                pattern = "low_activity"
        else:
            pattern = "inactive"
            peak_hour = 12
        
        return {
            "pattern": pattern,
            "frequency_per_day": activity_frequency,
            "peak_activity_hour": peak_hour,
            "total_interactions": len(interactions),
            "activity_consistency": self._calculate_consistency_score(timestamps)
        }
    
    def _analyze_preferences(self, interactions: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Analyze user preferences from interactions"""
        preferences = {
            "skills": {},
            "industries": {},
            "company_sizes": {},
            "salary_ranges": [],
            "locations": {}
        }
        
        for interaction in interactions:
            # Track skill preferences
            skills = interaction.get("skills", [])
            for skill in skills:
                preferences["skills"][skill] = preferences["skills"].get(skill, 0) + 1
            
            # Track industry preferences
            industry = interaction.get("industry")
            if industry:
                preferences["industries"][industry] = preferences["industries"].get(industry, 0) + 1
            
            # Track company size preferences
            company_size = interaction.get("company_size")
            if company_size:
                preferences["company_sizes"][company_size] = preferences["company_sizes"].get(company_size, 0) + 1
            
            # Track salary preferences
            salary = interaction.get("salary_expectation")
            if salary:
                preferences["salary_ranges"].append(salary)
            
            # Track location preferences
            location = interaction.get("location")
            if location:
                preferences["locations"][location] = preferences["locations"].get(location, 0) + 1
        
        # Process preferences
        top_skills = sorted(preferences["skills"].items(), key=lambda x: x[1], reverse=True)[:5]
        top_industries = sorted(preferences["industries"].items(), key=lambda x: x[1], reverse=True)[:3]
        
        return {
            "top_skills": [skill for skill, count in top_skills],
            "preferred_industries": [industry for industry, count in top_industries],
            "preferred_company_sizes": list(preferences["company_sizes"].keys()),
            "salary_range": {
                "min": min(preferences["salary_ranges"]) if preferences["salary_ranges"] else None,
                "max": max(preferences["salary_ranges"]) if preferences["salary_ranges"] else None,
                "avg": np.mean(preferences["salary_ranges"]) if preferences["salary_ranges"] else None
            },
            "location_flexibility": len(preferences["locations"]) > 1
        }
    
    def _analyze_engagement_levels(self, interactions: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Analyze user engagement patterns"""
        if not interactions:
            return {"level": "low", "score": 0.0}
        
        # Calculate engagement metrics
        response_rates = [
            interaction.get("responded", False) for interaction in interactions
        ]
        avg_response_rate = np.mean(response_rates) if response_rates else 0.0
        
        # Calculate session depths
        session_depths = [
            interaction.get("session_depth", 1) for interaction in interactions
        ]
        avg_session_depth = np.mean(session_depths)
        
        # Calculate time spent
        time_spent = [
            interaction.get("time_spent_minutes", 0) for interaction in interactions
        ]
        avg_time_spent = np.mean(time_spent)
        
        # Calculate overall engagement score
        engagement_score = (
            avg_response_rate * 0.4 +
            min(avg_session_depth / 10, 1.0) * 0.3 +
            min(avg_time_spent / 30, 1.0) * 0.3
        )
        
        # Categorize engagement level
        if engagement_score > 0.7:
            level = "high"
        elif engagement_score > 0.4:
            level = "medium"
        else:
            level = "low"
        
        return {
            "level": level,
            "score": engagement_score,
            "response_rate": avg_response_rate,
            "avg_session_depth": avg_session_depth,
            "avg_time_spent": avg_time_spent
        }
    
    def _analyze_success_patterns(self, interactions: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Analyze patterns in successful interactions"""
        successful_interactions = [
            interaction for interaction in interactions
            if interaction.get("successful", False)
        ]
        
        if not successful_interactions:
            return {"success_rate": 0.0, "patterns": []}
        
        success_rate = len(successful_interactions) / len(interactions)
        
        # Analyze common patterns in successful interactions
        success_patterns = []
        
        # Check if certain skills lead to more success
        skill_success = {}
        for interaction in successful_interactions:
            for skill in interaction.get("skills", []):
                skill_success[skill] = skill_success.get(skill, 0) + 1
        
        if skill_success:
            top_success_skill = max(skill_success.items(), key=lambda x: x[1])
            if top_success_skill[1] > 1:
                success_patterns.append(f"Higher success with {top_success_skill[0]} skills")
        
        # Check timing patterns
        success_hours = [
            datetime.fromisoformat(interaction.get("timestamp", "")).hour
            for interaction in successful_interactions
            if interaction.get("timestamp")
        ]
        
        if success_hours:
            most_successful_hour = max(set(success_hours), key=success_hours.count)
            success_patterns.append(f"Most successful at hour {most_successful_hour}")
        
        return {
            "success_rate": success_rate,
            "patterns": success_patterns,
            "successful_interactions_count": len(successful_interactions)
        }
    
    def _determine_user_segment(
        self,
        activity: Dict[str, Any],
        preferences: Dict[str, Any],
        engagement: Dict[str, Any]
    ) -> str:
        """Determine user segment based on behavior analysis"""
        
        activity_level = activity.get("pattern", "low_activity")
        engagement_level = engagement.get("level", "low")
        
        # Define user segments
        if activity_level == "highly_active" and engagement_level == "high":
            return "power_user"
        elif activity_level in ["moderately_active", "highly_active"] and engagement_level in ["medium", "high"]:
            return "engaged_user"
        elif activity_level == "low_activity" but engagement_level == "high":
            return "selective_user"
        elif activity_level == "moderately_active" and engagement_level == "low":
            return "casual_browser"
        else:
            return "inactive_user"
    
    def _generate_personalization_recommendations(
        self,
        user_segment: str,
        preferences: Dict[str, Any],
        engagement: Dict[str, Any]
    ) -> List[str]:
        """Generate personalization recommendations based on analysis"""
        recommendations = []
        
        # Segment-based recommendations
        if user_segment == "power_user":
            recommendations.extend([
                "Provide advanced filtering options",
                "Offer priority access to new features",
                "Enable bulk actions and shortcuts"
            ])
        elif user_segment == "engaged_user":
            recommendations.extend([
                "Send personalized weekly summaries",
                "Recommend skill development paths",
                "Provide detailed match explanations"
            ])
        elif user_segment == "selective_user":
            recommendations.extend([
                "Focus on high-quality, targeted recommendations",
                "Minimize notification frequency",
                "Provide detailed filtering options"
            ])
        elif user_segment == "casual_browser":
            recommendations.extend([
                "Simplify interface and reduce complexity",
                "Provide quick preview options",
                "Send gentle re-engagement emails"
            ])
        else:  # inactive_user
            recommendations.extend([
                "Send re-engagement campaigns",
                "Provide onboarding tutorials",
                "Offer incentives to increase activity"
            ])
        
        # Preference-based recommendations
        top_skills = preferences.get("top_skills", [])
        if top_skills:
            recommendations.append(f"Focus on {', '.join(top_skills[:3])} opportunities")
        
        # Engagement-based recommendations
        if engagement.get("response_rate", 0) < 0.3:
            recommendations.append("Improve recommendation relevance to increase response rates")
        
        return recommendations
    
    def _calculate_consistency_score(self, timestamps: List[datetime]) -> float:
        """Calculate consistency score based on timestamp patterns"""
        if len(timestamps) < 2:
            return 0.0
        
        # Calculate time differences between consecutive interactions
        time_diffs = []
        for i in range(1, len(timestamps)):
            diff = (timestamps[i] - timestamps[i-1]).total_seconds() / 3600  # Hours
            time_diffs.append(diff)
        
        if not time_diffs:
            return 0.0
        
        # Lower variance in time differences indicates higher consistency
        variance = np.var(time_diffs)
        consistency_score = 1.0 / (1.0 + variance / 100)  # Normalize
        
        return min(consistency_score, 1.0)


class AdaptiveMatchingEngine:
    """
    Matching engine that adapts based on real-time feedback and performance
    """
    
    def __init__(self):
        self.matching_weights = {
            "skills_similarity": 0.35,
            "experience_match": 0.25,
            "success_probability": 0.20,
            "availability": 0.15,
            "diversity": 0.05
        }
        self.performance_tracker = {}
        self.adaptation_history = []
        
    async def adaptive_match(
        self,
        candidate_profile: Dict[str, Any],
        employee_pool: List[Dict[str, Any]],
        feedback_history: List[Dict[str, Any]] = None,
        adaptation_mode: str = "auto"
    ) -> Dict[str, Any]:
        """
        Perform adaptive matching with real-time weight adjustments
        
        Args:
            candidate_profile: Candidate information
            employee_pool: Available employees
            feedback_history: Recent feedback for adaptation
            adaptation_mode: 'auto', 'conservative', or 'aggressive'
            
        Returns:
            Matching results with adaptation insights
        """
        try:
            # Adapt weights based on recent performance
            if feedback_history:
                adapted_weights = await self._adapt_weights(feedback_history, adaptation_mode)
            else:
                adapted_weights = self.matching_weights.copy()
            
            # Perform matching with adapted weights
            matches = []
            for employee in employee_pool:
                match_score = self._calculate_adaptive_match_score(
                    candidate_profile, employee, adapted_weights
                )
                
                matches.append({
                    "employee_id": employee.get("id"),
                    "match_score": match_score,
                    "weight_breakdown": self._get_score_breakdown(
                        candidate_profile, employee, adapted_weights
                    )
                })
            
            # Sort by match score
            matches.sort(key=lambda x: x["match_score"], reverse=True)
            
            # Add adaptation insights
            adaptation_insights = self._generate_adaptation_insights(
                self.matching_weights, adapted_weights
            )
            
            return {
                "matches": matches[:10],  # Top 10 matches
                "adapted_weights": adapted_weights,
                "original_weights": self.matching_weights,
                "adaptation_insights": adaptation_insights,
                "adaptation_confidence": self._calculate_adaptation_confidence(feedback_history)
            }
            
        except Exception as e:
            logger.error(f"Adaptive matching failed: {str(e)}")
            return {"error": str(e)}
    
    async def _adapt_weights(
        self,
        feedback_history: List[Dict[str, Any]],
        adaptation_mode: str
    ) -> Dict[str, float]:
        """Adapt matching weights based on feedback performance"""
        
        if len(feedback_history) < 5:
            return self.matching_weights.copy()
        
        # Analyze performance by weight component
        component_performance = self._analyze_component_performance(feedback_history)
        
        # Calculate weight adjustments
        weight_adjustments = {}
        adaptation_strength = self._get_adaptation_strength(adaptation_mode)
        
        for component, performance in component_performance.items():
            if component in self.matching_weights:
                current_weight = self.matching_weights[component]
                
                # Adjust based on performance
                if performance > 0.7:  # Good performance
                    adjustment = adaptation_strength * 0.1
                elif performance < 0.4:  # Poor performance
                    adjustment = -adaptation_strength * 0.1
                else:
                    adjustment = 0
                
                new_weight = max(0.05, min(0.6, current_weight + adjustment))
                weight_adjustments[component] = new_weight
            else:
                weight_adjustments[component] = self.matching_weights.get(component, 0.1)
        
        # Normalize weights to sum to 1.0
        total_weight = sum(weight_adjustments.values())
        adapted_weights = {
            k: v / total_weight for k, v in weight_adjustments.items()
        }
        
        # Store adaptation history
        self.adaptation_history.append({
            "timestamp": datetime.utcnow(),
            "original_weights": self.matching_weights.copy(),
            "adapted_weights": adapted_weights,
            "feedback_samples": len(feedback_history),
            "adaptation_mode": adaptation_mode
        })
        
        return adapted_weights
    
    def _analyze_component_performance(
        self,
        feedback_history: List[Dict[str, Any]]
    ) -> Dict[str, float]:
        """Analyze performance of each matching component"""
        
        component_scores = {
            "skills_similarity": [],
            "experience_match": [],
            "success_probability": [],
            "availability": [],
            "diversity": []
        }
        
        for feedback in feedback_history:
            match_data = feedback.get("match_data", {})
            feedback_score = feedback.get("feedback_score", 0.5)
            
            # Extract component scores from match data
            for component in component_scores.keys():
                component_score = match_data.get(f"{component}_score", 0.5)
                component_scores[component].append({
                    "component_score": component_score,
                    "feedback_score": feedback_score
                })
        
        # Calculate performance correlation for each component
        component_performance = {}
        for component, scores in component_scores.items():
            if len(scores) < 3:
                component_performance[component] = 0.5  # Default
                continue
            
            # Calculate correlation between component score and feedback
            component_vals = [s["component_score"] for s in scores]
            feedback_vals = [s["feedback_score"] for s in scores]
            
            correlation = np.corrcoef(component_vals, feedback_vals)[0, 1]
            
            # Convert correlation to performance score (0-1)
            performance = (correlation + 1) / 2  # Convert from [-1,1] to [0,1]
            component_performance[component] = max(0.0, min(1.0, performance))
        
        return component_performance
    
    def _get_adaptation_strength(self, adaptation_mode: str) -> float:
        """Get adaptation strength based on mode"""
        if adaptation_mode == "aggressive":
            return 1.0
        elif adaptation_mode == "conservative":
            return 0.3
        else:  # auto
            return 0.6
    
    def _calculate_adaptive_match_score(
        self,
        candidate: Dict[str, Any],
        employee: Dict[str, Any],
        weights: Dict[str, float]
    ) -> float:
        """Calculate match score using adaptive weights"""
        
        # Calculate component scores (simplified)
        skills_score = self._calculate_skills_similarity(candidate, employee)
        experience_score = self._calculate_experience_match(candidate, employee)
        success_score = employee.get("success_rate", 0.5)
        availability_score = self._calculate_availability_score(employee)
        diversity_score = self._calculate_diversity_score(candidate, employee)
        
        # Apply weights
        total_score = (
            skills_score * weights.get("skills_similarity", 0.35) +
            experience_score * weights.get("experience_match", 0.25) +
            success_score * weights.get("success_probability", 0.20) +
            availability_score * weights.get("availability", 0.15) +
            diversity_score * weights.get("diversity", 0.05)
        )
        
        return min(total_score, 1.0)
    
    def _calculate_skills_similarity(
        self,
        candidate: Dict[str, Any],
        employee: Dict[str, Any]
    ) -> float:
        """Calculate skills similarity score"""
        candidate_skills = set(skill.lower() for skill in candidate.get("skills", []))
        employee_skills = set(skill.lower() for skill in employee.get("skills", []))
        
        if not candidate_skills or not employee_skills:
            return 0.0
        
        overlap = len(candidate_skills & employee_skills)
        union = len(candidate_skills | employee_skills)
        
        return overlap / union if union > 0 else 0.0
    
    def _calculate_experience_match(
        self,
        candidate: Dict[str, Any],
        employee: Dict[str, Any]
    ) -> float:
        """Calculate experience level match"""
        candidate_exp = candidate.get("experience_years", 0)
        employee_exp = employee.get("experience_years", 0)
        
        # Prefer employees with more experience than candidate
        if employee_exp >= candidate_exp:
            return min(1.0, employee_exp / (candidate_exp + 5))
        else:
            return 0.3  # Lower score if employee has less experience
    
    def _calculate_availability_score(self, employee: Dict[str, Any]) -> float:
        """Calculate employee availability score"""
        last_active_days = employee.get("last_active_days", 30)
        current_referrals = employee.get("current_referrals", 0)
        max_referrals = employee.get("max_referrals", 5)
        
        # Availability based on recent activity and current load
        activity_score = max(0.0, 1.0 - (last_active_days / 30))
        load_score = max(0.0, 1.0 - (current_referrals / max_referrals))
        
        return (activity_score + load_score) / 2
    
    def _calculate_diversity_score(
        self,
        candidate: Dict[str, Any],
        employee: Dict[str, Any]
    ) -> float:
        """Calculate diversity score to promote inclusive matches"""
        # Simple diversity calculation based on different backgrounds
        diversity_factors = []
        
        # Industry diversity
        candidate_industry = candidate.get("industry", "").lower()
        employee_industry = employee.get("industry", "").lower()
        if candidate_industry and employee_industry and candidate_industry != employee_industry:
            diversity_factors.append(0.3)
        
        # Location diversity
        candidate_location = candidate.get("location", "").lower()
        employee_location = employee.get("location", "").lower()
        if candidate_location and employee_location and candidate_location != employee_location:
            diversity_factors.append(0.3)
        
        # Company size diversity
        candidate_company_size = candidate.get("preferred_company_size", "").lower()
        employee_company_size = employee.get("company_size", "").lower()
        if (candidate_company_size and employee_company_size and 
            candidate_company_size != employee_company_size):
            diversity_factors.append(0.4)
        
        return sum(diversity_factors) if diversity_factors else 0.2  # Small base diversity score
    
    def _get_score_breakdown(
        self,
        candidate: Dict[str, Any],
        employee: Dict[str, Any],
        weights: Dict[str, float]
    ) -> Dict[str, float]:
        """Get detailed score breakdown for transparency"""
        skills_score = self._calculate_skills_similarity(candidate, employee)
        experience_score = self._calculate_experience_match(candidate, employee)
        success_score = employee.get("success_rate", 0.5)
        availability_score = self._calculate_availability_score(employee)
        diversity_score = self._calculate_diversity_score(candidate, employee)
        
        return {
            "skills_similarity": skills_score,
            "experience_match": experience_score,
            "success_probability": success_score,
            "availability": availability_score,
            "diversity": diversity_score,
            "weights_used": weights
        }
    
    def _generate_adaptation_insights(
        self,
        original_weights: Dict[str, float],
        adapted_weights: Dict[str, float]
    ) -> List[str]:
        """Generate insights about weight adaptations"""
        insights = []
        
        for component, original_weight in original_weights.items():
            adapted_weight = adapted_weights.get(component, original_weight)
            change = adapted_weight - original_weight
            
            if abs(change) > 0.05:  # Significant change threshold
                if change > 0:
                    insights.append(f"Increased {component} importance by {change:.2f}")
                else:
                    insights.append(f"Decreased {component} importance by {abs(change):.2f}")
        
        if not insights:
            insights.append("No significant weight adaptations made")
        
        return insights
    
    def _calculate_adaptation_confidence(
        self,
        feedback_history: List[Dict[str, Any]]
    ) -> float:
        """Calculate confidence in the adaptation"""
        if not feedback_history:
            return 0.0
        
        # Confidence based on feedback volume and consistency
        volume_confidence = min(1.0, len(feedback_history) / 20)  # Max confidence at 20+ samples
        
        # Consistency of recent feedback
        recent_scores = [fb.get("feedback_score", 0.5) for fb in feedback_history[-10:]]
        consistency_confidence = 1.0 - (np.std(recent_scores) if len(recent_scores) > 1 else 0.5)
        
        return (volume_confidence + consistency_confidence) / 2 