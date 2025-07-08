from datetime import datetime, timedelta, timezone
from typing import Optional, Dict, Any
import secrets
import string

from fastapi import HTTPException, status, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import JWTError, jwt
from passlib.context import CryptContext
from decouple import config

from database import DatabaseManager
from models import UserResponse, UserRole

# Security configuration
SECRET_KEY = config("SECRET_KEY", default="your-super-secret-key-change-in-production")
ALGORITHM = config("ALGORITHM", default="HS256")
ACCESS_TOKEN_EXPIRE_MINUTES = int(config("ACCESS_TOKEN_EXPIRE_MINUTES", default="30"))
REFRESH_TOKEN_EXPIRE_DAYS = int(config("REFRESH_TOKEN_EXPIRE_DAYS", default="7"))

# Password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# JWT Bearer scheme
security = HTTPBearer()

class AuthUtils:
    """Authentication utility functions"""
    
    @staticmethod
    def verify_password(plain_password: str, hashed_password: str) -> bool:
        """Verify a password against its hash"""
        return pwd_context.verify(plain_password, hashed_password)
    
    @staticmethod
    def get_password_hash(password: str) -> str:
        """Generate password hash"""
        return pwd_context.hash(password)
    
    @staticmethod
    def generate_random_token(length: int = 32) -> str:
        """Generate a random token for refresh tokens"""
        alphabet = string.ascii_letters + string.digits
        return ''.join(secrets.choice(alphabet) for _ in range(length))
    
    @staticmethod
    def create_access_token(data: Dict[str, Any], expires_delta: Optional[timedelta] = None) -> str:
        """Create JWT access token"""
        to_encode = data.copy()
        
        if expires_delta:
            expire = datetime.now(timezone.utc) + expires_delta
        else:
            expire = datetime.now(timezone.utc) + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
        
        to_encode.update({"exp": expire})
        encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
        return encoded_jwt
    
    @staticmethod
    def create_refresh_token(user_id: int) -> str:
        """Create refresh token and store in database"""
        refresh_token = AuthUtils.generate_random_token()
        expires_at = datetime.now(timezone.utc) + timedelta(days=REFRESH_TOKEN_EXPIRE_DAYS)
        
        # Store in database
        DatabaseManager.create_session(user_id, refresh_token, expires_at)
        return refresh_token
    
    @staticmethod
    def verify_token(token: str) -> Optional[Dict[str, Any]]:
        """Verify and decode JWT token"""
        try:
            payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
            return payload
        except JWTError:
            return None
    
    @staticmethod
    def authenticate_user(email: str, password: str) -> Optional[Dict[str, Any]]:
        """Authenticate user with email and password"""
        user = DatabaseManager.get_user_by_email(email)
        if not user:
            return None
        
        if not AuthUtils.verify_password(password, user["password_hash"]):
            return None
        
        return user
    
    @staticmethod
    def refresh_access_token(refresh_token: str) -> Optional[Dict[str, str]]:
        """Generate new access token using refresh token"""
        session = DatabaseManager.get_session_by_token(refresh_token)
        if not session:
            return None
        
        # Get user data
        user = DatabaseManager.get_user_by_id(session["user_id"])
        if not user:
            return None
        
        # Create new access token
        access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
        access_token = AuthUtils.create_access_token(
            data={"sub": str(user["id"]), "email": user["email"], "role": user["role"]},
            expires_delta=access_token_expires
        )
        
        return {
            "access_token": access_token,
            "token_type": "bearer",
            "expires_in": ACCESS_TOKEN_EXPIRE_MINUTES * 60
        }
    
    @staticmethod
    def revoke_refresh_token(refresh_token: str) -> bool:
        """Revoke refresh token"""
        return DatabaseManager.deactivate_session(refresh_token)

def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)) -> Dict[str, Any]:
    """Get current authenticated user from JWT token"""
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    try:
        # Extract token from credentials
        token = credentials.credentials
        payload = AuthUtils.verify_token(token)
        
        if payload is None:
            raise credentials_exception
        
        user_id = payload.get("sub")
        if user_id is None:
            raise credentials_exception
        
        # Get user from database
        user = DatabaseManager.get_user_by_id(int(user_id))
        if user is None:
            raise credentials_exception
        
        return user
    
    except JWTError:
        raise credentials_exception

def get_current_active_user(current_user: Dict[str, Any] = Depends(get_current_user)) -> Dict[str, Any]:
    """Get current active user"""
    if not current_user.get("is_active", False):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Inactive user"
        )
    return current_user

