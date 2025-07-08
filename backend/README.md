# ReferralInc Backend

A FastAPI-based backend for the ReferralInc AI-powered referral management platform.

## 🚀 Features

- **Authentication & Authorization**: JWT-based auth with role-based access control
- **SQLite Database**: Lightweight database with comprehensive schema
- **AI Integration**: Ready for Groq/Llama model integration
- **User Management**: Complete user profiles for candidates and employees
- **Real-time Features**: Built-in support for WebSocket connections
- **Payment Integration**: Stripe-ready for premium features
- **Rate Limiting**: Built-in protection against abuse
- **Comprehensive API**: RESTful endpoints for all platform features

## 🛠️ Tech Stack

- **FastAPI**: Modern, fast web framework for building APIs
- **SQLite**: Lightweight, serverless database
- **JWT**: JSON Web Tokens for authentication
- **Groq**: AI/LLM integration for resume analysis and matching
- **Pydantic**: Data validation using Python type annotations
- **Uvicorn**: Lightning-fast ASGI server

## 📦 Installation

1. **Clone and navigate to backend directory**:
   ```bash
   cd backend
   ```

2. **Install dependencies**:
   ```bash
   pip install -r requirements.txt
   ```

3. **Set up environment variables**:
   ```bash
   cp .env.example .env
   # Edit .env with your actual values
   ```

4. **Initialize database**:
   ```bash
   python database.py
   ```

5. **Run the development server**:
   ```bash
   python run.py
   # OR
   uvicorn main:app --reload --host 0.0.0.0 --port 8000
   ```

## 🔧 Environment Variables

```bash
# Database
DATABASE_URL=sqlite:///./referralinc.db

# JWT Settings
SECRET_KEY=your-super-secret-key-change-in-production
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
REFRESH_TOKEN_EXPIRE_DAYS=7

# Groq API (for AI features)
GROQ_API_KEY=your-groq-api-key-here

# Stripe (for premium features)
STRIPE_SECRET_KEY=your-stripe-secret-key-here
STRIPE_PUBLISHABLE_KEY=your-stripe-publishable-key-here

# Email Settings
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password
```

## 📚 API Documentation

Once the server is running, visit:
- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc

## 🔐 Authentication Endpoints

### Register User
```http
POST /api/auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "securepassword",
  "name": "John Doe",
  "role": "candidate",
  "department": "Engineering",
  "position": "Software Engineer",
  "company": "Tech Corp",
  "skills": ["Python", "React", "SQL"],
  "experience_years": 3
}
```

### Login
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "securepassword"
}
```

### Refresh Token
```http
POST /api/auth/refresh
Content-Type: application/json

{
  "refresh_token": "your_refresh_token_here"
}
```

### Logout
```http
POST /api/auth/logout
Content-Type: application/json

{
  "refresh_token": "your_refresh_token_here"
}
```

## 👥 User Roles

- **Candidate**: Job seekers looking for referrals
- **Employee**: Company employees providing referrals
- **Admin**: Platform administrators

## 🗄️ Database Schema

### Users Table
- User profiles with role-based information
- Skills, experience, and rating system
- Company and department associations

### Referrals Table
- Referral requests and status tracking
- AI analysis scores and summaries
- Feedback and rating system

### Conversations Table
- Premium conversation sessions
- Payment integration
- Scheduling and completion tracking

### Messages Table
- Real-time messaging system
- File attachment support
- System messages

### Notifications Table
- User notification system
- Priority levels
- Read/unread status

## 🤖 AI Integration

The backend is ready for AI integration using Groq and Llama models:

```python
# Example AI endpoint usage
POST /api/ai/analyze-resume
{
  "resume_text": "Your resume content here..."
}

POST /api/ai/match-job
{
  "resume_text": "Resume content...",
  "job_description": "Job description...",
  "company_info": {}
}
```

## 🔒 Security Features

- **Password Hashing**: Bcrypt for secure password storage
- **JWT Tokens**: Secure authentication with refresh tokens
- **Rate Limiting**: Protection against brute force attacks
- **Input Validation**: Pydantic models for data validation
- **CORS**: Configurable cross-origin resource sharing

## 🚦 Development

### Project Structure
```
backend/
├── main.py              # FastAPI application entry point
├── database.py          # Database setup and management
├── models.py            # Pydantic models
├── auth_utils.py        # Authentication utilities
├── routers/             # API route handlers
│   ├── auth.py         # Authentication endpoints
│   ├── users.py        # User management
│   ├── referrals.py    # Referral system
│   ├── conversations.py # Messaging system
│   └── ai_analysis.py  # AI-powered features
├── requirements.txt     # Python dependencies
└── .env                # Environment variables
```

### Adding New Endpoints

1. Create new router in `routers/` directory
2. Add models in `models.py`
3. Include router in `main.py`
4. Update database schema if needed

## 🧪 Testing

```bash
# Run basic health check
curl http://localhost:8000/api/health

# Test authentication
curl -X POST http://localhost:8000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"testpass123","name":"Test User","role":"candidate"}'
```

## 🚀 Production Deployment

1. **Set secure environment variables**
2. **Use production database** (PostgreSQL recommended)
3. **Configure reverse proxy** (Nginx)
4. **Set up SSL certificates**
5. **Enable logging and monitoring**

## 📝 Next Steps

1. **Implement Groq AI integration** for resume analysis
2. **Add real-time WebSocket support** for messaging
3. **Integrate Stripe payment processing**
4. **Add email notification system**
5. **Implement file upload for resumes**
6. **Add comprehensive testing suite**

## 🤝 Contributing

1. Follow PEP 8 style guidelines
2. Add type hints to all functions
3. Write comprehensive docstrings
4. Add tests for new features
5. Update API documentation

## 📄 License

This project is part of the ReferralInc platform. 