from pydantic import BaseModel, EmailStr, validator, Field
from typing import Optional, List, Dict, Any
from datetime import datetime
from enum import Enum
from sqlalchemy import Column, Integer, String, DateTime, Boolean, Text, JSON, Float, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.ext.declarative import declarative_base

Base = declarative_base()

# Enums
class UserRole(str, Enum):
    CANDIDATE = "candidate"
    EMPLOYEE = "employee"
    ADMIN = "admin"

class ReferralStatus(str, Enum):
    PENDING = "pending"
    REVIEWING = "reviewing"
    INTERVIEW_SCHEDULED = "interview_scheduled"
    INTERVIEW_COMPLETED = "interview_completed"
    OFFER_EXTENDED = "offer_extended"
    HIRED = "hired"
    REJECTED = "rejected"

class ConversationStatus(str, Enum):
    REQUESTED = "requested"
    ACCEPTED = "accepted"
    SCHEDULED = "scheduled"
    COMPLETED = "completed"
    CANCELLED = "cancelled"

class PremiumConversationStatus(str, Enum):
    PENDING = "pending"
    ACCEPTED = "accepted"
    DECLINED = "declined"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    CANCELLED = "cancelled"

class PaymentStatus(str, Enum):
    PENDING = "pending"
    COMPLETED = "completed"
    FAILED = "failed"

class MessageType(str, Enum):
    TEXT = "text"
    FILE = "file"
    SYSTEM = "system"

