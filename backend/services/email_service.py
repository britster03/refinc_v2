import os
import logging
import asyncio
from typing import Dict, Any, List, Optional, Union
from datetime import datetime
from enum import Enum
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import json

# Load environment variables from .env file
try:
    from dotenv import load_dotenv
    load_dotenv()
except ImportError:
    print("python-dotenv not installed. Environment variables from .env file won't be loaded.")

# Third-party imports (install with: pip install sendgrid boto3 resend)
try:
    import sendgrid
    from sendgrid.helpers.mail import Mail, Email, To, Content
    SENDGRID_AVAILABLE = True
except ImportError:
    SENDGRID_AVAILABLE = False
    sendgrid = None

try:
    import boto3
    from botocore.exceptions import ClientError
    AWS_SES_AVAILABLE = True
except ImportError:
    AWS_SES_AVAILABLE = False
    boto3 = None

try:
    import resend
    RESEND_AVAILABLE = True
except ImportError:
    RESEND_AVAILABLE = False
    resend = None

logger = logging.getLogger(__name__)

class EmailProvider(str, Enum):
    SENDGRID = "sendgrid"
    AWS_SES = "aws_ses"
    RESEND = "resend"
    SMTP = "smtp"

class EmailTemplate(str, Enum):
    WELCOME = "welcome"
    WELCOME_CANDIDATE = "welcome_candidate"
    WELCOME_EMPLOYEE = "welcome_employee"
    BETA_APPROVAL = "beta_approval"
    REFERRAL_RECEIVED = "referral_received"
    REFERRAL_ACCEPTED = "referral_accepted"
    REFERRAL_REJECTED = "referral_rejected"
    WEEKLY_DIGEST = "weekly_digest"
    MARKETING = "marketing"
    PASSWORD_RESET = "password_reset"
    VERIFICATION = "verification"
    OTP_VERIFICATION = "otp_verification"

