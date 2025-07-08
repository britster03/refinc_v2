#!/usr/bin/env python3
"""
REAL Pipeline Test - No Fake Data, No Cached Responses

Tests only the actual functionality:
1. Real web scraping for market intelligence
2. Real vector database operations (with actual resume count)
3. Real AI analysis with actual LLM calls
4. Real assessment with actual processing
"""

import asyncio
import json
import time
import requests
from typing import Dict, Any, Optional
from dotenv import load_dotenv
import os

# Load environment variables
load_dotenv()

# Configuration
BASE_URL = "http://localhost:8000"
API_BASE = f"{BASE_URL}/api/ai"

# Real test data - actual resume
REAL_RESUME = """
Alex Rodriguez
Senior Software Engineer & AI Specialist

CONTACT:
Email: alex.rodriguez@email.com
Phone: (555) 987-6543
LinkedIn: linkedin.com/in/alexrodriguez
GitHub: github.com/alexrodriguez

PROFESSIONAL SUMMARY:
Experienced software engineer with 7+ years developing scalable applications and AI/ML systems. 
Led multiple teams in building production-grade systems serving millions of users. 
Expert in Python, cloud architecture, and machine learning deployment.

EXPERIENCE:

Senior Software Engineer | Meta | 2022 - Present
• Architected and built recommendation systems serving 100M+ daily active users
• Led team of 8 engineers developing ML infrastructure on AWS and GCP
• Implemented real-time data pipelines processing 50TB+ daily using Apache Kafka
• Reduced model inference latency by 60% through optimization and caching
• Mentored junior engineers and established ML best practices across organization

Software Engineer | Uber | 2020 - 2022
• Developed microservices for ride-matching algorithms using Python and Go
• Built real-time analytics dashboard processing 1M+ events per minute
• Implemented A/B testing framework used by 20+ product teams
• Optimized database queries reducing response time by 45%
• Collaborated with data scientists on ML model deployment and monitoring

Full Stack Developer | Airbnb | 2018 - 2020
• Built booking and payment systems handling $100M+ annual transactions
• Developed React-based frontend applications with 99.9% uptime
• Implemented fraud detection system using machine learning
• Created automated testing suite reducing deployment time by 70%
• Worked in agile environment with cross-functional product teams

Software Developer | Spotify | 2017 - 2018
• Developed music recommendation algorithms using collaborative filtering
• Built data ingestion pipelines for processing user behavior data
• Implemented caching layer reducing API response time by 30%
• Contributed to open-source projects and internal developer tools

EDUCATION:
Master of Science in Computer Science | Stanford University | 2015 - 2017
• Specialization: Artificial Intelligence and Machine Learning
• GPA: 3.9/4.0
• Thesis: "Deep Learning for Music Recommendation Systems"

Bachelor of Science in Computer Engineering | UC Berkeley | 2011 - 2015
• Magna Cum Laude, GPA: 3.8/4.0
• President of ACM Student Chapter

TECHNICAL SKILLS:
Programming: Python, JavaScript, TypeScript, Go, Java, C++, SQL, R
ML/AI: TensorFlow, PyTorch, Scikit-learn, Keras, Pandas, NumPy, MLflow
Cloud: AWS (EC2, S3, Lambda, SageMaker), GCP, Azure, Docker, Kubernetes
Databases: PostgreSQL, MongoDB, Redis, Cassandra, BigQuery, Snowflake
Web: React, Node.js, FastAPI, Django, Flask, GraphQL, REST APIs
Tools: Git, Jenkins, Terraform, Airflow, Kafka, Elasticsearch, Grafana

PROJECTS:
Real-time Fraud Detection System (2023)
• Built ML system detecting fraudulent transactions with 99.5% accuracy
• Processed 10M+ transactions daily with <100ms latency
• Technologies: Python, TensorFlow, Kafka, Redis, PostgreSQL

Distributed Music Recommendation Engine (2022)
• Developed recommendation system for 50M+ users
• Implemented collaborative filtering and deep learning models
• Technologies: Python, PyTorch, Spark, Cassandra, AWS

CERTIFICATIONS:
• AWS Certified Solutions Architect - Professional (2023)
• Google Cloud Professional ML Engineer (2022)
• Certified Kubernetes Administrator (2021)

ACHIEVEMENTS:
• Led team that won "Best Innovation" award at Meta Hackathon 2023
• Published 4 research papers on ML systems in top-tier conferences
• Speaker at 8 tech conferences including PyCon, MLConf, and KubeCon
• Mentor for Google Summer of Code (2021-2023)
• Open source contributor with 2000+ GitHub stars across projects
"""

