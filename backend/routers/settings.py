from fastapi import APIRouter, HTTPException, status, Depends, Request
from typing import Dict, Any, Optional, List
import json
from datetime import datetime
from slowapi import Limiter
from slowapi.util import get_remote_address

from models import SuccessResponse
from auth_utils import get_current_user
from database import DatabaseManager
from routers.notifications import NotificationService, NotificationType

# Rate limiter
limiter = Limiter(key_func=get_remote_address)

router = APIRouter()

@router.get("/", response_model=Dict[str, Any])
async def get_user_settings(current_user = Depends(get_current_user)):
    """Get all user settings"""
    
    try:
        # Get notification settings
        notification_settings = DatabaseManager.execute_query(
            "SELECT * FROM user_notification_settings WHERE user_id = ?",
            (current_user["id"],),
            fetch_one=True
        )
        
        # Get privacy settings
        privacy_settings = DatabaseManager.execute_query(
            "SELECT * FROM user_privacy_settings WHERE user_id = ?",
            (current_user["id"],),
            fetch_one=True
        )
        
        # Get account preferences
        account_preferences = DatabaseManager.execute_query(
            "SELECT * FROM user_account_preferences WHERE user_id = ?",
            (current_user["id"],),
            fetch_one=True
        )
        
        # Default settings if none exist
        if not notification_settings:
            notification_settings = {
                "email_notifications": True,
                "push_notifications": True,
                "referral_updates": True,
                "message_notifications": True,
                "system_notifications": True,
                "weekly_digest": True,
                "marketing_emails": False,
                "notification_frequency": "instant"
            }
        else:
            notification_settings = dict(notification_settings)
            # Remove internal fields
            notification_settings.pop("id", None)
            notification_settings.pop("user_id", None)
            notification_settings.pop("created_at", None)
            notification_settings.pop("updated_at", None)
        
        if not privacy_settings:
            privacy_settings = {
                "profile_visibility": "public",
                "show_email": False,
                "show_phone": False,
                "allow_referral_requests": True,
                "allow_premium_conversations": True,
                "data_sharing": False,
                "analytics_tracking": True
            }
        else:
            privacy_settings = dict(privacy_settings)
            privacy_settings.pop("id", None)
            privacy_settings.pop("user_id", None)
            privacy_settings.pop("created_at", None)
            privacy_settings.pop("updated_at", None)
        
        if not account_preferences:
            account_preferences = {
                "theme": "system",
                "language": "en",
                "timezone": "UTC",
                "currency": "USD",
                "date_format": "MM/dd/yyyy",
                "time_format": "12h"
            }
        else:
            account_preferences = dict(account_preferences)
            account_preferences.pop("id", None)
            account_preferences.pop("user_id", None)
            account_preferences.pop("created_at", None)
            account_preferences.pop("updated_at", None)
        
        return {
            "notifications": notification_settings,
            "privacy": privacy_settings,
            "preferences": account_preferences
        }
        
    except Exception as e:
        print(f"Error getting user settings: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get settings: {str(e)}"
        )

@router.put("/notifications", response_model=SuccessResponse)
async def update_notification_settings(
    settings: Dict[str, Any],
    current_user = Depends(get_current_user)
):
    """Update notification settings"""
    
    try:
        # Check if settings exist
        existing = DatabaseManager.execute_query(
            "SELECT id FROM user_notification_settings WHERE user_id = ?",
            (current_user["id"],),
            fetch_one=True
        )
        
        if existing:
            # Update existing settings
            set_clause = ", ".join([f"{key} = ?" for key in settings.keys()])
            values = list(settings.values()) + [current_user["id"]]
            
            DatabaseManager.execute_query(
                f"UPDATE user_notification_settings SET {set_clause}, updated_at = CURRENT_TIMESTAMP WHERE user_id = ?",
                tuple(values)
            )
        else:
            # Insert new settings
            columns = ["user_id"] + list(settings.keys())
            placeholders = ", ".join(["?" for _ in columns])
            values = [current_user["id"]] + list(settings.values())
            
            DatabaseManager.execute_query(
                f"INSERT INTO user_notification_settings ({', '.join(columns)}) VALUES ({placeholders})",
                tuple(values)
            )
        
        return SuccessResponse(success=True, message="Notification settings updated successfully")
        
    except Exception as e:
        print(f"Error updating notification settings: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to update notification settings: {str(e)}"
        )

