#!/usr/bin/env python3
"""
Debug script for comprehensive analysis endpoint
"""

import requests
import json
import logging
from datetime import datetime

# Set up logging
logging.basicConfig(level=logging.INFO, format='[%(asctime)s] %(levelname)s %(message)s', datefmt='%H:%M:%S')
logger = logging.getLogger(__name__)

# Configuration
BASE_URL = "http://localhost:8000"
AUTH_TOKEN = None

def authenticate():
    """Authenticate and get token"""
    global AUTH_TOKEN
    
    try:
        response = requests.post(f"{BASE_URL}/auth/login", json={
            "email": "ronitvirwani1@gmail.com",
            "password": "12345678"
        })
        
        if response.status_code == 200:
            AUTH_TOKEN = response.json()["access_token"]
            logger.info("✅ Authentication successful")
            return True
        else:
            logger.error(f"❌ Authentication failed: {response.status_code}")
            return False
    except Exception as e:
        logger.error(f"❌ Authentication error: {str(e)}")
        return False

def test_comprehensive_analysis():
    """Test comprehensive analysis with detailed error reporting"""
    
    if not AUTH_TOKEN:
        logger.error("❌ No authentication token available")
        return False
    
    headers = {"Authorization": f"Bearer {AUTH_TOKEN}"}
    
    # Sample data
    payload = {
        "resume_text": """
        John Doe
        Software Engineer
        
        EXPERIENCE:
        Software Engineer at Google (2020-2024)
        - Developed scalable microservices using Python and FastAPI
        - Led a team of 5 engineers on cloud migration projects
        - Implemented machine learning models for recommendation systems
        - Reduced system latency by 40% through optimization
        
        Junior Developer at Microsoft (2018-2020)
        - Built web applications using JavaScript, React, and Node.js
        - Collaborated with cross-functional teams on product development
        - Implemented CI/CD pipelines using Azure DevOps
        
        EDUCATION:
        Bachelor of Science in Computer Science
        Stanford University (2014-2018)
        
        SKILLS:
        Python, JavaScript, TypeScript, Java, C++
        FastAPI, React, Node.js, Django, Flask
        PostgreSQL, MongoDB, Redis
        AWS, Azure, Google Cloud Platform
        Docker, Kubernetes, Git, Jenkins
        """,
        "job_description": """
        Senior Software Engineer - AI/ML Platform
        
        We are looking for a Senior Software Engineer to join our AI/ML platform team.
        
        Requirements:
        - 5+ years of software development experience
        - Strong proficiency in Python and JavaScript
        - Experience with microservices architecture
        - Cloud platform experience (AWS, GCP, or Azure)
        - Machine learning experience preferred
        - Leadership experience preferred
        
        Responsibilities:
        - Design and develop scalable AI/ML infrastructure
        - Lead technical initiatives and mentor junior developers
        - Collaborate with data scientists and product teams
        - Optimize system performance and reliability
        """
    }
    
    try:
        logger.info("🧪 Testing comprehensive analysis...")
        
        response = requests.post(
            f"{BASE_URL}/api/ai/comprehensive-analysis",
            json=payload,
            headers=headers,
            timeout=60
        )
        
        logger.info(f"Response Status: {response.status_code}")
        logger.info(f"Response Headers: {dict(response.headers)}")
        
        if response.status_code == 200:
            result = response.json()
            logger.info("✅ Comprehensive analysis successful!")
            
            # Extract key information
            if result.get("success"):
                data = result.get("data", {})
                final_assessment = data.get("final_assessment", {})
                executive_summary = final_assessment.get("executive_summary", {})
                
                logger.info(f"Overall Score: {executive_summary.get('overall_score', 'N/A')}")
                logger.info(f"Recommendation: {executive_summary.get('recommendation', 'N/A')}")
                logger.info(f"Confidence: {result.get('metadata', {}).get('confidence', 'N/A')}")
                
                # Check agent results
                agent_results = data.get("agent_results", {})
                for agent, result in agent_results.items():
                    status = "✅" if result.get("success") else "❌"
                    confidence = result.get("confidence", 0) * 100
                    logger.info(f"  {status} {agent}: {confidence:.1f}% confidence")
                
                return True
            else:
                logger.error(f"❌ Analysis failed: {result.get('error', 'Unknown error')}")
                return False
        else:
            logger.error(f"❌ Request failed with status {response.status_code}")
            try:
                error_detail = response.json()
                logger.error(f"Error details: {json.dumps(error_detail, indent=2)}")
            except:
                logger.error(f"Raw response: {response.text}")
            return False
            
    except requests.exceptions.Timeout:
        logger.error("❌ Request timed out after 60 seconds")
        return False
    except Exception as e:
        logger.error(f"❌ Comprehensive analysis error: {str(e)}")
        return False

def main():
    """Main debug function"""
    logger.info("🔍 Debugging Comprehensive Analysis")
    logger.info("=" * 50)
    
    # Test authentication
    if not authenticate():
        logger.error("Cannot proceed without authentication")
        return
    
    # Test comprehensive analysis
    success = test_comprehensive_analysis()
    
    logger.info("=" * 50)
    if success:
        logger.info("🎉 Debug completed successfully!")
    else:
        logger.info("⚠️ Debug found issues that need attention")

if __name__ == "__main__":
    main() 