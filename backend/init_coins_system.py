#!/usr/bin/env python3
"""
Initialize Coins Reward System

Creates all necessary tables and seeds the database with:
- Achievements
- Reward items
- Coin packs
- Sample data
"""

import sqlite3
import json
from datetime import datetime, timedelta
from database import DatabaseManager

def create_coins_tables():
    """Create all coins system tables"""
    print("🏗️  Creating coins system tables...")
    
    # User wallets table
    create_wallets_query = """
        CREATE TABLE IF NOT EXISTS user_wallets (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL UNIQUE,
            refcoin_balance INTEGER DEFAULT 0,
            premium_token_balance INTEGER DEFAULT 0,
            total_earned_refcoins INTEGER DEFAULT 0,
            total_spent_refcoins INTEGER DEFAULT 0,
            total_earned_premium_tokens INTEGER DEFAULT 0,
            total_spent_premium_tokens INTEGER DEFAULT 0,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users (id)
        )
    """
    
    # Coin transactions table
    create_transactions_query = """
        CREATE TABLE IF NOT EXISTS coin_transactions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            wallet_id INTEGER NOT NULL,
            transaction_type TEXT NOT NULL CHECK(transaction_type IN ('earned', 'spent', 'purchased', 'gifted', 'bonus', 'refund')),
            coin_type TEXT NOT NULL CHECK(coin_type IN ('refcoin', 'premium_token')),
            amount INTEGER NOT NULL,
            balance_after INTEGER NOT NULL,
            status TEXT DEFAULT 'completed' CHECK(status IN ('pending', 'completed', 'failed', 'cancelled')),
            source TEXT NOT NULL,
            source_id TEXT,
            description TEXT,
            transaction_metadata TEXT,
            stripe_payment_intent_id TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (wallet_id) REFERENCES user_wallets (id)
        )
    """
    
    # Achievements table
    create_achievements_query = """
        CREATE TABLE IF NOT EXISTS achievements (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            code TEXT UNIQUE NOT NULL,
            name TEXT NOT NULL,
            description TEXT NOT NULL,
            achievement_type TEXT NOT NULL CHECK(achievement_type IN ('profile', 'referral', 'interview', 'networking', 'learning', 'mentorship')),
            icon TEXT,
            reward_refcoins INTEGER DEFAULT 0,
            reward_premium_tokens INTEGER DEFAULT 0,
            requirements TEXT NOT NULL,
            is_repeatable BOOLEAN DEFAULT 0,
            max_completions INTEGER,
            rarity TEXT DEFAULT 'common' CHECK(rarity IN ('common', 'uncommon', 'rare', 'epic', 'legendary')),
            is_active BOOLEAN DEFAULT 1,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    """
    
    # User achievements table
    create_user_achievements_query = """
        CREATE TABLE IF NOT EXISTS user_achievements (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            achievement_id INTEGER NOT NULL,
            progress INTEGER DEFAULT 0,
            max_progress INTEGER NOT NULL,
            is_completed BOOLEAN DEFAULT 0,
            completed_at DATETIME,
            completion_count INTEGER DEFAULT 0,
            coins_rewarded INTEGER DEFAULT 0,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users (id),
            FOREIGN KEY (achievement_id) REFERENCES achievements (id)
        )
    """
    
    # Reward items table
    create_reward_items_query = """
        CREATE TABLE IF NOT EXISTS reward_items (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            description TEXT NOT NULL,
            category TEXT NOT NULL CHECK(category IN ('platform_features', 'gift_cards', 'courses', 'tools', 'career_development')),
            refcoin_cost INTEGER,
            premium_token_cost INTEGER,
            usd_value REAL,
            is_available BOOLEAN DEFAULT 1,
            stock_quantity INTEGER,
            purchase_limit_per_user INTEGER,
            provider TEXT,
            provider_product_id TEXT,
            fulfillment_method TEXT DEFAULT 'manual' CHECK(fulfillment_method IN ('manual', 'api', 'email')),
            image_url TEXT,
            featured BOOLEAN DEFAULT 0,
            sort_order INTEGER DEFAULT 0,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    """
    
    # Reward purchases table
    create_reward_purchases_query = """
        CREATE TABLE IF NOT EXISTS reward_purchases (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            reward_item_id INTEGER NOT NULL,
            transaction_id INTEGER,
            refcoin_cost INTEGER,
            premium_token_cost INTEGER,
            status TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'fulfilled', 'failed', 'cancelled')),
            fulfillment_data TEXT,
            fulfilled_at DATETIME,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users (id),
            FOREIGN KEY (reward_item_id) REFERENCES reward_items (id),
            FOREIGN KEY (transaction_id) REFERENCES coin_transactions (id)
        )
    """
    
    # Leaderboard entries table
    create_leaderboard_query = """
        CREATE TABLE IF NOT EXISTS leaderboard_entries (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            leaderboard_type TEXT NOT NULL,
            period TEXT NOT NULL,
            score INTEGER DEFAULT 0,
            rank INTEGER,
            leaderboard_metadata TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users (id)
        )
    """
    
    # Coin packs table
    create_coin_packs_query = """
        CREATE TABLE IF NOT EXISTS coin_packs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            description TEXT,
            usd_price REAL NOT NULL,
            refcoins_amount INTEGER NOT NULL,
            bonus_refcoins INTEGER DEFAULT 0,
            premium_tokens_amount INTEGER DEFAULT 0,
            stripe_price_id TEXT,
            is_featured BOOLEAN DEFAULT 0,
            is_active BOOLEAN DEFAULT 1,
            sort_order INTEGER DEFAULT 0,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    """
    
    # Execute table creation queries
    queries = [
        create_wallets_query,
        create_transactions_query,
        create_achievements_query,
        create_user_achievements_query,
        create_reward_items_query,
        create_reward_purchases_query,
        create_leaderboard_query,
        create_coin_packs_query
    ]
    
    for query in queries:
        DatabaseManager.execute_query(query)
    
    print("✅ Coins system tables created successfully!")

