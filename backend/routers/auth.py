from fastapi import APIRouter, HTTPException, status, Depends, Request
from datetime import timedelta, datetime
import json

from models import (
    UserRegister, UserLogin, TokenResponse, TokenRefresh, 
    UserResponse, SuccessResponse, ErrorResponse,
    OTPRequest, OTPVerification, OTPResponse, EmployeeRegistrationRequest
)
from auth_utils import (
    AuthUtils, get_current_user, format_user_response, 
    validate_password_strength, rate_limiter
)
from database import DatabaseManager
from services.otp_service import otp_service
from services.email_service import EmailService, EmailTemplate

router = APIRouter()

@router.post("/register", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
async def register(user_data: UserRegister, request: Request):
    """Register a new user"""
    
    # Rate limiting check
    client_ip = request.client.host
    if rate_limiter.is_rate_limited(f"register_{client_ip}", max_attempts=3, window_minutes=10):
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Too many registration attempts. Please try again later."
        )
    
    # Check if user already exists
    existing_user = DatabaseManager.get_user_by_email(user_data.email)
    if existing_user:
        rate_limiter.record_attempt(f"register_{client_ip}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
    
    # Validate password strength
    password_validation = validate_password_strength(user_data.password)
    if not password_validation["valid"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={
                "message": "Password does not meet requirements",
                "errors": password_validation["errors"],
                "suggestions": password_validation["suggestions"]
            }
        )
    
    try:
        # Hash password
        password_hash = AuthUtils.get_password_hash(user_data.password)
        
        # Prepare user data for database
        user_db_data = {
            "department": user_data.department,
            "position": user_data.position,
            "company": user_data.company,
            "bio": user_data.bio,
            "skills": json.dumps(user_data.skills) if user_data.skills else "[]",
            "experience_years": user_data.experience_years
        }
        
        # Create user in database
        user_id = DatabaseManager.create_user(
            email=user_data.email,
            password_hash=password_hash,
            name=user_data.name,
            role=user_data.role.value,
            **user_db_data
        )
        
        # Get created user
        user = DatabaseManager.get_user_by_id(user_id)
        if not user:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to create user"
            )
        
        # Create tokens
        access_token_expires = timedelta(minutes=30)
        access_token = AuthUtils.create_access_token(
            data={"sub": str(user["id"]), "email": user["email"], "role": user["role"]},
            expires_delta=access_token_expires
        )
        refresh_token = AuthUtils.create_refresh_token(user["id"])
        
        # Send welcome email asynchronously (don't block registration on email failure)
        try:
            email_service = EmailService()
            template = EmailTemplate.WELCOME_CANDIDATE if user_data.role.value == 'candidate' else EmailTemplate.WELCOME_EMPLOYEE
            
            dashboard_url = "http://localhost:3000/dashboard"  # In production, use environment variable
            
            await email_service.send_email(
                to_email=user_data.email,
                subject=f"🎉 Welcome to ReferralInc Beta - Your journey starts now!",
                template=template,
                template_data={
                    "name": user_data.name,
                    "company": user_data.company or "your company",
                    "dashboard_url": dashboard_url
                }
            )
        except Exception as email_error:
            # Log email error but don't fail registration
            print(f"Failed to send welcome email: {email_error}")
        
        # Format user response
        user_response = format_user_response(user)
        
        return TokenResponse(
            access_token=access_token,
            refresh_token=refresh_token,
            token_type="bearer",
            expires_in=30 * 60,  # 30 minutes in seconds
            user=user_response
        )
        
    except Exception as e:
        rate_limiter.record_attempt(f"register_{client_ip}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Registration failed: {str(e)}"
        )

