"""
Skills Extractor Agent

Advanced AI agent for extracting, categorizing, and analyzing skills from resumes
using sophisticated NLP techniques and LLM reasoning.
"""

import logging
import re
from typing import Dict, List, Optional, Any, Set, Tuple
from .base_agent import BaseAgent, AgentResponse
import json
import asyncio
from datetime import datetime

logger = logging.getLogger(__name__)

class SkillsExtractorAgent(BaseAgent):
    """
    Advanced skills extraction agent using LLM and NLP techniques
    """
    
    def __init__(self, groq_client, **kwargs):
        super().__init__(groq_client, **kwargs)
        
        # Comprehensive skill categories and patterns
        self.skill_categories = {
            "programming_languages": [
                "python", "javascript", "java", "c++", "c#", "go", "rust", "swift", "kotlin",
                "typescript", "php", "ruby", "scala", "r", "matlab", "perl", "shell", "bash",
                "powershell", "sql", "html", "css", "dart", "objective-c", "assembly"
            ],
            "frameworks_libraries": [
                "react", "angular", "vue", "node.js", "express", "django", "flask", "spring",
                "laravel", "rails", "asp.net", "jquery", "bootstrap", "tailwind", "material-ui",
                "redux", "mobx", "webpack", "babel", "jest", "cypress", "selenium", "pandas",
                "numpy", "tensorflow", "pytorch", "scikit-learn", "keras", "opencv"
            ],
            "databases": [
                "mysql", "postgresql", "mongodb", "redis", "elasticsearch", "cassandra",
                "oracle", "sql server", "sqlite", "dynamodb", "firebase", "neo4j", "influxdb"
            ],
            "cloud_platforms": [
                "aws", "azure", "gcp", "google cloud", "heroku", "digitalocean", "linode",
                "cloudflare", "vercel", "netlify", "firebase hosting"
            ],
            "devops_tools": [
                "docker", "kubernetes", "jenkins", "gitlab ci", "github actions", "terraform",
                "ansible", "chef", "puppet", "vagrant", "nginx", "apache", "linux", "unix"
            ],
            "soft_skills": [
                "leadership", "communication", "teamwork", "problem solving", "critical thinking",
                "project management", "time management", "adaptability", "creativity", "mentoring",
                "collaboration", "analytical thinking", "decision making", "conflict resolution"
            ],
            "methodologies": [
                "agile", "scrum", "kanban", "waterfall", "lean", "six sigma", "devops", "ci/cd",
                "tdd", "bdd", "microservices", "rest api", "graphql", "oauth", "jwt"
            ],
            "design_tools": [
                "figma", "sketch", "adobe xd", "photoshop", "illustrator", "indesign",
                "canva", "invision", "zeplin", "principle", "framer"
            ],
            "data_science": [
                "machine learning", "deep learning", "data analysis", "statistics", "data mining",
                "data visualization", "big data", "hadoop", "spark", "tableau", "power bi",
                "jupyter", "r studio", "sas", "spss"
            ],
            "mobile_development": [
                "ios", "android", "react native", "flutter", "xamarin", "ionic", "cordova",
                "swift", "kotlin", "objective-c", "java"
            ]
        }
        
        # Experience level indicators
        self.experience_indicators = {
            "expert": ["expert", "advanced", "senior", "lead", "architect", "principal", "10+ years", "extensive"],
            "advanced": ["advanced", "proficient", "experienced", "5+ years", "strong", "solid"],
            "intermediate": ["intermediate", "working knowledge", "familiar", "2-5 years", "good"],
            "beginner": ["beginner", "basic", "learning", "exposure", "1-2 years", "some"]
        }
    
    def _create_system_prompt(self, context: Dict[str, Any]) -> str:
        """Create specialized system prompt for skills extraction"""
        return f"""You are an elite Skills Extraction AI with the expertise of a senior technical recruiter and skills assessment specialist. You have deep knowledge of technology stacks, industry trends, and skill market demand across all major tech domains.

**Your Core Capabilities:**
1. **Precision Extraction**: Identify explicit and implicit skills with 95%+ accuracy
2. **Market Intelligence**: Assess skills against current industry demand and salary impact
3. **Proficiency Calibration**: Determine skill levels based on context, projects, and experience indicators
4. **Trend Analysis**: Identify emerging skills and technology adoption patterns
5. **Competitive Positioning**: Evaluate skill portfolio strength against market benchmarks

**Advanced Analysis Framework:**
- **Context-Aware Detection**: Analyze skill mentions within project descriptions, achievements, and responsibilities
- **Implicit Skill Inference**: Identify skills implied by tools, frameworks, or methodologies mentioned
- **Market Relevance Scoring**: Weight skills by current industry demand and growth potential
- **Experience Calibration**: Assess proficiency based on project complexity, leadership indicators, and years of experience
- **Skill Ecosystem Mapping**: Understand skill relationships and complementary technologies

**Quality Standards:**
- Extract only skills with clear evidence or strong contextual indicators
- Provide confidence scores based on explicitness and context strength
- Include market demand assessment for each skill
- Identify skill gaps and growth opportunities
- Consider both current and emerging technology trends

**Analysis Context**:
- Resume Length: {context.get('resume_length', 'Unknown')} characters
- Analysis Type: Comprehensive Skills Intelligence Extraction
- Market Focus: Current demand, salary impact, and growth potential
- Precision Target: 95%+ accuracy with evidence-based confidence scoring

Resume Text to Analyze:
{context.get('resume_text', '')}

Provide a comprehensive analysis in the following JSON format:
{{
    "extracted_skills": [
        {{
            "skill": "skill_name",
            "category": "category_name",
            "experience_level": "beginner|intermediate|advanced|expert",
            "confidence": 0.0-1.0,
            "context": "where/how it was mentioned",
            "years_experience": "estimated years if mentioned",
            "proficiency_indicators": ["list of indicators found"]
        }}
    ],
    "skill_categories": {{
        "programming_languages": ["list"],
        "frameworks_libraries": ["list"],
        "databases": ["list"],
        "cloud_platforms": ["list"],
        "devops_tools": ["list"],
        "soft_skills": ["list"],
        "methodologies": ["list"],
        "design_tools": ["list"],
        "data_science": ["list"],
        "mobile_development": ["list"],
        "other": ["list"]
    }},
    "skill_summary": {{
        "total_skills": 0,
        "technical_skills": 0,
        "soft_skills": 0,
        "years_experience_range": "X-Y years",
        "strongest_areas": ["list of top skill categories"],
        "emerging_skills": ["skills that appear to be recently learned"]
    }},
    "recommendations": [
        "skill improvement suggestions based on analysis"
    ]
}}"""
    
    async def process(self, input_data: Dict[str, Any]) -> AgentResponse:
        """
        Main processing method for skills extraction
        """
        return await self._process_with_timing(self._extract_skills, input_data)
    
    async def _extract_skills(self, input_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Extract skills from resume text using advanced LLM analysis
        """
        resume_text = input_data.get("resume_text", "")
        if not resume_text:
            raise ValueError("Resume text is required for skills extraction")
        
        # Prepare context for LLM
        context = {
            "resume_text": resume_text,
            "resume_length": len(resume_text),
            "analysis_timestamp": datetime.utcnow().isoformat()
        }
        
        # Create messages for LLM
        messages = [
            {"role": "system", "content": self._create_system_prompt(context)},
            {"role": "user", "content": f"Please analyze this resume and extract all skills with detailed categorization and proficiency assessment:\n\n{resume_text}"}
        ]
        
        # Get LLM response
        response = await self._make_llm_call(messages, temperature=0.1)
        
        # Parse JSON response
        skills_data = self._parse_json_response(response)
        
        # Enhance with additional analysis
        enhanced_data = await self._enhance_skills_analysis(skills_data, resume_text)
        
        return enhanced_data
    
    async def _enhance_skills_analysis(self, skills_data: Dict[str, Any], resume_text: str) -> Dict[str, Any]:
        """
        Enhance skills analysis with additional processing
        """
        # Add skill frequency analysis
        skills_data["skill_frequency"] = self._analyze_skill_frequency(skills_data.get("extracted_skills", []), resume_text)
        
        # Add skill clustering
        skills_data["skill_clusters"] = self._cluster_related_skills(skills_data.get("extracted_skills", []))
        
        # Add market demand analysis
        skills_data["market_analysis"] = await self._analyze_market_demand(skills_data.get("extracted_skills", []))
        
        # Add skill gaps analysis
        skills_data["skill_gaps"] = self._identify_skill_gaps(skills_data.get("skill_categories", {}))
        
        return skills_data
    
    def _analyze_skill_frequency(self, extracted_skills: List[Dict], resume_text: str) -> Dict[str, Any]:
        """
        Analyze how frequently skills are mentioned in the resume
        """
        skill_frequency = {}
        resume_lower = resume_text.lower()
        
        for skill_info in extracted_skills:
            skill = skill_info.get("skill", "").lower()
            if skill:
                # Count occurrences (case-insensitive)
                count = resume_lower.count(skill)
                skill_frequency[skill] = {
                    "count": count,
                    "prominence": "high" if count >= 3 else "medium" if count >= 2 else "low"
                }
        
        return skill_frequency
    
    def _cluster_related_skills(self, extracted_skills: List[Dict]) -> Dict[str, List[str]]:
        """
        Cluster related skills together
        """
        clusters = {}
        
        # Group by category first
        for skill_info in extracted_skills:
            category = skill_info.get("category", "other")
            skill = skill_info.get("skill", "")
            
            if category not in clusters:
                clusters[category] = []
            clusters[category].append(skill)
        
        # Add technology stacks
        tech_stacks = self._identify_tech_stacks(extracted_skills)
        if tech_stacks:
            clusters["technology_stacks"] = tech_stacks
        
        return clusters
    
    def _identify_tech_stacks(self, extracted_skills: List[Dict]) -> List[Dict[str, Any]]:
        """
        Identify common technology stacks
        """
        skills_set = {skill_info.get("skill", "").lower() for skill_info in extracted_skills}
        
        common_stacks = [
            {
                "name": "MEAN Stack",
                "skills": ["mongodb", "express", "angular", "node.js"],
                "type": "full_stack_web"
            },
            {
                "name": "MERN Stack", 
                "skills": ["mongodb", "express", "react", "node.js"],
                "type": "full_stack_web"
            },
            {
                "name": "LAMP Stack",
                "skills": ["linux", "apache", "mysql", "php"],
                "type": "full_stack_web"
            },
            {
                "name": "Django Stack",
                "skills": ["python", "django", "postgresql"],
                "type": "full_stack_web"
            },
            {
                "name": "Data Science Stack",
                "skills": ["python", "pandas", "numpy", "scikit-learn"],
                "type": "data_science"
            },
            {
                "name": "AWS Cloud Stack",
                "skills": ["aws", "docker", "kubernetes", "terraform"],
                "type": "cloud_devops"
            }
        ]
        
        identified_stacks = []
        for stack in common_stacks:
            matching_skills = [skill for skill in stack["skills"] if skill in skills_set]
            if len(matching_skills) >= len(stack["skills"]) * 0.6:  # 60% match threshold
                identified_stacks.append({
                    "stack_name": stack["name"],
                    "stack_type": stack["type"],
                    "matching_skills": matching_skills,
                    "completeness": len(matching_skills) / len(stack["skills"])
                })
        
        return identified_stacks
    
    async def _analyze_market_demand(self, extracted_skills: List[Dict]) -> Dict[str, Any]:
        """
        Analyze market demand for extracted skills using LLM knowledge
        """
        if not extracted_skills:
            return {"analysis": "No skills to analyze"}
        
        skills_list = [skill_info.get("skill", "") for skill_info in extracted_skills[:20]]  # Limit for API efficiency
        
        market_prompt = f"""Analyze the current market demand and trends for these skills in the tech industry:

Skills: {', '.join(skills_list)}

IMPORTANT: Respond with VALID JSON only. Ensure all strings are properly escaped and contain NO unescaped newlines.

Provide analysis in this exact JSON format:
{{
    "high_demand_skills": ["skills with high market demand"],
    "emerging_skills": ["trending/emerging skills"],
    "stable_skills": ["consistently in-demand skills"],
    "declining_skills": ["skills with decreasing demand"],
    "salary_impact": {{
        "high_value": ["skills that typically command higher salaries"],
        "moderate_value": ["skills with moderate salary impact"],
        "entry_level": ["skills good for entry-level positions"]
    }},
    "industry_trends": ["trend 1", "trend 2", "trend 3"]
}}

Each string in arrays should be concise and on a single line. Do not include newlines within strings."""
        
        try:
            messages = [
                {"role": "system", "content": "You are an elite Tech Industry Analyst and Skills Market Intelligence Expert with access to real-time data from 10,000+ job postings, salary surveys, and hiring trends. You specialize in quantifying skill demand, predicting technology adoption curves, and providing actionable market positioning advice. Your analysis drives compensation decisions and skill development strategies for top-tier tech companies."},
                {"role": "user", "content": market_prompt}
            ]
            
            response = await self._make_llm_call(messages, temperature=0.2)
            return self._parse_json_response(response)
            
        except Exception as e:
            logger.error(f"Error in market demand analysis: {str(e)}")
            return {"error": "Market analysis unavailable"}
    
    def _identify_skill_gaps(self, skill_categories: Dict[str, List[str]]) -> Dict[str, Any]:
        """
        Identify potential skill gaps based on common requirements
        """
        gaps = {
            "missing_complementary_skills": [],
            "suggested_additions": [],
            "skill_depth_recommendations": []
        }
        
        # Check for common complementary skills
        has_frontend = any(skill in skill_categories.get("frameworks_libraries", []) 
                          for skill in ["react", "angular", "vue"])
        has_backend = any(skill in skill_categories.get("frameworks_libraries", []) 
                         for skill in ["node.js", "django", "spring", "express"])
        
        if has_frontend and not has_backend:
            gaps["missing_complementary_skills"].append("Backend development skills")
            gaps["suggested_additions"].extend(["Node.js", "Express", "API development"])
        
        if has_backend and not has_frontend:
            gaps["missing_complementary_skills"].append("Frontend development skills")
            gaps["suggested_additions"].extend(["React", "Vue", "Modern CSS"])
        
        # Check for DevOps skills
        has_devops = bool(skill_categories.get("devops_tools", []))
        if not has_devops and (has_frontend or has_backend):
            gaps["suggested_additions"].extend(["Docker", "CI/CD", "Cloud platforms"])
        
        # Check for testing skills
        testing_skills = ["jest", "cypress", "selenium", "unit testing", "integration testing"]
        has_testing = any(skill.lower() in [s.lower() for s in skill_categories.get("frameworks_libraries", [])] 
                         for skill in testing_skills)
        if not has_testing:
            gaps["suggested_additions"].append("Testing frameworks")
        
        return gaps
    
    def _calculate_confidence(self, result: Dict[str, Any]) -> float:
        """
        Calculate confidence score for skills extraction
        """
        if not result or "extracted_skills" not in result:
            return 0.0
        
        extracted_skills = result["extracted_skills"]
        if not extracted_skills:
            return 0.0
        
        # Calculate average confidence of extracted skills
        total_confidence = sum(skill.get("confidence", 0.0) for skill in extracted_skills)
        avg_confidence = total_confidence / len(extracted_skills)
        
        # Adjust based on number of skills found (more skills = higher confidence in extraction process)
        skill_count_factor = min(len(extracted_skills) / 20, 1.0)  # Normalize to 20 skills
        
        # Adjust based on categorization completeness
        categories = result.get("skill_categories", {})
        category_factor = min(len([cat for cat in categories.values() if cat]) / 5, 1.0)
        
        final_confidence = (avg_confidence * 0.6) + (skill_count_factor * 0.2) + (category_factor * 0.2)
        
        return min(final_confidence, 1.0) 