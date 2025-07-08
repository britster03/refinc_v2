#!/usr/bin/env python3
import requests
import json
import time
import sqlite3

def test_logout():
    base_url = "http://localhost:8000"
    
    # Login first
    login_response = requests.post(f"{base_url}/auth/login", json={
        "email": "candidate@example.com",
        "password": "password123"
    })
    
    if login_response.status_code != 200:
        print(f"Login failed: {login_response.text}")
        return
    
    login_data = login_response.json()
    access_token = login_data["access_token"]
    refresh_token = login_data["refresh_token"]
    user_id = login_data["user"]["id"]
    
    print(f"✅ Logged in successfully as user {user_id}")
    
    # Make a heartbeat call to ensure we're active
    me_response = requests.get(f"{base_url}/auth/me", headers={
        "Authorization": f"Bearer {access_token}",
        "Content-Type": "application/json"
    })
    
    if me_response.status_code == 200:
        print("✅ Heartbeat successful")
    else:
        print(f"❌ Heartbeat failed: {me_response.text}")
        return
    
    # Check activity before logout
    print("\n📊 Activity before logout:")
    check_user_activity(user_id)
    
    # Now logout
    logout_response = requests.post(f"{base_url}/auth/logout", 
        headers={
            "Authorization": f"Bearer {access_token}",
            "Content-Type": "application/json"
        },
        json={"refresh_token": refresh_token}
    )
    
    if logout_response.status_code == 200:
        print("✅ Logout successful")
    else:
        print(f"❌ Logout failed: {logout_response.text}")
        return
    
    # Check activity after logout
    print("\n📊 Activity after logout:")
    check_user_activity(user_id)
    
    # Try to use the token after logout (should fail)
    me_response_after = requests.get(f"{base_url}/auth/me", headers={
        "Authorization": f"Bearer {access_token}",
        "Content-Type": "application/json"
    })
    
    if me_response_after.status_code == 401:
        print("✅ Token properly invalidated after logout")
    else:
        print(f"❌ Token still valid after logout: {me_response_after.status_code}")

def check_user_activity(user_id):
    """Check the most recent activity for a user"""
    try:
        conn = sqlite3.connect('backend/referralinc.db')
        cursor = conn.cursor()
        
        # Get most recent activity
        cursor.execute("""
            SELECT activity_type, created_at, activity_data 
            FROM user_activity_logs 
            WHERE user_id = ? 
            ORDER BY created_at DESC 
            LIMIT 3
        """, (user_id,))
        
        activities = cursor.fetchall()
        
        for i, activity in enumerate(activities):
            print(f"  {i+1}. {activity[0]} at {activity[1]}")
        
        conn.close()
        
    except Exception as e:
        print(f"Error checking activity: {e}")

if __name__ == "__main__":
    test_logout() 