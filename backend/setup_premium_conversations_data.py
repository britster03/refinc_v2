import sqlite3
import json
from datetime import datetime, timedelta
import hashlib

def get_db_connection():
    """Get database connection"""
    conn = sqlite3.connect('referralinc.db')
    conn.row_factory = sqlite3.Row
    return conn

def hash_password(password: str) -> str:
    """Hash password using SHA-256"""
    return hashlib.sha256(password.encode()).hexdigest()

def setup_premium_conversations_data():
    """Setup sample data for premium conversations"""
    conn = get_db_connection()
    cursor = conn.cursor()
    
    try:
        # Create some sample employees if they don't exist
        employees_data = [
            {
                'email': 'sarah.johnson@techsolutions.com',
                'password': hash_password('password123'),
                'name': 'Sarah Johnson',
                'role': 'employee',
                'position': 'Senior Frontend Developer',
                'company': 'Tech Solutions Inc.',
                'department': 'Engineering',
                'bio': 'Experienced frontend developer with 8+ years in React, TypeScript, and system design. Passionate about mentoring junior developers.',
                'skills': ['React', 'TypeScript', 'JavaScript', 'Node.js', 'GraphQL', 'System Design'],
                'experience_years': 8,
                'rating': 4.9,
                'hourly_rate': 85.0,
                'expertise': ['React', 'TypeScript', 'System Design', 'Career Guidance'],
                'total_referrals': 45,
                'successful_referrals': 38
            },
            {
                'email': 'michael.chen@globalinnovations.com',
                'password': hash_password('password123'),
                'name': 'Michael Chen',
                'role': 'employee',
                'position': 'Engineering Manager',
                'company': 'Global Innovations',
                'department': 'Engineering',
                'bio': 'Engineering manager with a strong technical background. Expert in team leadership, technical strategy, and interview preparation.',
                'skills': ['Leadership', 'Python', 'Java', 'Team Management', 'Architecture'],
                'experience_years': 12,
                'rating': 4.8,
                'hourly_rate': 95.0,
                'expertise': ['Leadership', 'Team Management', 'Technical Strategy', 'Interview Prep'],
                'total_referrals': 32,
                'successful_referrals': 28
            },
            {
                'email': 'emily.rodriguez@digitalcreations.com',
                'password': hash_password('password123'),
                'name': 'Emily Rodriguez',
                'role': 'employee',
                'position': 'Product Manager',
                'company': 'Digital Creations',
                'department': 'Product',
                'bio': 'Senior product manager with expertise in user research, roadmap planning, and stakeholder management. Love helping others transition into PM roles.',
                'skills': ['Product Strategy', 'User Research', 'Analytics', 'Agile'],
                'experience_years': 6,
                'rating': 4.7,
                'hourly_rate': 75.0,
                'expertise': ['Product Strategy', 'User Research', 'Roadmap Planning', 'Stakeholder Management'],
                'total_referrals': 28,
                'successful_referrals': 25
            },
            {
                'email': 'david.kim@startuptech.com',
                'password': hash_password('password123'),
                'name': 'David Kim',
                'role': 'employee',
                'position': 'Staff Software Engineer',
                'company': 'StartupTech',
                'department': 'Engineering',
                'bio': 'Full-stack engineer specializing in scalable backend systems and cloud architecture. Happy to discuss system design and career growth.',
                'skills': ['Backend', 'AWS', 'Microservices', 'Docker', 'Kubernetes'],
                'experience_years': 10,
                'rating': 4.9,
                'hourly_rate': 110.0,
                'expertise': ['Backend Development', 'System Architecture', 'Cloud Technologies', 'Scalability'],
                'total_referrals': 18,
                'successful_referrals': 17
            },
            {
                'email': 'lisa.wang@designstudio.com',
                'password': hash_password('password123'),
                'name': 'Lisa Wang',
                'role': 'employee',
                'position': 'Senior UX Designer',
                'company': 'Design Studio',
                'department': 'Design',
                'bio': 'UX designer with a background in both B2B and B2C products. Experienced in design systems, user research, and prototyping.',
                'skills': ['UX Design', 'UI Design', 'Figma', 'User Research', 'Prototyping'],
                'experience_years': 7,
                'rating': 4.6,
                'hourly_rate': 80.0,
                'expertise': ['UX Design', 'Design Systems', 'User Research', 'Portfolio Review'],
                'total_referrals': 22,
                'successful_referrals': 19
            }
        ]
        
        # Create sample candidates
        candidates_data = [
            {
                'email': 'john.doe@email.com',
                'password': hash_password('password123'),
                'name': 'John Doe',
                'role': 'candidate',
                'position': 'Frontend Developer',
                'company': 'Previous Corp',
                'bio': 'Junior frontend developer looking to advance my career and learn from experienced professionals.',
                'skills': ['React', 'JavaScript', 'HTML', 'CSS'],
                'experience_years': 2
            },
            {
                'email': 'jane.smith@email.com',
                'password': hash_password('password123'),
                'name': 'Jane Smith',
                'role': 'candidate',
                'position': 'Product Manager',
                'company': 'Startup Inc',
                'bio': 'Transitioning from business analyst to product management. Seeking guidance on PM best practices.',
                'skills': ['Business Analysis', 'SQL', 'Project Management'],
                'experience_years': 3
            },
            {
                'email': 'alex.thompson@email.com',
                'password': hash_password('password123'),
                'name': 'Alex Thompson',
                'role': 'candidate',
                'position': 'Junior Developer',
                'company': 'Code Academy',
                'bio': 'Recent bootcamp graduate seeking mentorship on frontend development and career guidance.',
                'skills': ['JavaScript', 'React', 'Node.js'],
                'experience_years': 1
            }
        ]
        
        # Insert employees and candidates
        all_users = employees_data + candidates_data
        user_ids = {}
        
        for user in all_users:
            # Check if user already exists
            cursor.execute("SELECT id FROM users WHERE email = ?", (user['email'],))
            existing_user = cursor.fetchone()
            
            if not existing_user:
                cursor.execute("""
                    INSERT INTO users (
                        email, password_hash, name, role, position, company, department,
                        bio, skills, experience_years, rating, total_referrals, successful_referrals
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """, (
                    user['email'], user['password'], user['name'], user['role'],
                    user['position'], user['company'], user.get('department'),
                    user['bio'], json.dumps(user['skills']), user['experience_years'],
                    user.get('rating', 0), user.get('total_referrals', 0), user.get('successful_referrals', 0)
                ))
                user_id = cursor.lastrowid
            else:
                user_id = existing_user['id']
            
            user_ids[user['email']] = user_id
        
        # Setup employee settings and availability
        for employee in employees_data:
            user_id = user_ids[employee['email']]
            
            # Check if settings already exist
            cursor.execute("SELECT id FROM employee_settings WHERE user_id = ?", (user_id,))
            if not cursor.fetchone():
                cursor.execute("""
                    INSERT INTO employee_settings (
                        user_id, is_available, hourly_rate, expertise, bio,
                        auto_accept_requests, max_daily_sessions, response_time_hours
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                """, (
                    user_id, True, employee['hourly_rate'], json.dumps(employee['expertise']),
                    employee['bio'], False, 8, 24
                ))
            
            # Add availability slots (Monday to Friday, 9 AM to 5 PM)
            cursor.execute("DELETE FROM employee_availability WHERE user_id = ?", (user_id,))
            
            # Monday to Friday availability
            for day in range(1, 6):  # Monday = 1, Friday = 5
                cursor.execute("""
                    INSERT INTO employee_availability (
                        user_id, day_of_week, start_time, end_time, timezone
                    ) VALUES (?, ?, ?, ?, ?)
                """, (user_id, day, "09:00", "17:00", "UTC"))
        
        # Create some sample premium conversations
        sample_conversations = [
            {
                'candidate_email': 'john.doe@email.com',
                'employee_email': 'sarah.johnson@techsolutions.com',
                'topic': 'Frontend Career Advancement Strategy',
                'candidate_message': 'Hi! I\'m looking for guidance on advancing my frontend career and would love to discuss React best practices and career progression paths.',
                'duration_minutes': 60,
                'status': 'completed',
                'scheduled_time': datetime.now() - timedelta(days=2),
                'started_at': datetime.now() - timedelta(days=2, hours=-1),
                'ended_at': datetime.now() - timedelta(days=2, hours=-2),
                'payment_status': 'completed',
                'rating': 5,
                'feedback': 'Extremely helpful session! Sarah provided great insights into React architecture and career advancement strategies.'
            },
            {
                'candidate_email': 'alex.thompson@email.com',
                'employee_email': 'sarah.johnson@techsolutions.com',
                'topic': 'Frontend Development Best Practices',
                'candidate_message': 'I\'m a bootcamp graduate looking for mentorship on React development and how to stand out as a junior developer.',
                'duration_minutes': 30,
                'status': 'pending',
                'scheduled_time': datetime.now() + timedelta(days=1),
                'payment_status': 'pending'
            },
            {
                'candidate_email': 'jane.smith@email.com',
                'employee_email': 'emily.rodriguez@digitalcreations.com',
                'topic': 'Product Management Transition',
                'candidate_message': 'I\'m transitioning from business analysis to product management and would love to discuss the key skills and mindset shifts needed.',
                'duration_minutes': 45,
                'status': 'accepted',
                'scheduled_time': datetime.now() + timedelta(hours=6),
                'payment_status': 'completed',
                'employee_response': 'Looking forward to our conversation! I\'ll share my experience transitioning into PM and what skills to focus on.'
            },
            {
                'candidate_email': 'john.doe@email.com',
                'employee_email': 'michael.chen@globalinnovations.com',
                'topic': 'Engineering Leadership Path',
                'candidate_message': 'Interested in understanding the path from senior engineer to engineering management. What skills should I develop?',
                'duration_minutes': 60,
                'status': 'in_progress',
                'scheduled_time': datetime.now() - timedelta(minutes=15),
                'started_at': datetime.now() - timedelta(minutes=15),
                'payment_status': 'completed'
            }
        ]
        
        for conv in sample_conversations:
            candidate_id = user_ids[conv['candidate_email']]
            employee_id = user_ids[conv['employee_email']]
            
            # Get employee's hourly rate
            cursor.execute("""
                SELECT COALESCE(es.hourly_rate, 50.0) as hourly_rate
                FROM users u
                LEFT JOIN employee_settings es ON u.id = es.user_id
                WHERE u.id = ?
            """, (employee_id,))
            result = cursor.fetchone()
            hourly_rate = result['hourly_rate'] if result else 50.0
            
            total_amount = (conv['duration_minutes'] / 60) * hourly_rate
            
            cursor.execute("""
                INSERT INTO premium_conversations (
                    candidate_id, employee_id, scheduled_time, duration_minutes,
                    hourly_rate, total_amount, topic, candidate_message, employee_response,
                    status, started_at, ended_at, payment_status, rating, feedback
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                candidate_id, employee_id, conv['scheduled_time'], conv['duration_minutes'],
                hourly_rate, total_amount, conv['topic'], conv['candidate_message'],
                conv.get('employee_response'), conv['status'], conv.get('started_at'),
                conv.get('ended_at'), conv['payment_status'], conv.get('rating'),
                conv.get('feedback')
            ))
            
            conversation_id = cursor.lastrowid
            
            # Add some sample messages for completed/in-progress conversations
            if conv['status'] in ['completed', 'in_progress']:
                messages = [
                    {
                        'sender_id': candidate_id,
                        'sender_type': 'candidate',
                        'content': 'Hi! Thank you for accepting my session request. I\'m excited to learn from your experience!',
                        'created_at': conv['scheduled_time'] - timedelta(minutes=5)
                    },
                    {
                        'sender_id': employee_id,
                        'sender_type': 'employee',
                        'content': 'Hello! I\'m looking forward to our conversation. I\'ve reviewed your background and have some great insights to share.',
                        'created_at': conv['scheduled_time'] - timedelta(minutes=3)
                    }
                ]
                
                if conv['status'] == 'completed':
                    messages.extend([
                        {
                            'sender_id': employee_id,
                            'sender_type': 'employee',
                            'content': 'Great session today! I\'ve shared some resources in your email. Feel free to reach out if you have follow-up questions.',
                            'created_at': conv['ended_at'] - timedelta(minutes=2)
                        },
                        {
                            'sender_id': candidate_id,
                            'sender_type': 'candidate',
                            'content': 'Thank you so much! This was incredibly valuable. I really appreciate your time and insights.',
                            'created_at': conv['ended_at'] - timedelta(minutes=1)
                        }
                    ])
                
                for msg in messages:
                    cursor.execute("""
                        INSERT INTO premium_messages (
                            conversation_id, sender_id, sender_type, content, created_at
                        ) VALUES (?, ?, ?, ?, ?)
                    """, (
                        conversation_id, msg['sender_id'], msg['sender_type'],
                        msg['content'], msg['created_at']
                    ))
        
        conn.commit()
        print("✅ Premium conversations sample data created successfully!")
        print("\n📊 Created:")
        print(f"  - {len(employees_data)} Employees with premium conversation settings")
        print(f"  - {len(candidates_data)} Candidates")
        print(f"  - {len(sample_conversations)} Sample conversations")
        print("  - Sample availability schedules")
        print("  - Sample messages")
        
        print("\n👥 Employee Login Credentials:")
        for emp in employees_data:
            print(f"  📧 {emp['email']} | 🔑 password123 | 💰 ${emp['hourly_rate']}/hr")
        
        print("\n👤 Candidate Login Credentials:")
        for cand in candidates_data:
            print(f"  📧 {cand['email']} | 🔑 password123")
            
    except Exception as e:
        conn.rollback()
        print(f"❌ Error setting up premium conversations data: {e}")
    finally:
        conn.close()

if __name__ == "__main__":
    setup_premium_conversations_data() 