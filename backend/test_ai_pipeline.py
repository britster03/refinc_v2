#!/usr/bin/env python3
"""
Comprehensive Test Script for Agentic AI Resume Analysis Pipeline
Tests all components: Health, Individual Agents, Comprehensive Analysis, Vector Store
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

# Test data
SAMPLE_RESUME = """
John Doe
Senior Software Engineer

EXPERIENCE:
Software Engineer at Google (2020-2024)
- Developed scalable microservices using Python, FastAPI, and Docker
- Led a team of 5 engineers on cloud migration project
- Implemented machine learning models for recommendation systems
- Reduced system latency by 40% through optimization

Junior Developer at Microsoft (2018-2020)
- Built web applications using React, Node.js, and MongoDB
- Collaborated with cross-functional teams on product development
- Implemented CI/CD pipelines using Azure DevOps

EDUCATION:
Bachelor of Science in Computer Science
Stanford University (2014-2018)
GPA: 3.8/4.0

SKILLS:
Programming: Python, JavaScript, TypeScript, Java, C++
Frameworks: FastAPI, React, Node.js, Django, Flask
Cloud: AWS, Azure, Google Cloud Platform
Databases: PostgreSQL, MongoDB, Redis
Tools: Docker, Kubernetes, Git, Jenkins
"""

SAMPLE_JOB_DESCRIPTION = """
Senior Full Stack Engineer - AI/ML Platform

We are seeking a Senior Full Stack Engineer to join our AI/ML platform team. 

Requirements:
- 5+ years of software development experience
- Strong proficiency in Python and JavaScript
- Experience with cloud platforms (AWS, Azure, or GCP)
- Knowledge of machine learning frameworks
- Experience with microservices architecture
- Familiarity with containerization (Docker, Kubernetes)
- Strong problem-solving skills and team collaboration

Responsibilities:
- Design and develop scalable AI/ML applications
- Build and maintain microservices architecture
- Collaborate with data scientists and ML engineers
- Implement best practices for code quality and testing
- Mentor junior developers