class NotificationPriority(str, Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    URGENT = "urgent"

# Authentication Models
class UserRegister(BaseModel):
    email: EmailStr
    password: str
    name: str
    role: UserRole
    department: Optional[str] = None
    position: Optional[str] = None
    company: Optional[str] = None
    bio: Optional[str] = None
    skills: Optional[List[str]] = []
    experience_years: Optional[int] = None

    @validator('password')
    def validate_password(cls, v):
        if len(v) < 8:
            raise ValueError('Password must be at least 8 characters long')
        return v

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class OTPRequest(BaseModel):
    email: EmailStr
    purpose: str = "registration"
    user_data: Optional[Dict[str, Any]] = None

class OTPVerification(BaseModel):
    email: EmailStr
    otp_code: str
    purpose: str = "registration"

class OTPResponse(BaseModel):
    success: bool
    message: str
    expires_in: Optional[int] = None

class EmployeeRegistrationRequest(BaseModel):
    email: EmailStr
    password: str
    name: str
    company: str
    department: Optional[str] = None
    position: Optional[str] = None
    bio: Optional[str] = None
    skills: Optional[List[str]] = []
    experience_years: Optional[int] = None

    @validator('password')
    def validate_password(cls, v):
        if len(v) < 8:
            raise ValueError('Password must be at least 8 characters long')
        return v

    @validator('email')
    def validate_company_email(cls, v, values):
        # Basic company email validation - should have company domain
        email_domain = v.split('@')[1].lower()
        common_free_domains = [
            'gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com', 
            'aol.com', 'icloud.com', 'mail.com', 'protonmail.com'
        ]
        if email_domain in common_free_domains:
            raise ValueError('Please use your company email address, not a personal email')
        return v

class UserResponse(BaseModel):
    id: int
    email: str
    name: str
    role: UserRole
    avatar_url: Optional[str] = None
    department: Optional[str] = None
    position: Optional[str] = None
    company: Optional[str] = None
    bio: Optional[str] = None
    skills: Optional[List[str]] = []
    experience_years: Optional[int] = None
    is_verified: bool = False
    created_at: datetime
    updated_at: datetime

class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    expires_in: int
    user: UserResponse

class TokenRefresh(BaseModel):
    refresh_token: str

# User Profile Models
class UserUpdate(BaseModel):
    name: Optional[str] = None
    avatar_url: Optional[str] = None
    department: Optional[str] = None
    position: Optional[str] = None
    company: Optional[str] = None
    bio: Optional[str] = None
    skills: Optional[List[str]] = None
    experience_years: Optional[int] = None

class PasswordUpdate(BaseModel):
    current_password: str
    new_password: str

    @validator('new_password')
    def validate_new_password(cls, v):
        if len(v) < 8:
            raise ValueError('Password must be at least 8 characters long')
        return v

# Referral Models
class ReferralCreate(BaseModel):
    employee_id: int
    position: str
    department: Optional[str] = None
    company: str
    notes: Optional[str] = None
    resume_url: Optional[str] = None
    job_description: Optional[str] = None

class ReferralUpdate(BaseModel):
    status: Optional[ReferralStatus] = None
    notes: Optional[str] = None
    feedback_score: Optional[int] = None
    feedback_comments: Optional[List[str]] = None
    rejection_feedback: Optional[str] = None

class ReferralResponse(BaseModel):
    id: int
    candidate_id: int
    employee_id: int
    position: str
    department: Optional[str] = None
    company: str
    status: ReferralStatus
    notes: Optional[str] = None
    resume_url: Optional[str] = None
    job_description: Optional[str] = None
    ai_analysis_score: Optional[float] = None
    ai_analysis_summary: Optional[str] = None
    ai_analysis_details: Optional[Dict[str, Any]] = None
    feedback_score: Optional[int] = None
    feedback_comments: Optional[List[str]] = []
    rejection_feedback: Optional[str] = None
    rejection_feedback_analysis: Optional[Dict[str, Any]] = None
    created_at: datetime
    updated_at: datetime
    candidate: Optional[UserResponse] = None
    employee: Optional[UserResponse] = None

# Conversation Models
class ConversationCreate(BaseModel):
    employee_id: int
    scheduled_at: Optional[datetime] = None
    payment_amount: Optional[float] = None

class ConversationUpdate(BaseModel):
    status: Optional[ConversationStatus] = None
    scheduled_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None

class ConversationResponse(BaseModel):
    id: int
    candidate_id: int
    employee_id: int
    status: ConversationStatus
    scheduled_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    payment_amount: Optional[float] = None
    payment_status: Optional[PaymentStatus] = None
    payment_intent_id: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    candidate: Optional[UserResponse] = None
    employee: Optional[UserResponse] = None

# Message Models
class MessageCreate(BaseModel):
    conversation_id: int
    content: str
    attachments: Optional[List[str]] = []
    message_type: MessageType = MessageType.TEXT

class MessageResponse(BaseModel):
    id: int
    conversation_id: int
    sender_id: int
    content: str
    attachments: Optional[List[str]] = []
    message_type: MessageType
    created_at: datetime
    sender: Optional[UserResponse] = None

# Notification Models
class NotificationCreate(BaseModel):
    user_id: int
    type: str
    title: str
    message: str
    data: Optional[Dict[str, Any]] = {}
    priority: NotificationPriority = NotificationPriority.MEDIUM

class NotificationResponse(BaseModel):
    id: int
    user_id: int
    type: str
    title: str
    message: str
    data: Optional[Dict[str, Any]] = {}
    read: bool = False
    priority: NotificationPriority
    created_at: datetime

class NotificationUpdate(BaseModel):
    read: bool

# AI Analysis Models
class ResumeAnalysisRequest(BaseModel):
    resume_text: str
    job_description: Optional[str] = None
    analysis_type: Optional[str] = "comprehensive"  # comprehensive, skills_only, resume_only
    
class JobMatchRequest(BaseModel):
    resume_text: str
    job_description: str
    include_recommendations: Optional[bool] = True

class FeedbackAnalysisRequest(BaseModel):
    feedback_text: str

class SkillModel(BaseModel):
    name: str
    level: str
    years: float
    confidence: Optional[float] = None
    trending: Optional[bool] = None

class ExperienceModel(BaseModel):
    title: str
    company: str
    duration: str
    highlights: List[str]
    technologies: Optional[List[str]] = []
    impact: Optional[str] = None

class EducationModel(BaseModel):
    degree: str
    institution: str
    year: str
    gpa: Optional[str] = None
    relevant_courses: Optional[List[str]] = []

class ResumeAnalysisResponse(BaseModel):
    skills: List[SkillModel]
    experience: List[ExperienceModel]
    education: List[EducationModel]
    summary: str
    strengths: Optional[List[str]] = []
    improvement_areas: Optional[List[str]] = []
    career_level: Optional[str] = None
    salary_range: Optional[Dict[str, int]] = None
    market_demand: Optional[str] = None
    ai_confidence: Optional[float] = None

class SkillMatchModel(BaseModel):
    skill: str
    required: bool
    match: float
    importance: Optional[str] = None
    market_demand: Optional[str] = None

class JobMatchResponse(BaseModel):
    overall_score: int
    skill_matches: List[SkillMatchModel]
    missing_skills: List[str]
    strong_skills: List[str]
    improvement_suggestions: List[str]
    job_fit: str
    salary_alignment: Optional[Dict[str, Any]] = None
    culture_fit: Optional[float] = None
    interview_probability: Optional[int] = None
    hiring_probability: Optional[int] = None
    competition_level: Optional[str] = None
    market_insights: Optional[Dict[str, Any]] = None

class FeedbackAnalysisResponse(BaseModel):
    sentiment: str
    score: float
    confidence: Optional[float] = None
    key_points: List[str]
    themes: Optional[List[Dict[str, Any]]] = []
    emotional_tone: Optional[str] = None
    actionable_insights: Optional[List[str]] = []

# Analytics Models
class AnalyticsData(BaseModel):
    total_referrals: int
    successful_referrals: int
    pending_referrals: int
    success_rate: float
    average_response_time: Optional[float] = None
    top_skills: Optional[List[Dict[str, Any]]] = []
    monthly_trends: Optional[List[Dict[str, Any]]] = []

# Waitlist Models
class WaitlistCreate(BaseModel):
    email: EmailStr
    name: Optional[str] = None
    role: Optional[UserRole] = None
    company: Optional[str] = None

class WaitlistResponse(BaseModel):
    id: int
    email: str
    name: Optional[str] = None
    role: Optional[UserRole] = None
    company: Optional[str] = None
    position: int
    invited: bool = False
    created_at: datetime

# Search and Filter Models
class UserSearchFilter(BaseModel):
    role: Optional[UserRole] = None
    department: Optional[str] = None
    company: Optional[str] = None
    skills: Optional[List[str]] = []
    experience_min: Optional[int] = None
    experience_max: Optional[int] = None
    limit: int = 20
    offset: int = 0

class EmployeeSearchFilter(BaseModel):
    company: Optional[str] = None
    search: Optional[str] = None
    department: Optional[str] = None
    skills: Optional[str] = None  # Comma-separated skills
    sort_by: Optional[str] = "rating"  # rating, name, experience
    limit: int = 20
    offset: int = 0

class EmployeeSearchResponse(BaseModel):
    employees: List[UserResponse]
    total_count: int
    companies: List[str]
    departments: List[str]

# Detailed Employee Profile Models
class EmployeeProject(BaseModel):
    id: int
    name: str
    description: Optional[str] = None
    technologies: List[str] = []
    impact: Optional[str] = None
    start_date: Optional[str] = None
    end_date: Optional[str] = None
    is_current: bool = False
    url: Optional[str] = None

class EmployeeEducation(BaseModel):
    id: int
    degree: str
    institution: str
    field_of_study: Optional[str] = None
    graduation_year: Optional[int] = None
    gpa: Optional[float] = None
    description: Optional[str] = None

class EmployeeCertification(BaseModel):
    id: int
    name: str
    issuing_organization: str
    issue_date: Optional[str] = None
    expiration_date: Optional[str] = None
    credential_id: Optional[str] = None
    credential_url: Optional[str] = None

class EmployeeLanguage(BaseModel):
    language: str
    proficiency: str  # 'basic', 'conversational', 'professional', 'native'

class EmployeeAchievement(BaseModel):
    id: int
    title: str
    description: Optional[str] = None
    date_achieved: Optional[str] = None
    category: Optional[str] = None
    verification_url: Optional[str] = None

class EmployeeTestimonial(BaseModel):
    id: int
    author: str
    role: str
    content: str
    rating: int
    outcome: str  # 'hired', 'interview', 'pending'
    date: str
    avatar: str

class EmployeeProfileUpdate(BaseModel):
    # Basic profile updates
    bio: Optional[str] = None
    position: Optional[str] = None
    department: Optional[str] = None
    experience_years: Optional[int] = None
    skills: Optional[List[str]] = None
    avatar_url: Optional[str] = None
    company: Optional[str] = None
    location: Optional[str] = None
    
    # New profile data
    projects: Optional[List[dict]] = None
    education: Optional[List[dict]] = None
    certifications: Optional[List[dict]] = None
    languages: Optional[List[dict]] = None
    achievements: Optional[List[dict]] = None

class DetailedEmployeeProfile(BaseModel):
    # Basic info
    id: int
    name: str
    email: str
    role: str
    position: Optional[str] = None
    company: Optional[str] = None
    department: Optional[str] = None
    bio: Optional[str] = None
    skills: List[str] = []
    experience_years: Optional[int] = None
    avatar_url: Optional[str] = None
    
    # Performance metrics
    rating: float
    total_referrals: int
    successful_referrals: int
    success_rate: float
    avg_feedback_score: float
    
    # Activity data
    response_time: str
    last_active: str
    recent_activity_count: int
    
    # Status flags
    is_verified: bool
    is_premium_mentor: bool
    is_active: bool
    
    # Rich profile data
    projects: List[EmployeeProject] = []
    education: List[EmployeeEducation] = []
    certifications: List[EmployeeCertification] = []
    languages: List[EmployeeLanguage] = []
    achievements: List[EmployeeAchievement] = []
    testimonials: List[EmployeeTestimonial] = []
    
    # Metadata
    location: Optional[str] = None
    joined_date: str
    created_at: str
    updated_at: str

class ReferralSearchFilter(BaseModel):
    status: Optional[ReferralStatus] = None
    company: Optional[str] = None
    department: Optional[str] = None
    date_from: Optional[datetime] = None
    date_to: Optional[datetime] = None
    limit: int = 20
    offset: int = 0

# Payment Models
class PaymentCreate(BaseModel):
    conversation_id: int
    amount: float
    currency: str = "usd"

class PaymentResponse(BaseModel):
    payment_intent_id: str
    client_secret: str
    status: str
    amount: float

# File Upload Models
class FileUploadResponse(BaseModel):
    filename: str
    file_url: str
    file_size: int
    content_type: str

class DocumentProcessingResponse(BaseModel):
    success: bool
    extracted_text: str
    metadata: Dict[str, Any]
    processing_info: Dict[str, Any]
    error: Optional[str] = None

# Error Models
class ErrorResponse(BaseModel):
    error: str
    message: str
    details: Optional[Dict[str, Any]] = None

# Candidate Profile Models (similar to Employee models)
class CandidateProject(BaseModel):
    id: int
    name: str
    description: Optional[str] = None
    technologies: List[str] = []
    impact: Optional[str] = None
    start_date: Optional[str] = None
    end_date: Optional[str] = None
    is_current: bool = False
    url: Optional[str] = None

class CandidateEducation(BaseModel):
    id: int
    degree: str
    institution: str
    field_of_study: Optional[str] = None
    graduation_year: Optional[int] = None
    gpa: Optional[float] = None
    description: Optional[str] = None

class CandidateCertification(BaseModel):
    id: int
    name: str
    issuing_organization: str
    issue_date: Optional[str] = None
    expiration_date: Optional[str] = None
    credential_id: Optional[str] = None
    credential_url: Optional[str] = None

class CandidateLanguage(BaseModel):
    language: str
    proficiency: str  # 'basic', 'conversational', 'professional', 'native'

class CandidateAchievement(BaseModel):
    id: int
    title: str
    description: Optional[str] = None
    date_achieved: Optional[str] = None
    category: Optional[str] = None
    verification_url: Optional[str] = None

class CandidateProfileUpdate(BaseModel):
    # Basic profile updates
    bio: Optional[str] = None
    position: Optional[str] = None
    department: Optional[str] = None
    experience_years: Optional[int] = None
    skills: Optional[List[str]] = None
    avatar_url: Optional[str] = None
    company: Optional[str] = None
    location: Optional[str] = None
    
    # New profile data
    projects: Optional[List[dict]] = None
    education: Optional[List[dict]] = None
    certifications: Optional[List[dict]] = None
    languages: Optional[List[dict]] = None
    achievements: Optional[List[dict]] = None

class DetailedCandidateProfile(BaseModel):
    # Basic info
    id: int
    name: str
    email: str
    role: str
    position: Optional[str] = None
    company: Optional[str] = None
    department: Optional[str] = None
    bio: Optional[str] = None
    skills: List[str] = []
    experience_years: Optional[int] = None
    avatar_url: Optional[str] = None
    
    # Activity data
    last_active: str
    recent_activity_count: int
    is_logged_out: bool = False
    
    # Status flags
    is_verified: bool
    is_active: bool
    
    # Rich profile data
    projects: List[CandidateProject] = []
    education: List[CandidateEducation] = []
    certifications: List[CandidateCertification] = []
    languages: List[CandidateLanguage] = []
    achievements: List[CandidateAchievement] = []
    
    # Metadata
    location: Optional[str] = None
    joined_date: str
    created_at: str
    updated_at: str

class CandidateSearchFilter(BaseModel):
    search: Optional[str] = None
    department: Optional[str] = None
    skills: Optional[str] = None  # Comma-separated skills
    experience_min: Optional[int] = None
    experience_max: Optional[int] = None
    sort_by: Optional[str] = "name"  # name, experience
    limit: int = 20
    offset: int = 0

class CandidateSearchResponse(BaseModel):
    candidates: List[UserResponse]
    total_count: int
    departments: List[str]

# Success Models
class SuccessResponse(BaseModel):
    success: bool
    message: str
    data: Optional[Dict[str, Any]] = None

# Feedback Models
class FeedbackType(str, Enum):
    NO_RESPONSE = "no_response"
    NO_INTERVIEW = "no_interview" 
    REJECTED_AFTER_INTERVIEW = "rejected_after_interview"
    DECLINED_OFFER = "declined_offer"
    POSITION_FILLED = "position_filled"
    POOR_REFERRAL_QUALITY = "poor_referral_quality"
    OTHER = "other"

class FeedbackCreate(BaseModel):
    referral_id: int
    feedback_type: FeedbackType
    feedback_text: str
    rating_impact: Optional[int] = Field(None, ge=-2, le=0)  # Negative impact only
    metadata: Optional[Dict[str, Any]] = None

class FeedbackResponse(BaseModel):
    id: int
    referral_id: int
    candidate_id: int
    employee_id: int
    feedback_type: FeedbackType
    feedback_text: str
    rating_impact: int
    sentiment_score: Optional[float] = None
    sentiment_analysis: Optional[Dict[str, Any]] = None
    metadata: Optional[Dict[str, Any]] = None
    created_at: datetime
    updated_at: datetime
    referral: Optional[ReferralResponse] = None

class EmployeeRatingRecalculation(BaseModel):
    employee_id: int
    old_rating: float
    new_rating: float
    total_feedback_count: int
    positive_feedback_count: int
    negative_feedback_count: int
    fell_through_count: int

# Premium Conversations Models
class AvailabilitySlot(BaseModel):
    id: Optional[int] = None
    day_of_week: int  # 0 = Sunday, 1 = Monday, etc.
    start_time: str  # HH:MM format
    end_time: str    # HH:MM format
    timezone: str

class EmployeeSettings(BaseModel):
    is_available: bool = True
    hourly_rate: float
    expertise: List[str] = []
    bio: Optional[str] = None
    availability: List[AvailabilitySlot] = []
    auto_accept_requests: bool = False
    max_daily_sessions: int = 8
    response_time_hours: int = 24

class EmployeeSettingsUpdate(BaseModel):
    is_available: Optional[bool] = None
    hourly_rate: Optional[float] = None
    expertise: Optional[List[str]] = None
    bio: Optional[str] = None
    availability: Optional[List[AvailabilitySlot]] = None
    auto_accept_requests: Optional[bool] = None
    max_daily_sessions: Optional[int] = None
    response_time_hours: Optional[int] = None
    position: Optional[str] = None
    company: Optional[str] = None
    department: Optional[str] = None
    experience_years: Optional[int] = None

class PremiumEmployee(BaseModel):
    id: int
    name: str
    email: str
    position: str
    company: str
    department: str
    avatar_url: Optional[str] = None
    rating: float
    total_sessions: int
    response_time: str
    hourly_rate: float
    expertise: List[str] = []
    availability: List[AvailabilitySlot] = []
    is_available: bool = True
    bio: Optional[str] = None

class PremiumConversationCreate(BaseModel):
    employee_id: int
    scheduled_time: datetime
    duration_minutes: int
    topic: str
    candidate_message: Optional[str] = None
    coupon_code: Optional[str] = None

class PremiumConversationUpdate(BaseModel):
    status: Optional[PremiumConversationStatus] = None
    employee_response: Optional[str] = None
    scheduled_time: Optional[datetime] = None
    rating: Optional[int] = Field(None, ge=1, le=5)
    feedback: Optional[str] = None

class PremiumConversationResponse(BaseModel):
    id: int
    candidate_id: int
    employee_id: int
    status: PremiumConversationStatus
    scheduled_time: datetime
    duration_minutes: int
    hourly_rate: float
    total_amount: float
    topic: str
    candidate_message: Optional[str] = None
    employee_response: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    started_at: Optional[datetime] = None
    ended_at: Optional[datetime] = None
    payment_status: PaymentStatus
    payment_intent_id: Optional[str] = None
    rating: Optional[int] = None
    feedback: Optional[str] = None
    candidate: Optional[UserResponse] = None
    employee: Optional[PremiumEmployee] = None

class PremiumMessageCreate(BaseModel):
    content: str
    message_type: MessageType = MessageType.TEXT
    file_url: Optional[str] = None

class PremiumMessageResponse(BaseModel):
    id: int
    conversation_id: int
    sender_id: int
    sender_type: str  # 'candidate' or 'employee'
    content: str
    message_type: MessageType
    file_url: Optional[str] = None
    created_at: datetime
    read_at: Optional[datetime] = None

class ConversationFilters(BaseModel):
    status: Optional[str] = None
    date_from: Optional[datetime] = None
    date_to: Optional[datetime] = None
    employee_id: Optional[int] = None
    candidate_id: Optional[int] = None
    limit: int = 20
    offset: int = 0

class EmployeeAnalytics(BaseModel):
    total_earnings: float
    total_sessions: int
    average_rating: float
    pending_requests: int
    monthly_earnings: List[Dict[str, Any]] = []
    rating_distribution: Dict[str, int] = {}
    popular_topics: List[Dict[str, Any]] = []

class PaymentIntentCreate(BaseModel):
    amount: float
    currency: str = "usd"
    conversation_id: int
    payment_method_id: str
    coupon_code: Optional[str] = None

class PaymentIntentResponse(BaseModel):
    client_secret: str
    payment_intent_id: str

class PaymentConfirm(BaseModel):
    payment_intent_id: str

class RefundRequest(BaseModel):
    reason: Optional[str] = None

class RefundResponse(BaseModel):
    refund_id: str
    status: str

class CouponCode(BaseModel):
    code: str
    description: str
    discount_type: str  # 'percentage' or 'fixed'
    discount_value: float  # percentage (0-100) or fixed amount
    max_uses: Optional[int] = None
    used_count: int = 0
    expires_at: Optional[datetime] = None
    is_active: bool = True

class CouponValidation(BaseModel):
    code: str
    original_amount: float

class CouponValidationResponse(BaseModel):
    valid: bool
    discount_amount: float
    final_amount: float
    message: str

class WebSocketMessage(BaseModel):
    type: str  # 'message', 'status_change', 'typing', 'error'
    data: Dict[str, Any]

# Privacy and Consent Management Models
class UserConsent(Base):
    __tablename__ = "user_consents"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    consent_type = Column(String(50), nullable=False)  # 'data_contribution', 'market_analysis', 'resume_storage'
    granted = Column(Boolean, default=False)
    granted_at = Column(DateTime, nullable=True)
    revoked_at = Column(DateTime, nullable=True)
    ip_address = Column(String(45), nullable=True)
    user_agent = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationship
    user = relationship("User", back_populates="consents")

# Market Intelligence Models
class MarketIntelligenceCache(Base):
    __tablename__ = "market_intelligence_cache"
    
    id = Column(Integer, primary_key=True, index=True)
    cache_key = Column(String(255), unique=True, index=True)
    skills_hash = Column(String(64), index=True)
    data = Column(JSON)
    scraped_at = Column(DateTime, default=datetime.utcnow)
    expires_at = Column(DateTime)
    sources_used = Column(JSON)
    job_count = Column(Integer, default=0)
    salary_data_available = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)

