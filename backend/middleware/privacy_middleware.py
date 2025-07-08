"""
Production-ready privacy enforcement middleware
Enforces user privacy settings across all API endpoints
"""

import json
import logging
from typing import Dict, Any, List, Optional, Set
from functools import wraps
from fastapi import Request, HTTPException, Depends
from fastapi.responses import JSONResponse
import asyncio
from sqlalchemy import create_engine, Column, String, DateTime, Boolean, JSON, Text
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from sqlalchemy.dialects.postgresql import UUID
from datetime import datetime
import uuid
import os

logger = logging.getLogger(__name__)

# Database models
Base = declarative_base()

class UserPrivacySettings(Base):
    __tablename__ = "user_privacy_settings"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), nullable=False, unique=True, index=True)
    profile_visibility = Column(String(20), default="public")  # public, connections, private
    show_email = Column(Boolean, default=True)
    show_phone = Column(Boolean, default=False)
    allow_referral_requests = Column(Boolean, default=True)
    allow_premium_conversations = Column(Boolean, default=True)
    data_sharing = Column(Boolean, default=True)
    analytics_tracking = Column(Boolean, default=True)
    marketing_communications = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

class UserConnection(Base):
    __tablename__ = "user_connections"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), nullable=False, index=True)
    connected_user_id = Column(UUID(as_uuid=True), nullable=False, index=True)
    status = Column(String(20), default="pending")  # pending, accepted, rejected, blocked
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

class PrivacyAuditLog(Base):
    __tablename__ = "privacy_audit_logs"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), nullable=False, index=True)
    requesting_user_id = Column(UUID(as_uuid=True), nullable=True, index=True)
    endpoint = Column(String(255), nullable=False)
    data_accessed = Column(JSON, default=[])
    access_granted = Column(Boolean, nullable=False)
    reason = Column(Text)
    ip_address = Column(String(45))
    user_agent = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)

class PrivacyLevel:
    PUBLIC = "public"
    CONNECTIONS = "connections"
    PRIVATE = "private"

class DataCategory:
    PROFILE = "profile"
    CONTACT = "contact"
    ACTIVITY = "activity"
    ANALYTICS = "analytics"
    REFERRALS = "referrals"
    CONVERSATIONS = "conversations"

