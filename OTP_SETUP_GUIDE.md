# OTP Email Verification Setup Guide

## Overview
This guide documents the OTP (One-Time Password) email verification system implemented for employee registration. This security layer ensures that only employees with valid company email addresses can register.

## 🔒 Security Features Implemented

### 1. Company Email Validation
- Prevents registration with personal email domains (Gmail, Yahoo, Hotmail, etc.)
- Requires employees to use their company email addresses
- Real-time validation with user-friendly error messages

### 2. OTP Verification System
- 6-digit random OTP codes
- 10-minute expiration time
- Rate limiting (1 OTP per minute)
- Maximum 3 verification attempts per OTP
- Automatic cleanup of expired OTPs

### 3. Database Security
- Secure OTP storage with expiration tracking
- User data encryption in transit
- Audit trail for all verification attempts
- Prevents OTP reuse and replay attacks

## 📁 Files Modified/Created

### Backend Files
- `backend/database.py` - Added OTP verification table
- `backend/models.py` - New OTP models and employee registration models
- `backend/services/otp_service.py` - Core OTP logic (NEW)
- `backend/services/email_service.py` - Added OTP email template
- `backend/routers/auth.py` - New OTP endpoints
- `backend/requirements.txt` - Updated dependencies

### Frontend Files
- `components/OTPVerification.tsx` - OTP input component (NEW)
- `lib/auth.ts` - New OTP authentication methods
- `app/auth/register/page.tsx` - Updated registration flow

## 🔄 Registration Flow

### For Candidates (Unchanged)
1. Fill registration form
2. Click "Create Account"
3. Immediate account creation and login

### For Employees (New Secure Flow)
1. Fill registration form with company email
2. Company email validation (real-time)
3. Click "Send Verification Code"
4. OTP sent to company email
5. Enter 6-digit OTP code
6. Email verification and account creation
7. Automatic login to employee dashboard

## 🛠 Backend Implementation

### New Database Table
```sql
CREATE TABLE email_otp_verification (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT NOT NULL,
    otp_code TEXT NOT NULL,
    purpose TEXT NOT NULL DEFAULT 'registration',
    expires_at TIMESTAMP NOT NULL,
    attempts INTEGER DEFAULT 0,
    max_attempts INTEGER DEFAULT 3,
    is_used BOOLEAN DEFAULT FALSE,
    user_data TEXT, -- JSON for pending registration
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### New API Endpoints
- `POST /auth/employee/request-otp` - Send OTP to company email
- `POST /auth/employee/verify-otp` - Verify OTP and create account

## 📧 Email Configuration

### Supported Email Providers
- **SendGrid** (Primary recommendation)
- **AWS SES** (Enterprise option)
- **Resend** (Modern developer-friendly)
- **SMTP** (Universal fallback)

### Environment Variables Setup
Add to your `.env` file:

```env
# Email Configuration (choose one)

# Option 1: SendGrid
SENDGRID_API_KEY=your_sendgrid_api_key

# Option 2: AWS SES
AWS_ACCESS_KEY_ID=your_aws_access_key
AWS_SECRET_ACCESS_KEY=your_aws_secret_key
AWS_REGION=us-east-1

# Option 3: Resend
RESEND_API_KEY=your_resend_api_key

# Option 4: SMTP
SMTP_HOST=smtp.your-email-provider.com
SMTP_PORT=587
SMTP_USERNAME=your_smtp_username
SMTP_PASSWORD=your_smtp_password
SMTP_USE_TLS=true

# Email Defaults
DEFAULT_FROM_EMAIL=noreply@yourdomain.com
DEFAULT_FROM_NAME=ReferralInc
```

## 🧪 Testing

### Core Functionality Test
```bash
cd backend
python3 test_otp_core.py
```

### Full System Test (requires email config)
```bash
cd backend
python3 test_otp_system.py
```

## 🚀 Deployment Steps

### 1. Database Migration
```bash
cd backend
python3 -c "import database; database.init_db()"
```

### 2. Install Dependencies
```bash
cd backend
pip install -r requirements.txt

# For email providers (optional)
pip install sendgrid boto3 resend
```

### 3. Configure Email Service
- Choose an email provider
- Add credentials to environment variables
- Test email sending

### 4. Frontend Build
```bash
npm install
npm run build
```

## 🔐 Security Considerations

### Rate Limiting
- 3 OTP requests per 10 minutes per IP
- 5 verification attempts per 15 minutes per IP
- 1 minute cooldown between OTP requests

### Data Protection
- OTPs expire after 10 minutes
- Used OTPs cannot be reused
- User data is temporarily stored during verification
- Automatic cleanup of expired records

### Company Email Validation
Current blocked domains:
- gmail.com, yahoo.com, hotmail.com, outlook.com
- aol.com, icloud.com, mail.com, protonmail.com

## 🎯 Benefits

### For Security
- Prevents fake employee registrations
- Ensures email ownership verification
- Protects against automated attacks
- Maintains audit trail

### For User Experience
- Clear validation messages
- Auto-paste OTP support
- Countdown timers
- Resend functionality
- Mobile-friendly OTP input

### For Administration
- Easy to configure email providers
- Comprehensive error handling
- Rate limiting protection
- Database cleanup automation

## 🔧 Troubleshooting

### Common Issues

1. **Email not sending**
   - Check email provider configuration
   - Verify API keys/credentials
   - Check spam folder

2. **OTP verification failing**
   - Ensure OTP hasn't expired
   - Check for typos in OTP code
   - Verify email matches exactly

3. **Company email rejected**
   - Check if domain is in blocked list
   - Ensure using company email, not personal

### Debug Commands
```bash
# Check database tables
python3 -c "import database; conn = database.get_db_connection(); print([row[1] for row in conn.execute('SELECT * FROM sqlite_master WHERE type=\"table\"').fetchall()])"

# Check OTP records
python3 -c "import database; conn = database.get_db_connection(); print(conn.execute('SELECT * FROM email_otp_verification').fetchall())"
```

## 📊 Monitoring

### Key Metrics to Track
- OTP success rate
- Email delivery rate
- Failed verification attempts
- Company email rejection rate

### Log Analysis
- All OTP operations are logged
- Failed attempts are tracked
- Rate limit violations recorded

## 🔄 Future Enhancements

### Potential Improvements
- Multi-language email templates
- SMS OTP as backup option
- Company domain whitelist management
- Advanced fraud detection
- OTP analytics dashboard

---

## Summary

The OTP email verification system provides a robust security layer for employee registration while maintaining a smooth user experience. The system is production-ready with comprehensive error handling, rate limiting, and security features. 