class SkillDemandMetrics(Base):
    __tablename__ = "skill_demand_metrics"
    
    id = Column(Integer, primary_key=True, index=True)
    skill_name = Column(String(100), index=True)
    demand_level = Column(String(20))  # high, medium, low
    job_count = Column(Integer, default=0)
    average_salary = Column(Integer, nullable=True)
    salary_min = Column(Integer, nullable=True)
    salary_max = Column(Integer, nullable=True)
    growth_trend = Column(String(20))  # rising, stable, declining
    last_updated = Column(DateTime, default=datetime.utcnow)
    data_source = Column(String(50))
    confidence_score = Column(Float, default=0.0)

# Enhanced User Experience Models
class AnalysisSession(Base):
    __tablename__ = "analysis_sessions"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    session_token = Column(String(255), unique=True, index=True)
    resume_text = Column(Text)
    job_description = Column(Text, nullable=True)
    
    # Pre-analysis inputs
    roadmap_duration_weeks = Column(Integer, default=12)
    career_goals = Column(JSON)  # List of career goals
    learning_time_hours_per_week = Column(Integer, default=5)
    priority_areas = Column(JSON)  # List of focus areas
    
    # Analysis iterations
    current_iteration = Column(Integer, default=1)
    max_iterations = Column(Integer, default=4)  # Initial + 3 refinements
    
    # Session metadata
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    completed_at = Column(DateTime, nullable=True)
    
    # Relationships
    user = relationship("User", back_populates="analysis_sessions")
    iterations = relationship("AnalysisIteration", back_populates="session", cascade="all, delete-orphan")
    feedback_entries = relationship("AnalysisFeedback", back_populates="session", cascade="all, delete-orphan")