@router.put("/privacy", response_model=SuccessResponse)
async def update_privacy_settings(
    settings: Dict[str, Any],
    current_user = Depends(get_current_user)
):
    """Update privacy settings"""
    
    try:
        # Check if settings exist
        existing = DatabaseManager.execute_query(
            "SELECT id FROM user_privacy_settings WHERE user_id = ?",
            (current_user["id"],),
            fetch_one=True
        )
        
        if existing:
            # Update existing settings
            set_clause = ", ".join([f"{key} = ?" for key in settings.keys()])
            values = list(settings.values()) + [current_user["id"]]
            
            DatabaseManager.execute_query(
                f"UPDATE user_privacy_settings SET {set_clause}, updated_at = CURRENT_TIMESTAMP WHERE user_id = ?",
                tuple(values)
            )
        else:
            # Insert new settings
            columns = ["user_id"] + list(settings.keys())
            placeholders = ", ".join(["?" for _ in columns])
            values = [current_user["id"]] + list(settings.values())
            
            DatabaseManager.execute_query(
                f"INSERT INTO user_privacy_settings ({', '.join(columns)}) VALUES ({placeholders})",
                tuple(values)
            )
        
        return SuccessResponse(success=True, message="Privacy settings updated successfully")
        
    except Exception as e:
        print(f"Error updating privacy settings: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to update privacy settings: {str(e)}"
        )

@router.put("/preferences", response_model=SuccessResponse)
async def update_account_preferences(
    preferences: Dict[str, Any],
    current_user = Depends(get_current_user)
):
    """Update account preferences"""
    
    try:
        # Check if preferences exist
        existing = DatabaseManager.execute_query(
            "SELECT id FROM user_account_preferences WHERE user_id = ?",
            (current_user["id"],),
            fetch_one=True
        )
        
        if existing:
            # Update existing preferences
            set_clause = ", ".join([f"{key} = ?" for key in preferences.keys()])
            values = list(preferences.values()) + [current_user["id"]]
            
            DatabaseManager.execute_query(
                f"UPDATE user_account_preferences SET {set_clause}, updated_at = CURRENT_TIMESTAMP WHERE user_id = ?",
                tuple(values)
            )
        else:
            # Insert new preferences
            columns = ["user_id"] + list(preferences.keys())
            placeholders = ", ".join(["?" for _ in columns])
            values = [current_user["id"]] + list(preferences.values())
            
            DatabaseManager.execute_query(
                f"INSERT INTO user_account_preferences ({', '.join(columns)}) VALUES ({placeholders})",
                tuple(values)
            )
        
        return SuccessResponse(success=True, message="Account preferences updated successfully")
        
    except Exception as e:
        print(f"Error updating account preferences: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to update account preferences: {str(e)}"
        )