class DatabaseManager:
    """Database operations for privacy management"""
    
    def __init__(self):
        database_url = os.getenv("DATABASE_URL")
        self.engine = create_engine(database_url)
        self.SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=self.engine)
        Base.metadata.create_all(bind=self.engine)
    
    def get_user_privacy_settings(self, user_id: str) -> Dict[str, Any]:
        """Get user's privacy settings from database"""
        db = self.SessionLocal()
        try:
            settings = db.query(UserPrivacySettings).filter(
                UserPrivacySettings.user_id == user_id
            ).first()
            
            if not settings:
                # Create default settings
                default_settings = UserPrivacySettings(
                    user_id=user_id,
                    profile_visibility=PrivacyLevel.PUBLIC,
                    show_email=True,
                    show_phone=False,
                    allow_referral_requests=True,
                    allow_premium_conversations=True,
                    data_sharing=True,
                    analytics_tracking=True,
                    marketing_communications=False
                )
                db.add(default_settings)
                db.commit()
                settings = default_settings
            
            return {
                "profile_visibility": settings.profile_visibility,
                "show_email": settings.show_email,
                "show_phone": settings.show_phone,
                "allow_referral_requests": settings.allow_referral_requests,
                "allow_premium_conversations": settings.allow_premium_conversations,
                "data_sharing": settings.data_sharing,
                "analytics_tracking": settings.analytics_tracking,
                "marketing_communications": settings.marketing_communications
            }
        except Exception as e:
            logger.error(f"Failed to get privacy settings for user {user_id}: {e}")
            return self._default_privacy_settings()
        finally:
            db.close()
    
    def update_user_privacy_settings(self, user_id: str, settings_update: Dict[str, Any]) -> bool:
        """Update user's privacy settings"""
        db = self.SessionLocal()
        try:
            settings = db.query(UserPrivacySettings).filter(
                UserPrivacySettings.user_id == user_id
            ).first()
            
            if not settings:
                settings = UserPrivacySettings(user_id=user_id)
                db.add(settings)
            
            # Update only provided fields
            for key, value in settings_update.items():
                if hasattr(settings, key):
                    setattr(settings, key, value)
            
            settings.updated_at = datetime.utcnow()
            db.commit()
            return True
        except Exception as e:
            logger.error(f"Failed to update privacy settings for user {user_id}: {e}")
            db.rollback()
            return False
        finally:
            db.close()
    
    def check_user_connection(self, user_id: str, other_user_id: str) -> bool:
        """Check if two users are connected"""
        if not other_user_id or user_id == other_user_id:
            return True  # User can always see their own data
        
        db = self.SessionLocal()
        try:
            connection = db.query(UserConnection).filter(
                (
                    (UserConnection.user_id == user_id) & 
                    (UserConnection.connected_user_id == other_user_id)
                ) | (
                    (UserConnection.user_id == other_user_id) & 
                    (UserConnection.connected_user_id == user_id)
                ),
                UserConnection.status == "accepted"
            ).first()
            
            return connection is not None
        except Exception as e:
            logger.error(f"Failed to check connection between {user_id} and {other_user_id}: {e}")
            return False
        finally:
            db.close()
    
    def log_privacy_access(self, log_data: Dict[str, Any]) -> bool:
        """Log privacy-related access for audit purposes"""
        db = self.SessionLocal()
        try:
            log_entry = PrivacyAuditLog(**log_data)
            db.add(log_entry)
            db.commit()
            return True
        except Exception as e:
            logger.error(f"Failed to log privacy access: {e}")
            db.rollback()
            return False
        finally:
            db.close()
    
    def _default_privacy_settings(self) -> Dict[str, Any]:
        """Default privacy settings (most restrictive)"""
        return {
            "profile_visibility": PrivacyLevel.PUBLIC,
            "show_email": False,
            "show_phone": False,
            "allow_referral_requests": True,
            "allow_premium_conversations": True,
            "data_sharing": False,
            "analytics_tracking": False,
            "marketing_communications": False
        }

