#!/usr/bin/env python3
"""
Add test candidate profile data to demonstrate the candidate profile feature
"""

import sqlite3
import json
from datetime import datetime

def add_test_candidate_data():
    conn = sqlite3.connect('referralinc.db')
    cursor = conn.cursor()
    
    try:
        # Get a candidate user ID
        cursor.execute("SELECT id FROM users WHERE role = 'candidate' LIMIT 1")
        result = cursor.fetchone()
        if not result:
            print("No candidate users found!")
            return
        
        candidate_id = result[0]
        print(f"Adding test data for candidate ID: {candidate_id}")
        
        # Add test project
        cursor.execute("""
            INSERT INTO user_projects (user_id, name, description, technologies, impact, start_date, end_date, is_current, url) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            candidate_id,
            'E-commerce Platform',
            'Built a full-stack e-commerce platform with React and Node.js that handles payments and inventory management',
            json.dumps(['React', 'Node.js', 'MongoDB', 'Stripe', 'AWS']),
            'Increased client sales by 40% and reduced cart abandonment by 25%',
            '2023-01-01',
            '2023-06-01',
            0,
            'https://github.com/candidate/ecommerce'
        ))
        
        # Add another current project
        cursor.execute("""
            INSERT INTO user_projects (user_id, name, description, technologies, impact, start_date, is_current, url) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            candidate_id,
            'AI Chat Application',
            'Developing an AI-powered chat application using OpenAI API and React',
            json.dumps(['React', 'TypeScript', 'OpenAI API', 'PostgreSQL', 'Docker']),
            'Currently in beta with 500+ active users',
            '2023-07-01',
            1,
            'https://github.com/candidate/ai-chat'
        ))
        
        # Add education
        cursor.execute("""
            INSERT INTO user_education (user_id, degree, institution, field_of_study, graduation_year, gpa, description)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        """, (
            candidate_id,
            'Bachelor of Science',
            'Stanford University',
            'Computer Science',
            2022,
            3.8,
            'Focused on web development, algorithms, and machine learning. Graduated Magna Cum Laude.'
        ))
        
        # Add Master's degree
        cursor.execute("""
            INSERT INTO user_education (user_id, degree, institution, field_of_study, graduation_year, gpa, description)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        """, (
            candidate_id,
            'Master of Science',
            'MIT',
            'Artificial Intelligence',
            2023,
            3.9,
            'Specialized in machine learning and natural language processing'
        ))
        
        # Add certifications
        cursor.execute("""
            INSERT INTO user_certifications (user_id, name, issuing_organization, issue_date, credential_id, credential_url)
            VALUES (?, ?, ?, ?, ?, ?)
        """, (
            candidate_id,
            'AWS Solutions Architect Associate',
            'Amazon Web Services',
            '2023-03-15',
            'AWS-SAA-123456',
            'https://aws.amazon.com/verification'
        ))
        
        cursor.execute("""
            INSERT INTO user_certifications (user_id, name, issuing_organization, issue_date, expiration_date, credential_id)
            VALUES (?, ?, ?, ?, ?, ?)
        """, (
            candidate_id,
            'Google Cloud Professional Developer',
            'Google Cloud',
            '2023-05-20',
            '2025-05-20',
            'GCP-PD-789012'
        ))
        
        # Add languages
        languages = [
            ('English', 'native'),
            ('Spanish', 'professional'),
            ('French', 'conversational'),
            ('Mandarin', 'basic')
        ]
        
        for language, proficiency in languages:
            cursor.execute("""
                INSERT INTO user_languages (user_id, language, proficiency)
                VALUES (?, ?, ?)
            """, (candidate_id, language, proficiency))
        
        # Add achievements
        achievements = [
            ('Hackathon Winner', 'Won first place in Stanford AI Hackathon', '2022-05-15', 'professional', 'https://stanford.edu/hackathon-winners'),
            ('Open Source Contributor', 'Contributed to React.js core with 50+ merged PRs', '2023-01-10', 'professional', 'https://github.com/facebook/react/contributors'),
            ('Academic Excellence', 'Dean\'s List for 4 consecutive semesters', '2022-06-01', 'education', None),
            ('Community Leader', 'Led coding bootcamp for underrepresented students', '2023-08-01', 'volunteer', None)
        ]
        
        for title, description, date_achieved, category, verification_url in achievements:
            cursor.execute("""
                INSERT INTO user_achievements (user_id, title, description, date_achieved, category, verification_url)
                VALUES (?, ?, ?, ?, ?, ?)
            """, (candidate_id, title, description, date_achieved, category, verification_url))
        
        # Update user profile with better info
        cursor.execute("""
            UPDATE users SET 
                bio = ?,
                skills = ?,
                location = ?,
                position = ?,
                experience_years = ?
            WHERE id = ?
        """, (
            'Passionate full-stack developer with expertise in React, Node.js, and AI technologies. Love building scalable applications that solve real-world problems.',
            json.dumps(['JavaScript', 'TypeScript', 'React', 'Node.js', 'Python', 'MongoDB', 'PostgreSQL', 'AWS', 'Docker', 'Machine Learning']),
            'San Francisco, CA',
            'Senior Full Stack Developer',
            3,
            candidate_id
        ))
        
        conn.commit()
        print("Test candidate profile data added successfully!")
        
    except Exception as e:
        conn.rollback()
        print(f"Error adding test data: {e}")
    finally:
        conn.close()

if __name__ == "__main__":
    add_test_candidate_data() 