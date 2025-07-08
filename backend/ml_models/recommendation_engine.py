"""
Advanced Recommendation Engines

Real-time, personalized recommendation systems using:
- Collaborative filtering
- Content-based filtering  
- Hybrid approaches
- Deep learning embeddings
"""

import numpy as np
import pandas as pd
from sklearn.metrics.pairwise import cosine_similarity
from sklearn.decomposition import TruncatedSVD
from sklearn.feature_extraction.text import TfidfVectorizer
import logging
from typing import Dict, List, Optional, Any, Tuple
from datetime import datetime, timedelta
import asyncio
import json

logger = logging.getLogger(__name__)

class PersonalizedRecommendationEngine:
    """
    Advanced personalized recommendation system using hybrid approaches
    """
    
    def __init__(self, embedding_dim: int = 64):
        self.embedding_dim = embedding_dim
        self.collaborative_model = TruncatedSVD(n_components=embedding_dim, random_state=42)
        self.content_vectorizer = TfidfVectorizer(max_features=1000, stop_words='english')
        self.user_embeddings = {}
        self.item_embeddings = {}
        self.is_trained = False
        
        # Recommendation weights
        self.weights = {
            "collaborative": 0.4,    # User-user similarity
            "content_based": 0.3,    # Item content similarity
            "popularity": 0.15,      # Trending items
            "recency": 0.15         # Recent interactions
        }
    
    async def get_personalized_recommendations(
        self,
        user_id: str,
        user_profile: Dict[str, Any],
        interaction_history: List[Dict[str, Any]],
        candidate_pool: List[Dict[str, Any]],
        max_recommendations: int = 10
    ) -> Dict[str, Any]:
        """
        Generate personalized recommendations for a user
        
        Returns:
            Ranked list of recommendations with explanation
        """
        try:
            # Get collaborative filtering recommendations
            collab_recs = await self._get_collaborative_recommendations(
                user_id, interaction_history, candidate_pool
            )
            
            # Get content-based recommendations
            content_recs = await self._get_content_based_recommendations(
                user_profile, candidate_pool
            )
            
            # Get popularity-based recommendations
            popularity_recs = await self._get_popularity_based_recommendations(
                candidate_pool, interaction_history
            )
            
            # Combine recommendations using hybrid approach
            final_recommendations = self._combine_recommendations(
                collab_recs, content_recs, popularity_recs
            )
            
            # Rank and filter
            ranked_recommendations = self._rank_and_filter_recommendations(
                final_recommendations, max_recommendations
            )
            
            return {
                "recommendations": ranked_recommendations,
                "explanation": self._generate_explanation(ranked_recommendations),
                "diversity_score": self._calculate_diversity_score(ranked_recommendations),
                "generated_at": datetime.utcnow().isoformat()
            }
            
        except Exception as e:
            logger.error(f"Recommendation generation failed: {str(e)}")
            return {"error": str(e), "fallback_recommendations": []}
    
    async def _get_collaborative_recommendations(
        self,
        user_id: str,
        interaction_history: List[Dict[str, Any]],
        candidate_pool: List[Dict[str, Any]]
    ) -> List[Dict[str, Any]]:
        """Get recommendations based on user-user collaborative filtering"""
        
        # Find similar users based on interaction patterns
        similar_users = await self._find_similar_users(user_id, interaction_history)
        
        recommendations = []
        for candidate in candidate_pool:
            # Calculate collaborative score based on similar users' preferences
            collab_score = self._calculate_collaborative_score(
                candidate, similar_users, interaction_history
            )
            
            recommendations.append({
                "candidate_id": candidate.get("id"),
                "collaborative_score": collab_score,
                "reasoning": f"Users with similar preferences rated this {collab_score:.2f}"
            })
        
        return sorted(recommendations, key=lambda x: x["collaborative_score"], reverse=True)
    
    async def _get_content_based_recommendations(
        self,
        user_profile: Dict[str, Any],
        candidate_pool: List[Dict[str, Any]]
    ) -> List[Dict[str, Any]]:
        """Get recommendations based on content similarity"""
        
        # Extract user preferences
        user_skills = user_profile.get("preferred_skills", [])
        user_industries = user_profile.get("preferred_industries", [])
        user_company_sizes = user_profile.get("preferred_company_sizes", [])
        
        recommendations = []
        for candidate in candidate_pool:
            # Calculate content similarity score
            content_score = self._calculate_content_similarity(
                user_profile, candidate
            )
            
            # Calculate skills overlap
            skills_overlap = self._calculate_skills_overlap(
                user_skills, candidate.get("skills", [])
            )
            
            # Calculate industry alignment
            industry_alignment = self._calculate_industry_alignment(
                user_industries, candidate.get("target_industries", [])
            )
            
            final_score = (content_score * 0.5 + skills_overlap * 0.3 + 
                          industry_alignment * 0.2)
            
            recommendations.append({
                "candidate_id": candidate.get("id"),
                "content_score": final_score,
                "skills_match": skills_overlap,
                "industry_match": industry_alignment,
                "reasoning": f"Strong content match: {final_score:.2f}"
            })
        
        return sorted(recommendations, key=lambda x: x["content_score"], reverse=True)
    
    async def _get_popularity_based_recommendations(
        self,
        candidate_pool: List[Dict[str, Any]],
        interaction_history: List[Dict[str, Any]]
    ) -> List[Dict[str, Any]]:
        """Get recommendations based on popularity and trends"""
        
        # Calculate popularity scores
        popularity_scores = {}
        for interaction in interaction_history:
            candidate_id = interaction.get("candidate_id")
            if candidate_id:
                popularity_scores[candidate_id] = popularity_scores.get(candidate_id, 0) + 1
        
        # Normalize popularity scores
        max_popularity = max(popularity_scores.values()) if popularity_scores else 1
        
        recommendations = []
        for candidate in candidate_pool:
            candidate_id = candidate.get("id")
            popularity = popularity_scores.get(candidate_id, 0) / max_popularity
            
            # Add recency boost for recent interactions
            recency_boost = self._calculate_recency_boost(candidate_id, interaction_history)
            
            final_score = popularity + recency_boost
            
            recommendations.append({
                "candidate_id": candidate_id,
                "popularity_score": final_score,
                "interaction_count": popularity_scores.get(candidate_id, 0),
                "reasoning": f"Popular choice with {final_score:.2f} score"
            })
        
        return sorted(recommendations, key=lambda x: x["popularity_score"], reverse=True)
    
    def _combine_recommendations(
        self,
        collab_recs: List[Dict[str, Any]],
        content_recs: List[Dict[str, Any]],
        popularity_recs: List[Dict[str, Any]]
    ) -> List[Dict[str, Any]]:
        """Combine different recommendation approaches using weighted scores"""
        
        combined_scores = {}
        
        # Normalize and combine scores
        for recs, weight, score_key in [
            (collab_recs, self.weights["collaborative"], "collaborative_score"),
            (content_recs, self.weights["content_based"], "content_score"),
            (popularity_recs, self.weights["popularity"], "popularity_score")
        ]:
            for rec in recs:
                candidate_id = rec["candidate_id"]
                if candidate_id not in combined_scores:
                    combined_scores[candidate_id] = {
                        "candidate_id": candidate_id,
                        "final_score": 0,
                        "components": {}
                    }
                
                score = rec.get(score_key, 0)
                combined_scores[candidate_id]["final_score"] += score * weight
                combined_scores[candidate_id]["components"][score_key] = score
        
        return list(combined_scores.values())
    
    def _rank_and_filter_recommendations(
        self,
        recommendations: List[Dict[str, Any]],
        max_recommendations: int
    ) -> List[Dict[str, Any]]:
        """Rank and filter final recommendations"""
        
        # Sort by final score
        sorted_recs = sorted(
            recommendations,
            key=lambda x: x["final_score"],
            reverse=True
        )
        
        # Apply diversity filtering to avoid too similar recommendations
        diverse_recs = self._apply_diversity_filtering(sorted_recs)
        
        return diverse_recs[:max_recommendations]
    
    def _apply_diversity_filtering(
        self,
        recommendations: List[Dict[str, Any]]
    ) -> List[Dict[str, Any]]:
        """Apply diversity filtering to recommendations"""
        # Simple diversity filtering - in production, use more sophisticated methods
        return recommendations  # Placeholder implementation
    
    def _calculate_diversity_score(self, recommendations: List[Dict[str, Any]]) -> float:
        """Calculate diversity score of recommendations"""
        if len(recommendations) < 2:
            return 0.0
        
        # Simple diversity calculation based on score spread
        scores = [rec["final_score"] for rec in recommendations]
        return np.std(scores) / np.mean(scores) if np.mean(scores) > 0 else 0.0
    
    def _generate_explanation(self, recommendations: List[Dict[str, Any]]) -> str:
        """Generate explanation for recommendations"""
        if not recommendations:
            return "No recommendations available"
        
        avg_score = np.mean([rec["final_score"] for rec in recommendations])
        return f"Generated {len(recommendations)} recommendations with average score {avg_score:.2f}"
    
    async def _find_similar_users(
        self,
        user_id: str,
        interaction_history: List[Dict[str, Any]]
    ) -> List[str]:
        """Find users with similar interaction patterns"""
        # Simplified user similarity - in production, use more sophisticated methods
        similar_users = []
        # Implementation would analyze interaction patterns to find similar users
        return similar_users
    
    def _calculate_collaborative_score(
        self,
        candidate: Dict[str, Any],
        similar_users: List[str],
        interaction_history: List[Dict[str, Any]]
    ) -> float:
        """Calculate collaborative filtering score"""
        # Simplified implementation
        return 0.5  # Placeholder
    
    def _calculate_content_similarity(
        self,
        user_profile: Dict[str, Any],
        candidate: Dict[str, Any]
    ) -> float:
        """Calculate content-based similarity score"""
        # Compare user preferences with candidate attributes
        similarity_score = 0.0
        
        # Skills similarity
        user_skills = set(user_profile.get("skills", []))
        candidate_skills = set(candidate.get("skills", []))
        if user_skills and candidate_skills:
            skills_similarity = len(user_skills & candidate_skills) / len(user_skills | candidate_skills)
            similarity_score += skills_similarity * 0.4
        
        # Experience level similarity
        user_exp = user_profile.get("experience_level", "mid")
        candidate_exp = candidate.get("experience_level", "mid")
        if user_exp == candidate_exp:
            similarity_score += 0.3
        
        # Location similarity
        user_location = user_profile.get("location", "")
        candidate_location = candidate.get("location", "")
        if user_location and candidate_location and user_location == candidate_location:
            similarity_score += 0.3
        
        return min(similarity_score, 1.0)
    
    def _calculate_skills_overlap(self, user_skills: List[str], candidate_skills: List[str]) -> float:
        """Calculate skills overlap percentage"""
        if not user_skills or not candidate_skills:
            return 0.0
        
        user_skills_set = set(skill.lower() for skill in user_skills)
        candidate_skills_set = set(skill.lower() for skill in candidate_skills)
        
        overlap = len(user_skills_set & candidate_skills_set)
        total = len(user_skills_set | candidate_skills_set)
        
        return overlap / total if total > 0 else 0.0
    
    def _calculate_industry_alignment(
        self,
        user_industries: List[str],
        candidate_industries: List[str]
    ) -> float:
        """Calculate industry alignment score"""
        if not user_industries or not candidate_industries:
            return 0.5  # Neutral score
        
        user_industries_set = set(industry.lower() for industry in user_industries)
        candidate_industries_set = set(industry.lower() for industry in candidate_industries)
        
        overlap = len(user_industries_set & candidate_industries_set)
        return overlap / len(user_industries_set) if user_industries_set else 0.0
    
    def _calculate_recency_boost(
        self,
        candidate_id: str,
        interaction_history: List[Dict[str, Any]]
    ) -> float:
        """Calculate recency boost for trending candidates"""
        recent_interactions = [
            interaction for interaction in interaction_history
            if (interaction.get("candidate_id") == candidate_id and
                interaction.get("timestamp") and
                datetime.fromisoformat(interaction["timestamp"]) > 
                datetime.utcnow() - timedelta(days=7))
        ]
        
        return len(recent_interactions) * 0.1  # 0.1 boost per recent interaction


