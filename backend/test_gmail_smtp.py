#!/usr/bin/env python3
"""
Quick Gmail SMTP test script
"""

import asyncio
import os
from dotenv import load_dotenv
from services.email_service import EmailService, EmailTemplate

async def test_gmail_smtp():
    """Test Gmail SMTP configuration"""
    
    print("🧪 Testing Gmail SMTP Configuration...")
    print("-" * 50)
    
    # Load environment variables
    load_dotenv()
    
    # Check configuration
    smtp_host = os.getenv("SMTP_HOST")
    smtp_port = os.getenv("SMTP_PORT")
    smtp_user = os.getenv("SMTP_USER") or os.getenv("SMTP_USERNAME")
    smtp_password = os.getenv("SMTP_PASSWORD")
    
    print(f"📧 SMTP Host: {smtp_host}")
    print(f"🔌 SMTP Port: {smtp_port}")
    print(f"👤 SMTP User: {smtp_user}")
    print(f"🔑 Password: {'***' + smtp_password[-4:] if smtp_password and len(smtp_password) > 4 else 'Not set'}")
    
    if not all([smtp_host, smtp_port, smtp_user, smtp_password]):
        print("❌ Missing SMTP configuration!")
        return
    
    # Test email sending
    print("\n📬 Sending test email...")
    
    email_service = EmailService()
    
    # Use a simple test email
    test_email = smtp_user  # Send to yourself for testing
    
    try:
        result = await email_service.send_email(
            to_email=test_email,
            subject="✅ SMTP Test - ReferralInc",
            template=EmailTemplate.OTP_VERIFICATION,
            template_data={
                "otp_code": "123456",
                "expires_in": 10,
                "name": "Test User",
                "company": "Test Company"
            }
        )
        
        if result["success"]:
            print(f"✅ Email sent successfully!")
            print(f"   Provider: {result.get('provider', 'Unknown')}")
            print(f"   Message ID: {result.get('message_id', 'N/A')}")
            print(f"   📱 Check your inbox at {test_email}")
        else:
            print(f"❌ Email failed to send:")
            print(f"   Error: {result.get('error', 'Unknown error')}")
            
    except Exception as e:
        print(f"💥 Test failed: {str(e)}")
        
        # Provide specific help for common Gmail errors
        error_str = str(e).lower()
        if "username and password not accepted" in error_str:
            print("\n🔧 Gmail Authentication Fix:")
            print("   1. Enable 2-Factor Authentication in Google Account")
            print("   2. Generate App Password at: https://myaccount.google.com/apppasswords")
            print("   3. Use the 16-character App Password (not your regular password)")
        elif "connection" in error_str:
            print("\n🔧 Connection Fix:")
            print("   1. Check your internet connection")
            print("   2. Verify SMTP_HOST=smtp.gmail.com and SMTP_PORT=587")
        
    print("\n" + "=" * 50)

if __name__ == "__main__":
    asyncio.run(test_gmail_smtp()) 