def seed_achievements():
    """Seed the database with initial achievements"""
    print("🏆 Seeding achievements...")
    
    achievements = [
        # Profile achievements
        {
            'code': 'profile_master',
            'name': 'Profile Master',
            'description': 'Complete your profile with all required information',
            'achievement_type': 'profile',
            'icon': '👤',
            'reward_refcoins': 50,
            'reward_premium_tokens': 0,
            'requirements': json.dumps({
                'action': 'profile_completion',
                'required_fields': ['name', 'bio', 'position', 'company', 'skills']
            }),
            'rarity': 'common'
        },
        {
            'code': 'resume_uploader',
            'name': 'Resume Uploader',
            'description': 'Upload your first resume',
            'achievement_type': 'profile',
            'icon': '📄',
            'reward_refcoins': 25,
            'reward_premium_tokens': 0,
            'requirements': json.dumps({
                'action': 'resume_upload',
                'min_resumes': 1
            }),
            'rarity': 'common'
        },
        
        # Referral achievements
        {
            'code': 'first_referral',
            'name': 'First Referral',
            'description': 'Get your first successful referral',
            'achievement_type': 'referral',
            'icon': '🎯',
            'reward_refcoins': 100,
            'reward_premium_tokens': 1,
            'requirements': json.dumps({
                'action': 'successful_referral',
                'min_count': 1
            }),
            'rarity': 'uncommon'
        },
        {
            'code': 'referral_champion',
            'name': 'Referral Champion',
            'description': 'Get 5 successful referrals',
            'achievement_type': 'referral',
            'icon': '🏆',
            'reward_refcoins': 500,
            'reward_premium_tokens': 5,
            'requirements': json.dumps({
                'action': 'successful_referral',
                'min_count': 5
            }),
            'rarity': 'rare'
        },
        {
            'code': 'hire_hero',
            'name': 'Hire Hero',
            'description': 'Get hired through the platform',
            'achievement_type': 'referral',
            'icon': '💼',
            'reward_refcoins': 1000,
            'reward_premium_tokens': 10,
            'requirements': json.dumps({
                'action': 'job_hired',
                'min_count': 1
            }),
            'rarity': 'epic'
        },
        
        # Networking achievements
        {
            'code': 'networking_ninja',
            'name': 'Networking Ninja',
            'description': 'Connect with 10 different employees',
            'achievement_type': 'networking',
            'icon': '🥷',
            'reward_refcoins': 200,
            'reward_premium_tokens': 2,
            'requirements': json.dumps({
                'action': 'employee_connection',
                'min_connections': 10
            }),
            'rarity': 'uncommon'
        },
        {
            'code': 'super_connector',
            'name': 'Super Connector',
            'description': 'Connect with 50 different employees',
            'achievement_type': 'networking',
            'icon': '🌟',
            'reward_refcoins': 750,
            'reward_premium_tokens': 7,
            'requirements': json.dumps({
                'action': 'employee_connection',
                'min_connections': 50
            }),
            'rarity': 'epic'
        },
        
        # Employee achievements
        {
            'code': 'mentor_extraordinaire',
            'name': 'Mentor Extraordinaire',
            'description': 'Help 100 candidates as an employee',
            'achievement_type': 'mentorship',
            'icon': '🎓',
            'reward_refcoins': 1500,
            'reward_premium_tokens': 15,
            'requirements': json.dumps({
                'action': 'candidates_helped',
                'min_count': 100
            }),
            'rarity': 'legendary'
        }
    ]
    
    # Insert achievements
    for achievement in achievements:
        insert_query = """
            INSERT OR IGNORE INTO achievements (
                code, name, description, achievement_type, icon, 
                reward_refcoins, reward_premium_tokens, requirements, rarity
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        """
        DatabaseManager.execute_query(
            insert_query,
            (
                achievement['code'], achievement['name'], achievement['description'],
                achievement['achievement_type'], achievement['icon'],
                achievement['reward_refcoins'], achievement['reward_premium_tokens'],
                achievement['requirements'], achievement['rarity']
            )
        )
    
    print(f"✅ Seeded {len(achievements)} achievements!")

