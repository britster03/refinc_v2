# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview
ReferralInc is a full-stack AI-powered referral management platform with sophisticated multi-agent AI systems for resume analysis, job matching, and intelligent candidate referral services.

## Architecture
- **Frontend**: Next.js 15 with React 19, TypeScript, Tailwind CSS, shadcn/ui
- **Backend**: FastAPI with Python 3.8+, SQLite database, SQLAlchemy ORM
- **AI/ML**: Multi-agent system with Groq/LLM integration, ChromaDB vector store
- **Authentication**: JWT-based with OTP verification for employees
- **Payments**: Stripe integration for premium features
- **Real-time**: WebSocket support for messaging

## Development Commands

### Frontend (Next.js)
```bash
npm run dev          # Development server (port 3000)
npm run build        # Production build
npm run start        # Start production server
npm run lint         # ESLint checking
```

### Backend (FastAPI)
```bash
# Development
python run.py        # Start development server (port 8000)
uvicorn main:app --reload --host 0.0.0.0 --port 8000

# Database
python database.py   # Initialize database schema
python init_sample_data.py  # Add sample data

# Testing
python test_ai_pipeline.py  # Test AI agent system
python test_otp_system.py   # Test OTP verification
pytest               # Run test suite (when available)
```

## Key Architectural Components

### Multi-Agent AI System
Located in `backend/ai_agents/`, this system coordinates multiple AI agents:
- **Resume Analyzer**: Comprehensive resume scoring and analysis
- **Job Matcher**: Vector-based job matching using ChromaDB
- **Skills Extractor**: NLP-powered skills identification
- **Market Intelligence**: Web scraping for job market insights
- **Assessment Coordinator**: Orchestrates multi-agent workflows

### Authentication Flow
- JWT access tokens (30 min) + refresh tokens (7 days)
- Role-based access control (candidate/employee/admin)
- OTP verification for employee registration with company email validation
- Rate limiting on all auth endpoints

### Database Schema
37 tables including core entities:
- `users`: Multi-role user profiles with skills and ratings
- `referrals`: AI-analyzed referral requests with feedback loops
- `conversations`: Premium conversation sessions with Stripe integration
- `messages`: Real-time messaging system
- `ai_analysis_cache`: Cached AI analysis results
- `premium_payments`: Stripe payment tracking

### Premium Features
- AI-powered resume analysis with detailed scoring
- One-on-one conversation booking with employees
- Stripe payment processing with coupon support
- Premium conversation file sharing

## Important Development Patterns

### Frontend Architecture
- App Router with server-side rendering
- TypeScript throughout with strict type checking
- shadcn/ui component library with Radix UI primitives
- React Hook Form with Zod validation
- Context-based state management for auth and themes

### Backend Architecture
- FastAPI with automatic OpenAPI documentation
- Pydantic models for request/response validation
- SQLAlchemy 2.0 with async support
- Repository pattern for data access
- Service layer for business logic
- Middleware for rate limiting and security headers

### AI Integration
- Groq API for LLM inference
- ChromaDB for vector similarity search
- Sentence transformers for embedding generation
- Document processing for PDF/DOCX resumes
- Multi-provider email system (SendGrid, AWS SES, Resend, SMTP)

## Environment Setup

### Required Environment Variables
```bash
# Database
DATABASE_URL=sqlite:///./referralinc.db

# JWT
SECRET_KEY=your-super-secret-key
ALGORITHM=HS256

# AI Services
GROQ_API_KEY=your-groq-api-key
OPENAI_API_KEY=your-openai-api-key

# Stripe
STRIPE_SECRET_KEY=your-stripe-secret-key
STRIPE_PUBLISHABLE_KEY=your-stripe-publishable-key

# Email (multiple providers supported)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password
```

## Testing and Validation

### Backend Testing
- Use dedicated test scripts in the backend directory
- `test_ai_pipeline.py` for AI system validation
- `test_otp_system.py` for authentication testing
- Health check endpoint: `/api/health`

### API Documentation
- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

## Security Considerations
- Never commit environment variables or secrets
- All user inputs are validated with Pydantic models
- Password hashing with bcrypt
- Rate limiting on all endpoints
- CORS configuration for frontend integration
- File upload validation and sanitization

## Workflow Guidelines
1. Plan tasks using todo.md with clear, simple steps
2. Make minimal, focused changes - avoid large refactors
3. Test AI agents individually before integration
4. Verify database schema changes don't break existing data
5. Check both frontend and backend when making API changes
6. Review security implications of all changes