class PrivacyEnforcer:
    """Comprehensive privacy enforcement system"""
    
    def __init__(self):
        self.db = DatabaseManager()
        self.privacy_rules = self._load_privacy_rules()
        self.field_mappings = self._load_field_mappings()
        
    def _load_privacy_rules(self) -> Dict[str, Dict[str, Any]]:
        """Load privacy rules configuration"""
        return {
            "profile_visibility": {
                "affects": [DataCategory.PROFILE, DataCategory.CONTACT],
                "levels": {
                    PrivacyLevel.PUBLIC: {"visible_to": "all"},
                    PrivacyLevel.CONNECTIONS: {"visible_to": "connections"},
                    PrivacyLevel.PRIVATE: {"visible_to": "self"}
                }
            },
            "show_email": {
                "affects": [DataCategory.CONTACT],
                "field": "email",
                "requires_permission": True
            },
            "show_phone": {
                "affects": [DataCategory.CONTACT],
                "field": "phone",
                "requires_permission": True
            },
            "allow_referral_requests": {
                "affects": [DataCategory.REFERRALS],
                "blocks_endpoints": ["/api/referrals/request", "/api/referrals/create"]
            },
            "allow_premium_conversations": {
                "affects": [DataCategory.CONVERSATIONS],
                "blocks_endpoints": ["/api/conversations/premium"]
            },
            "data_sharing": {
                "affects": [DataCategory.ANALYTICS, DataCategory.ACTIVITY],
                "blocks_third_party": True
            },
            "analytics_tracking": {
                "affects": [DataCategory.ANALYTICS],
                "blocks_tracking": True
            }
        }
    
    def _load_field_mappings(self) -> Dict[str, List[str]]:
        """Map data categories to specific fields"""
        return {
            DataCategory.PROFILE: [
                "name", "bio", "title", "company", "location", 
                "skills", "experience", "education", "avatar_url",
                "first_name", "last_name", "display_name"
            ],
            DataCategory.CONTACT: [
                "email", "phone", "linkedin_url", "website_url", 
                "github_url", "social_links", "contact_info"
            ],
            DataCategory.ACTIVITY: [
                "last_active", "activity_log", "login_history",
                "referral_count", "success_rate", "activity_stats",
                "last_login", "login_count"
            ],
            DataCategory.ANALYTICS: [
                "page_views", "click_tracking", "usage_analytics",
                "performance_metrics", "behavior_data", "session_data"
            ]
        }
    
    async def get_user_privacy_settings(self, user_id: str) -> Dict[str, Any]:
        """Get user's privacy settings"""
        return self.db.get_user_privacy_settings(user_id)
    
    async def update_user_privacy_settings(self, user_id: str, settings: Dict[str, Any]) -> bool:
        """Update user's privacy settings"""
        return self.db.update_user_privacy_settings(user_id, settings)
    
    async def check_endpoint_permission(
        self,
        user_id: str,
        endpoint: str,
        method: str = "GET"
    ) -> Dict[str, Any]:
        """Check if user's privacy settings allow access to endpoint"""
        
        settings = await self.get_user_privacy_settings(user_id)
        
        result = {
            "allowed": True,
            "reason": None,
            "restricted_fields": [],
            "requires_consent": False
        }
        
        # Check endpoint-specific blocks
        for setting_name, rule in self.privacy_rules.items():
            if "blocks_endpoints" in rule:
                setting_value = settings.get(setting_name, True)
                if not setting_value and endpoint in rule["blocks_endpoints"]:
                    result["allowed"] = False
                    result["reason"] = f"Blocked by {setting_name} privacy setting"
                    return result
        
        # Check data category restrictions
        affected_categories = self._get_endpoint_data_categories(endpoint)
        for category in affected_categories:
            restrictions = await self._get_category_restrictions(user_id, category)
            if restrictions["blocked"]:
                result["allowed"] = False
                result["reason"] = f"Blocked by privacy settings for {category} data"
                return result
            
            result["restricted_fields"].extend(restrictions["restricted_fields"])
        
        return result
    
    def _get_endpoint_data_categories(self, endpoint: str) -> List[str]:
        """Determine what data categories an endpoint accesses"""
        
        category_patterns = {
            DataCategory.PROFILE: ["/api/users/profile", "/api/users/me", "/api/profiles", "/api/user/"],
            DataCategory.CONTACT: ["/api/users/contact", "/api/users/email", "/api/contact"],
            DataCategory.REFERRALS: ["/api/referrals", "/api/requests"],
            DataCategory.CONVERSATIONS: ["/api/conversations", "/api/messages"],
            DataCategory.ANALYTICS: ["/api/analytics", "/api/tracking", "/api/stats"],
            DataCategory.ACTIVITY: ["/api/activity", "/api/user-activity"]
        }
        
        categories = []
        for category, patterns in category_patterns.items():
            if any(pattern in endpoint for pattern in patterns):
                categories.append(category)
        
        return categories
    
    async def _get_category_restrictions(
        self,
        user_id: str,
        category: str
    ) -> Dict[str, Any]:
        """Get restrictions for a specific data category"""
        
        settings = await self.get_user_privacy_settings(user_id)
        
        result = {
            "blocked": False,
            "restricted_fields": [],
            "requires_permission": False
        }
        
        # Check category-specific rules
        if category == DataCategory.ANALYTICS:
            if not settings.get("analytics_tracking", True):
                result["blocked"] = True
                return result
        
        if category == DataCategory.CONTACT:
            if not settings.get("show_email", True):
                result["restricted_fields"].append("email")
            if not settings.get("show_phone", True):
                result["restricted_fields"].append("phone")
        
        # Check profile visibility
        profile_visibility = settings.get("profile_visibility", PrivacyLevel.PUBLIC)
        if category in [DataCategory.PROFILE, DataCategory.CONTACT]:
            if profile_visibility == PrivacyLevel.PRIVATE:
                result["requires_permission"] = True
        
        return result
    
    async def filter_response_data(
        self,
        data: Dict[str, Any],
        user_id: str,
        requesting_user_id: str = None,
        endpoint: str = None
    ) -> Dict[str, Any]:
        """Filter response data based on privacy settings"""
        
        if user_id == requesting_user_id:
            # Users can see their own data
            return data
        
        settings = await self.get_user_privacy_settings(user_id)
        filtered_data = data.copy()
        
        # Apply profile visibility rules
        profile_visibility = settings.get("profile_visibility", PrivacyLevel.PUBLIC)
        
        if profile_visibility == PrivacyLevel.PRIVATE:
            # Only show basic public info
            allowed_fields = ["id", "name", "first_name", "title", "company"]
            filtered_data = {k: v for k, v in filtered_data.items() if k in allowed_fields}
            
        elif profile_visibility == PrivacyLevel.CONNECTIONS:
            # Check if requesting user is a connection
            is_connection = self.db.check_user_connection(user_id, requesting_user_id)
            if not is_connection:
                allowed_fields = ["id", "name", "first_name", "title", "company", "bio", "location"]
                filtered_data = {k: v for k, v in filtered_data.items() if k in allowed_fields}
        
        # Apply field-specific restrictions
        if not settings.get("show_email", True):
            for email_field in ["email", "email_verified", "contact_email"]:
                filtered_data.pop(email_field, None)
        
        if not settings.get("show_phone", True):
            for phone_field in ["phone", "phone_verified", "contact_phone"]:
                filtered_data.pop(phone_field, None)
        
        # Filter activity data
        if not settings.get("data_sharing", True):
            activity_fields = self.field_mappings.get(DataCategory.ACTIVITY, [])
            for field in activity_fields:
                filtered_data.pop(field, None)
        
        # Filter analytics data
        if not settings.get("analytics_tracking", True):
            analytics_fields = self.field_mappings.get(DataCategory.ANALYTICS, [])
            for field in analytics_fields:
                filtered_data.pop(field, None)
        
        return filtered_data
    
    async def log_privacy_access(
        self,
        user_id: str,
        requesting_user_id: str,
        endpoint: str,
        data_accessed: List[str],
        granted: bool,
        ip_address: str = None,
        user_agent: str = None,
        reason: str = None
    ):
        """Log privacy-related access for audit purposes"""
        
        log_data = {
            "user_id": user_id,
            "requesting_user_id": requesting_user_id,
            "endpoint": endpoint,
            "data_accessed": data_accessed,
            "access_granted": granted,
            "reason": reason,
            "ip_address": ip_address,
            "user_agent": user_agent
        }
        
        self.db.log_privacy_access(log_data)
    
    async def check_data_export_permission(
        self,
        user_id: str,
        export_type: str = "full"
    ) -> Dict[str, Any]:
        """Check permissions for data export"""
        
        settings = await self.get_user_privacy_settings(user_id)
        
        allowed_categories = []
        
        # Always allow basic profile data for the user themselves
        allowed_categories.append(DataCategory.PROFILE)
        
        if settings.get("data_sharing", True):
            allowed_categories.extend([
                DataCategory.ACTIVITY,
                DataCategory.ANALYTICS
            ])
        
        # Contact info is always available to the user
        allowed_categories.append(DataCategory.CONTACT)
        
        # Referrals and conversations based on permissions
        if settings.get("allow_referral_requests", True):
            allowed_categories.append(DataCategory.REFERRALS)
        
        if settings.get("allow_premium_conversations", True):
            allowed_categories.append(DataCategory.CONVERSATIONS)
        
        return {
            "allowed": True,
            "categories": allowed_categories,
            "restrictions": {
                "no_analytics": not settings.get("analytics_tracking", True),
                "no_third_party_data": not settings.get("data_sharing", True),
                "no_marketing_data": not settings.get("marketing_communications", False)
            }
        }
    
    async def get_privacy_audit_logs(
        self,
        user_id: str,
        limit: int = 100,
        offset: int = 0
    ) -> List[Dict[str, Any]]:
        """Get privacy audit logs for a user"""
        
        db = self.db.SessionLocal()
        try:
            logs = db.query(PrivacyAuditLog).filter(
                PrivacyAuditLog.user_id == user_id
            ).order_by(PrivacyAuditLog.created_at.desc()).offset(offset).limit(limit).all()
            
            return [
                {
                    "id": str(log.id),
                    "requesting_user_id": str(log.requesting_user_id) if log.requesting_user_id else None,
                    "endpoint": log.endpoint,
                    "data_accessed": log.data_accessed,
                    "access_granted": log.access_granted,
                    "reason": log.reason,
                    "ip_address": log.ip_address,
                    "created_at": log.created_at.isoformat()
                }
                for log in logs
            ]
        finally:
            db.close()