def seed_reward_items():
    """Seed the database with reward items"""
    print("🎁 Seeding reward items...")
    
    rewards = [
        # Platform features
        {
            'name': 'Premium Conversation Credit',
            'description': '15-minute premium conversation with any employee',
            'category': 'platform_features',
            'refcoin_cost': 300,
            'usd_value': 30.0,
            'featured': True,
            'sort_order': 1
        },
        {
            'name': 'Profile Highlighting',
            'description': 'Highlight your profile for 30 days',
            'category': 'platform_features',
            'refcoin_cost': 100,
            'usd_value': 10.0,
            'sort_order': 2
        },
        {
            'name': 'Advanced AI Analysis',
            'description': 'Priority AI analysis with detailed insights',
            'category': 'platform_features',
            'refcoin_cost': 50,
            'usd_value': 5.0,
            'sort_order': 3
        },
        
        # Gift cards
        {
            'name': 'Amazon Gift Card ($10)',
            'description': '$10 Amazon gift card for shopping',
            'category': 'gift_cards',
            'refcoin_cost': 1000,
            'usd_value': 10.0,
            'provider': 'amazon',
            'featured': True,
            'sort_order': 10
        },
        {
            'name': 'Amazon Gift Card ($25)',
            'description': '$25 Amazon gift card for shopping',
            'category': 'gift_cards',
            'refcoin_cost': 2500,
            'usd_value': 25.0,
            'provider': 'amazon',
            'sort_order': 11
        },
        {
            'name': 'Amazon Gift Card ($50)',
            'description': '$50 Amazon gift card for shopping',
            'category': 'gift_cards',
            'refcoin_cost': 5000,
            'usd_value': 50.0,
            'provider': 'amazon',
            'sort_order': 12
        },
        
        # Course platforms
        {
            'name': 'Coursera Course Credit ($30)',
            'description': '$30 credit for any Coursera course',
            'category': 'courses',
            'refcoin_cost': 3000,
            'usd_value': 30.0,
            'provider': 'coursera',
            'sort_order': 20
        },
        {
            'name': 'Udemy Course Bundle ($20)',
            'description': '$20 credit for Udemy courses',
            'category': 'courses',
            'refcoin_cost': 2000,
            'usd_value': 20.0,
            'provider': 'udemy',
            'sort_order': 21
        },
        {
            'name': 'Pluralsight Monthly Subscription',
            'description': '1 month of Pluralsight access',
            'category': 'courses',
            'refcoin_cost': 4000,
            'usd_value': 40.0,
            'provider': 'pluralsight',
            'sort_order': 22
        },
        
        # Professional tools
        {
            'name': 'LinkedIn Premium (1 Month)',
            'description': '1 month of LinkedIn Premium access',
            'category': 'tools',
            'refcoin_cost': 5000,
            'usd_value': 50.0,
            'provider': 'linkedin',
            'featured': True,
            'sort_order': 30
        },
        {
            'name': 'Grammarly Premium (1 Month)',
            'description': '1 month of Grammarly Premium for writing',
            'category': 'tools',
            'refcoin_cost': 2500,
            'usd_value': 25.0,
            'provider': 'grammarly',
            'sort_order': 31
        },
        {
            'name': 'Canva Pro (1 Month)',
            'description': '1 month of Canva Pro for design',
            'category': 'tools',
            'refcoin_cost': 1500,
            'usd_value': 15.0,
            'provider': 'canva',
            'sort_order': 32
        },
        {
            'name': 'GitHub Copilot (1 Month)',
            'description': '1 month of GitHub Copilot for coding',
            'category': 'tools',
            'refcoin_cost': 5000,
            'usd_value': 50.0,
            'provider': 'github',
            'sort_order': 33
        },
        
        # Career development
        {
            'name': 'Mock Interview Session',
            'description': '30-minute professional mock interview',
            'category': 'career_development',
            'refcoin_cost': 500,
            'usd_value': 50.0,
            'sort_order': 40
        },
        {
            'name': 'Resume Review by Expert',
            'description': 'Professional resume review and feedback',
            'category': 'career_development',
            'refcoin_cost': 200,
            'usd_value': 20.0,
            'sort_order': 41
        },
        {
            'name': 'Career Coaching Session',
            'description': '30-minute personalized career coaching',
            'category': 'career_development',
            'refcoin_cost': 800,
            'usd_value': 80.0,
            'featured': True,
            'sort_order': 42
        },
        {
            'name': 'Industry Report Access',
            'description': 'Access to detailed industry trends report',
            'category': 'career_development',
            'refcoin_cost': 300,
            'usd_value': 30.0,
            'sort_order': 43
        }
    ]
    
    # Insert reward items
    for reward in rewards:
        insert_query = """
            INSERT OR IGNORE INTO reward_items (
                name, description, category, refcoin_cost, premium_token_cost,
                usd_value, provider, featured, sort_order
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        """
        DatabaseManager.execute_query(
            insert_query,
            (
                reward['name'], reward['description'], reward['category'],
                reward.get('refcoin_cost'), reward.get('premium_token_cost'),
                reward.get('usd_value'), reward.get('provider'),
                reward.get('featured', False), reward.get('sort_order', 0)
            )
        )
    
    print(f"✅ Seeded {len(rewards)} reward items!")

