#!/usr/bin/env python3
"""
Test script for OTP core functionality (without email sending)
"""

import asyncio
import json
from datetime import datetime, timedelta
from database import DatabaseManager

def test_otp_database_operations():
    """Test OTP database operations directly"""
    
    print("🧪 Testing OTP Database Operations...")
    print("-" * 50)
    
    # Test data
    test_email = "test.employee@company.com"
    test_otp = "123456"
    test_user_data = {
        "email": test_email,
        "name": "Test Employee",
        "company": "Test Company Inc.",
        "password": "test123456"
    }
    
    try:
        # Test 1: Insert OTP
        print("💾 Test 1: Inserting OTP into database...")
        expires_at = datetime.utcnow() + timedelta(minutes=10)
        
        DatabaseManager.execute_query(
            """INSERT INTO email_otp_verification 
               (email, otp_code, purpose, expires_at, user_data) 
               VALUES (?, ?, ?, ?, ?)""",
            (test_email, test_otp, "registration", expires_at.isoformat(), 
             json.dumps(test_user_data))
        )
        print("✅ OTP inserted successfully")
        
        # Test 2: Retrieve OTP
        print("\n🔍 Test 2: Retrieving OTP from database...")
        otp_record = DatabaseManager.execute_query(
            """SELECT * FROM email_otp_verification 
               WHERE email = ? AND purpose = ? AND is_used = FALSE 
               ORDER BY created_at DESC LIMIT 1""",
            (test_email, "registration"),
            fetch_one=True
        )
        
        if otp_record:
            print(f"✅ OTP retrieved: {otp_record['otp_code']}")
            print(f"   Email: {otp_record['email']}")
            print(f"   Purpose: {otp_record['purpose']}")
            print(f"   Expires: {otp_record['expires_at']}")
            print(f"   Is used: {otp_record['is_used']}")
            print(f"   Attempts: {otp_record['attempts']}")
        else:
            print("❌ No OTP found in database")
            return
        
        # Test 3: Verify correct OTP
        print("\n✅ Test 3: Verifying correct OTP...")
        if otp_record['otp_code'] == test_otp:
            print("✅ OTP codes match")
            
            # Mark as used
            DatabaseManager.execute_query(
                "UPDATE email_otp_verification SET is_used = TRUE WHERE id = ?",
                (otp_record['id'],)
            )
            print("✅ OTP marked as used")
        else:
            print("❌ OTP codes don't match")
        
        # Test 4: Try to use OTP again
        print("\n❌ Test 4: Checking used OTP status...")
        used_otp_record = DatabaseManager.execute_query(
            """SELECT * FROM email_otp_verification 
               WHERE id = ?""",
            (otp_record['id'],),
            fetch_one=True
        )
        
        if used_otp_record['is_used']:
            print("✅ OTP correctly marked as used")
        else:
            print("❌ OTP not marked as used")
        
        # Test 5: Test user data retrieval
        print("\n📋 Test 5: Testing user data retrieval...")
        if used_otp_record['user_data']:
            retrieved_data = json.loads(used_otp_record['user_data'])
            print(f"✅ User data retrieved: {retrieved_data['name']}")
            print(f"   Email: {retrieved_data['email']}")
            print(f"   Company: {retrieved_data['company']}")
        else:
            print("❌ No user data found")
        
        print("\n" + "=" * 50)
        print("🎉 Core OTP Database Test Completed!")
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

def test_company_email_validation():
    """Test company email validation logic"""
    
    print("\n📧 Testing Company Email Validation...")
    print("-" * 50)
    
    test_cases = [
        ("john.doe@company.com", True, "Valid company email"),
        ("jane@techsolutions.org", True, "Valid company email"),
        ("employee@startup.io", True, "Valid company email"),
        ("user@gmail.com", False, "Personal email (Gmail)"),
        ("person@yahoo.com", False, "Personal email (Yahoo)"),
        ("someone@hotmail.com", False, "Personal email (Hotmail)"),
        ("test@outlook.com", False, "Personal email (Outlook)"),
    ]
    
    common_free_domains = [
        'gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com', 
        'aol.com', 'icloud.com', 'mail.com', 'protonmail.com'
    ]
    
    for email, expected_valid, description in test_cases:
        email_domain = email.split('@')[1].lower()
        is_company_email = email_domain not in common_free_domains
        
        status = "✅" if is_company_email == expected_valid else "❌"
        print(f"{status} {email} - {description}")
    
    print("\n🎉 Email validation test completed!")

if __name__ == "__main__":
    test_otp_database_operations()
    test_company_email_validation() 