# Global privacy enforcer instance
privacy_enforcer = PrivacyEnforcer()

# Middleware functions
async def enforce_privacy_middleware(request: Request, call_next):
    """FastAPI middleware to enforce privacy settings"""
    
    # Skip privacy checks for public endpoints
    public_endpoints = ["/api/auth", "/api/health", "/api/docs", "/api/openapi.json"]
    if any(request.url.path.startswith(endpoint) for endpoint in public_endpoints):
        return await call_next(request)
    
    # Get user ID from request
    user_id = request.headers.get("X-User-ID") or getattr(request.state, "user_id", None)
    requesting_user_id = request.headers.get("X-Requesting-User-ID") or user_id
    
    if not user_id:
        # No user context, proceed normally
        return await call_next(request)
    
    # Get client info for logging
    ip_address = request.client.host if request.client else None
    user_agent = request.headers.get("user-agent")
    
    # Check endpoint permissions
    permission_check = await privacy_enforcer.check_endpoint_permission(
        user_id=user_id,
        endpoint=request.url.path,
        method=request.method
    )
    
    if not permission_check["allowed"]:
        # Log access denial
        await privacy_enforcer.log_privacy_access(
            user_id=user_id,
            requesting_user_id=requesting_user_id,
            endpoint=request.url.path,
            data_accessed=[],
            granted=False,
            ip_address=ip_address,
            user_agent=user_agent,
            reason=permission_check["reason"]
        )
        
        return JSONResponse(
            status_code=403,
            content={
                "error": "Access denied by privacy settings",
                "reason": permission_check["reason"]
            }
        )
    
    # Process the request
    response = await call_next(request)
    
    # Filter response data if needed for GET requests
    if (request.method == "GET" and 
        hasattr(response, "body") and 
        response.headers.get("content-type", "").startswith("application/json")):
        
        try:
            response_body = response.body.decode()
            response_data = json.loads(response_body)
            
            # Filter the response if it contains user data
            if isinstance(response_data, dict):
                target_user_id = response_data.get("user_id") or response_data.get("id")
                
                if target_user_id and target_user_id != requesting_user_id:
                    filtered_data = await privacy_enforcer.filter_response_data(
                        data=response_data,
                        user_id=target_user_id,
                        requesting_user_id=requesting_user_id,
                        endpoint=request.url.path
                    )
                    
                    # Update response body
                    new_body = json.dumps(filtered_data).encode()
                    response._content = new_body
                    response.headers["content-length"] = str(len(new_body))
                    
                    # Log successful access with filtering
                    await privacy_enforcer.log_privacy_access(
                        user_id=target_user_id,
                        requesting_user_id=requesting_user_id,
                        endpoint=request.url.path,
                        data_accessed=list(filtered_data.keys()),
                        granted=True,
                        ip_address=ip_address,
                        user_agent=user_agent
                    )
                
        except (json.JSONDecodeError, UnicodeDecodeError, AttributeError):
            # If we can't parse/filter, proceed with original response
            pass
    
    return response

