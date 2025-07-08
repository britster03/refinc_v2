#!/usr/bin/env python3
"""
Test script for OTP verification system
"""

import asyncio
import json
from datetime import datetime, timedelta
from services.otp_service import otp_service
from database import DatabaseManager

async def test_otp_system():
    """Test the OTP verification system"""
    
    print("🧪 Testing OTP Verification System...")
    print("-" * 50)
    
    # Test data
    test_email = "test.employee@company.com"
    test_user_data = {
        "email": test_email,
        "name": "Test Employee",
        "company": "Test Company Inc.",
        "password": "test123456",
        "department": "Engineering",
        "position": "Software Developer"
    }
    
    try:
        # Test 1: Send OTP
        print("📧 Test 1: Sending OTP...")
        otp_result = await otp_service.send_otp(
            email=test_email,
            purpose="registration",
            user_data=test_user_data
        )
        
        if otp_result["success"]:
            print(f"✅ OTP sent successfully: {otp_result['message']}")
            print(f"   Expires in: {otp_result.get('expires_in', 'N/A')} seconds")
        else:
            print(f"❌ Failed to send OTP: {otp_result['message']}")
            return
        
        # Test 2: Retrieve the OTP from database (for testing purposes)
        print("\n🔍 Test 2: Retrieving OTP from database...")
        otp_record = DatabaseManager.execute_query(
            """SELECT otp_code, expires_at FROM email_otp_verification 
               WHERE email = ? AND purpose = ? AND is_used = FALSE 
               ORDER BY created_at DESC LIMIT 1""",
            (test_email, "registration"),
            fetch_one=True
        )
        
        if otp_record:
            test_otp = otp_record['otp_code']
            print(f"✅ OTP retrieved: {test_otp}")
            print(f"   Expires at: {otp_record['expires_at']}")
        else:
            print("❌ No OTP found in database")
            return
        
        # Test 3: Verify correct OTP
        print("\n✅ Test 3: Verifying correct OTP...")
        verify_result = await otp_service.verify_otp(
            email=test_email,
            otp_code=test_otp,
            purpose="registration"
        )
        
        if verify_result["success"]:
            print(f"✅ OTP verification successful: {verify_result['message']}")
            print(f"   User data received: {bool(verify_result.get('user_data'))}")
        else:
            print(f"❌ OTP verification failed: {verify_result['message']}")
        
        # Test 4: Try to verify the same OTP again (should fail)
        print("\n❌ Test 4: Verifying used OTP (should fail)...")
        verify_result2 = await otp_service.verify_otp(
            email=test_email,
            otp_code=test_otp,
            purpose="registration"
        )
        
        if not verify_result2["success"]:
            print(f"✅ Used OTP correctly rejected: {verify_result2['message']}")
        else:
            print(f"❌ Used OTP incorrectly accepted: {verify_result2['message']}")
        
        # Test 5: Try wrong OTP
        print("\n❌ Test 5: Verifying wrong OTP (should fail)...")
        wrong_otp_result = await otp_service.verify_otp(
            email=test_email,
            otp_code="000000",
            purpose="registration"
        )
        
        if not wrong_otp_result["success"]:
            print(f"✅ Wrong OTP correctly rejected: {wrong_otp_result['message']}")
        else:
            print(f"❌ Wrong OTP incorrectly accepted: {wrong_otp_result['message']}")
        
        # Test 6: Rate limiting test
        print("\n⏱️ Test 6: Testing rate limiting...")
        rate_limit_result = await otp_service.send_otp(
            email=test_email,
            purpose="registration",
            user_data=test_user_data
        )
        
        if not rate_limit_result["success"] and "wait" in rate_limit_result["message"].lower():
            print(f"✅ Rate limiting working: {rate_limit_result['message']}")
        else:
            print(f"⚠️ Rate limiting result: {rate_limit_result['message']}")
        
        print("\n" + "=" * 50)
        print("🎉 OTP System Test Completed!")
        print("=" * 50)
        
        # Cleanup
        print("\n🧹 Cleaning up test data...")
        DatabaseManager.execute_query(
            "DELETE FROM email_otp_verification WHERE email = ?",
            (test_email,)
        )
        print("✅ Test data cleaned up")
        
    except Exception as e:
        print(f"💥 Test failed with error: {str(e)}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(test_otp_system()) 