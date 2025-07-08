from fastapi import APIRouter, Depends, HTTPException, status, Request, Query
from fastapi.security import HTTPBearer
from database import DatabaseManager
from models import (
    NotificationCreate,
    NotificationResponse, 
    NotificationUpdate,
    NotificationPriority
)
from auth_utils import get_current_user, rate_limiter
import json
import logging
from datetime import datetime
from typing import Dict, Any, List, Optional
from enum import Enum

router = APIRouter()
security = HTTPBearer()
logger = logging.getLogger(__name__)

class NotificationType(str, Enum):
    REFERRAL_RECEIVED = "referral_received"
    REFERRAL_ACCEPTED = "referral_accepted"
    REFERRAL_REJECTED = "referral_rejected"
    REFERRAL_STATUS_UPDATE = "referral_status_update"
    MESSAGE_RECEIVED = "message_received"
    PROFILE_UPDATED = "profile_updated"
    FEEDBACK_RECEIVED = "feedback_received"
    CONVERSATION_REQUESTED = "conversation_requested"
    CONVERSATION_ACCEPTED = "conversation_accepted"
    PAYMENT_COMPLETED = "payment_completed"
    SYSTEM_ANNOUNCEMENT = "system_announcement"

# Notification Templates
NOTIFICATION_TEMPLATES = {
    NotificationType.REFERRAL_RECEIVED: {
        "title": "New Referral Request",
        "message": "You received a new referral request from {candidate_name} for {position} at {company}.",
        "priority": NotificationPriority.HIGH
    },
    NotificationType.REFERRAL_ACCEPTED: {
        "title": "Referral Accepted",
        "message": "{employee_name} accepted your referral request for {position} at {company}.",
        "priority": NotificationPriority.HIGH
    },
    NotificationType.REFERRAL_REJECTED: {
        "title": "Referral Rejected",
        "message": "{employee_name} rejected your referral request for {position} at {company}.",
        "priority": NotificationPriority.MEDIUM
    },
    NotificationType.REFERRAL_STATUS_UPDATE: {
        "title": "Referral Status Update",
        "message": "Your referral for {position} at {company} status changed to {status}.",
        "priority": NotificationPriority.MEDIUM
    },
    NotificationType.MESSAGE_RECEIVED: {
        "title": "New Message",
        "message": "{sender_name} sent you a message about your referral request for {position} at {company}.",
        "priority": NotificationPriority.MEDIUM
    },
    NotificationType.PROFILE_UPDATED: {
        "title": "Profile Updated",
        "message": "Your profile has been updated successfully.",
        "priority": NotificationPriority.LOW
    },
    NotificationType.FEEDBACK_RECEIVED: {
        "title": "Feedback Received", 
        "message": "You received feedback on your referral for {position} at {company}.",
        "priority": NotificationPriority.MEDIUM
    },
    NotificationType.CONVERSATION_REQUESTED: {
        "title": "Premium Conversation Requested",
        "message": "{candidate_name} requested a premium conversation with you.",
        "priority": NotificationPriority.HIGH
    },
    NotificationType.CONVERSATION_ACCEPTED: {
        "title": "Conversation Accepted",
        "message": "{employee_name} accepted your premium conversation request.",
        "priority": NotificationPriority.HIGH
    },
    NotificationType.PAYMENT_COMPLETED: {
        "title": "Payment Completed",
        "message": "Payment of ${amount} for premium conversation has been processed successfully.",
        "priority": NotificationPriority.MEDIUM
    },
    NotificationType.SYSTEM_ANNOUNCEMENT: {
        "title": "System Update",
        "message": "{announcement_text}",
        "priority": NotificationPriority.LOW
    }
}