class AnalysisIteration(Base):
    __tablename__ = "analysis_iterations"
    
    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(Integer, ForeignKey("analysis_sessions.id"), nullable=False)
    iteration_number = Column(Integer, nullable=False)
    
    # Analysis results
    analysis_data = Column(JSON)
    confidence_score = Column(Float, default=0.0)
    processing_time = Column(Float, default=0.0)
    
    # Market intelligence data
    market_data = Column(JSON, nullable=True)
    salary_insights = Column(JSON, nullable=True)
    
    # Iteration-specific adjustments
    focus_adjustments = Column(JSON, nullable=True)  # Based on user feedback
    
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    session = relationship("AnalysisSession", back_populates="iterations")

class AnalysisFeedback(Base):
    __tablename__ = "analysis_feedback"
    
    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(Integer, ForeignKey("analysis_sessions.id"), nullable=False)
    iteration_id = Column(Integer, ForeignKey("analysis_iterations.id"), nullable=True)
    
    # Feedback details
    feedback_type = Column(String(50))  # 'dissatisfaction', 'refinement_request', 'positive'
    feedback_text = Column(Text)
    specific_areas = Column(JSON)  # Areas user wants to improve/change
    satisfaction_score = Column(Integer, nullable=True)  # 1-5 scale
    
    # Action taken
    action_taken = Column(String(100), nullable=True)
    reanalysis_requested = Column(Boolean, default=False)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    session = relationship("AnalysisSession", back_populates="feedback_entries")
    iteration = relationship("AnalysisIteration")