def require_roles(allowed_roles: list):
    """Decorator to require specific user roles"""
    def role_checker(current_user: Dict[str, Any] = Depends(get_current_active_user)) -> Dict[str, Any]:
        if current_user.get("role") not in allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Operation not permitted"
            )
        return current_user
    return role_checker

# Role-specific dependencies
def get_candidate(current_user: Dict[str, Any] = Depends(require_roles([UserRole.CANDIDATE]))) -> Dict[str, Any]:
    """Get current candidate user"""
    return current_user

def get_employee(current_user: Dict[str, Any] = Depends(require_roles([UserRole.EMPLOYEE]))) -> Dict[str, Any]:
    """Get current employee user"""
    return current_user

def get_admin(current_user: Dict[str, Any] = Depends(require_roles([UserRole.ADMIN]))) -> Dict[str, Any]:
    """Get current admin user"""
    return current_user

def get_candidate_or_employee(current_user: Dict[str, Any] = Depends(require_roles([UserRole.CANDIDATE, UserRole.EMPLOYEE]))) -> Dict[str, Any]:
    """Get current candidate or employee user"""
    return current_user

# Utility functions for frontend integration
def format_user_response(user_data: Dict[str, Any]) -> UserResponse:
    """Format user data for API response"""
    # Parse skills JSON if it's a string
    skills = user_data.get("skills", "[]")
    if isinstance(skills, str):
        import json
        try:
            skills = json.loads(skills)
        except json.JSONDecodeError:
            skills = []
    
    # Convert datetime strings to datetime objects if needed
    created_at = user_data.get("created_at")
    updated_at = user_data.get("updated_at")
    
    if isinstance(created_at, str):
        created_at = datetime.fromisoformat(created_at.replace("Z", "+00:00"))
    if isinstance(updated_at, str):
        updated_at = datetime.fromisoformat(updated_at.replace("Z", "+00:00"))
    
    return UserResponse(
        id=user_data["id"],
        email=user_data["email"],
        name=user_data["name"],
        role=UserRole(user_data["role"]),
        avatar_url=user_data.get("avatar_url"),
        department=user_data.get("department"),
        position=user_data.get("position"),
        company=user_data.get("company"),
        bio=user_data.get("bio"),
        skills=skills,
        experience_years=user_data.get("experience_years"),
        rating=user_data.get("rating", 0.0),
        is_verified=bool(user_data.get("is_verified", False)),
        created_at=created_at or datetime.now(timezone.utc),
        updated_at=updated_at or datetime.now(timezone.utc)
    )

# Password validation
def validate_password_strength(password: str) -> Dict[str, Any]:
    """Validate password strength and return feedback"""
    errors = []
    suggestions = []
    score = 0
    
    if len(password) < 8:
        errors.append("Password must be at least 8 characters long")
    else:
        score += 1
    
    if not any(c.isupper() for c in password):
        suggestions.append("Add uppercase letters")
    else:
        score += 1
    
    if not any(c.islower() for c in password):
        suggestions.append("Add lowercase letters")
    else:
        score += 1
    
    if not any(c.isdigit() for c in password):
        suggestions.append("Add numbers")
    else:
        score += 1
    
    if not any(c in "!@#$%^&*()_+-=[]{}|;:,.<>?" for c in password):
        suggestions.append("Add special characters")
    else:
        score += 1
    
    strength = "Weak"
    if score >= 4:
        strength = "Strong"
    elif score >= 3:
        strength = "Medium"
    
    return {
        "valid": len(errors) == 0,
        "errors": errors,
        "suggestions": suggestions,
        "strength": strength,
        "score": score
    }

# Rate limiting utilities (basic implementation)
class RateLimiter:
    """Simple rate limiter for authentication endpoints"""
    
    def __init__(self):
        self.attempts = {}
    
    def is_rate_limited(self, identifier: str, max_attempts: int = 5, window_minutes: int = 15) -> bool:
        """Check if identifier is rate limited"""
        now = datetime.now(timezone.utc)
        window_start = now - timedelta(minutes=window_minutes)
        
        if identifier not in self.attempts:
            self.attempts[identifier] = []
        
        # Remove old attempts
        self.attempts[identifier] = [
            attempt for attempt in self.attempts[identifier] 
            if attempt > window_start
        ]
        
        return len(self.attempts[identifier]) >= max_attempts
    
    def record_attempt(self, identifier: str):
        """Record an authentication attempt"""
        if identifier not in self.attempts:
            self.attempts[identifier] = []
        
        self.attempts[identifier].append(datetime.now(timezone.utc))

# Global rate limiter instance
rate_limiter = RateLimiter() 