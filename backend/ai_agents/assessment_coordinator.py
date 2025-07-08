"""
Assessment Coordinator

Master coordinator that orchestrates all AI agents to provide comprehensive
candidate assessment with advanced agentic capabilities and intelligent workflow management.
"""

import logging
import asyncio
from typing import Dict, List, Optional, Any, Tuple
from datetime import datetime
from .base_agent import BaseAgent, AgentResponse
from .skills_extractor import SkillsExtractorAgent
from .resume_analyzer import ResumeAnalyzerAgent
from .job_matcher import JobMatcherAgent
from .vector_store import VectorStoreManager
import json

logger = logging.getLogger(__name__)

class AssessmentCoordinator(BaseAgent):
    """
    Master coordinator for comprehensive candidate assessment using multiple AI agents
    """
    
    def __init__(
        self,
        groq_client,
        vector_store: VectorStoreManager,
        **kwargs
    ):
        super().__init__(groq_client, **kwargs)
        
        # Initialize specialized agents
        self.skills_extractor = SkillsExtractorAgent(groq_client, **kwargs)
        self.resume_analyzer = ResumeAnalyzerAgent(groq_client, **kwargs)
        self.job_matcher = JobMatcherAgent(groq_client, **kwargs)
        self.vector_store = vector_store
        
        # Assessment workflow configuration
        self.workflow_config = {
            "parallel_processing": True,
            "enable_vector_search": True,
            "enable_market_analysis": True,
            "enable_competitive_analysis": True,
            "confidence_threshold": 0.7
        }
        
        # Assessment weights for final scoring
        self.assessment_weights = {
            "skills_match": 0.30,
            "resume_quality": 0.25,
            "job_compatibility": 0.25,
            "market_competitiveness": 0.10,
            "growth_potential": 0.10
        }
    
    def _create_system_prompt(self, context: Dict[str, Any]) -> str:
        """Create system prompt for final assessment synthesis"""
        return f"""You are the Master Assessment Coordinator, an elite AI system that synthesizes comprehensive candidate evaluations from multiple specialized AI agents. You have the expertise of a senior executive recruiter, career strategist, and talent acquisition leader with 15+ years of experience.

CRITICAL: You MUST respond with ONLY valid JSON. Do not include any markdown formatting, explanations, or text outside the JSON structure.

**Your Core Expertise:**
1. **Strategic Talent Assessment**: Synthesize multi-dimensional candidate profiles with precision
2. **Market-Informed Evaluation**: Integrate current market conditions, salary trends, and industry demands
3. **Actionable Intelligence**: Generate specific, measurable recommendations with clear ROI
4. **Risk-Calibrated Scoring**: Provide realistic assessments considering competitive landscape
5. **Executive-Level Insights**: Deliver C-suite quality analysis for strategic hiring decisions

**Assessment Philosophy:**
- **Data-Driven**: Base all conclusions on concrete evidence from agent analyses
- **Market-Realistic**: Consider current hiring market, competition, and economic conditions
- **Outcome-Focused**: Prioritize recommendations that drive measurable career/hiring outcomes
- **Specificity Over Generality**: Provide precise, actionable insights rather than generic advice
- **ROI-Conscious**: Evaluate effort vs. impact for all recommendations

**Assessment Context:**
- Analysis Timestamp: {context.get('timestamp', 'Unknown')}
- Multi-Agent Analysis Depth: Comprehensive 7-Agent Pipeline
- Vector Database Integration: {context.get('vector_enabled', 'Enabled')} (Similarity matching with 10k+ profiles)
- Real-Time Market Analysis: {context.get('market_analysis', 'Enabled')} (Live job market data)
- Confidence Metrics: Skills {context.get('skills_confidence', 'N/A')}% | Resume {context.get('resume_confidence', 'N/A')}% | Matching {context.get('matching_confidence', 'N/A')}%

**Quality Standards:**
- All scores must be evidence-based and calibrated to market reality
- Recommendations must include specific actions, timelines, and success metrics
- Risk assessments must consider multiple scenarios and mitigation strategies
- Strategic advice must align with current industry trends and hiring patterns

Synthesize all agent results into a comprehensive assessment in JSON format:
{{
    "executive_summary": {{
        "overall_assessment": "excellent|good|fair|poor",
        "overall_score": 0-100,
        "key_strengths": ["3-5 specific, quantifiable strengths with evidence"],
        "key_concerns": ["3-5 specific concerns with impact assessment"],
        "recommendation": "strong_hire|conditional_hire|develop_first|not_recommended",
        "confidence_level": 0-100,
        "market_positioning": "top_10_percent|above_average|average|below_average",
        "competitive_advantage": "primary unique value proposition"
    }},
    "detailed_analysis": {{
        "skills_assessment": {{
            "technical_proficiency": 0-100,
            "skill_breadth": 0-100,
            "skill_depth": 0-100,
            "market_relevance": 0-100,
            "emerging_skills": ["specific trending skills with market demand data"],
            "skill_gaps": ["critical gaps with business impact"],
            "learning_velocity": 0-100
        }},
        "experience_evaluation": {{
            "experience_relevance": 0-100,
            "career_progression": 0-100,
            "leadership_potential": 0-100,
            "industry_expertise": 0-100,
            "project_impact": 0-100,
            "scalability_indicators": ["evidence of ability to handle increased responsibility"],
            "innovation_track_record": 0-100
        }},
        "resume_quality": {{
            "presentation_score": 0-100,
            "content_quality": 0-100,
            "ats_compatibility": 0-100,
            "professional_branding": 0-100,
            "storytelling_effectiveness": 0-100,
            "quantification_level": 0-100
        }},
        "market_positioning": {{
            "competitiveness": 0-100,
            "salary_expectations": "market_aligned|above_market|below_market",
            "demand_level": "high|medium|low",
            "unique_value_proposition": ["specific differentiators with market value"],
            "hiring_timeline": "immediate|1-3_months|3-6_months",
            "negotiation_leverage": 0-100
        }}
    }},
    "strategic_recommendations": {{
        "immediate_actions": [
            {{
                "action": "specific, measurable action with clear deliverable",
                "priority": "high|medium|low",
                "timeline": "specific timeframe (e.g., 2 weeks, 1 month)",
                "expected_impact": "quantified impact on hiring probability or career advancement",
                "difficulty": "easy|medium|hard",
                "success_metrics": ["specific KPIs to track progress"],
                "resources_required": ["specific tools, budget, or support needed"]
            }}
        ],
        "skill_development": [
            {{
                "skill": "specific skill with market context",
                "current_level": "beginner|intermediate|advanced|expert",
                "target_level": "intermediate|advanced|expert",
                "learning_path": ["step-by-step progression with specific resources"],
                "timeline": "realistic timeframe with milestones",
                "market_impact": "quantified impact on salary/opportunities",
                "roi_analysis": "effort vs. career benefit ratio"
            }}
        ],
        "career_guidance": [
            {{
                "area": "specific career development focus",
                "recommendation": "actionable strategy with implementation steps",
                "rationale": "market-based reasoning with data support",
                "success_metrics": ["measurable outcomes to track"],
                "competitive_advantage": "how this differentiates from other candidates"
            }}
        ]
    }},
    "risk_assessment": {{
        "hiring_risks": [
            {{
                "risk": "specific, measurable risk factor",
                "probability": "high|medium|low",
                "impact": "high|medium|low",
                "mitigation": "specific strategy with implementation steps",
                "monitoring_indicators": ["early warning signs to watch"]
            }}
        ],
        "success_probability": 0-100,
        "retention_likelihood": 0-100,
        "performance_prediction": 0-100,
        "cultural_fit_score": 0-100,
        "growth_potential": 0-100
    }},
    "next_steps": {{
        "for_candidate": ["specific actions with deadlines and success criteria"],
        "for_recruiter": ["tactical steps for recruitment process optimization"],
        "for_hiring_manager": ["strategic considerations for team integration"],
        "timeline": "prioritized timeline with key milestones",
        "decision_framework": "criteria for go/no-go decisions at each stage"
    }}
}}"""
    
    async def process(self, input_data: Dict[str, Any]) -> AgentResponse:
        """
        Main processing method for comprehensive candidate assessment
        """
        return await self._process_with_timing(self._coordinate_assessment, input_data)
    
    async def _coordinate_assessment(self, input_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Coordinate comprehensive candidate assessment using all agents
        Enhanced to support user preferences and iterative analysis
        """
        resume_text = input_data.get("resume_text", "")
        job_description = input_data.get("job_description", "")
        user_id = input_data.get("user_id")
        analysis_context = input_data.get("analysis_context", {})
        
        if not resume_text:
            raise ValueError("Resume text is required for assessment")
        
        logger.info(f"Starting comprehensive assessment for user {user_id}")
        
        # Extract user preferences and context
        user_preferences = analysis_context.get("user_preferences", {})
        iteration_type = analysis_context.get("iteration_type", "initial")
        iteration_number = analysis_context.get("iteration_number", 1)
        
        # Phase 1: Check Vector Database Readiness
        vector_readiness = await self._check_vector_readiness()
        
        # Phase 2: Parallel Agent Processing (with preferences)
        agent_results = await self._run_parallel_agents(resume_text, job_description, user_preferences)
        
        # Phase 3: Vector Database Operations (conditional)
        vector_results = await self._perform_vector_operations(
            resume_text, job_description, user_id, vector_readiness
        )
        
        # Phase 4: Market and Competitive Analysis
        market_analysis = await self._perform_market_analysis(agent_results, resume_text, user_preferences)
        
        # Phase 5: Synthesis and Final Assessment (with preferences)
        final_assessment = await self._synthesize_assessment(
            agent_results, vector_results, market_analysis, resume_text, job_description, user_preferences
        )
        
        # Phase 5: Generate Actionable Insights
        actionable_insights = await self._generate_actionable_insights(final_assessment, agent_results)
        
        # Combine all results
        comprehensive_assessment = {
            "assessment_metadata": {
                "timestamp": datetime.utcnow().isoformat(),
                "user_id": user_id,
                "processing_time": 0,  # Will be calculated by base class
                "agents_used": ["skills_extractor", "resume_analyzer", "job_matcher"],
                "vector_search_enabled": self.workflow_config["enable_vector_search"],
                "confidence_scores": {
                    "skills_extraction": agent_results.get("skills", {}).get("confidence", 0),
                    "resume_analysis": agent_results.get("resume", {}).get("confidence", 0),
                    "job_matching": agent_results.get("matching", {}).get("confidence", 0)
                }
            },
            "agent_results": agent_results,
            "vector_analysis": vector_results,
            "market_analysis": market_analysis,
            "final_assessment": final_assessment,
            "actionable_insights": actionable_insights
        }
        
        # Store results in vector database for future reference
        if self.workflow_config["enable_vector_search"]:
            await self._store_assessment_results(comprehensive_assessment, user_id)
        
        return comprehensive_assessment
    
    async def _check_vector_readiness(self) -> Dict[str, Any]:
        """
        Check if vector database is ready for competitive analysis
        """
        try:
            is_ready = await self.vector_store.check_vector_readiness()
            return {
                "enabled": is_ready,
                "current_count": self.vector_store.current_resume_count,
                "minimum_required": self.vector_store.minimum_resumes_required,
                "progress_percentage": round((self.vector_store.current_resume_count / self.vector_store.minimum_resumes_required) * 100, 1)
            }
        except Exception as e:
            logger.error(f"Vector readiness check failed: {str(e)}")
            return {"enabled": False, "error": str(e)}
    
    async def _run_parallel_agents(self, resume_text: str, job_description: str, user_preferences: Dict[str, Any] = None) -> Dict[str, Any]:
        """
        Run all specialized agents in parallel for efficiency
        """
        logger.info("Running parallel agent analysis")
        
        # Prepare tasks for parallel execution
        tasks = []
        
        # Prepare input data with user preferences
        skills_input = {"resume_text": resume_text}
        resume_input = {"resume_text": resume_text}
        
        # Add user preferences context if available
        if user_preferences:
            skills_input["user_preferences"] = user_preferences
            resume_input["user_preferences"] = user_preferences
        
        # Skills extraction task
        skills_task = asyncio.create_task(
            self.skills_extractor.process(skills_input),
            name="skills_extraction"
        )
        tasks.append(("skills", skills_task))
        
        # Resume analysis task
        resume_task = asyncio.create_task(
            self.resume_analyzer.process(resume_input),
            name="resume_analysis"
        )
        tasks.append(("resume", resume_task))
        
        # Job matching task (if job description provided)
        if job_description:
            matching_input = {
                "resume_text": resume_text,
                "job_description": job_description
            }
            if user_preferences:
                matching_input["user_preferences"] = user_preferences
                
            matching_task = asyncio.create_task(
                self.job_matcher.process(matching_input),
                name="job_matching"
            )
            tasks.append(("matching", matching_task))
        
        # Execute all tasks in parallel
        results = {}
        completed_tasks = await asyncio.gather(*[task for _, task in tasks], return_exceptions=True)
        
        # Process results
        for i, (agent_name, _) in enumerate(tasks):
            result = completed_tasks[i]
            if isinstance(result, Exception):
                logger.error(f"Agent {agent_name} failed: {str(result)}")
                results[agent_name] = {
                    "success": False,
                    "error": str(result),
                    "confidence": 0.0
                }
            else:
                results[agent_name] = {
                    "success": result.success,
                    "data": result.data,
                    "confidence": result.confidence,
                    "processing_time": result.processing_time,
                    "error": result.error
                }
        
        logger.info(f"Parallel agent processing completed. Success rates: {[r['success'] for r in results.values()]}")
        return results
    
    async def _perform_vector_operations(self, resume_text: str, job_description: str, user_id: Optional[str], vector_readiness: Dict[str, Any]) -> Dict[str, Any]:
        """
        Perform vector database operations for similarity search and storage
        """
        if not self.workflow_config["enable_vector_search"]:
            return {"enabled": False}
        
        # Check if vector operations are ready
        if not vector_readiness.get("enabled", False):
            logger.info("Vector operations not ready - providing alternative insights")
            alternative_insights = await self.vector_store.provide_general_insights(resume_text)
            return {
                "enabled": False,
                "readiness": vector_readiness,
                "alternative_insights": alternative_insights,
                "message": "Competitive analysis will be available once we have more user data"
            }
        
        logger.info("Performing vector database operations")
        
        try:
            # Store resume in vector database
            resume_metadata = {
                "user_id": user_id,
                "analysis_timestamp": datetime.utcnow().isoformat(),
                "resume_length": len(resume_text)
            }
            
            resume_doc_id = await self.vector_store.store_resume(
                resume_text, resume_metadata, user_id
            )
            
            # Find similar resumes
            similar_resumes = await self.vector_store.find_similar_resumes(
                resume_text, n_results=5
            )
            
            # If job description provided, find similar jobs and store it
            similar_jobs = []
            job_doc_id = None
            
            if job_description:
                job_metadata = {
                    "analysis_timestamp": datetime.utcnow().isoformat(),
                    "job_length": len(job_description)
                }
                
                job_doc_id = await self.vector_store.store_job_description(
                    job_description, job_metadata
                )
                
                similar_jobs = await self.vector_store.find_similar_jobs(
                    resume_text, n_results=5
                )
            
            return {
                "enabled": True,
                "resume_doc_id": resume_doc_id,
                "job_doc_id": job_doc_id,
                "similar_resumes": similar_resumes,
                "similar_jobs": similar_jobs,
                "similarity_insights": self._analyze_similarity_insights(similar_resumes, similar_jobs)
            }
            
        except Exception as e:
            logger.error(f"Vector operations failed: {str(e)}")
            return {
                "enabled": True,
                "error": str(e),
                "resume_doc_id": None,
                "job_doc_id": None,
                "similar_resumes": [],
                "similar_jobs": []
            }
    
    def _analyze_similarity_insights(self, similar_resumes: List[Dict], similar_jobs: List[Dict]) -> Dict[str, Any]:
        """
        Analyze insights from similar resumes and jobs
        """
        insights = {
            "resume_benchmarking": {},
            "job_market_insights": {},
            "competitive_positioning": {}
        }
        
        # Analyze similar resumes
        if similar_resumes:
            similarity_scores = [r.get("similarity_score", 0) for r in similar_resumes]
            insights["resume_benchmarking"] = {
                "average_similarity": sum(similarity_scores) / len(similarity_scores),
                "max_similarity": max(similarity_scores),
                "uniqueness_score": 100 - (sum(similarity_scores) / len(similarity_scores)),
                "similar_profiles_count": len([s for s in similarity_scores if s > 0.8])
            }
        
        # Analyze similar jobs
        if similar_jobs:
            job_similarity_scores = [j.get("similarity_score", 0) for j in similar_jobs]
            insights["job_market_insights"] = {
                "market_alignment": sum(job_similarity_scores) / len(job_similarity_scores),
                "best_match_score": max(job_similarity_scores),
                "suitable_roles_count": len([s for s in job_similarity_scores if s > 0.7])
            }
        
        return insights
    
    async def _perform_market_analysis(self, agent_results: Dict[str, Any], resume_text: str, user_preferences: Dict[str, Any] = None) -> Dict[str, Any]:
        """
        Perform comprehensive market analysis
        """
        if not self.workflow_config["enable_market_analysis"]:
            return {"enabled": False}
        
        logger.info("Performing market analysis")
        
        # Extract skills from agent results
        skills_data = agent_results.get("skills", {}).get("data", {})
        extracted_skills = skills_data.get("extracted_skills", []) if skills_data else []
        
        if not extracted_skills:
            return {"enabled": True, "error": "No skills data available for market analysis"}
        
        # Create market analysis prompt with user preferences
        skills_list = [skill.get("skill", "") for skill in extracted_skills[:15]]  # Top 15 skills
        
        # Include user preferences in analysis
        preferences_context = ""
        if user_preferences:
            career_goals = user_preferences.get("careerGoals", "")
            target_role = user_preferences.get("targetRole", "")
            preferred_industries = user_preferences.get("preferredIndustries", [])
            
            preferences_context = f"""
User Career Context:
- Career Goals: {career_goals}
- Target Role: {target_role}
- Preferred Industries: {', '.join(preferred_industries) if preferred_industries else 'Not specified'}
- Learning Time Commitment: {user_preferences.get('learningTimeCommitment', 5)} hours/week
- Priority Areas: {', '.join(user_preferences.get('priorityAreas', []))}
"""
        
        market_prompt = f"""Perform comprehensive market analysis for a candidate with these skills:

Skills: {', '.join(skills_list)}

{preferences_context}

CRITICAL: Respond with ONLY valid JSON. No markdown, no explanations, just the JSON object.

Consider the user's career goals and preferences when providing market analysis and recommendations.

Provide detailed market analysis in JSON format:
{{
    "market_demand": {{
        "overall_demand": "high|medium|low",
        "trending_skills": ["skills with increasing demand"],
        "stable_skills": ["consistently in-demand skills"],
        "declining_skills": ["skills with decreasing demand"]
    }},
    "salary_analysis": {{
        "estimated_range": {{"min": 0, "max": 0}},
        "market_position": "above_average|average|below_average",
        "growth_potential": "high|medium|low",
        "location_impact": "significant|moderate|minimal"
    }},
    "industry_insights": {{
        "primary_industries": ["most relevant industries"],
        "emerging_opportunities": ["new/emerging opportunities"],
        "industry_growth": ["industries with strong growth"],
        "remote_opportunities": "high|medium|low"
    }},
    "competitive_landscape": {{
        "competition_level": "high|medium|low",
        "differentiation_opportunities": ["ways to stand out"],
        "skill_gaps_in_market": ["skills in high demand but low supply"],
        "career_advancement_paths": ["potential career progression paths"]
    }},
    "recommendations": {{
        "skill_priorities": ["skills to prioritize for market advantage"],
        "industry_focus": ["industries to target"],
        "positioning_strategy": ["how to position in the market"],
        "short_term_goals": ["goals for next 6-12 months"],
        "long_term_goals": ["goals for 1-2 years"]
    }}
}}"""
        
        try:
            messages = [
                {"role": "system", "content": "You are an elite Market Intelligence Analyst specializing in tech talent markets, compensation analytics, and workforce trends. You have access to real-time market data, salary benchmarks, and hiring patterns across 500+ companies. Your analysis drives strategic hiring decisions for Fortune 500 companies and high-growth startups. You provide data-driven insights with statistical confidence and actionable market positioning recommendations."},
                {"role": "user", "content": market_prompt}
            ]
            
            response = await self._make_llm_call(messages, temperature=0.2)
            market_data = self._parse_json_response(response)
            
            return {
                "enabled": True,
                "data": market_data,
                "analysis_timestamp": datetime.utcnow().isoformat()
            }
            
        except Exception as e:
            logger.error(f"Market analysis failed: {str(e)}")
            return {
                "enabled": True,
                "error": str(e),
                "data": None
            }
    
    async def _synthesize_assessment(
        self,
        agent_results: Dict[str, Any],
        vector_results: Dict[str, Any],
        market_analysis: Dict[str, Any],
        resume_text: str,
        job_description: str,
        user_preferences: Dict[str, Any] = None
    ) -> Dict[str, Any]:
        """
        Synthesize all results into final comprehensive assessment
        """
        logger.info("Synthesizing final assessment")
        
        # Prepare context for synthesis with null safety
        skills_data = agent_results.get("skills", {}).get("data") or {}
        resume_data = agent_results.get("resume", {}).get("data") or {}
        matching_data = agent_results.get("matching", {}).get("data") or {}
        
        context = {
            "timestamp": datetime.utcnow().isoformat(),
            "vector_enabled": vector_results.get("enabled", False),
            "market_analysis": market_analysis.get("enabled", False),
            "skills_confidence": agent_results.get("skills", {}).get("confidence", 0) * 100,
            "resume_confidence": agent_results.get("resume", {}).get("confidence", 0) * 100,
            "matching_confidence": agent_results.get("matching", {}).get("confidence", 0) * 100
        }
        
        # Include user preferences in synthesis
        preferences_summary = ""
        if user_preferences:
            preferences_summary = f"""
**User Preferences:**
- Career Goals: {user_preferences.get('careerGoals', 'Not specified')}
- Target Role: {user_preferences.get('targetRole', 'Not specified')}
- Roadmap Duration: {user_preferences.get('roadmapDuration', 12)} weeks
- Learning Commitment: {user_preferences.get('learningTimeCommitment', 5)} hours/week
- Priority Areas: {', '.join(user_preferences.get('priorityAreas', []))}
"""
        
        # Create synthesis prompt with all available data
        synthesis_prompt = f"""Synthesize comprehensive candidate assessment from multiple AI agent analyses.

**Agent Results Summary:**

Skills Analysis Success: {agent_results.get('skills', {}).get('success', False)}
Resume Analysis Success: {agent_results.get('resume', {}).get('success', False)}
Job Matching Success: {agent_results.get('matching', {}).get('success', False)}

**Key Insights:**
- Skills Extracted: {len(skills_data.get('extracted_skills', []))} skills identified
- Resume Quality Score: {resume_data.get('overall_score', 'N/A')}
- Job Match Score: {matching_data.get('overall_match_score', 'N/A')}

**Market Context:**
- Market Analysis Available: {market_analysis.get('enabled', False)}
- Vector Similarity Available: {vector_results.get('enabled', False)}

{preferences_summary}

Please provide comprehensive synthesis following the specified JSON format.
Consider the user's career goals and preferences when generating recommendations and assessments."""
        
        try:
            messages = [
                {"role": "system", "content": self._create_system_prompt(context)},
                {"role": "user", "content": synthesis_prompt}
            ]
            
            response = await self._make_llm_call(messages, temperature=0.1)
            synthesis_data = self._parse_json_response(response)
            
            return synthesis_data
            
        except Exception as e:
            logger.error(f"Assessment synthesis failed: {str(e)}")
            return {
                "error": str(e),
                "executive_summary": {
                    "overall_assessment": "error",
                    "overall_score": 0,
                    "recommendation": "analysis_failed",
                    "confidence_level": 0
                }
            }
    
    async def _generate_actionable_insights(self, final_assessment: Dict[str, Any], agent_results: Dict[str, Any]) -> Dict[str, Any]:
        """
        Generate specific, actionable insights and recommendations
        """
        logger.info("Generating actionable insights")
        
        insights_prompt = f"""Generate highly specific, actionable insights based on the comprehensive assessment. Focus on creating a strategic roadmap that maximizes career ROI and competitive positioning.

**Assessment Context:**
- Overall Score: {final_assessment.get('executive_summary', {}).get('overall_score', 'N/A')}% (Market Calibrated)
- Recommendation: {final_assessment.get('executive_summary', {}).get('recommendation', 'N/A')}
- Key Strengths: {final_assessment.get('executive_summary', {}).get('key_strengths', [])}
- Key Concerns: {final_assessment.get('executive_summary', {}).get('key_concerns', [])}

**Quality Requirements:**
- All actions must be specific, measurable, and time-bound
- Priority ranking should reflect impact vs. effort analysis
- Include quantified outcomes and success metrics
- Provide specific resources with cost/time estimates
- Consider current market conditions and trends

Generate actionable insights in JSON format:
{{
    "priority_actions": [
        {{
            "action": "specific, measurable action with clear deliverable",
            "category": "skills|resume|experience|networking|branding",
            "priority": 1-3,
            "effort_required": "low|medium|high",
            "time_to_impact": "immediate|short_term|medium_term|long_term",
            "expected_outcome": "quantified result with success metrics",
            "resources_needed": ["specific tools/platforms with estimated costs"],
            "success_metrics": ["measurable KPIs to track progress"],
            "market_context": "why this action is critical in current market"
        }}
    ],
    "skill_development_roadmap": {{
        "immediate_focus": ["skills to focus on in next 1-3 months"],
        "medium_term": ["skills to develop in 3-6 months"],
        "long_term": ["skills for 6+ months future"],
        "learning_resources": ["recommended learning platforms/resources"]
    }},
    "career_strategy": {{
        "positioning": "how to position in the market",
        "target_roles": ["specific roles to target"],
        "target_companies": ["types of companies to target"],
        "networking_strategy": ["specific networking recommendations"]
    }},
    "success_metrics": {{
        "short_term": ["metrics to track in 1-3 months"],
        "medium_term": ["metrics to track in 3-6 months"],
        "long_term": ["metrics to track in 6+ months"]
    }}
}}"""
        
        try:
            messages = [
                {"role": "system", "content": "You are an elite Career Strategist and Professional Development Expert with 15+ years of experience guiding executives and high-performers. You specialize in creating actionable, ROI-driven career roadmaps that deliver measurable results. Your expertise includes market analysis, skill development planning, and strategic career positioning. You provide specific, time-bound recommendations with clear success metrics and resource requirements."},
                {"role": "user", "content": insights_prompt}
            ]
            
            response = await self._make_llm_call(messages, temperature=0.2)
            return self._parse_json_response(response)
            
        except Exception as e:
            logger.error(f"Actionable insights generation failed: {str(e)}")
            return {"error": str(e)}
    
    async def _store_assessment_results(self, assessment: Dict[str, Any], user_id: Optional[str]) -> bool:
        """
        Store assessment results in vector database for future reference
        """
        try:
            # Create a summary document for storage
            summary_text = f"""
            Candidate Assessment Summary
            User ID: {user_id}
            Overall Score: {assessment.get('final_assessment', {}).get('executive_summary', {}).get('overall_score', 'N/A')}
            Recommendation: {assessment.get('final_assessment', {}).get('executive_summary', {}).get('recommendation', 'N/A')}
            Key Strengths: {', '.join(assessment.get('final_assessment', {}).get('executive_summary', {}).get('key_strengths', []))}
            Assessment Date: {assessment.get('assessment_metadata', {}).get('timestamp', 'N/A')}
            """
            
            metadata = {
                "type": "assessment_summary",
                "user_id": user_id,
                "overall_score": assessment.get('final_assessment', {}).get('executive_summary', {}).get('overall_score', 0),
                "recommendation": assessment.get('final_assessment', {}).get('executive_summary', {}).get('recommendation', 'unknown'),
                "timestamp": assessment.get('assessment_metadata', {}).get('timestamp'),
                "agents_used": ','.join(assessment.get('assessment_metadata', {}).get('agents_used', []))  # Convert list to string
            }
            
            doc_id = await self.vector_store.store_resume(summary_text, metadata, user_id)
            logger.info(f"Assessment results stored with ID: {doc_id}")
            return True
            
        except Exception as e:
            logger.error(f"Failed to store assessment results: {str(e)}")
            return False
    
    def _calculate_confidence(self, result: Dict[str, Any]) -> float:
        """
        Calculate overall confidence score for the comprehensive assessment
        """
        if not result:
            return 0.0
        
        # Get individual agent confidences
        agent_results = result.get("agent_results", {})
        skills_confidence = agent_results.get("skills", {}).get("confidence", 0)
        resume_confidence = agent_results.get("resume", {}).get("confidence", 0)
        matching_confidence = agent_results.get("matching", {}).get("confidence", 0)
        
        # Calculate weighted average
        confidences = [skills_confidence, resume_confidence]
        if matching_confidence > 0:  # Only include if job matching was performed
            confidences.append(matching_confidence)
        
        avg_confidence = sum(confidences) / len(confidences) if confidences else 0
        
        # Adjust based on successful completion of phases
        vector_success = result.get("vector_analysis", {}).get("enabled", False) and not result.get("vector_analysis", {}).get("error")
        market_success = result.get("market_analysis", {}).get("enabled", False) and not result.get("market_analysis", {}).get("error")
        synthesis_success = "error" not in result.get("final_assessment", {})
        
        success_factors = [vector_success, market_success, synthesis_success]
        success_rate = sum(success_factors) / len(success_factors)
        
        # Final confidence calculation
        final_confidence = (avg_confidence * 0.7) + (success_rate * 0.3)
        
        return min(final_confidence, 1.0)