class NotificationService:
    """Service for creating and managing notifications"""
    
    @staticmethod
    def _get_user_notification_settings(user_id: int) -> Dict[str, Any]:
        """Get user notification settings"""
        try:
            settings = DatabaseManager.execute_query(
                "SELECT * FROM user_notification_settings WHERE user_id = ?",
                (user_id,),
                fetch_one=True
            )
            
            if not settings:
                # Return default settings
                return {
                    'email_notifications': True,
                    'push_notifications': True,
                    'referral_updates': True,
                    'message_notifications': True,
                    'system_notifications': True,
                    'weekly_digest': True,
                    'marketing_emails': False,
                    'notification_frequency': 'instant'
                }
            
            return settings
            
        except Exception as e:
            logger.error(f"Failed to get notification settings for user {user_id}: {e}")
            # Return permissive defaults on error
            return {
                'email_notifications': True,
                'push_notifications': True,
                'referral_updates': True,
                'message_notifications': True,
                'system_notifications': True,
                'weekly_digest': True,
                'marketing_emails': False,
                'notification_frequency': 'instant'
            }
    
    @staticmethod
    def _should_send_notification(settings: Dict[str, Any], notification_type: NotificationType) -> bool:
        """Check if notification should be sent based on user settings"""
        
        # Map notification types to settings
        type_to_setting = {
            NotificationType.REFERRAL_RECEIVED: 'referral_updates',
            NotificationType.REFERRAL_ACCEPTED: 'referral_updates',
            NotificationType.REFERRAL_REJECTED: 'referral_updates',
            NotificationType.REFERRAL_STATUS_UPDATE: 'referral_updates',
            NotificationType.MESSAGE_RECEIVED: 'message_notifications',
            NotificationType.PROFILE_UPDATED: 'system_notifications',
            NotificationType.FEEDBACK_RECEIVED: 'referral_updates',
            NotificationType.CONVERSATION_REQUESTED: 'message_notifications',
            NotificationType.CONVERSATION_ACCEPTED: 'message_notifications',
            NotificationType.PAYMENT_COMPLETED: 'system_notifications',
            NotificationType.SYSTEM_ANNOUNCEMENT: 'system_notifications'
        }
        
        setting_key = type_to_setting.get(notification_type)
        if not setting_key:
            return True  # Send if no specific setting found
        
        return settings.get(setting_key, True)
    
    @staticmethod
    async def create_notification(
        user_id: int,
        notification_type: NotificationType,
        data: Dict[str, Any] = None,
        custom_message: Optional[str] = None,
        custom_title: Optional[str] = None,
        force_send: bool = False
    ) -> Optional[int]:
        """Create a new notification for a user"""
        
        try:
            # Check user notification settings (unless forced)
            if not force_send:
                settings = NotificationService._get_user_notification_settings(user_id)
                if not NotificationService._should_send_notification(settings, notification_type):
                    logger.info(f"Notification {notification_type} blocked by user {user_id} settings")
                    return None
            
            template = NOTIFICATION_TEMPLATES.get(notification_type)
            if not template:
                raise ValueError(f"Unknown notification type: {notification_type}")
            
            # Use custom message/title if provided, otherwise use template
            title = custom_title or template["title"]
            message = custom_message or template["message"]
            priority = template["priority"]
            
            # Format message with data if provided
            if data and not custom_message:
                try:
                    message = message.format(**data)
                    if not custom_title and data:
                        # Try to format title too
                        title = title.format(**data)
                except KeyError as e:
                    logger.warning(f"Missing data key for notification formatting: {e}")
                    # Use message as-is if formatting fails
            
            # Insert notification
            notification_id = DatabaseManager.execute_query(
                """
                INSERT INTO notifications (
                    user_id, type, title, message, data, priority, created_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?)
                """,
                (
                    user_id,
                    notification_type.value,
                    title,
                    message,
                    json.dumps(data) if data else None,
                    priority.value,
                    datetime.utcnow().isoformat() + 'Z'
                )
            )
            
            logger.info(f"Created notification {notification_id} for user {user_id}: {notification_type}")
            return notification_id
            
        except Exception as e:
            logger.error(f"Failed to create notification: {str(e)}")
            raise

    @staticmethod
    async def create_referral_notification(
        referral_data: Dict[str, Any],
        notification_type: NotificationType,
        recipient_user_id: int
    ):
        """Create a referral-specific notification"""
        
        # Get additional user data
        candidate = DatabaseManager.get_user_by_id(referral_data.get("candidate_id"))
        employee = DatabaseManager.get_user_by_id(referral_data.get("employee_id"))
        
        data = {
            "referral_id": referral_data.get("id"),
            "position": referral_data.get("position", "Unknown Position"),
            "company": referral_data.get("company", "Unknown Company"),
            "candidate_name": candidate.get("name", "Unknown") if candidate else "Unknown",
            "employee_name": employee.get("name", "Unknown") if employee else "Unknown",
            "status": referral_data.get("status", "unknown")
        }
        
        return await NotificationService.create_notification(
            user_id=recipient_user_id,
            notification_type=notification_type,
            data=data
        )

@router.get("/", response_model=Dict[str, Any])
async def get_notifications(
    request: Request,
    unread_only: bool = Query(False),
    limit: int = Query(50, le=100),
    offset: int = Query(0, ge=0),
    current_user = Depends(get_current_user)
):
    """Get notifications for the current user"""
    
    try:
        # Build query conditions
        where_conditions = ["user_id = ?"]
        params = [current_user["id"]]
        
        if unread_only:
            where_conditions.append("read = FALSE")
        
        where_clause = " AND ".join(where_conditions)
        
        # Get total count
        count_query = f"SELECT COUNT(*) as total FROM notifications WHERE {where_clause}"
        total_result = DatabaseManager.execute_query(count_query, tuple(params), fetch_one=True)
        total = total_result["total"] if total_result else 0
        
        # Get notifications
        query = f"""
            SELECT * FROM notifications 
            WHERE {where_clause}
            ORDER BY created_at DESC
            LIMIT ? OFFSET ?
        """
        params.extend([limit, offset])
        
        notifications = DatabaseManager.execute_query(query, tuple(params), fetch_all=True)
        
        # Get unread count
        unread_count_result = DatabaseManager.execute_query(
            "SELECT COUNT(*) as unread FROM notifications WHERE user_id = ? AND read = FALSE",
            (current_user["id"],),
            fetch_one=True
        )
        unread_count = unread_count_result["unread"] if unread_count_result else 0
        
        # Format notifications
        formatted_notifications = []
        for notification in notifications:
            notification_data = dict(notification)
            
            # Parse data JSON
            if notification_data.get("data"):
                try:
                    notification_data["data"] = json.loads(notification_data["data"])
                except (json.JSONDecodeError, TypeError):
                    notification_data["data"] = {}
            
            formatted_notifications.append(notification_data)
        
        return {
            "notifications": formatted_notifications,
            "total": total,
            "unread_count": unread_count,
            "limit": limit,
            "offset": offset
        }
        
    except Exception as e:
        logger.error(f"Failed to get notifications: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get notifications: {str(e)}"
        )