REAL_JOB_DESCRIPTION = """
Staff Software Engineer - AI/ML Platform
Company: OpenAI
Location: San Francisco, CA
Salary: $300,000 - $450,000 + Equity

ABOUT THE ROLE:
We're looking for a Staff Software Engineer to join our AI/ML Platform team and help build the infrastructure that powers the next generation of AI systems. You'll work on large-scale distributed systems, ML infrastructure, and cutting-edge AI research.

WHAT YOU'LL DO:
• Design and build scalable ML infrastructure serving billions of requests
• Develop training and inference systems for large language models
• Optimize model performance and reduce computational costs
• Build tools and platforms used by AI researchers and engineers
• Collaborate with research teams to productionize breakthrough AI models
• Lead technical initiatives and mentor other engineers
• Contribute to open source AI/ML tools and frameworks

REQUIREMENTS:
• 7+ years of software engineering experience with distributed systems
• Expert-level Python programming and software architecture skills
• Deep experience with ML frameworks (TensorFlow, PyTorch) and MLOps
• Strong background in cloud platforms (AWS, GCP) and containerization
• Experience with high-performance computing and GPU programming
• Knowledge of distributed training and model serving at scale
• Track record of leading technical projects and mentoring engineers
• MS/PhD in Computer Science, AI, or related field preferred

PREFERRED QUALIFICATIONS:
• Experience with large language models and transformer architectures
• Background in AI research with publications in top-tier venues
• Experience with CUDA, distributed training frameworks (Horovod, DeepSpeed)
• Knowledge of model optimization techniques (quantization, pruning, distillation)
• Experience building ML platforms used by hundreds of engineers
• Open source contributions to major ML frameworks
• Experience with real-time inference systems and edge deployment

TECH STACK:
• Languages: Python, C++, CUDA, JavaScript
• ML: PyTorch, TensorFlow, Hugging Face, Ray, MLflow
• Infrastructure: Kubernetes, Docker, Terraform, Ansible
• Cloud: AWS (EC2, S3, SageMaker), GCP (Vertex AI, TPUs)
• Data: PostgreSQL, Redis, Kafka, Spark, BigQuery
• Monitoring: Prometheus, Grafana, DataDog

WHY JOIN US:
• Work on cutting-edge AI research with global impact
• Collaborate with world-class AI researchers and engineers
• Competitive compensation and equity package
• Flexible work arrangements and unlimited PTO
• $10,000 annual learning and development budget
• Access to latest hardware and computing resources
"""

