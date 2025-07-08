"""
Predictive ML Models for Advanced Analytics

Custom models trained on historical platform data to predict:
- Hiring success probability
- Salary range recommendations
- Candidate engagement likelihood
"""

import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestClassifier, GradientBoostingRegressor
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler, LabelEncoder
from sklearn.metrics import accuracy_score, mean_absolute_error, roc_auc_score
import xgboost as xgb
import joblib
import logging
from typing import Dict, List, Optional, Tuple, Any
from datetime import datetime, timedelta
import asyncio

logger = logging.getLogger(__name__)

class HiringSuccessPredictor:
    """
    Advanced ML model to predict hiring success probability
    Uses historical referral data to train custom models
    """
    
    def __init__(self, model_version: str = "v1.0"):
        self.model_version = model_version
        self.model = None
        self.scaler = StandardScaler()
        self.feature_columns = [
            'candidate_experience_years', 'skills_match_score', 'salary_expectation_alignment',
            'employee_success_rate', 'employee_response_time', 'industry_alignment',
            'role_level_match', 'education_level', 'location_preference_match',
            'availability_score', 'communication_quality_score', 'market_demand_score'
        ]
        self.is_trained = False
        
    async def train_model(self, training_data: pd.DataFrame) -> Dict[str, Any]:
        """
        Train the hiring success prediction model
        
        Args:
            training_data: DataFrame with historical referral outcomes
            
        Returns:
            Training metrics and model performance
        """
        try:
            # Prepare features
            X = self._prepare_features(training_data)
            y = training_data['was_hired'].astype(int)
            
            # Split data
            X_train, X_test, y_train, y_test = train_test_split(
                X, y, test_size=0.2, random_state=42, stratify=y
            )
            
            # Scale features
            X_train_scaled = self.scaler.fit_transform(X_train)
            X_test_scaled = self.scaler.transform(X_test)
            
            # Train ensemble model
            self.model = xgb.XGBClassifier(
                n_estimators=100,
                max_depth=6,
                learning_rate=0.1,
                random_state=42,
                eval_metric='logloss'
            )
            
            self.model.fit(X_train_scaled, y_train)
            
            # Evaluate model
            y_pred = self.model.predict(X_test_scaled)
            y_pred_proba = self.model.predict_proba(X_test_scaled)[:, 1]
            
            accuracy = accuracy_score(y_test, y_pred)
            auc_score = roc_auc_score(y_test, y_pred_proba)
            
            # Feature importance
            feature_importance = dict(zip(
                self.feature_columns,
                self.model.feature_importances_
            ))
            
            self.is_trained = True
            
            # Save model
            await self._save_model()
            
            return {
                "model_version": self.model_version,
                "accuracy": accuracy,
                "auc_score": auc_score,
                "feature_importance": feature_importance,
                "training_samples": len(X_train),
                "test_samples": len(X_test),
                "trained_at": datetime.utcnow().isoformat()
            }
            
        except Exception as e:
            logger.error(f"Model training failed: {str(e)}")
            raise
    
    async def predict_hiring_success(
        self,
        candidate_data: Dict[str, Any],
        employee_data: Dict[str, Any],
        referral_context: Dict[str, Any] = None
    ) -> Dict[str, Any]:
        """
        Predict hiring success probability for a candidate-employee pair
        
        Returns:
            Prediction with confidence intervals and contributing factors
        """
        if not self.is_trained:
            await self._load_model()
        
        try:
            # Prepare input features
            features = self._prepare_single_prediction_features(
                candidate_data, employee_data, referral_context or {}
            )
            
            # Scale features
            features_scaled = self.scaler.transform([features])
            
            # Make prediction
            probability = self.model.predict_proba(features_scaled)[0, 1]
            
            # Get prediction confidence
            confidence = self._calculate_prediction_confidence(features_scaled)
            
            # Analyze contributing factors
            feature_contributions = self._analyze_feature_contributions(features_scaled)
            
            return {
                "hiring_probability": float(probability),
                "confidence_score": float(confidence),
                "prediction_category": self._categorize_probability(probability),
                "contributing_factors": feature_contributions,
                "model_version": self.model_version,
                "predicted_at": datetime.utcnow().isoformat()
            }
            
        except Exception as e:
            logger.error(f"Prediction failed: {str(e)}")
            return {
                "hiring_probability": 0.5,  # Default fallback
                "confidence_score": 0.0,
                "error": str(e)
            }
    
    def _prepare_features(self, data: pd.DataFrame) -> pd.DataFrame:
        """Prepare features for model training"""
        features = pd.DataFrame()
        
        # Candidate features
        features['candidate_experience_years'] = data.get('candidate_experience_years', 0)
        features['skills_match_score'] = data.get('skills_match_score', 0.5)
        features['salary_expectation_alignment'] = data.get('salary_alignment_score', 0.5)
        features['education_level'] = data.get('education_level_encoded', 0)
        features['location_preference_match'] = data.get('location_match_score', 1.0)
        
        # Employee features
        features['employee_success_rate'] = data.get('employee_success_rate', 0.5)
        features['employee_response_time'] = data.get('avg_response_time_hours', 24)
        
        # Match features
        features['industry_alignment'] = data.get('industry_alignment_score', 0.5)
        features['role_level_match'] = data.get('role_level_match_score', 0.5)
        features['availability_score'] = data.get('availability_score', 0.5)
        features['communication_quality_score'] = data.get('communication_score', 0.5)
        features['market_demand_score'] = data.get('market_demand_score', 0.5)
        
        return features
    
    def _prepare_single_prediction_features(
        self,
        candidate_data: Dict[str, Any],
        employee_data: Dict[str, Any],
        context: Dict[str, Any]
    ) -> List[float]:
        """Prepare features for a single prediction"""
        return [
            candidate_data.get('experience_years', 0),
            context.get('skills_match_score', 0.5),
            context.get('salary_alignment_score', 0.5),
            employee_data.get('success_rate', 0.5),
            employee_data.get('avg_response_time_hours', 24),
            context.get('industry_alignment_score', 0.5),
            context.get('role_level_match_score', 0.5),
            candidate_data.get('education_level_encoded', 2),
            context.get('location_match_score', 1.0),
            context.get('availability_score', 0.5),
            context.get('communication_score', 0.5),
            context.get('market_demand_score', 0.5)
        ]
    
    def _calculate_prediction_confidence(self, features_scaled) -> float:
        """Calculate confidence in the prediction"""
        # Use prediction probability spread as confidence indicator
        probabilities = self.model.predict_proba(features_scaled)[0]
        confidence = abs(probabilities[1] - probabilities[0])
        return min(confidence * 2, 1.0)  # Scale to 0-1
    
    def _analyze_feature_contributions(self, features_scaled) -> Dict[str, float]:
        """Analyze which features contribute most to the prediction"""
        # Simplified feature contribution analysis
        feature_importance = dict(zip(
            self.feature_columns,
            self.model.feature_importances_
        ))
        
        # Sort by importance
        sorted_features = sorted(
            feature_importance.items(),
            key=lambda x: x[1],
            reverse=True
        )
        
        return dict(sorted_features[:5])  # Top 5 contributing factors
    
    def _categorize_probability(self, probability: float) -> str:
        """Categorize probability into meaningful ranges"""
        if probability >= 0.8:
            return "Very High"
        elif probability >= 0.6:
            return "High"
        elif probability >= 0.4:
            return "Moderate"
        elif probability >= 0.2:
            return "Low"
        else:
            return "Very Low"
    
    async def _save_model(self):
        """Save trained model to disk"""
        try:
            model_path = f"backend/ml_models/saved_models/hiring_success_{self.model_version}.joblib"
            scaler_path = f"backend/ml_models/saved_models/hiring_success_scaler_{self.model_version}.joblib"
            
            joblib.dump(self.model, model_path)
            joblib.dump(self.scaler, scaler_path)
            
            logger.info(f"Model saved: {model_path}")
        except Exception as e:
            logger.error(f"Failed to save model: {str(e)}")
    
    async def _load_model(self):
        """Load trained model from disk"""
        try:
            model_path = f"backend/ml_models/saved_models/hiring_success_{self.model_version}.joblib"
            scaler_path = f"backend/ml_models/saved_models/hiring_success_scaler_{self.model_version}.joblib"
            
            self.model = joblib.load(model_path)
            self.scaler = joblib.load(scaler_path)
            self.is_trained = True
            
            logger.info(f"Model loaded: {model_path}")
        except Exception as e:
            logger.warning(f"Failed to load model: {str(e)}")


