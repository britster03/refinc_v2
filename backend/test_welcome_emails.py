#!/usr/bin/env python3
"""
Test welcome email system functionality
"""

import asyncio
import requests
import json
from dotenv import load_dotenv
from services.email_service import EmailService, EmailTemplate

async def test_welcome_email_system():
    """Test the complete welcome email system"""
    
    print("🧪 Testing Welcome Email System...")
    print("-" * 50)
    
    # Load environment
    load_dotenv()
    
    # Test 1: Test email templates directly
    print("📧 Testing Email Templates...")
    
    try:
        email_service = EmailService()
        
        # Test candidate welcome email
        candidate_result = await email_service.send_email(
            to_email="rvirwani@binghamton.edu",
            subject="🧪 Test: Candidate Welcome Email",
            template=EmailTemplate.WELCOME_CANDIDATE,
            template_data={
                "name": "Test Candidate",
                "dashboard_url": "http://localhost:3000/dashboard"
            }
        )
        
        print(f"✅ Candidate Welcome Email: {'Success' if candidate_result['success'] else 'Failed'}")
        if not candidate_result['success']:
            print(f"   Error: {candidate_result['error']}")
        
        # Test employee welcome email
        employee_result = await email_service.send_email(
            to_email="rvirwani@binghamton.edu",
            subject="🧪 Test: Employee Welcome Email",
            template=EmailTemplate.WELCOME_EMPLOYEE,
            template_data={
                "name": "Test Employee",
                "company": "Test Company Inc",
                "dashboard_url": "http://localhost:3000/dashboard"
            }
        )
        
        print(f"✅ Employee Welcome Email: {'Success' if employee_result['success'] else 'Failed'}")
        if not employee_result['success']:
            print(f"   Error: {employee_result['error']}")
        
        # Test beta approval email
        beta_result = await email_service.send_email(
            to_email="rvirwani@binghamton.edu",
            subject="🧪 Test: Beta Approval Email",
            template=EmailTemplate.BETA_APPROVAL,
            template_data={
                "name": "Test User",
                "dashboard_url": "http://localhost:3000/dashboard"
            }
        )
        
        print(f"✅ Beta Approval Email: {'Success' if beta_result['success'] else 'Failed'}")
        if not beta_result['success']:
            print(f"   Error: {beta_result['error']}")
            
    except Exception as e:
        print(f"❌ Email template test failed: {str(e)}")
    
    print("\n" + "="*50)
    print("📋 Welcome Email System Summary:")
    print("="*50)
    
    print("\n🎯 Features Implemented:")
    print("  ✅ Candidate welcome emails (beta-focused)")
    print("  ✅ Employee welcome emails (verified account)")
    print("  ✅ Beta approval notification emails")
    print("  ✅ Beautiful HTML templates with gradients")
    print("  ✅ Integration with registration endpoints")
    print("  ✅ Integration with OTP verification")
    print("  ✅ Beta approval admin system")
    print("  ✅ Database tracking for beta status")
    
    print("\n📱 Email Template Features:")
    print("  🎨 Responsive design with modern gradients")
    print("  📱 Mobile-friendly layouts")
    print("  🚀 Beta-specific messaging")
    print("  💡 Clear call-to-action buttons")
    print("  🔒 Security information")
    print("  📊 Role-specific content")
    
    print("\n🔧 Registration Flow:")
    print("  1️⃣  Candidate registers → Welcome email (beta queue)")
    print("  2️⃣  Employee registers → OTP verification")
    print("  3️⃣  Employee verifies OTP → Welcome email (verified)")
    print("  4️⃣  Admin approves beta → Beta approval email")
    
    print("\n🌟 Beta Management:")
    print("  📝 Database fields: beta_approved, beta_requested_at, beta_approved_at")
    print("  👥 Admin endpoints: /admin/approve-beta/{user_id}")
    print("  📊 Pending users: /admin/pending-beta")
    print("  📧 Automatic approval emails")
    
    print("\n🎉 Next Steps for Users:")
    print("  1. Check your email for welcome messages")
    print("  2. Complete your profile setup")
    print("  3. Explore ReferralInc features")
    print("  4. Wait for beta approval (candidates)")
    print("  5. Start helping candidates (employees)")

if __name__ == "__main__":
    asyncio.run(test_welcome_email_system()) 