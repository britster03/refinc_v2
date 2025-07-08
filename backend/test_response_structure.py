#!/usr/bin/env python3
"""
Test script to show exact response structure from comprehensive analysis
"""

import requests
import json

# Configuration
BASE_URL = "http://localhost:8000"

def get_auth_token():
    """Get authentication token"""
    response = requests.post(f"{BASE_URL}/auth/login", json={
        "email": "ronitvirwani1@gmail.com",
        "password": "12345678"
    })
    return response.json()["access_token"]

def test_structure():
    """Test and print exact response structure"""
    token = get_auth_token()
    headers = {"Authorization": f"Bearer {token}"}
    
    payload = {
        "resume_text": "John Doe\nSoftware Engineer\nPython, JavaScript, React\n5 years experience"
    }
    
    response = requests.post(
        f"{BASE_URL}/api/ai/comprehensive-analysis",
        json=payload,
        headers=headers
    )
    
    if response.status_code == 200:
        result = response.json()
        print("=== EXACT RESPONSE STRUCTURE ===")
        print(json.dumps(result, indent=2))
        print("\n=== KEY PATHS ===")
        print(f"result.success: {result.get('success')}")
        print(f"result.data keys: {list(result.get('data', {}).keys())}")
        
        data = result.get('data', {})
        print(f"data.final_assessment keys: {list(data.get('final_assessment', {}).keys())}")
        
        final_assessment = data.get('final_assessment', {})
        print(f"final_assessment.overall_score: {final_assessment.get('overall_score')}")
        print(f"final_assessment.key_strengths: {final_assessment.get('key_strengths')}")
        print(f"final_assessment.areas_for_improvement: {final_assessment.get('areas_for_improvement')}")
        
        metadata = data.get('metadata', {})
        print(f"data.metadata: {metadata}")
        
        # Check if there's also metadata at the root level
        root_metadata = result.get('metadata', {})
        print(f"root metadata: {root_metadata}")
        
    else:
        print(f"Error: {response.status_code} - {response.text}")

if __name__ == "__main__":
    test_structure() 