class SalaryRangePredictor:
    """
    ML model to predict optimal salary ranges based on:
    - Market data
    - Candidate profile  
    - Company/location factors
    - Real-time market intelligence
    """
    
    def __init__(self):
        self.model = GradientBoostingRegressor(
            n_estimators=100,
            max_depth=6,
            learning_rate=0.1,
            random_state=42
        )
        self.scaler = StandardScaler()
        self.is_trained = False
    
    async def predict_salary_range(
        self,
        candidate_profile: Dict[str, Any],
        job_requirements: Dict[str, Any],
        market_data: Dict[str, Any] = None
    ) -> Dict[str, Any]:
        """
        Predict salary range with confidence intervals
        
        Returns:
            Salary prediction with range and market positioning
        """
        try:
            # Prepare features
            features = self._prepare_salary_features(
                candidate_profile, job_requirements, market_data or {}
            )
            
            if not self.is_trained:
                # Use rule-based fallback if model not trained
                return await self._rule_based_salary_prediction(features)
            
            # Scale features
            features_scaled = self.scaler.transform([features])
            
            # Predict base salary
            predicted_salary = self.model.predict(features_scaled)[0]
            
            # Calculate confidence interval (±15%)
            confidence_range = predicted_salary * 0.15
            
            return {
                "predicted_salary": int(predicted_salary),
                "salary_range": {
                    "min": int(predicted_salary - confidence_range),
                    "max": int(predicted_salary + confidence_range)
                },
                "market_percentile": self._calculate_market_percentile(predicted_salary, market_data),
                "factors": self._get_salary_factors(features),
                "confidence_score": 0.85  # Model confidence
            }
            
        except Exception as e:
            logger.error(f"Salary prediction failed: {str(e)}")
            return {"error": str(e)}
    
    def _prepare_salary_features(
        self,
        candidate: Dict[str, Any],
        job: Dict[str, Any],
        market: Dict[str, Any]
    ) -> List[float]:
        """Prepare features for salary prediction"""
        return [
            candidate.get('experience_years', 0),
            len(candidate.get('skills', [])),
            candidate.get('education_level_score', 0),
            job.get('seniority_level_score', 0),
            market.get('average_salary', 75000),
            market.get('demand_multiplier', 1.0),
            candidate.get('location_cost_index', 1.0),
            job.get('company_size_multiplier', 1.0)
        ]
    
    async def _rule_based_salary_prediction(self, features: List[float]) -> Dict[str, Any]:
        """Fallback rule-based salary prediction"""
        base_salary = 70000  # Starting base
        
        # Experience multiplier
        experience_years = features[0]
        experience_multiplier = 1 + (experience_years * 0.05)  # 5% per year
        
        # Skills multiplier
        skills_count = features[1]
        skills_multiplier = 1 + (skills_count * 0.02)  # 2% per skill
        
        # Market adjustments
        market_avg = features[4] if features[4] > 0 else 75000
        location_index = features[6]
        
        predicted_salary = (base_salary * experience_multiplier * 
                          skills_multiplier * location_index)
        
        # Align with market average
        predicted_salary = (predicted_salary + market_avg) / 2
        
        return {
            "predicted_salary": int(predicted_salary),
            "salary_range": {
                "min": int(predicted_salary * 0.85),
                "max": int(predicted_salary * 1.15)
            },
            "market_percentile": 50,  # Default middle
            "method": "rule_based",
            "confidence_score": 0.70
        }
    
    def _calculate_market_percentile(self, salary: float, market_data: Dict[str, Any]) -> int:
        """Calculate where this salary sits in the market"""
        if not market_data:
            return 50
        
        market_avg = market_data.get('average_salary', salary)
        if salary >= market_avg * 1.3:
            return 90
        elif salary >= market_avg * 1.15:
            return 75
        elif salary >= market_avg * 0.85:
            return 50
        elif salary >= market_avg * 0.7:
            return 25
        else:
            return 10
    
    def _get_salary_factors(self, features: List[float]) -> Dict[str, str]:
        """Identify key factors affecting salary prediction"""
        return {
            "experience": f"{features[0]} years",
            "skills_count": f"{int(features[1])} skills",
            "market_position": "Above average" if features[4] > 75000 else "Market rate",
            "location_factor": f"{features[6]:.1f}x" if features[6] != 1.0 else "Standard"
        }


