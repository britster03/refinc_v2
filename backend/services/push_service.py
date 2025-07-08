import os
import json
import logging
import asyncio
from typing import Dict, Any, List, Optional, Union
from datetime import datetime, timedelta
from enum import Enum
import httpx
import asyncpg
from sqlalchemy import create_engine, Column, String, DateTime, Boolean, Integer, Text, JSON
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from sqlalchemy.dialects.postgresql import UUID
import uuid

# Third-party imports (install with: pip install firebase-admin pyfcm pywebpush)
try:
    import firebase_admin
    from firebase_admin import credentials, messaging
    FCM_AVAILABLE = True
except ImportError:
    FCM_AVAILABLE = False
    firebase_admin = None
    messaging = None

try:
    from pywebpush import webpush, WebPushException
    WEBPUSH_AVAILABLE = True
except ImportError:
    WEBPUSH_AVAILABLE = False
    webpush = None

logger = logging.getLogger(__name__)

# Database models
Base = declarative_base()

class DeviceToken(Base):
    __tablename__ = "device_tokens"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), nullable=False, index=True)
    device_token = Column(Text, nullable=False, unique=True)
    platform = Column(String(20), nullable=False)
    device_info = Column(JSON, default={})
    active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

class PushNotificationLog(Base):
    __tablename__ = "push_notification_logs"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), nullable=False, index=True)
    title = Column(String(255), nullable=False)
    body = Column(Text)
    platform = Column(String(20))
    provider = Column(String(50))
    sent_count = Column(Integer, default=0)
    failed_count = Column(Integer, default=0)
    success = Column(Boolean, default=False)
    error_message = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)

class PushProvider(str, Enum):
    FCM = "fcm"  # Firebase Cloud Messaging
    WEBPUSH = "webpush"  # Web Push Protocol
    ONESIGNAL = "onesignal"

class PushPlatform(str, Enum):
    ANDROID = "android"
    IOS = "ios"
    WEB = "web"

class PushPriority(str, Enum):
    LOW = "low"
    NORMAL = "normal"
    HIGH = "high"

class DatabaseManager:
    """Database operations for push service"""
    
    def __init__(self):
        database_url = os.getenv("DATABASE_URL")
        self.engine = create_engine(database_url)
        self.SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=self.engine)
        Base.metadata.create_all(bind=self.engine)
    
    async def get_user_device_tokens(self, user_id: str, platform: Optional[str] = None) -> List[Dict]:
        """Get active device tokens for user"""
        db = self.SessionLocal()
        try:
            query = db.query(DeviceToken).filter(
                DeviceToken.user_id == user_id,
                DeviceToken.active == True
            )
            
            if platform:
                query = query.filter(DeviceToken.platform == platform)
            
            tokens = query.all()
            return [
                {
                    "device_token": token.device_token,
                    "platform": token.platform,
                    "device_info": token.device_info
                }
                for token in tokens
            ]
        finally:
            db.close()
    
    async def register_device_token(self, user_id: str, device_token: str, platform: str, device_info: Dict = None) -> bool:
        """Register or update device token"""
        db = self.SessionLocal()
        try:
            existing = db.query(DeviceToken).filter(
                DeviceToken.device_token == device_token
            ).first()
            
            if existing:
                existing.user_id = user_id
                existing.platform = platform
                existing.device_info = device_info or {}
                existing.active = True
                existing.updated_at = datetime.utcnow()
            else:
                new_token = DeviceToken(
                    user_id=user_id,
                    device_token=device_token,
                    platform=platform,
                    device_info=device_info or {}
                )
                db.add(new_token)
            
            db.commit()
            return True
        except Exception as e:
            logger.error(f"Failed to register device token: {e}")
            db.rollback()
            return False
        finally:
            db.close()
    
    async def deactivate_device_token(self, device_token: str) -> bool:
        """Deactivate device token"""
        db = self.SessionLocal()
        try:
            token = db.query(DeviceToken).filter(
                DeviceToken.device_token == device_token
            ).first()
            
            if token:
                token.active = False
                token.updated_at = datetime.utcnow()
                db.commit()
                return True
            return False
        except Exception as e:
            logger.error(f"Failed to deactivate device token: {e}")
            db.rollback()
            return False
        finally:
            db.close()
    
    async def log_push_notification(self, log_data: Dict) -> bool:
        """Log push notification attempt"""
        db = self.SessionLocal()
        try:
            log_entry = PushNotificationLog(**log_data)
            db.add(log_entry)
            db.commit()
            return True
        except Exception as e:
            logger.error(f"Failed to log push notification: {e}")
            db.rollback()
            return False
        finally:
            db.close()