# Pydantic Models for API
class ConsentRequest(BaseModel):
    consent_type: str
    granted: bool
    
class ConsentResponse(BaseModel):
    id: int
    consent_type: str
    granted: bool
    granted_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True

class PreAnalysisInput(BaseModel):
    resume_text: str
    job_description: Optional[str] = None
    preferences: Dict[str, Any]

class AnalysisPreferences(BaseModel):
    roadmapDuration: int = 12
    careerGoals: str = ""
    targetRole: str = ""
    targetCompany: str = ""
    salaryExpectations: str = ""
    preferredIndustries: List[str] = []
    learningTimeCommitment: int = 5
    priorityAreas: List[str] = []

class AnalysisSessionRequest(BaseModel):
    resume_text: str
    job_description: Optional[str] = None
    pre_analysis_input: Optional[PreAnalysisInput] = None

class FeedbackRequest(BaseModel):
    feedback_type: str
    feedback_text: str
    specific_areas: List[str] = []
    satisfaction_score: Optional[int] = None
    reanalysis_requested: bool = False
    feedback_data: Optional[Dict[str, Any]] = None
    improvement_areas: Optional[List[str]] = []

class MarketIntelligenceRequest(BaseModel):
    skills: List[str]
    include_salary_data: bool = True
    include_trend_analysis: bool = True
    cache_duration_hours: int = 1  # Reduced to 1 hour for more frequent fresh data 