@router.post("/login", response_model=TokenResponse)
async def login(user_credentials: UserLogin, request: Request):
    """Authenticate user and return tokens"""
    
    # Rate limiting check
    client_ip = request.client.host
    identifier = f"login_{user_credentials.email}_{client_ip}"
    
    if rate_limiter.is_rate_limited(identifier, max_attempts=5, window_minutes=15):
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Too many login attempts. Please try again later."
        )
    
    # Authenticate user
    user = AuthUtils.authenticate_user(user_credentials.email, user_credentials.password)
    if not user:
        rate_limiter.record_attempt(identifier)
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Check if user is active
    if not user.get("is_active", False):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Account is inactive. Please contact support."
        )
    
    try:
        # Create tokens
        access_token_expires = timedelta(minutes=30)
        access_token = AuthUtils.create_access_token(
            data={"sub": str(user["id"]), "email": user["email"], "role": user["role"]},
            expires_delta=access_token_expires
        )
        refresh_token = AuthUtils.create_refresh_token(user["id"])
        
        # Log login activity
        DatabaseManager.execute_query(
            "INSERT INTO user_activity_logs (user_id, activity_type, activity_data) VALUES (?, ?, ?)",
            (user["id"], "login", json.dumps({"ip": client_ip, "timestamp": datetime.utcnow().isoformat()}))
        )
        
        # Update user's last activity timestamp to mark them as active
        DatabaseManager.execute_query(
            "UPDATE users SET updated_at = CURRENT_TIMESTAMP WHERE id = ?",
            (user["id"],)
        )
        
        # Format user response
        user_response = format_user_response(user)
        
        return TokenResponse(
            access_token=access_token,
            refresh_token=refresh_token,
            token_type="bearer",
            expires_in=30 * 60,  # 30 minutes in seconds
            user=user_response
        )
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Login failed: {str(e)}"
        )

@router.post("/refresh", response_model=TokenResponse)
async def refresh_token(token_data: TokenRefresh):
    """Refresh access token using refresh token"""
    
    # Get new access token
    token_response = AuthUtils.refresh_access_token(token_data.refresh_token)
    if not token_response:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid refresh token",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Get user data for response
    session = DatabaseManager.get_session_by_token(token_data.refresh_token)
    if not session:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid refresh token"
        )
    
    user = DatabaseManager.get_user_by_id(session["user_id"])
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found"
        )
    
    user_response = format_user_response(user)
    
    return TokenResponse(
        access_token=token_response["access_token"],
        refresh_token=token_data.refresh_token,  # Keep the same refresh token
        token_type=token_response["token_type"],
        expires_in=token_response["expires_in"],
        user=user_response
    )

@router.post("/logout", response_model=SuccessResponse)
async def logout(token_data: TokenRefresh, current_user = Depends(get_current_user)):
    """Logout user by revoking refresh token"""
    
    # Log logout activity
    DatabaseManager.execute_query(
        "INSERT INTO user_activity_logs (user_id, activity_type, activity_data) VALUES (?, ?, ?)",
        (current_user["id"], "logout", json.dumps({"timestamp": datetime.utcnow().isoformat()}))
    )
    
    # Update user's last activity timestamp to mark them as offline
    DatabaseManager.execute_query(
        "UPDATE users SET updated_at = CURRENT_TIMESTAMP WHERE id = ?",
        (current_user["id"],)
    )
    
    success = AuthUtils.revoke_refresh_token(token_data.refresh_token)
    
    if not success:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid refresh token"
        )
    
    return SuccessResponse(
        success=True,
        message="Successfully logged out"
    )

