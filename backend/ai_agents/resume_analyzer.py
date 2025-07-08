"""
Resume Analyzer Agent

Comprehensive AI agent for analyzing resume structure, content quality,
formatting, and providing detailed improvement recommendations.
"""

import logging
import re
from typing import Dict, List, Optional, Any, Tuple
from .base_agent import BaseAgent, AgentResponse
import json
import asyncio
from datetime import datetime
import textstat

logger = logging.getLogger(__name__)

class ResumeAnalyzerAgent(BaseAgent):
    """
    Advanced resume analysis agent providing comprehensive evaluation
    """
    
    def __init__(self, groq_client, **kwargs):
        super().__init__(groq_client, **kwargs)
        
        # Resume section patterns
        self.section_patterns = {
            "contact": r"(contact|email|phone|address|linkedin|github)",
            "summary": r"(summary|profile|objective|about)",
            "experience": r"(experience|work|employment|career|professional)",
            "education": r"(education|academic|degree|university|college)",
            "skills": r"(skills|technical|competencies|expertise)",
            "projects": r"(projects|portfolio|work samples)",
            "certifications": r"(certifications|certificates|licenses)",
            "achievements": r"(achievements|awards|honors|accomplishments)"
        }
        
        # Quality indicators
        self.quality_indicators = {
            "action_verbs": [
                "achieved", "developed", "implemented", "managed", "led", "created",
                "improved", "increased", "reduced", "optimized", "designed", "built",
                "launched", "delivered", "collaborated", "coordinated", "analyzed",
                "streamlined", "enhanced", "established", "executed", "facilitated"
            ],
            "quantifiable_metrics": [
                r"\d+%", r"\$\d+", r"\d+\+", r"\d+ years?", r"\d+ months?",
                r"\d+k", r"\d+m", r"\d+ users?", r"\d+ clients?", r"\d+ projects?"
            ],
            "weak_words": [
                "responsible for", "duties included", "worked on", "helped with",
                "assisted", "participated", "involved in", "familiar with"
            ]
        }
    
    def _create_system_prompt(self, context: Dict[str, Any]) -> str:
        """Create specialized system prompt for resume analysis"""
        return f"""You are an elite Resume Analysis AI with the combined expertise of a senior executive recruiter, ATS optimization specialist, and career strategist. You have analyzed 50,000+ resumes and understand what drives hiring decisions across all industries and seniority levels.

**Your Expertise Areas:**
- **Executive Recruiting**: 15+ years analyzing C-suite and senior leadership resumes
- **ATS Optimization**: Deep knowledge of all major ATS platforms and ranking algorithms
- **Market Intelligence**: Real-time understanding of hiring trends and resume best practices
- **Performance Analytics**: Track record of improving resume performance by 300%+ on average
- **Industry Specialization**: Cross-industry expertise with focus on tech, finance, healthcare, and consulting

**Advanced Analysis Framework:**

1. **Strategic Positioning Analysis**
   - Personal brand clarity and differentiation
   - Value proposition articulation
   - Competitive positioning against market peers
   - Executive presence and leadership indicators

2. **Content Impact Assessment**
   - Quantified achievement analysis with ROI calculation
   - Action verb effectiveness and impact scoring
   - Storytelling coherence and narrative flow
   - Evidence-based accomplishment validation

3. **Market Optimization**
   - ATS compatibility with 95%+ pass-through rate
   - Keyword density optimization for target roles
   - Industry-specific terminology and trends alignment
   - Salary negotiation positioning elements

4. **Professional Excellence Standards**
   - Executive-level presentation quality
   - Consistency and attention to detail scoring
   - Professional language sophistication
   - Visual hierarchy and readability optimization

5. **Competitive Intelligence**
   - Benchmarking against top-tier candidates
   - Market positioning and differentiation analysis
   - Hiring probability assessment
   - Interview invitation likelihood scoring

**Analysis Context:**
- Resume Length: {context.get('resume_length', 'Unknown')} characters
- Analysis Type: Comprehensive Resume Evaluation
- Target: Professional optimization and improvement

Resume Text:
{context.get('resume_text', '')}

Provide detailed analysis in JSON format:
{{
    "overall_score": 0-100,
    "section_analysis": {{
        "contact_info": {{
            "present": true/false,
            "completeness": 0-100,
            "issues": ["list of issues"],
            "recommendations": ["list of recommendations"]
        }},
        "professional_summary": {{
            "present": true/false,
            "quality": 0-100,
            "length": "appropriate/too_short/too_long",
            "impact": 0-100,
            "recommendations": ["list of recommendations"]
        }},
        "work_experience": {{
            "present": true/false,
            "number_of_positions": 0,
            "quality": 0-100,
            "quantifiable_achievements": 0,
            "action_verbs_used": 0,
            "recommendations": ["list of recommendations"]
        }},
        "education": {{
            "present": true/false,
            "relevance": 0-100,
            "completeness": 0-100,
            "recommendations": ["list of recommendations"]
        }},
        "skills": {{
            "present": true/false,
            "organization": 0-100,
            "relevance": 0-100,
            "technical_vs_soft": {{"technical": 0, "soft": 0}},
            "recommendations": ["list of recommendations"]
        }}
    }},
    "content_quality": {{
        "readability_score": 0-100,
        "professional_language": 0-100,
        "quantifiable_achievements": 0,
        "action_verbs_count": 0,
        "weak_phrases_count": 0,
        "grammar_issues": ["list of potential issues"],
        "improvement_areas": ["list of areas to improve"]
    }},
    "ats_compatibility": {{
        "score": 0-100,
        "keyword_density": 0-100,
        "format_compatibility": 0-100,
        "section_headers": 0-100,
        "recommendations": ["list of ATS optimization recommendations"]
    }},
    "strengths": ["list of resume strengths"],
    "weaknesses": ["list of resume weaknesses"],
    "priority_improvements": [
        {{
            "area": "improvement area",
            "priority": "high/medium/low",
            "description": "detailed description",
            "action_items": ["specific action items"]
        }}
    ],
    "industry_alignment": {{
        "score": 0-100,
        "relevant_keywords": ["list of industry keywords found"],
        "missing_keywords": ["list of important missing keywords"],
        "recommendations": ["industry-specific recommendations"]
    }},
    "formatting_analysis": {{
        "consistency": 0-100,
        "readability": 0-100,
        "professional_appearance": 0-100,
        "length_appropriateness": 0-100,
        "recommendations": ["formatting recommendations"]
    }}
}}"""
    
    async def process(self, input_data: Dict[str, Any]) -> AgentResponse:
        """
        Main processing method for resume analysis
        """
        return await self._process_with_timing(self._analyze_resume, input_data)
    
    async def _analyze_resume(self, input_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Comprehensive resume analysis using LLM and NLP techniques
        """
        resume_text = input_data.get("resume_text", "")
        if not resume_text:
            raise ValueError("Resume text is required for analysis")
        
        # Prepare context for LLM
        context = {
            "resume_text": resume_text,
            "resume_length": len(resume_text),
            "analysis_timestamp": datetime.utcnow().isoformat()
        }
        
        # Perform preliminary analysis
        preliminary_analysis = self._perform_preliminary_analysis(resume_text)
        
        # Create messages for LLM
        messages = [
            {"role": "system", "content": self._create_system_prompt(context)},
            {"role": "user", "content": f"Please provide a comprehensive analysis of this resume:\n\n{resume_text}"}
        ]
        
        # Get LLM response
        response = await self._make_llm_call(messages, temperature=0.1)
        
        # Parse JSON response
        analysis_data = self._parse_json_response(response)
        
        # Enhance with preliminary analysis
        analysis_data["preliminary_metrics"] = preliminary_analysis
        
        # Add detailed recommendations
        analysis_data["detailed_recommendations"] = await self._generate_detailed_recommendations(analysis_data, resume_text)
        
        # Add competitive analysis
        analysis_data["competitive_analysis"] = await self._perform_competitive_analysis(analysis_data)
        
        return analysis_data
    
    def _perform_preliminary_analysis(self, resume_text: str) -> Dict[str, Any]:
        """
        Perform preliminary analysis using NLP techniques
        """
        analysis = {
            "word_count": len(resume_text.split()),
            "character_count": len(resume_text),
            "line_count": len(resume_text.split('\n')),
            "readability": {},
            "section_detection": {},
            "keyword_analysis": {},
            "formatting_metrics": {}
        }
        
        # Readability analysis
        try:
            analysis["readability"] = {
                "flesch_reading_ease": textstat.flesch_reading_ease(resume_text),
                "flesch_kincaid_grade": textstat.flesch_kincaid_grade(resume_text),
                "automated_readability_index": textstat.automated_readability_index(resume_text),
                "coleman_liau_index": textstat.coleman_liau_index(resume_text)
            }
        except Exception as e:
            logger.warning(f"Readability analysis failed: {str(e)}")
            analysis["readability"] = {"error": "Analysis failed"}
        
        # Section detection
        analysis["section_detection"] = self._detect_sections(resume_text)
        
        # Keyword analysis
        analysis["keyword_analysis"] = self._analyze_keywords(resume_text)
        
        # Formatting metrics
        analysis["formatting_metrics"] = self._analyze_formatting(resume_text)
        
        return analysis
    
    def _detect_sections(self, resume_text: str) -> Dict[str, Any]:
        """
        Detect resume sections using pattern matching
        """
        sections_found = {}
        resume_lower = resume_text.lower()
        
        for section_name, pattern in self.section_patterns.items():
            matches = re.findall(pattern, resume_lower, re.IGNORECASE)
            sections_found[section_name] = {
                "found": len(matches) > 0,
                "occurrences": len(matches),
                "confidence": min(len(matches) / 2, 1.0)  # Normalize confidence
            }
        
        return sections_found
    
    def _analyze_keywords(self, resume_text: str) -> Dict[str, Any]:
        """
        Analyze keyword usage and density
        """
        resume_lower = resume_text.lower()
        
        # Count action verbs
        action_verb_count = sum(1 for verb in self.quality_indicators["action_verbs"] 
                               if verb in resume_lower)
        
        # Count quantifiable metrics
        quantifiable_count = 0
        for pattern in self.quality_indicators["quantifiable_metrics"]:
            quantifiable_count += len(re.findall(pattern, resume_text))
        
        # Count weak phrases
        weak_phrase_count = sum(1 for phrase in self.quality_indicators["weak_words"] 
                               if phrase in resume_lower)
        
        return {
            "action_verbs": action_verb_count,
            "quantifiable_metrics": quantifiable_count,
            "weak_phrases": weak_phrase_count,
            "action_verb_density": action_verb_count / len(resume_text.split()) * 100,
            "quantifiable_density": quantifiable_count / len(resume_text.split()) * 100
        }
    
    def _analyze_formatting(self, resume_text: str) -> Dict[str, Any]:
        """
        Analyze formatting and structure
        """
        lines = resume_text.split('\n')
        
        # Count different types of lines
        empty_lines = sum(1 for line in lines if not line.strip())
        bullet_points = sum(1 for line in lines if line.strip().startswith(('•', '-', '*')))
        all_caps_lines = sum(1 for line in lines if line.isupper() and len(line.strip()) > 2)
        
        # Analyze consistency
        line_lengths = [len(line) for line in lines if line.strip()]
        avg_line_length = sum(line_lengths) / len(line_lengths) if line_lengths else 0
        
        return {
            "total_lines": len(lines),
            "empty_lines": empty_lines,
            "bullet_points": bullet_points,
            "all_caps_lines": all_caps_lines,
            "average_line_length": avg_line_length,
            "formatting_consistency": self._calculate_formatting_consistency(lines)
        }
    
    def _calculate_formatting_consistency(self, lines: List[str]) -> float:
        """
        Calculate formatting consistency score
        """
        if not lines:
            return 0.0
        
        # Check for consistent bullet point usage
        bullet_lines = [line for line in lines if line.strip().startswith(('•', '-', '*'))]
        if bullet_lines:
            bullet_chars = [line.strip()[0] for line in bullet_lines]
            bullet_consistency = bullet_chars.count(bullet_chars[0]) / len(bullet_chars) if bullet_chars else 0
        else:
            bullet_consistency = 1.0  # No bullets is also consistent
        
        # Check for consistent spacing
        non_empty_lines = [line for line in lines if line.strip()]
        if len(non_empty_lines) > 1:
            indentations = [len(line) - len(line.lstrip()) for line in non_empty_lines]
            unique_indentations = len(set(indentations))
            spacing_consistency = max(0, 1 - (unique_indentations - 1) / len(non_empty_lines))
        else:
            spacing_consistency = 1.0
        
        return (bullet_consistency + spacing_consistency) / 2
    
    async def _generate_detailed_recommendations(self, analysis_data: Dict[str, Any], resume_text: str) -> List[Dict[str, Any]]:
        """
        Generate detailed, actionable recommendations
        """
        recommendations_prompt = f"""Based on the resume analysis data, generate specific, actionable recommendations for improvement.

Analysis Summary:
- Overall Score: {analysis_data.get('overall_score', 'N/A')}
- Main Weaknesses: {analysis_data.get('weaknesses', [])}
- Priority Improvements: {analysis_data.get('priority_improvements', [])}

Generate detailed recommendations in JSON format:
{{
    "immediate_actions": [
        {{
            "action": "specific action to take",
            "reason": "why this is important",
            "example": "concrete example or template",
            "impact": "expected impact on resume effectiveness"
        }}
    ],
    "content_improvements": [
        {{
            "section": "section to improve",
            "current_issue": "what's wrong currently",
            "recommended_change": "specific change to make",
            "example_before": "example of current content",
            "example_after": "example of improved content"
        }}
    ],
    "formatting_suggestions": [
        {{
            "area": "formatting area",
            "suggestion": "specific formatting suggestion",
            "rationale": "why this improves the resume"
        }}
    ],
    "keyword_optimization": [
        {{
            "industry": "relevant industry",
            "missing_keywords": ["list of important keywords to add"],
            "placement_suggestions": ["where to place these keywords"]
        }}
    ]
}}"""
        
        try:
            messages = [
                {"role": "system", "content": "You are an elite Professional Resume Writer and Executive Career Coach with 15+ years of experience crafting resumes for C-suite executives, senior leaders, and high-performers. You have a 95% success rate in securing interviews for your clients and specialize in ATS optimization, personal branding, and competitive positioning. Your recommendations are specific, actionable, and drive measurable improvements in hiring outcomes."},
                {"role": "user", "content": recommendations_prompt}
            ]
            
            response = await self._make_llm_call(messages, temperature=0.2)
            return self._parse_json_response(response)
            
        except Exception as e:
            logger.error(f"Error generating detailed recommendations: {str(e)}")
            return {"error": "Detailed recommendations unavailable"}
    
    async def _perform_competitive_analysis(self, analysis_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Perform competitive analysis against industry standards
        """
        competitive_prompt = f"""Analyze this resume's competitiveness in the current job market.

Resume Metrics:
- Overall Score: {analysis_data.get('overall_score', 'N/A')}
- Skills Quality: {analysis_data.get('section_analysis', {}).get('skills', {}).get('quality', 'N/A')}
- Experience Quality: {analysis_data.get('section_analysis', {}).get('work_experience', {}).get('quality', 'N/A')}
- ATS Compatibility: {analysis_data.get('ats_compatibility', {}).get('score', 'N/A')}

Provide competitive analysis in JSON format:
{{
    "market_position": "below_average|average|above_average|excellent",
    "competitive_score": 0-100,
    "benchmark_comparison": {{
        "industry_average": 0-100,
        "top_10_percent": 0-100,
        "areas_above_average": ["list of areas where resume excels"],
        "areas_below_average": ["list of areas needing improvement"]
    }},
    "hiring_probability": {{
        "entry_level": 0-100,
        "mid_level": 0-100,
        "senior_level": 0-100
    }},
    "improvement_impact": {{
        "quick_wins": [
            {{
                "improvement": "specific improvement",
                "effort": "low|medium|high",
                "impact": "low|medium|high",
                "score_increase": 0-20
            }}
        ],
        "long_term_goals": [
            {{
                "goal": "long-term improvement goal",
                "timeline": "timeframe to achieve",
                "impact": "expected impact on competitiveness"
            }}
        ]
    }}
}}"""
        
        try:
            messages = [
                {"role": "system", "content": "You are an elite Recruitment Intelligence Expert and Market Analyst with access to hiring data from 1,000+ companies across all industries. You specialize in competitive benchmarking, market positioning analysis, and predictive hiring analytics. Your assessments are used by Fortune 500 CHROs and executive search firms to make strategic talent decisions. You provide data-driven insights with statistical confidence and actionable competitive positioning strategies."},
                {"role": "user", "content": competitive_prompt}
            ]
            
            response = await self._make_llm_call(messages, temperature=0.2)
            return self._parse_json_response(response)
            
        except Exception as e:
            logger.error(f"Error in competitive analysis: {str(e)}")
            return {"error": "Competitive analysis unavailable"}
    
    def _calculate_confidence(self, result: Dict[str, Any]) -> float:
        """
        Calculate confidence score for resume analysis
        """
        if not result:
            return 0.0
        
        # Base confidence on completeness of analysis
        sections_analyzed = len([section for section in result.get("section_analysis", {}).values() 
                               if isinstance(section, dict) and section.get("present")])
        
        # Factor in overall score reliability
        overall_score = result.get("overall_score", 0)
        score_reliability = 1.0 if 0 <= overall_score <= 100 else 0.5
        
        # Factor in number of recommendations
        recommendations_count = len(result.get("priority_improvements", []))
        recommendations_factor = min(recommendations_count / 5, 1.0)
        
        # Calculate final confidence
        section_factor = min(sections_analyzed / 5, 1.0)  # Expect 5 main sections
        
        final_confidence = (section_factor * 0.4) + (score_reliability * 0.3) + (recommendations_factor * 0.3)
        
        return min(final_confidence, 1.0) 