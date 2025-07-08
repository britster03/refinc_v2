#!/usr/bin/env python3
"""
Test script for Advanced AI Candidate-Employee Matching

This script demonstrates the state-of-the-art AI matching system
that uses only real data and LLM reasoning for optimal referrals.
"""

import asyncio
import json
import os
import sys
from pathlib import Path
from dotenv import load_dotenv

# Load environment variables from backend/.env
backend_dir = Path(__file__).parent / "backend"
env_path = backend_dir / ".env"
load_dotenv(env_path)

# Add backend to path
sys.path.append(str(backend_dir))

# Set correct database path using absolute path
os.environ['DATABASE_URL'] = str(backend_dir / "referralinc.db")

from database import DatabaseManager, init_db
from ai_agents.candidate_matching_agent import CandidateMatchingAgent
import groq

async def test_ai_matching():
    """Test the sophisticated AI matching system"""
    print("🧠 Testing Advanced AI Candidate-Employee Matching System")
    print("=" * 60)
    
    # Change to backend directory to use the correct database
    original_dir = os.getcwd()
    os.chdir(backend_dir)
    
    try:
        # Initialize database
        init_db()
        
        # Get a sample candidate from the database
        candidates = DatabaseManager.execute_query(
            "SELECT * FROM users WHERE role = 'candidate' LIMIT 1",
            fetch_all=True
        )
        
        if not candidates:
            print("❌ No candidates found in database")
            print("💡 Please run init_sample_data.py first to create test data")
            return
        
        candidate = candidates[0]
        
        # Parse candidate skills
        candidate_skills = []
        if candidate.get('skills'):
            try:
                candidate_skills = json.loads(candidate['skills'])
            except:
                candidate_skills = []
        
        # Prepare candidate profile
        candidate_profile = {
            "id": candidate["id"],
            "name": candidate["name"],
            "email": candidate["email"],
            "position": candidate.get("position", ""),
            "company": candidate.get("company", ""),
            "department": candidate.get("department", ""),
            "bio": candidate.get("bio", ""),
            "skills": candidate_skills,
            "experience_years": candidate.get("experience_years", 0),
            "location": candidate.get("location", ""),
            "is_verified": candidate.get("is_verified", False),
            "created_at": candidate.get("created_at"),
            "updated_at": candidate.get("updated_at")
        }
        
        print(f"🎯 Testing AI matching for candidate:")
        print(f"   Name: {candidate_profile['name']}")
        print(f"   Skills: {', '.join(candidate_skills)}")
        print(f"   Position: {candidate_profile['position']}")
        print(f"   Experience: {candidate_profile['experience_years']} years")
        print()
        print(f"📋 Candidate profile debug:")
        for key, value in candidate_profile.items():
            print(f"   {key}: {value} (type: {type(value)})")
        print()
        
        # Get all employees
        employees = DatabaseManager.execute_query(
            "SELECT * FROM users WHERE role = 'employee' AND is_active = TRUE",
            fetch_all=True
        )
        
        if not employees:
            print("❌ No employees found in database")
            return
        
        # Prepare employee pool
        employee_pool = []
        for emp in employees:
            emp_skills = []
            if emp.get('skills'):
                try:
                    emp_skills = json.loads(emp['skills'])
                except:
                    emp_skills = []
            
            employee_profile = {
                "id": emp["id"],
                "name": emp["name"],
                "email": emp["email"],
                "position": emp.get("position", ""),
                "company": emp.get("company", ""),
                "department": emp.get("department", ""),
                "bio": emp.get("bio", ""),
                "skills": emp_skills,
                "experience_years": emp.get("experience_years", 0),
                "location": emp.get("location", ""),
                "rating": emp.get("rating", 0.0),
                "total_referrals": emp.get("total_referrals", 0),
                "successful_referrals": emp.get("successful_referrals", 0),
                "is_verified": emp.get("is_verified", False),
                "is_active": emp.get("is_active", True),
                "created_at": emp.get("created_at"),
                "updated_at": emp.get("updated_at")
            }
            employee_pool.append(employee_profile)
        
        print(f"📊 Found {len(employee_pool)} employees for analysis")
        print()
        
        # Initialize AI matching agent
        groq_api_key = os.getenv("GROQ_API_KEY")
        if not groq_api_key:
            print("⚠️  GROQ_API_KEY not found in environment variables")
            print("💡 The system will still work but without LLM enhancements")
            groq_client = None
        else:
            groq_client = groq.Groq(api_key=groq_api_key)
            print("✅ GROQ API client initialized")
        
        matching_agent = CandidateMatchingAgent(groq_client)
        print("🤖 Advanced AI Matching Agent initialized")
        print()
        
        # Perform sophisticated matching
        print("🔄 Running state-of-the-art AI matching algorithm...")
        print("   - Skills & Expertise Alignment (35%)")
        print("   - Career Path & Experience Relevance (25%)")
        print("   - Performance & Success Metrics (20%)")
        print("   - Availability & Engagement (15%)")
        print("   - Bias Neutrality (5%)")
        print()
        
        result = await matching_agent.match_candidate_with_employees(
            candidate_data=candidate_profile,
            employee_pool=employee_pool,
            max_matches=3
        )
        
        if result.success:
            print("🎉 AI Matching Completed Successfully!")
            print("=" * 60)
            
            matches = result.data.get("matches", [])
            summary = result.data.get("summary", {})
            
            # Debug: Check if LLM insights are present
            print("🔍 Debug: Checking LLM insights...")
            for i, match in enumerate(matches):
                llm_insights = match.get('llm_insights')
                if llm_insights:
                    print(f"   Match {i+1}: LLM insights found - {type(llm_insights)}")
                    print(f"   Content: {llm_insights}")
                else:
                    print(f"   Match {i+1}: No LLM insights found")
            print()
            
            print(f"📈 Matching Summary:")
            print(f"   Total Evaluated: {summary.get('total_evaluated', 0)} employees")
            print(f"   Average Score: {summary.get('average_score', 0):.1f}")
            print(f"   Top Score: {summary.get('top_score', 0):.1f}")
            print(f"   Quality Distribution:")
            dist = summary.get('quality_distribution', {})
            print(f"     - Excellent (80+): {dist.get('excellent', 0)}")
            print(f"     - Good (60-79): {dist.get('good', 0)}")
            print(f"     - Fair (40-59): {dist.get('fair', 0)}")
            print()
            
            print(f"🏆 Top {len(matches)} AI-Matched Employees:")
            print("=" * 60)
            
            for i, match in enumerate(matches, 1):
                print(f"{i}. {match['employee_name']}")
                print(f"   Position: {match['employee_position']}")
                print(f"   Company: {match['employee_company']}")
                print(f"   🎯 Overall Match Score: {match['overall_score']:.1f}%")
                print(f"   🔍 Confidence Level: {match['confidence_level']:.1%}")
                print(f"   📊 Score Breakdown:")
                breakdown = match['score_breakdown']
                print(f"     - Skills Alignment: {breakdown['skills_alignment']:.1f}")
                print(f"     - Career Relevance: {breakdown['career_relevance']:.1f}")
                print(f"     - Performance Metrics: {breakdown['performance_metrics']:.1f}")
                print(f"     - Engagement Score: {breakdown['engagement_score']:.1f}")
                
                # Show detailed analysis
                analysis = match.get('detailed_analysis', {})
                skills_overlap = analysis.get('skills_overlap', {})
                if skills_overlap.get('overlapping_skills'):
                    print(f"   🔗 Overlapping Skills: {', '.join(skills_overlap['overlapping_skills'])}")
                
                success_indicators = analysis.get('success_indicators', {})
                if success_indicators.get('success_rate'):
                    print(f"   ✅ Success Rate: {success_indicators['success_rate']}%")
                
                # Show LLM insights if available
                llm_insights = match.get('llm_insights')
                if llm_insights:
                    actionable = llm_insights.get('actionable_insights', {})
                    if actionable.get('why_this_match'):
                        print(f"   💡 Why This Match: {actionable['why_this_match']}")
                
                print()
            
            # Show success patterns if available
            patterns = summary.get('success_patterns', [])
            if patterns:
                print("🔍 Identified Success Patterns:")
                for pattern in patterns:
                    print(f"   • {pattern}")
                print()
            
            print("✨ State-of-the-Art AI Matching Complete!")
            print("🎯 Focus: Optimal referral success probability")
            print("⚖️  Approach: Completely unbiased and data-driven")
            print("🧠 Technology: Advanced LLM reasoning + semantic analysis")
            
        else:
            print(f"❌ Matching failed: {result.error}")
            
    except Exception as e:
        print(f"❌ Error during AI matching: {str(e)}")
        import traceback
        traceback.print_exc()
    
    finally:
        # Restore original directory
        os.chdir(original_dir)

if __name__ == "__main__":
    asyncio.run(test_ai_matching()) 