#!/usr/bin/env python3
"""
Sample data initialization script for ReferralInc backend
Run this script to populate the database with sample users (employees) for testing
"""

import json
import sqlite3
from datetime import datetime
from auth_utils import AuthUtils

def init_sample_data():
    """Initialize the database with sample employee data"""
    
    # Sample employee data
    sample_employees = [
        {
            "email": "john.doe@techsolutions.com",
            "password": "password123",
            "name": "John Doe",
            "role": "employee",
            "position": "Senior Software Engineer",
            "company": "Tech Solutions Inc.",
            "department": "Engineering",
            "bio": "Experienced full-stack developer with 8 years in the industry. Passionate about mentoring and helping candidates land their dream jobs.",
            "skills": ["React", "Node.js", "TypeScript", "Python", "AWS", "Docker"],
            "experience_years": 8,
            "rating": 4.8,
            "total_referrals": 24,
            "successful_referrals": 20
        },
        {
            "email": "alice.smith@globalinnovations.com",
            "password": "password123",
            "name": "Alice Smith",
            "role": "employee",
            "position": "Product Manager",
            "company": "Global Innovations",
            "department": "Product",
            "bio": "Strategic product manager with a track record of launching successful products. Love connecting with talented candidates.",
            "skills": ["Product Strategy", "Agile", "UX/UI", "Data Analysis", "Roadmapping"],
            "experience_years": 6,
            "rating": 4.5,
            "total_referrals": 18,
            "successful_referrals": 14
        },
        {
            "email": "robert.johnson@digitalcreations.com",
            "password": "password123",
            "name": "Robert Johnson",
            "role": "employee",
            "position": "Engineering Manager",
            "company": "Digital Creations",
            "department": "Engineering",
            "bio": "Engineering leader focused on building high-performing teams. Always looking for exceptional talent to join our organization.",
            "skills": ["Leadership", "Java", "Spring Boot", "Microservices", "Team Management"],
            "experience_years": 12,
            "rating": 4.2,
            "total_referrals": 15,
            "successful_referrals": 12
        },
        {
            "email": "emily.rodriguez@digitalcreations.com",
            "password": "password123",
            "name": "Emily Rodriguez",
            "role": "employee",
            "position": "Senior UX Designer",
            "company": "Digital Creations",
            "department": "Design",
            "bio": "Creative UX designer passionate about user-centered design. Enjoy helping designers break into top tech companies.",
            "skills": ["UI/UX Design", "Figma", "User Research", "Prototyping", "Design Systems"],
            "experience_years": 5,
            "rating": 4.7,
            "total_referrals": 21,
            "successful_referrals": 18
        },
        {
            "email": "michael.chen@techsolutions.com",
            "password": "password123",
            "name": "Michael Chen",
            "role": "employee",
            "position": "Senior Data Scientist",
            "company": "Tech Solutions Inc.",
            "department": "Data Science",
            "bio": "Data scientist specializing in machine learning and AI. Passionate about helping data professionals advance their careers.",
            "skills": ["Python", "Machine Learning", "TensorFlow", "SQL", "Statistics", "Data Visualization"],
            "experience_years": 7,
            "rating": 4.6,
            "total_referrals": 19,
            "successful_referrals": 16
        },
        {
            "email": "sarah.wilson@megatech.com",
            "password": "password123",
            "name": "Sarah Wilson",
            "role": "employee",
            "position": "DevOps Engineer",
            "company": "MegaTech Corporation",
            "department": "Infrastructure",
            "bio": "DevOps engineer with expertise in cloud infrastructure and automation. Happy to help infrastructure professionals find great opportunities.",
            "skills": ["AWS", "Kubernetes", "Terraform", "CI/CD", "Docker", "Monitoring"],
            "experience_years": 6,
            "rating": 4.4,
            "total_referrals": 12,
            "successful_referrals": 10
        },
        {
            "email": "david.brown@startupinc.com",
            "password": "password123",
            "name": "David Brown",
            "role": "employee",
            "position": "Frontend Developer",
            "company": "StartupInc",
            "department": "Engineering",
            "bio": "Frontend specialist with a passion for creating amazing user experiences. Love mentoring junior developers.",
            "skills": ["React", "Vue.js", "JavaScript", "CSS", "HTML", "Web Performance"],
            "experience_years": 4,
            "rating": 4.3,
            "total_referrals": 8,
            "successful_referrals": 6
        },
        {
            "email": "lisa.garcia@globalinnovations.com",
            "password": "password123",
            "name": "Lisa Garcia",
            "role": "employee",
            "position": "Marketing Manager",
            "company": "Global Innovations",
            "department": "Marketing",
            "bio": "Digital marketing expert with experience in growth marketing and brand strategy. Enjoy connecting with marketing professionals.",
            "skills": ["Digital Marketing", "SEO/SEM", "Analytics", "Content Strategy", "Brand Management"],
            "experience_years": 5,
            "rating": 4.1,
            "total_referrals": 9,
            "successful_referrals": 7
        },
        {
            "email": "james.taylor@megatech.com",
            "password": "password123",
            "name": "James Taylor",
            "role": "employee",
            "position": "Backend Developer",
            "company": "MegaTech Corporation",
            "department": "Engineering",
            "bio": "Backend developer specializing in scalable systems and APIs. Always looking for talented engineers to join our team.",
            "skills": ["Python", "Django", "PostgreSQL", "Redis", "API Design", "System Architecture"],
            "experience_years": 9,
            "rating": 4.5,
            "total_referrals": 16,
            "successful_referrals": 13
        },
        {
            "email": "anna.lee@startupinc.com",
            "password": "password123",
            "name": "Anna Lee",
            "role": "employee",
            "position": "Data Analyst",
            "company": "StartupInc",
            "department": "Analytics",
            "bio": "Data analyst focused on business intelligence and reporting. Passionate about helping analysts grow their careers.",
            "skills": ["SQL", "Python", "Tableau", "Excel", "Statistics", "Business Intelligence"],
            "experience_years": 3,
            "rating": 4.0,
            "total_referrals": 5,
            "successful_referrals": 4
        }
    ]
    
    # Connect to database
    conn = sqlite3.connect('referralinc.db')
    cursor = conn.cursor()
    
    try:
        for employee_data in sample_employees:
            # Hash the password
            hashed_password = AuthUtils.get_password_hash(employee_data["password"])
            
            # Prepare the insert query
            insert_query = """
                INSERT OR IGNORE INTO users (
                    email, password_hash, name, role, position, company, department,
                    bio, skills, experience_years, rating, total_referrals, 
                    successful_referrals, is_active, is_verified, created_at, updated_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """
            
            now = datetime.utcnow().isoformat()
            
            cursor.execute(insert_query, (
                employee_data["email"],
                hashed_password,
                employee_data["name"],
                employee_data["role"],
                employee_data["position"],
                employee_data["company"],
                employee_data["department"],
                employee_data["bio"],
                json.dumps(employee_data["skills"]),  # Store skills as JSON string
                employee_data["experience_years"],
                employee_data["rating"],
                employee_data["total_referrals"],
                employee_data["successful_referrals"],
                True,  # is_active
                True,  # is_verified
                now,   # created_at
                now    # updated_at
            ))
        
        # Also create a sample candidate for testing
        candidate_data = {
            "email": "candidate@example.com",
            "password": "password123",
            "name": "Test Candidate",
            "role": "candidate",
            "bio": "Test candidate looking for referrals",
            "skills": ["Python", "JavaScript"],
            "experience_years": 2
        }
        
        hashed_password = AuthUtils.get_password_hash(candidate_data["password"])
        now = datetime.utcnow().isoformat()
        
        cursor.execute(insert_query, (
            candidate_data["email"],
            hashed_password,
            candidate_data["name"],
            candidate_data["role"],
            None,  # position
            None,  # company
            None,  # department
            candidate_data["bio"],
            json.dumps(candidate_data["skills"]),
            candidate_data["experience_years"],
            None,  # rating
            None,  # total_referrals
            None,  # successful_referrals
            True,  # is_active
            True,  # is_verified
            now,   # created_at
            now    # updated_at
        ))
        
        conn.commit()
        print(f"✅ Successfully inserted {len(sample_employees)} sample employees and 1 test candidate")
        
        # Print summary
        cursor.execute("SELECT COUNT(*) FROM users WHERE role = 'employee'")
        employee_count = cursor.fetchone()[0]
        
        cursor.execute("SELECT COUNT(*) FROM users WHERE role = 'candidate'")
        candidate_count = cursor.fetchone()[0]
        
        print(f"📊 Database now contains:")
        print(f"   - {employee_count} employees")
        print(f"   - {candidate_count} candidates")
        
        # Print companies and departments for reference
        cursor.execute("SELECT DISTINCT company FROM users WHERE role = 'employee' AND company IS NOT NULL")
        companies = [row[0] for row in cursor.fetchall()]
        print(f"   - Companies: {', '.join(companies)}")
        
        cursor.execute("SELECT DISTINCT department FROM users WHERE role = 'employee' AND department IS NOT NULL")
        departments = [row[0] for row in cursor.fetchall()]
        print(f"   - Departments: {', '.join(departments)}")
        
    except Exception as e:
        print(f"❌ Error inserting sample data: {e}")
        conn.rollback()
        raise
    finally:
        conn.close()

if __name__ == "__main__":
    print("🚀 Initializing sample data for ReferralInc database...")
    init_sample_data()
    print("✨ Sample data initialization complete!")
    print("\n📝 Test credentials:")
    print("   Candidate: candidate@example.com / password123")
    print("   Employee: john.doe@techsolutions.com / password123")
    print("   (or any of the other employee emails with password123)") 