@router.put("/password", response_model=SuccessResponse)
@limiter.limit("5/minute")
async def change_password(
    request: Request,
    password_data: Dict[str, str],
    current_user = Depends(get_current_user)
):
    """Change user password"""
    
    try:
        current_password = password_data.get("current_password")
        new_password = password_data.get("new_password")
        
        if not current_password or not new_password:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Current password and new password are required"
            )
        
        # Verify current password
        import hashlib
        current_hash = hashlib.sha256(current_password.encode()).hexdigest()
        
        user = DatabaseManager.get_user_by_id(current_user["id"])
        if not user or user["password_hash"] != current_hash:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Current password is incorrect"
            )
        
        # Validate new password
        if len(new_password) < 8:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="New password must be at least 8 characters long"
            )
        
        # Update password
        new_hash = hashlib.sha256(new_password.encode()).hexdigest()
        DatabaseManager.execute_query(
            "UPDATE users SET password_hash = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?",
            (new_hash, current_user["id"])
        )
        
        # Log password change
        DatabaseManager.execute_query(
            "INSERT INTO user_activity_logs (user_id, activity_type, activity_data) VALUES (?, ?, ?)",
            (current_user["id"], "password_change", json.dumps({"timestamp": str(datetime.now())}))
        )
        
        return SuccessResponse(success=True, message="Password changed successfully")
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error changing password: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to change password: {str(e)}"
        )

@router.delete("/account", response_model=SuccessResponse)
@limiter.limit("2/minute")
async def delete_account(
    request: Request,
    confirmation_data: Dict[str, str],
    current_user = Depends(get_current_user)
):
    """Delete user account (soft delete)"""
    
    try:
        password = confirmation_data.get("password")
        confirmation = confirmation_data.get("confirmation")
        
        if not password or confirmation != "DELETE":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Password and confirmation ('DELETE') are required"
            )
        
        # Verify password
        import hashlib
        password_hash = hashlib.sha256(password.encode()).hexdigest()
        
        user = DatabaseManager.get_user_by_id(current_user["id"])
        if not user or user["password_hash"] != password_hash:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Password is incorrect"
            )
        
        # Soft delete account
        DatabaseManager.execute_query(
            "UPDATE users SET is_active = FALSE, email = email || '_DELETED_' || ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?",
            (str(int(datetime.now().timestamp())), current_user["id"])
        )
        
        # Deactivate all sessions
        DatabaseManager.execute_query(
            "UPDATE user_sessions SET is_active = FALSE WHERE user_id = ?",
            (current_user["id"],)
        )
        
        # Log account deletion
        DatabaseManager.execute_query(
            "INSERT INTO user_activity_logs (user_id, activity_type, activity_data) VALUES (?, ?, ?)",
            (current_user["id"], "account_deletion", json.dumps({"timestamp": str(datetime.now())}))
        )
        
        return SuccessResponse(success=True, message="Account deleted successfully")
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error deleting account: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to delete account: {str(e)}"
        )

@router.get("/export", response_model=Dict[str, Any])
@limiter.limit("3/minute")
async def export_user_data(
    request: Request,
    current_user = Depends(get_current_user)
):
    """Export all user data"""
    
    try:
        # Get user profile
        user_data = DatabaseManager.get_user_by_id(current_user["id"])
        user_data.pop("password_hash", None)  # Remove sensitive data
        
        # Get referrals
        referrals = DatabaseManager.execute_query(
            "SELECT * FROM referrals WHERE candidate_id = ? OR employee_id = ?",
            (current_user["id"], current_user["id"]),
            fetch_all=True
        )
        
        # Get conversations
        conversations = DatabaseManager.execute_query(
            "SELECT * FROM conversations WHERE candidate_id = ? OR employee_id = ?",
            (current_user["id"], current_user["id"]),
            fetch_all=True
        )
        
        # Get notifications
        notifications = DatabaseManager.execute_query(
            "SELECT * FROM notifications WHERE user_id = ?",
            (current_user["id"],),
            fetch_all=True
        )
        
        # Get settings
        settings_response = await get_user_settings(current_user)
        
        export_data = {
            "user_profile": dict(user_data) if user_data else {},
            "referrals": [dict(r) for r in referrals] if referrals else [],
            "conversations": [dict(c) for c in conversations] if conversations else [],
            "notifications": [dict(n) for n in notifications] if notifications else [],
            "settings": settings_response,
            "export_date": str(datetime.now()),
            "export_format_version": "1.0"
        }
        
        return export_data
        
    except Exception as e:
        print(f"Error exporting user data: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to export user data: {str(e)}"
        ) 