@router.put("/{notification_id}/read", response_model=Dict[str, str])
async def mark_notification_read(
    request: Request,
    notification_id: int,
    current_user = Depends(get_current_user)
):
    """Mark a specific notification as read"""
    
    try:
        # Verify notification belongs to user
        notification = DatabaseManager.execute_query(
            "SELECT * FROM notifications WHERE id = ? AND user_id = ?",
            (notification_id, current_user["id"]),
            fetch_one=True
        )
        
        if not notification:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Notification not found"
            )
        
        # Update read status
        DatabaseManager.execute_query(
            "UPDATE notifications SET read = TRUE WHERE id = ?",
            (notification_id,)
        )
        
        return {"message": "Notification marked as read"}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to mark notification as read: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to mark notification as read: {str(e)}"
        )

@router.put("/read-all", response_model=Dict[str, str])
async def mark_all_notifications_read(
    request: Request,
    current_user = Depends(get_current_user)
):
    """Mark all notifications as read for the current user"""
    
    try:
        DatabaseManager.execute_query(
            "UPDATE notifications SET read = TRUE WHERE user_id = ? AND read = FALSE",
            (current_user["id"],)
        )
        
        return {"message": "All notifications marked as read"}
        
    except Exception as e:
        logger.error(f"Failed to mark all notifications as read: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to mark all notifications as read: {str(e)}"
        )

@router.delete("/{notification_id}", response_model=Dict[str, str])
async def delete_notification(
    request: Request,
    notification_id: int,
    current_user = Depends(get_current_user)
):
    """Delete a specific notification"""
    
    try:
        # Verify notification belongs to user
        notification = DatabaseManager.execute_query(
            "SELECT * FROM notifications WHERE id = ? AND user_id = ?",
            (notification_id, current_user["id"]),
            fetch_one=True
        )
        
        if not notification:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Notification not found"
            )
        
        # Delete notification
        DatabaseManager.execute_query(
            "DELETE FROM notifications WHERE id = ?",
            (notification_id,)
        )
        
        return {"message": "Notification deleted"}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to delete notification: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to delete notification: {str(e)}"
        )

@router.get("/unread-count", response_model=Dict[str, int])
async def get_unread_count(
    request: Request,
    current_user = Depends(get_current_user)
):
    """Get count of unread notifications"""
    
    try:
        result = DatabaseManager.execute_query(
            "SELECT COUNT(*) as count FROM notifications WHERE user_id = ? AND read = FALSE",
            (current_user["id"],),
            fetch_one=True
        )
        
        return {"count": result["count"] if result else 0}
        
    except Exception as e:
        logger.error(f"Failed to get unread count: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get unread count: {str(e)}"
        )

# Admin endpoints
@router.post("/broadcast", response_model=Dict[str, str])
async def broadcast_notification(
    request: Request,
    title: str,
    message: str,
    priority: NotificationPriority = NotificationPriority.MEDIUM,
    current_user = Depends(get_current_user)
):
    """Broadcast a notification to all users (admin only)"""
    
    if current_user["role"] != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only admins can broadcast notifications"
        )
    
    try:
        # Get all active users
        users = DatabaseManager.execute_query(
            "SELECT id FROM users WHERE is_active = TRUE",
            fetch_all=True
        )
        
        # Create notification for each user
        notification_ids = []
        for user in users:
            notification_id = await NotificationService.create_notification(
                user_id=user["id"],
                notification_type=NotificationType.SYSTEM_ANNOUNCEMENT,
                custom_title=title,
                custom_message=message
            )
            notification_ids.append(notification_id)
        
        return {
            "message": f"Notification broadcast to {len(notification_ids)} users",
            "notification_count": len(notification_ids)
        }
        
    except Exception as e:
        logger.error(f"Failed to broadcast notification: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to broadcast notification: {str(e)}"
        )

# Export the notification service for use in other modules
__all__ = ["NotificationService", "NotificationType"] 