def seed_coin_packs():
    """Seed the database with coin packs"""
    print("💰 Seeding coin packs...")
    
    coin_packs = [
        {
            'name': 'Starter Pack',
            'description': 'Perfect for getting started with RefCoins',
            'usd_price': 4.99,
            'refcoins_amount': 75,
            'bonus_refcoins': 0,
            'premium_tokens_amount': 0,
            'sort_order': 1
        },
        {
            'name': 'Standard Pack',
            'description': 'Great value with bonus RefCoins',
            'usd_price': 9.99,
            'refcoins_amount': 150,
            'bonus_refcoins': 25,
            'premium_tokens_amount': 0,
            'featured': True,
            'sort_order': 2
        },
        {
            'name': 'Premium Pack',
            'description': 'Best deal with Premium Tokens included',
            'usd_price': 24.99,
            'refcoins_amount': 400,
            'bonus_refcoins': 50,
            'premium_tokens_amount': 2,
            'featured': True,
            'sort_order': 3
        },
        {
            'name': 'Enterprise Pack',
            'description': 'Maximum value for serious users',
            'usd_price': 49.99,
            'refcoins_amount': 850,
            'bonus_refcoins': 100,
            'premium_tokens_amount': 5,
            'sort_order': 4
        }
    ]
    
    # Insert coin packs
    for pack in coin_packs:
        insert_query = """
            INSERT OR IGNORE INTO coin_packs (
                name, description, usd_price, refcoins_amount, 
                bonus_refcoins, premium_tokens_amount, is_featured, sort_order
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        """
        DatabaseManager.execute_query(
            insert_query,
            (
                pack['name'], pack['description'], pack['usd_price'],
                pack['refcoins_amount'], pack['bonus_refcoins'],
                pack['premium_tokens_amount'], pack.get('featured', False),
                pack['sort_order']
            )
        )
    
    print(f"✅ Seeded {len(coin_packs)} coin packs!")