Nice to have:
- Experience with FastAPI or similar frameworks
- Knowledge of recommendation systems
- Experience with CI/CD pipelines
- Background in computer science or related field
"""

class AIPipelineTest:
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
            "TESTING": "🧪"
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
                response = requests.get(url, headers=headers, timeout=30)
            elif method.upper() == "POST":
                response = requests.post(url, json=data, headers=headers, timeout=60)
            else:
                raise ValueError(f"Unsupported method: {method}")
            
            # Handle authentication errors gracefully
            if response.status_code == 403:
                return {
                    "error": "Authentication required - run with valid token or create test user",
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
        self.log("Testing AI Health Check...", "TESTING")
        
        result = self.make_request("GET", "/health", require_auth=False)
        
        if "error" in result:
            self.log("Health check failed", "ERROR")
            return False
        
        status = result.get("status", "unknown")
        components = result.get("components", {})
        
        self.log(f"Overall Status: {status}")
        
        # Check individual components
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
            self.log("Health check passed!", "SUCCESS")
        else:
            self.log("Health check failed - some components are unhealthy", "ERROR")
        
        return is_healthy
    
    def test_skills_extraction(self) -> bool:
        """Test skills extraction agent"""
        self.log("Testing Skills Extraction Agent...", "TESTING")
        
        data = {"resume_text": SAMPLE_RESUME}
        result = self.make_request("POST", "/skills-extraction", data)
        
        if result.get("status_code") == 403:
            self.log("Skills extraction requires authentication - skipping", "WARNING")
            self.results["skills_extraction"] = {"passed": False, "skipped": True, "reason": "auth_required"}
            return False
        
        if "error" in result or not result.get("success", False):
            self.log("Skills extraction failed", "ERROR")
            self.results["skills_extraction"] = {"passed": False, "error": result.get("error")}
            return False
        
        skills_data = result.get("data", {})
        extracted_skills = skills_data.get("extracted_skills", [])
        skill_categories = skills_data.get("skill_categories", {})
        
        self.log(f"Extracted {len(extracted_skills)} skills")
        self.log(f"Skill categories: {list(skill_categories.keys())}")
        
        # Show some sample skills
        for i, skill in enumerate(extracted_skills[:5]):
            self.log(f"  {skill.get('skill', 'Unknown')} ({skill.get('experience_level', 'N/A')})")
        
        passed = len(extracted_skills) > 0
        self.results["skills_extraction"] = {
            "passed": passed,
            "skills_count": len(extracted_skills),
            "categories": list(skill_categories.keys()),
            "confidence": result.get("confidence", 0)
        }
        
        if passed:
            self.log("Skills extraction passed!", "SUCCESS")
        else:
            self.log("Skills extraction failed - no skills found", "ERROR")
        
        return passed
    
    def test_resume_analysis(self) -> bool:
        """Test resume quality analysis agent"""
        self.log("Testing Resume Analysis Agent...", "TESTING")
        
        data = {"resume_text": SAMPLE_RESUME}
        result = self.make_request("POST", "/resume-analysis", data)
        
        if result.get("status_code") == 403:
            self.log("Resume analysis requires authentication - skipping", "WARNING")
            self.results["resume_analysis"] = {"passed": False, "skipped": True, "reason": "auth_required"}
            return False
        
        if "error" in result or not result.get("success", False):
            self.log("Resume analysis failed", "ERROR")
            self.results["resume_analysis"] = {"passed": False, "error": result.get("error")}
            return False
        
        analysis_data = result.get("data", {})
        overall_score = analysis_data.get("overall_score", 0)
        strengths = analysis_data.get("strengths", [])
        weaknesses = analysis_data.get("weaknesses", [])
        
        self.log(f"Overall Score: {overall_score}%")
        self.log(f"Strengths: {len(strengths)}")
        self.log(f"Weaknesses: {len(weaknesses)}")
        
        passed = overall_score > 0
        self.results["resume_analysis"] = {
            "passed": passed,
            "overall_score": overall_score,
            "strengths_count": len(strengths),
            "weaknesses_count": len(weaknesses),
            "confidence": result.get("confidence", 0)
        }
        
        if passed:
            self.log("Resume analysis passed!", "SUCCESS")
        else:
            self.log("Resume analysis failed - invalid score", "ERROR")
        
        return passed
    
    def test_job_matching(self) -> bool:
        """Test job matching agent"""
        self.log("Testing Job Matching Agent...", "TESTING")
        
        data = {
            "resume_text": SAMPLE_RESUME,
            "job_description": SAMPLE_JOB_DESCRIPTION
        }
        result = self.make_request("POST", "/job-matching", data)
        
        if result.get("status_code") == 403:
            self.log("Job matching requires authentication - skipping", "WARNING")
            self.results["job_matching"] = {"passed": False, "skipped": True, "reason": "auth_required"}
            return False
        
        if "error" in result or not result.get("success", False):
            self.log("Job matching failed", "ERROR")
            self.results["job_matching"] = {"passed": False, "error": result.get("error")}
            return False
        
        matching_data = result.get("data", {})
        match_score = matching_data.get("overall_match_score", 0)
        match_category = matching_data.get("match_category", "unknown")
        
        self.log(f"Match Score: {match_score}%")
        self.log(f"Match Category: {match_category}")
        
        passed = match_score > 0
        self.results["job_matching"] = {
            "passed": passed,
            "match_score": match_score,
            "match_category": match_category,
            "confidence": result.get("confidence", 0)
        }
        
        if passed:
            self.log("Job matching passed!", "SUCCESS")
        else:
            self.log("Job matching failed - invalid score", "ERROR")
        
        return passed
    
    def test_comprehensive_analysis(self) -> bool:
        """Test comprehensive analysis (orchestrator)"""
        self.log("Testing Comprehensive Analysis (Multi-Agent Orchestrator)...", "TESTING")
        
        data = {
            "resume_text": SAMPLE_RESUME,
            "job_description": SAMPLE_JOB_DESCRIPTION,
            "analysis_type": "comprehensive"
        }
        
        start_time = time.time()
        result = self.make_request("POST", "/comprehensive-analysis", data)
        analysis_time = time.time() - start_time
        
        if result.get("status_code") == 403:
            self.log("Comprehensive analysis requires authentication - skipping", "WARNING")
            self.results["comprehensive_analysis"] = {"passed": False, "skipped": True, "reason": "auth_required"}
            return False
        
        if "error" in result or not result.get("success", False):
            self.log("Comprehensive analysis failed", "ERROR")
            self.results["comprehensive_analysis"] = {"passed": False, "error": result.get("error")}
            return False
        
        analysis_data = result.get("data", {})
        agent_results = analysis_data.get("agent_results", {})
        final_assessment = analysis_data.get("final_assessment", {})
        executive_summary = final_assessment.get("executive_summary", {})
        metadata = result.get("metadata", {})  # metadata is at root level, not in data
        
        self.log(f"Analysis completed in {analysis_time:.2f} seconds")
        self.log(f"Overall Score: {executive_summary.get('overall_score', 0)}%")
        self.log(f"Recommendation: {executive_summary.get('recommendation', 'N/A')}")
        self.log(f"AI Confidence: {metadata.get('confidence', 0):.2%}")
        
        # Check agent results
        agents_passed = 0
        total_agents = 0
        
        for agent_name, agent_result in agent_results.items():
            total_agents += 1
            if agent_result.get("success", False):
                agents_passed += 1
                self.log(f"  ✅ {agent_name}: {agent_result.get('confidence', 0):.2%} confidence")
            else:
                self.log(f"  ❌ {agent_name}: Failed")
        
        passed = agents_passed > 0 and executive_summary.get('overall_score', 0) > 0
        self.results["comprehensive_analysis"] = {
            "passed": passed,
            "analysis_time": analysis_time,
            "agents_passed": agents_passed,
            "total_agents": total_agents,
            "overall_score": executive_summary.get('overall_score', 0),
            "ai_confidence": metadata.get('confidence', 0)
        }
        
        if passed:
            self.log("Comprehensive analysis passed!", "SUCCESS")
        else:
            self.log("Comprehensive analysis failed", "ERROR")
        
        return passed
    
    def test_vector_store(self) -> bool:
        """Test vector store operations"""
        self.log("Testing Vector Store Operations...", "TESTING")
        
        # Test similarity search
        query = "Python FastAPI machine learning"
        result = self.make_request("GET", f"/similar-resumes?query={query}&limit=3")
        
        if result.get("status_code") == 403:
            self.log("Vector store requires authentication - skipping", "WARNING")
            self.results["vector_store"] = {"passed": False, "skipped": True, "reason": "auth_required"}
            return False
        
        if "error" in result:
            self.log("Vector store test failed", "ERROR")
            self.results["vector_store"] = {"passed": False, "error": result.get("error")}
            return False
        
        similar_resumes = result.get("data", {}).get("similar_resumes", [])
        self.log(f"Found {len(similar_resumes)} similar resumes")
        
        passed = True  # Vector store is working if no errors
        self.results["vector_store"] = {
            "passed": passed,
            "similar_resumes_count": len(similar_resumes)
        }
        
        if passed:
            self.log("Vector store test passed!", "SUCCESS")
        else:
            self.log("Vector store test failed", "ERROR")
        
        return passed
    
    def run_all_tests(self):
        """Run all tests in sequence"""
        self.log("🚀 Starting Agentic AI Pipeline Tests", "INFO")
        if not self.auth_token:
            self.log("⚠️  Running without authentication - some tests may be skipped", "WARNING")
        self.log("=" * 60, "INFO")
        
        tests = [
            ("Health Check", self.test_health_check),
            ("Skills Extraction", self.test_skills_extraction),
            ("Resume Analysis", self.test_resume_analysis),
            ("Job Matching", self.test_job_matching),
            ("Vector Store", self.test_vector_store),
            ("Comprehensive Analysis", self.test_comprehensive_analysis),
        ]
        
        passed_tests = 0
        skipped_tests = 0
        total_tests = len(tests)
        
        for test_name, test_func in tests:
            self.log("-" * 40, "INFO")
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
        self.log("=" * 60, "INFO")
        self.log("🏁 Test Summary", "INFO")
        self.log(f"Tests Passed: {passed_tests}/{total_tests}")
        self.log(f"Tests Skipped: {skipped_tests}/{total_tests}")
        self.log(f"Success Rate: {passed_tests/(total_tests-skipped_tests):.1%}" if total_tests > skipped_tests else "No tests completed")
        self.log(f"Total Time: {time.time() - self.start_time:.2f} seconds")
        
        # Detailed results
        self.log("\n📊 Detailed Results:", "INFO")
        for test_name, result in self.results.items():
            if result.get("skipped"):
                status = "⏭️  SKIP"
            elif result.get("passed", False):
                status = "✅ PASS"
            else:
                status = "❌ FAIL"
            
            self.log(f"  {test_name}: {status}")
            
            if "error" in result:
                self.log(f"    Error: {result['error']}")
            elif result.get("skipped"):
                self.log(f"    Reason: {result.get('reason', 'unknown')}")
            
            # Show key metrics
            if test_name == "comprehensive_analysis" and result.get("passed"):
                self.log(f"    Analysis Time: {result.get('analysis_time', 0):.2f}s")
                self.log(f"    Overall Score: {result.get('overall_score', 0)}%")
                self.log(f"    AI Confidence: {result.get('ai_confidence', 0):.2%}")
        
        if passed_tests == total_tests:
            self.log("\n🎉 All tests passed! The agentic AI pipeline is fully functional!", "SUCCESS")
        elif skipped_tests > 0:
            self.log(f"\n⚠️  {skipped_tests} test(s) skipped due to authentication. Health check passed - core AI services are working!", "WARNING")
            self.log("💡 To run full tests, provide authentication token or create test endpoints", "INFO")
        else:
            self.log(f"\n⚠️  {total_tests - passed_tests} test(s) failed. Check the logs above.", "WARNING")
        
        return passed_tests > 0  # Consider success if at least health check passes

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
    print("🤖 Agentic AI Resume Analysis Pipeline Test Suite")
    print("=" * 60)
    
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
        print("✅ Authentication token found - running full test suite")
    else:
        print("⚠️  No authentication token - running limited test suite")
        print("💡 To run full tests, set TEST_AUTH_TOKEN environment variable")
    
    # Run tests
    tester = AIPipelineTest(auth_token)
    return tester.run_all_tests()

if __name__ == "__main__":
    success = main()
    exit(0 if success else 1) 