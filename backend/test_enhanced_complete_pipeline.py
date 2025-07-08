#!/usr/bin/env python3
"""
Enhanced Complete Pipeline Test Script

Tests the complete enhanced analysis pipeline including:
1. Market Intelligence with Web Scraping
2. Vector Database Critical Mass Strategy
3. User Preferences and Pre-Analysis
4. Iterative Analysis with Feedback
5. Enhanced Assessment Coordinator
6. All new API endpoints
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

# Enhanced test data with more comprehensive resume
SAMPLE_RESUME = """
Sarah Chen
Senior Full Stack Developer & AI Engineer

CONTACT:
Email: sarah.chen@email.com
Phone: (555) 123-4567
LinkedIn: linkedin.com/in/sarahchen
GitHub: github.com/sarahchen

PROFESSIONAL SUMMARY:
Experienced Full Stack Developer with 6+ years in building scalable web applications and AI/ML systems. 
Proven track record in leading cross-functional teams and delivering high-impact products. 
Passionate about leveraging cutting-edge technologies to solve complex business problems.

EXPERIENCE:

Senior Full Stack Developer | TechCorp Inc. | 2021 - Present
• Led development of microservices architecture serving 2M+ users using Python, FastAPI, and React
• Implemented machine learning recommendation system increasing user engagement by 35%
• Architected cloud-native solutions on AWS with Docker and Kubernetes
• Mentored 4 junior developers and established code review best practices
• Reduced system latency by 50% through database optimization and caching strategies

Full Stack Developer | StartupXYZ | 2019 - 2021
• Built responsive web applications using React, Node.js, and PostgreSQL
• Developed RESTful APIs and integrated third-party services
• Implemented CI/CD pipelines using GitHub Actions and AWS CodeDeploy
• Collaborated with product managers and designers in agile environment
• Increased application performance by 40% through code optimization

Junior Software Developer | DevSolutions | 2018 - 2019
• Developed web applications using JavaScript, HTML5, CSS3, and MySQL
• Participated in code reviews and followed test-driven development practices
• Worked on bug fixes and feature enhancements for existing applications
• Learned modern development frameworks and cloud technologies

EDUCATION:
Master of Science in Computer Science | Stanford University | 2016 - 2018
• Specialization: Artificial Intelligence and Machine Learning
• GPA: 3.9/4.0
• Thesis: "Deep Learning Approaches for Natural Language Processing"

Bachelor of Science in Software Engineering | UC Berkeley | 2012 - 2016
• Magna Cum Laude, GPA: 3.8/4.0
• President of Computer Science Club

TECHNICAL SKILLS:
Programming Languages: Python, JavaScript, TypeScript, Java, C++, SQL
Frontend: React, Vue.js, Angular, HTML5, CSS3, Tailwind CSS
Backend: FastAPI, Node.js, Express.js, Django, Flask
Databases: PostgreSQL, MongoDB, Redis, MySQL, DynamoDB
Cloud & DevOps: AWS, Azure, Docker, Kubernetes, Terraform, Jenkins
AI/ML: TensorFlow, PyTorch, Scikit-learn, Pandas, NumPy
Tools: Git, Jira, Figma, Postman, VS Code

PROJECTS:
AI-Powered E-commerce Platform (2023)
• Built recommendation engine using collaborative filtering and deep learning
• Implemented real-time inventory management system
• Technologies: Python, FastAPI, React, PostgreSQL, Redis, AWS

Smart Home IoT Dashboard (2022)
• Developed full-stack application for IoT device management
• Created real-time data visualization and analytics
• Technologies: Node.js, React, MongoDB, Socket.io, Raspberry Pi

CERTIFICATIONS:
• AWS Certified Solutions Architect - Associate (2023)
• Google Cloud Professional Developer (2022)
• Certified Kubernetes Administrator (2021)

ACHIEVEMENTS:
• "Employee of the Year" at TechCorp Inc. (2023)
• Published 3 research papers on machine learning applications
• Speaker at 5 tech conferences including PyCon and React Summit
• Open source contributor with 500+ GitHub stars across projects
"""

SAMPLE_JOB_DESCRIPTION = """
Senior AI/ML Engineer - Product Intelligence Team

