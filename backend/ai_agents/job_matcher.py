"""
Job Matcher Agent

Advanced AI agent for matching resumes with job descriptions using
semantic analysis, skill matching, and sophisticated scoring algorithms.
"""

import logging
import re
from typing import Dict, List, Optional, Any, Tuple
from .base_agent import BaseAgent, AgentResponse
import json
import asyncio
from datetime import datetime
import numpy as np

logger = logging.getLogger(__name__)

class JobMatcherAgent(BaseAgent):
    """
    Advanced job matching agent using semantic analysis and LLM reasoning
    """
    
    def __init__(self, groq_client, **kwargs):
        super().__init__(groq_client, **kwargs)
        
        # Job requirement categories
        self.requirement_categories = {
            "must_have": ["required", "must have", "essential", "mandatory", "minimum"],
            "preferred": ["preferred", "nice to have", "plus", "bonus", "desired"],
            "experience_levels": {
                "entry": ["entry", "junior", "0-2 years", "new grad", "recent graduate"],
                "mid": ["mid", "intermediate", "2-5 years", "experienced"],
                "senior": ["senior", "lead", "5+ years", "expert", "advanced"],
                "principal": ["principal", "staff", "architect", "10+ years", "director"]
            }
        }
        
        # Scoring weights
        self.scoring_weights = {
            "skills_match": 0.35,
            "experience_match": 0.25,
            "education_match": 0.15,
            "industry_match": 0.10,
            "role_progression": 0.10,
            "cultural_fit": 0.05
        }
    
    def _create_system_prompt(self, context: Dict[str, Any]) -> str:
        """Create specialized system prompt for job matching"""
        return f"""You are an expert Job Matching AI that understands the essence of both resumes and job requirements. Your goal is to provide honest, accurate assessments based on what candidates actually offer versus what roles genuinely require.

CRITICAL: You MUST respond with ONLY valid JSON. Do not include any markdown formatting, explanations, or text outside the JSON structure.

**CORE ANALYSIS PHILOSOPHY:**

🧠 **UNDERSTAND THE ESSENCE**: Deeply comprehend what the job actually requires day-to-day and what the candidate has genuinely accomplished.

🎯 **PRACTICAL ALIGNMENT**: Match real capabilities with real requirements, not just keyword overlap.

⚖️ **HONEST ASSESSMENT**: Score based on likelihood of success, considering both strengths and gaps.

🚀 **GROWTH POTENTIAL**: Factor in learning ability, transferable skills, and career trajectory.

**INTELLIGENT MATCHING APPROACH:**

1. **Comprehend the Role** (40%)
   - What are the core daily responsibilities?
   - Which skills are absolutely critical vs. nice-to-have?
   - What level of expertise is truly needed?
   - Can missing skills be learned on the job?

2. **Understand the Candidate** (35%)
   - What has the candidate actually done (projects, work, impact)?
   - Which skills are demonstrated through practical application?
   - How does their experience translate to this role?
   - What evidence exists of learning and growth?

3. **Assess the Fit** (25%)
   - How well do their strengths align with critical needs?
   - Are their experience patterns relevant to this work?
   - Can they succeed with reasonable onboarding/training?
   - Do they show indicators of being able to grow into the role?

**SMART SCORING PRINCIPLES:**

- **High Match (80-100%)**: Strong alignment between what they've done and what's needed, with demonstrated relevant accomplishments
- **Good Match (60-79%)**: Solid foundation with some relevant experience, gaps that can be reasonably filled
- **Moderate Match (40-59%)**: Some relevant skills/experience, but significant learning required for success
- **Low Match (20-39%)**: Limited relevant background, would need substantial development to succeed
- **Poor Match (0-19%)**: Very little alignment, fundamental gaps that are difficult to bridge

**Analysis Context:**
- Resume Length: {context.get('resume_length', 'Unknown')} characters
- Job Description Length: {context.get('job_length', 'Unknown')} characters

**Resume:**
{context.get('resume_text', '')}

**Job Description:**
{context.get('job_description', '')}

**ASSESSMENT GUIDELINES:**
- Look for evidence of practical application, not just mentions of skills
- Consider the depth of experience needed vs. what's demonstrated
- Evaluate transferable skills and learning indicators
- Be realistic about what success would require from this candidate
- Factor in industry context and role expectations

Provide comprehensive matching analysis with DETAILED EXPLANATIONS in JSON format:
{{
    "overall_match_score": 0-100,
    "match_category": "excellent|good|fair|poor",
    "executive_summary": "A comprehensive 2-3 paragraph executive summary explaining why this candidate is or isn't a strong match, highlighting key strengths, addressing concerns, and providing strategic hiring insights. Write as if briefing a C-level executive.",
    "skills_analysis": {{
        "analysis_summary": "Detailed 2-3 sentence explanation of the candidate's skill alignment, highlighting strengths and gaps in technical and soft skills.",
        "technical_skills": {{
            "matched_skills": [
                {{
                    "skill": "skill_name",
                    "resume_level": "beginner|intermediate|advanced|expert",
                    "required_level": "beginner|intermediate|advanced|expert",
                    "match_score": 0-100,
                    "importance": "critical|important|nice_to_have"
                }}
            ],
            "missing_skills": [
                {{
                    "skill": "skill_name",
                    "importance": "critical|important|nice_to_have",
                    "learning_difficulty": "easy|medium|hard",
                    "market_demand": "high|medium|low"
                }}
            ],
            "skill_gaps": ["list of significant skill gaps"],
            "strengths": ["list of skill strengths"]
        }},
        "soft_skills": {{
            "matched_skills": ["list of matched soft skills"],
            "missing_skills": ["list of missing soft skills"],
            "leadership_indicators": 0-100,
            "communication_indicators": 0-100,
            "teamwork_indicators": 0-100
        }}
    }},
    "experience_analysis": {{
        "analysis_summary": "Detailed explanation of how the candidate's experience aligns with role requirements, including career progression, industry relevance, and leadership potential.",
        "years_experience": {{
            "candidate": 0,
            "required": 0,
            "match_score": 0-100
        }},
        "industry_experience": {{
            "relevant_industries": ["list of relevant industries"],
            "match_score": 0-100,
            "transferable_experience": ["list of transferable experiences"]
        }},
        "role_progression": {{
            "career_growth": 0-100,
            "leadership_experience": 0-100,
            "project_complexity": 0-100
        }}
    }},
    "education_analysis": {{
        "analysis_summary": "Assessment of educational background alignment with role requirements, including degree relevance, certifications, and continuous learning indicators.",
        "degree_match": {{
            "candidate_degree": "degree info",
            "required_degree": "degree requirements",
            "match_score": 0-100
        }},
        "certifications": {{
            "relevant_certifications": ["list of relevant certifications"],
            "missing_certifications": ["list of missing important certifications"],
            "certification_score": 0-100
        }}
    }},
    "cultural_fit": {{
        "analysis_summary": "Evaluation of cultural fit potential, work style compatibility, and alignment with company values and team dynamics.",
        "company_values_alignment": 0-100,
        "work_style_match": 0-100,
        "team_fit_indicators": ["list of team fit indicators"],
        "growth_mindset": 0-100
    }},
    "interview_probability": 0-100,
    "hiring_probability": 0-100,
    "salary_alignment": {{
        "candidate_expectation": "estimated range",
        "job_offer_range": "estimated range",
        "alignment_score": 0-100
    }},
    "improvement_recommendations": {{
        "summary": "Strategic overview of key areas for candidate development to enhance role fit and career advancement.",
        "recommendations": [
            {{
                "area": "improvement area",
                "priority": "high|medium|low",
                "rationale": "Detailed explanation of why this improvement is important for the role",
                "specific_actions": ["list of specific actions"],
                "timeline": "timeframe to improve",
                "impact_on_match": 0-20,
                "success_metrics": ["how to measure improvement"]
            }}
        ]
    }},
    "hiring_insights": {{
        "strengths": {{
            "summary": "Key candidate strengths that make them attractive for this role",
            "details": ["list of specific strengths with context"]
        }},
        "concerns": {{
            "summary": "Potential risks or areas requiring attention in the hiring process",
            "details": ["list of specific concerns with mitigation strategies"]
        }},
        "decision_factors": {{
            "summary": "Critical factors that should influence the hiring decision",
            "interview_focus_areas": ["key areas to explore in interviews"],
            "reference_check_priorities": ["what to verify with references"]
        }}
    }},
    "strategic_recommendations": {{
        "hiring_manager_brief": "Executive summary for hiring manager with key decision points",
        "interview_strategy": "Recommended interview approach and key questions to ask",
        "onboarding_considerations": "Important factors for successful candidate integration",
        "retention_strategy": "How to keep this candidate engaged long-term"
    }}
}}"""
    
    async def process(self, input_data: Dict[str, Any]) -> AgentResponse:
        """
        Main processing method for job matching
        """
        return await self._process_with_timing(self._match_job, input_data)
    
    async def _match_job(self, input_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Perform comprehensive job matching analysis
        """
        resume_text = input_data.get("resume_text", "")
        job_description = input_data.get("job_description", "")
        
        if not resume_text or not job_description:
            raise ValueError("Both resume text and job description are required for matching")
        
        # Validate resume content - check for template/placeholder content
        template_validation = self._validate_resume_content(resume_text)
        if not template_validation["is_valid"]:
            return {
                "overall_match_score": 0,
                "match_category": "invalid",
                "error": template_validation["error"],
                "template_detected": True,
                "validation_issues": template_validation["issues"]
            }
        
        # Prepare context for LLM
        context = {
            "resume_text": resume_text,
            "job_description": job_description,
            "resume_length": len(resume_text),
            "job_length": len(job_description),
            "analysis_timestamp": datetime.utcnow().isoformat()
        }
        
        # Perform preliminary matching analysis
        preliminary_analysis = self._perform_preliminary_matching(resume_text, job_description)
        
        # Create messages for LLM
        messages = [
            {"role": "system", "content": self._create_system_prompt(context)},
            {"role": "user", "content": f"Please perform comprehensive job matching analysis between this resume and job description."}
        ]
        
        # Get LLM response
        response = await self._make_llm_call(messages, temperature=0.1)
        
        # Parse JSON response
        matching_data = self._parse_json_response(response)
        
        # CRITICAL: Validate score accuracy to prevent hallucination
        validation_result = self._validate_score_accuracy(matching_data, resume_text, job_description)
        if not validation_result["is_valid"]:
            # Override with corrected score if LLM hallucinated
            logger.warning(f"LLM score validation failed: {validation_result['reason']}")
            matching_data["overall_match_score"] = validation_result["corrected_score"]
            matching_data["match_category"] = validation_result["corrected_category"]
            matching_data["score_override"] = {
                "original_score": matching_data.get("overall_match_score"),
                "reason": validation_result["reason"],
                "validation_issues": validation_result["issues"],
                "penalties": validation_result["penalties"]
            }
        
        # Enhance with preliminary analysis
        matching_data["preliminary_analysis"] = preliminary_analysis
        
        # Add advanced matching metrics
        matching_data["advanced_metrics"] = await self._calculate_advanced_metrics(matching_data, resume_text, job_description)
        
        # Add competitive positioning
        matching_data["competitive_positioning"] = await self._analyze_competitive_positioning(matching_data)
        
        return matching_data
    
    def _validate_score_accuracy(self, analysis: Dict[str, Any], resume_text: str, job_description: str) -> Dict[str, Any]:
        """
        Intelligent validation that understands the essence of job-candidate fit
        """
        issues = []
        original_score = analysis.get("overall_match_score", 0)
        
        job_lower = job_description.lower()
        resume_lower = resume_text.lower()
        
        # Check for skill hallucination - verify claimed skills exist in resume
        claimed_skills = []
        if "skills_analysis" in analysis and "technical_skills" in analysis["skills_analysis"]:
            matched_skills = analysis["skills_analysis"]["technical_skills"].get("matched_skills", [])
            for skill_obj in matched_skills:
                if isinstance(skill_obj, dict):
                    skill_name = skill_obj.get("skill", "").lower()
                    claimed_skills.append(skill_name)
        
        # Verify each claimed skill actually exists in resume
        hallucinated_skills = []
        skills_in_resume = []
        
        for skill in claimed_skills:
            skill_clean = skill.lower().strip()
            if not skill_clean:  # Skip empty skills
                continue
                
            # Check if skill is actually mentioned in resume
            skill_found = False
            try:
                # First try exact word boundary match
                if re.search(f"\\b{re.escape(skill_clean)}\\b", resume_lower, re.IGNORECASE):
                    skill_found = True
                    skills_in_resume.append(skill_clean)
                # Then try without spaces (for compound terms)
                elif skill_clean.replace(" ", "") in resume_lower.replace(" ", ""):
                    skill_found = True
                    skills_in_resume.append(skill_clean)
                # Finally try simple substring match
                elif skill_clean in resume_lower:
                    skill_found = True
                    skills_in_resume.append(skill_clean)
            except re.error as e:
                # If regex fails, fall back to simple string matching
                logger.warning(f"Regex error for skill '{skill_clean}': {e}")
                if skill_clean in resume_lower:
                    skill_found = True
                    skills_in_resume.append(skill_clean)
            
            if not skill_found:
                hallucinated_skills.append(skill_clean)
                issues.append(f"Claimed skill '{skill}' not found in resume")
        
        # Assess role-candidate alignment based on work patterns
        # Technical role indicators
        technical_role_indicators = [
            r"engineer|developer|programmer|software|technical|data scientist",
            r"machine learning|artificial intelligence|ai|ml|python|programming",
            r"software development|coding|api|database|algorithm|system design"
        ]
        
        # Technical experience indicators  
        technical_experience_indicators = [
            r"developed|programmed|coded|implemented|built.*software",
            r"programming|software development|system design|database",
            r"api.*development|web.*development|mobile.*development",
            r"machine learning|data.*pipeline|model.*training|algorithm"
        ]
        
        # Non-technical experience indicators
        non_technical_experience_indicators = [
            r"sales|customer service|retail|cashier|payments|inventory",
            r"surveys|presentations.*clients|fundraising|marketing|administrative",
            r"reception|data entry|clerical|filing|scheduling"
        ]
        
        # Safe regex search with error handling
        def safe_regex_search(patterns, text):
            for pattern in patterns:
                try:
                    if re.search(pattern, text):
                        return True
                except re.error as e:
                    logger.warning(f"Regex error for pattern '{pattern}': {e}")
                    continue
            return False
        
        is_technical_role = safe_regex_search(technical_role_indicators, job_lower)
        has_technical_experience = safe_regex_search(technical_experience_indicators, resume_lower)
        has_non_technical_experience = safe_regex_search(non_technical_experience_indicators, resume_lower)
        
        # Intelligent score adjustment based on essence understanding
        corrected_score = original_score
        adjustment_reason = []
        
        # Major hallucination penalty
        if len(hallucinated_skills) > 0:
            hallucination_penalty = min(len(hallucinated_skills) * 15, 40)  # Cap at 40 points
            corrected_score -= hallucination_penalty
            adjustment_reason.append(f"Hallucinated {len(hallucinated_skills)} skills")
        
        # Role-experience mismatch adjustment
        if is_technical_role and has_non_technical_experience and not has_technical_experience:
            # Non-technical candidate for technical role
            if original_score > 30:
                corrected_score = min(corrected_score, 30)  # Cap at 30% for major mismatch
                adjustment_reason.append("Non-technical background for technical role")
        elif is_technical_role and has_technical_experience:
            # Technical candidate for technical role - validate the level
            technical_depth_patterns = [
                r"senior|lead|architect|principal|years.*experience",
                r"multiple.*projects|complex.*systems|large.*scale",
                r"team.*lead|mentoring|architecture|design.*decisions"
            ]
            has_deep_experience = safe_regex_search(technical_depth_patterns, resume_lower)
            
            if original_score > 85 and not has_deep_experience:
                corrected_score = min(corrected_score, 75)  # Cap score for junior/mid candidates
                adjustment_reason.append("Limited senior-level experience indicators")
        
        # Education and learning potential bonus
        education_indicators = [
            r"computer science|software engineering|information technology",
            r"data science|machine learning|artificial intelligence|engineering",
            r"mathematics|statistics|physics|technical.*degree"
        ]
        
        has_relevant_education = safe_regex_search(education_indicators, resume_lower)
        
        # Learning and growth indicators
        learning_indicators = [
            r"self.*taught|online.*course|certification|bootcamp|training",
            r"personal.*project|side.*project|github|portfolio",
            r"continued.*learning|skill.*development|staying.*current"
        ]
        
        shows_learning_ability = safe_regex_search(learning_indicators, resume_lower)
        
        # Minimum realistic floors based on candidate type
        if has_technical_experience and has_relevant_education:
            minimum_floor = 25  # Technical background with education
        elif has_technical_experience or has_relevant_education:
            minimum_floor = 15  # Some relevant background
        elif shows_learning_ability:
            minimum_floor = 10  # Shows potential to learn
        else:
            minimum_floor = 5   # Basic minimum for any real candidate
        
        # Apply minimum floor
        corrected_score = max(corrected_score, minimum_floor)
        
        # Determine if validation concerns exist
        validation_concerns = (
            len(hallucinated_skills) > 2 or  # More than 2 hallucinated skills
            (is_technical_role and not has_technical_experience and original_score > 50)  # Major role mismatch with high score
        )
        
        # Determine corrected category
        if corrected_score >= 80:
            corrected_category = "excellent"
        elif corrected_score >= 60:
            corrected_category = "good"
        elif corrected_score >= 40:
            corrected_category = "fair"
        else:
            corrected_category = "poor"
        
        # Create summary reason
        if adjustment_reason:
            reason = f"Score adjusted: {', '.join(adjustment_reason)}"
        else:
            reason = "Score validated as accurate"
        
        return {
            "is_valid": not validation_concerns,
            "reason": reason,
            "corrected_score": corrected_score,
            "corrected_category": corrected_category,
            "issues": issues,
            "adjustment_details": {
                "original_score": original_score,
                "hallucinated_skills_count": len(hallucinated_skills),
                "has_technical_experience": has_technical_experience,
                "has_relevant_education": has_relevant_education,
                "shows_learning_ability": shows_learning_ability,
                "is_technical_role": is_technical_role
            },
            "verification_details": {
                "claimed_skills": claimed_skills,
                "hallucinated_skills": hallucinated_skills,
                "skills_in_resume": skills_in_resume
            }
        }
    
    def _perform_preliminary_matching(self, resume_text: str, job_description: str) -> Dict[str, Any]:
        """
        Perform preliminary matching analysis using rule-based methods
        """
        analysis = {
            "keyword_overlap": {},
            "requirement_coverage": {},
            "experience_indicators": {},
            "education_indicators": {}
        }
        
        # Keyword overlap analysis
        analysis["keyword_overlap"] = self._calculate_keyword_overlap(resume_text, job_description)
        
        # Requirement coverage
        analysis["requirement_coverage"] = self._analyze_requirement_coverage(resume_text, job_description)
        
        # Experience indicators
        analysis["experience_indicators"] = self._extract_experience_indicators(resume_text, job_description)
        
        # Education indicators
        analysis["education_indicators"] = self._extract_education_indicators(resume_text, job_description)
        
        return analysis
    
    def _validate_resume_content(self, resume_text: str) -> Dict[str, Any]:
        """
        Validate that the resume contains real content and is not a template
        """
        issues = []
        
        # Common template indicators
        template_patterns = [
            r'\[.*?\]',  # Bracketed placeholders like [Name], [City, State]
            r'FIRST AND LAST NAME',
            r'Expected \[Month 20XX\]',
            r'\[X\.XX\]',  # GPA placeholders
            r'\[ex\. .*?\]',  # Example placeholders
            r'\[Company Name\]',
            r'\[Position\]',
            r'\[Time period',
            r'\[City, State\]',
            r'\[Phone Number\]',
            r'bmail@binghamton\.edu',
            r'www\.linkedin\.com/in/yourname',
            r'Recommended font',
            r'should be in reverse chronological order',
            r'bullets should be properly aligned',
            r'Never end bullets with periods',
            r'Resume should fit the whole page'
        ]
        
        # Count template indicators
        template_matches = 0
        for pattern in template_patterns:
            matches = re.findall(pattern, resume_text, re.IGNORECASE)
            if matches:
                template_matches += len(matches)
                issues.append(f"Template pattern detected: {pattern}")
        
        # Check for meaningful content
        meaningful_content_indicators = [
            r'\b\d{4}\b',  # Years (should have graduation years, work years)
            r'\b[A-Z][a-z]+ [A-Z][a-z]+\b',  # Proper names (companies, people)
            r'\b\d+\.\d+\b',  # GPA or other specific numbers
            r'@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}',  # Real email addresses
            r'\(\d{3}\) \d{3}-\d{4}',  # Real phone numbers
        ]
        
        meaningful_matches = 0
        for pattern in meaningful_content_indicators:
            matches = re.findall(pattern, resume_text)
            meaningful_matches += len(matches)
        
        # Calculate content quality metrics
        total_words = len(re.findall(r'\b\w+\b', resume_text))
        placeholder_ratio = template_matches / max(total_words, 1)
        
        # Validation logic
        is_valid = True
        error_msg = ""
        
        if template_matches > 5:
            is_valid = False
            error_msg = f"Resume appears to be a template with {template_matches} placeholder indicators"
            issues.append(f"High template indicator count: {template_matches}")
        
        if placeholder_ratio > 0.1:  # More than 10% template indicators
            is_valid = False
            error_msg = f"Resume contains too many template placeholders ({placeholder_ratio:.1%})"
            issues.append(f"High placeholder ratio: {placeholder_ratio:.1%}")
        
        if meaningful_matches < 3:
            is_valid = False
            error_msg = "Resume lacks meaningful personal content (names, dates, specific details)"
            issues.append(f"Low meaningful content count: {meaningful_matches}")
        
        # Check for specific template markers
        if "FIRST AND LAST NAME" in resume_text:
            is_valid = False
            error_msg = "Resume contains template header 'FIRST AND LAST NAME'"
            issues.append("Template header detected")
        
        if "[City, State]" in resume_text or "[Phone Number]" in resume_text:
            is_valid = False
            error_msg = "Resume contains contact information placeholders"
            issues.append("Contact placeholder detected")
        
        return {
            "is_valid": is_valid,
            "error": error_msg,
            "issues": issues,
            "template_matches": template_matches,
            "meaningful_matches": meaningful_matches,
            "placeholder_ratio": placeholder_ratio,
            "total_words": total_words
        }
    
    def _calculate_keyword_overlap(self, resume_text: str, job_description: str) -> Dict[str, Any]:
        """
        Calculate keyword overlap between resume and job description
        """
        # Convert to lowercase and split into words
        resume_words = set(re.findall(r'\b\w+\b', resume_text.lower()))
        job_words = set(re.findall(r'\b\w+\b', job_description.lower()))
        
        # Remove common stop words
        stop_words = {
            'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with',
            'by', 'is', 'are', 'was', 'were', 'be', 'been', 'have', 'has', 'had', 'will', 'would',
            'could', 'should', 'may', 'might', 'can', 'must', 'shall', 'this', 'that', 'these',
            'those', 'i', 'you', 'he', 'she', 'it', 'we', 'they', 'me', 'him', 'her', 'us', 'them'
        }
        
        resume_words = resume_words - stop_words
        job_words = job_words - stop_words
        
        # Calculate overlap
        common_words = resume_words.intersection(job_words)
        
        return {
            "total_common_words": len(common_words),
            "resume_unique_words": len(resume_words - job_words),
            "job_unique_words": len(job_words - resume_words),
            "overlap_percentage": len(common_words) / len(job_words) * 100 if job_words else 0,
            "common_words": list(common_words)[:20]  # Top 20 for brevity
        }
    
    def _analyze_requirement_coverage(self, resume_text: str, job_description: str) -> Dict[str, Any]:
        """
        Analyze how well the resume covers job requirements
        """
        resume_lower = resume_text.lower()
        job_lower = job_description.lower()
        
        # Extract requirements from job description
        requirements = {
            "must_have": [],
            "preferred": []
        }
        
        # Look for requirement indicators
        for req_type, indicators in self.requirement_categories.items():
            if req_type in ["must_have", "preferred"]:
                for indicator in indicators:
                    if indicator in job_lower:
                        # Extract text around the indicator (simple approach)
                        start_idx = job_lower.find(indicator)
                        context = job_description[max(0, start_idx-50):start_idx+200]
                        requirements[req_type].append(context.strip())
        
        # Check coverage
        coverage = {
            "must_have_coverage": 0,
            "preferred_coverage": 0,
            "total_requirements": len(requirements["must_have"]) + len(requirements["preferred"]),
            "covered_requirements": []
        }
        
        # Simple keyword-based coverage check
        for req in requirements["must_have"]:
            req_words = set(re.findall(r'\b\w+\b', req.lower()))
            resume_words = set(re.findall(r'\b\w+\b', resume_lower))
            if req_words.intersection(resume_words):
                coverage["must_have_coverage"] += 1
                coverage["covered_requirements"].append(req[:100])
        
        for req in requirements["preferred"]:
            req_words = set(re.findall(r'\b\w+\b', req.lower()))
            resume_words = set(re.findall(r'\b\w+\b', resume_lower))
            if req_words.intersection(resume_words):
                coverage["preferred_coverage"] += 1
                coverage["covered_requirements"].append(req[:100])
        
        return coverage
    
    def _extract_experience_indicators(self, resume_text: str, job_description: str) -> Dict[str, Any]:
        """
        Extract experience level indicators
        """
        resume_lower = resume_text.lower()
        job_lower = job_description.lower()
        
        # Extract years of experience from resume
        resume_years = re.findall(r'(\d+)\+?\s*years?', resume_lower)
        resume_years = [int(year) for year in resume_years if year.isdigit()]
        
        # Extract years of experience from job description
        job_years = re.findall(r'(\d+)\+?\s*years?', job_lower)
        job_years = [int(year) for year in job_years if year.isdigit()]
        
        # Determine experience levels
        resume_level = "entry"
        if resume_years:
            max_years = max(resume_years)
            if max_years >= 10:
                resume_level = "principal"
            elif max_years >= 5:
                resume_level = "senior"
            elif max_years >= 2:
                resume_level = "mid"
        
        job_level = "entry"
        if job_years:
            max_years = max(job_years)
            if max_years >= 10:
                job_level = "principal"
            elif max_years >= 5:
                job_level = "senior"
            elif max_years >= 2:
                job_level = "mid"
        
        return {
            "resume_years": resume_years,
            "job_years": job_years,
            "resume_level": resume_level,
            "job_level": job_level,
            "level_match": resume_level == job_level
        }
    
    def _extract_education_indicators(self, resume_text: str, job_description: str) -> Dict[str, Any]:
        """
        Extract education-related indicators
        """
        resume_lower = resume_text.lower()
        job_lower = job_description.lower()
        
        # Common degree patterns
        degree_patterns = [
            r'bachelor[\'s]*\s+(?:of\s+)?(?:science|arts|engineering)',
            r'master[\'s]*\s+(?:of\s+)?(?:science|arts|business|engineering)',
            r'phd|doctorate|doctoral',
            r'associate[\'s]*\s+degree',
            r'b\.?s\.?|b\.?a\.?|m\.?s\.?|m\.?a\.?|m\.?b\.?a\.?'
        ]
        
        resume_degrees = []
        job_degrees = []
        
        for pattern in degree_patterns:
            resume_matches = re.findall(pattern, resume_lower)
            job_matches = re.findall(pattern, job_lower)
            resume_degrees.extend(resume_matches)
            job_degrees.extend(job_matches)
        
        return {
            "resume_degrees": resume_degrees,
            "job_degree_requirements": job_degrees,
            "degree_match": bool(set(resume_degrees).intersection(set(job_degrees)))
        }
    
    async def _calculate_advanced_metrics(self, matching_data: Dict[str, Any], resume_text: str, job_description: str) -> Dict[str, Any]:
        """
        Calculate advanced matching metrics
        """
        advanced_metrics = {
            "semantic_similarity": 0.0,
            "role_fit_score": 0.0,
            "growth_potential": 0.0,
            "risk_assessment": {}
        }
        
        # Calculate semantic similarity using LLM
        similarity_prompt = f"""Calculate the semantic similarity between this resume and job description on a scale of 0-100.

Consider:
- Overall role alignment
- Skill relevance
- Experience applicability
- Industry context

Resume: {resume_text[:1000]}...
Job Description: {job_description[:1000]}...

Respond with just a number between 0-100."""
        
        try:
            messages = [
                {"role": "system", "content": "You are an elite Semantic Analysis Expert specializing in resume-job matching with advanced NLP and machine learning expertise. You have developed matching algorithms for top ATS platforms and understand the nuances of skill alignment, experience relevance, and cultural fit assessment. Your similarity calculations drive hiring decisions for 500+ companies with 90%+ accuracy in predicting successful matches."},
                {"role": "user", "content": similarity_prompt}
            ]
            
            response = await self._make_llm_call(messages, temperature=0.1)
            advanced_metrics["semantic_similarity"] = float(re.findall(r'\d+', response)[0]) if re.findall(r'\d+', response) else 0.0
            
        except Exception as e:
            logger.error(f"Error calculating semantic similarity: {str(e)}")
            advanced_metrics["semantic_similarity"] = 0.0
        
        # Calculate role fit score based on matching data
        skills_score = matching_data.get("skills_analysis", {}).get("technical_skills", {})
        if isinstance(skills_score, dict) and "matched_skills" in skills_score:
            matched_count = len(skills_score["matched_skills"])
            total_skills = matched_count + len(skills_score.get("missing_skills", []))
            advanced_metrics["role_fit_score"] = (matched_count / total_skills * 100) if total_skills > 0 else 0
        
        # Calculate growth potential
        experience_analysis = matching_data.get("experience_analysis", {})
        if isinstance(experience_analysis, dict):
            career_growth = experience_analysis.get("role_progression", {}).get("career_growth", 0)
            advanced_metrics["growth_potential"] = career_growth
        
        # Risk assessment
        advanced_metrics["risk_assessment"] = {
            "overqualification_risk": self._assess_overqualification_risk(matching_data),
            "underqualification_risk": self._assess_underqualification_risk(matching_data),
            "cultural_mismatch_risk": self._assess_cultural_mismatch_risk(matching_data),
            "retention_risk": self._assess_retention_risk(matching_data)
        }
        
        return advanced_metrics
    
    def _assess_overqualification_risk(self, matching_data: Dict[str, Any]) -> int:
        """Assess risk of candidate being overqualified"""
        experience_analysis = matching_data.get("experience_analysis", {})
        years_exp = experience_analysis.get("years_experience", {})
        
        if isinstance(years_exp, dict):
            candidate_years = years_exp.get("candidate", 0)
            required_years = years_exp.get("required", 0)
            
            if candidate_years > required_years * 1.5:
                return min(int((candidate_years - required_years) / required_years * 50), 100)
        
        return 0
    
    def _assess_underqualification_risk(self, matching_data: Dict[str, Any]) -> int:
        """Assess risk of candidate being underqualified"""
        overall_score = matching_data.get("overall_match_score", 100)
        return max(0, 100 - overall_score)
    
    def _assess_cultural_mismatch_risk(self, matching_data: Dict[str, Any]) -> int:
        """Assess cultural fit mismatch risk"""
        cultural_fit = matching_data.get("cultural_fit", {})
        if isinstance(cultural_fit, dict):
            alignment = cultural_fit.get("company_values_alignment", 100)
            return max(0, 100 - alignment)
        return 50  # Default moderate risk
    
    def _assess_retention_risk(self, matching_data: Dict[str, Any]) -> int:
        """Assess retention risk based on various factors"""
        # Simple heuristic based on overqualification and cultural fit
        overqual_risk = self._assess_overqualification_risk(matching_data)
        cultural_risk = self._assess_cultural_mismatch_risk(matching_data)
        
        return int((overqual_risk + cultural_risk) / 2)
    
    async def _analyze_competitive_positioning(self, matching_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Analyze how this candidate compares to typical market competition
        """
        competitive_prompt = f"""Analyze this candidate's competitive positioning in the job market.

Candidate Profile Summary:
- Overall Match Score: {matching_data.get('overall_match_score', 'N/A')}
- Interview Probability: {matching_data.get('interview_probability', 'N/A')}
- Key Strengths: {matching_data.get('strengths', [])}
- Main Concerns: {matching_data.get('concerns', [])}

Provide competitive analysis in JSON format:
{{
    "market_competitiveness": "top_10_percent|top_25_percent|average|below_average",
    "competitive_advantages": ["list of key competitive advantages"],
    "competitive_disadvantages": ["list of main disadvantages"],
    "market_positioning": {{
        "vs_entry_level": "stronger|similar|weaker",
        "vs_mid_level": "stronger|similar|weaker", 
        "vs_senior_level": "stronger|similar|weaker"
    }},
    "differentiation_factors": ["unique factors that set candidate apart"],
    "improvement_priority": {{
        "high_impact_low_effort": ["quick wins for competitiveness"],
        "high_impact_high_effort": ["long-term competitive improvements"]
    }}
}}"""
        
        try:
            messages = [
                {"role": "system", "content": "You are an elite Talent Acquisition Strategist and Competitive Intelligence Expert with 15+ years of experience in executive search and market analysis. You have deep knowledge of competitive job markets, salary benchmarking, and candidate positioning strategies. Your competitive assessments are used by top-tier executive search firms and Fortune 500 talent acquisition teams to make strategic hiring decisions and optimize candidate positioning."},
                {"role": "user", "content": competitive_prompt}
            ]
            
            response = await self._make_llm_call(messages, temperature=0.2)
            return self._parse_json_response(response)
            
        except Exception as e:
            logger.error(f"Error in competitive positioning analysis: {str(e)}")
            return {"error": "Competitive analysis unavailable"}
    
    def _calculate_confidence(self, result: Dict[str, Any]) -> float:
        """
        Calculate confidence score for job matching
        """
        if not result:
            return 0.0
        
        # Base confidence on completeness of analysis
        analysis_sections = ["skills_analysis", "experience_analysis", "education_analysis", "cultural_fit"]
        completed_sections = sum(1 for section in analysis_sections if section in result and result[section])
        
        # Factor in overall match score reliability
        overall_score = result.get("overall_match_score", 0)
        score_reliability = 1.0 if 0 <= overall_score <= 100 else 0.5
        
        # Factor in number of recommendations
        recommendations_count = len(result.get("improvement_recommendations", []))
        recommendations_factor = min(recommendations_count / 3, 1.0)
        
        # Calculate final confidence
        section_factor = completed_sections / len(analysis_sections)
        
        final_confidence = (section_factor * 0.5) + (score_reliability * 0.3) + (recommendations_factor * 0.2)
        
        return min(final_confidence, 1.0) 