class EmailService:
    """Production-ready email service with multiple provider support"""
    
    def __init__(self):
        self.providers = self._initialize_providers()
        self.primary_provider = self._get_primary_provider()
        
        # Email templates cache
        self.templates_cache = {}
        
    def _initialize_providers(self) -> Dict[EmailProvider, bool]:
        """Initialize available email providers"""
        providers = {}
        
        # SendGrid
        if SENDGRID_AVAILABLE and os.getenv("SENDGRID_API_KEY"):
            providers[EmailProvider.SENDGRID] = True
            self.sendgrid_client = sendgrid.SendGridAPIClient(api_key=os.getenv("SENDGRID_API_KEY"))
        else:
            providers[EmailProvider.SENDGRID] = False
            
        # AWS SES
        if AWS_SES_AVAILABLE and (os.getenv("AWS_ACCESS_KEY_ID") or os.getenv("AWS_PROFILE")):
            providers[EmailProvider.AWS_SES] = True
            self.ses_client = boto3.client(
                'ses',
                region_name=os.getenv("AWS_REGION", "us-east-1"),
                aws_access_key_id=os.getenv("AWS_ACCESS_KEY_ID"),
                aws_secret_access_key=os.getenv("AWS_SECRET_ACCESS_KEY")
            )
        else:
            providers[EmailProvider.AWS_SES] = False
            
        # Resend
        if RESEND_AVAILABLE and os.getenv("RESEND_API_KEY"):
            providers[EmailProvider.RESEND] = True
            resend.api_key = os.getenv("RESEND_API_KEY")
        else:
            providers[EmailProvider.RESEND] = False
            
        # SMTP fallback
        if os.getenv("SMTP_HOST"):
            providers[EmailProvider.SMTP] = True
        else:
            providers[EmailProvider.SMTP] = False
            
        return providers
    
    def _get_primary_provider(self) -> EmailProvider:
        """Get the primary email provider based on availability and preference"""
        preference_order = [
            EmailProvider.RESEND,    # Modern, developer-friendly
            EmailProvider.SENDGRID,  # Reliable, enterprise-grade
            EmailProvider.AWS_SES,   # AWS ecosystem
            EmailProvider.SMTP,      # Universal fallback
        ]
        
        for provider in preference_order:
            if self.providers.get(provider, False):
                logger.info(f"Using {provider.value} as primary email provider")
                return provider
                
        logger.warning("No email providers available")
        return EmailProvider.SMTP
    
    async def send_email(
        self,
        to_email: str,
        subject: str,
        template: EmailTemplate,
        template_data: Dict[str, Any] = None,
        html_content: str = None,
        text_content: str = None,
        from_email: str = None,
        from_name: str = None,
        reply_to: str = None,
        attachments: List[Dict[str, Any]] = None,
        priority: str = "normal",
        tracking: bool = True
    ) -> Dict[str, Any]:
        """
        Send email with comprehensive error handling and fallback
        
        Returns:
            Dict with success status, message_id, provider used, etc.
        """
        
        result = {
            "success": False,
            "message_id": None,
            "provider": None,
            "error": None,
            "sent_at": datetime.utcnow().isoformat()
        }
        
        try:
            # Validate inputs
            if not to_email or not subject:
                raise ValueError("to_email and subject are required")
                
            # Get email content
            if html_content is None or text_content is None:
                content = await self._get_template_content(template, template_data or {})
                html_content = html_content or content["html"]
                text_content = text_content or content["text"]
            
            # Set defaults
            from_email = from_email or os.getenv("DEFAULT_FROM_EMAIL", "noreply@referralinc.com")
            from_name = from_name or os.getenv("DEFAULT_FROM_NAME", "ReferralInc")
            
            # Try primary provider first, then fallbacks
            providers_to_try = [self.primary_provider] + [
                p for p in EmailProvider if p != self.primary_provider and self.providers.get(p, False)
            ]
            
            for provider in providers_to_try:
                try:
                    if provider == EmailProvider.SENDGRID:
                        result = await self._send_via_sendgrid(
                            to_email, subject, html_content, text_content, 
                            from_email, from_name, reply_to, attachments
                        )
                    elif provider == EmailProvider.AWS_SES:
                        result = await self._send_via_ses(
                            to_email, subject, html_content, text_content,
                            from_email, from_name, reply_to
                        )
                    elif provider == EmailProvider.RESEND:
                        result = await self._send_via_resend(
                            to_email, subject, html_content, text_content,
                            from_email, from_name, reply_to, attachments
                        )
                    elif provider == EmailProvider.SMTP:
                        result = await self._send_via_smtp(
                            to_email, subject, html_content, text_content,
                            from_email, from_name
                        )
                    
                    if result["success"]:
                        result["provider"] = provider.value
                        logger.info(f"Email sent successfully via {provider.value} to {to_email}")
                        break
                        
                except Exception as e:
                    logger.warning(f"Failed to send via {provider.value}: {str(e)}")
                    continue
            
            # Log email for compliance/debugging
            await self._log_email(to_email, subject, template, result)
            
            return result
            
        except Exception as e:
            logger.error(f"Email service error: {str(e)}")
            result["error"] = str(e)
            result["sent_at"] = datetime.utcnow().isoformat()
            return result
    
    async def _send_via_sendgrid(
        self, to_email: str, subject: str, html_content: str, text_content: str,
        from_email: str, from_name: str, reply_to: str = None, attachments: List = None
    ) -> Dict[str, Any]:
        """Send email via SendGrid"""
        
        message = Mail(
            from_email=Email(from_email, from_name),
            to_emails=To(to_email),
            subject=subject,
            html_content=Content("text/html", html_content),
            plain_text_content=Content("text/plain", text_content)
        )
        
        if reply_to:
            message.reply_to = Email(reply_to)
            
        # Add tracking
        message.tracking_settings = {
            "click_tracking": {"enable": True},
            "open_tracking": {"enable": True},
            "subscription_tracking": {"enable": False}
        }
        
        response = self.sendgrid_client.send(message)
        
        return {
            "success": response.status_code in [200, 201, 202],
            "message_id": response.headers.get("X-Message-Id"),
            "status_code": response.status_code,
            "sent_at": datetime.utcnow().isoformat()
        }
    
    async def _send_via_ses(
        self, to_email: str, subject: str, html_content: str, text_content: str,
        from_email: str, from_name: str, reply_to: str = None
    ) -> Dict[str, Any]:
        """Send email via AWS SES"""
        
        response = self.ses_client.send_email(
            Source=f"{from_name} <{from_email}>",
            Destination={"ToAddresses": [to_email]},
            Message={
                "Subject": {"Data": subject, "Charset": "UTF-8"},
                "Body": {
                    "Html": {"Data": html_content, "Charset": "UTF-8"},
                    "Text": {"Data": text_content, "Charset": "UTF-8"}
                }
            },
            ReplyToAddresses=[reply_to] if reply_to else []
        )
        
        return {
            "success": True,
            "message_id": response["MessageId"],
            "sent_at": datetime.utcnow().isoformat()
        }
    
    async def _send_via_resend(
        self, to_email: str, subject: str, html_content: str, text_content: str,
        from_email: str, from_name: str, reply_to: str = None, attachments: List = None
    ) -> Dict[str, Any]:
        """Send email via Resend"""
        
        email_data = {
            "from": f"{from_name} <{from_email}>",
            "to": [to_email],
            "subject": subject,
            "html": html_content,
            "text": text_content
        }
        
        if reply_to:
            email_data["reply_to"] = reply_to
            
        if attachments:
            email_data["attachments"] = attachments
        
        response = resend.Emails.send(email_data)
        
        return {
            "success": True,
            "message_id": response.get("id"),
            "sent_at": datetime.utcnow().isoformat()
        }
    
    async def _send_via_smtp(
        self, to_email: str, subject: str, html_content: str, text_content: str,
        from_email: str, from_name: str
    ) -> Dict[str, Any]:
        """Send email via SMTP as fallback"""
        
        msg = MIMEMultipart("alternative")
        msg["Subject"] = subject
        msg["From"] = f"{from_name} <{from_email}>"
        msg["To"] = to_email
        
        text_part = MIMEText(text_content, "plain")
        html_part = MIMEText(html_content, "html")
        
        msg.attach(text_part)
        msg.attach(html_part)
        
        with smtplib.SMTP(os.getenv("SMTP_HOST"), int(os.getenv("SMTP_PORT", 587))) as server:
            if os.getenv("SMTP_USE_TLS", "true").lower() == "true":
                server.starttls()
            # Support both SMTP_USERNAME and SMTP_USER for flexibility
            smtp_username = os.getenv("SMTP_USERNAME") or os.getenv("SMTP_USER")
            if smtp_username:
                server.login(smtp_username, os.getenv("SMTP_PASSWORD"))
            server.send_message(msg)
        
        return {
            "success": True,
            "message_id": f"smtp-{datetime.utcnow().timestamp()}",
            "sent_at": datetime.utcnow().isoformat()
        }
    
    async def _get_template_content(self, template: EmailTemplate, data: Dict[str, Any]) -> Dict[str, str]:
        """Get email template content with data substitution"""
        
        # Cache templates for performance
        if template not in self.templates_cache:
            self.templates_cache[template] = self._load_template(template)
        
        template_content = self.templates_cache[template]
        
        # Simple template substitution (in production, use Jinja2 or similar)
        html_content = template_content["html"]
        text_content = template_content["text"]
        
        for key, value in data.items():
            placeholder = f"{{{key}}}"
            html_content = html_content.replace(placeholder, str(value))
            text_content = text_content.replace(placeholder, str(value))
        
        return {
            "html": html_content,
            "text": text_content
        }
    
    def _load_template(self, template: EmailTemplate) -> Dict[str, str]:
        """Load email template from file or return default"""
        
        # In production, load from files or database
        templates = {
            EmailTemplate.WELCOME_CANDIDATE: {
                "html": """
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #f9fafb; border-radius: 12px; overflow: hidden;">
                    <div style="background: linear-gradient(135deg, #06b6d4 0%, #0891b2 100%); color: white; padding: 40px; text-align: center;">
                        <h1 style="margin: 0; font-size: 32px; font-weight: bold;">🎉 Welcome to ReferralInc!</h1>
                        <p style="margin: 15px 0 0 0; opacity: 0.9; font-size: 18px;">Your journey to career success starts here</p>
                    </div>
                    <div style="padding: 40px;">
                        <div style="text-align: center; margin-bottom: 30px;">
                            <h2 style="color: #111827; margin: 0 0 15px 0;">Hello {name},</h2>
                            <p style="color: #374151; margin: 0; font-size: 16px; line-height: 1.5;">
                                Welcome to the <strong>ReferralInc Beta</strong>! You're among the first to experience the future of professional referrals.
                            </p>
                        </div>
                        
                        <div style="background: white; border-radius: 12px; padding: 30px; margin: 30px 0; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
                            <h3 style="color: #059669; margin: 0 0 20px 0; font-size: 20px;">🚀 What's Waiting for You:</h3>
                            <ul style="color: #374151; padding-left: 20px; line-height: 1.8;">
                                <li><strong>Smart Matching:</strong> AI-powered employee recommendations based on your profile</li>
                                <li><strong>Direct Connections:</strong> Chat directly with employees at your dream companies</li>
                                <li><strong>Premium Conversations:</strong> Book 1-on-1 sessions with industry experts</li>
                                <li><strong>Resume Analysis:</strong> Get AI-powered feedback to improve your applications</li>
                                <li><strong>Real-time Notifications:</strong> Never miss an opportunity or message</li>
                            </ul>
                        </div>
                        
                        <div style="background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%); border-left: 4px solid #f59e0b; border-radius: 8px; padding: 20px; margin: 30px 0;">
                            <h4 style="color: #92400e; margin: 0 0 10px 0; font-size: 16px;">🎯 Your Beta Access Status:</h4>
                            <p style="color: #92400e; margin: 0; font-size: 14px;">
                                You're currently in our <strong>priority queue</strong>! We'll notify you as soon as your full access is approved. 
                                In the meantime, complete your profile to fast-track your approval.
                            </p>
                        </div>
                        
                        <div style="text-align: center; margin: 30px 0;">
                            <a href="{dashboard_url}" style="background: linear-gradient(135deg, #06b6d4 0%, #0891b2 100%); color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: bold; font-size: 16px;">Complete Your Profile</a>
                        </div>
                        
                        <div style="border-top: 1px solid #e5e7eb; padding-top: 20px; margin-top: 30px;">
                            <p style="color: #6b7280; font-size: 14px; margin: 0; text-align: center;">
                                Questions? Reply to this email or reach out to our team at support@referralinc.com
                            </p>
                        </div>
                    </div>
                    <div style="background: #1f2937; padding: 20px; text-align: center; color: white;">
                        <p style="margin: 0; font-size: 12px; opacity: 0.8;">© 2024 ReferralInc. All rights reserved.</p>
                    </div>
                </div>
                """,
                "text": """
                🎉 Welcome to ReferralInc!
                
                Hello {name},
                
                Welcome to the ReferralInc Beta! You're among the first to experience the future of professional referrals.
                
                🚀 What's Waiting for You:
                • Smart Matching: AI-powered employee recommendations based on your profile
                • Direct Connections: Chat directly with employees at your dream companies  
                • Premium Conversations: Book 1-on-1 sessions with industry experts
                • Resume Analysis: Get AI-powered feedback to improve your applications
                • Real-time Notifications: Never miss an opportunity or message
                
                🎯 Your Beta Access Status:
                You're currently in our priority queue! We'll notify you as soon as your full access is approved. 
                In the meantime, complete your profile to fast-track your approval.
                
                Complete your profile: {dashboard_url}
                
                Questions? Reply to this email or reach out to our team at support@referralinc.com
                
                © 2024 ReferralInc. All rights reserved.
                """
            },
            EmailTemplate.WELCOME_EMPLOYEE: {
                "html": """
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #f9fafb; border-radius: 12px; overflow: hidden;">
                    <div style="background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%); color: white; padding: 40px; text-align: center;">
                        <h1 style="margin: 0; font-size: 32px; font-weight: bold;">🎉 Welcome to ReferralInc!</h1>
                        <p style="margin: 15px 0 0 0; opacity: 0.9; font-size: 18px;">Help candidates achieve their dreams</p>
                    </div>
                    <div style="padding: 40px;">
                        <div style="text-align: center; margin-bottom: 30px;">
                            <h2 style="color: #111827; margin: 0 0 15px 0;">Hello {name},</h2>
                            <p style="color: #374151; margin: 0; font-size: 16px; line-height: 1.5;">
                                Thank you for joining <strong>ReferralInc Beta</strong> as a verified employee at <strong>{company}</strong>! 
                                You're now part of an exclusive network helping candidates land their dream jobs.
                            </p>
                        </div>
                        
                        <div style="background: white; border-radius: 12px; padding: 30px; margin: 30px 0; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
                            <h3 style="color: #7c3aed; margin: 0 0 20px 0; font-size: 20px;">🌟 Your Impact as an Employee:</h3>
                            <ul style="color: #374151; padding-left: 20px; line-height: 1.8;">
                                <li><strong>Make a Difference:</strong> Help talented candidates get noticed at your company</li>
                                <li><strong>Earn Recognition:</strong> Build your reputation as a helpful team member</li>
                                <li><strong>Premium Mentoring:</strong> Offer paid consultation sessions in your expertise area</li>
                                <li><strong>AI-Powered Matching:</strong> Get matched with candidates that fit your expertise</li>
                                <li><strong>Streamlined Process:</strong> Easy-to-use tools for reviewing and managing referrals</li>
                            </ul>
                        </div>
                        
                        <div style="background: linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%); border-left: 4px solid #10b981; border-radius: 8px; padding: 20px; margin: 30px 0;">
                            <h4 style="color: #065f46; margin: 0 0 10px 0; font-size: 16px;">✅ Your Account Status:</h4>
                            <p style="color: #065f46; margin: 0; font-size: 14px;">
                                Your company email has been <strong>verified</strong>! You now have full access to all ReferralInc features. 
                                Complete your profile to start receiving referral requests from qualified candidates.
                            </p>
                        </div>
                        
                        <div style="text-align: center; margin: 30px 0;">
                            <a href="{dashboard_url}" style="background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%); color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: bold; font-size: 16px;">Set Up Your Profile</a>
                        </div>
                        
                        <div style="background: #fef3c7; border-radius: 8px; padding: 16px; margin: 20px 0;">
                            <p style="margin: 0; color: #92400e; font-size: 14px;">
                                <strong>💡 Pro Tip:</strong> Complete your profile with skills, projects, and bio to attract the best referral requests!
                            </p>
                        </div>
                        
                        <div style="border-top: 1px solid #e5e7eb; padding-top: 20px; margin-top: 30px;">
                            <p style="color: #6b7280; font-size: 14px; margin: 0; text-align: center;">
                                Questions? Reply to this email or reach out to our team at support@referralinc.com
                            </p>
                        </div>
                    </div>
                    <div style="background: #1f2937; padding: 20px; text-align: center; color: white;">
                        <p style="margin: 0; font-size: 12px; opacity: 0.8;">© 2024 ReferralInc. All rights reserved.</p>
                    </div>
                </div>
                """,
                "text": """
                🎉 Welcome to ReferralInc!
                
                Hello {name},
                
                Thank you for joining ReferralInc Beta as a verified employee at {company}! 
                You're now part of an exclusive network helping candidates land their dream jobs.
                
                🌟 Your Impact as an Employee:
                • Make a Difference: Help talented candidates get noticed at your company
                • Earn Recognition: Build your reputation as a helpful team member
                • Premium Mentoring: Offer paid consultation sessions in your expertise area
                • AI-Powered Matching: Get matched with candidates that fit your expertise
                • Streamlined Process: Easy-to-use tools for reviewing and managing referrals
                
                ✅ Your Account Status:
                Your company email has been verified! You now have full access to all ReferralInc features. 
                Complete your profile to start receiving referral requests from qualified candidates.
                
                💡 Pro Tip: Complete your profile with skills, projects, and bio to attract the best referral requests!
                
                Set up your profile: {dashboard_url}
                
                Questions? Reply to this email or reach out to our team at support@referralinc.com
                
                © 2024 ReferralInc. All rights reserved.
                """
            },
            EmailTemplate.BETA_APPROVAL: {
                "html": """
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #f9fafb; border-radius: 12px; overflow: hidden;">
                    <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 40px; text-align: center;">
                        <h1 style="margin: 0; font-size: 32px; font-weight: bold;">🎊 Beta Access Approved!</h1>
                        <p style="margin: 15px 0 0 0; opacity: 0.9; font-size: 18px;">Your ReferralInc journey begins now</p>
                    </div>
                    <div style="padding: 40px;">
                        <div style="text-align: center; margin-bottom: 30px;">
                            <h2 style="color: #111827; margin: 0 0 15px 0;">Congratulations {name}!</h2>
                            <p style="color: #374151; margin: 0; font-size: 16px; line-height: 1.5;">
                                Your <strong>ReferralInc Beta access</strong> has been approved! You now have full access to all platform features.
                            </p>
                        </div>
                        
                        <div style="background: white; border-radius: 12px; padding: 30px; margin: 30px 0; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
                            <h3 style="color: #059669; margin: 0 0 20px 0; font-size: 20px;">🔓 Now Available to You:</h3>
                            <ul style="color: #374151; padding-left: 20px; line-height: 1.8;">
                                <li><strong>Unlimited Connections:</strong> Connect with employees at any company</li>
                                <li><strong>Premium Features:</strong> Access advanced AI matching and analytics</li>
                                <li><strong>Priority Support:</strong> Get help whenever you need it</li>
                                <li><strong>Exclusive Content:</strong> Beta-only resources and insights</li>
                                <li><strong>Early Feature Access:</strong> Try new features before anyone else</li>
                            </ul>
                        </div>
                        
                        <div style="text-align: center; margin: 30px 0;">
                            <a href="{dashboard_url}" style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: bold; font-size: 16px;">Start Exploring</a>
                        </div>
                        
                        <div style="background: linear-gradient(135deg, #ede9fe 0%, #ddd6fe 100%); border-left: 4px solid #8b5cf6; border-radius: 8px; padding: 20px; margin: 30px 0;">
                            <h4 style="color: #5b21b6; margin: 0 0 10px 0; font-size: 16px;">🚀 Getting Started:</h4>
                            <p style="color: #5b21b6; margin: 0; font-size: 14px;">
                                1. Complete your profile<br>
                                2. Browse employees or start connecting<br>
                                3. Join our beta community for tips and feedback
                            </p>
                        </div>
                        
                        <div style="border-top: 1px solid #e5e7eb; padding-top: 20px; margin-top: 30px;">
                            <p style="color: #6b7280; font-size: 14px; margin: 0; text-align: center;">
                                Thank you for being part of our beta community! Your feedback helps make ReferralInc better for everyone.
                            </p>
                        </div>
                    </div>
                    <div style="background: #1f2937; padding: 20px; text-align: center; color: white;">
                        <p style="margin: 0; font-size: 12px; opacity: 0.8;">© 2024 ReferralInc. All rights reserved.</p>
                    </div>
                </div>
                """,
                "text": """
                🎊 Beta Access Approved!
                
                Congratulations {name}!
                
                Your ReferralInc Beta access has been approved! You now have full access to all platform features.
                
                🔓 Now Available to You:
                • Unlimited Connections: Connect with employees at any company
                • Premium Features: Access advanced AI matching and analytics
                • Priority Support: Get help whenever you need it
                • Exclusive Content: Beta-only resources and insights
                • Early Feature Access: Try new features before anyone else
                
                🚀 Getting Started:
                1. Complete your profile
                2. Browse employees or start connecting
                3. Join our beta community for tips and feedback
                
                Start exploring: {dashboard_url}
                
                Thank you for being part of our beta community! Your feedback helps make ReferralInc better for everyone.
                
                © 2024 ReferralInc. All rights reserved.
                """
            },
            EmailTemplate.REFERRAL_RECEIVED: {
                "html": """
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <h2 style="color: #3b82f6;">New Referral Request</h2>
                    <p>You have received a new referral request from {candidate_name} for the position of {position} at {company}.</p>
                    <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
                        <h3>Details:</h3>
                        <p><strong>Position:</strong> {position}</p>
                        <p><strong>Company:</strong> {company}</p>
                        <p><strong>Candidate:</strong> {candidate_name}</p>
                    </div>
                    <a href="{action_url}" style="background: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">Review Request</a>
                </div>
                """,
                "text": """
                New Referral Request
                
                You have received a new referral request from {candidate_name} for the position of {position} at {company}.
                
                Details:
                Position: {position}
                Company: {company}
                Candidate: {candidate_name}
                
                Review at: {action_url}
                """
            },
            EmailTemplate.WEEKLY_DIGEST: {
                "html": """
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <h2 style="color: #3b82f6;">Your Weekly ReferralInc Summary</h2>
                    <p>Here's what happened in your account this week:</p>
                    <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
                        <h3>This Week's Activity</h3>
                        <p>📧 {new_referrals} new referral requests</p>
                        <p>✅ {accepted_referrals} referrals accepted</p>
                        <p>💬 {new_messages} new messages</p>
                    </div>
                    <a href="{dashboard_url}" style="background: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">View Dashboard</a>
                </div>
                """,
                "text": """
                Your Weekly ReferralInc Summary
                
                Here's what happened in your account this week:
                
                📧 {new_referrals} new referral requests
                ✅ {accepted_referrals} referrals accepted
                💬 {new_messages} new messages
                
                View dashboard: {dashboard_url}
                """
            },
            EmailTemplate.OTP_VERIFICATION: {
                "html": """
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #f9fafb; border-radius: 12px; overflow: hidden;">
                    <div style="background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%); color: white; padding: 30px; text-align: center;">
                        <h1 style="margin: 0; font-size: 28px; font-weight: bold;">Verify Your Email</h1>
                        <p style="margin: 10px 0 0 0; opacity: 0.9;">Complete your ReferralInc registration</p>
                    </div>
                    <div style="padding: 40px 30px;">
                        <div style="text-align: center; margin-bottom: 30px;">
                            <h2 style="color: #111827; margin: 0 0 15px 0;">Hello {name},</h2>
                            <p style="color: #6b7280; margin: 0; font-size: 16px;">Please use the verification code below to complete your employee registration:</p>
                        </div>
                        <div style="background: white; border: 2px dashed #e5e7eb; border-radius: 12px; padding: 30px; text-align: center; margin: 30px 0;">
                            <div style="font-size: 48px; font-weight: bold; color: #3b82f6; letter-spacing: 8px; font-family: 'Courier New', monospace;">{otp_code}</div>
                            <p style="color: #9ca3af; margin: 15px 0 0 0; font-size: 14px;">This code expires in {expires_in} minutes</p>
                        </div>
                        <div style="background: #fef3c7; border: 1px solid #f59e0b; border-radius: 8px; padding: 16px; margin: 20px 0;">
                            <p style="margin: 0; color: #92400e; font-size: 14px;">
                                <strong>Security Notice:</strong> This code is for {company} employee verification. Never share this code with anyone.
                            </p>
                        </div>
                        <div style="text-align: center; margin-top: 30px;">
                            <p style="color: #6b7280; font-size: 14px; margin: 0;">
                                If you didn't request this verification, please ignore this email.
                            </p>
                        </div>
                    </div>
                    <div style="background: #f3f4f6; padding: 20px; text-align: center; color: #6b7280; font-size: 12px;">
                        <p style="margin: 0;">© 2024 ReferralInc. All rights reserved.</p>
                    </div>
                </div>
                """,
                "text": """
                Verify Your Email - ReferralInc
                
                Hello {name},
                
                Please use the verification code below to complete your employee registration:
                
                Verification Code: {otp_code}
                
                This code expires in {expires_in} minutes.
                
                Security Notice: This code is for {company} employee verification. Never share this code with anyone.
                
                If you didn't request this verification, please ignore this email.
                
                © 2024 ReferralInc. All rights reserved.
                """
            }
        }
        
        return templates.get(template, {
            "html": "<p>{message}</p>",
            "text": "{message}"
        })
    
    async def _log_email(self, to_email: str, subject: str, template: EmailTemplate, result: Dict[str, Any]):
        """Log email for compliance and debugging"""
        
        log_data = {
            "to_email": to_email,
            "subject": subject,
            "template": template.value,
            "success": result["success"],
            "provider": result.get("provider"),
            "message_id": result.get("message_id"),
            "sent_at": result["sent_at"],
            "error": result.get("error")
        }
        
        # In production, save to database
        logger.info(f"Email log: {json.dumps(log_data)}")
    
    async def send_bulk_emails(
        self, 
        recipients: List[Dict[str, Any]], 
        template: EmailTemplate,
        common_data: Dict[str, Any] = None
    ) -> Dict[str, Any]:
        """Send bulk emails with rate limiting and batch processing"""
        
        results = {
            "total": len(recipients),
            "sent": 0,
            "failed": 0,
            "errors": []
        }
        
        # Process in batches to avoid rate limits
        batch_size = 10
        for i in range(0, len(recipients), batch_size):
            batch = recipients[i:i + batch_size]
            
            # Send batch concurrently
            tasks = []
            for recipient in batch:
                data = {**(common_data or {}), **recipient.get("data", {})}
                task = self.send_email(
                    to_email=recipient["email"],
                    subject=recipient.get("subject", ""),
                    template=template,
                    template_data=data
                )
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
                    results["errors"].append(result.get("error", "Unknown error"))
            
            # Rate limiting between batches
            await asyncio.sleep(1)
        
        return results

# Global email service instance
email_service = EmailService() 