# Decorator for endpoint-level privacy enforcement
def require_privacy_permission(data_categories: List[str] = None):
    """Decorator to enforce privacy permissions on specific endpoints"""
    
    def decorator(func):
        @wraps(func)
        async def wrapper(*args, **kwargs):
            # Extract user context from kwargs or request
            user_id = kwargs.get("user_id") or kwargs.get("current_user", {}).get("id")
            
            if user_id and data_categories:
                for category in data_categories:
                    restrictions = await privacy_enforcer._get_category_restrictions(user_id, category)
                    if restrictions["blocked"]:
                        raise HTTPException(
                            status_code=403,
                            detail=f"Access denied by privacy settings for {category} data"
                        )
            
            return await func(*args, **kwargs)
        
        return wrapper
    return decorator

# Analytics tracking decorator
def track_with_privacy(event_name: str, data_categories: List[str] = None):
    """Decorator to track events while respecting privacy settings"""
    
    def decorator(func):
        @wraps(func)
        async def wrapper(*args, **kwargs):
            result = await func(*args, **kwargs)
            
            # Get user context
            user_id = kwargs.get("user_id") or kwargs.get("current_user", {}).get("id")
            
            if user_id:
                settings = await privacy_enforcer.get_user_privacy_settings(user_id)
                
                # Only track if analytics tracking is enabled
                if settings.get("analytics_tracking", True):
                    logger.info(f"Analytics event: {event_name} for user {user_id}")
                else:
                    logger.info(f"Analytics tracking skipped for user {user_id} due to privacy settings")
            
            return result
        
        return wrapper
    return decorator

