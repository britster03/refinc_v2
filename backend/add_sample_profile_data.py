#!/usr/bin/env python3
"""
Add sample profile data for testing production-ready employee profiles
"""

import sqlite3
import json
from datetime import datetime, timedelta
import random

def add_sample_profile_data():
    """Add sample projects, education, certifications, etc. for employees"""
    
    conn = sqlite3.connect('referralinc.db')
    cursor = conn.cursor()
    
    try:
        # Initialize the new tables first
        print("🔄 Initializing new database tables...")
        from database import init_db
        init_db()
        
        # Get employee IDs
        cursor.execute("SELECT id, name, company, department FROM users WHERE role = 'employee'")
        employees = cursor.fetchall()
        
        if not employees:
            print("❌ No employees found. Run init_sample_data.py first.")
            return
        
        # Sample data templates
        sample_projects = [
            {
                "name": "E-commerce Platform Redesign",
                "description": "Led the complete redesign of our e-commerce platform, improving performance by 60% and user engagement by 40%.",
                "technologies": ["React", "Node.js", "PostgreSQL", "Redis", "AWS"],
                "impact": "Increased revenue by $2M annually"
            },
            {
                "name": "Microservices Migration",
                "description": "Architected and executed migration from monolith to microservices, reducing deployment time from hours to minutes.",
                "technologies": ["Docker", "Kubernetes", "AWS", "GraphQL", "Python"],
                "impact": "Improved system reliability by 99.9%"
            },
            {
                "name": "AI-Powered Analytics Dashboard",
                "description": "Built an internal analytics dashboard using machine learning to provide actionable business insights.",
                "technologies": ["Python", "TensorFlow", "React", "D3.js", "PostgreSQL"],
                "impact": "Enabled data-driven decisions across 5 departments"
            },
            {
                "name": "Mobile App Development",
                "description": "Developed a cross-platform mobile application that increased user engagement by 300%.",
                "technologies": ["React Native", "Firebase", "Redux", "TypeScript"],
                "impact": "100K+ downloads in first month"
            },
            {
                "name": "DevOps Pipeline Optimization",
                "description": "Implemented CI/CD pipeline and infrastructure automation, reducing deployment errors by 90%.",
                "technologies": ["Jenkins", "Terraform", "AWS", "Docker", "Ansible"],
                "impact": "Reduced deployment time from 4 hours to 15 minutes"
            }
        ]
        
        sample_education = [
            {"degree": "Master of Science in Computer Science", "institution": "Stanford University", "field_of_study": "Artificial Intelligence", "year": 2019},
            {"degree": "Bachelor of Science in Software Engineering", "institution": "UC Berkeley", "field_of_study": "Software Engineering", "year": 2017},
            {"degree": "Master of Business Administration", "institution": "Harvard Business School", "field_of_study": "Technology Management", "year": 2020},
            {"degree": "Bachelor of Science in Computer Science", "institution": "MIT", "field_of_study": "Computer Science", "year": 2018},
            {"degree": "Master of Science in Data Science", "institution": "Carnegie Mellon University", "field_of_study": "Machine Learning", "year": 2021},
            {"degree": "Bachelor of Engineering in Computer Engineering", "institution": "Georgia Tech", "field_of_study": "Computer Engineering", "year": 2016}
        ]
        
        sample_certifications = [
            {"name": "AWS Solutions Architect Professional", "org": "Amazon Web Services"},
            {"name": "Google Cloud Professional Cloud Architect", "org": "Google Cloud"},
            {"name": "Certified Kubernetes Administrator", "org": "Cloud Native Computing Foundation"},
            {"name": "Professional Scrum Master", "org": "Scrum.org"},
            {"name": "MongoDB Certified Developer", "org": "MongoDB Inc."},
            {"name": "Azure DevOps Engineer Expert", "org": "Microsoft"},
            {"name": "Certified Information Systems Security Professional", "org": "ISC2"},
            {"name": "TensorFlow Developer Certificate", "org": "Google"}
        ]
        
        languages_options = [
            {"language": "English", "proficiency": "native"},
            {"language": "Spanish", "proficiency": "professional"},
            {"language": "Mandarin", "proficiency": "conversational"},
            {"language": "French", "proficiency": "professional"},
            {"language": "German", "proficiency": "conversational"},
            {"language": "Japanese", "proficiency": "basic"},
            {"language": "Portuguese", "proficiency": "conversational"},
            {"language": "Hindi", "proficiency": "native"}
        ]
        
        achievement_templates = [
            {"title": "Employee of the Year 2023", "category": "professional"},
            {"title": "Led team that won company hackathon", "category": "professional"},
            {"title": "Speaker at React Conference 2023", "category": "professional"},
            {"title": "Mentored 15+ junior developers", "category": "professional"},
            {"title": "Published 3 technical articles", "category": "professional"},
            {"title": "Open source contributor - 50+ GitHub contributions", "category": "professional"},
            {"title": "Led diversity and inclusion initiative", "category": "volunteer"},
            {"title": "Organized tech meetup with 500+ attendees", "category": "volunteer"}
        ]
        
        # Add data for each employee
        for employee_id, name, company, department in employees:
            print(f"📝 Adding profile data for {name}...")
            
            # Add 2-4 projects per employee
            num_projects = random.randint(2, 4)
            selected_projects = random.sample(sample_projects, min(num_projects, len(sample_projects)))
            
            for i, project in enumerate(selected_projects):
                start_date = (datetime.now() - timedelta(days=random.randint(30, 1095))).date()
                is_current = i == 0 and random.random() < 0.3  # 30% chance current project is ongoing
                end_date = None if is_current else (start_date + timedelta(days=random.randint(30, 365)))
                
                cursor.execute("""
                    INSERT INTO user_projects (
                        user_id, name, description, technologies, impact, 
                        start_date, end_date, is_current
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                """, (
                    employee_id,
                    project["name"],
                    project["description"],
                    json.dumps(project["technologies"]),
                    project["impact"],
                    start_date.isoformat(),
                    end_date.isoformat() if end_date else None,
                    is_current
                ))
            
            # Add 1-2 education entries per employee
            num_education = random.randint(1, 2)
            selected_education = random.sample(sample_education, min(num_education, len(sample_education)))
            
            for edu in selected_education:
                cursor.execute("""
                    INSERT INTO user_education (
                        user_id, degree, institution, field_of_study, graduation_year, gpa
                    ) VALUES (?, ?, ?, ?, ?, ?)
                """, (
                    employee_id,
                    edu["degree"],
                    edu["institution"],
                    edu["field_of_study"],
                    edu["year"],
                    round(random.uniform(3.2, 4.0), 2)
                ))
            
            # Add 2-5 certifications per employee
            num_certifications = random.randint(2, 5)
            selected_certifications = random.sample(sample_certifications, min(num_certifications, len(sample_certifications)))
            
            for cert in selected_certifications:
                issue_date = (datetime.now() - timedelta(days=random.randint(30, 730))).date()
                expiration_date = (issue_date + timedelta(days=random.randint(365, 1095)))
                
                cursor.execute("""
                    INSERT INTO user_certifications (
                        user_id, name, issuing_organization, issue_date, expiration_date, credential_id
                    ) VALUES (?, ?, ?, ?, ?, ?)
                """, (
                    employee_id,
                    cert["name"],
                    cert["org"],
                    issue_date.isoformat(),
                    expiration_date.isoformat(),
                    f"CERT-{random.randint(100000, 999999)}"
                ))
            
            # Add 2-4 languages per employee
            num_languages = random.randint(2, 4)
            selected_languages = random.sample(languages_options, min(num_languages, len(languages_options)))
            
            for lang in selected_languages:
                cursor.execute("""
                    INSERT INTO user_languages (user_id, language, proficiency)
                    VALUES (?, ?, ?)
                """, (employee_id, lang["language"], lang["proficiency"]))
            
            # Add 3-6 achievements per employee
            num_achievements = random.randint(3, 6)
            selected_achievements = random.sample(achievement_templates, min(num_achievements, len(achievement_templates)))
            
            for achievement in selected_achievements:
                date_achieved = (datetime.now() - timedelta(days=random.randint(30, 730))).date()
                
                cursor.execute("""
                    INSERT INTO user_achievements (
                        user_id, title, description, date_achieved, category
                    ) VALUES (?, ?, ?, ?, ?)
                """, (
                    employee_id,
                    achievement["title"],
                    f"Recognition for outstanding contribution in {achievement['category']} capacity",
                    date_achieved.isoformat(),
                    achievement["category"]
                ))
            
            # Add some activity logs for each employee
            for _ in range(random.randint(5, 15)):
                activity_date = datetime.now() - timedelta(days=random.randint(1, 30))
                activity_types = ["login", "profile_update", "message_sent", "referral_created"]
                
                cursor.execute("""
                    INSERT INTO user_activity_logs (user_id, activity_type, created_at)
                    VALUES (?, ?, ?)
                """, (employee_id, random.choice(activity_types), activity_date.isoformat()))
        
        conn.commit()
        
        # Get statistics
        cursor.execute("SELECT COUNT(*) FROM user_projects")
        projects_count = cursor.fetchone()[0]
        
        cursor.execute("SELECT COUNT(*) FROM user_education")
        education_count = cursor.fetchone()[0]
        
        cursor.execute("SELECT COUNT(*) FROM user_certifications")
        certifications_count = cursor.fetchone()[0]
        
        cursor.execute("SELECT COUNT(*) FROM user_languages")
        languages_count = cursor.fetchone()[0]
        
        cursor.execute("SELECT COUNT(*) FROM user_achievements")
        achievements_count = cursor.fetchone()[0]
        
        cursor.execute("SELECT COUNT(*) FROM user_activity_logs")
        activity_count = cursor.fetchone()[0]
        
        print(f"✅ Successfully added sample profile data:")
        print(f"   - Projects: {projects_count}")
        print(f"   - Education entries: {education_count}")
        print(f"   - Certifications: {certifications_count}")
        print(f"   - Languages: {languages_count}")
        print(f"   - Achievements: {achievements_count}")
        print(f"   - Activity logs: {activity_count}")
        
    except Exception as e:
        print(f"❌ Error adding sample profile data: {e}")
        conn.rollback()
        raise
    finally:
        conn.close()

if __name__ == "__main__":
    print("🚀 Adding sample profile data for production-ready profiles...")
    add_sample_profile_data()
    print("✨ Sample profile data added successfully!") 