class CandidateEngagementPredictor:
    """
    Predict how likely a candidate is to engage with referral opportunities
    """
    
    def __init__(self):
        self.model = RandomForestClassifier(
            n_estimators=50,
            max_depth=10,
            random_state=42
        )
        self.is_trained = False
    
    async def predict_engagement(
        self,
        candidate_profile: Dict[str, Any],
        referral_context: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Predict candidate engagement likelihood
        
        Returns:
            Engagement probability and recommended approach
        """
        try:
            # Calculate engagement score based on multiple factors
            profile_score = self._score_candidate_profile(candidate_profile)
            context_score = self._score_referral_context(referral_context)
            timing_score = self._score_timing_factors(candidate_profile, referral_context)
            
            # Weighted engagement score
            engagement_score = (
                profile_score * 0.4 +
                context_score * 0.35 +
                timing_score * 0.25
            )
            
            return {
                "engagement_probability": engagement_score,
                "engagement_level": self._categorize_engagement(engagement_score),
                "recommended_approach": self._recommend_approach(engagement_score, candidate_profile),
                "optimal_timing": self._suggest_timing(timing_score),
                "personalization_hints": self._get_personalization_hints(candidate_profile)
            }
            
        except Exception as e:
            logger.error(f"Engagement prediction failed: {str(e)}")
            return {"error": str(e)}
    
    def _score_candidate_profile(self, profile: Dict[str, Any]) -> float:
        """Score candidate profile for engagement likelihood"""
        score = 0.5  # Base score
        
        # Activity indicators
        if profile.get('last_login_days', 30) < 7:
            score += 0.2  # Recent activity
        elif profile.get('last_login_days', 30) < 30:
            score += 0.1
        
        # Profile completeness
        completeness = profile.get('profile_completeness', 0.5)
        score += completeness * 0.2
        
        # Job search indicators
        if profile.get('actively_looking', False):
            score += 0.15
        elif profile.get('open_to_opportunities', False):
            score += 0.1
        
        return min(score, 1.0)
    
    def _score_referral_context(self, context: Dict[str, Any]) -> float:
        """Score referral context for engagement appeal"""
        score = 0.5  # Base score
        
        # Match quality
        match_score = context.get('overall_match_score', 0.5)
        score += match_score * 0.3
        
        # Company attractiveness
        company_rating = context.get('company_rating', 0.5)
        score += company_rating * 0.2
        
        return min(score, 1.0)
    
    def _score_timing_factors(
        self,
        profile: Dict[str, Any],
        context: Dict[str, Any]
    ) -> float:
        """Score timing factors for engagement"""
        score = 0.5  # Base score
        
        # Current employment status
        if profile.get('employment_status') == 'unemployed':
            score += 0.3
        elif profile.get('employment_status') == 'looking':
            score += 0.2
        
        # Recent activity patterns
        if profile.get('peak_activity_time') == context.get('current_time_slot'):
            score += 0.1
        
        return min(score, 1.0)
    
    def _categorize_engagement(self, score: float) -> str:
        """Categorize engagement probability"""
        if score >= 0.8:
            return "Very High"
        elif score >= 0.6:
            return "High"
        elif score >= 0.4:
            return "Moderate"
        else:
            return "Low"
    
    def _recommend_approach(self, score: float, profile: Dict[str, Any]) -> str:
        """Recommend communication approach based on engagement score"""
        if score >= 0.7:
            return "Direct outreach with detailed opportunity"
        elif score >= 0.5:
            return "Warm introduction with key highlights"
        else:
            return "Soft touch with valuable content first"
    
    def _suggest_timing(self, timing_score: float) -> str:
        """Suggest optimal timing for outreach"""
        if timing_score >= 0.7:
            return "Immediate - highly receptive"
        elif timing_score >= 0.5:
            return "Within 24 hours"
        else:
            return "Build rapport first, then approach"
    
    def _get_personalization_hints(self, profile: Dict[str, Any]) -> List[str]:
        """Get hints for personalizing outreach"""
        hints = []
        
        if profile.get('career_interests'):
            hints.append(f"Mention growth in {profile['career_interests'][0]}")
        
        if profile.get('preferred_company_size'):
            hints.append(f"Highlight company size: {profile['preferred_company_size']}")
        
        if profile.get('values'):
            hints.append(f"Align with values: {', '.join(profile['values'][:2])}")
        
        return hints 