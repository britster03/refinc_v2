"""
Coins Reward System API Endpoints

Provides RESTful APIs for:
- Wallet management
- Coin transactions
- Achievements system
- Leaderboards
- Reward store
- Coin purchasing
"""

from fastapi import APIRouter, HTTPException, Depends, Query, status, BackgroundTasks
from fastapi.security import HTTPBearer
from typing import List, Optional, Dict, Any
from datetime import datetime, timedelta
import json
import stripe
import os
from sqlalchemy.orm import Session

from models import (
    WalletResponse, CoinTransactionCreate, CoinTransactionResponse,
    AchievementResponse, UserAchievementProgress, RewardItemResponse,
    RewardPurchaseCreate, RewardPurchaseResponse, LeaderboardEntryResponse,
    CoinPackResponse, CoinPackPurchaseCreate, EarningOpportunity, CoinsAnalytics,
    CoinType, TransactionType, AchievementType, RewardCategory
)
from database import DatabaseManager
from auth_utils import get_current_user
from services.coins_service import CoinsService

# Initialize Stripe
stripe.api_key = os.getenv("STRIPE_SECRET_KEY")

router = APIRouter()
security = HTTPBearer()

# ================================
# WALLET ENDPOINTS
# ================================

@router.get("/wallet", response_model=WalletResponse)
async def get_wallet(current_user: dict = Depends(get_current_user)):
    """Get user's wallet information"""
    try:
        wallet_info = CoinsService.get_wallet_info(current_user['id'])
        return WalletResponse(**wallet_info)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get wallet: {str(e)}")

@router.get("/wallet/transactions", response_model=List[CoinTransactionResponse])
async def get_transaction_history(
    limit: int = Query(50, ge=1, le=100),
    offset: int = Query(0, ge=0),
    current_user: dict = Depends(get_current_user)
):
    """Get user's transaction history"""
    try:
        transactions = CoinsService.get_transaction_history(current_user['id'], limit, offset)
        return [CoinTransactionResponse(**tx) for tx in transactions]
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get transactions: {str(e)}")

@router.get("/wallet/earning-opportunities", response_model=List[EarningOpportunity])
async def get_earning_opportunities(current_user: dict = Depends(get_current_user)):
    """Get personalized earning opportunities for the user"""
    try:
        opportunities = CoinsService.get_earning_opportunities(current_user['id'])
        return [EarningOpportunity(**opp) for opp in opportunities]
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get opportunities: {str(e)}")

# ================================
# ACHIEVEMENTS ENDPOINTS
# ================================

@router.get("/achievements", response_model=List[AchievementResponse])
async def get_user_achievements(current_user: dict = Depends(get_current_user)):
    """Get all achievements for the user"""
    try:
        achievements = CoinsService.get_user_achievements(current_user['id'])
        return [AchievementResponse(**achievement) for achievement in achievements]
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get achievements: {str(e)}")