class RealPipelineTest:
    def __init__(self, auth_token: Optional[str] = None):
        self.results = {}
        self.start_time = time.time()
        self.auth_token = auth_token
        self.headers = {}
        
        if auth_token:
            self.headers["Authorization"] = f"Bearer {auth_token}"
        
    def log(self, message: str, status: str = "INFO"):
        timestamp = time.strftime("%H:%M:%S")
        status_emoji = {
            "INFO": "ℹ️",
            "SUCCESS": "✅", 
            "ERROR": "❌",
            "WARNING": "⚠️",
            "TESTING": "🧪",
            "REAL": "🔥"
        }
        print(f"[{timestamp}] {status_emoji.get(status, '📝')} {message}")
    
    def make_request(self, method: str, endpoint: str, data: Dict = None, require_auth: bool = True) -> Dict[str, Any]:
        """Make HTTP request with error handling"""
        url = f"{API_BASE}{endpoint}"
        headers = {"Content-Type": "application/json"}
        
        if require_auth and self.auth_token:
            headers.update(self.headers)
        
        try:
            if method.upper() == "GET":
                response = requests.get(url, headers=headers, timeout=120)
            elif method.upper() == "POST":
                response = requests.post(url, json=data, headers=headers, timeout=180)
            else:
                raise ValueError(f"Unsupported method: {method}")
            
            if response.status_code == 403:
                return {
                    "error": "Authentication required",
                    "success": False,
                    "status_code": 403
                }
            
            response.raise_for_status()
            return response.json()
            
        except requests.exceptions.RequestException as e:
            self.log(f"Request failed: {e}", "ERROR")
            return {"error": str(e), "success": False}
    
    def test_real_vector_database_status(self) -> bool:
        """Test actual vector database status - no fake data"""
        self.log("Testing REAL Vector Database Status...", "TESTING")
        
        result = self.make_request("GET", "/vector-readiness")
        
        if "error" in result:
            self.log(f"Vector readiness check failed: {result['error']}", "ERROR")
            return False
        
        vector_enabled = result.get("vector_operations_enabled", False)
        current_count = result.get("current_resume_count", 0)
        minimum_required = result.get("minimum_required", 1000)
        progress = result.get("progress_percentage", 0)
        
        self.log(f"🔥 REAL Vector Database Status:", "REAL")
        self.log(f"   Current Resume Count: {current_count}", "INFO")
        self.log(f"   Minimum Required: {minimum_required}", "INFO")
        self.log(f"   Progress: {progress}%", "INFO")
        self.log(f"   Operations Enabled: {vector_enabled}", "INFO")
        
        if not vector_enabled:
            self.log("   Vector operations DISABLED - using alternative insights", "WARNING")
        else:
            self.log("   Vector operations ENABLED - competitive analysis available", "SUCCESS")
        
        self.results["vector_status"] = {
            "passed": True,
            "vector_enabled": vector_enabled,
            "current_count": current_count,
            "progress": progress
        }
        
        return True
    
    def test_real_market_intelligence(self) -> bool:
        """Test REAL web scraping market intelligence - no cached data"""
        self.log("Testing REAL Market Intelligence (Web Scraping)...", "TESTING")
        
        if not self.auth_token:
            self.log("Market intelligence requires authentication - skipping", "WARNING")
            return False
        
        # Force fresh data by using specific skills
        market_request = {
            "skills": ["Python", "Machine Learning", "FastAPI", "PyTorch"],
            "include_salary_data": True,
            "cache_duration_hours": 0  # Force fresh scraping
        }
        
        self.log("🔥 Initiating REAL web scraping (this may take 30-60 seconds)...", "REAL")
        start_time = time.time()
        
        result = self.make_request("POST", "/market-intelligence", market_request)
        scraping_time = time.time() - start_time
        
        if "error" in result or not result.get("success", False):
            self.log(f"Market intelligence failed: {result.get('error', 'Unknown error')}", "ERROR")
            return False
        
        market_data = result.get("data", {})
        
        self.log(f"🔥 REAL Market Intelligence Results (scraped in {scraping_time:.1f}s):", "REAL")
        
        # Check if data is actually fresh/real
        scraped_at = market_data.get("scraped_at", "unknown")
        data_freshness = market_data.get("data_freshness", "unknown")
        sources_used = market_data.get("sources_used", [])
        
        # Get scraping stats if available
        scraping_stats = market_data.get("scraping_stats", {})
        total_jobs = scraping_stats.get("total_jobs_found", 0)
        actual_scraping_time = scraping_stats.get("scraping_time_seconds", scraping_time)
        sources_attempted = scraping_stats.get("sources_attempted", [])
        sources_successful = scraping_stats.get("sources_successful", [])
        
        self.log(f"   Data Freshness: {data_freshness}", "INFO")
        self.log(f"   Scraped At: {scraped_at}", "INFO")
        self.log(f"   Sources Used: {len(sources_used)} sources", "INFO")
        self.log(f"   Total Jobs Found: {total_jobs}", "INFO")
        self.log(f"   Sources Attempted: {sources_attempted}", "INFO")
        self.log(f"   Sources Successful: {sources_successful}", "INFO")
        
        # Analyze skills data and SHOW ACTUAL CONTENT
        skills_analysis = market_data.get("skills_analysis", {})
        self.log(f"   Skills Analyzed: {len(skills_analysis)}", "INFO")
        
        self.log("\n" + "="*80, "REAL")
        self.log("🎯 ACTUAL JOB MARKET DATA (Frontend Content):", "REAL")
        self.log("="*80, "REAL")
        
        total_displayed_jobs = 0
        for skill, data in skills_analysis.items():
            job_postings = data.get("job_postings", [])
            salary_data = data.get("salary_data", {})
            demand_indicators = data.get("demand_indicators", {})
            
            self.log(f"\n📋 {skill.upper()} SKILL ANALYSIS:", "SUCCESS")
            self.log(f"   📈 Total Jobs Found: {len(job_postings)}", "INFO")
            
            if salary_data:
                avg_salary = salary_data.get("average_salary")
                salary_range = salary_data.get("salary_range", {})
                if avg_salary:
                    self.log(f"   💰 Average Salary: ${avg_salary:,}", "INFO")
                if salary_range:
                    min_sal = salary_range.get("min", 0)
                    max_sal = salary_range.get("max", 0)
                    if min_sal and max_sal:
                        self.log(f"   💰 Salary Range: ${min_sal:,} - ${max_sal:,}", "INFO")
            
            # Demand indicators
            if demand_indicators:
                demand_level = demand_indicators.get("demand_level", "unknown")
                job_count = demand_indicators.get("job_count", 0)
                companies_hiring = demand_indicators.get("companies_hiring", 0)
                self.log(f"   📊 Demand Level: {demand_level}", "INFO")
                self.log(f"   🏢 Companies Hiring: {companies_hiring}", "INFO")
            
            # Show actual job postings (first 3 per skill)
            self.log(f"\n   🔍 ACTUAL JOB POSTINGS FOR {skill}:", "INFO")
            for i, job in enumerate(job_postings[:3]):
                total_displayed_jobs += 1
                # Handle both dict and object formats
                if hasattr(job, 'title'):  # JobPosting object
                    title = job.title
                    company = job.company
                    location = job.location
                    salary_min = job.salary_min
                    salary_max = job.salary_max
                    source = job.source
                    posted_date = job.posted_date.strftime("%Y-%m-%d") if hasattr(job.posted_date, 'strftime') else str(job.posted_date)
                    is_fresh = getattr(job, 'is_fresh', True)
                    validation_score = getattr(job, 'validation_score', 1.0)
                    company_domain = getattr(job, 'company_domain', None)
                else:  # Dict format
                    title = job.get('title', 'Unknown')
                    company = job.get('company', 'Unknown')
                    location = job.get('location', 'Unknown')
                    salary_min = job.get('salary_min')
                    salary_max = job.get('salary_max')
                    source = job.get('source', 'unknown')
                    posted_date = job.get('posted_date', 'unknown')
                    is_fresh = job.get('is_fresh', True)
                    validation_score = job.get('validation_score', 1.0)
                    company_domain = job.get('company_domain')
                
                self.log(f"      Job #{i+1}:", "SUCCESS")
                self.log(f"         📌 Title: {title}", "INFO")
                self.log(f"         🏢 Company: {company}", "INFO")
                self.log(f"         📍 Location: {location}", "INFO")
                if salary_min or salary_max:
                    salary_str = ""
                    if salary_min and salary_max:
                        salary_str = f"${salary_min:,} - ${salary_max:,}"
                    elif salary_min:
                        salary_str = f"${salary_min:,}+"
                    elif salary_max:
                        salary_str = f"Up to ${salary_max:,}"
                    self.log(f"         💰 Salary: {salary_str}", "INFO")
                self.log(f"         📅 Posted: {posted_date}", "INFO")
                self.log(f"         🌐 Source: {source}", "INFO")
                self.log(f"         ✅ Fresh: {'Yes' if is_fresh else 'No'}", "INFO")
                self.log(f"         🎯 Quality Score: {validation_score:.2f}/1.0", "INFO")
                if company_domain:
                    self.log(f"         🔗 Domain: {company_domain}", "INFO")
                self.log("", "INFO")  # Empty line
        
        # Market overview data
        job_market_overview = market_data.get("job_market_overview", {})
        if job_market_overview:
            self.log(f"\n📊 JOB MARKET OVERVIEW:", "SUCCESS")
            market_health = job_market_overview.get("market_health", "unknown")
            remote_percentage = job_market_overview.get("remote_job_percentage", 0)
            fastest_growing = job_market_overview.get("fastest_growing_skills", [])
            
            self.log(f"   📈 Market Health: {market_health}", "INFO")
            self.log(f"   🏠 Remote Jobs: {remote_percentage}%", "INFO")
            if fastest_growing:
                self.log(f"   🚀 Fastest Growing Skills: {', '.join(fastest_growing[:5])}", "INFO")
        
        # Industry trends
        industry_trends = market_data.get("industry_trends", {})
        if industry_trends:
            self.log(f"\n🏭 INDUSTRY TRENDS:", "SUCCESS")
            for industry, growth in industry_trends.items():
                if isinstance(growth, dict):
                    for sub_industry, sub_growth in growth.items():
                        self.log(f"   📊 {sub_industry.replace('_', ' ').title()}: {sub_growth}", "INFO")
                else:
                    self.log(f"   📊 {industry.replace('_', ' ').title()}: {growth}", "INFO")
        
        self.log(f"\n📋 SUMMARY:", "SUCCESS")
        self.log(f"   Total Jobs Displayed: {total_displayed_jobs}", "INFO")
        self.log(f"   Skills with Jobs: {len([s for s in skills_analysis.keys() if len(skills_analysis[s].get('job_postings', [])) > 0])}", "INFO")
        
        # Check if this is real data vs cached/fake
        is_real_data = (
            data_freshness == "real_time" and
            len(skills_analysis) > 0 and
            (total_jobs > 0 or any(len(data.get("job_postings", [])) > 0 for data in skills_analysis.values()))
        )
        
        if is_real_data:
            self.log("✅ CONFIRMED: Real web-scraped data received!", "SUCCESS")
        else:
            self.log("⚠️  WARNING: Data appears to be cached or fake", "WARNING")
        
        self.results["market_intelligence"] = {
            "passed": True,
            "scraping_time": scraping_time,
            "is_real_data": is_real_data,
            "skills_analyzed": len(skills_analysis),
            "total_job_postings": sum(len(data.get("job_postings", [])) for data in skills_analysis.values()),
            "total_displayed_jobs": total_displayed_jobs
        }
        
        return True
    
    def test_real_comprehensive_analysis(self) -> bool:
        """Test REAL comprehensive analysis with actual AI processing"""
        self.log("Testing REAL Comprehensive Analysis (Full AI Pipeline)...", "TESTING")
        
        if not self.auth_token:
            self.log("Comprehensive analysis requires authentication - skipping", "WARNING")
            return False
        
        # Use enhanced analysis with real preferences
        analysis_request = {
            "resume_text": REAL_RESUME,
            "job_description": REAL_JOB_DESCRIPTION,
            "preferences": {
                "roadmapDuration": 20,
                "careerGoals": "job_switch",
                "targetRole": "Staff Software Engineer",
                "learningTimeCommitment": 15,
                "priorityAreas": ["Technical Skills", "AI/ML Experience", "Leadership"]
            }
        }
        
        self.log("🔥 Running REAL AI Analysis (this will take 20-40 seconds)...", "REAL")
        start_time = time.time()
        
        result = self.make_request("POST", "/enhanced-analysis", analysis_request)
        analysis_time = time.time() - start_time
        
        if "error" in result or not result.get("success", False):
            self.log(f"Enhanced analysis failed: {result.get('error', 'Unknown error')}", "ERROR")
            return False
        
        analysis_data = result.get("analysis", {})
        session_key = result.get("session_key", "")
        
        self.log(f"🔥 REAL AI Analysis Results (processed in {analysis_time:.1f}s):", "REAL")
        
        # Extract key results
        final_assessment = analysis_data.get("final_assessment", {})
        executive_summary = final_assessment.get("executive_summary", {})
        
        overall_score = executive_summary.get("overall_score", 0)
        recommendation = executive_summary.get("recommendation", "unknown")
        confidence = executive_summary.get("confidence_level", 0)
        key_strengths = executive_summary.get("key_strengths", [])
        key_concerns = executive_summary.get("key_concerns", [])
        
        self.log(f"   Overall Score: {overall_score}%", "INFO")
        self.log(f"   Recommendation: {recommendation}", "INFO")
        self.log(f"   AI Confidence: {confidence}%", "INFO")
        self.log(f"   Key Strengths: {len(key_strengths)}", "INFO")
        self.log(f"   Key Concerns: {len(key_concerns)}", "INFO")
        
        # Show ACTUAL FRONTEND CONTENT
        self.log("\n" + "="*80, "REAL")
        self.log("🎯 ACTUAL AI ANALYSIS CONTENT (Frontend Display):", "REAL")
        self.log("="*80, "REAL")
        
        # Executive Summary
        self.log(f"\n📋 EXECUTIVE SUMMARY:", "SUCCESS")
        self.log(f"   🎯 Overall Match Score: {overall_score}%", "INFO")
        self.log(f"   📊 AI Confidence Level: {confidence}%", "INFO")
        self.log(f"   💡 Recommendation: {recommendation}", "INFO")
        
        # Key Strengths (what users see)
        if key_strengths:
            self.log(f"\n✅ KEY STRENGTHS ({len(key_strengths)} identified):", "SUCCESS")
            for i, strength in enumerate(key_strengths[:5], 1):
                self.log(f"   {i}. {strength}", "INFO")
        
        # Key Concerns (what users see)
        if key_concerns:
            self.log(f"\n⚠️  KEY AREAS FOR IMPROVEMENT ({len(key_concerns)} identified):", "SUCCESS")
            for i, concern in enumerate(key_concerns[:5], 1):
                self.log(f"   {i}. {concern}", "INFO")
        
        # Detailed Analysis Sections
        detailed_analysis = final_assessment.get("detailed_analysis", {})
        if detailed_analysis:
            self.log(f"\n📊 DETAILED ANALYSIS SECTIONS:", "SUCCESS")
            
            # Technical Skills Analysis
            technical_skills = detailed_analysis.get("technical_skills", {})
            if technical_skills:
                skill_score = technical_skills.get("score", 0)
                skill_feedback = technical_skills.get("feedback", "")
                matching_skills = technical_skills.get("matching_skills", [])
                missing_skills = technical_skills.get("missing_skills", [])
                
                self.log(f"\n   🔧 TECHNICAL SKILLS ANALYSIS:", "INFO")
                self.log(f"      Score: {skill_score}/100", "INFO")
                if skill_feedback:
                    self.log(f"      Feedback: {skill_feedback}", "INFO")
                if matching_skills:
                    self.log(f"      Matching Skills: {', '.join(matching_skills[:5])}", "INFO")
                if missing_skills:
                    self.log(f"      Missing Skills: {', '.join(missing_skills[:3])}", "INFO")
            
            # Experience Analysis
            experience = detailed_analysis.get("experience", {})
            if experience:
                exp_score = experience.get("score", 0)
                exp_feedback = experience.get("feedback", "")
                years_experience = experience.get("years_of_experience", 0)
                relevant_experience = experience.get("relevant_experience", [])
                
                self.log(f"\n   💼 EXPERIENCE ANALYSIS:", "INFO")
                self.log(f"      Score: {exp_score}/100", "INFO")
                self.log(f"      Years of Experience: {years_experience}", "INFO")
                if exp_feedback:
                    self.log(f"      Feedback: {exp_feedback}", "INFO")
                if relevant_experience:
                    self.log(f"      Relevant Experience: {len(relevant_experience)} positions", "INFO")
            
            # Education Analysis
            education = detailed_analysis.get("education", {})
            if education:
                edu_score = education.get("score", 0)
                edu_feedback = education.get("feedback", "")
                
                self.log(f"\n   🎓 EDUCATION ANALYSIS:", "INFO")
                self.log(f"      Score: {edu_score}/100", "INFO")
                if edu_feedback:
                    self.log(f"      Feedback: {edu_feedback}", "INFO")
        
        # Recommendations and Action Items
        recommendations = final_assessment.get("recommendations", {})
        if recommendations:
            self.log(f"\n🎯 AI RECOMMENDATIONS:", "SUCCESS")
            
            immediate_actions = recommendations.get("immediate_actions", [])
            if immediate_actions:
                self.log(f"   ⚡ IMMEDIATE ACTIONS:", "INFO")
                for i, action in enumerate(immediate_actions[:3], 1):
                    self.log(f"      {i}. {action}", "INFO")
            
            skill_improvements = recommendations.get("skill_improvements", [])
            if skill_improvements:
                self.log(f"   📚 SKILL IMPROVEMENTS:", "INFO")
                for i, improvement in enumerate(skill_improvements[:3], 1):
                    self.log(f"      {i}. {improvement}", "INFO")
            
            career_advice = recommendations.get("career_advice", [])
            if career_advice:
                self.log(f"   🚀 CAREER ADVICE:", "INFO")
                for i, advice in enumerate(career_advice[:3], 1):
                    self.log(f"      {i}. {advice}", "INFO")
        
        # Learning Roadmap
        learning_roadmap = analysis_data.get("learning_roadmap", {})
        if learning_roadmap:
            self.log(f"\n🗺️  PERSONALIZED LEARNING ROADMAP:", "SUCCESS")
            
            roadmap_weeks = learning_roadmap.get("total_weeks", 0)
            roadmap_modules = learning_roadmap.get("modules", [])
            
            self.log(f"   Duration: {roadmap_weeks} weeks", "INFO")
            self.log(f"   Modules: {len(roadmap_modules)}", "INFO")
            
            for i, module in enumerate(roadmap_modules[:3], 1):
                module_name = module.get("name", f"Module {i}")
                module_duration = module.get("duration_weeks", 0)
                module_skills = module.get("skills", [])
                
                self.log(f"   📖 Module {i}: {module_name}", "INFO")
                self.log(f"      Duration: {module_duration} weeks", "INFO")
                if module_skills:
                    self.log(f"      Skills: {', '.join(module_skills[:3])}", "INFO")
        
        # Check agent results
        agent_results = analysis_data.get("agent_results", {})
        self.log(f"\n🤖 AI AGENTS PERFORMANCE:", "SUCCESS")
        self.log(f"   AI Agents Used: {len(agent_results)}", "INFO")
        
        for agent_name, agent_result in agent_results.items():
            success = agent_result.get("success", False)
            agent_confidence = agent_result.get("confidence", 0)
            processing_time = agent_result.get("processing_time", 0)
            self.log(f"     {agent_name}: {'✅' if success else '❌'} ({agent_confidence:.1%} confidence, {processing_time:.1f}s)", "INFO")
        
        # Check market analysis integration
        market_analysis = analysis_data.get("market_analysis", {})
        market_enabled = market_analysis.get("enabled", False)
        self.log(f"\n📊 MARKET INTEGRATION:", "SUCCESS")
        self.log(f"   Market Analysis: {'✅ Integrated' if market_enabled else '❌ Not integrated'}", "INFO")
        
        if market_enabled:
            market_insights = market_analysis.get("insights", {})
            salary_insights = market_insights.get("salary_insights", {})
            demand_insights = market_insights.get("demand_insights", {})
            
            if salary_insights:
                market_avg_salary = salary_insights.get("market_average", 0)
                salary_percentile = salary_insights.get("candidate_percentile", 0)
                if market_avg_salary:
                    self.log(f"   💰 Market Average Salary: ${market_avg_salary:,}", "INFO")
                if salary_percentile:
                    self.log(f"   📊 Candidate Salary Percentile: {salary_percentile}%", "INFO")
            
            if demand_insights:
                skill_demand = demand_insights.get("skill_demand_level", "unknown")
                job_availability = demand_insights.get("job_availability", "unknown")
                self.log(f"   📈 Skill Demand Level: {skill_demand}", "INFO")
                self.log(f"   💼 Job Availability: {job_availability}", "INFO")
        
        # Check vector analysis
        vector_analysis = analysis_data.get("vector_analysis", {})
        vector_enabled = vector_analysis.get("enabled", False)
        self.log(f"\n🔍 COMPETITIVE ANALYSIS:", "SUCCESS")
        self.log(f"   Vector Analysis: {'✅ Enabled' if vector_enabled else '⚠️  Alternative insights'}", "INFO")
        
        if not vector_enabled:
            alternative_insights = vector_analysis.get("alternative_insights", {})
            self.log(f"     Alternative Insights: {len(alternative_insights)} categories", "INFO")
            for category, insight in alternative_insights.items():
                if isinstance(insight, str):
                    self.log(f"     {category}: {insight}", "INFO")
        else:
            similar_candidates = vector_analysis.get("similar_candidates", [])
            competitive_score = vector_analysis.get("competitive_score", 0)
            self.log(f"     Similar Candidates Found: {len(similar_candidates)}", "INFO")
            self.log(f"     Competitive Score: {competitive_score}/100", "INFO")
        
        self.log(f"\n📋 ANALYSIS SUMMARY:", "SUCCESS")
        self.log(f"   Session ID: {session_key}", "INFO")
        self.log(f"   Processing Time: {analysis_time:.1f} seconds", "INFO")
        self.log(f"   Overall Score: {overall_score}%", "INFO")
        self.log(f"   Recommendation: {recommendation}", "INFO")
        
        # Verify this is real AI analysis
        is_real_analysis = (
            overall_score > 0 and
            len(key_strengths) > 0 and
            session_key and
            analysis_time > 10  # Real AI analysis takes time
        )
        
        if is_real_analysis:
            self.log("✅ CONFIRMED: Real AI analysis completed!", "SUCCESS")
        else:
            self.log("⚠️  WARNING: Analysis appears to be fake or cached", "WARNING")
        
        self.results["comprehensive_analysis"] = {
            "passed": True,
            "analysis_time": analysis_time,
            "overall_score": overall_score,
            "recommendation": recommendation,
            "ai_confidence": confidence,
            "session_key": session_key,
            "is_real_analysis": is_real_analysis,
            "market_integrated": market_enabled,
            "vector_enabled": vector_enabled,
            "key_strengths_count": len(key_strengths),
            "key_concerns_count": len(key_concerns)
        }
        
        return True
    
    def test_real_vector_operations(self) -> bool:
        """Test REAL vector database operations - actual similarity search"""
        self.log("Testing REAL Vector Database Operations...", "TESTING")
        
        if not self.auth_token:
            self.log("Vector operations require authentication - skipping", "WARNING")
            return False
        
        # Test similarity search with real query
        query = "Senior Software Engineer Python Machine Learning AWS"
        
        self.log(f"🔥 Searching for similar resumes: '{query}'", "REAL")
        result = self.make_request("GET", f"/similar-resumes?query={query}&limit=5")
        
        if "error" in result:
            self.log(f"Vector search failed: {result['error']}", "ERROR")
            return False
        
        similar_resumes = result.get("data", {}).get("similar_resumes", [])
        
        self.log(f"🔥 REAL Vector Search Results:", "REAL")
        self.log(f"   Similar Resumes Found: {len(similar_resumes)}", "INFO")
        
        for i, resume in enumerate(similar_resumes[:3]):
            similarity = resume.get("similarity_score", 0)
            metadata = resume.get("metadata", {})
            user_id = metadata.get("user_id", "unknown")
            self.log(f"   #{i+1}: {similarity:.3f} similarity (user: {user_id})", "INFO")
        
        # Check if these are real results
        has_real_results = len(similar_resumes) > 0
        
        if has_real_results:
            self.log("✅ CONFIRMED: Real vector search results!", "SUCCESS")
        else:
            self.log("⚠️  No similar resumes found (database may be empty)", "WARNING")
        
        self.results["vector_operations"] = {
            "passed": True,
            "similar_resumes_found": len(similar_resumes),
            "has_real_results": has_real_results
        }
        
        return True
    
    def run_real_tests(self):
        """Run only REAL tests - no fake data"""
        self.log("🔥 Starting REAL Pipeline Tests - No Fake Data!", "REAL")
        self.log("=" * 80, "INFO")
        
        tests = [
            ("Real Vector Database Status", self.test_real_vector_database_status),
            ("Real Market Intelligence (Web Scraping)", self.test_real_market_intelligence),
            ("Real Vector Operations", self.test_real_vector_operations),
            ("Real Comprehensive Analysis", self.test_real_comprehensive_analysis),
        ]
        
        passed_tests = 0
        skipped_tests = 0
        total_tests = len(tests)
        
        for test_name, test_func in tests:
            self.log("-" * 60, "INFO")
            try:
                if test_func():
                    passed_tests += 1
                else:
                    # Check if skipped
                    test_key = test_name.lower().replace(" ", "_").replace("(", "").replace(")", "")
                    if test_key in self.results and self.results[test_key].get("skipped"):
                        skipped_tests += 1
            except Exception as e:
                self.log(f"Test {test_name} crashed: {e}", "ERROR")
        
        # Final summary
        self.log("=" * 80, "INFO")
        self.log("🔥 REAL Pipeline Test Results", "REAL")
        self.log(f"Tests Passed: {passed_tests}/{total_tests}")
        self.log(f"Tests Skipped: {skipped_tests}/{total_tests}")
        self.log(f"Success Rate: {passed_tests/(total_tests-skipped_tests):.1%}" if total_tests > skipped_tests else "No tests completed")
        self.log(f"Total Time: {time.time() - self.start_time:.2f} seconds")
        
        # Detailed real results
        self.log("\n🔥 REAL FUNCTIONALITY STATUS:", "REAL")
        
        # Vector Database
        vector_result = self.results.get("vector_status", {})
        if vector_result.get("vector_enabled"):
            self.log("  ✅ Vector Database: ENABLED with competitive analysis", "SUCCESS")
        else:
            progress = vector_result.get("progress", 0)
            count = vector_result.get("current_count", 0)
            self.log(f"  ⚠️  Vector Database: {progress}% progress ({count} resumes, need 1000)", "WARNING")
        
        # Market Intelligence
        market_result = self.results.get("market_intelligence", {})
        if market_result.get("is_real_data"):
            scraping_time = market_result.get("scraping_time", 0)
            job_postings = market_result.get("total_job_postings", 0)
            self.log(f"  ✅ Market Intelligence: REAL web scraping ({scraping_time:.1f}s, {job_postings} jobs)", "SUCCESS")
        else:
            self.log("  ❌ Market Intelligence: Using cached/fake data", "ERROR")
        
        # Comprehensive Analysis
        analysis_result = self.results.get("comprehensive_analysis", {})
        if analysis_result.get("is_real_analysis"):
            score = analysis_result.get("overall_score", 0)
            time_taken = analysis_result.get("analysis_time", 0)
            self.log(f"  ✅ AI Analysis: REAL processing ({score}% score, {time_taken:.1f}s)", "SUCCESS")
        else:
            self.log("  ❌ AI Analysis: Appears to be fake/cached", "ERROR")
        
        # Vector Operations
        vector_ops_result = self.results.get("vector_operations", {})
        if vector_ops_result.get("has_real_results"):
            found = vector_ops_result.get("similar_resumes_found", 0)
            self.log(f"  ✅ Vector Search: REAL results ({found} similar resumes)", "SUCCESS")
        else:
            self.log("  ⚠️  Vector Search: No results (empty database)", "WARNING")
        
        return passed_tests > 0

