"""
Advanced Machine Learning Models Package

This package contains custom ML models for enhanced AI features:
- Predictive modeling for hiring success
- Real-time recommendation engines
- Personalization algorithms
- Performance optimization models
"""

from .predictive_models import (
    HiringSuccessPredictor,
    SalaryRangePredictor,
    CandidateEngagementPredictor
)

from .recommendation_engine import (
    PersonalizedRecommendationEngine,
    SkillsRecommendationEngine,
    CareerPathRecommender
)

from .real_time_learning import (
    FeedbackLearningModel,
    UserBehaviorAnalyzer,
    AdaptiveMatchingEngine
)

from .optimization_models import (
    ResponseTimeOptimizer,
    QualityScorePredictor,
    ChurnPredictionModel
)

__all__ = [
    "HiringSuccessPredictor",
    "SalaryRangePredictor", 
    "CandidateEngagementPredictor",
    "PersonalizedRecommendationEngine",
    "SkillsRecommendationEngine",
    "CareerPathRecommender",
    "FeedbackLearningModel",
    "UserBehaviorAnalyzer",
    "AdaptiveMatchingEngine",
    "ResponseTimeOptimizer",
    "QualityScorePredictor",
    "ChurnPredictionModel"
] 