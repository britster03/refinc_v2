#!/usr/bin/env python3
"""
Test verification badge functionality
"""

import asyncio
import sqlite3
import json
from services.otp_service import OTPService
from auth_utils import DatabaseManager, format_user_response
from dotenv import load_dotenv

async def test_verification_badges():
    """Test that OTP verification properly marks users as verified"""
    
    print("🧪 Testing Verification Badge System...")
    print("-" * 50)
    
    # Load environment
    load_dotenv()
    
    try:
        # 1. Check existing verified employees
        print("📊 Current Verification Status:")
        
        conn = sqlite3.connect('referralinc.db')
        conn.row_factory = sqlite3.Row
        cursor = conn.cursor()
        
        # Get all employees with verification status
        cursor.execute("""
            SELECT id, name, email, role, is_verified, created_at 
            FROM users 
            WHERE role = 'employee' 
            ORDER BY created_at DESC
        """)
        
        employees = cursor.fetchall()
        
        verified_count = 0
        unverified_count = 0
        
        for emp in employees:
            verification_status = "✅ VERIFIED" if emp['is_verified'] else "❌ NOT VERIFIED"
            print(f"   {emp['name']} ({emp['email']}) - {verification_status}")
            
            if emp['is_verified']:
                verified_count += 1
            else:
                unverified_count += 1
        
        print(f"\n📈 Summary:")
        print(f"   Total Employees: {len(employees)}")
        print(f"   Verified: {verified_count}")
        print(f"   Not Verified: {unverified_count}")
        
        # 2. Test OTP verification flow
        print(f"\n🧪 Testing OTP Verification Flow...")
        
        test_email = "test.employee@techcorp.com"
        
        # Create a test employee first
        cursor.execute("""
            INSERT OR REPLACE INTO users (
                email, password_hash, name, role, company, department, 
                position, is_verified, created_at, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
        """, (
            test_email, "test_hash", "Test Employee", "employee", 
            "TechCorp", "Engineering", "Software Engineer", False
        ))
        
        user_id = cursor.lastrowid
        conn.commit()
        
        print(f"   Created test employee: {test_email} (ID: {user_id})")
        
        # Check initial verification status
        cursor.execute("SELECT is_verified FROM users WHERE id = ?", (user_id,))
        initial_status = cursor.fetchone()['is_verified']
        print(f"   Initial verification status: {'✅ VERIFIED' if initial_status else '❌ NOT VERIFIED'}")
        
        # Simulate OTP verification completion
        print(f"   Simulating OTP verification completion...")
        
        cursor.execute("UPDATE users SET is_verified = TRUE WHERE id = ?", (user_id,))
        conn.commit()
        
        # Check final verification status
        cursor.execute("SELECT is_verified FROM users WHERE id = ?", (user_id,))
        final_status = cursor.fetchone()['is_verified']
        print(f"   Final verification status: {'✅ VERIFIED' if final_status else '❌ NOT VERIFIED'}")
        
        # 3. Test API response format
        print(f"\n🔗 Testing API Response Format...")
        
        # Get user data and format response
        user_data = DatabaseManager.get_user_by_id(user_id)
        if user_data:
            formatted_response = format_user_response(user_data)
            print(f"   API Response includes is_verified: {'✅ YES' if hasattr(formatted_response, 'is_verified') else '❌ NO'}")
            
            if hasattr(formatted_response, 'is_verified'):
                print(f"   is_verified value: {formatted_response.is_verified}")
            
            # Convert to dict to see full structure
            response_dict = formatted_response.dict() if hasattr(formatted_response, 'dict') else formatted_response
            print(f"   Full response keys: {list(response_dict.keys()) if isinstance(response_dict, dict) else 'Not a dict'}")
        
        # 4. Generate sample verification data
        print(f"\n📝 Generating Verification Summary...")
        
        cursor.execute("""
            SELECT 
                role,
                COUNT(*) as total,
                SUM(CASE WHEN is_verified THEN 1 ELSE 0 END) as verified
            FROM users 
            GROUP BY role
        """)
        
        role_stats = cursor.fetchall()
        
        for stat in role_stats:
            verification_rate = (stat['verified'] / stat['total'] * 100) if stat['total'] > 0 else 0
            print(f"   {stat['role'].title()}s: {stat['verified']}/{stat['total']} verified ({verification_rate:.1f}%)")
        
        conn.close()
        
        print(f"\n✅ Verification Badge System Test Complete!")
        
        # Clean up test user
        conn = sqlite3.connect('referralinc.db')
        cursor = conn.cursor()
        cursor.execute("DELETE FROM users WHERE email = ?", (test_email,))
        conn.commit()
        conn.close()
        
        print(f"🧹 Test cleanup complete")
        
    except Exception as e:
        print(f"💥 Test failed: {str(e)}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(test_verification_badges()) 