@router.post("/achievements/check")
async def check_achievements(
    action: str,
    metadata: Optional[Dict[str, Any]] = None,
    current_user: dict = Depends(get_current_user)
):
    """Manually trigger achievement checking for specific actions"""
    try:
        awarded = CoinsService.check_and_award_achievements(
            current_user['id'], action, **(metadata or {})
        )
        return {
            "achievements_awarded": len(awarded),
            "details": awarded
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to check achievements: {str(e)}")

# ================================
# LEADERBOARD ENDPOINTS
# ================================

@router.get("/leaderboards/{leaderboard_type}", response_model=List[LeaderboardEntryResponse])
async def get_leaderboard(
    leaderboard_type: str,
    period: Optional[str] = None,
    limit: int = Query(100, ge=1, le=500),
    current_user: dict = Depends(get_current_user)
):
    """Get leaderboard entries"""
    try:
        # If no period specified, use current period
        if not period:
            now = datetime.utcnow()
            if leaderboard_type == "weekly_earnings":
                year, week, _ = now.isocalendar()
                period = f"{year}-W{week:02d}"
            elif leaderboard_type == "monthly_success":
                period = now.strftime("%Y-%m")
            else:
                raise HTTPException(status_code=400, detail="Invalid leaderboard type")
        
        entries = CoinsService.get_leaderboard(leaderboard_type, period, limit)
        
        # Transform to response format
        result = []
        for entry in entries:
            user_data = {
                'id': entry['user_id'],
                'name': entry['name'],
                'role': entry['role'],
                'avatar_url': entry['avatar_url']
            }
            result.append(LeaderboardEntryResponse(
                user=user_data,
                rank=entry['rank'],
                score=entry['score'],
                leaderboard_metadata=entry.get('leaderboard_metadata')
            ))
        
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get leaderboard: {str(e)}")

@router.get("/leaderboards/{leaderboard_type}/my-rank")
async def get_my_leaderboard_rank(
    leaderboard_type: str,
    period: Optional[str] = None,
    current_user: dict = Depends(get_current_user)
):
    """Get current user's rank in a leaderboard"""
    try:
        if not period:
            now = datetime.utcnow()
            if leaderboard_type == "weekly_earnings":
                year, week, _ = now.isocalendar()
                period = f"{year}-W{week:02d}"
            elif leaderboard_type == "monthly_success":
                period = now.strftime("%Y-%m")
        
        query = """
            SELECT rank, score FROM leaderboard_entries 
            WHERE user_id = ? AND leaderboard_type = ? AND period = ?
        """
        entry = DatabaseManager.execute_query(
            query, (current_user['id'], leaderboard_type, period), fetch_one=True
        )
        
        if entry:
            return {
                "rank": entry['rank'],
                "score": entry['score'],
                "period": period
            }
        else:
            return {
                "rank": None,
                "score": 0,
                "period": period,
                "message": "Not ranked yet"
            }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get rank: {str(e)}")

# ================================
# REWARD STORE ENDPOINTS
# ================================

@router.get("/rewards", response_model=List[RewardItemResponse])
async def get_reward_items(
    category: Optional[RewardCategory] = None,
    featured_only: bool = False,
    limit: int = Query(50, ge=1, le=100),
    offset: int = Query(0, ge=0),
    current_user: dict = Depends(get_current_user)
):
    """Get available reward items"""
    try:
        # Build query
        where_conditions = ["is_available = 1"]
        params = []
        
        if category:
            where_conditions.append("category = ?")
            params.append(category.value)
        
        if featured_only:
            where_conditions.append("featured = 1")
        
        where_clause = " AND ".join(where_conditions)
        
        query = f"""
            SELECT * FROM reward_items 
            WHERE {where_clause}
            ORDER BY featured DESC, sort_order ASC, name ASC
            LIMIT ? OFFSET ?
        """
        params.extend([limit, offset])
        
        rewards = DatabaseManager.execute_query(query, tuple(params), fetch_all=True)
        return [RewardItemResponse(**reward) for reward in rewards]
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get rewards: {str(e)}")

@router.get("/rewards/{reward_id}", response_model=RewardItemResponse)
async def get_reward_item(
    reward_id: int,
    current_user: dict = Depends(get_current_user)
):
    """Get specific reward item details"""
    try:
        query = "SELECT * FROM reward_items WHERE id = ? AND is_available = 1"
        reward = DatabaseManager.execute_query(query, (reward_id,), fetch_one=True)
        
        if not reward:
            raise HTTPException(status_code=404, detail="Reward item not found")
        
        return RewardItemResponse(**reward)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get reward: {str(e)}")

@router.post("/rewards/{reward_id}/purchase", response_model=RewardPurchaseResponse)
async def purchase_reward(
    reward_id: int,
    current_user: dict = Depends(get_current_user)
):
    """Purchase a reward item"""
    try:
        purchase_result = CoinsService.purchase_reward(current_user['id'], reward_id)
        
        # Get the reward details for response
        reward_query = "SELECT * FROM reward_items WHERE id = ?"
        reward = DatabaseManager.execute_query(reward_query, (reward_id,), fetch_one=True)
        
        return RewardPurchaseResponse(
            id=purchase_result['purchase_id'],
            reward_item=RewardItemResponse(**reward),
            refcoin_cost=reward.get('refcoin_cost'),
            premium_token_cost=reward.get('premium_token_cost'),
            status=purchase_result['status'],
            created_at=datetime.utcnow()
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to purchase reward: {str(e)}")

@router.get("/rewards/purchases", response_model=List[RewardPurchaseResponse])
async def get_user_purchases(
    limit: int = Query(50, ge=1, le=100),
    offset: int = Query(0, ge=0),
    current_user: dict = Depends(get_current_user)
):
    """Get user's reward purchase history"""
    try:
        query = """
            SELECT rp.*, ri.name, ri.description, ri.category, ri.image_url, ri.featured
            FROM reward_purchases rp
            JOIN reward_items ri ON rp.reward_item_id = ri.id
            WHERE rp.user_id = ?
            ORDER BY rp.created_at DESC
            LIMIT ? OFFSET ?
        """
        
        purchases = DatabaseManager.execute_query(
            query, (current_user['id'], limit, offset), fetch_all=True
        )
        
        result = []
        for purchase in purchases:
            reward_data = {
                'id': purchase['reward_item_id'],
                'name': purchase['name'],
                'description': purchase['description'],
                'category': purchase['category'],
                'image_url': purchase['image_url'],
                'featured': purchase['featured'],
                'is_available': True  # Default for response
            }
            
            result.append(RewardPurchaseResponse(
                id=purchase['id'],
                reward_item=RewardItemResponse(**reward_data),
                refcoin_cost=purchase['refcoin_cost'],
                premium_token_cost=purchase['premium_token_cost'],
                status=purchase['status'],
                fulfillment_data=json.loads(purchase['fulfillment_data']) if purchase['fulfillment_data'] else None,
                created_at=purchase['created_at']
            ))
        
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get purchases: {str(e)}")

# ================================
# COIN PACK PURCHASE ENDPOINTS
# ================================

@router.get("/coin-packs", response_model=List[CoinPackResponse])
async def get_coin_packs(current_user: dict = Depends(get_current_user)):
    """Get available coin packs for purchase"""
    try:
        query = """
            SELECT * FROM coin_packs 
            WHERE is_active = 1 
            ORDER BY is_featured DESC, sort_order ASC, usd_price ASC
        """
        
        packs = DatabaseManager.execute_query(query, fetch_all=True)
        return [CoinPackResponse(**pack) for pack in packs]
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get coin packs: {str(e)}")

@router.post("/coin-packs/{pack_id}/purchase")
async def purchase_coin_pack(
    pack_id: int,
    purchase_data: CoinPackPurchaseCreate,
    current_user: dict = Depends(get_current_user)
):
    """Purchase a coin pack with Stripe"""
    try:
        # Get coin pack
        pack_query = "SELECT * FROM coin_packs WHERE id = ? AND is_active = 1"
        pack = DatabaseManager.execute_query(pack_query, (pack_id,), fetch_one=True)
        
        if not pack:
            raise HTTPException(status_code=404, detail="Coin pack not found")
        
        # Create Stripe payment intent
        intent = stripe.PaymentIntent.create(
            amount=int(pack['usd_price'] * 100),  # Convert to cents
            currency="usd",
            payment_method=purchase_data.payment_method_id,
            metadata={
                'user_id': current_user['id'],
                'coin_pack_id': pack_id,
                'refcoins_amount': pack['refcoins_amount'],
                'bonus_refcoins': pack['bonus_refcoins'],
                'premium_tokens_amount': pack['premium_tokens_amount']
            },
            confirmation_method='manual',
            confirm=True
        )
        
        if intent.status == 'succeeded':
            # Add coins to user wallet
            total_refcoins = pack['refcoins_amount'] + pack['bonus_refcoins']
            
            if total_refcoins > 0:
                CoinsService.add_coins(
                    current_user['id'], CoinType.REFCOIN, total_refcoins,
                    'coin_pack_purchase', str(pack_id),
                    f"Purchased coin pack: {pack['name']}",
                    transaction_metadata={'payment_intent_id': intent.id}
                )
            
            if pack['premium_tokens_amount'] > 0:
                CoinsService.add_coins(
                    current_user['id'], CoinType.PREMIUM_TOKEN, pack['premium_tokens_amount'],
                    'coin_pack_purchase', str(pack_id),
                    f"Purchased coin pack: {pack['name']}",
                    transaction_metadata={'payment_intent_id': intent.id}
                )
            
            return {
                "success": True,
                "payment_intent_id": intent.id,
                "refcoins_added": total_refcoins,
                "premium_tokens_added": pack['premium_tokens_amount']
            }
        else:
            raise HTTPException(status_code=400, detail="Payment not successful")
            
    except stripe.error.StripeError as e:
        raise HTTPException(status_code=400, detail=f"Payment error: {str(e)}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to purchase coin pack: {str(e)}")

# ================================
# EARNING ENDPOINTS
# ================================

@router.post("/earn/daily-login")
async def claim_daily_login_bonus(current_user: dict = Depends(get_current_user)):
    """Claim daily login bonus"""
    try:
        # Check if user already claimed today
        today = datetime.utcnow().strftime('%Y-%m-%d')
        query = """
            SELECT * FROM coin_transactions ct
            JOIN user_wallets uw ON ct.wallet_id = uw.id
            WHERE uw.user_id = ? AND ct.source = 'daily_login' 
            AND DATE(ct.created_at) = ?
        """
        
        existing_claim = DatabaseManager.execute_query(
            query, (current_user['id'], today), fetch_one=True
        )
        
        if existing_claim:
            raise HTTPException(status_code=400, detail="Daily bonus already claimed today")
        
        # Calculate bonus amount (could be based on streak)
        bonus_amount = 10  # Base daily bonus
        
        # Add coins
        result = CoinsService.add_coins(
            current_user['id'], CoinType.REFCOIN, bonus_amount,
            'daily_login', None, "Daily login bonus"
        )
        
        # Check for achievements
        achievements = CoinsService.check_and_award_achievements(
            current_user['id'], 'daily_login'
        )
        
        return {
            "bonus_amount": bonus_amount,
            "new_balance": result['new_balance'],
            "achievements_awarded": achievements
        }
    except HTTPException:
        # Re-raise HTTPExceptions (like our 400 error) without modification
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to claim bonus: {str(e)}")

@router.post("/earn/profile-completion")
async def claim_profile_completion_bonus(current_user: dict = Depends(get_current_user)):
    """Claim bonus for completing profile"""
    try:
        # Check if profile is complete
        user_query = "SELECT * FROM users WHERE id = ?"
        user = DatabaseManager.execute_query(user_query, (current_user['id'],), fetch_one=True)
        
        # Check if already claimed
        existing_query = """
            SELECT * FROM coin_transactions ct
            JOIN user_wallets uw ON ct.wallet_id = uw.id
            WHERE uw.user_id = ? AND ct.source = 'profile_completion'
        """
        existing_claim = DatabaseManager.execute_query(
            existing_query, (current_user['id'],), fetch_one=True
        )
        
        if existing_claim:
            raise HTTPException(status_code=400, detail="Profile completion bonus already claimed")
        
        # Check if profile is actually complete
        required_fields = ['name', 'bio', 'position', 'company', 'skills']
        for field in required_fields:
            if not user.get(field):
                raise HTTPException(
                    status_code=400, 
                    detail=f"Profile incomplete: missing {field}"
                )
        
        bonus_amount = 50
        result = CoinsService.add_coins(
            current_user['id'], CoinType.REFCOIN, bonus_amount,
            'profile_completion', None, "Profile completion bonus"
        )
        
        # Check achievements
        achievements = CoinsService.check_and_award_achievements(
            current_user['id'], 'profile_completion'
        )
        
        return {
            "bonus_amount": bonus_amount,
            "new_balance": result['new_balance'],
            "achievements_awarded": achievements
        }
    except HTTPException:
        # Re-raise HTTPExceptions (like our 400 errors) without modification
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to claim bonus: {str(e)}")

# ================================
# ADMIN ENDPOINTS
# ================================

@router.get("/admin/analytics", response_model=CoinsAnalytics)
async def get_coins_analytics(current_user: dict = Depends(get_current_user)):
    """Get coins system analytics (admin only)"""
    if current_user.get('role') != 'admin':
        raise HTTPException(status_code=403, detail="Admin access required")
    
    try:
        # Get total users with coins
        users_query = "SELECT COUNT(*) as count FROM user_wallets WHERE refcoin_balance > 0 OR premium_token_balance > 0"
        users_result = DatabaseManager.execute_query(users_query, fetch_one=True)
        
        # Get total coins in circulation
        circulation_query = "SELECT SUM(refcoin_balance) as refcoins, SUM(premium_token_balance) as tokens FROM user_wallets"
        circulation_result = DatabaseManager.execute_query(circulation_query, fetch_one=True)
        
        # Get top earning sources
        sources_query = """
            SELECT source, COUNT(*) as transactions, SUM(amount) as total_amount
            FROM coin_transactions
            WHERE transaction_type = 'earned'
            GROUP BY source
            ORDER BY total_amount DESC
            LIMIT 10
        """
        sources = DatabaseManager.execute_query(sources_query, fetch_all=True)
        
        return CoinsAnalytics(
            total_users_with_coins=users_result['count'],
            total_refcoins_in_circulation=circulation_result['refcoins'] or 0,
            total_premium_tokens_in_circulation=circulation_result['tokens'] or 0,
            top_earning_sources=[dict(source) for source in sources],
            redemption_trends=[],  # Could be implemented later
            achievement_completion_rates=[]  # Could be implemented later
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get analytics: {str(e)}")

@router.post("/admin/leaderboards/update")
async def update_leaderboards(
    background_tasks: BackgroundTasks,
    current_user: dict = Depends(get_current_user)
):
    """Update all leaderboards (admin only)"""
    if current_user.get('role') != 'admin':
        raise HTTPException(status_code=403, detail="Admin access required")
    
    try:
        background_tasks.add_task(CoinsService.update_leaderboards)
        return {"message": "Leaderboard update initiated"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to update leaderboards: {str(e)}") 