class SkillsRecommendationEngine:
    """
    AI-powered skills recommendation system
    """
    
    def __init__(self):
        self.skill_embeddings = {}
        self.market_trends = {}
    
    async def recommend_skills_for_growth(
        self,
        current_skills: List[str],
        career_goals: Dict[str, Any],
        market_data: Dict[str, Any] = None
    ) -> Dict[str, Any]:
        """
        Recommend skills for career growth
        """
        try:
            # Analyze skill gaps for target roles
            skill_gaps = await self._analyze_skill_gaps(current_skills, career_goals)
            
            # Get trending skills in the market
            trending_skills = await self._get_trending_skills(market_data)
            
            # Get complementary skills
            complementary_skills = await self._get_complementary_skills(current_skills)
            
            # Combine and rank recommendations
            final_recommendations = self._combine_skill_recommendations(
                skill_gaps, trending_skills, complementary_skills
            )
            
            return {
                "recommended_skills": final_recommendations,
                "learning_path": self._generate_learning_path(final_recommendations),
                "market_insights": self._get_skills_market_insights(final_recommendations),
                "timeline_estimate": self._estimate_learning_timeline(final_recommendations)
            }
            
        except Exception as e:
            logger.error(f"Skills recommendation failed: {str(e)}")
            return {"error": str(e)}
    
    async def _analyze_skill_gaps(
        self,
        current_skills: List[str],
        career_goals: Dict[str, Any]
    ) -> List[Dict[str, Any]]:
        """Analyze skills needed for career goals"""
        target_role = career_goals.get("target_role", "")
        target_level = career_goals.get("target_level", "senior")
        
        # Common skill requirements by role (simplified)
        role_skills = {
            "software engineer": ["python", "javascript", "git", "sql", "react"],
            "data scientist": ["python", "sql", "machine learning", "statistics", "pandas"],
            "product manager": ["analytics", "sql", "project management", "user research"],
            "devops engineer": ["aws", "docker", "kubernetes", "terraform", "monitoring"]
        }
        
        required_skills = role_skills.get(target_role.lower(), [])
        current_skills_lower = [skill.lower() for skill in current_skills]
        
        missing_skills = []
        for skill in required_skills:
            if skill not in current_skills_lower:
                missing_skills.append({
                    "skill": skill,
                    "importance": "high",
                    "category": "technical",
                    "reasoning": f"Essential for {target_role} role"
                })
        
        return missing_skills
    
    async def _get_trending_skills(self, market_data: Dict[str, Any]) -> List[Dict[str, Any]]:
        """Get trending skills from market data"""
        if not market_data:
            # Fallback trending skills
            return [
                {"skill": "ai/machine learning", "trend": "rising", "demand": "high"},
                {"skill": "cloud computing", "trend": "rising", "demand": "high"},
                {"skill": "react", "trend": "stable", "demand": "high"},
                {"skill": "python", "trend": "stable", "demand": "very high"}
            ]
        
        trending_skills = []
        skill_trends = market_data.get("skill_trends", {})
        
        for skill, trend_data in skill_trends.items():
            if trend_data.get("growth") > 0.1:  # 10% growth threshold
                trending_skills.append({
                    "skill": skill,
                    "trend": "rising",
                    "demand": trend_data.get("demand_level", "medium"),
                    "growth_rate": trend_data.get("growth", 0)
                })
        
        return sorted(trending_skills, key=lambda x: x.get("growth_rate", 0), reverse=True)
    
    async def _get_complementary_skills(self, current_skills: List[str]) -> List[Dict[str, Any]]:
        """Get skills that complement current skill set"""
        complementary_map = {
            "python": ["django", "flask", "pandas", "scikit-learn"],
            "javascript": ["react", "node.js", "vue", "typescript"],
            "aws": ["docker", "kubernetes", "terraform"],
            "sql": ["data analysis", "tableau", "power bi"],
            "machine learning": ["deep learning", "tensorflow", "pytorch"]
        }
        
        complementary_skills = []
        for skill in current_skills:
            related_skills = complementary_map.get(skill.lower(), [])
            for related_skill in related_skills:
                if related_skill not in [s.lower() for s in current_skills]:
                    complementary_skills.append({
                        "skill": related_skill,
                        "relation": f"Complements {skill}",
                        "priority": "medium"
                    })
        
        return complementary_skills
    
    def _combine_skill_recommendations(
        self,
        skill_gaps: List[Dict[str, Any]],
        trending_skills: List[Dict[str, Any]],
        complementary_skills: List[Dict[str, Any]]
    ) -> List[Dict[str, Any]]:
        """Combine different skill recommendations"""
        all_recommendations = {}
        
        # Add skill gaps (highest priority)
        for skill_rec in skill_gaps:
            skill_name = skill_rec["skill"]
            all_recommendations[skill_name] = {
                "skill": skill_name,
                "priority_score": 10,  # Highest priority
                "reasons": [skill_rec.get("reasoning", "Required for career goals")],
                "category": skill_rec.get("category", "technical")
            }
        
        # Add trending skills (medium priority)
        for skill_rec in trending_skills:
            skill_name = skill_rec["skill"]
            if skill_name not in all_recommendations:
                all_recommendations[skill_name] = {
                    "skill": skill_name,
                    "priority_score": 7,
                    "reasons": [f"Trending skill with {skill_rec.get('demand', 'high')} demand"],
                    "category": "technical"
                }
            else:
                all_recommendations[skill_name]["priority_score"] += 3
                all_recommendations[skill_name]["reasons"].append("Market trending")
        
        # Add complementary skills (lower priority)
        for skill_rec in complementary_skills:
            skill_name = skill_rec["skill"]
            if skill_name not in all_recommendations:
                all_recommendations[skill_name] = {
                    "skill": skill_name,
                    "priority_score": 5,
                    "reasons": [skill_rec.get("relation", "Complementary skill")],
                    "category": "technical"
                }
        
        # Sort by priority score
        return sorted(
            all_recommendations.values(),
            key=lambda x: x["priority_score"],
            reverse=True
        )
    
    def _generate_learning_path(self, recommendations: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """Generate a structured learning path"""
        learning_path = []
        
        # Group by difficulty and dependencies
        beginner_skills = []
        intermediate_skills = []
        advanced_skills = []
        
        for rec in recommendations[:8]:  # Top 8 recommendations
            skill = rec["skill"].lower()
            
            if skill in ["git", "sql", "html", "css"]:
                beginner_skills.append(rec)
            elif skill in ["python", "javascript", "react", "aws"]:
                intermediate_skills.append(rec)
            else:
                advanced_skills.append(rec)
        
        # Create learning phases
        if beginner_skills:
            learning_path.append({
                "phase": 1,
                "title": "Foundation Skills",
                "duration": "2-4 weeks",
                "skills": beginner_skills
            })
        
        if intermediate_skills:
            learning_path.append({
                "phase": 2,
                "title": "Core Technical Skills",
                "duration": "8-12 weeks",
                "skills": intermediate_skills
            })
        
        if advanced_skills:
            learning_path.append({
                "phase": 3,
                "title": "Advanced Specialization",
                "duration": "12-16 weeks",
                "skills": advanced_skills
            })
        
        return learning_path
    
    def _get_skills_market_insights(self, recommendations: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Get market insights for recommended skills"""
        # Simplified market insights
        total_skills = len(recommendations)
        high_demand_skills = len([r for r in recommendations if r.get("priority_score", 0) > 7])
        
        return {
            "total_recommended_skills": total_skills,
            "high_priority_skills": high_demand_skills,
            "market_alignment": "strong" if high_demand_skills > total_skills * 0.6 else "moderate",
            "estimated_salary_impact": f"{high_demand_skills * 5}-{high_demand_skills * 10}% increase"
        }
    
    def _estimate_learning_timeline(self, recommendations: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Estimate time needed to learn recommended skills"""
        total_skills = len(recommendations)
        
        # Rough estimates based on skill complexity
        beginner_weeks = 2
        intermediate_weeks = 6
        advanced_weeks = 12
        
        total_weeks = 0
        for rec in recommendations[:6]:  # Focus on top 6
            skill = rec["skill"].lower()
            if skill in ["git", "sql", "html", "css"]:
                total_weeks += beginner_weeks
            elif skill in ["python", "javascript", "react"]:
                total_weeks += intermediate_weeks
            else:
                total_weeks += advanced_weeks
        
        return {
            "total_estimated_weeks": min(total_weeks, 52),  # Cap at 1 year
            "intensive_track": f"{total_weeks // 2} weeks (full-time)",
            "part_time_track": f"{total_weeks} weeks (part-time)",
            "milestone_timeline": self._create_milestone_timeline(recommendations[:6])
        }
    
    def _create_milestone_timeline(self, recommendations: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """Create milestone timeline for skill development"""
        milestones = []
        cumulative_weeks = 0
        
        for i, rec in enumerate(recommendations):
            skill_weeks = 6  # Average weeks per skill
            cumulative_weeks += skill_weeks
            
            milestones.append({
                "milestone": f"Master {rec['skill']}",
                "week": cumulative_weeks,
                "description": f"Complete {rec['skill']} fundamentals and practical projects"
            })
        
        return milestones


class CareerPathRecommender:
    """
    AI-powered career path recommendation system
    """
    
    def __init__(self):
        self.career_graph = self._build_career_graph()
    
    async def recommend_career_paths(
        self,
        current_profile: Dict[str, Any],
        career_interests: List[str],
        time_horizon: str = "2-3 years"
    ) -> Dict[str, Any]:
        """
        Recommend potential career paths based on current profile and interests
        """
        try:
            # Analyze current position
            current_analysis = self._analyze_current_position(current_profile)
            
            # Find possible career transitions
            career_paths = self._find_career_paths(
                current_analysis, career_interests, time_horizon
            )
            
            # Rank paths by feasibility and alignment
            ranked_paths = self._rank_career_paths(career_paths, current_profile)
            
            return {
                "recommended_paths": ranked_paths,
                "current_position_analysis": current_analysis,
                "skill_development_priorities": self._get_skill_priorities(ranked_paths),
                "timeline_roadmap": self._create_career_roadmap(ranked_paths[0] if ranked_paths else None)
            }
            
        except Exception as e:
            logger.error(f"Career path recommendation failed: {str(e)}")
            return {"error": str(e)}
    
    def _build_career_graph(self) -> Dict[str, Any]:
        """Build career transition graph"""
        return {
            "software_engineer": {
                "transitions": ["senior_engineer", "tech_lead", "product_manager", "data_scientist"],
                "skills_needed": {
                    "senior_engineer": ["leadership", "architecture", "mentoring"],
                    "tech_lead": ["team_management", "project_planning", "architecture"],
                    "product_manager": ["analytics", "user_research", "business_strategy"],
                    "data_scientist": ["statistics", "machine_learning", "data_analysis"]
                }
            },
            "data_scientist": {
                "transitions": ["senior_data_scientist", "ml_engineer", "data_science_manager", "product_manager"],
                "skills_needed": {
                    "senior_data_scientist": ["deep_learning", "mlops", "mentoring"],
                    "ml_engineer": ["software_engineering", "devops", "model_deployment"],
                    "data_science_manager": ["leadership", "project_management", "business_strategy"]
                }
            }
        }
    
    def _analyze_current_position(self, profile: Dict[str, Any]) -> Dict[str, Any]:
        """Analyze current career position"""
        current_role = profile.get("current_role", "").lower()
        experience_years = profile.get("experience_years", 0)
        skills = profile.get("skills", [])
        
        # Determine career level
        if experience_years < 2:
            career_level = "junior"
        elif experience_years < 5:
            career_level = "mid"
        elif experience_years < 8:
            career_level = "senior"
        else:
            career_level = "principal"
        
        return {
            "current_role": current_role,
            "career_level": career_level,
            "experience_years": experience_years,
            "skill_count": len(skills),
            "technical_skills": [s for s in skills if s.lower() in [
                "python", "javascript", "java", "sql", "aws", "react", "machine learning"
            ]],
            "soft_skills": [s for s in skills if s.lower() in [
                "leadership", "communication", "project management", "mentoring"
            ]],
            "readiness_for_transition": self._assess_transition_readiness(profile)
        }
    
    def _find_career_paths(
        self,
        current_analysis: Dict[str, Any],
        interests: List[str],
        time_horizon: str
    ) -> List[Dict[str, Any]]:
        """Find possible career paths"""
        current_role = current_analysis["current_role"]
        career_paths = []
        
        # Get possible transitions from career graph
        transitions = self.career_graph.get(current_role, {}).get("transitions", [])
        
        for transition in transitions:
            # Check if transition aligns with interests
            alignment_score = self._calculate_interest_alignment(transition, interests)
            
            # Calculate feasibility based on current skills
            feasibility_score = self._calculate_transition_feasibility(
                current_analysis, transition
            )
            
            career_paths.append({
                "target_role": transition,
                "alignment_score": alignment_score,
                "feasibility_score": feasibility_score,
                "time_to_transition": self._estimate_transition_time(
                    current_analysis, transition, time_horizon
                ),
                "required_skills": self.career_graph.get(current_role, {}).get(
                    "skills_needed", {}
                ).get(transition, []),
                "salary_impact": self._estimate_salary_impact(current_role, transition)
            })
        
        return career_paths
    
    def _rank_career_paths(
        self,
        career_paths: List[Dict[str, Any]],
        current_profile: Dict[str, Any]
    ) -> List[Dict[str, Any]]:
        """Rank career paths by overall score"""
        
        for path in career_paths:
            # Calculate overall score
            overall_score = (
                path["alignment_score"] * 0.4 +
                path["feasibility_score"] * 0.4 +
                (1.0 / max(path["time_to_transition"], 1)) * 0.2
            )
            path["overall_score"] = overall_score
            
            # Add recommendation confidence
            path["confidence"] = min(overall_score, 0.95)
        
        return sorted(career_paths, key=lambda x: x["overall_score"], reverse=True)
    
    def _assess_transition_readiness(self, profile: Dict[str, Any]) -> float:
        """Assess readiness for career transition"""
        factors = []
        
        # Experience factor
        exp_years = profile.get("experience_years", 0)
        if exp_years >= 3:
            factors.append(0.8)
        else:
            factors.append(0.4)
        
        # Skills diversity factor
        skills_count = len(profile.get("skills", []))
        if skills_count >= 8:
            factors.append(0.9)
        elif skills_count >= 5:
            factors.append(0.7)
        else:
            factors.append(0.5)
        
        # Leadership experience factor
        has_leadership = any(
            skill.lower() in ["leadership", "management", "mentoring"]
            for skill in profile.get("skills", [])
        )
        factors.append(0.8 if has_leadership else 0.3)
        
        return sum(factors) / len(factors)
    
    def _calculate_interest_alignment(self, target_role: str, interests: List[str]) -> float:
        """Calculate how well target role aligns with interests"""
        role_keywords = {
            "tech_lead": ["leadership", "technology", "architecture"],
            "product_manager": ["product", "strategy", "user_experience"],
            "data_scientist": ["data", "analytics", "machine_learning"],
            "senior_engineer": ["engineering", "development", "technical"]
        }
        
        target_keywords = role_keywords.get(target_role, [target_role])
        interest_keywords = [interest.lower() for interest in interests]
        
        overlap = len(set(target_keywords) & set(interest_keywords))
        return overlap / len(target_keywords) if target_keywords else 0.5
    
    def _calculate_transition_feasibility(
        self,
        current_analysis: Dict[str, Any],
        target_role: str
    ) -> float:
        """Calculate feasibility of career transition"""
        base_feasibility = 0.5
        
        # Experience level factor
        career_level = current_analysis["career_level"]
        if career_level in ["mid", "senior"]:
            base_feasibility += 0.2
        
        # Skills alignment factor
        current_skills = set(skill.lower() for skill in 
                           current_analysis.get("technical_skills", []) + 
                           current_analysis.get("soft_skills", []))
        
        required_skills = set(self.career_graph.get(
            current_analysis["current_role"], {}
        ).get("skills_needed", {}).get(target_role, []))
        
        skills_match = len(current_skills & required_skills) / len(required_skills) if required_skills else 0.5
        base_feasibility += skills_match * 0.3
        
        return min(base_feasibility, 1.0)
    
    def _estimate_transition_time(
        self,
        current_analysis: Dict[str, Any],
        target_role: str,
        time_horizon: str
    ) -> int:
        """Estimate months needed for transition"""
        base_months = 12  # Base transition time
        
        # Adjust based on career level
        career_level = current_analysis["career_level"]
        if career_level == "junior":
            base_months += 6
        elif career_level == "senior":
            base_months -= 3
        
        # Adjust based on skills gap
        current_skills = len(current_analysis.get("technical_skills", []))
        if current_skills < 5:
            base_months += 6
        elif current_skills > 10:
            base_months -= 3
        
        return max(base_months, 6)  # Minimum 6 months
    
    def _estimate_salary_impact(self, current_role: str, target_role: str) -> Dict[str, Any]:
        """Estimate salary impact of career transition"""
        salary_multipliers = {
            "tech_lead": 1.2,
            "product_manager": 1.15,
            "senior_engineer": 1.1,
            "data_scientist": 1.05,
            "ml_engineer": 1.1
        }
        
        multiplier = salary_multipliers.get(target_role, 1.0)
        
        return {
            "percentage_increase": f"{(multiplier - 1) * 100:.0f}%",
            "salary_multiplier": multiplier,
            "timeline": "6-12 months after transition"
        }
    
    def _get_skill_priorities(self, career_paths: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """Get skill development priorities based on career paths"""
        if not career_paths:
            return []
        
        # Focus on top career path
        top_path = career_paths[0]
        required_skills = top_path.get("required_skills", [])
        
        priorities = []
        for i, skill in enumerate(required_skills[:5]):  # Top 5 skills
            priorities.append({
                "skill": skill,
                "priority": "high" if i < 2 else "medium",
                "relevance": f"Essential for {top_path['target_role']}",
                "estimated_learning_time": f"{(i + 1) * 4} weeks"
            })
        
        return priorities
    
    def _create_career_roadmap(self, top_path: Dict[str, Any]) -> Dict[str, Any]:
        """Create detailed career roadmap"""
        if not top_path:
            return {}
        
        transition_months = top_path.get("time_to_transition", 12)
        
        return {
            "target_role": top_path["target_role"],
            "timeline": f"{transition_months} months",
            "milestones": [
                {
                    "month": transition_months // 4,
                    "milestone": "Complete foundational skill development",
                    "activities": ["Learn core technical skills", "Start relevant projects"]
                },
                {
                    "month": transition_months // 2,
                    "milestone": "Gain relevant experience",
                    "activities": ["Take on stretch assignments", "Build portfolio"]
                },
                {
                    "month": transition_months * 3 // 4,
                    "milestone": "Demonstrate readiness",
                    "activities": ["Mentor others", "Lead initiatives"]
                },
                {
                    "month": transition_months,
                    "milestone": "Secure target role",
                    "activities": ["Apply for positions", "Interview preparation"]
                }
            ],
            "success_metrics": [
                "Complete required skill certifications",
                "Lead successful project in target domain",
                "Receive positive feedback from senior stakeholders",
                "Build relevant professional network"
            ]
        } 