# Rejection Feedback Analysis Models
class RejectionFeedbackAnalysisRequest(BaseModel):
    feedback_text: str
    position: str
    company: str
    candidate_background: Optional[str] = None

class RejectionFeedbackAnalysisResponse(BaseModel):
    primary_reasons: List[str]
    sentiment: str
    tone: str
    constructiveness_score: float
    improvement_suggestions: List[str]
    potential_additional_reasons: List[str]
    follow_up_questions: List[str]
    overall_analysis: str
    candidate_action_items: List[str]

# Free Conversation Models
class FreeConversationStatus(str, Enum):
    ACTIVE = "active"
    COMPLETED = "completed"
    UPGRADE_REQUIRED = "upgrade_required"
    CANCELLED = "cancelled"

class FreeConversationCreate(BaseModel):
    referral_id: int

class FreeConversationResponse(BaseModel):
    id: int
    referral_id: int
    candidate_id: int
    employee_id: int
    status: FreeConversationStatus
    message_count: int
    max_messages: int
    candidate_message_count: int
    employee_message_count: int
    max_messages_per_user: int
    created_at: datetime
    updated_at: datetime
    completed_at: Optional[datetime] = None
    referral: Optional[ReferralResponse] = None
    candidate: Optional[UserResponse] = None
    employee: Optional[UserResponse] = None

class FreeConversationMessageCreate(BaseModel):
    content: str
    message_type: MessageType = MessageType.TEXT

class FreeConversationMessageResponse(BaseModel):
    id: int
    conversation_id: int
    sender_id: int
    sender_type: str
    content: str
    message_type: MessageType
    created_at: datetime 

# ================================
# COINS REWARD SYSTEM MODELS
# ================================

class CoinType(str, Enum):
    REFCOIN = "refcoin"  # RC - Primary currency
    PREMIUM_TOKEN = "premium_token"  # PT - Higher value currency

class TransactionType(str, Enum):
    EARNED = "earned"
    SPENT = "spent"
    PURCHASED = "purchased"
    GIFTED = "gifted"
    BONUS = "bonus"
    REFUND = "refund"

class TransactionStatus(str, Enum):
    PENDING = "pending"
    COMPLETED = "completed"
    FAILED = "failed"
    CANCELLED = "cancelled"

class AchievementType(str, Enum):
    PROFILE = "profile"
    REFERRAL = "referral"
    INTERVIEW = "interview"
    NETWORKING = "networking"
    LEARNING = "learning"
    MENTORSHIP = "mentorship"

class RewardCategory(str, Enum):
    PLATFORM_FEATURES = "platform_features"
    GIFT_CARDS = "gift_cards"
    COURSES = "courses"
    TOOLS = "tools"
    CAREER_DEVELOPMENT = "career_development"

# Database Models
class UserWallet(Base):
    __tablename__ = "user_wallets"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, unique=True)
    refcoin_balance = Column(Integer, default=0)  # RC balance in smallest unit
    premium_token_balance = Column(Integer, default=0)  # PT balance in smallest unit
    total_earned_refcoins = Column(Integer, default=0)
    total_spent_refcoins = Column(Integer, default=0)
    total_earned_premium_tokens = Column(Integer, default=0)
    total_spent_premium_tokens = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    user = relationship("User", back_populates="wallet")
    transactions = relationship("CoinTransaction", back_populates="wallet")

class CoinTransaction(Base):
    __tablename__ = "coin_transactions"
    
    id = Column(Integer, primary_key=True, index=True)
    wallet_id = Column(Integer, ForeignKey("user_wallets.id"), nullable=False)
    transaction_type = Column(String(20), nullable=False)  # TransactionType
    coin_type = Column(String(20), nullable=False)  # CoinType
    amount = Column(Integer, nullable=False)  # Amount in smallest unit
    balance_after = Column(Integer, nullable=False)
    status = Column(String(20), default="completed")  # TransactionStatus
    
    # Transaction details
    source = Column(String(100), nullable=False)  # What triggered this transaction
    source_id = Column(String(100), nullable=True)  # ID of the source (referral_id, achievement_id, etc.)
    description = Column(Text, nullable=True)
    transaction_metadata = Column(JSON, nullable=True)
    
    # Payment integration
    stripe_payment_intent_id = Column(String(255), nullable=True)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    wallet = relationship("UserWallet", back_populates="transactions")

class Achievement(Base):
    __tablename__ = "achievements"
    
    id = Column(Integer, primary_key=True, index=True)
    code = Column(String(50), unique=True, nullable=False)
    name = Column(String(100), nullable=False)
    description = Column(Text, nullable=False)
    achievement_type = Column(String(20), nullable=False)  # AchievementType
    icon = Column(String(100), nullable=True)
    reward_refcoins = Column(Integer, default=0)
    reward_premium_tokens = Column(Integer, default=0)
    
    # Requirements
    requirements = Column(JSON, nullable=False)  # Conditions to unlock
    is_repeatable = Column(Boolean, default=False)
    max_completions = Column(Integer, nullable=True)
    
    # Display
    rarity = Column(String(20), default="common")  # common, uncommon, rare, epic, legendary
    is_active = Column(Boolean, default=True)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    user_achievements = relationship("UserAchievement", back_populates="achievement")

class UserAchievement(Base):
    __tablename__ = "user_achievements"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    achievement_id = Column(Integer, ForeignKey("achievements.id"), nullable=False)
    
    # Progress tracking
    progress = Column(Integer, default=0)
    max_progress = Column(Integer, nullable=False)
    is_completed = Column(Boolean, default=False)
    completed_at = Column(DateTime, nullable=True)
    completion_count = Column(Integer, default=0)
    
    # Rewards
    coins_rewarded = Column(Integer, default=0)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    user = relationship("User")
    achievement = relationship("Achievement", back_populates="user_achievements")

