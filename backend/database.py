import sqlite3
import hashlib
from datetime import datetime, timezone
from typing import Optional, List, Dict, Any
import json
from pathlib import Path

DATABASE_URL = "referralinc.db"

def get_db_connection():
    """Get database connection with row factory for dict-like access"""
    conn = sqlite3.connect(DATABASE_URL)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    """Initialize database with all required tables"""
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # Users table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            email TEXT UNIQUE NOT NULL,
            password_hash TEXT NOT NULL,
            name TEXT NOT NULL,
            role TEXT NOT NULL CHECK (role IN ('candidate', 'employee', 'admin')),
            avatar_url TEXT,
            department TEXT,
            position TEXT,
            company TEXT,
            bio TEXT,
            skills TEXT, -- JSON array of skills
            experience_years INTEGER,
            location TEXT,
            rating REAL DEFAULT 0.0,
            total_referrals INTEGER DEFAULT 0,
            successful_referrals INTEGER DEFAULT 0,
            is_verified BOOLEAN DEFAULT FALSE,
            is_active BOOLEAN DEFAULT TRUE,
            beta_approved BOOLEAN DEFAULT FALSE,
            beta_requested_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            beta_approved_at TIMESTAMP,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)
    
    # Referrals table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS referrals (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            candidate_id INTEGER NOT NULL,
            employee_id INTEGER NOT NULL,
            position TEXT NOT NULL,
            department TEXT,
            company TEXT NOT NULL,
            status TEXT NOT NULL DEFAULT 'pending' CHECK (
                status IN ('pending', 'reviewing', 'interview_scheduled', 
                          'interview_completed', 'offer_extended', 'hired', 'rejected')
            ),
            notes TEXT,
            resume_url TEXT,
            ai_analysis_score REAL,
            ai_analysis_summary TEXT,
            feedback_score INTEGER,
            feedback_comments TEXT, -- JSON array
            rejection_feedback TEXT, -- Employee's rejection feedback
            rejection_feedback_analysis TEXT, -- JSON object with AI analysis
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (candidate_id) REFERENCES users (id),
            FOREIGN KEY (employee_id) REFERENCES users (id)
        )
    """)
    
    # Referral feedback table for "fell through" reports
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS referral_feedback (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            referral_id INTEGER NOT NULL,
            candidate_id INTEGER NOT NULL,
            employee_id INTEGER NOT NULL,
            feedback_type TEXT NOT NULL CHECK (
                feedback_type IN ('no_response', 'no_interview', 'rejected_after_interview', 
                                'declined_offer', 'position_filled', 'poor_referral_quality', 'other')
            ),
            feedback_text TEXT NOT NULL,
            rating_impact INTEGER DEFAULT -1 CHECK (rating_impact >= -2 AND rating_impact <= 0),
            sentiment_score REAL,
            sentiment_analysis TEXT, -- JSON object
            metadata TEXT, -- JSON object for additional data
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (referral_id) REFERENCES referrals (id) ON DELETE CASCADE,
            FOREIGN KEY (candidate_id) REFERENCES users (id),
            FOREIGN KEY (employee_id) REFERENCES users (id),
            UNIQUE(referral_id) -- One feedback per referral
        )
    """)
    
    # Free conversations table for rejection follow-ups
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS free_conversations (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            referral_id INTEGER NOT NULL,
            candidate_id INTEGER NOT NULL,
            employee_id INTEGER NOT NULL,
            status TEXT NOT NULL DEFAULT 'active' CHECK (
                status IN ('active', 'completed', 'upgrade_required', 'cancelled')
            ),
            message_count INTEGER DEFAULT 0,
            max_messages INTEGER DEFAULT 10,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            completed_at TIMESTAMP,
            FOREIGN KEY (referral_id) REFERENCES referrals (id) ON DELETE CASCADE,
            FOREIGN KEY (candidate_id) REFERENCES users (id),
            FOREIGN KEY (employee_id) REFERENCES users (id),
            UNIQUE(referral_id) -- One free conversation per referral
        )
    """)
    
    # Free conversation messages table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS free_conversation_messages (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            conversation_id INTEGER NOT NULL,
            sender_id INTEGER NOT NULL,
            sender_type TEXT NOT NULL CHECK (sender_type IN ('candidate', 'employee')),
            content TEXT NOT NULL,
            message_type TEXT DEFAULT 'text' CHECK (message_type IN ('text', 'file', 'system')),
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (conversation_id) REFERENCES free_conversations (id) ON DELETE CASCADE,
            FOREIGN KEY (sender_id) REFERENCES users (id)
        )
    """)
    
    # Conversations table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS conversations (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            candidate_id INTEGER NOT NULL,
            employee_id INTEGER NOT NULL,
            status TEXT NOT NULL DEFAULT 'requested' CHECK (
                status IN ('requested', 'accepted', 'scheduled', 'completed', 'cancelled')
            ),
            scheduled_at TIMESTAMP,
            completed_at TIMESTAMP,
            payment_amount REAL,
            payment_status TEXT CHECK (payment_status IN ('pending', 'completed', 'failed')),
            payment_intent_id TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (candidate_id) REFERENCES users (id),
            FOREIGN KEY (employee_id) REFERENCES users (id)
        )
    """)
    
    # Messages table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS messages (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            conversation_id INTEGER NOT NULL,
            sender_id INTEGER NOT NULL,
            content TEXT NOT NULL,
            attachments TEXT, -- JSON array of file URLs
            message_type TEXT DEFAULT 'text' CHECK (message_type IN ('text', 'file', 'system')),
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (conversation_id) REFERENCES conversations (id),
            FOREIGN KEY (sender_id) REFERENCES users (id)
        )
    """)
    
    # Notifications table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS notifications (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            type TEXT NOT NULL,
            title TEXT NOT NULL,
            message TEXT NOT NULL,
            data TEXT, -- JSON data for additional context
            read BOOLEAN DEFAULT FALSE,
            priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users (id)
        )
    """)
    
    # AI Analysis Cache table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS ai_analysis_cache (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            content_hash TEXT UNIQUE NOT NULL,
            analysis_type TEXT NOT NULL, -- 'resume', 'job_match', 'feedback'
            input_data TEXT NOT NULL, -- JSON of input
            result_data TEXT NOT NULL, -- JSON of analysis result
            confidence_score REAL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)
    
    # User Sessions table (for refresh tokens)
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS user_sessions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            refresh_token TEXT UNIQUE NOT NULL,
            expires_at TIMESTAMP NOT NULL,
            is_active BOOLEAN DEFAULT TRUE,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users (id)
        )
    """)
    
    # OTP Verification table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS email_otp_verification (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            email TEXT NOT NULL,
            otp_code TEXT NOT NULL,
            purpose TEXT NOT NULL DEFAULT 'registration' CHECK (purpose IN ('registration', 'password_reset', 'email_change')),
            expires_at TIMESTAMP NOT NULL,
            attempts INTEGER DEFAULT 0,
            max_attempts INTEGER DEFAULT 3,
            is_used BOOLEAN DEFAULT FALSE,
            user_data TEXT, -- JSON data for pending registration
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)
    
    # Activity logs table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS user_activity_logs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER,
            activity_type TEXT NOT NULL,
            activity_data TEXT, -- JSON data
            ip_address TEXT,
            user_agent TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users (id)
        )
    """)
    
    # Analytics Events table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS analytics_events (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER,
            event_type TEXT NOT NULL,
            event_data TEXT, -- JSON data
            ip_address TEXT,
            user_agent TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users (id)
        )
    """)
    
    # Waitlist table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS waitlist (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            email TEXT UNIQUE NOT NULL,
            name TEXT,
            role TEXT CHECK (role IN ('candidate', 'employee')),
            company TEXT,
            position INTEGER, -- position in waitlist
            invited BOOLEAN DEFAULT FALSE,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)
    
    # User Projects table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS user_projects (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            name TEXT NOT NULL,
            description TEXT,
            technologies TEXT, -- JSON array of technologies
            impact TEXT,
            start_date DATE,
            end_date DATE,
            is_current BOOLEAN DEFAULT FALSE,
            url TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users (id)
        )
    """)
    
    # User Education table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS user_education (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            degree TEXT NOT NULL,
            institution TEXT NOT NULL,
            field_of_study TEXT,
            graduation_year INTEGER,
            gpa REAL,
            description TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users (id)
        )
    """)
    
    # User Certifications table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS user_certifications (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            name TEXT NOT NULL,
            issuing_organization TEXT NOT NULL,
            issue_date DATE,
            expiration_date DATE,
            credential_id TEXT,
            credential_url TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users (id)
        )
    """)
    
    # User Languages table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS user_languages (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            language TEXT NOT NULL,
            proficiency TEXT CHECK (proficiency IN ('basic', 'conversational', 'professional', 'native')),
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users (id)
        )
    """)
    
    # User Achievements table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS user_achievements (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            title TEXT NOT NULL,
            description TEXT,
            date_achieved DATE,
            category TEXT, -- 'professional', 'education', 'certification', 'volunteer'
            verification_url TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users (id)
        )
    """)
    
    # User Notification Settings table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS user_notification_settings (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL UNIQUE,
            email_notifications BOOLEAN DEFAULT TRUE,
            push_notifications BOOLEAN DEFAULT TRUE,
            referral_updates BOOLEAN DEFAULT TRUE,
            message_notifications BOOLEAN DEFAULT TRUE,
            system_notifications BOOLEAN DEFAULT TRUE,
            weekly_digest BOOLEAN DEFAULT TRUE,
            marketing_emails BOOLEAN DEFAULT FALSE,
            notification_frequency TEXT DEFAULT 'instant' CHECK (notification_frequency IN ('instant', 'hourly', 'daily', 'weekly')),
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
        )
    """)
    
    # User Privacy Settings table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS user_privacy_settings (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL UNIQUE,
            profile_visibility TEXT DEFAULT 'public' CHECK (profile_visibility IN ('public', 'private', 'connections')),
            show_email BOOLEAN DEFAULT FALSE,
            show_phone BOOLEAN DEFAULT FALSE,
            allow_referral_requests BOOLEAN DEFAULT TRUE,
            allow_premium_conversations BOOLEAN DEFAULT TRUE,
            data_sharing BOOLEAN DEFAULT FALSE,
            analytics_tracking BOOLEAN DEFAULT TRUE,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
        )
    """)
    
    # User Account Preferences table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS user_account_preferences (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL UNIQUE,
            theme TEXT DEFAULT 'system' CHECK (theme IN ('light', 'dark', 'system')),
            language TEXT DEFAULT 'en',
            timezone TEXT DEFAULT 'UTC',
            currency TEXT DEFAULT 'USD',
            date_format TEXT DEFAULT 'MM/dd/yyyy',
            time_format TEXT DEFAULT '12h' CHECK (time_format IN ('12h', '24h')),
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
        )
    """)
    
    # Premium Conversations - Employee Settings table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS employee_premium_settings (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            employee_id INTEGER NOT NULL UNIQUE,
            is_available BOOLEAN DEFAULT TRUE,
            hourly_rate REAL NOT NULL,
            expertise TEXT, -- JSON array of expertise areas
            bio TEXT,
            auto_accept_requests BOOLEAN DEFAULT FALSE,
            max_daily_sessions INTEGER DEFAULT 8,
            response_time_hours INTEGER DEFAULT 24,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (employee_id) REFERENCES users (id) ON DELETE CASCADE
        )
    """)
    
    # Premium Conversations - Availability Slots table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS employee_availability_slots (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            employee_id INTEGER NOT NULL,
            day_of_week INTEGER NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6),
            start_time TEXT NOT NULL, -- HH:MM format
            end_time TEXT NOT NULL,   -- HH:MM format
            timezone TEXT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (employee_id) REFERENCES users (id) ON DELETE CASCADE
        )
    """)
    
    # Premium Conversations table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS premium_conversations (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            candidate_id INTEGER NOT NULL,
            employee_id INTEGER NOT NULL,
            status TEXT NOT NULL DEFAULT 'pending' CHECK (
                status IN ('pending', 'accepted', 'declined', 'in_progress', 'completed', 'cancelled')
            ),
            scheduled_time TIMESTAMP NOT NULL,
            duration_minutes INTEGER NOT NULL DEFAULT 60,
            hourly_rate REAL NOT NULL,
            total_amount REAL NOT NULL,
            topic TEXT NOT NULL,
            candidate_message TEXT,
            employee_response TEXT,
            started_at TIMESTAMP,
            ended_at TIMESTAMP,
            payment_status TEXT DEFAULT 'pending' CHECK (payment_status IN ('pending', 'completed', 'failed', 'refunded')),
            payment_intent_id TEXT,
            stripe_payment_id TEXT,
            rating INTEGER CHECK (rating >= 1 AND rating <= 5),
            feedback TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (candidate_id) REFERENCES users (id),
            FOREIGN KEY (employee_id) REFERENCES users (id)
        )
    """)
    
    # Premium Conversation Messages table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS premium_conversation_messages (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            conversation_id INTEGER NOT NULL,
            sender_id INTEGER NOT NULL,
            sender_type TEXT NOT NULL CHECK (sender_type IN ('candidate', 'employee')),
            content TEXT NOT NULL,
            message_type TEXT DEFAULT 'text' CHECK (message_type IN ('text', 'file', 'system')),
            file_url TEXT,
            read_at TIMESTAMP,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (conversation_id) REFERENCES premium_conversations (id) ON DELETE CASCADE,
            FOREIGN KEY (sender_id) REFERENCES users (id)
        )
    """)
    
    # Premium Payments table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS premium_payments (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            conversation_id INTEGER NOT NULL,
            stripe_payment_intent_id TEXT UNIQUE NOT NULL,
            amount REAL NOT NULL,
            currency TEXT DEFAULT 'usd',
            status TEXT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (conversation_id) REFERENCES premium_conversations (id)
        )
    """)
    
    # Premium Conversation File Uploads table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS premium_conversation_files (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            conversation_id INTEGER NOT NULL,
            message_id INTEGER,
            filename TEXT NOT NULL,
            file_url TEXT NOT NULL,
            file_size INTEGER,
            content_type TEXT,
            uploaded_by INTEGER NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (conversation_id) REFERENCES premium_conversations (id) ON DELETE CASCADE,
            FOREIGN KEY (message_id) REFERENCES premium_conversation_messages (id) ON DELETE SET NULL,
            FOREIGN KEY (uploaded_by) REFERENCES users (id)
        )
    """)
    
    # Employee Settings table for premium conversations
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS employee_settings (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL UNIQUE,
            is_available BOOLEAN DEFAULT TRUE,
            hourly_rate REAL NOT NULL DEFAULT 50.0,
            expertise TEXT, -- JSON array of expertise areas
            bio TEXT,
            auto_accept_requests BOOLEAN DEFAULT FALSE,
            max_daily_sessions INTEGER DEFAULT 8,
            response_time_hours INTEGER DEFAULT 24,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
        )
    """)
    
    # Employee Availability table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS employee_availability (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            day_of_week INTEGER NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6),
            start_time TEXT NOT NULL, -- HH:MM format
            end_time TEXT NOT NULL,   -- HH:MM format
            timezone TEXT NOT NULL DEFAULT 'UTC',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
        )
    """)
    
    # Premium Conversations table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS premium_conversations (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            candidate_id INTEGER NOT NULL,
            employee_id INTEGER NOT NULL,
            status TEXT NOT NULL DEFAULT 'pending' CHECK (
                status IN ('pending', 'accepted', 'declined', 'in_progress', 'completed', 'cancelled')
            ),
            scheduled_time TIMESTAMP NOT NULL,
            duration_minutes INTEGER NOT NULL DEFAULT 30,
            hourly_rate REAL NOT NULL,
            total_amount REAL NOT NULL,
            topic TEXT NOT NULL,
            candidate_message TEXT,
            employee_response TEXT,
            started_at TIMESTAMP,
            ended_at TIMESTAMP,
            payment_status TEXT NOT NULL DEFAULT 'pending' CHECK (
                payment_status IN ('pending', 'completed', 'failed', 'refunded')
            ),
            payment_intent_id TEXT,
            stripe_payment_method_id TEXT,
            rating INTEGER CHECK (rating >= 1 AND rating <= 5),
            feedback TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (candidate_id) REFERENCES users (id),
            FOREIGN KEY (employee_id) REFERENCES users (id)
        )
    """)
    
    # Premium Messages table for real-time chat
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS premium_messages (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            conversation_id INTEGER NOT NULL,
            sender_id INTEGER NOT NULL,
            sender_type TEXT NOT NULL CHECK (sender_type IN ('candidate', 'employee')),
            content TEXT NOT NULL,
            message_type TEXT DEFAULT 'text' CHECK (message_type IN ('text', 'file', 'system', 'video_call')),
            file_url TEXT,
            read_at TIMESTAMP,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (conversation_id) REFERENCES premium_conversations (id) ON DELETE CASCADE,
            FOREIGN KEY (sender_id) REFERENCES users (id)
        )
    """)
    
    # Session Analytics table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS session_analytics (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            conversation_id INTEGER NOT NULL,
            employee_id INTEGER NOT NULL,
            duration_actual_minutes INTEGER,
            quality_score REAL,
            satisfaction_score INTEGER CHECK (satisfaction_score >= 1 AND satisfaction_score <= 5),
            outcome TEXT,
            follow_up_requested BOOLEAN DEFAULT FALSE,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (conversation_id) REFERENCES premium_conversations (id) ON DELETE CASCADE,
            FOREIGN KEY (employee_id) REFERENCES users (id)
        )
    """)
    
    # Premium conversation ratings table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS premium_conversation_ratings (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            conversation_id INTEGER NOT NULL,
            employee_id INTEGER NOT NULL,
            candidate_id INTEGER NOT NULL,
            rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
            comment TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (conversation_id) REFERENCES premium_conversations (id),
            FOREIGN KEY (employee_id) REFERENCES employees (id),
            FOREIGN KEY (candidate_id) REFERENCES candidates (id),
            UNIQUE(conversation_id, candidate_id)
        )
    """)
    
    # Privacy and Consent Management Tables
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS user_consents (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            consent_type TEXT NOT NULL CHECK (consent_type IN ('data_contribution', 'market_analysis', 'resume_storage')),
            granted BOOLEAN DEFAULT FALSE,
            granted_at TIMESTAMP,
            revoked_at TIMESTAMP,
            ip_address TEXT,
            user_agent TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
        )
    """)
    
    # Market Intelligence Cache Tables
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS market_intelligence_cache (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            cache_key TEXT UNIQUE NOT NULL,
            skills_hash TEXT NOT NULL,
            data TEXT NOT NULL, -- JSON data
            scraped_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            expires_at TIMESTAMP NOT NULL,
            sources_used TEXT, -- JSON array of sources
            job_count INTEGER DEFAULT 0,
            salary_data_available BOOLEAN DEFAULT FALSE,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)
    
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS skill_demand_metrics (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            skill_name TEXT NOT NULL,
            demand_level TEXT CHECK (demand_level IN ('high', 'medium', 'low')),
            job_count INTEGER DEFAULT 0,
            average_salary INTEGER,
            salary_min INTEGER,
            salary_max INTEGER,
            growth_trend TEXT CHECK (growth_trend IN ('rising', 'stable', 'declining')),
            last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            data_source TEXT,
            confidence_score REAL DEFAULT 0.0
        )
    """)
    
    # Enhanced User Experience Tables
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS analysis_sessions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            session_token TEXT UNIQUE NOT NULL,
            resume_text TEXT,
            job_description TEXT,
            roadmap_duration_weeks INTEGER DEFAULT 12,
            career_goals TEXT, -- JSON array
            learning_time_hours_per_week INTEGER DEFAULT 5,
            priority_areas TEXT, -- JSON array
            current_iteration INTEGER DEFAULT 1,
            max_iterations INTEGER DEFAULT 4,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            completed_at TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
        )
    """)
    
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS analysis_iterations (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            session_id INTEGER NOT NULL,
            iteration_number INTEGER NOT NULL,
            analysis_data TEXT NOT NULL, -- JSON data
            confidence_score REAL DEFAULT 0.0,
            processing_time REAL DEFAULT 0.0,
            market_data TEXT, -- JSON data
            salary_insights TEXT, -- JSON data
            focus_adjustments TEXT, -- JSON data
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (session_id) REFERENCES analysis_sessions (id) ON DELETE CASCADE
        )
    """)
    
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS analysis_feedback (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            session_id INTEGER NOT NULL,
            iteration_id INTEGER,
            feedback_type TEXT CHECK (feedback_type IN ('dissatisfaction', 'refinement_request', 'positive')),
            feedback_text TEXT,
            specific_areas TEXT, -- JSON array
            satisfaction_score INTEGER CHECK (satisfaction_score BETWEEN 1 AND 5),
            action_taken TEXT,
            reanalysis_requested BOOLEAN DEFAULT FALSE,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (session_id) REFERENCES analysis_sessions (id) ON DELETE CASCADE,
            FOREIGN KEY (iteration_id) REFERENCES analysis_iterations (id) ON DELETE SET NULL
        )
    """)
    
    # Create indexes for better performance
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_users_role ON users(role)")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_referrals_candidate ON referrals(candidate_id)")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_referrals_employee ON referrals(employee_id)")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_referrals_status ON referrals(status)")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_conversations_users ON conversations(candidate_id, employee_id)")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_messages_conversation ON messages(conversation_id)")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id)")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_sessions_user ON user_sessions(user_id)")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_sessions_token ON user_sessions(refresh_token)")
    
    # Indexes for new profile tables
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_user_projects_user ON user_projects(user_id)")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_user_education_user ON user_education(user_id)")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_user_certifications_user ON user_certifications(user_id)")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_user_languages_user ON user_languages(user_id)")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_user_activity_logs_user ON user_activity_logs(user_id)")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_user_activity_logs_type ON user_activity_logs(activity_type)")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_user_achievements_user ON user_achievements(user_id)")
    
    # Indexes for settings tables
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_user_notification_settings_user ON user_notification_settings(user_id)")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_user_privacy_settings_user ON user_privacy_settings(user_id)")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_user_account_preferences_user ON user_account_preferences(user_id)")
    
    # Premium conversations indexes
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_premium_conversations_candidate ON premium_conversations(candidate_id)")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_premium_conversations_employee ON premium_conversations(employee_id)")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_premium_conversations_status ON premium_conversations(status)")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_premium_conversations_scheduled_time ON premium_conversations(scheduled_time)")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_premium_messages_conversation ON premium_conversation_messages(conversation_id)")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_premium_messages_sender ON premium_conversation_messages(sender_id)")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_employee_settings_employee ON employee_premium_settings(employee_id)")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_availability_slots_employee ON employee_availability_slots(employee_id)")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_premium_payments_conversation ON premium_payments(conversation_id)")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_premium_files_conversation ON premium_conversation_files(conversation_id)")
    
    # Additional indexes for new tables
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_user_consents_user ON user_consents(user_id)")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_user_consents_type ON user_consents(consent_type)")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_market_cache_key ON market_intelligence_cache(cache_key)")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_market_cache_skills ON market_intelligence_cache(skills_hash)")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_skill_metrics_name ON skill_demand_metrics(skill_name)")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_skill_metrics_demand ON skill_demand_metrics(demand_level)")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_analysis_sessions_user ON analysis_sessions(user_id)")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_analysis_sessions_token ON analysis_sessions(session_token)")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_analysis_iterations_session ON analysis_iterations(session_id)")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_analysis_feedback_session ON analysis_feedback(session_id)")
    
    conn.commit()
    conn.close()
    print("Database initialized successfully with all tables!")

class DatabaseManager:
    """Database operations manager"""
    
    @staticmethod
    def execute_query(query: str, params: tuple = (), fetch_one: bool = False, fetch_all: bool = False):
        """Execute a query and return results"""
        conn = get_db_connection()
        cursor = conn.cursor()
        
        try:
            cursor.execute(query, params)
            
            if fetch_one:
                result = cursor.fetchone()
                return dict(result) if result else None
            elif fetch_all:
                results = cursor.fetchall()
                return [dict(row) for row in results]
            else:
                conn.commit()
                return cursor.lastrowid
        except Exception as e:
            conn.rollback()
            raise e
        finally:
            conn.close()
    
    @staticmethod
    def create_user(email: str, password_hash: str, name: str, role: str, **kwargs) -> int:
        """Create a new user"""
        fields = ['email', 'password_hash', 'name', 'role']
        values = [email, password_hash, name, role]
        placeholders = ['?', '?', '?', '?']
        
        # Add optional fields
        for key, value in kwargs.items():
            if value is not None:
                fields.append(key)
                values.append(value)
                placeholders.append('?')
        
        query = f"""
            INSERT INTO users ({', '.join(fields)})
            VALUES ({', '.join(placeholders)})
        """
        
        return DatabaseManager.execute_query(query, tuple(values))
    
    @staticmethod
    def get_user_by_email(email: str) -> Optional[Dict[str, Any]]:
        """Get user by email"""
        query = "SELECT * FROM users WHERE email = ? AND is_active = TRUE"
        return DatabaseManager.execute_query(query, (email,), fetch_one=True)
    
    @staticmethod
    def get_user_by_id(user_id: int) -> Optional[Dict[str, Any]]:
        """Get user by ID"""
        query = "SELECT * FROM users WHERE id = ? AND is_active = TRUE"
        return DatabaseManager.execute_query(query, (user_id,), fetch_one=True)
    
    @staticmethod
    def update_user(user_id: int, **kwargs) -> bool:
        """Update user data"""
        if not kwargs:
            return False
        
        # Add updated_at timestamp
        kwargs['updated_at'] = datetime.now(timezone.utc).isoformat()
        
        fields = [f"{key} = ?" for key in kwargs.keys()]
        values = list(kwargs.values())
        values.append(user_id)
        
        query = f"UPDATE users SET {', '.join(fields)} WHERE id = ?"
        DatabaseManager.execute_query(query, tuple(values))
        return True
    
    @staticmethod
    def create_session(user_id: int, refresh_token: str, expires_at: datetime) -> int:
        """Create a new user session"""
        query = """
            INSERT INTO user_sessions (user_id, refresh_token, expires_at)
            VALUES (?, ?, ?)
        """
        return DatabaseManager.execute_query(query, (user_id, refresh_token, expires_at.isoformat()))
    
    @staticmethod
    def get_session_by_token(refresh_token: str) -> Optional[Dict[str, Any]]:
        """Get session by refresh token"""
        query = """
            SELECT * FROM user_sessions 
            WHERE refresh_token = ? AND is_active = TRUE AND expires_at > ?
        """
        return DatabaseManager.execute_query(
            query, 
            (refresh_token, datetime.now(timezone.utc).isoformat()), 
            fetch_one=True
        )
    
    @staticmethod
    def deactivate_session(refresh_token: str) -> bool:
        """Deactivate a session"""
        query = "UPDATE user_sessions SET is_active = FALSE WHERE refresh_token = ?"
        DatabaseManager.execute_query(query, (refresh_token,))
        return True

if __name__ == "__main__":
    init_db() 