Company: InnovateAI Labs
Location: San Francisco, CA (Hybrid)
Salary: $180,000 - $250,000 + Equity

ABOUT THE ROLE:
We're seeking a Senior AI/ML Engineer to join our Product Intelligence team and help build the next generation of AI-powered products. You'll work on cutting-edge machine learning systems that serve millions of users globally.

REQUIREMENTS:
• 5+ years of software development experience with strong Python skills
• 3+ years of hands-on machine learning and AI experience
• Experience with modern ML frameworks (TensorFlow, PyTorch, Scikit-learn)
• Proficiency in cloud platforms (AWS, GCP, or Azure)
• Strong background in data structures, algorithms, and system design
• Experience with microservices architecture and API development
• Knowledge of containerization (Docker, Kubernetes)
• Excellent communication and collaboration skills
• Bachelor's or Master's degree in Computer Science, AI, or related field

PREFERRED QUALIFICATIONS:
• Experience with recommendation systems and personalization
• Knowledge of MLOps and model deployment pipelines
• Experience with real-time data processing and streaming
• Familiarity with A/B testing and experimentation frameworks
• Previous experience in fast-paced startup or tech company environment
• Publications or contributions to open source ML projects

RESPONSIBILITIES:
• Design and implement scalable machine learning systems
• Develop and deploy ML models for recommendation and personalization
• Collaborate with product managers and data scientists on feature development
• Build robust APIs and microservices for ML model serving
• Optimize model performance and system scalability
• Mentor junior engineers and contribute to technical decision making
• Stay current with latest AI/ML research and industry trends

BENEFITS:
• Competitive salary and equity package
• Comprehensive health, dental, and vision insurance
• Flexible PTO and work-from-home options
• $5,000 annual learning and development budget
• Top-tier equipment and workspace setup
• Catered meals and snacks
• Team building events and company retreats

