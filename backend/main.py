# Load environment variables from .env file
try:
    from dotenv import load_dotenv
    load_dotenv()
    print("✅ Environment variables loaded from .env file")
except ImportError:
    print("python-dotenv not installed. Environment variables from .env file won't be loaded.")

from fastapi import FastAPI, HTTPException, status, Depends, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware
from fastapi.security import HTTPBearer
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from slowapi.middleware import SlowAPIMiddleware
import time
import logging

from routers import auth, users, referrals, conversations, feedback, notifications, settings, video_calls, ai_analysis, free_conversations, admin, coins
from database import init_db

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('app.log'),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

# Initialize rate limiter
limiter = Limiter(key_func=get_remote_address)

# Create FastAPI app
app = FastAPI(
    title="ReferralInc API",
    description="AI-powered referral management platform",
    version="1.0.0",
    docs_url="/docs" if __debug__ else None,  # Disable docs in production
    redoc_url="/redoc" if __debug__ else None,
    redirect_slashes=False  # Disable automatic trailing slash redirects
)

# CORS middleware - MUST be first to handle preflight requests
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:3001",  # In case you use a different port
        "ws://localhost:3000",    # WebSocket origins
        "ws://127.0.0.1:3000",
        "ws://localhost:3001",
    ],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allow_headers=["*"],
    expose_headers=["X-RateLimit-Limit", "X-RateLimit-Remaining", "X-RateLimit-Reset"]
)

# Security middleware
app.add_middleware(
    TrustedHostMiddleware, 
    allowed_hosts=["localhost", "127.0.0.1", "*.yourdomain.com"]
)

# Add rate limiting middleware
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)
app.add_middleware(SlowAPIMiddleware)

# Security headers middleware
@app.middleware("http")
async def add_security_headers(request: Request, call_next):
    start_time = time.time()
    
    response = await call_next(request)
    
    # Check if this is a file serving endpoint that should allow iframe embedding
    is_file_endpoint = request.url.path.startswith("/referrals/files/") or request.url.path.startswith("/api/referrals/files/")
    
    # Add security headers
    response.headers["X-Content-Type-Options"] = "nosniff"
    
    if is_file_endpoint:
        # For file endpoints, allow iframe embedding and relax CSP
        response.headers["X-Frame-Options"] = "ALLOWALL"
        response.headers["Content-Security-Policy"] = "default-src 'self' 'unsafe-inline'; frame-ancestors *;"
    else:
        # For other endpoints, maintain strict security
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["Content-Security-Policy"] = "default-src 'self'"
    
    response.headers["X-XSS-Protection"] = "1; mode=block"
    response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
    response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
    
    # Add performance header
    process_time = time.time() - start_time
    response.headers["X-Process-Time"] = str(process_time)
    
    # Log requests
    logger.info(f"{request.method} {request.url.path} - {response.status_code} - {process_time:.4f}s")
    
    return response

# Error handling middleware with CORS
@app.middleware("http")
async def catch_exceptions(request: Request, call_next):
    try:
        response = await call_next(request)
        return response
    except HTTPException as e:
        # Re-raise HTTPExceptions (they're handled properly by FastAPI)
        raise e
    except Exception as e:
        logger.error(f"Unhandled exception: {e}", exc_info=True)
        # Create a proper error response with CORS headers
        from fastapi.responses import JSONResponse
        error_detail = f"Internal server error: {str(e)}" if __debug__ else "Internal server error"
        
        response = JSONResponse(
            status_code=500,
            content={"detail": error_detail}
        )
        
        # Add CORS headers manually for error responses
        origin = request.headers.get("origin")
        if origin in ["http://localhost:3000", "http://127.0.0.1:3000", "http://localhost:3001"]:
            response.headers["Access-Control-Allow-Origin"] = origin
            response.headers["Access-Control-Allow-Credentials"] = "true"
        
        return response

# Initialize database on startup
@app.on_event("startup")
async def startup_event():
    try:
        init_db()
        logger.info("Database initialized successfully")
    except Exception as e:
        logger.error(f"Failed to initialize database: {e}")
        raise

# Health check endpoint
@app.get("/health")
@limiter.limit("100/minute")
async def health_check(request: Request):
    """Health check endpoint for monitoring"""
    return {
        "status": "healthy",
        "timestamp": time.time(),
        "version": "1.0.0"
    }

# Include routers with rate limiting
app.include_router(
    auth.router, 
    prefix="/auth", 
    tags=["Authentication"]
)

app.include_router(
    users.router, 
    prefix="/users", 
    tags=["Users"]
)

app.include_router(
    referrals.router, 
    prefix="/referrals", 
    tags=["Referrals"]
)

app.include_router(
    conversations.router, 
    prefix="/conversations", 
    tags=["Conversations"]
)

app.include_router(
    feedback.router, 
    prefix="/feedback", 
    tags=["Feedback"]
)

app.include_router(
    notifications.router, 
    prefix="/notifications", 
    tags=["Notifications"]
)

app.include_router(
    settings.router, 
    prefix="/settings", 
    tags=["Settings"]
)

app.include_router(
    admin.router, 
    tags=["Admin"]  # prefix is already defined in the router
)

app.include_router(
    video_calls.router, 
    prefix="/video-calls", 
    tags=["Video Calls"]
)

app.include_router(
    free_conversations.router, 
    prefix="/free-conversations", 
    tags=["Free Conversations"]
)

app.include_router(
    ai_analysis.router, 
    prefix="/api/ai", 
    tags=["AI Analysis"]
)

app.include_router(
    coins.router, 
    prefix="/coins", 
    tags=["Coins & Rewards"]
)

# Handle incorrect /api/referrals/files/ URLs by redirecting to correct path
@app.get("/api/referrals/files/{filename}")
@limiter.limit("100/minute")
async def redirect_api_files(request: Request, filename: str):
    """Redirect incorrect /api/referrals/files/ URLs to correct /referrals/files/ path"""
    from fastapi.responses import RedirectResponse
    correct_url = f"/referrals/files/{filename}"
    logger.info(f"Redirecting /api/referrals/files/{filename} to {correct_url}")
    return RedirectResponse(url=correct_url, status_code=301)



# Root endpoint
@app.get("/")
@limiter.limit("60/minute")
async def read_root(request: Request):
    return {
        "message": "Welcome to ReferralInc API",
        "version": "1.0.0",
        "docs_url": "/docs" if __debug__ else "Contact admin for documentation"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=__debug__,
        log_level="info"
    ) 