class PushService:
    """Production-ready push notification service"""
    
    def __init__(self):
        self.db = DatabaseManager()
        self.providers = self._initialize_providers()
        self.fcm_app = None
        
    def _initialize_providers(self) -> Dict[PushProvider, bool]:
        """Initialize available push notification providers"""
        providers = {}
        
        # Firebase Cloud Messaging
        if FCM_AVAILABLE and os.getenv("FIREBASE_CREDENTIALS_PATH"):
            try:
                if not firebase_admin._apps:
                    cred = credentials.Certificate(os.getenv("FIREBASE_CREDENTIALS_PATH"))
                    self.fcm_app = firebase_admin.initialize_app(cred)
                else:
                    self.fcm_app = firebase_admin.get_app()
                providers[PushProvider.FCM] = True
                logger.info("Firebase FCM initialized successfully")
            except Exception as e:
                logger.error(f"Failed to initialize FCM: {e}")
                providers[PushProvider.FCM] = False
        else:
            providers[PushProvider.FCM] = False
            
        # Web Push
        if WEBPUSH_AVAILABLE and os.getenv("VAPID_PRIVATE_KEY"):
            providers[PushProvider.WEBPUSH] = True
            logger.info("WebPush initialized successfully")
        else:
            providers[PushProvider.WEBPUSH] = False
            
        # OneSignal
        if os.getenv("ONESIGNAL_APP_ID") and os.getenv("ONESIGNAL_API_KEY"):
            providers[PushProvider.ONESIGNAL] = True
            logger.info("OneSignal initialized successfully")
        else:
            providers[PushProvider.ONESIGNAL] = False
            
        return providers
    
    async def send_push_notification(
        self,
        user_id: str,
        title: str,
        body: str,
        data: Dict[str, Any] = None,
        platform: Optional[PushPlatform] = None,
        priority: PushPriority = PushPriority.NORMAL,
        icon: str = None,
        badge: int = None,
        sound: str = "default",
        action_url: str = None,
        image_url: str = None,
        category: str = None
    ) -> Dict[str, Any]:
        """Send push notification to user's devices"""
        
        # Get user's device tokens
        device_tokens = await self.db.get_user_device_tokens(
            user_id, platform.value if platform else None
        )
        
        if not device_tokens:
            return {
                "success": False,
                "error": "No active device tokens found",
                "sent_count": 0,
                "failed_count": 0
            }
        
        total_sent = 0
        total_failed = 0
        errors = []
        
        # Group tokens by platform for efficient sending
        platform_groups = {}
        for token_data in device_tokens:
            platform_key = token_data["platform"]
            if platform_key not in platform_groups:
                platform_groups[platform_key] = []
            platform_groups[platform_key].append(token_data["device_token"])
        
        # Send to each platform group
        for platform_key, tokens in platform_groups.items():
            try:
                result = await self._send_to_platform(
                    tokens, title, body, data, platform_key, priority,
                    icon, badge, sound, action_url, image_url, category
                )
                total_sent += result["sent_count"]
                total_failed += result["failed_count"]
                errors.extend(result.get("errors", []))
                
                # Remove failed tokens from database
                for failed_token in result.get("failed_tokens", []):
                    await self.db.deactivate_device_token(failed_token)
                    
            except Exception as e:
                logger.error(f"Failed to send to platform {platform_key}: {e}")
                total_failed += len(tokens)
                errors.append(str(e))
        
        # Log the notification
        await self.db.log_push_notification({
            "user_id": user_id,
            "title": title,
            "body": body,
            "platform": platform.value if platform else "all",
            "provider": "multiple",
            "sent_count": total_sent,
            "failed_count": total_failed,
            "success": total_sent > 0,
            "error_message": "; ".join(errors) if errors else None
        })
        
        return {
            "success": total_sent > 0,
            "sent_count": total_sent,
            "failed_count": total_failed,
            "errors": errors
        }
    
    async def _send_to_platform(
        self,
        device_tokens: List[str],
        title: str,
        body: str,
        data: Dict[str, Any],
        platform: str,
        priority: PushPriority,
        icon: str,
        badge: int,
        sound: str,
        action_url: str,
        image_url: str,
        category: str
    ) -> Dict[str, Any]:
        """Send notifications to specific platform"""
        
        if platform == "web" and self.providers.get(PushProvider.WEBPUSH):
            return await self._send_via_webpush(
                device_tokens, title, body, data, icon, badge, action_url, image_url
            )
        elif self.providers.get(PushProvider.FCM):
            return await self._send_via_fcm(
                device_tokens, title, body, data, platform, priority,
                icon, badge, sound, action_url, image_url, category
            )
        elif self.providers.get(PushProvider.ONESIGNAL):
            return await self._send_via_onesignal(
                device_tokens, title, body, data, platform, icon, action_url, image_url
            )
        else:
            return {
                "sent_count": 0,
                "failed_count": len(device_tokens),
                "failed_tokens": device_tokens,
                "errors": ["No suitable push provider available"]
            }
    
    async def _send_via_fcm(
        self,
        device_tokens: List[str],
        title: str,
        body: str,
        data: Dict[str, Any],
        platform: str,
        priority: PushPriority,
        icon: str,
        badge: int,
        sound: str,
        action_url: str,
        image_url: str,
        category: str
    ) -> Dict[str, Any]:
        """Send via Firebase Cloud Messaging"""
        
        result = {
            "sent_count": 0,
            "failed_count": 0,
            "message_ids": [],
            "failed_tokens": [],
            "errors": []
        }
        
        # Prepare notification
        notification = messaging.Notification(
            title=title,
            body=body,
            image=image_url
        )
        
        # Platform-specific configuration
        android_config = None
        apns_config = None
        webpush_config = None
        
        if platform in ["android", "web"]:
            android_config = messaging.AndroidConfig(
                priority=priority.value,
                notification=messaging.AndroidNotification(
                    icon=icon or "ic_notification",
                    sound=sound,
                    click_action=action_url,
                    channel_id="default"
                ),
                data={k: str(v) for k, v in (data or {}).items()}
            )
        
        if platform == "ios":
            apns_config = messaging.APNSConfig(
                payload=messaging.APNSPayload(
                    aps=messaging.Aps(
                        alert=messaging.ApsAlert(title=title, body=body),
                        badge=badge,
                        sound=sound,
                        category=category
                    )
                )
            )
        
        # Send in batches (FCM limit is 500)
        batch_size = 500
        for i in range(0, len(device_tokens), batch_size):
            batch_tokens = device_tokens[i:i + batch_size]
            
            try:
                message = messaging.MulticastMessage(
                    notification=notification,
                    tokens=batch_tokens,
                    android=android_config,
                    apns=apns_config,
                    data={k: str(v) for k, v in (data or {}).items()}
                )
                
                response = messaging.send_multicast(message)
                
                for j, resp in enumerate(response.responses):
                    if resp.success:
                        result["sent_count"] += 1
                        result["message_ids"].append(resp.message_id)
                    else:
                        result["failed_count"] += 1
                        result["failed_tokens"].append(batch_tokens[j])
                        result["errors"].append(str(resp.exception))
                        
            except Exception as e:
                result["failed_count"] += len(batch_tokens)
                result["failed_tokens"].extend(batch_tokens)
                result["errors"].append(str(e))
        
        return result
    
    async def _send_via_webpush(
        self,
        subscriptions: List[str],
        title: str,
        body: str,
        data: Dict[str, Any],
        icon: str,
        badge: str,
        action_url: str,
        image_url: str
    ) -> Dict[str, Any]:
        """Send via Web Push Protocol"""
        
        result = {
            "sent_count": 0,
            "failed_count": 0,
            "message_ids": [],
            "failed_tokens": [],
            "errors": []
        }
        
        payload = {
            "title": title,
            "body": body,
            "icon": icon or "/icons/notification-icon.png",
            "badge": badge or "/icons/badge-icon.png",
            "image": image_url,
            "data": {**(data or {}), "url": action_url},
            "actions": [
                {"action": "open", "title": "Open"},
                {"action": "close", "title": "Close"}
            ] if action_url else []
        }
        
        vapid_claims = {
            "sub": f"mailto:{os.getenv('VAPID_CLAIM_EMAIL', 'admin@referralinc.com')}"
        }
        
        for i, subscription_info in enumerate(subscriptions):
            try:
                if isinstance(subscription_info, str):
                    subscription_info = json.loads(subscription_info)
                
                webpush(
                    subscription_info=subscription_info,
                    data=json.dumps(payload),
                    vapid_private_key=os.getenv("VAPID_PRIVATE_KEY"),
                    vapid_claims=vapid_claims
                )
                
                result["sent_count"] += 1
                result["message_ids"].append(f"webpush-{datetime.utcnow().timestamp()}-{i}")
                
            except WebPushException as e:
                result["failed_count"] += 1
                result["failed_tokens"].append(subscriptions[i])
                result["errors"].append(str(e))
            except Exception as e:
                result["failed_count"] += 1
                result["failed_tokens"].append(subscriptions[i])
                result["errors"].append(str(e))
        
        return result
    
    async def _send_via_onesignal(
        self,
        device_tokens: List[str],
        title: str,
        body: str,
        data: Dict[str, Any],
        platform: str,
        icon: str,
        action_url: str,
        image_url: str
    ) -> Dict[str, Any]:
        """Send via OneSignal"""
        
        result = {
            "sent_count": 0,
            "failed_count": 0,
            "message_ids": [],
            "failed_tokens": [],
            "errors": []
        }
        
        payload = {
            "app_id": os.getenv("ONESIGNAL_APP_ID"),
            "include_player_ids": device_tokens,
            "headings": {"en": title},
            "contents": {"en": body},
            "data": data or {},
            "url": action_url,
            "large_icon": icon,
            "big_picture": image_url
        }
        
        headers = {
            "Authorization": f"Basic {os.getenv('ONESIGNAL_API_KEY')}",
            "Content-Type": "application/json"
        }
        
        try:
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    "https://onesignal.com/api/v1/notifications",
                    json=payload,
                    headers=headers
                )
                
                if response.status_code == 200:
                    response_data = response.json()
                    result["sent_count"] = response_data.get("recipients", 0)
                    result["message_ids"].append(response_data.get("id"))
                    
                    if result["sent_count"] < len(device_tokens):
                        result["failed_count"] = len(device_tokens) - result["sent_count"]
                else:
                    result["failed_count"] = len(device_tokens)
                    result["failed_tokens"] = device_tokens
                    result["errors"].append(f"OneSignal API error: {response.status_code}")
                    
        except Exception as e:
            result["failed_count"] = len(device_tokens)
            result["failed_tokens"] = device_tokens
            result["errors"].append(str(e))
        
        return result
    
    async def register_device_token(
        self,
        user_id: str,
        device_token: str,
        platform: PushPlatform,
        device_info: Dict[str, Any] = None
    ) -> bool:
        """Register device token for user"""
        return await self.db.register_device_token(
            user_id, device_token, platform.value, device_info
        )
    
    async def unregister_device_token(self, device_token: str) -> bool:
        """Unregister device token"""
        return await self.db.deactivate_device_token(device_token)
    
    async def send_bulk_notifications(
        self,
        notifications: List[Dict[str, Any]]
    ) -> Dict[str, Any]:
        """Send bulk push notifications with rate limiting"""
        
        results = {
            "total": len(notifications),
            "sent": 0,
            "failed": 0,
            "errors": []
        }
        
        # Process in batches to avoid overwhelming the system
        batch_size = 100
        for i in range(0, len(notifications), batch_size):
            batch = notifications[i:i + batch_size]
            
            tasks = []
            for notification in batch:
                task = self.send_push_notification(**notification)
                tasks.append(task)
            
            batch_results = await asyncio.gather(*tasks, return_exceptions=True)
            
            for result in batch_results:
                if isinstance(result, Exception):
                    results["failed"] += 1
                    results["errors"].append(str(result))
                elif result.get("success"):
                    results["sent"] += 1
                else:
                    results["failed"] += 1
                    results["errors"].extend(result.get("errors", []))
            
            # Rate limiting between batches
            await asyncio.sleep(0.1)
        
        return results

# Global push service instance
push_service = PushService() 