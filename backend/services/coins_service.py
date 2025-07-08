"""
Coins Reward System Service

Handles all coin-related operations including:
- Wallet management
- Coin transactions
- Achievements
- Leaderboards
- Reward redemptions
"""

import json
from typing import Dict, List, Optional, Any, Tuple
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from sqlalchemy import func, and_, or_, desc
import sqlite3
from database import DatabaseManager
from models import (
    UserWallet, CoinTransaction, Achievement, UserAchievement, RewardItem, 
    RewardPurchase, LeaderboardEntry, CoinPack, CoinType, TransactionType, 
    TransactionStatus, AchievementType, RewardCategory
)

class CoinsService:
    """Service for managing the coins reward system"""
    
    # Exchange rates (in smallest units)
    REFCOIN_TO_USD = 0.01  # 1 RC = $0.01 USD (so 100 RC = $1)
    PREMIUM_TOKEN_TO_USD = 0.10  # 1 PT = $0.10 USD (so 10 PT = $1)
    
    @staticmethod
    def get_or_create_wallet(user_id: int) -> Dict[str, Any]:
        """Get or create user wallet"""
        query = "SELECT * FROM user_wallets WHERE user_id = ?"
        wallet = DatabaseManager.execute_query(query, (user_id,), fetch_one=True)
        
        if not wallet:
            # Create new wallet
            insert_query = """
                INSERT INTO user_wallets (
                    user_id, refcoin_balance, premium_token_balance,
                    total_earned_refcoins, total_spent_refcoins,
                    total_earned_premium_tokens, total_spent_premium_tokens,
                    created_at, updated_at
                ) VALUES (?, 0, 0, 0, 0, 0, 0, ?, ?)
            """
            now = datetime.utcnow()
            DatabaseManager.execute_query(insert_query, (user_id, now, now))
            
            # Get the created wallet
            wallet = DatabaseManager.execute_query(query, (user_id,), fetch_one=True)
        
        return wallet

    @staticmethod
    def add_coins(
        user_id: int, 
        coin_type: str, 
        amount: int, 
        source: str, 
        source_id: Optional[str] = None,
        description: Optional[str] = None,
        transaction_metadata: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """Add coins to user wallet"""
        wallet = CoinsService.get_or_create_wallet(user_id)
        
        # Calculate new balance
        if coin_type == CoinType.REFCOIN:
            new_balance = wallet['refcoin_balance'] + amount
            balance_field = 'refcoin_balance'
            earned_field = 'total_earned_refcoins'
        else:
            new_balance = wallet['premium_token_balance'] + amount
            balance_field = 'premium_token_balance'
            earned_field = 'total_earned_premium_tokens'
        
        # Update wallet
        update_wallet_query = f"""
            UPDATE user_wallets 
            SET {balance_field} = ?, {earned_field} = {earned_field} + ?, updated_at = ?
            WHERE user_id = ?
        """
        DatabaseManager.execute_query(
            update_wallet_query, 
            (new_balance, amount, datetime.utcnow(), user_id)
        )
        
        # Create transaction record
        transaction = CoinsService._create_transaction(
            wallet['id'], TransactionType.EARNED, coin_type, amount, 
            new_balance, source, source_id, description, transaction_metadata
        )
        
        return {
            'transaction': transaction,
            'new_balance': new_balance,
            'amount_added': amount
        }

    @staticmethod
    def spend_coins(
        user_id: int, 
        coin_type: str, 
        amount: int, 
        source: str,
        source_id: Optional[str] = None,
        description: Optional[str] = None,
        transaction_metadata: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """Spend coins from user wallet"""
        wallet = CoinsService.get_or_create_wallet(user_id)
        
        # Check balance
        current_balance = wallet['refcoin_balance'] if coin_type == CoinType.REFCOIN else wallet['premium_token_balance']
        if current_balance < amount:
            raise ValueError(f"Insufficient {coin_type} balance. Current: {current_balance}, Required: {amount}")
        
        # Calculate new balance
        new_balance = current_balance - amount
        
        if coin_type == CoinType.REFCOIN:
            balance_field = 'refcoin_balance'
            spent_field = 'total_spent_refcoins'
        else:
            balance_field = 'premium_token_balance'
            spent_field = 'total_spent_premium_tokens'
        
        # Update wallet
        update_wallet_query = f"""
            UPDATE user_wallets 
            SET {balance_field} = ?, {spent_field} = {spent_field} + ?, updated_at = ?
            WHERE user_id = ?
        """
        DatabaseManager.execute_query(
            update_wallet_query, 
            (new_balance, amount, datetime.utcnow(), user_id)
        )
        
        # Create transaction record
        transaction = CoinsService._create_transaction(
            wallet['id'], TransactionType.SPENT, coin_type, amount, 
            new_balance, source, source_id, description, transaction_metadata
        )
        
        return {
            'transaction': transaction,
            'new_balance': new_balance,
            'amount_spent': amount
        }

    @staticmethod
    def _create_transaction(
        wallet_id: int, 
        transaction_type: str, 
        coin_type: str, 
        amount: int,
        balance_after: int, 
        source: str, 
        source_id: Optional[str] = None,
        description: Optional[str] = None, 
        transaction_metadata: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """Create a coin transaction record"""
        insert_query = """
            INSERT INTO coin_transactions (
                wallet_id, transaction_type, coin_type, amount, balance_after,
                status, source, source_id, description, metadata, created_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """
        
        metadata_json = json.dumps(transaction_metadata) if transaction_metadata else None
        transaction_id = DatabaseManager.execute_query(
            insert_query,
            (
                wallet_id, transaction_type, coin_type, amount, balance_after,
                TransactionStatus.COMPLETED, source, source_id, description, 
                metadata_json, datetime.utcnow()
            )
        )
        
        return {'id': transaction_id, 'amount': amount, 'type': transaction_type}

    @staticmethod
    def get_wallet_info(user_id: int) -> Dict[str, Any]:
        """Get complete wallet information"""
        wallet = CoinsService.get_or_create_wallet(user_id)
        
        return {
            'refcoin_balance': wallet['refcoin_balance'],
            'premium_token_balance': wallet['premium_token_balance'],
            'total_earned_refcoins': wallet['total_earned_refcoins'],
            'total_spent_refcoins': wallet['total_spent_refcoins'],
            'total_earned_premium_tokens': wallet['total_earned_premium_tokens'],
            'total_spent_premium_tokens': wallet['total_spent_premium_tokens'],
            'refcoin_usd_value': wallet['refcoin_balance'] * CoinsService.REFCOIN_TO_USD,
            'premium_token_usd_value': wallet['premium_token_balance'] * CoinsService.PREMIUM_TOKEN_TO_USD
        }

    @staticmethod
    def get_transaction_history(user_id: int, limit: int = 50, offset: int = 0) -> List[Dict[str, Any]]:
        """Get user transaction history"""
        query = """
            SELECT ct.*, uw.user_id
            FROM coin_transactions ct
            JOIN user_wallets uw ON ct.wallet_id = uw.id
            WHERE uw.user_id = ?
            ORDER BY ct.created_at DESC
            LIMIT ? OFFSET ?
        """
        
        transactions = DatabaseManager.execute_query(query, (user_id, limit, offset), fetch_all=True)
        
        # Parse metadata for each transaction
        for transaction in transactions:
            if transaction['metadata']:
                transaction['metadata'] = json.loads(transaction['metadata'])
        
        return transactions

    @staticmethod
    def check_and_award_achievements(user_id: int, action: str, **kwargs) -> List[Dict[str, Any]]:
        """Check if user has unlocked any achievements and award them"""
        awarded_achievements = []
        
        # Get all active achievements
        achievements_query = "SELECT * FROM achievements WHERE is_active = 1"
        achievements = DatabaseManager.execute_query(achievements_query, fetch_all=True)
        
        for achievement in achievements:
            # Check if user already has this achievement and if it's repeatable
            user_achievement_query = """
                SELECT * FROM user_achievements 
                WHERE user_id = ? AND achievement_id = ?
            """
            user_achievement = DatabaseManager.execute_query(
                user_achievement_query, (user_id, achievement['id']), fetch_one=True
            )
            
            try:
                requirements = json.loads(achievement['requirements']) if achievement['requirements'] else {}
            except (json.JSONDecodeError, TypeError):
                requirements = {}
            should_award = False
            
            # Check different achievement types
            if achievement['achievement_type'] == AchievementType.PROFILE:
                should_award = CoinsService._check_profile_achievement(user_id, requirements, action, **kwargs)
            elif achievement['achievement_type'] == AchievementType.REFERRAL:
                should_award = CoinsService._check_referral_achievement(user_id, requirements, action, **kwargs)
            elif achievement['achievement_type'] == AchievementType.NETWORKING:
                should_award = CoinsService._check_networking_achievement(user_id, requirements, action, **kwargs)
            
            if should_award:
                if not user_achievement:
                    # Create new user achievement
                    awarded_achievements.append(
                        CoinsService._award_achievement(user_id, achievement)
                    )
                elif achievement['is_repeatable'] and user_achievement['is_completed']:
                    # Award repeatable achievement
                    awarded_achievements.append(
                        CoinsService._award_achievement(user_id, achievement, user_achievement)
                    )
        
        return awarded_achievements

    @staticmethod
    def _check_profile_achievement(user_id: int, requirements: Dict[str, Any], action: str, **kwargs) -> bool:
        """Check profile-related achievements"""
        if requirements.get('action') != action:
            return False
            
        if action == 'profile_completion':
            # Check if profile is 100% complete
            user_query = "SELECT * FROM users WHERE id = ?"
            user = DatabaseManager.execute_query(user_query, (user_id,), fetch_one=True)
            
            required_fields = requirements.get('required_fields', [])
            for field in required_fields:
                if not user.get(field):
                    return False
            return True
            
        elif action == 'resume_upload':
            # Check number of resumes uploaded
            resume_count = kwargs.get('resume_count', 0)
            return resume_count >= requirements.get('min_resumes', 1)
        
        return False

    @staticmethod
    def _check_referral_achievement(user_id: int, requirements: Dict[str, Any], action: str, **kwargs) -> bool:
        """Check referral-related achievements"""
        if requirements.get('action') != action:
            return False
            
        if action == 'successful_referral':
            # Count successful referrals
            count_query = """
                SELECT COUNT(*) as count FROM referrals 
                WHERE candidate_id = ? AND status = 'hired'
            """
            result = DatabaseManager.execute_query(count_query, (user_id,), fetch_one=True)
            return result['count'] >= requirements.get('min_count', 1)
        
        return False

    @staticmethod
    def _check_networking_achievement(user_id: int, requirements: Dict[str, Any], action: str, **kwargs) -> bool:
        """Check networking-related achievements"""
        if requirements.get('action') != action:
            return False
            
        if action == 'employee_connection':
            # Count unique employee connections
            count_query = """
                SELECT COUNT(DISTINCT employee_id) as count FROM referrals 
                WHERE candidate_id = ?
            """
            result = DatabaseManager.execute_query(count_query, (user_id,), fetch_one=True)
            return result['count'] >= requirements.get('min_connections', 1)
        
        return False

    @staticmethod
    def _award_achievement(user_id: int, achievement: Dict[str, Any], existing_user_achievement: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        """Award achievement to user"""
        if existing_user_achievement:
            # Update existing achievement
            update_query = """
                UPDATE user_achievements 
                SET completion_count = completion_count + 1, 
                    coins_rewarded = coins_rewarded + ?,
                    updated_at = ?
                WHERE id = ?
            """
            total_reward = achievement['reward_refcoins'] + achievement['reward_premium_tokens']
            DatabaseManager.execute_query(
                update_query, 
                (total_reward, datetime.utcnow(), existing_user_achievement['id'])
            )
        else:
            # Create new achievement
            insert_query = """
                INSERT INTO user_achievements (
                    user_id, achievement_id, progress, max_progress, 
                    is_completed, completed_at, completion_count, 
                    coins_rewarded, created_at, updated_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """
            now = datetime.utcnow()
            total_reward = achievement['reward_refcoins'] + achievement['reward_premium_tokens']
            DatabaseManager.execute_query(
                insert_query,
                (
                    user_id, achievement['id'], 1, 1, True, now, 1,
                    total_reward, now, now
                )
            )
        
        # Award coins
        if achievement['reward_refcoins'] > 0:
            CoinsService.add_coins(
                user_id, CoinType.REFCOIN, achievement['reward_refcoins'],
                'achievement', str(achievement['id']),
                f"Achievement unlocked: {achievement['name']}"
            )
        
        if achievement['reward_premium_tokens'] > 0:
            CoinsService.add_coins(
                user_id, CoinType.PREMIUM_TOKEN, achievement['reward_premium_tokens'],
                'achievement', str(achievement['id']),
                f"Achievement unlocked: {achievement['name']}"
            )
        
        return {
            'achievement': achievement,
            'refcoins_awarded': achievement['reward_refcoins'],
            'premium_tokens_awarded': achievement['reward_premium_tokens']
        }

    @staticmethod
    def get_user_achievements(user_id: int) -> List[Dict[str, Any]]:
        """Get all achievements for a user"""
        query = """
            SELECT a.*, 
                   COALESCE(ua.progress, 0) as progress, 
                   COALESCE(ua.max_progress, 1) as max_progress, 
                   COALESCE(ua.is_completed, 0) as is_completed, 
                   ua.completed_at, 
                   COALESCE(ua.completion_count, 0) as completion_count
            FROM achievements a
            LEFT JOIN user_achievements ua ON a.id = ua.achievement_id AND ua.user_id = ?
            WHERE a.is_active = 1
            ORDER BY a.achievement_type, a.name
        """
        
        achievements = DatabaseManager.execute_query(query, (user_id,), fetch_all=True)
        
        # Parse requirements for each achievement
        for achievement in achievements:
            try:
                if achievement['requirements']:
                    achievement['requirements'] = json.loads(achievement['requirements'])
                else:
                    achievement['requirements'] = {}
            except (json.JSONDecodeError, TypeError):
                achievement['requirements'] = {}
            # Convert SQLite boolean (0/1) to Python boolean
            achievement['is_completed'] = bool(achievement['is_completed'])
        
        return achievements

    @staticmethod
    def get_leaderboard(leaderboard_type: str, period: str, limit: int = 100) -> List[Dict[str, Any]]:
        """Get leaderboard entries"""
        query = """
            SELECT le.*, u.name, u.avatar_url, u.role
            FROM leaderboard_entries le
            JOIN users u ON le.user_id = u.id
            WHERE le.leaderboard_type = ? AND le.period = ?
            ORDER BY le.rank ASC
            LIMIT ?
        """
        
        entries = DatabaseManager.execute_query(query, (leaderboard_type, period, limit), fetch_all=True)
        
        # Parse leaderboard_metadata
        for entry in entries:
            if entry['leaderboard_metadata']:
                entry['leaderboard_metadata'] = json.loads(entry['leaderboard_metadata'])
        
        return entries

    @staticmethod
    def update_leaderboards():
        """Update all leaderboards with current data"""
        # Weekly earnings leaderboard
        CoinsService._update_weekly_earnings_leaderboard()
        
        # Monthly success leaderboard
        CoinsService._update_monthly_success_leaderboard()

    @staticmethod
    def _update_weekly_earnings_leaderboard():
        """Update weekly earnings leaderboard"""
        # Calculate current week
        now = datetime.utcnow()
        year, week, _ = now.isocalendar()
        period = f"{year}-W{week:02d}"
        
        # Get top earners this week
        query = """
            SELECT uw.user_id, SUM(ct.amount) as total_earned
            FROM coin_transactions ct
            JOIN user_wallets uw ON ct.wallet_id = uw.id
            WHERE ct.transaction_type = 'earned' 
              AND ct.created_at >= date('now', 'weekday 0', '-6 days')
              AND ct.created_at < date('now', 'weekday 0', '+1 day')
            GROUP BY uw.user_id
            ORDER BY total_earned DESC
            LIMIT 100
        """
        
        top_earners = DatabaseManager.execute_query(query, fetch_all=True)
        
        # Clear existing entries for this period
        DatabaseManager.execute_query(
            "DELETE FROM leaderboard_entries WHERE leaderboard_type = ? AND period = ?",
            ('weekly_earnings', period)
        )
        
        # Insert new entries
        for rank, entry in enumerate(top_earners, 1):
            insert_query = """
                INSERT INTO leaderboard_entries 
                (user_id, leaderboard_type, period, score, rank, created_at, updated_at)
                VALUES (?, ?, ?, ?, ?, ?, ?)
            """
            now = datetime.utcnow()
            DatabaseManager.execute_query(
                insert_query,
                (entry['user_id'], 'weekly_earnings', period, entry['total_earned'], rank, now, now)
            )

    @staticmethod
    def _update_monthly_success_leaderboard():
        """Update monthly success leaderboard"""
        # Calculate current month
        now = datetime.utcnow()
        period = now.strftime("%Y-%m")
        
        # Get top performers this month (based on successful referrals + achievements)
        query = """
            SELECT u.id as user_id, 
                   (SELECT COUNT(*) FROM referrals r WHERE r.candidate_id = u.id AND r.status = 'hired' 
                    AND strftime('%Y-%m', r.updated_at) = ?) * 100 +
                   (SELECT COUNT(*) FROM user_achievements ua WHERE ua.user_id = u.id AND ua.is_completed = 1
                    AND strftime('%Y-%m', ua.completed_at) = ?) as score
            FROM users u
            WHERE u.is_active = 1
            ORDER BY score DESC
            LIMIT 100
        """
        
        top_performers = DatabaseManager.execute_query(query, (period, period), fetch_all=True)
        
        # Clear existing entries for this period
        DatabaseManager.execute_query(
            "DELETE FROM leaderboard_entries WHERE leaderboard_type = ? AND period = ?",
            ('monthly_success', period)
        )
        
        # Insert new entries
        for rank, entry in enumerate(top_performers, 1):
            if entry['score'] > 0:  # Only include users with actual activity
                insert_query = """
                    INSERT INTO leaderboard_entries 
                    (user_id, leaderboard_type, period, score, rank, created_at, updated_at)
                    VALUES (?, ?, ?, ?, ?, ?, ?)
                """
                now = datetime.utcnow()
                DatabaseManager.execute_query(
                    insert_query,
                    (entry['user_id'], 'monthly_success', period, entry['score'], rank, now, now)
                )

    @staticmethod
    def get_earning_opportunities(user_id: int) -> List[Dict[str, Any]]:
        """Get personalized earning opportunities for user"""
        opportunities = []
        
        # Get user data
        user_query = "SELECT * FROM users WHERE id = ?"
        user = DatabaseManager.execute_query(user_query, (user_id,), fetch_one=True)
        
        if not user:
            return opportunities
        
        # Profile completion opportunities
        if not user.get('bio'):
            opportunities.append({
                'source': 'profile_completion',
                'description': 'Complete your bio to earn RefCoins',
                'potential_refcoins': 25,
                'potential_premium_tokens': 0,
                'action_url': '/profile/edit',
                'is_available': True
            })
        
        # Resume upload opportunities
        resume_count_query = """
            SELECT COUNT(*) as count FROM referrals 
            WHERE candidate_id = ? AND resume_url IS NOT NULL
        """
        resume_result = DatabaseManager.execute_query(resume_count_query, (user_id,), fetch_one=True)
        
        if resume_result['count'] == 0:
            opportunities.append({
                'source': 'resume_upload',
                'description': 'Upload your first resume to earn RefCoins',
                'potential_refcoins': 25,
                'potential_premium_tokens': 0,
                'action_url': '/referrals/new',
                'is_available': True
            })
        
        # Daily login opportunities
        opportunities.append({
            'source': 'daily_login',
            'description': 'Continue your login streak for bonus RefCoins',
            'potential_refcoins': 10,
            'potential_premium_tokens': 0,
            'action_url': None,
            'is_available': True
        })
        
        return opportunities

    @staticmethod
    def purchase_reward(user_id: int, reward_item_id: int) -> Dict[str, Any]:
        """Purchase a reward item"""
        # Get reward item
        reward_query = "SELECT * FROM reward_items WHERE id = ? AND is_available = 1"
        reward = DatabaseManager.execute_query(reward_query, (reward_item_id,), fetch_one=True)
        
        if not reward:
            raise ValueError("Reward item not found or not available")
        
        # Check if user has enough coins
        wallet = CoinsService.get_or_create_wallet(user_id)
        
        if reward['refcoin_cost'] and wallet['refcoin_balance'] < reward['refcoin_cost']:
            raise ValueError("Insufficient RefCoins")
        
        if reward['premium_token_cost'] and wallet['premium_token_balance'] < reward['premium_token_cost']:
            raise ValueError("Insufficient Premium Tokens")
        
        # Create purchase record
        purchase_query = """
            INSERT INTO reward_purchases 
            (user_id, reward_item_id, refcoin_cost, premium_token_cost, status, created_at)
            VALUES (?, ?, ?, ?, ?, ?)
        """
        purchase_id = DatabaseManager.execute_query(
            purchase_query,
            (user_id, reward_item_id, reward['refcoin_cost'], reward['premium_token_cost'], 'pending', datetime.utcnow())
        )
        
        # Spend coins
        transaction_ids = []
        
        if reward['refcoin_cost'] and reward['refcoin_cost'] > 0:
            result = CoinsService.spend_coins(
                user_id, CoinType.REFCOIN, reward['refcoin_cost'],
                'reward_purchase', str(reward_item_id),
                f"Purchased: {reward['name']}"
            )
            transaction_ids.append(result['transaction']['id'])
        
        if reward['premium_token_cost'] and reward['premium_token_cost'] > 0:
            result = CoinsService.spend_coins(
                user_id, CoinType.PREMIUM_TOKEN, reward['premium_token_cost'],
                'reward_purchase', str(reward_item_id),
                f"Purchased: {reward['name']}"
            )
            transaction_ids.append(result['transaction']['id'])
        
        return {
            'purchase_id': purchase_id,
            'reward': reward,
            'transaction_ids': transaction_ids,
            'status': 'pending'
        } 