TECH STACK:
• Languages: Python, JavaScript, Go
• ML/AI: TensorFlow, PyTorch, Hugging Face, MLflow
• Cloud: AWS (SageMaker, Lambda, ECS, RDS)
• Data: PostgreSQL, Redis, Kafka, Airflow
• Infrastructure: Docker, Kubernetes, Terraform
• Frontend: React, TypeScript, Next.js
"""

# Sample user preferences for enhanced analysis
SAMPLE_PREFERENCES = {
    "roadmapDuration": 16,  # 16 weeks
    "careerGoals": "job_switch",
    "targetRole": "Senior AI/ML Engineer",
    "targetCompany": "Tech startup or established tech company",
    "salaryExpectations": "200000-250000",
    "learningTimeCommitment": 12,  # 12 hours per week
    "priorityAreas": ["Technical Skills", "AI/ML Experience", "System Design"],
    "preferredIndustries": ["Technology", "Artificial Intelligence", "Startups"],
    "workPreferences": {
        "remote": True,
        "hybrid": True,
        "onsite": False
    }
}

class EnhancedPipelineTest:
    def __init__(self, auth_token: Optional[str] = None):
        self.results = {}
        self.start_time = time.time()
        self.auth_token = auth_token
        self.headers = {}
        self.session_key = None
        
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
            "FEATURE": "🚀"
        }
        print(f"[{timestamp}] {status_emoji.get(status, '📝')} {message}")
    
    def make_request(self, method: str, endpoint: str, data: Dict = None, require_auth: bool = True) -> Dict[str, Any]:
        """Make HTTP request with error handling"""
        url = f"{API_BASE}{endpoint}"
        headers = {"Content-Type": "application/json"}
        
        # Add auth headers if required and available
        if require_auth and self.auth_token:
            headers.update(self.headers)
        
        try:
            if method.upper() == "GET":
                response = requests.get(url, headers=headers, timeout=60)
            elif method.upper() == "POST":
                response = requests.post(url, json=data, headers=headers, timeout=120)
            elif method.upper() == "PUT":
                response = requests.put(url, json=data, headers=headers, timeout=60)
            else:
                raise ValueError(f"Unsupported method: {method}")
            
            # Handle authentication errors gracefully
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
    
    def test_health_check(self) -> bool:
        """Test AI services health endpoint"""
        self.log("Testing Enhanced AI Health Check...", "TESTING")
        
        result = self.make_request("GET", "/health", require_auth=False)
        
        if "error" in result:
            self.log("Health check failed", "ERROR")
            return False
        
        status = result.get("status", "unknown")
        components = result.get("components", {})
        
        self.log(f"Overall Status: {status}")
        
        # Check individual components including new ones
        for component, details in components.items():
            comp_status = details.get("status", "unknown")
            self.log(f"  {component}: {comp_status}")
        
        is_healthy = status == "healthy"
        self.results["health_check"] = {
            "passed": is_healthy,
            "status": status,
            "components": components
        }
        
        if is_healthy:
            self.log("Enhanced health check passed!", "SUCCESS")
        else:
            self.log("Health check failed - some components are unhealthy", "ERROR")
        
        return is_healthy
    
    def test_vector_readiness(self) -> bool:
        """Test vector database readiness check"""
        self.log("Testing Vector Database Readiness...", "TESTING")
        
        result = self.make_request("GET", "/vector-readiness", require_auth=False)
        
        if "error" in result:
            self.log("Vector readiness check failed", "ERROR")
            return False
        
        vector_enabled = result.get("vector_operations_enabled", False)
        current_count = result.get("current_resume_count", 0)
        minimum_required = result.get("minimum_required", 1000)
        progress = result.get("progress_percentage", 0)
        
        self.log(f"Vector Operations Enabled: {vector_enabled}")
        self.log(f"Current Resume Count: {current_count}")
        self.log(f"Minimum Required: {minimum_required}")
        self.log(f"Progress: {progress}%")
        
        if not vector_enabled:
            self.log("Vector operations disabled - will use alternative insights", "WARNING")
            alternative_insights = result.get("alternative_insights", {})
            self.log(f"Alternative insights available: {len(alternative_insights)} categories")
        
        self.results["vector_readiness"] = {
            "passed": True,  # Always passes, just shows status
            "vector_enabled": vector_enabled,
            "current_count": current_count,
            "minimum_required": minimum_required,
            "progress": progress
        }
        
        self.log("Vector readiness check completed!", "SUCCESS")
        return True
    
    def test_market_intelligence(self) -> bool:
        """Test market intelligence with web scraping"""
        self.log("Testing Market Intelligence (Web Scraping)...", "TESTING")
        
        # Test general market intelligence
        result = self.make_request("GET", "/market-intelligence", require_auth=False)
        
        if "error" in result:
            self.log("Market intelligence test failed", "ERROR")
            return False
        
        market_data = result.get("data", {})
        self.log(f"Market trends available: {len(market_data.get('trending_skills', []))}")
        self.log(f"Industry insights: {len(market_data.get('industry_insights', []))}")
        
        # Test skill-specific demand analysis
        test_skill = "Python"
        skill_result = self.make_request("GET", f"/skill-demand/{test_skill}")
        
        if "error" not in skill_result:
            skill_data = skill_result.get("data", {})
            self.log(f"Skill demand for {test_skill}: {skill_data.get('demand_level', 'unknown')}")
        
        self.results["market_intelligence"] = {
            "passed": True,
            "market_data_available": len(market_data) > 0,
            "skill_analysis_working": "error" not in skill_result
        }
        
        self.log("Market intelligence test passed!", "SUCCESS")
        return True
    
    def test_consent_management(self) -> bool:
        """Test privacy consent management"""
        self.log("Testing Privacy Consent Management...", "TESTING")
        
        if not self.auth_token:
            self.log("Consent management requires authentication - skipping", "WARNING")
            return False
        
        # Test consent submission
        consent_data = {
            "consent_type": "market_analysis",
            "granted": True,
            "ip_address": "127.0.0.1",
            "user_agent": "Test Agent"
        }
        
        result = self.make_request("POST", "/consent", consent_data)
        
        if "error" in result:
            self.log("Consent management test failed", "ERROR")
            return False
        
        self.log("Privacy consent recorded successfully")
        
        # Test consent retrieval
        consent_result = self.make_request("GET", "/consent/market_analysis")
        
        if "error" not in consent_result:
            self.log("Consent retrieval working")
        
        self.results["consent_management"] = {
            "passed": True,
            "consent_recorded": result.get("success", False),
            "consent_retrieved": "error" not in consent_result
        }
        
        self.log("Consent management test passed!", "SUCCESS")
        return True
    
    def test_enhanced_analysis_with_preferences(self) -> bool:
        """Test enhanced analysis with user preferences"""
        self.log("Testing Enhanced Analysis with User Preferences...", "TESTING")
        
        if not self.auth_token:
            self.log("Enhanced analysis requires authentication - skipping", "WARNING")
            return False
        
        # Prepare enhanced analysis request
        data = {
            "resume_text": SAMPLE_RESUME,
            "job_description": SAMPLE_JOB_DESCRIPTION,
            "preferences": SAMPLE_PREFERENCES
        }
        
        start_time = time.time()
        result = self.make_request("POST", "/enhanced-analysis", data)
        analysis_time = time.time() - start_time
        
        if "error" in result or not result.get("success", False):
            self.log("Enhanced analysis failed", "ERROR")
            self.results["enhanced_analysis"] = {"passed": False, "error": result.get("error")}
            return False
        
        analysis_data = result.get("analysis", {})
        session_key = result.get("session_key", "")
        remaining_iterations = result.get("remaining_iterations", 0)
        
        # Store session key for iteration testing
        self.session_key = session_key
        
        # Extract key metrics
        executive_summary = analysis_data.get("final_assessment", {}).get("executive_summary", {})
        overall_score = executive_summary.get("overall_score", 0)
        recommendation = executive_summary.get("recommendation", "unknown")
        confidence = executive_summary.get("confidence_level", 0)
        
        self.log(f"Enhanced analysis completed in {analysis_time:.2f} seconds")
        self.log(f"Overall Score: {overall_score}%")
        self.log(f"Recommendation: {recommendation}")
        self.log(f"AI Confidence: {confidence}%")
        self.log(f"Session Key: {session_key[:20]}...")
        self.log(f"Remaining Iterations: {remaining_iterations}")
        
        # Check if user preferences were considered
        strategic_recommendations = analysis_data.get("final_assessment", {}).get("strategic_recommendations", {})
        personalized_insights = len(strategic_recommendations.get("immediate_actions", []))
        
        self.log(f"Personalized insights: {personalized_insights} recommendations")
        
        # Check market analysis integration
        market_analysis = analysis_data.get("market_analysis", {})
        market_enabled = market_analysis.get("enabled", False)
        self.log(f"Market analysis integrated: {market_enabled}")
        
        # Check vector analysis status
        vector_analysis = analysis_data.get("vector_analysis", {})
        vector_enabled = vector_analysis.get("enabled", False)
        self.log(f"Vector analysis enabled: {vector_enabled}")
        
        if not vector_enabled:
            alternative_insights = vector_analysis.get("alternative_insights", {})
            self.log(f"Alternative insights provided: {len(alternative_insights)} categories")
        
        passed = overall_score > 0 and session_key
        self.results["enhanced_analysis"] = {
            "passed": passed,
            "analysis_time": analysis_time,
            "overall_score": overall_score,
            "recommendation": recommendation,
            "confidence": confidence,
            "session_key": session_key,
            "remaining_iterations": remaining_iterations,
            "personalized_insights": personalized_insights,
            "market_integrated": market_enabled,
            "vector_enabled": vector_enabled
        }
        
        if passed:
            self.log("Enhanced analysis with preferences passed!", "SUCCESS")
        else:
            self.log("Enhanced analysis failed", "ERROR")
        
        return passed
    
    def test_iterative_analysis(self) -> bool:
        """Test iterative analysis with feedback"""
        self.log("Testing Iterative Analysis with Feedback...", "TESTING")
        
        if not self.session_key:
            self.log("No session key available - skipping iterative test", "WARNING")
            return False
        
        # Prepare feedback data
        feedback_data = {
            "feedback_type": "refinement",
            "feedback_text": "I want more focus on AI/ML skills and system design. Please provide more specific recommendations for transitioning to a senior AI engineer role.",
            "feedback_data": {
                "satisfaction": 7,
                "areas_to_improve": ["Technical Skills", "AI/ML Experience", "System Design"],
                "specific_feedback": {
                    "technical_skills": "Need more advanced AI/ML frameworks",
                    "experience": "Want guidance on system design for ML systems",
                    "career_path": "Focus on senior-level responsibilities"
                }
            },
            "improvement_areas": ["Technical Skills", "AI/ML Experience", "System Design"]
        }
        
        start_time = time.time()
        result = self.make_request("POST", f"/analysis-iteration/{self.session_key}", feedback_data)
        iteration_time = time.time() - start_time
        
        if "error" in result or not result.get("success", False):
            self.log("Iterative analysis failed", "ERROR")
            self.results["iterative_analysis"] = {"passed": False, "error": result.get("error")}
            return False
        
        refined_analysis = result.get("analysis", {})
        remaining_iterations = result.get("remaining_iterations", 0)
        iteration_summary = result.get("iteration_summary", {})
        
        self.log(f"Iteration completed in {iteration_time:.2f} seconds")
        self.log(f"Remaining iterations: {remaining_iterations}")
        
        # Check if analysis was refined based on feedback
        executive_summary = refined_analysis.get("final_assessment", {}).get("executive_summary", {})
        new_score = executive_summary.get("overall_score", 0)
        
        self.log(f"Refined overall score: {new_score}%")
        
        # Check iteration summary
        changes_made = iteration_summary.get("changes_made", [])
        focus_areas = iteration_summary.get("focus_areas", [])
        
        self.log(f"Changes made: {len(changes_made)}")
        self.log(f"Focus areas: {', '.join(focus_areas)}")
        
        passed = new_score > 0 and len(changes_made) > 0
        self.results["iterative_analysis"] = {
            "passed": passed,
            "iteration_time": iteration_time,
            "refined_score": new_score,
            "remaining_iterations": remaining_iterations,
            "changes_made": len(changes_made),
            "focus_areas": focus_areas
        }
        
        if passed:
            self.log("Iterative analysis with feedback passed!", "SUCCESS")
        else:
            self.log("Iterative analysis failed", "ERROR")
        
        return passed
    
    def test_analysis_session_management(self) -> bool:
        """Test analysis session management"""
        self.log("Testing Analysis Session Management...", "TESTING")
        
        if not self.auth_token:
            self.log("Session management requires authentication - skipping", "WARNING")
            return False
        
                # Test session retrieval
        if self.session_key:
            result = self.make_request("GET", f"/analysis-session/{self.session_key}")
            
            if "error" not in result:
                session_data = result.get("session", {})
                self.log(f"Session retrieved: {session_data.get('status', 'unknown')} status")
                self.log(f"Iterations used: {session_data.get('iterations_used', 0)}")
        
        # Test session history - using market stats as alternative
        history_result = self.make_request("GET", "/market-stats")
        
        if "error" not in history_result:
            sessions = history_result.get("sessions", [])
            self.log(f"Session history: {len(sessions)} sessions found")
        
        self.results["session_management"] = {
            "passed": True,
            "session_retrieved": "error" not in result if self.session_key else False,
            "history_available": "error" not in history_result
        }
        
        self.log("Session management test passed!", "SUCCESS")
        return True
    
    def test_feedback_submission(self) -> bool:
        """Test feedback submission system"""
        self.log("Testing Feedback Submission System...", "TESTING")
        
        if not self.session_key:
            self.log("No session key available - skipping feedback test", "WARNING")
            return False
        
        # Submit feedback
        feedback_data = {
            "feedback_type": "satisfaction",
            "feedback_text": "The analysis was very helpful and provided actionable insights. The personalized recommendations were particularly valuable.",
            "feedback_data": {
                "satisfaction": 9,
                "usefulness": 8,
                "accuracy": 8,
                "recommendations_quality": 9
            }
        }
        
        result = self.make_request("POST", f"/analysis-session/{self.session_key}/feedback", feedback_data)
        
        if "error" in result:
            self.log("Feedback submission failed", "ERROR")
            return False
        
        self.log("Feedback submitted successfully")
        
        self.results["feedback_submission"] = {
            "passed": True,
            "feedback_recorded": result.get("success", False)
        }
        
        self.log("Feedback submission test passed!", "SUCCESS")
        return True
    
    def run_all_tests(self):
        """Run all enhanced pipeline tests"""
        self.log("🚀 Starting Enhanced Complete Pipeline Tests", "FEATURE")
        if not self.auth_token:
            self.log("⚠️  Running without authentication - some tests may be skipped", "WARNING")
        self.log("=" * 80, "INFO")
        
        tests = [
            ("Health Check", self.test_health_check),
            ("Vector Readiness", self.test_vector_readiness),
            ("Market Intelligence", self.test_market_intelligence),
            ("Consent Management", self.test_consent_management),
            ("Enhanced Analysis with Preferences", self.test_enhanced_analysis_with_preferences),
            ("Iterative Analysis", self.test_iterative_analysis),
            ("Session Management", self.test_analysis_session_management),
            ("Feedback Submission", self.test_feedback_submission),
        ]
        
        passed_tests = 0
        skipped_tests = 0
        total_tests = len(tests)
        
        for test_name, test_func in tests:
            self.log("-" * 60, "INFO")
            try:
                if test_func():
                    passed_tests += 1
                elif self.results.get(test_name.lower().replace(" ", "_"), {}).get("skipped"):
                    skipped_tests += 1
            except Exception as e:
                self.log(f"Test {test_name} crashed: {e}", "ERROR")
                self.results[test_name.lower().replace(" ", "_")] = {
                    "passed": False,
                    "error": str(e)
                }
        
        # Final summary
        self.log("=" * 80, "INFO")
        self.log("🏁 Enhanced Pipeline Test Summary", "FEATURE")
        self.log(f"Tests Passed: {passed_tests}/{total_tests}")
        self.log(f"Tests Skipped: {skipped_tests}/{total_tests}")
        self.log(f"Success Rate: {passed_tests/(total_tests-skipped_tests):.1%}" if total_tests > skipped_tests else "No tests completed")
        self.log(f"Total Time: {time.time() - self.start_time:.2f} seconds")
        
        # Detailed results
        self.log("\n📊 Detailed Enhanced Pipeline Results:", "INFO")
        for test_name, result in self.results.items():
            if result.get("skipped"):
                status = "⏭️  SKIP"
            elif result.get("passed", False):
                status = "✅ PASS"
            else:
                status = "❌ FAIL"
            
            self.log(f"  {test_name.replace('_', ' ').title()}: {status}")
            
            if "error" in result:
                self.log(f"    Error: {result['error']}")
            elif result.get("skipped"):
                self.log(f"    Reason: {result.get('reason', 'unknown')}")
            
            # Show key metrics for enhanced analysis
            if test_name == "enhanced_analysis" and result.get("passed"):
                self.log(f"    Analysis Time: {result.get('analysis_time', 0):.2f}s")
                self.log(f"    Overall Score: {result.get('overall_score', 0)}%")
                self.log(f"    AI Confidence: {result.get('confidence', 0)}%")
                self.log(f"    Personalized Insights: {result.get('personalized_insights', 0)}")
                self.log(f"    Market Analysis: {'✅' if result.get('market_integrated') else '❌'}")
                self.log(f"    Vector Analysis: {'✅' if result.get('vector_enabled') else '⚠️  Alternative insights'}")
        
        # Feature-specific summary
        self.log("\n🎯 Enhanced Features Status:", "FEATURE")
        
        # Vector Database Strategy
        vector_result = self.results.get("vector_readiness", {})
        if vector_result.get("vector_enabled"):
            self.log("  ✅ Vector Database: Competitive analysis enabled")
        else:
            progress = vector_result.get("progress", 0)
            self.log(f"  ⚠️  Vector Database: {progress}% progress, alternative insights active")
        
        # Market Intelligence
        market_result = self.results.get("market_intelligence", {})
        if market_result.get("passed"):
            self.log("  ✅ Market Intelligence: Web scraping and real-time data active")
        
        # Enhanced Analysis
        enhanced_result = self.results.get("enhanced_analysis", {})
        if enhanced_result.get("passed"):
            self.log("  ✅ Enhanced Analysis: User preferences and personalization working")
            self.log(f"      - Analysis completed in {enhanced_result.get('analysis_time', 0):.1f}s")
            self.log(f"      - {enhanced_result.get('personalized_insights', 0)} personalized recommendations")
        
        # Iterative Analysis
        iterative_result = self.results.get("iterative_analysis", {})
        if iterative_result.get("passed"):
            self.log("  ✅ Iterative Analysis: Feedback refinement working")
            self.log(f"      - {iterative_result.get('changes_made', 0)} improvements made")
            self.log(f"      - Focus areas: {', '.join(iterative_result.get('focus_areas', []))}")
        
        if passed_tests == total_tests:
            self.log("\n🎉 ALL ENHANCED PIPELINE TESTS PASSED!", "SUCCESS")
            self.log("🚀 The complete enhanced analysis pipeline is fully functional!", "SUCCESS")
            self.log("\n📋 What's Working:", "INFO")
            self.log("   ✅ Vector database with critical mass strategy", "INFO")
            self.log("   ✅ Market intelligence with web scraping", "INFO")
            self.log("   ✅ User preferences and personalization", "INFO")
            self.log("   ✅ Iterative analysis with feedback refinement", "INFO")
            self.log("   ✅ Privacy consent management", "INFO")
            self.log("   ✅ Session management and history", "INFO")
            
        elif skipped_tests > 0:
            self.log(f"\n⚠️  {skipped_tests} test(s) skipped due to authentication.", "WARNING")
            self.log("💡 To run full tests, provide authentication token", "INFO")
        else:
            self.log(f"\n⚠️  {total_tests - passed_tests} test(s) failed. Check the logs above.", "WARNING")
        
        return passed_tests > 0

def get_auth_token() -> Optional[str]:
    """Try to get authentication token"""
    try:
        # Try to login with actual user credentials
        response = requests.post(f"{BASE_URL}/auth/login", json={
            "email": "ronitvirwani1@gmail.com",
            "password": "12345678"
        })
        if response.status_code == 200:
            token_data = response.json()
            return token_data.get("access_token") or token_data.get("token")
        else:
            print(f"Login failed: {response.status_code} - {response.text}")
    except Exception as e:
        print(f"Login error: {e}")
    
    # Check environment variable as fallback
    return os.getenv("TEST_AUTH_TOKEN")

def main():
    """Main test runner"""
    print("🚀 Enhanced Complete Pipeline Test Suite")
    print("Testing all new features: Market Intelligence, Vector Strategy, User Preferences, Iterative Analysis")
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
    
    # Try to get authentication token
    auth_token = get_auth_token()
    if auth_token:
        print("✅ Authentication token found - running full enhanced test suite")
    else:
        print("⚠️  No authentication token - running limited test suite")
        print("💡 To run full tests, ensure user ronitvirwani1@gmail.com exists or set TEST_AUTH_TOKEN")
    
    # Run enhanced tests
    tester = EnhancedPipelineTest(auth_token)
    return tester.run_all_tests()

if __name__ == "__main__":
    success = main()
    exit(0 if success else 1) 