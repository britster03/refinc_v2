#!/usr/bin/env python3
"""
Test script for the new GET /api/ai/candidate-matching endpoint
"""

import sys
import os
import asyncio
import json
from datetime import datetime

# Add the backend directory to Python path
sys.path.append(os.path.join(os.path.dirname(__file__), 'backend'))

from fastapi import Request
from fastapi.testclient import TestClient
from main import app
from database import DatabaseManager
from auth_utils import AuthUtils

def test_get_ai_matching():
    """Test the new GET endpoint for AI matching"""
    
    print("🚀 Testing GET /api/ai/candidate-matching endpoint...")
    
    # Create a test client
    client = TestClient(app)
    
    # Get a candidate user from database
    candidates = DatabaseManager.execute_query(
        "SELECT * FROM users WHERE role = 'candidate' LIMIT 1", 
        fetch_all=True
    )
    
    if not candidates:
        print("❌ No candidates found in database")
        return False
    
    candidate = candidates[0]
    print(f"✅ Found test candidate: {candidate['name']} (ID: {candidate['id']})")
    
    # Create an access token for the candidate
    token_data = {
        "sub": str(candidate["id"]),
        "role": candidate["role"],
        "name": candidate["name"]
    }
    access_token = AuthUtils.create_access_token(data=token_data)
    print(f"✅ Created access token for candidate")
    
    # Test the GET endpoint
    headers = {"Authorization": f"Bearer {access_token}"}
    
    print("\n📡 Making GET request to /api/ai/candidate-matching...")
    response = client.get("/api/ai/candidate-matching", headers=headers)
    
    print(f"📊 Response Status: {response.status_code}")
    
    if response.status_code == 200:
        data = response.json()
        print(f"✅ SUCCESS! Got AI matching response")
        print(f"   - Success: {data.get('success')}")
        print(f"   - Matches found: {len(data.get('matches', []))}")
        print(f"   - Total evaluated: {data.get('total_evaluated', 0)}")
        print(f"   - Matching quality: {data.get('matching_quality', 'unknown')}")
        print(f"   - Message: {data.get('message', 'No message')}")
        
        # Show first match details
        matches = data.get('matches', [])
        if matches:
            first_match = matches[0]
            print(f"\n🎯 First match details:")
            print(f"   - Employee: {first_match.get('employee_name')}")
            print(f"   - Position: {first_match.get('employee_position')}")
            print(f"   - Company: {first_match.get('employee_company')}")
            print(f"   - Overall Score: {first_match.get('overall_score')}%")
            print(f"   - Confidence: {first_match.get('confidence_level')}")
            
            # Show score breakdown
            breakdown = first_match.get('score_breakdown', {})
            if breakdown:
                print(f"   - Skills Alignment: {breakdown.get('skills_alignment', 0)}%")
                print(f"   - Career Relevance: {breakdown.get('career_relevance', 0)}%")
                print(f"   - Performance Metrics: {breakdown.get('performance_metrics', 0)}%")
        
        return True
    else:
        print(f"❌ FAILED! Status: {response.status_code}")
        try:
            error_data = response.json()
            print(f"   Error: {error_data.get('detail', 'Unknown error')}")
        except:
            print(f"   Error: {response.text}")
        return False

def test_get_with_params():
    """Test the GET endpoint with query parameters"""
    
    print("\n🚀 Testing GET endpoint with query parameters...")
    
    client = TestClient(app)
    
    # Get a candidate user
    candidates = DatabaseManager.execute_query(
        "SELECT * FROM users WHERE role = 'candidate' LIMIT 1", 
        fetch_all=True
    )
    
    candidate = candidates[0]
    
    # Create access token
    token_data = {
        "sub": str(candidate["id"]),
        "role": candidate["role"],
        "name": candidate["name"]
    }
    access_token = AuthUtils.create_access_token(data=token_data)
    headers = {"Authorization": f"Bearer {access_token}"}
    
    # Test with query parameters
    response = client.get(
        "/api/ai/candidate-matching?max_matches=2&target_company=Google", 
        headers=headers
    )
    
    print(f"📊 Response Status: {response.status_code}")
    
    if response.status_code == 200:
        data = response.json()
        print(f"✅ SUCCESS with parameters!")
        print(f"   - Matches found: {len(data.get('matches', []))}")
        print(f"   - Should be max 2 matches: {len(data.get('matches', [])) <= 2}")
        return True
    else:
        print(f"❌ FAILED with parameters! Status: {response.status_code}")
        return False

if __name__ == "__main__":
    print("=" * 60)
    print("🧪 AI MATCHING GET ENDPOINT TEST")
    print("=" * 60)
    
    try:
        # Test basic GET endpoint
        success1 = test_get_ai_matching()
        
        # Test with parameters
        success2 = test_get_with_params()
        
        print("\n" + "=" * 60)
        if success1 and success2:
            print("🎉 ALL TESTS PASSED! The GET endpoint is working correctly.")
            print("✅ Frontend should now be able to get AI matches automatically.")
        else:
            print("❌ Some tests failed. Check the error messages above.")
        print("=" * 60)
        
    except Exception as e:
        print(f"💥 Test failed with exception: {e}")
        import traceback
        traceback.print_exc() 