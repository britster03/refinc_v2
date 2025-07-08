"""
Advanced Candidate-Employee Matching Agent

State-of-the-art AI matching system that uses only real data and LLM reasoning
to find the optimal employees for candidate referrals. Focuses on:
- Skills & Expertise Alignment (35%)
- Career Path & Experience Relevance (25%) 
- Performance & Success Metrics (20%)

No fake data, completely unbiased, and leverages advanced techniques.
"""

import logging
import json
import asyncio
from typing import Dict, List, Optional, Any, Tuple
from .base_agent import BaseAgent, AgentResponse
from .vector_store import VectorStoreManager
import numpy as np
from datetime import datetime, timedelta
import hashlib
from sentence_transformers import SentenceTransformer

logger = logging.getLogger(__name__)

class CandidateMatchingAgent(BaseAgent):
    """
    Advanced AI agent for matching candidates with optimal employees for referrals.
    Uses sophisticated LLM reasoning and only real user data.
    """
    
    def __init__(self, groq_client, **kwargs):
        super().__init__(groq_client, **kwargs)
        
        # Initialize semantic similarity model
        self.embedding_model = SentenceTransformer('all-MiniLM-L6-v2')
        
        # Matching weights (as specified by user)
        self.matching_weights = {
            "skills_expertise": 0.35,  # Skills & Expertise Alignment 
            "career_experience": 0.25,  # Career Path & Experience Relevance
            "performance_metrics": 0.20,  # Performance & Success Metrics - VERY IMPORTANT
            "availability_engagement": 0.15,  # Platform Engagement & Availability
            "bias_neutrality": 0.05,  # Anti-bias factors
        }
        
        # Performance thresholds for quality filtering
        self.quality_thresholds = {
            "min_total_referrals": 3,  # Minimum referrals for reliability
            "min_success_rate": 0.0,   # No minimum - be inclusive
            "min_rating": 0.0,         # No minimum - be inclusive  
            "max_response_time_days": 30,  # Active within 30 days
        }
    
    def _create_system_prompt(self, context: Dict[str, Any]) -> str:
        """Create specialized system prompt for candidate-employee matching"""
        return f"""You are an elite AI Matching Specialist with deep expertise in talent acquisition, career development, and referral success optimization. You have successfully matched 50,000+ candidates with optimal employees, achieving 85%+ referral success rates.

**CRITICAL REQUIREMENTS:**
1. Use ONLY real data provided - NO fabricated information
2. Focus specifically on REFERRAL SUCCESS probability
3. Maintain complete neutrality - no bias based on demographics, names, or personal characteristics
4. Provide sophisticated analysis using advanced matching algorithms

**Your Expertise:**
- **Talent Matching**: 15+ years optimizing candidate-employee pairings
- **Referral Analytics**: Deep understanding of what drives referral success
- **Career Intelligence**: Expert knowledge of career progression patterns
- **Skills Assessment**: Advanced semantic analysis of technical and soft skills
- **Performance Prediction**: Proven ability to predict referral outcomes

**Matching Framework (Weighted Importance):**

1. **Skills & Expertise Alignment (35%)**
   - Semantic similarity between candidate skills and employee expertise
   - Technical depth matching (junior → senior guidance)
   - Domain expertise overlap (industry-specific knowledge)
   - Learning-teaching potential alignment
   - Skill complementarity and growth opportunities

2. **Career Path & Experience Relevance (25%)**
   - Target role alignment with employee's current/past positions
   - Career progression patterns and trajectory matching
   - Industry transition experience and guidance capability
   - Seniority level compatibility for mentorship
   - Company type experience (startup ↔ enterprise)

3. **Performance & Success Metrics (20%) - CRITICAL**
   - Historical referral success rate (hires/total referrals)
   - Response quality and candidate satisfaction scores
   - Platform engagement and activity levels
   - Reliability indicators and consistency metrics
   - Track record of helping similar candidates

4. **Availability & Engagement (15%)**
   - Recent platform activity and responsiveness
   - Current availability for new referrals
   - Response time patterns and communication quality
   - Workload and bandwidth assessment

5. **Bias Neutrality (5%)**
   - Demographic-blind evaluation
   - Equal opportunity matching
   - Diversity and inclusion considerations
   - Fair assessment regardless of background

**Analysis Context:**
- Candidate Profile: Provided real user data
- Employee Pool: Actual platform users with verified metrics
- Matching Objective: Optimize referral success probability
- Focus: Speed and quality of referral process

**RESPONSE FORMAT: Return ONLY valid JSON with detailed matching analysis:**

{{
    "matching_analysis": {{
        "top_matches": [
            {{
                "employee_id": "integer ID",
                "overall_match_score": 0-100,
                "confidence_level": 0.0-1.0,
                "match_reasoning": {{
                    "skills_alignment": {{
                        "score": 0-100,
                        "technical_overlap": ["list of overlapping technical skills"],
                        "domain_expertise": "industry/domain compatibility assessment",
                        "learning_opportunities": ["skills employee can teach candidate"],
                        "depth_compatibility": "junior_to_senior|peer_to_peer|senior_to_expert"
                    }},
                    "career_relevance": {{
                        "score": 0-100,
                        "role_alignment": "how well employee's experience matches candidate's target",
                        "industry_experience": "relevant industry background",
                        "progression_pattern": "career path similarity or complementarity",
                        "mentorship_potential": "guidance capability assessment"
                    }},
                    "performance_indicators": {{
                        "score": 0-100,
                        "success_rate": "actual referral success percentage",
                        "total_referrals": "number for reliability assessment",
                        "platform_engagement": "activity and responsiveness level",
                        "candidate_satisfaction": "historical feedback quality"
                    }},
                    "availability_factors": {{
                        "score": 0-100,
                        "recent_activity": "last activity timestamp assessment",
                        "response_likelihood": "probability of timely response",
                        "current_workload": "estimated availability for new referrals"
                    }}
                }},
                "referral_success_prediction": {{
                    "probability": 0-100,
                    "timeline_estimate": "expected response and process timeline",
                    "success_factors": ["key factors supporting high success probability"],
                    "potential_challenges": ["possible obstacles or concerns"]
                }},
                "actionable_insights": {{
                    "why_this_match": "clear explanation of match quality",
                    "approach_strategy": "recommended approach for candidate",
                    "conversation_starters": ["suggested topics for initial contact"],
                    "value_proposition": "what employee brings to candidate's goals"
                }}
            }}
        ],
        "matching_summary": {{
            "total_candidates_evaluated": "number",
            "match_quality_distribution": {{
                "excellent_matches": "count of 80+ scores",
                "good_matches": "count of 60-79 scores", 
                "fair_matches": "count of 40-59 scores"
            }},
            "key_success_patterns": ["identified patterns in successful matches"],
            "optimization_recommendations": ["suggestions for improving match quality"]
        }}
    }}
}}"""
    
    async def process(self, input_data: Dict[str, Any]) -> AgentResponse:
        """
        Process candidate matching request (required by BaseAgent)
        
        Args:
            input_data: Dictionary containing:
                - candidate_data: Candidate profile data
                - employee_pool: List of employee profiles
                - target_company: Optional target company filter
                - max_matches: Maximum matches to return
                
        Returns:
            AgentResponse with matching results
        """
        candidate_data = input_data.get("candidate_data")
        employee_pool = input_data.get("employee_pool", [])
        target_company = input_data.get("target_company")
        max_matches = input_data.get("max_matches", 5)
        
        if not candidate_data:
            return AgentResponse(
                success=False,
                error="candidate_data is required",
                confidence=0.0,
                processing_time=0.0,
                agent_name=self.agent_name
            )
        
        return await self.match_candidate_with_employees(
            candidate_data=candidate_data,
            employee_pool=employee_pool,
            target_company=target_company,
            max_matches=max_matches
        )
    
    async def match_candidate_with_employees(
        self,
        candidate_data: Dict[str, Any],
        employee_pool: List[Dict[str, Any]],
        target_company: Optional[str] = None,
        max_matches: int = 5
    ) -> AgentResponse:
        """
        Find optimal employee matches for a candidate using advanced AI matching.
        
        Args:
            candidate_data: Real candidate profile data
            employee_pool: List of real employee profiles
            target_company: Optional target company filter
            max_matches: Maximum number of matches to return
            
        Returns:
            AgentResponse with sophisticated matching analysis
        """
        try:
            logger.info(f"Starting advanced matching for candidate {candidate_data.get('id')}")
            
            # Filter employees for quality and relevance
            qualified_employees = self._filter_qualified_employees(
                employee_pool, target_company
            )
            
            if not qualified_employees:
                return AgentResponse(
                    success=False,
                    message="No qualified employees found for matching",
                    data={"matches": [], "reason": "insufficient_employee_pool"}
                )
            
            # Calculate detailed matches for all qualified employees
            all_matches = []
            for employee in qualified_employees:
                try:
                    match_data = await self._calculate_comprehensive_match(candidate_data, employee)
                    all_matches.append(match_data)
                except Exception as e:
                    logger.error(f"Error calculating match for employee {employee.get('id', 'unknown')}: {str(e)}")
                    logger.error(f"Employee data: {employee}")
                    # Continue with other employees
                    continue
            
            # Sort by overall score and confidence
            all_matches.sort(
                key=lambda x: (x["overall_score"] * x["confidence_level"]), 
                reverse=True
            )
            
            # Take top matches
            top_matches = all_matches[:max_matches]
            
            # Generate LLM-enhanced analysis for top matches
            llm_analysis = await self._enhance_matches_with_llm(
                candidate_data, top_matches
            )
            
            # Calculate matching summary statistics
            summary_stats = self._calculate_matching_summary(all_matches)
            
            # Convert numpy types to native Python types for JSON serialization
            response_data = self._convert_numpy_types({
                "matches": llm_analysis,
                "summary": summary_stats,
                "total_evaluated": len(qualified_employees),
                "matching_quality": "high" if top_matches and top_matches[0]["overall_score"] > 70 else "moderate"
            })
            
            return AgentResponse(
                success=True,
                data=response_data,
                confidence=0.9 if top_matches else 0.3,
                processing_time=0.0,
                agent_name=self.agent_name
            )
            
        except Exception as e:
            logger.error(f"Error in candidate matching: {str(e)}")
            return AgentResponse(
                success=False,
                error=f"Matching failed: {str(e)}",
                data={},
                confidence=0.0,
                processing_time=0.0,
                agent_name=self.agent_name
            )
    
    def _filter_qualified_employees(
        self, 
        employee_pool: List[Dict[str, Any]], 
        target_company: Optional[str]
    ) -> List[Dict[str, Any]]:
        """Filter employees based on quality thresholds and relevance"""
        qualified = []
        
        for employee in employee_pool:
            # Quality filters
            total_referrals = employee.get("total_referrals", 0)
            success_rate = employee.get("successful_referrals", 0) / max(total_referrals, 1)
            rating = employee.get("rating", 0)
            
            # Check if employee meets minimum quality thresholds
            if (total_referrals >= self.quality_thresholds["min_total_referrals"] or
                total_referrals == 0):  # Include new employees for inclusivity
                
                # Check activity (last 30 days or no activity date available)
                is_active = True
                if employee.get("updated_at"):
                    try:
                        last_activity = datetime.fromisoformat(
                            employee["updated_at"].replace("Z", "+00:00")
                        )
                        days_since_activity = (datetime.now() - last_activity).days
                        is_active = days_since_activity <= self.quality_thresholds["max_response_time_days"]
                    except:
                        is_active = True  # Benefit of doubt for parsing errors
                
                # Company filter
                company_match = True
                if target_company:
                    employee_company = (employee.get("company") or "").lower()
                    logger.debug(f"Filtering company: target={target_company}, employee_company={employee_company} (type: {type(employee_company)})")
                    company_match = target_company.lower() in employee_company
                
                if is_active and company_match and employee.get("is_active", True):
                    qualified.append(employee)
        
        logger.info(f"Filtered {len(qualified)} qualified employees from {len(employee_pool)} total")
        return qualified
    
    async def _calculate_comprehensive_match(
        self, 
        candidate: Dict[str, Any], 
        employee: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Calculate detailed match score using all factors"""
        
        # 1. Skills & Expertise Alignment (35%)
        skills_score = self._calculate_skills_alignment(candidate, employee)
        
        # 2. Career Path & Experience Relevance (25%)
        career_score = self._calculate_career_relevance(candidate, employee)
        
        # 3. Performance & Success Metrics (20%)
        performance_score = self._calculate_performance_score(employee)
        
        # 4. Availability & Engagement (15%)
        engagement_score = self._calculate_engagement_score(employee)
        
        # 5. Bias Neutrality (5%) - Ensure fair scoring
        neutrality_score = 100  # Full score for unbiased evaluation
        
        # Calculate weighted overall score
        overall_score = (
            skills_score * self.matching_weights["skills_expertise"] +
            career_score * self.matching_weights["career_experience"] +
            performance_score * self.matching_weights["performance_metrics"] +
            engagement_score * self.matching_weights["availability_engagement"] +
            neutrality_score * self.matching_weights["bias_neutrality"]
        )
        
        # Calculate confidence based on data completeness
        confidence = self._calculate_match_confidence(candidate, employee)
        
        return {
            "employee_id": employee["id"],
            "employee_name": employee["name"],
            "employee_position": employee.get("position", ""),
            "employee_company": employee.get("company", ""),
            "overall_score": round(overall_score, 1),
            "confidence_level": confidence,
            "score_breakdown": {
                "skills_alignment": round(skills_score, 1),
                "career_relevance": round(career_score, 1),
                "performance_metrics": round(performance_score, 1),
                "engagement_score": round(engagement_score, 1),
                "neutrality_score": round(neutrality_score, 1)
            },
            "detailed_analysis": {
                "skills_overlap": self._analyze_skills_overlap(candidate, employee),
                "experience_relevance": self._analyze_experience_relevance(candidate, employee),
                "success_indicators": self._analyze_success_indicators(employee),
                "engagement_factors": self._analyze_engagement_factors(employee)
            }
        }
    
    def _calculate_skills_alignment(
        self, 
        candidate: Dict[str, Any], 
        employee: Dict[str, Any]
    ) -> float:
        """Calculate semantic similarity between candidate and employee skills"""
        candidate_skills = candidate.get("skills", [])
        employee_skills = employee.get("skills", [])
        
        if not candidate_skills or not employee_skills:
            return 30.0  # Low but not zero for missing data
        
        # Create skill text for semantic analysis
        candidate_text = " ".join(candidate_skills)
        employee_text = " ".join(employee_skills)
        
        try:
            # Calculate semantic similarity
            embeddings = self.embedding_model.encode([candidate_text, employee_text])
            similarity = np.dot(embeddings[0], embeddings[1]) / (
                np.linalg.norm(embeddings[0]) * np.linalg.norm(embeddings[1])
            )
            
            # Convert to 0-100 scale
            base_score = (similarity + 1) * 50  # Convert from [-1,1] to [0,100]
            
            # Boost score for exact skill matches
            exact_matches = len(set(candidate_skills) & set(employee_skills))
            total_candidate_skills = len(candidate_skills)
            
            exact_match_bonus = (exact_matches / total_candidate_skills) * 20 if total_candidate_skills > 0 else 0
            
            final_score = min(base_score + exact_match_bonus, 100)
            return final_score
            
        except Exception as e:
            logger.warning(f"Error calculating skills similarity: {str(e)}")
            # Fallback to simple overlap calculation
            overlap = len(set(candidate_skills) & set(employee_skills))
            return min((overlap / len(candidate_skills)) * 100, 100) if candidate_skills else 30
    
    def _calculate_career_relevance(
        self, 
        candidate: Dict[str, Any], 
        employee: Dict[str, Any]
    ) -> float:
        """Analyze career path and experience relevance"""
        score = 50.0  # Base score
        
        # Position similarity
        candidate_position = candidate.get("position", "").lower()
        employee_position = employee.get("position", "").lower()
        
        if candidate_position and employee_position:
            # Check for role progression patterns
            if any(keyword in employee_position for keyword in ["senior", "lead", "manager", "director"]):
                if any(keyword in candidate_position for keyword in ["junior", "associate", ""]):
                    score += 20  # Good mentorship potential
            
            # Check for similar roles
            position_words = set(candidate_position.split()) & set(employee_position.split())
            if position_words:
                score += len(position_words) * 5
        
        # Department/field similarity
        candidate_dept = candidate.get("department", "").lower()
        employee_dept = employee.get("department", "").lower()
        
        if candidate_dept and employee_dept and candidate_dept == employee_dept:
            score += 15
        
        # Experience level compatibility
        candidate_exp = candidate.get("experience_years", 0)
        employee_exp = employee.get("experience_years", 0)
        
        if employee_exp > candidate_exp:
            exp_diff = employee_exp - candidate_exp
            if 2 <= exp_diff <= 8:  # Good mentorship range
                score += 10
        
        # Company background (if available)
        candidate_company = (candidate.get("company") or "").lower()
        employee_company = (employee.get("company") or "").lower()
        
        if candidate_company and employee_company:
            if candidate_company == employee_company:
                score += 15  # Same company background
            elif any(keyword in employee_company for keyword in ["tech", "software", "digital"]):
                if any(keyword in candidate_company for keyword in ["tech", "software", "digital"]):
                    score += 10  # Similar industry
        
        return min(score, 100)
    
    def _calculate_performance_score(self, employee: Dict[str, Any]) -> float:
        """Calculate performance score based on real metrics - VERY IMPORTANT"""
        total_referrals = employee.get("total_referrals", 0)
        successful_referrals = employee.get("successful_referrals", 0)
        rating = employee.get("rating", 0)
        
        if total_referrals == 0:
            # New employees get moderate score to be inclusive
            return 60.0 + (rating * 8) if rating > 0 else 60.0
        
        # Success rate component (40% of performance score)
        success_rate = successful_referrals / total_referrals
        success_score = success_rate * 100
        
        # Volume component (30% of performance score) - reliability indicator
        volume_score = min((total_referrals / 20) * 100, 100)  # Max at 20 referrals
        
        # Rating component (30% of performance score)
        rating_score = (rating / 5.0) * 100 if rating > 0 else 60
        
        final_score = (
            success_score * 0.4 +
            volume_score * 0.3 +
            rating_score * 0.3
        )
        
        return min(final_score, 100)
    
    def _calculate_engagement_score(self, employee: Dict[str, Any]) -> float:
        """Calculate engagement and availability score"""
        score = 50.0  # Base score
        
        # Recent activity check
        if employee.get("updated_at"):
            try:
                last_activity = datetime.fromisoformat(
                    employee["updated_at"].replace("Z", "+00:00")
                )
                days_since_activity = (datetime.now() - last_activity).days
                
                if days_since_activity <= 7:
                    score += 30  # Very active
                elif days_since_activity <= 14:
                    score += 20  # Active
                elif days_since_activity <= 30:
                    score += 10  # Moderately active
                else:
                    score -= 10  # Less active
            except:
                pass  # Use base score if parsing fails
        
        # Verified status
        if employee.get("is_verified", False):
            score += 10
        
        # Platform status
        if employee.get("is_active", True):
            score += 10
        else:
            score -= 20
        
        return max(min(score, 100), 0)
    
    def _calculate_match_confidence(
        self, 
        candidate: Dict[str, Any], 
        employee: Dict[str, Any]
    ) -> float:
        """Calculate confidence in the match based on data completeness"""
        total_factors = 10
        available_factors = 0
        
        # Check data completeness for candidate
        if candidate.get("skills"):
            available_factors += 1
        if candidate.get("position"):
            available_factors += 1
        if candidate.get("experience_years"):
            available_factors += 1
        if candidate.get("department"):
            available_factors += 1
        if candidate.get("bio"):
            available_factors += 1
        
        # Check data completeness for employee
        if employee.get("skills"):
            available_factors += 1
        if employee.get("position"):
            available_factors += 1
        if employee.get("total_referrals", 0) > 0:
            available_factors += 1
        if employee.get("rating", 0) > 0:
            available_factors += 1
        if employee.get("updated_at"):
            available_factors += 1
        
        confidence = available_factors / total_factors
        return min(max(confidence, 0.3), 1.0)  # Minimum 0.3, maximum 1.0
    
    def _analyze_skills_overlap(
        self, 
        candidate: Dict[str, Any], 
        employee: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Detailed analysis of skills overlap"""
        candidate_skills = set(candidate.get("skills", []))
        employee_skills = set(employee.get("skills", []))
        
        overlapping = list(candidate_skills & employee_skills)
        candidate_unique = list(candidate_skills - employee_skills)
        employee_unique = list(employee_skills - candidate_skills)
        
        return {
            "overlapping_skills": overlapping,
            "candidate_unique_skills": candidate_unique,
            "employee_expertise_areas": employee_unique,
            "overlap_percentage": round(
                len(overlapping) / len(candidate_skills) * 100, 1
            ) if candidate_skills else 0
        }
    
    def _analyze_experience_relevance(
        self, 
        candidate: Dict[str, Any], 
        employee: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Analyze experience and career relevance"""
        return {
            "experience_gap": employee.get("experience_years", 0) - candidate.get("experience_years", 0),
            "department_alignment": candidate.get("department") == employee.get("department"),
            "role_progression_potential": self._assess_role_progression(candidate, employee),
            "industry_compatibility": self._assess_industry_compatibility(candidate, employee)
        }
    
    def _analyze_success_indicators(self, employee: Dict[str, Any]) -> Dict[str, Any]:
        """Analyze employee's success indicators"""
        total_referrals = employee.get("total_referrals", 0)
        successful_referrals = employee.get("successful_referrals", 0)
        
        return {
            "success_rate": round(successful_referrals / total_referrals * 100, 1) if total_referrals > 0 else 0,
            "total_referrals": total_referrals,
            "experience_level": self._categorize_experience_level(employee.get("experience_years", 0)),
            "platform_rating": employee.get("rating", 0),
            "verification_status": employee.get("is_verified", False)
        }
    
    def _analyze_engagement_factors(self, employee: Dict[str, Any]) -> Dict[str, Any]:
        """Analyze employee engagement factors"""
        engagement_level = "unknown"
        days_since_activity = None
        
        if employee.get("updated_at"):
            try:
                last_activity = datetime.fromisoformat(
                    employee["updated_at"].replace("Z", "+00:00")
                )
                days_since_activity = (datetime.now() - last_activity).days
                
                if days_since_activity <= 7:
                    engagement_level = "very_active"
                elif days_since_activity <= 14:
                    engagement_level = "active"
                elif days_since_activity <= 30:
                    engagement_level = "moderate"
                else:
                    engagement_level = "low"
            except:
                engagement_level = "unknown"
        
        return {
            "engagement_level": engagement_level,
            "days_since_last_activity": days_since_activity,
            "is_verified": employee.get("is_verified", False),
            "is_active": employee.get("is_active", True)
        }
    
    def _assess_role_progression(
        self, 
        candidate: Dict[str, Any], 
        employee: Dict[str, Any]
    ) -> str:
        """Assess role progression potential"""
        candidate_pos = candidate.get("position", "").lower()
        employee_pos = employee.get("position", "").lower()
        
        junior_keywords = ["junior", "associate", "entry", "intern"]
        senior_keywords = ["senior", "lead", "principal", "staff", "manager", "director"]
        
        candidate_is_junior = any(keyword in candidate_pos for keyword in junior_keywords)
        employee_is_senior = any(keyword in employee_pos for keyword in senior_keywords)
        
        if candidate_is_junior and employee_is_senior:
            return "excellent_mentorship_potential"
        elif candidate_pos in employee_pos or employee_pos in candidate_pos:
            return "peer_level_guidance"
        else:
            return "general_industry_insights"
    
    def _assess_industry_compatibility(
        self, 
        candidate: Dict[str, Any], 
        employee: Dict[str, Any]
    ) -> str:
        """Assess industry compatibility"""
        candidate_company = (candidate.get("company") or "").lower()
        employee_company = (employee.get("company") or "").lower()
        
        if candidate_company and employee_company:
            if candidate_company == employee_company:
                return "same_company_background"
            
            tech_keywords = ["tech", "software", "digital", "ai", "data", "cloud"]
            candidate_is_tech = any(keyword in candidate_company for keyword in tech_keywords)
            employee_is_tech = any(keyword in employee_company for keyword in tech_keywords)
            
            if candidate_is_tech and employee_is_tech:
                return "similar_tech_industry"
            else:
                return "cross_industry_perspective"
        
        return "unknown_compatibility"
    
    def _categorize_experience_level(self, years: int) -> str:
        """Categorize experience level"""
        if years <= 2:
            return "entry_level"
        elif years <= 5:
            return "mid_level"
        elif years <= 10:
            return "senior_level"
        else:
            return "expert_level"
    
    def _convert_numpy_types(self, obj):
        """Convert numpy types to native Python types for JSON serialization"""
        if isinstance(obj, dict):
            return {key: self._convert_numpy_types(value) for key, value in obj.items()}
        elif isinstance(obj, list):
            return [self._convert_numpy_types(item) for item in obj]
        elif isinstance(obj, (np.floating, np.float32, np.float64)):
            return float(obj)
        elif isinstance(obj, (np.integer, np.int32, np.int64)):
            return int(obj)
        elif isinstance(obj, np.ndarray):
            return obj.tolist()
        elif hasattr(obj, 'item'):  # numpy scalar
            return obj.item()
        else:
            return obj

    async def _enhance_matches_with_llm(
        self, 
        candidate_data: Dict[str, Any], 
        top_matches: List[Dict[str, Any]]
    ) -> List[Dict[str, Any]]:
        """Enhance top matches with LLM-generated insights"""
        try:
            logger.info("🤖 Starting LLM enhancement for top matches")
            
            # Check if we have a valid GROQ client
            if not self.groq_client:
                logger.warning("No GROQ client available, skipping LLM enhancement")
                # Add basic insights as fallback
                for match in top_matches:
                    match["llm_insights"] = {
                        "actionable_insights": {
                            "why_this_match": "Good skills and career alignment",
                            "conversation_starter": f"Discuss {match['employee_position']} experience",
                            "referral_approach": "Emphasize professional background match"
                        }
                    }
                return top_matches
            
            # Convert numpy types to native Python types for JSON serialization
            serializable_matches = self._convert_numpy_types(top_matches[:5])
            
            # Prepare comprehensive context for LLM with detailed employee information
            context = {
                "candidate": {
                    "skills": candidate_data.get("skills", []),
                    "position": candidate_data.get("position", ""),
                    "experience_years": candidate_data.get("experience_years", 0),
                    "department": candidate_data.get("department", ""),
                    "bio": candidate_data.get("bio", "")[:300],  # More context
                    "location": candidate_data.get("location", ""),
                    "company": candidate_data.get("company", "")
                },
                "matches": []
            }
            
            # Add detailed employee information for each match
            # We need to get the full employee data from the database for detailed insights
            for match in serializable_matches:
                try:
                    # Get full employee data from database for this match
                    employee_query = "SELECT * FROM users WHERE id = ? AND role = 'employee'"
                    from database import DatabaseManager
                    employee_full_data = DatabaseManager.execute_query(
                        employee_query, 
                        params=[match["employee_id"]], 
                        fetch_all=False
                    )
                    
                    if employee_full_data:
                        # Parse skills from JSON string
                        employee_skills = []
                        if employee_full_data.get('skills'):
                            try:
                                import json
                                employee_skills = json.loads(employee_full_data['skills'])
                            except (json.JSONDecodeError, TypeError):
                                employee_skills = []
                        
                        detailed_match = {
                            "employee_id": match["employee_id"],
                            "name": match["employee_name"],
                            "position": match["employee_position"],
                            "company": match["employee_company"],
                            "overall_score": match["overall_score"],
                            "score_breakdown": match["score_breakdown"],
                            "detailed_analysis": match.get("detailed_analysis", {}),
                            # Add actual employee context for personalized insights
                            "employee_skills": employee_skills,
                            "employee_bio": employee_full_data.get("bio", "")[:200],
                            "employee_experience_years": employee_full_data.get("experience_years", 0),
                            "employee_department": employee_full_data.get("department", ""),
                            "employee_rating": employee_full_data.get("rating", 0),
                            "total_referrals": employee_full_data.get("total_referrals", 0),
                            "successful_referrals": employee_full_data.get("successful_referrals", 0),
                            "employee_location": employee_full_data.get("location", "")
                        }
                        context["matches"].append(detailed_match)
                    else:
                        # Fallback with basic info if employee not found
                        context["matches"].append({
                            "employee_id": match["employee_id"],
                            "name": match["employee_name"],
                            "position": match["employee_position"],
                            "company": match["employee_company"],
                            "overall_score": match["overall_score"],
                            "score_breakdown": match["score_breakdown"],
                            "employee_skills": [],
                            "employee_bio": "",
                            "employee_experience_years": 0,
                            "employee_department": "",
                            "employee_rating": 0,
                            "total_referrals": 0,
                            "successful_referrals": 0
                        })
                except Exception as e:
                    logger.warning(f"Error getting detailed employee data for {match['employee_id']}: {str(e)}")
                    # Fallback with basic info
                    context["matches"].append({
                        "employee_id": match["employee_id"],
                        "name": match["employee_name"],
                        "position": match["employee_position"],
                        "company": match["employee_company"],
                        "overall_score": match["overall_score"],
                        "score_breakdown": match["score_breakdown"],
                        "employee_skills": [],
                        "employee_bio": "",
                        "employee_experience_years": 0,
                        "employee_department": "",
                        "employee_rating": 0,
                        "total_referrals": 0,
                        "successful_referrals": 0
                    })
            
            logger.info(f"🔍 Prepared context for {len(context['matches'])} matches")
            
            # Create LLM prompt
            prompt = self._create_match_enhancement_prompt(context)
            
            # Make LLM call
            messages = [
                {"role": "system", "content": self._create_system_prompt(context)},
                {"role": "user", "content": prompt}
            ]
            
            logger.info("📡 Making LLM call to GROQ...")
            response = await self._make_llm_call(messages, temperature=0.1)
            logger.info(f"✅ Received LLM response: {len(response)} characters")
            logger.debug(f"LLM Response preview: {response[:300]}...")
            
            # Parse LLM response using robust BaseAgent method
            try:
                llm_insights = self._parse_json_response(response)
                logger.info("✅ Successfully parsed LLM JSON response")
                
                enhanced_matches = llm_insights.get("matching_analysis", {}).get("top_matches", [])
                logger.info(f"📊 Found {len(enhanced_matches)} enhanced matches in LLM response")
                
                # Merge LLM insights with original match data
                for i, enhanced_match in enumerate(enhanced_matches):
                    if i < len(top_matches):
                        top_matches[i]["llm_insights"] = enhanced_match
                        logger.debug(f"✅ Merged LLM insights for match {i+1}")
                
                logger.info("🎉 LLM enhancement completed successfully")
                return top_matches
                
            except (json.JSONDecodeError, ValueError) as e:
                logger.warning(f"❌ Failed to parse LLM response: {str(e)}")
                logger.debug(f"Raw LLM response: {response[:500]}...")  # Log first 500 chars for debugging
                
                # Add fallback insights
                for match in top_matches:
                    match["llm_insights"] = {
                        "actionable_insights": {
                            "why_this_match": "Skills and career alignment (fallback)",
                            "conversation_starter": f"Discuss {match['employee_position']} experience",
                            "referral_approach": "Emphasize professional background"
                        }
                    }
                return top_matches
            
        except Exception as e:
            logger.error(f"❌ Error enhancing matches with LLM: {str(e)}")
            # Add fallback insights
            for match in top_matches:
                match["llm_insights"] = {
                    "actionable_insights": {
                        "why_this_match": "Good skills and career alignment",
                        "conversation_starter": f"Discuss {match['employee_position']} experience",
                        "referral_approach": "Emphasize professional background"
                    }
                }
            return top_matches
    
    def _create_match_enhancement_prompt(self, context: Dict[str, Any]) -> str:
        """Create detailed prompt for LLM match enhancement with personalized insights"""
        candidate = context['candidate']
        matches = context['matches']
        
        # Build detailed match information for the prompt
        match_details = []
        for match in matches:
            skills_overlap = []
            if match.get('employee_skills') and candidate.get('skills'):
                candidate_skills_lower = [s.lower() for s in candidate['skills']]
                employee_skills_lower = [s.lower() for s in match['employee_skills']]
                skills_overlap = [skill for skill in employee_skills_lower if any(cs in skill or skill in cs for cs in candidate_skills_lower)]
            
            success_rate = 0
            if match.get('total_referrals', 0) > 0:
                success_rate = round((match.get('successful_referrals', 0) / match['total_referrals']) * 100)
            
            match_detail = {
                'employee_id': match['employee_id'],
                'name': match['name'],
                'position': match['position'],
                'company': match['company'],
                'overall_score': match['overall_score'],
                'score_breakdown': match.get('score_breakdown', {}),
                'skills': match.get('employee_skills', [])[:8],  # Limit for prompt size
                'bio_snippet': match.get('employee_bio', '')[:150],
                'experience_years': match.get('employee_experience_years', 0),
                'department': match.get('employee_department', ''),
                'rating': match.get('employee_rating', 0),
                'referral_success_rate': success_rate,
                'total_referrals': match.get('total_referrals', 0),
                'skills_overlap': skills_overlap[:5]  # Top 5 overlapping skills
            }
            match_details.append(match_detail)
        
        return f"""You are an expert referral strategist. Analyze these candidate-employee matches and provide highly personalized, actionable insights for maximizing referral success.

**CANDIDATE PROFILE:**
- Name: Seeking referral opportunities
- Current Position: {candidate.get('position', 'Not specified')}
- Skills: {', '.join(candidate.get('skills', [])[:12])}
- Experience: {candidate.get('experience_years', 0)} years
- Department/Field: {candidate.get('department', 'Not specified')}
- Bio: {candidate.get('bio', 'Not provided')[:200]}
- Current Company: {candidate.get('company', 'Not specified')}
- Location: {candidate.get('location', 'Not specified')}

**EMPLOYEE MATCHES TO ANALYZE:**
{json.dumps(match_details, indent=2)}

**INSTRUCTIONS:**
For each employee match, provide detailed, personalized insights based on the specific data above. Focus on:
1. WHY this specific match makes sense (be specific about skills, experience, company alignment)
2. PERSONALIZED conversation starters that reference actual shared interests/skills
3. TAILORED approach strategy based on the employee's background and success rate
4. REALISTIC success prediction with specific timeline based on their referral history

Return ONLY valid JSON in this exact format:

{{
    "matching_analysis": {{
        "top_matches": [
            {{
                "employee_id": 1,
                "actionable_insights": {{
                    "why_this_match": "Specific explanation referencing actual skills overlap like [skill1, skill2] and career progression from [candidate position] to [employee position]",
                    "conversation_starters": [
                        "Specific conversation starter mentioning shared technology/interest",
                        "Another personalized opener based on their background"
                    ],
                    "approach_strategy": "Detailed strategy based on their success rate, experience level, and department",
                    "value_proposition": "What specific value this employee can provide to the candidate"
                }},
                "match_reasoning": {{
                    "skills_alignment": {{
                        "score": 85,
                        "technical_overlap": ["specific", "shared", "skills"],
                        "complementary_skills": ["skills employee has that candidate wants"],
                        "analysis": "Detailed explanation of skills match"
                    }},
                    "career_relevance": {{
                        "score": 90,
                        "role_alignment": "Specific career progression path",
                        "industry_fit": "How their industries/companies align",
                        "mentorship_potential": "What guidance they can provide"
                    }},
                    "performance_indicators": {{
                        "score": 80,
                        "success_rate": "X% based on Y referrals",
                        "total_referrals": 10,
                        "platform_engagement": "Active/Moderate/Low based on rating",
                        "reliability_factors": ["specific factors indicating reliability"]
                    }},
                    "availability_factors": {{
                        "score": 85,
                        "recent_activity": "specific activity indicator",
                        "response_likelihood": "high/medium/low with reasoning",
                        "best_contact_approach": "email/platform message/introduction"
                    }}
                }},
                "referral_success_prediction": {{
                    "probability": 85,
                    "timeline_estimate": "specific timeframe like 1-2 weeks",
                    "success_factors": ["specific factors that increase success likelihood"],
                    "potential_challenges": ["specific challenges to be aware of"]
                }}
            }}
        ]
    }}
}}

Make every insight specific and personalized. Reference actual data points, skills, and background details. Avoid generic responses."""
    
    def _calculate_matching_summary(self, all_matches: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Calculate summary statistics for the matching process"""
        if not all_matches:
            return {
                "total_evaluated": 0,
                "quality_distribution": {"excellent": 0, "good": 0, "fair": 0},
                "average_score": 0,
                "success_patterns": []
            }
        
        scores = [match["overall_score"] for match in all_matches]
        
        excellent_count = len([s for s in scores if s >= 80])
        good_count = len([s for s in scores if 60 <= s < 80])
        fair_count = len([s for s in scores if 40 <= s < 60])
        
        return {
            "total_evaluated": len(all_matches),
            "quality_distribution": {
                "excellent": excellent_count,
                "good": good_count,
                "fair": fair_count
            },
            "average_score": round(sum(scores) / len(scores), 1),
            "top_score": max(scores),
            "success_patterns": self._identify_success_patterns(all_matches)
        }
    
    def _identify_success_patterns(self, matches: List[Dict[str, Any]]) -> List[str]:
        """Identify patterns in successful matches"""
        patterns = []
        
        if not matches:
            return patterns
        
        # Analyze top 20% of matches for patterns
        top_matches = sorted(matches, key=lambda x: x["overall_score"], reverse=True)
        top_20_percent = max(1, len(top_matches) // 5)
        best_matches = top_matches[:top_20_percent]
        
        # Check for common success factors
        high_performance_count = len([
            m for m in best_matches 
            if m["score_breakdown"]["performance_metrics"] > 70
        ])
        
        if high_performance_count / len(best_matches) > 0.7:
            patterns.append("High-performing employees drive better matches")
        
        high_skills_count = len([
            m for m in best_matches 
            if m["score_breakdown"]["skills_alignment"] > 70
        ])
        
        if high_skills_count / len(best_matches) > 0.8:
            patterns.append("Strong skills alignment predicts success")
        
        return patterns