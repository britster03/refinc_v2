#!/usr/bin/env python3
"""
Test OTP functionality with forced environment reload
"""

import asyncio
import os
import sys
import importlib

# Force reload environment
if 'services.email_service' in sys.modules:
    importlib.reload(sys.modules['services.email_service'])
if 'services.otp_service' in sys.modules:
    importlib.reload(sys.modules['services.otp_service'])

from dotenv import load_dotenv
from services.email_service import EmailService
from services.otp_service import OTPService

async def test_otp_with_fresh_config():
    """Test OTP with fresh environment configuration"""
    
    print("🔄 Force reloading environment configuration...")
    
    # Force reload .env file
    load_dotenv(override=True)
    
    print("📧 Current SMTP Configuration:")
    smtp_user = os.getenv("SMTP_USER")
    smtp_host = os.getenv("SMTP_HOST") 
    smtp_port = os.getenv("SMTP_PORT")
    smtp_tls = os.getenv("SMTP_USE_TLS")
    from_email = os.getenv("DEFAULT_FROM_EMAIL")
    from_name = os.getenv("DEFAULT_FROM_NAME")
    
    print(f"   Host: {smtp_host}")
    print(f"   Port: {smtp_port}")
    print(f"   User: {smtp_user}")
    print(f"   TLS: {smtp_tls}")
    print(f"   From Email: {from_email}")
    print(f"   From Name: {from_name}")
    
    print("\n🧪 Testing OTP generation and email sending...")
    
    try:
        # Test OTP generation
        otp_service = OTPService()
        test_email = "rvirwani@binghamton.edu"
        
        # Generate OTP
        otp_result = await otp_service.generate_otp(
            email=test_email,
            purpose="employee_registration",
            user_data={
                "name": "Test Employee",
                "company": "Binghamton University",
                "department": "Computer Science"
            }
        )
        
        if otp_result.success:
            print(f"✅ OTP Generated: {otp_result.message}")
            print(f"   Expires in: {otp_result.expires_in} minutes")
            
            # Check if email was sent
            print(f"📧 Email should be sent to: {test_email}")
            print("   Check your inbox!")
            
        else:
            print(f"❌ OTP Generation Failed: {otp_result.message}")
            
    except Exception as e:
        print(f"💥 Test failed: {str(e)}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(test_otp_with_fresh_config()) 