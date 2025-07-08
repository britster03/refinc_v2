import random
import string
import json
import asyncio
from datetime import datetime, timedelta
from typing import Optional, Dict, Any
from database import DatabaseManager
from services.email_service import EmailService, EmailTemplate

# Load environment variables from .env file
try:
    from dotenv import load_dotenv
    load_dotenv()
except ImportError:
    print("python-dotenv not installed. Environment variables from .env file won't be loaded.")

class OTPService:
    """Service for handling OTP generation, verification, and management"""
    
    def __init__(self):
        self.email_service = EmailService()
        self.otp_length = 6
        self.otp_expiry_minutes = 10
        self.max_attempts = 3
        
    def generate_otp(self) -> str:
        """Generate a random 6-digit OTP code"""
        return ''.join(random.choices(string.digits, k=self.otp_length))
    
    async def send_otp(self, email: str, purpose: str = "registration", user_data: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        """Generate and send OTP to email"""
        try:
            # Clean up expired OTPs first
            await self._cleanup_expired_otps()
            
            # Check for existing active OTP
            existing_otp = self._get_active_otp(email, purpose)
            if existing_otp:
                # Check if it's been less than 1 minute since last send (rate limiting)
                created_at = datetime.fromisoformat(existing_otp['created_at'])
                if datetime.utcnow() - created_at < timedelta(minutes=1):
                    return {
                        "success": False,
                        "message": "Please wait before requesting a new OTP",
                        "retry_after": 60 - int((datetime.utcnow() - created_at).total_seconds())
                    }
                
                # Deactivate existing OTP
                self._deactivate_otp(existing_otp['id'])
            
            # Generate new OTP
            otp_code = self.generate_otp()
            expires_at = datetime.utcnow() + timedelta(minutes=self.otp_expiry_minutes)
            
            # Store OTP in database
            otp_id = DatabaseManager.execute_query(
                """INSERT INTO email_otp_verification 
                   (email, otp_code, purpose, expires_at, user_data) 
                   VALUES (?, ?, ?, ?, ?)""",
                (email, otp_code, purpose, expires_at.isoformat(), 
                 json.dumps(user_data) if user_data else None),
                fetch_one=False,
                fetch_all=False
            )
            
            # Prepare email data
            email_data = {
                "otp_code": otp_code,
                "expires_in": self.otp_expiry_minutes,
                "name": user_data.get("name", "User") if user_data else "User",
                "company": user_data.get("company", "your company") if user_data else "your company"
            }
            
            # Send OTP via email
            email_result = await self.email_service.send_email(
                to_email=email,
                subject=f"Your ReferralInc Verification Code: {otp_code}",
                template=EmailTemplate.OTP_VERIFICATION,
                template_data=email_data
            )
            
            if email_result["success"]:
                return {
                    "success": True,
                    "message": "Verification code sent to your email",
                    "expires_in": self.otp_expiry_minutes * 60  # seconds
                }
            else:
                # If email fails, remove the OTP from database
                self._deactivate_otp(otp_id)
                return {
                    "success": False,
                    "message": "Failed to send verification email. Please try again."
                }
                
        except Exception as e:
            return {
                "success": False,
                "message": f"Failed to send OTP: {str(e)}"
            }
    
    async def verify_otp(self, email: str, otp_code: str, purpose: str = "registration") -> Dict[str, Any]:
        """Verify OTP code and return user data if valid"""
        try:
            # Get OTP record
            otp_record = DatabaseManager.execute_query(
                """SELECT * FROM email_otp_verification 
                   WHERE email = ? AND purpose = ? AND is_used = FALSE 
                   ORDER BY created_at DESC LIMIT 1""",
                (email, purpose),
                fetch_one=True
            )
            
            if not otp_record:
                return {
                    "success": False,
                    "message": "No verification code found. Please request a new one."
                }
            
            # Check if OTP is expired
            expires_at = datetime.fromisoformat(otp_record['expires_at'])
            if datetime.utcnow() > expires_at:
                # Mark as used to prevent further attempts
                self._mark_otp_used(otp_record['id'])
                return {
                    "success": False,
                    "message": "Verification code has expired. Please request a new one."
                }
            
            # Check max attempts
            if otp_record['attempts'] >= self.max_attempts:
                self._mark_otp_used(otp_record['id'])
                return {
                    "success": False,
                    "message": "Too many failed attempts. Please request a new verification code."
                }
            
            # Verify OTP code
            if otp_record['otp_code'] != otp_code:
                # Increment attempts
                DatabaseManager.execute_query(
                    "UPDATE email_otp_verification SET attempts = attempts + 1 WHERE id = ?",
                    (otp_record['id'],)
                )
                
                remaining_attempts = self.max_attempts - (otp_record['attempts'] + 1)
                if remaining_attempts <= 0:
                    self._mark_otp_used(otp_record['id'])
                    return {
                        "success": False,
                        "message": "Too many failed attempts. Please request a new verification code."
                    }
                
                return {
                    "success": False,
                    "message": f"Invalid verification code. {remaining_attempts} attempts remaining."
                }
            
            # OTP is valid - mark as used
            self._mark_otp_used(otp_record['id'])
            
            # Return user data if available
            user_data = None
            if otp_record['user_data']:
                user_data = json.loads(otp_record['user_data'])
            
            return {
                "success": True,
                "message": "Email verified successfully",
                "user_data": user_data
            }
            
        except Exception as e:
            return {
                "success": False,
                "message": f"Verification failed: {str(e)}"
            }
    
    def _get_active_otp(self, email: str, purpose: str) -> Optional[Dict[str, Any]]:
        """Get active OTP for email and purpose"""
        return DatabaseManager.execute_query(
            """SELECT * FROM email_otp_verification 
               WHERE email = ? AND purpose = ? AND is_used = FALSE 
               AND expires_at > ? 
               ORDER BY created_at DESC LIMIT 1""",
            (email, purpose, datetime.utcnow().isoformat()),
            fetch_one=True
        )
    
    def _deactivate_otp(self, otp_id: int):
        """Mark OTP as used"""
        DatabaseManager.execute_query(
            "UPDATE email_otp_verification SET is_used = TRUE WHERE id = ?",
            (otp_id,)
        )
    
    def _mark_otp_used(self, otp_id: int):
        """Mark OTP as used"""
        DatabaseManager.execute_query(
            "UPDATE email_otp_verification SET is_used = TRUE, updated_at = CURRENT_TIMESTAMP WHERE id = ?",
            (otp_id,)
        )
    
    async def _cleanup_expired_otps(self):
        """Remove expired OTP records"""
        try:
            DatabaseManager.execute_query(
                "DELETE FROM email_otp_verification WHERE expires_at < ?",
                (datetime.utcnow().isoformat(),)
            )
        except Exception as e:
            # Log error but don't fail the main operation
            print(f"Error cleaning up expired OTPs: {e}")
    
    async def cleanup_old_otps(self, days: int = 7):
        """Clean up old OTP records (for maintenance)"""
        try:
            cutoff_date = datetime.utcnow() - timedelta(days=days)
            DatabaseManager.execute_query(
                "DELETE FROM email_otp_verification WHERE created_at < ?",
                (cutoff_date.isoformat(),)
            )
        except Exception as e:
            print(f"Error cleaning up old OTPs: {e}")

# Global OTP service instance
otp_service = OTPService() 