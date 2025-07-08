#!/usr/bin/env python3
"""
Add sample referral data and feedback for testing employee profiles
"""

import sqlite3
import json
from datetime import datetime, timedelta
import random

def add_sample_referrals():
    """Add sample referral data to test employee profiles"""
    
    conn = sqlite3.connect('referralinc.db')
    cursor = conn.cursor()
    
    try:
        # Get employee and candidate IDs
        cursor.execute("SELECT id, name FROM users WHERE role = 'employee'")
        employees = cursor.fetchall()
        
        cursor.execute("SELECT id, name FROM users WHERE role = 'candidate'")
        candidates = cursor.fetchall()
        
        if not employees or not candidates:
            print("❌ No employees or candidates found. Run init_sample_data.py first.")
            return
        
        # Sample referral data
        statuses = ['pending', 'reviewing', 'interview_scheduled', 'interview_completed', 'offer_extended', 'hired', 'rejected']
        companies = ['Tech Solutions Inc.', 'Global Innovations', 'Digital Creations', 'MegaTech Corporation', 'StartupInc']
        positions = ['Software Engineer', 'Senior Software Engineer', 'Product Manager', 'UX Designer', 'Data Scientist', 'DevOps Engineer']
        
        feedback_comments = [
            "Excellent guidance throughout the process. Very responsive and helpful!",
            "Great mentor! Provided valuable insights about the company culture.",
            "Professional and knowledgeable. Helped me prepare for the interview.",
            "Fantastic support! Connected me with the right people in the organization.",
            "Very experienced professional. Gave me tips that made all the difference.",
            "Outstanding mentor. Made the referral process smooth and stress-free.",
            "Highly recommend! Their feedback was spot-on and actionable.",
            "Amazing support from start to finish. Couldn't have done it without them.",
            "Professional and caring. Really went above and beyond to help me.",
            "Excellent communication and follow-up. True professional.",
        ]
        
        # Create referrals for each employee
        referral_id = 1
        for employee_id, employee_name in employees:
            # Create 3-8 referrals per employee
            num_referrals = random.randint(3, 8)
            
            for i in range(num_referrals):
                candidate_id = random.choice(candidates)[0]
                status = random.choice(statuses)
                company = random.choice(companies)
                position = random.choice(positions)
                
                # Create referral date in the past
                days_ago = random.randint(1, 180)
                created_at = (datetime.now() - timedelta(days=days_ago)).isoformat()
                
                # Add feedback for completed referrals (70% chance)
                feedback_score = None
                feedback_comment = None
                if status in ['hired', 'offer_extended', 'rejected', 'interview_completed'] and random.random() < 0.7:
                    feedback_score = random.randint(4, 5) if status in ['hired', 'offer_extended'] else random.randint(3, 5)
                    feedback_comment = random.choice(feedback_comments)
                
                # AI analysis score (mock)
                ai_score = round(random.uniform(0.6, 0.95), 2)
                ai_summary = f"Strong candidate profile with {random.randint(70, 95)}% match for {position} role."
                
                cursor.execute("""
                    INSERT INTO referrals (
                        candidate_id, employee_id, position, company, status,
                        notes, ai_analysis_score, ai_analysis_summary,
                        feedback_score, feedback_comments, created_at, updated_at
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """, (
                    candidate_id,
                    employee_id,
                    position,
                    company,
                    status,
                    f"Referral for {position} position at {company}",
                    ai_score,
                    ai_summary,
                    feedback_score,
                    feedback_comment,
                    created_at,
                    created_at
                ))
                
                referral_id += 1
        
        conn.commit()
        
        # Get statistics
        cursor.execute("SELECT COUNT(*) FROM referrals")
        total_referrals = cursor.fetchone()[0]
        
        cursor.execute("SELECT COUNT(*) FROM referrals WHERE status IN ('hired', 'offer_extended')")
        successful_referrals = cursor.fetchone()[0]
        
        cursor.execute("SELECT COUNT(*) FROM referrals WHERE feedback_comments IS NOT NULL")
        with_feedback = cursor.fetchone()[0]
        
        print(f"✅ Successfully added sample referral data:")
        print(f"   - Total referrals: {total_referrals}")
        print(f"   - Successful referrals: {successful_referrals}")
        print(f"   - Referrals with feedback: {with_feedback}")
        
        # Update user ratings based on feedback
        cursor.execute("""
            UPDATE users SET rating = (
                SELECT AVG(CAST(feedback_score AS FLOAT))
                FROM referrals 
                WHERE employee_id = users.id AND feedback_score IS NOT NULL
            ) WHERE role = 'employee' AND id IN (
                SELECT DISTINCT employee_id FROM referrals WHERE feedback_score IS NOT NULL
            )
        """)
        
        # Update referral counts
        cursor.execute("""
            UPDATE users SET total_referrals = (
                SELECT COUNT(*) FROM referrals WHERE employee_id = users.id
            ) WHERE role = 'employee'
        """)
        
        cursor.execute("""
            UPDATE users SET successful_referrals = (
                SELECT COUNT(*) FROM referrals 
                WHERE employee_id = users.id AND status IN ('hired', 'offer_extended')
            ) WHERE role = 'employee'
        """)
        
        conn.commit()
        print("✅ Updated user ratings and referral counts")
        
    except Exception as e:
        print(f"❌ Error adding sample referrals: {e}")
        conn.rollback()
        raise
    finally:
        conn.close()

if __name__ == "__main__":
    print("🚀 Adding sample referral data...")
    add_sample_referrals()
    print("✨ Sample referral data added successfully!") 