class RewardItem(Base):
    __tablename__ = "reward_items"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    description = Column(Text, nullable=False)
    category = Column(String(30), nullable=False)  # RewardCategory
    
    # Pricing
    refcoin_cost = Column(Integer, nullable=True)
    premium_token_cost = Column(Integer, nullable=True)
    usd_value = Column(Float, nullable=True)
    
    # Availability
    is_available = Column(Boolean, default=True)
    stock_quantity = Column(Integer, nullable=True)  # None = unlimited
    purchase_limit_per_user = Column(Integer, nullable=True)
    
    # Third-party integration
    provider = Column(String(50), nullable=True)  # amazon, coursera, etc.
    provider_product_id = Column(String(100), nullable=True)
    fulfillment_method = Column(String(50), default="manual")  # manual, api, email
    
    # Display
    image_url = Column(String(255), nullable=True)
    featured = Column(Boolean, default=False)
    sort_order = Column(Integer, default=0)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    purchases = relationship("RewardPurchase", back_populates="reward_item")

class RewardPurchase(Base):
    __tablename__ = "reward_purchases"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    reward_item_id = Column(Integer, ForeignKey("reward_items.id"), nullable=False)
    transaction_id = Column(Integer, ForeignKey("coin_transactions.id"), nullable=True)
    
    # Purchase details
    refcoin_cost = Column(Integer, nullable=True)
    premium_token_cost = Column(Integer, nullable=True)
    status = Column(String(20), default="pending")  # pending, fulfilled, failed, cancelled
    
    # Fulfillment
    fulfillment_data = Column(JSON, nullable=True)  # Gift card codes, access details, etc.
    fulfilled_at = Column(DateTime, nullable=True)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    user = relationship("User")
    reward_item = relationship("RewardItem", back_populates="purchases")
    transaction = relationship("CoinTransaction")

class LeaderboardEntry(Base):
    __tablename__ = "leaderboard_entries"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    leaderboard_type = Column(String(50), nullable=False)  # weekly_earnings, monthly_success, etc.
    period = Column(String(20), nullable=False)  # 2024-W01, 2024-01, 2024, etc.
    
    # Metrics
    score = Column(Integer, default=0)
    rank = Column(Integer, nullable=True)
    leaderboard_metadata = Column(JSON, nullable=True)  # Additional data like achievements, etc.
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    user = relationship("User")

class CoinPack(Base):
    __tablename__ = "coin_packs"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    description = Column(Text, nullable=True)
    
    # Pricing and rewards
    usd_price = Column(Float, nullable=False)
    refcoins_amount = Column(Integer, nullable=False)
    bonus_refcoins = Column(Integer, default=0)
    premium_tokens_amount = Column(Integer, default=0)
    
    # Stripe integration
    stripe_price_id = Column(String(100), nullable=True)
    
    # Display
    is_featured = Column(Boolean, default=False)
    is_active = Column(Boolean, default=True)
    sort_order = Column(Integer, default=0)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

# Pydantic Models for API
class WalletResponse(BaseModel):
    refcoin_balance: int
    premium_token_balance: int
    total_earned_refcoins: int
    total_spent_refcoins: int
    total_earned_premium_tokens: int
    total_spent_premium_tokens: int
    refcoin_usd_value: float
    premium_token_usd_value: float

class CoinTransactionCreate(BaseModel):
    transaction_type: TransactionType
    coin_type: CoinType
    amount: int
    source: str
    source_id: Optional[str] = None
    description: Optional[str] = None
    transaction_metadata: Optional[Dict[str, Any]] = None

class CoinTransactionResponse(BaseModel):
    id: int
    transaction_type: TransactionType
    coin_type: CoinType
    amount: int
    balance_after: int
    status: TransactionStatus
    source: str
    description: Optional[str] = None
    created_at: datetime

class AchievementResponse(BaseModel):
    id: int
    code: str
    name: str
    description: str
    achievement_type: AchievementType
    icon: Optional[str] = None
    reward_refcoins: int
    reward_premium_tokens: int
    rarity: str
    is_completed: bool = False
    progress: int = 0
    max_progress: int = 1
    completed_at: Optional[datetime] = None

class UserAchievementProgress(BaseModel):
    achievement_id: int
    progress: int
    max_progress: int
    is_completed: bool

class RewardItemResponse(BaseModel):
    id: int
    name: str
    description: str
    category: RewardCategory
    refcoin_cost: Optional[int] = None
    premium_token_cost: Optional[int] = None
    usd_value: Optional[float] = None
    is_available: bool
    stock_quantity: Optional[int] = None
    image_url: Optional[str] = None
    featured: bool

class RewardPurchaseCreate(BaseModel):
    reward_item_id: int

class RewardPurchaseResponse(BaseModel):
    id: int
    reward_item: RewardItemResponse
    refcoin_cost: Optional[int] = None
    premium_token_cost: Optional[int] = None
    status: str
    fulfillment_data: Optional[Dict[str, Any]] = None
    created_at: datetime

class LeaderboardEntryResponse(BaseModel):
    user: UserResponse
    rank: int
    score: int
    leaderboard_metadata: Optional[Dict[str, Any]] = None

class CoinPackResponse(BaseModel):
    id: int
    name: str
    description: Optional[str] = None
    usd_price: float
    refcoins_amount: int
    bonus_refcoins: int
    premium_tokens_amount: int
    is_featured: bool

class CoinPackPurchaseCreate(BaseModel):
    coin_pack_id: int
    payment_method_id: str

class EarningOpportunity(BaseModel):
    source: str
    description: str
    potential_refcoins: int
    potential_premium_tokens: int
    action_url: Optional[str] = None
    is_available: bool

class CoinsAnalytics(BaseModel):
    total_users_with_coins: int
    total_refcoins_in_circulation: int
    total_premium_tokens_in_circulation: int
    top_earning_sources: List[Dict[str, Any]]
    redemption_trends: List[Dict[str, Any]]
    achievement_completion_rates: List[Dict[str, Any]]

# Job Application Models
class JobApplicationStatus(str, Enum):
    NOT_APPLIED = "not_applied"
    APPLIED = "applied"
    PENDING = "pending"
    INTERVIEW = "interview"
    REJECTED = "rejected"
    HIRED = "hired"