@router.get("/me", response_model=UserResponse)
async def get_current_user_info(current_user = Depends(get_current_user)):
    """Get current user information and update activity"""
    from datetime import datetime, timezone
    
    # Check if the most recent activity was logout - if so, don't log heartbeat
    recent_activity = DatabaseManager.execute_query(
        "SELECT activity_type, created_at FROM user_activity_logs WHERE user_id = ? ORDER BY id DESC LIMIT 1",
        (current_user["id"],)
    )
    
    should_log_heartbeat = True
    if recent_activity:
        activity = recent_activity[0]
        # If the most recent activity was logout and it was within the last 5 minutes, don't log heartbeat
        if activity["activity_type"] == "logout":
            logout_time = datetime.fromisoformat(activity["created_at"].replace("Z", "+00:00")) if "T" in activity["created_at"] else datetime.strptime(activity["created_at"], "%Y-%m-%d %H:%M:%S").replace(tzinfo=timezone.utc)
            time_diff = datetime.now(timezone.utc) - logout_time
            if time_diff.total_seconds() < 300:  # 5 minutes
                should_log_heartbeat = False
    
    if should_log_heartbeat:
        # Log heartbeat activity
        DatabaseManager.execute_query(
            "INSERT INTO user_activity_logs (user_id, activity_type, activity_data) VALUES (?, ?, ?)",
            (current_user["id"], "heartbeat", json.dumps({"timestamp": datetime.utcnow().isoformat()}))
        )
        
        # Update user's last activity timestamp
        DatabaseManager.execute_query(
            "UPDATE users SET updated_at = CURRENT_TIMESTAMP WHERE id = ?",
            (current_user["id"],)
        )
    
    return format_user_response(current_user)

@router.post("/verify-token")
async def verify_token(current_user = Depends(get_current_user)):
    """Verify if token is valid (protected endpoint for frontend)"""
    return {
        "valid": True,
        "user_id": current_user["id"],
        "email": current_user["email"],
        "role": current_user["role"]
    }

@router.post("/forgot-password", response_model=SuccessResponse)
async def forgot_password(email_data: dict):
    """Send password reset email (placeholder implementation)"""
    email = email_data.get("email")
    if not email:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email is required"
        )
    
    # Check if user exists
    user = DatabaseManager.get_user_by_email(email)
    if not user:
        # Don't reveal if user exists or not for security
        return SuccessResponse(
            success=True,
            message="If an account with that email exists, a password reset link has been sent."
        )
    
    # TODO: Implement actual email sending logic
    # For now, just return success
    return SuccessResponse(
        success=True,
        message="If an account with that email exists, a password reset link has been sent."
    )

@router.post("/reset-password", response_model=SuccessResponse)
async def reset_password(reset_data: dict):
    """Reset password using reset token (placeholder implementation)"""
    token = reset_data.get("token")
    new_password = reset_data.get("password")
    
    if not token or not new_password:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Token and password are required"
        )
    
    # Validate password strength
    password_validation = validate_password_strength(new_password)
    if not password_validation["valid"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={
                "message": "Password does not meet requirements",
                "errors": password_validation["errors"],
                "suggestions": password_validation["suggestions"]
            }
        )
    
    # TODO: Implement actual password reset logic with token validation
    # For now, just return success
    return SuccessResponse(
        success=True,
        message="Password has been reset successfully"
    )

@router.post("/validate-password")
async def validate_password(password_data: dict):
    """Validate password strength"""
    password = password_data.get("password")
    if not password:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Password is required"
        )
    
    validation_result = validate_password_strength(password)
    return validation_result

