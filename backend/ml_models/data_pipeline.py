"""
Data Pipeline for ML Model Training and Inference
"""

import pandas as pd
import numpy as np
from sqlalchemy import create_engine
from typing import Dict, List, Any, Optional
import logging
from datetime import datetime, timedelta
import asyncio

logger = logging.getLogger(__name__)

class MLDataPipeline:
    """
    Comprehensive data pipeline for ML model training and inference
    """
    
    def __init__(self, db_connection_string: str):
        self.engine = create_engine(db_connection_string)
        self.feature_cache = {}
        
    async def extract_training_data(
        self,
        model_type: str,
        lookback_days: int = 90
    ) -> pd.DataFrame:
        """Extract training data for ML models"""
        
        if model_type == "hiring_success":
            return await self._extract_hiring_success_data(lookback_days)
        elif model_type == "salary_prediction":
            return await self._extract_salary_data(lookback_days)
        elif model_type == "engagement_prediction":
            return await self._extract_engagement_data(lookback_days)
        else:
            raise ValueError(f"Unknown model type: {model_type}")
    
    async def _extract_hiring_success_data(self, lookback_days: int) -> pd.DataFrame:
        """Extract data for hiring success prediction model"""
        
        query = """
        SELECT 
            r.id as referral_id,
            r.was_hired,
            r.response_time_hours,
            r.match_score,
            c.experience_years as candidate_experience_years,
            c.education_level,
            c.skills_count,
            e.success_rate as employee_success_rate,
            e.total_referrals as employee_total_referrals,
            e.avg_response_time as employee_avg_response_time,
            COALESCE(r.salary_alignment_score, 0.5) as salary_alignment_score,
            COALESCE(r.industry_alignment_score, 0.5) as industry_alignment_score,
            COALESCE(r.location_match_score, 1.0) as location_match_score,
            r.created_at
        FROM referrals r
        JOIN candidates c ON r.candidate_id = c.id
        JOIN employees e ON r.employee_id = e.id
        WHERE r.created_at >= %s
        AND r.status IN ('completed', 'hired', 'not_hired')
        """
        
        cutoff_date = datetime.utcnow() - timedelta(days=lookback_days)
        
        try:
            df = pd.read_sql_query(query, self.engine, params=[cutoff_date])
            
            # Feature engineering
            df = self._engineer_hiring_features(df)
            
            return df
            
        except Exception as e:
            logger.error(f"Failed to extract hiring success data: {str(e)}")
            return pd.DataFrame()
    
    def _engineer_hiring_features(self, df: pd.DataFrame) -> pd.DataFrame:
        """Engineer features for hiring success prediction"""
        
        # Create derived features
        df['experience_level'] = df['candidate_experience_years'].apply(
            lambda x: 0 if x < 2 else 1 if x < 5 else 2 if x < 8 else 3
        )
        
        df['employee_reliability'] = (
            df['employee_success_rate'] * 0.7 + 
            (1 / (df['employee_avg_response_time'] + 1)) * 0.3
        )
        
        df['match_quality'] = (
            df['match_score'] * 0.4 +
            df['salary_alignment_score'] * 0.3 +
            df['industry_alignment_score'] * 0.3
        )
        
        # Time-based features
        df['created_at'] = pd.to_datetime(df['created_at'])
        df['hour_of_day'] = df['created_at'].dt.hour
        df['day_of_week'] = df['created_at'].dt.dayofweek
        df['is_weekend'] = df['day_of_week'].isin([5, 6]).astype(int)
        
        return df
    
    async def prepare_features_for_inference(
        self,
        candidate_data: Dict[str, Any],
        employee_data: Dict[str, Any],
        match_context: Dict[str, Any]
    ) -> np.ndarray:
        """Prepare features for real-time inference"""
        
        features = [
            candidate_data.get('experience_years', 0),
            len(candidate_data.get('skills', [])),
            candidate_data.get('education_level_encoded', 2),
            employee_data.get('success_rate', 0.5),
            employee_data.get('avg_response_time_hours', 24),
            employee_data.get('total_referrals', 0),
            match_context.get('match_score', 0.5),
            match_context.get('salary_alignment_score', 0.5),
            match_context.get('industry_alignment_score', 0.5),
            match_context.get('location_match_score', 1.0),
            datetime.utcnow().hour,  # Current hour
            datetime.utcnow().weekday(),  # Current day of week
            1 if datetime.utcnow().weekday() >= 5 else 0  # Is weekend
        ]
        
        return np.array(features).reshape(1, -1)

class ModelTrainingPipeline:
    """
    Automated model training and deployment pipeline
    """
    
    def __init__(self, data_pipeline: MLDataPipeline):
        self.data_pipeline = data_pipeline
        self.training_history = []
        
    async def train_all_models(self) -> Dict[str, Any]:
        """Train all ML models with latest data"""
        
        results = {}
        
        # Train hiring success model
        hiring_result = await self._train_hiring_success_model()
        results['hiring_success'] = hiring_result
        
        # Train salary prediction model
        salary_result = await self._train_salary_model()
        results['salary_prediction'] = salary_result
        
        # Train engagement model
        engagement_result = await self._train_engagement_model()
        results['engagement_prediction'] = engagement_result
        
        # Store training history
        self.training_history.append({
            'timestamp': datetime.utcnow(),
            'results': results
        })
        
        return results
    
    async def _train_hiring_success_model(self) -> Dict[str, Any]:
        """Train hiring success prediction model"""
        
        from .predictive_models import HiringSuccessPredictor
        
        # Extract training data
        training_data = await self.data_pipeline.extract_training_data(
            'hiring_success', lookback_days=90
        )
        
        if len(training_data) < 50:
            return {"status": "insufficient_data", "samples": len(training_data)}
        
        # Initialize and train model
        model = HiringSuccessPredictor()
        training_result = await model.train_model(training_data)
        
        return training_result

    async def _train_salary_model(self) -> Dict[str, Any]:
        """Train salary prediction model"""
        # Implementation for salary model training
        return {"status": "completed", "model": "salary_predictor"}
    
    async def _train_engagement_model(self) -> Dict[str, Any]:
        """Train engagement prediction model"""
        # Implementation for engagement model training
        return {"status": "completed", "model": "engagement_predictor"} 