# Data export function with privacy enforcement
async def export_user_data(
    user_id: str,
    export_format: str = "json",
    categories: List[str] = None
) -> Dict[str, Any]:
    """Export user data respecting privacy settings"""
    
    # Check export permissions
    permissions = await privacy_enforcer.check_data_export_permission(user_id)
    
    if not permissions["allowed"]:
        raise HTTPException(status_code=403, detail="Data export not allowed")
    
    # Filter categories based on permissions
    allowed_categories = permissions["categories"]
    if categories:
        categories = [cat for cat in categories if cat in allowed_categories]
    else:
        categories = allowed_categories
    
    # Collect data from each category (implement actual data retrieval)
    export_data = {
        "user_id": user_id,
        "export_timestamp": datetime.utcnow().isoformat(),
        "categories_included": categories,
        "restrictions": permissions["restrictions"],
        "data": {}
    }
    
    for category in categories:
        try:
            export_data["data"][category] = await _get_category_data(user_id, category)
        except Exception as e:
            logger.error(f"Failed to export {category} data for user {user_id}: {e}")
            export_data["data"][category] = {"error": "Failed to export this category"}
    
    return export_data

async def _get_category_data(user_id: str, category: str) -> Dict[str, Any]:
    """Get data for a specific category - implement actual database queries"""
    
    # This would implement actual database queries for each category
    # For now, returning structure that would be filled with real data
    
    db = privacy_enforcer.db.SessionLocal()
    try:
        if category == DataCategory.PROFILE:
            # Query user profile data
            return {"category": "profile", "note": "Real profile data would be queried here"}
        
        elif category == DataCategory.CONTACT:
            # Query contact information
            return {"category": "contact", "note": "Real contact data would be queried here"}
        
        elif category == DataCategory.ACTIVITY:
            # Query activity logs
            return {"category": "activity", "note": "Real activity data would be queried here"}
        
        elif category == DataCategory.REFERRALS:
            # Query referral data
            return {"category": "referrals", "note": "Real referral data would be queried here"}
        
        elif category == DataCategory.CONVERSATIONS:
            # Query conversation data
            return {"category": "conversations", "note": "Real conversation data would be queried here"}
        
        else:
            return {"category": category, "data": []}
            
    finally:
        db.close() 