@router.post("/employee/request-otp", response_model=OTPResponse)
async def request_employee_otp(registration_data: EmployeeRegistrationRequest, request: Request):
    """Request OTP for employee registration with company email validation"""
    
    # Rate limiting check
    client_ip = request.client.host
    if rate_limiter.is_rate_limited(f"otp_request_{client_ip}", max_attempts=3, window_minutes=10):
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Too many OTP requests. Please try again later."
        )
    
    # Check if user already exists
    existing_user = DatabaseManager.get_user_by_email(registration_data.email)
    if existing_user:
        rate_limiter.record_attempt(f"otp_request_{client_ip}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
    
    # Validate password strength
    password_validation = validate_password_strength(registration_data.password)
    if not password_validation["valid"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={
                "message": "Password does not meet requirements",
                "errors": password_validation["errors"],
                "suggestions": password_validation["suggestions"]
            }
        )
    
    try:
        # Prepare user data for OTP storage
        user_data = {
            "email": registration_data.email,
            "password": registration_data.password,
            "name": registration_data.name,
            "company": registration_data.company,
            "department": registration_data.department,
            "position": registration_data.position,
            "bio": registration_data.bio,
            "skills": registration_data.skills or [],
            "experience_years": registration_data.experience_years
        }
        
        # Send OTP
        result = await otp_service.send_otp(
            email=registration_data.email,
            purpose="registration",
            user_data=user_data
        )
        
        if result["success"]:
            return OTPResponse(
                success=True,
                message=result["message"],
                expires_in=result.get("expires_in")
            )
        else:
            rate_limiter.record_attempt(f"otp_request_{client_ip}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=result["message"]
            )
            
    except Exception as e:
        rate_limiter.record_attempt(f"otp_request_{client_ip}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to send OTP: {str(e)}"
        )

@router.post("/employee/verify-otp", response_model=TokenResponse)
async def verify_employee_otp(verification_data: OTPVerification, request: Request):
    """Verify OTP and complete employee registration"""
    
    # Rate limiting check
    client_ip = request.client.host
    if rate_limiter.is_rate_limited(f"otp_verify_{client_ip}", max_attempts=5, window_minutes=15):
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Too many verification attempts. Please try again later."
        )
    
    try:
        # Verify OTP
        result = await otp_service.verify_otp(
            email=verification_data.email,
            otp_code=verification_data.otp_code,
            purpose=verification_data.purpose
        )
        
        if not result["success"]:
            rate_limiter.record_attempt(f"otp_verify_{client_ip}")
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=result["message"]
            )
        
        # Get user data from OTP verification
        user_data = result["user_data"]
        if not user_data:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid verification data"
            )
        
        # Check if user already exists (double check)
        existing_user = DatabaseManager.get_user_by_email(user_data["email"])
        if existing_user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email already registered"
            )
        
        # Hash password
        password_hash = AuthUtils.get_password_hash(user_data["password"])
        
        # Prepare user data for database
        user_db_data = {
            "department": user_data.get("department"),
            "position": user_data.get("position"),
            "company": user_data.get("company"),
            "bio": user_data.get("bio"),
            "skills": json.dumps(user_data.get("skills", [])),
            "experience_years": user_data.get("experience_years")
        }
        
        # Create user in database (employee is automatically verified after OTP)
        user_id = DatabaseManager.create_user(
            email=user_data["email"],
            password_hash=password_hash,
            name=user_data["name"],
            role="employee",
            **user_db_data
        )
        
        # Mark user as verified since they passed OTP verification
        DatabaseManager.execute_query(
            "UPDATE users SET is_verified = TRUE WHERE id = ?",
            (user_id,)
        )
        
        # Get created user
        user = DatabaseManager.get_user_by_id(user_id)
        if not user:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to create user"
            )
        
        # Create tokens
        access_token_expires = timedelta(minutes=30)
        access_token = AuthUtils.create_access_token(
            data={"sub": str(user["id"]), "email": user["email"], "role": user["role"]},
            expires_delta=access_token_expires
        )
        refresh_token = AuthUtils.create_refresh_token(user["id"])
        
        # Log registration activity
        DatabaseManager.execute_query(
            "INSERT INTO user_activity_logs (user_id, activity_type, activity_data, ip_address) VALUES (?, ?, ?, ?)",
            (user["id"], "registration", json.dumps({"method": "otp_verification", "timestamp": datetime.utcnow().isoformat()}), client_ip)
        )
        
        # Send welcome email for verified employee
        try:
            email_service = EmailService()
            dashboard_url = "http://localhost:3000/dashboard"  # In production, use environment variable
            
            await email_service.send_email(
                to_email=user_data["email"],
                subject=f"🎉 Welcome to ReferralInc - Email Verified!",
                template=EmailTemplate.WELCOME_EMPLOYEE,
                template_data={
                    "name": user_data["name"],
                    "company": user_data.get("company", "your company"),
                    "dashboard_url": dashboard_url
                }
            )
        except Exception as email_error:
            # Log email error but don't fail registration
            print(f"Failed to send employee welcome email: {email_error}")
        
        # Format user response
        user_response = format_user_response(user)
        
        return TokenResponse(
            access_token=access_token,
            refresh_token=refresh_token,
            token_type="bearer",
            expires_in=30 * 60,  # 30 minutes in seconds
            user=user_response
        )
        
    except HTTPException:
        raise
    except Exception as e:
        rate_limiter.record_attempt(f"otp_verify_{client_ip}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Verification failed: {str(e)}"
        )