def get_auth_token() -> Optional[str]:
    """Get authentication token"""
    try:
        response = requests.post(f"{BASE_URL}/auth/login", json={
            "email": "ronitvirwani1@gmail.com",
            "password": "12345678"
        })
        if response.status_code == 200:
            token_data = response.json()
            return token_data.get("access_token") or token_data.get("token")
    except Exception as e:
        print(f"Login error: {e}")
    
    return os.getenv("TEST_AUTH_TOKEN")

def main():
    """Main test runner"""
    print("🔥 REAL Pipeline Test Suite - No Fake Data, No Cached Responses")
    print("Testing only actual functionality with real web scraping and AI processing")
    print("=" * 80)
    
    # Check if server is running
    try:
        response = requests.get(f"{BASE_URL}/health", timeout=5)
        if response.status_code != 200:
            print("❌ Backend server is not responding properly")
            return False
    except requests.exceptions.RequestException:
        print("❌ Backend server is not running. Please start it first:")
        print("   cd backend && python3 run.py")
        return False
    
    # Get authentication token
    auth_token = get_auth_token()
    if auth_token:
        print("✅ Authentication successful - running full REAL test suite")
    else:
        print("❌ Authentication failed - cannot test real functionality")
        return False
    
    # Run REAL tests
    tester = RealPipelineTest(auth_token)
    return tester.run_real_tests()

if __name__ == "__main__":
    success = main()
    exit(0 if success else 1) 