class JobApplicationSource(str, Enum):
    AI_RECOMMENDATION = "ai_recommendation"
    MANUAL_ENTRY = "manual_entry"
    REFERRAL_OPPORTUNITY = "referral_opportunity"

class JobApplication(Base):
    __tablename__ = "job_applications"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    
    # Job details
    company = Column(String(255), nullable=False)
    position = Column(String(255), nullable=False)
    department = Column(String(255), nullable=True)
    location = Column(String(255), nullable=True)
    salary_range = Column(String(100), nullable=True)
    job_url = Column(Text, nullable=True)
    job_description = Column(Text, nullable=True)
    
    # Application tracking
    status = Column(String(20), nullable=False, default=JobApplicationStatus.NOT_APPLIED.value)
    applied_date = Column(DateTime, nullable=True)
    last_status_update = Column(DateTime, default=datetime.utcnow)
    
    # AI integration
    ai_match_score = Column(Float, nullable=True)  # Match score from AI analysis
    ai_analysis_data = Column(JSON, nullable=True)  # Detailed AI analysis
    source = Column(String(30), nullable=False, default=JobApplicationSource.MANUAL_ENTRY.value)
    analysis_session_id = Column(Integer, ForeignKey("analysis_sessions.id"), nullable=True)
    
    # Notes and tracking
    notes = Column(Text, nullable=True)
    interview_date = Column(DateTime, nullable=True)
    offer_date = Column(DateTime, nullable=True)
    rejection_date = Column(DateTime, nullable=True)
    rejection_reason = Column(Text, nullable=True)
    
    # Referral integration
    referral_id = Column(Integer, ForeignKey("referrals.id"), nullable=True)
    referral_employee_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    referral_status = Column(String(30), nullable=True)  # requested, pending, accepted, declined
    
    # Timeline tracking
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    user = relationship("User", foreign_keys=[user_id])
    referral = relationship("Referral", back_populates="job_applications")
    referral_employee = relationship("User", foreign_keys=[referral_employee_id])
    analysis_session = relationship("AnalysisSession")
    status_history = relationship("JobApplicationStatusHistory", back_populates="job_application")

class JobApplicationStatusHistory(Base):
    __tablename__ = "job_application_status_history"
    
    id = Column(Integer, primary_key=True, index=True)
    job_application_id = Column(Integer, ForeignKey("job_applications.id"), nullable=False)
    
    old_status = Column(String(20), nullable=True)
    new_status = Column(String(20), nullable=False)
    changed_at = Column(DateTime, default=datetime.utcnow)
    notes = Column(Text, nullable=True)
    
    # Relationships
    job_application = relationship("JobApplication", back_populates="status_history")

class JobApplicationCreate(BaseModel):
    company: str
    position: str
    department: Optional[str] = None
    location: Optional[str] = None
    salary_range: Optional[str] = None
    job_url: Optional[str] = None
    job_description: Optional[str] = None
    notes: Optional[str] = None
    ai_match_score: Optional[float] = None
    ai_analysis_data: Optional[Dict[str, Any]] = None
    source: JobApplicationSource = JobApplicationSource.MANUAL_ENTRY
    analysis_session_id: Optional[int] = None

class JobApplicationUpdate(BaseModel):
    company: Optional[str] = None
    position: Optional[str] = None
    department: Optional[str] = None
    location: Optional[str] = None
    salary_range: Optional[str] = None
    job_url: Optional[str] = None
    job_description: Optional[str] = None
    status: Optional[JobApplicationStatus] = None
    notes: Optional[str] = None
    interview_date: Optional[datetime] = None
    offer_date: Optional[datetime] = None
    rejection_date: Optional[datetime] = None
    rejection_reason: Optional[str] = None

class JobApplicationResponse(BaseModel):
    id: int
    company: str
    position: str
    department: Optional[str] = None
    location: Optional[str] = None
    salary_range: Optional[str] = None
    job_url: Optional[str] = None
    job_description: Optional[str] = None
    status: JobApplicationStatus
    applied_date: Optional[datetime] = None
    last_status_update: datetime
    ai_match_score: Optional[float] = None
    ai_analysis_data: Optional[Dict[str, Any]] = None
    source: JobApplicationSource
    notes: Optional[str] = None
    interview_date: Optional[datetime] = None
    offer_date: Optional[datetime] = None
    rejection_date: Optional[datetime] = None
    rejection_reason: Optional[str] = None
    referral_id: Optional[int] = None
    referral_employee_id: Optional[int] = None
    referral_status: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    referral_employee: Optional[UserResponse] = None

class JobApplicationFilter(BaseModel):
    status: Optional[JobApplicationStatus] = None
    company: Optional[str] = None
    source: Optional[JobApplicationSource] = None
    min_match_score: Optional[float] = None
    date_from: Optional[datetime] = None
    date_to: Optional[datetime] = None
    has_referral: Optional[bool] = None
    limit: int = 50
    offset: int = 0

class JobApplicationBulkUpdate(BaseModel):
    job_application_ids: List[int]
    status: Optional[JobApplicationStatus] = None
    notes: Optional[str] = None

class JobRecommendation(BaseModel):
    company: str
    position: str
    department: Optional[str] = None
    location: Optional[str] = None
    salary_range: Optional[str] = None
    job_url: Optional[str] = None
    job_description: Optional[str] = None
    match_score: float
    match_reasons: List[str]
    skills_match: List[str]
    missing_skills: List[str]
    ai_analysis: Dict[str, Any]
    has_employee_connection: bool = False
    connected_employees: List[UserResponse] = []

class JobApplicationAnalytics(BaseModel):
    total_applications: int
    by_status: Dict[str, int]
    by_source: Dict[str, int]
    average_match_score: Optional[float] = None
    application_trend: List[Dict[str, Any]]
    success_rate: float
    avg_time_to_response: Optional[float] = None
    top_companies: List[Dict[str, Any]]
    referral_success_rate: Optional[float] = None 