def create_indexes():
    """Create database indexes for performance"""
    print("📊 Creating database indexes...")
    
    indexes = [
        "CREATE INDEX IF NOT EXISTS idx_user_wallets_user_id ON user_wallets(user_id)",
        "CREATE INDEX IF NOT EXISTS idx_coin_transactions_wallet_id ON coin_transactions(wallet_id)",
        "CREATE INDEX IF NOT EXISTS idx_coin_transactions_source ON coin_transactions(source)",
        "CREATE INDEX IF NOT EXISTS idx_coin_transactions_created_at ON coin_transactions(created_at)",
        "CREATE INDEX IF NOT EXISTS idx_leaderboard_entries_type_period ON leaderboard_entries(leaderboard_type, period)",
        "CREATE INDEX IF NOT EXISTS idx_leaderboard_entries_user_id ON leaderboard_entries(user_id)",
        "CREATE INDEX IF NOT EXISTS idx_reward_purchases_user_id ON reward_purchases(user_id)",
        "CREATE INDEX IF NOT EXISTS idx_reward_items_category ON reward_items(category)"
    ]
    
    for index_query in indexes:
        DatabaseManager.execute_query(index_query)
    
    print("✅ Database indexes created!")

def init_coins_system():
    """Initialize the complete coins system"""
    print("🚀 Initializing Coins Reward System...")
    print("=" * 50)
    
    try:
        create_coins_tables()
        seed_achievements()
        seed_reward_items()
        seed_coin_packs()
        create_indexes()
        
        print("=" * 50)
        print("🎉 Coins Reward System initialized successfully!")
        print("\nSystem includes:")
        print("  • User wallets for RefCoins and Premium Tokens")
        print("  • Achievement system with 8 initial achievements")
        print("  • Reward store with 17 items across 5 categories")
        print("  • 4 coin packs for purchasing")
        print("  • Leaderboard system")
        print("  • Complete transaction tracking")
        print("\nNext steps:")
        print("  1. Start the backend server")
        print("  2. Test the coins endpoints")
        print("  3. Implement frontend components")
        
    except Exception as e:
        print(f"❌ Failed to initialize coins system: {e}")
        raise

if __name__ == "__main__":
    init_coins_system() 