@router.post("/admin/approve-beta/{user_id}", response_model=SuccessResponse)
async def approve_beta_access(user_id: int, current_user = Depends(get_current_user)):
    """Admin endpoint to approve beta access for a user"""
    
    # Check if current user is admin (for now, just check if they're an employee)
    # In production, add proper admin role
    if current_user.get("role") != "employee":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only employees can approve beta access for now"
        )
    
    try:
        # Get user to approve
        user = DatabaseManager.get_user_by_id(user_id)
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )
        
        # Check if already approved
        if user.get("beta_approved", False):
            return SuccessResponse(
                success=True,
                message="User already has beta access approved"
            )
        
        # Update beta approval status
        DatabaseManager.execute_query(
            "UPDATE users SET beta_approved = TRUE, beta_approved_at = CURRENT_TIMESTAMP WHERE id = ?",
            (user_id,)
        )
        
        # Send beta approval email
        try:
            email_service = EmailService()
            dashboard_url = "http://localhost:3000/dashboard"
            
            await email_service.send_email(
                to_email=user["email"],
                subject="🎊 Your ReferralInc Beta Access is Approved!",
                template=EmailTemplate.BETA_APPROVAL,
                template_data={
                    "name": user["name"],
                    "dashboard_url": dashboard_url
                }
            )
        except Exception as email_error:
            print(f"Failed to send beta approval email: {email_error}")
        
        # Log approval activity
        DatabaseManager.execute_query(
            "INSERT INTO user_activity_logs (user_id, activity_type, activity_data) VALUES (?, ?, ?)",
            (user_id, "beta_approved", json.dumps({
                "approved_by": current_user["id"],
                "approved_by_name": current_user["name"],
                "timestamp": datetime.utcnow().isoformat()
            }))
        )
        
        return SuccessResponse(
            success=True,
            message=f"Beta access approved for {user['name']}"
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to approve beta access: {str(e)}"
        )

@router.get("/admin/pending-beta", response_model=dict)
async def get_pending_beta_users(current_user = Depends(get_current_user)):
    """Get list of users pending beta approval"""
    
    # Check if current user is admin (for now, just check if they're an employee)
    if current_user.get("role") != "employee":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only employees can view pending beta users for now"
        )
    
    try:
        # Get users who are not beta approved yet
        pending_users = DatabaseManager.execute_query(
            """
            SELECT id, name, email, role, created_at, beta_requested_at
            FROM users 
            WHERE beta_approved = FALSE AND is_active = TRUE
            ORDER BY created_at ASC
            """,
            fetch_all=True
        )
        
        return {
            "success": True,
            "pending_users": [
                {
                    "id": user["id"],
                    "name": user["name"],
                    "email": user["email"],
                    "role": user["role"],
                    "created_at": user["created_at"],
                    "beta_requested_at": user["beta_requested_at"],
                    "waiting_days": (datetime.utcnow() - datetime.fromisoformat(user["created_at"].replace("Z", "+00:00")) if "T" in user["created_at"] else datetime.strptime(user["created_at"], "%Y-%m-%d %H:%M:%S")).days
                }
                for user in pending_users
            ],
            "total_pending": len(pending_users)
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get pending beta users: {str(e)}"
        ) 