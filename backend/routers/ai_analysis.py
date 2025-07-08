"""
AI Analysis Router for ReferralInc
Provides comprehensive candidate assessment using agentic LLM pipeline with market intelligence
"""

import os
import logging
from typing import Dict, Any, List, Optional
from datetime import datetime
import asyncio
import json
import time
import hashlib
import openai

from fastapi import APIRouter, HTTPException, Depends, BackgroundTasks, Request, UploadFile, File, Query, status
from fastapi.responses import JSONResponse
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from pydantic import BaseModel, Field

# AI Agents
from ai_agents.assessment_coordinator import AssessmentCoordinator
from ai_agents.skills_extractor import SkillsExtractorAgent
from ai_agents.resume_analyzer import ResumeAnalyzerAgent
from ai_agents.job_matcher import JobMatcherAgent
from ai_agents.vector_store import VectorStoreManager
from ai_agents.market_intelligence import MarketIntelligenceManager
from ai_agents.candidate_matching_agent import CandidateMatchingAgent

# Services
from services.market_intelligence_service import MarketIntelligenceService
from services.analysis_session_service import AnalysisSessionService
from services.iterative_analysis_manager import IterativeAnalysisManager
from services.document_processor import DocumentProcessor

# External services
from groq import Groq

# Import models
from models import (
    ResumeAnalysisRequest, JobMatchRequest, ConsentRequest, ConsentResponse,
    AnalysisSessionRequest, FeedbackRequest, MarketIntelligenceRequest,
    PreAnalysisInput, DocumentProcessingResponse, ResumeAnalysisResponse,
    FeedbackAnalysisRequest, FeedbackAnalysisResponse, RejectionFeedbackAnalysisRequest, 
    RejectionFeedbackAnalysisResponse
)
from auth_utils import get_current_user
from database import DatabaseManager

# Add new request model for candidate matching
class CandidateMatchingRequest(BaseModel):
    candidate_id: int
    target_company: Optional[str] = None
    target_role: Optional[str] = None
    max_matches: int = Field(default=5, ge=1, le=10)
    preferences: Optional[Dict[str, Any]] = None

# Add new request model for customized matching
class CustomizedMatchingRequest(BaseModel):
    target_company: Optional[str] = None
    target_role: Optional[str] = None
    priority_focus: str = Field(default="balanced", description="Skills, performance, mentorship, or balanced")
    experience_level: str = Field(default="any", description="Junior, senior, executive, or any")
    industry_preference: Optional[str] = None
    specific_skills: Optional[str] = None
    response_time_importance: str = Field(default="medium", description="Low, medium, or high")
    additional_requirements: Optional[str] = None
    max_matches: int = Field(default=5, ge=1, le=10)

class MatchedEmployee(BaseModel):
    employee_id: int
    employee_name: str
    employee_position: str
    employee_company: str
    overall_score: float
    confidence_level: float
    score_breakdown: Dict[str, float]
    match_reasoning: Optional[Dict[str, Any]] = None
    referral_success_prediction: Optional[Dict[str, Any]] = None
    actionable_insights: Optional[Dict[str, Any]] = None

class CandidateMatchingResponse(BaseModel):
    success: bool
    matches: List[MatchedEmployee]
    summary: Dict[str, Any]
    total_evaluated: int
    matching_quality: str
    message: str

logger = logging.getLogger(__name__)

# Initialize rate limiter
limiter = Limiter(key_func=get_remote_address)

# Initialize router
router = APIRouter()

# Initialize Groq client
GROQ_API_KEY = os.getenv("GROQ_API_KEY")
if not GROQ_API_KEY:
    logger.error("GROQ_API_KEY not found in environment variables")
    groq_client = None
else:
    try:
        groq_client = Groq(api_key=GROQ_API_KEY)
        logger.info("Groq client initialized successfully")
    except Exception as e:
        logger.error(f"Failed to initialize Groq client: {str(e)}")
        groq_client = None

# Initialize Vector Store
vector_store = None
try:
    # Create chroma_db directory if it doesn't exist
    chroma_dir = "./chroma_db"
    os.makedirs(chroma_dir, exist_ok=True)
    
    vector_store = VectorStoreManager(
        persist_directory=chroma_dir,
        embedding_model="all-MiniLM-L6-v2",
        collection_name="resumes"
    )
    logger.info("Vector store initialized successfully")
except Exception as e:
    logger.error(f"Failed to initialize vector store: {str(e)}")
    vector_store = None

# Initialize Assessment Coordinator
assessment_coordinator = None
if groq_client and vector_store:
    try:
        assessment_coordinator = AssessmentCoordinator(
            groq_client=groq_client,
            vector_store=vector_store,
            model_name="meta-llama/llama-4-scout-17b-16e-instruct",
            max_tokens=4000,
            temperature=0.1
        )
        logger.info("Assessment coordinator initialized successfully")
    except Exception as e:
        logger.error(f"Failed to initialize assessment coordinator: {str(e)}")
        assessment_coordinator = None

# Initialize Market Intelligence Service
market_intelligence_service = None
try:
    market_intelligence_service = MarketIntelligenceService()
    logger.info("Market intelligence service initialized successfully")
except Exception as e:
    logger.error(f"Failed to initialize market intelligence service: {str(e)}")
    market_intelligence_service = None

# Initialize Analysis Session Service
analysis_session_service = None
if assessment_coordinator and market_intelligence_service:
    try:
        analysis_session_service = AnalysisSessionService(
            assessment_coordinator=assessment_coordinator,
            market_service=market_intelligence_service
        )
        logger.info("Analysis session service initialized successfully")
    except Exception as e:
        logger.error(f"Failed to initialize analysis session service: {str(e)}")
        analysis_session_service = None

# Initialize Iterative Analysis Manager
iterative_analysis_manager = None
if assessment_coordinator and market_intelligence_service:
    try:
        iterative_analysis_manager = IterativeAnalysisManager(
            assessment_coordinator=assessment_coordinator,
            market_service=market_intelligence_service
        )
        logger.info("Iterative analysis manager initialized successfully")
    except Exception as e:
        logger.error(f"Failed to initialize iterative analysis manager: {str(e)}")
        iterative_analysis_manager = None

# Initialize Document Processor
document_processor = None
if groq_client:
    try:
        document_processor = DocumentProcessor(groq_client=groq_client)
        logger.info("Document processor initialized successfully")
    except Exception as e:
        logger.error(f"Failed to initialize document processor: {str(e)}")
        document_processor = None

# Initialize AI components
try:
    from ..ai_agents.resume_analyzer import ResumeAnalyzerAgent
    from ..ai_agents.job_matcher import JobMatcherAgent
    from ..ai_agents.candidate_matching_agent import CandidateMatchingAgent
    
    resume_analyzer = ResumeAnalyzerAgent()
    job_matcher = JobMatcherAgent()
    candidate_matcher = CandidateMatchingAgent()
except ImportError:
    resume_analyzer = None
    job_matcher = None 
    candidate_matcher = None

# Set OpenAI API key
openai.api_key = os.getenv("OPENAI_API_KEY")

def check_ai_availability():
    """Check if AI services are available"""
    if not groq_client:
        raise HTTPException(
            status_code=503,
            detail="AI service unavailable: Groq API key not configured"
        )
    if not vector_store:
        raise HTTPException(
            status_code=503,
            detail="Vector database unavailable: ChromaDB initialization failed"
        )
    if not assessment_coordinator:
        raise HTTPException(
            status_code=503,
            detail="Assessment service unavailable: Coordinator initialization failed"
        )

@router.post("/comprehensive-analysis")
async def comprehensive_analysis(
    request: ResumeAnalysisRequest,
    background_tasks: BackgroundTasks,
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """
    Perform comprehensive candidate assessment using multi-agent AI pipeline
    
    This endpoint provides:
    - Advanced skills extraction and categorization
    - Comprehensive resume analysis and scoring
    - Job matching with semantic similarity (if job description provided)
    - Market analysis and competitive positioning
    - Vector database storage for future similarity searches
    - Actionable recommendations and career guidance
    """
    check_ai_availability()
    
    try:
        logger.info(f"Starting comprehensive analysis for user {current_user.get('id')}")
        
        # Prepare input data
        input_data = {
            "resume_text": request.resume_text,
            "job_description": getattr(request, 'job_description', None),
            "user_id": str(current_user.get("id"))
        }
        
        # Run comprehensive assessment
        result = await assessment_coordinator.process(input_data)
        
        if not result.success:
            raise HTTPException(
                status_code=500,
                detail=f"Analysis failed: {result.error}"
            )
        
        # Log success metrics
        logger.info(f"Analysis completed for user {current_user.get('id')} - "
                   f"Confidence: {result.confidence:.2f}, "
                   f"Processing time: {result.processing_time:.2f}s")
        
        return {
            "success": True,
            "data": result.data,
            "metadata": {
                "confidence": result.confidence,
                "processing_time": result.processing_time,
                "agent_name": result.agent_name,
                "timestamp": result.timestamp,
                "user_id": current_user.get("id")
            }
        }
        
    except Exception as e:
        logger.error(f"Comprehensive analysis failed for user {current_user.get('id')}: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Analysis failed: {str(e)}"
        )

@router.post("/skills-extraction")
async def extract_skills(
    request: ResumeAnalysisRequest,
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """
    Extract and analyze skills from resume using advanced NLP and LLM techniques
    
    Features:
    - Comprehensive skill identification and categorization
    - Experience level assessment for each skill
    - Market demand analysis for extracted skills
    - Technology stack identification
    - Skill gap analysis and recommendations
    """
    check_ai_availability()
    
    try:
        # Initialize skills extractor
        skills_extractor = SkillsExtractorAgent(
            groq_client=groq_client,
            model_name="meta-llama/llama-4-scout-17b-16e-instruct"
        )
        
        # Extract skills
        result = await skills_extractor.process({"resume_text": request.resume_text})
        
        if not result.success:
            raise HTTPException(
                status_code=500,
                detail=f"Skills extraction failed: {result.error}"
            )
        
        return {
            "success": True,
            "data": result.data,
            "metadata": {
                "confidence": result.confidence,
                "processing_time": result.processing_time,
                "skills_count": len(result.data.get("extracted_skills", [])),
                "user_id": current_user.get("id")
            }
        }
        
    except Exception as e:
        logger.error(f"Skills extraction failed: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Skills extraction failed: {str(e)}"
        )

@router.post("/resume-analysis")
async def analyze_resume(
    request: ResumeAnalysisRequest,
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """
    Comprehensive resume analysis with detailed scoring and recommendations
    
    Features:
    - Structure and format analysis
    - Content quality assessment
    - ATS compatibility scoring
    - Professional presentation evaluation
    - Detailed improvement recommendations
    - Competitive benchmarking
    """
    check_ai_availability()
    
    try:
        # Initialize resume analyzer
        resume_analyzer = ResumeAnalyzerAgent(
            groq_client=groq_client,
            model_name="meta-llama/llama-4-scout-17b-16e-instruct"
        )
        
        # Analyze resume
        result = await resume_analyzer.process({"resume_text": request.resume_text})
        
        if not result.success:
            raise HTTPException(
                status_code=500,
                detail=f"Resume analysis failed: {result.error}"
            )
        
        return {
            "success": True,
            "data": result.data,
            "metadata": {
                "confidence": result.confidence,
                "processing_time": result.processing_time,
                "user_id": current_user.get("id")
            }
        }
        
    except Exception as e:
        logger.error(f"Resume analysis failed: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Resume analysis failed: {str(e)}"
        )

@router.post("/job-matching")
async def match_job(
    request: JobMatchRequest,
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """
    Semantic job matching with comprehensive candidate-role alignment analysis
    
    Features:
    - Skills alignment and gap analysis
    - Experience level matching
    - Cultural fit assessment
    - Salary expectation analysis
    - Interview preparation recommendations
    - Competitive positioning insights
    """
    check_ai_availability()
    
    try:
        # Initialize job matcher
        job_matcher = JobMatcherAgent(
            groq_client=groq_client,
            model_name="meta-llama/llama-4-scout-17b-16e-instruct"
        )
        
        # Perform job matching
        input_data = {
            "resume_text": request.resume_text,
            "job_description": request.job_description
        }
        
        result = await job_matcher.process(input_data)
        
        if not result.success:
            raise HTTPException(
                status_code=500,
                detail=f"Job matching failed: {result.error}"
            )
        
        return {
            "success": True,
            "data": result.data,
            "metadata": {
                "confidence": result.confidence,
                "processing_time": result.processing_time,
                "match_score": result.data.get("overall_match_score", 0),
                "user_id": current_user.get("id")
            }
        }
        
    except Exception as e:
        logger.error(f"Job matching failed: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Job matching failed: {str(e)}"
        )

@router.get("/similar-resumes")
async def find_similar_resumes(
    query: str,
    limit: int = 5,
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """
    Find similar resumes using vector similarity search
    
    This endpoint helps identify candidates with similar profiles,
    skills, and experience for benchmarking and competitive analysis.
    """
    if not vector_store:
        raise HTTPException(
            status_code=503,
            detail="Vector database unavailable"
        )
    
    try:
        # Perform similarity search
        search_result = await vector_store.similarity_search(
            query_text=query,
            k=limit
        )
        
        # Extract results from the search result dictionary
        similar_resumes = search_result.get("results", [])
        
        return {
            "success": True,
            "data": {
                "query": query,
                "similar_resumes": similar_resumes,  # Return the extracted results list
                "count": len(similar_resumes)
            },
            "metadata": {
                "user_id": current_user.get("id"),
                "timestamp": datetime.utcnow().isoformat()
            }
        }
        
    except Exception as e:
        logger.error(f"Similar resume search failed: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Search failed: {str(e)}"
        )

@router.get("/vector-stats")
async def get_vector_stats(current_user: Dict[str, Any] = Depends(get_current_user)):
    """Get statistics about the vector database"""
    if not vector_store:
        raise HTTPException(
            status_code=503,
            detail="Vector database unavailable"
        )
    
    try:
        stats = await vector_store.get_collection_stats()
        
        return {
            "success": True,
            "data": stats,
            "metadata": {
                "user_id": current_user.get("id"),
                "timestamp": datetime.utcnow().isoformat()
            }
        }
        
    except Exception as e:
        logger.error(f"Failed to get vector stats: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to get statistics: {str(e)}"
        )

@router.post("/store-resume")
async def store_resume_in_vector_db(
    request: ResumeAnalysisRequest,
    background_tasks: BackgroundTasks,
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """
    Store resume in vector database for future similarity searches
    
    This endpoint processes and stores resume embeddings for:
    - Future similarity searches
    - Competitive analysis
    - Market benchmarking
    - Talent pool insights
    """
    if not vector_store:
        raise HTTPException(
            status_code=503,
            detail="Vector database unavailable"
        )
    
    try:
        # Prepare metadata
        metadata = {
            "user_id": str(current_user.get("id")),
            "timestamp": datetime.utcnow().isoformat(),
            "source": "api_upload"
        }
        
        # Store in vector database
        document_id = await vector_store.add_document(
            text=request.resume_text,
            metadata=metadata
        )
        
        return {
            "success": True,
            "data": {
                "document_id": document_id,
                "message": "Resume stored successfully in vector database"
            },
            "metadata": {
                "user_id": current_user.get("id"),
                "timestamp": datetime.utcnow().isoformat()
            }
        }
        
    except Exception as e:
        logger.error(f"Failed to store resume: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Storage failed: {str(e)}"
        )

@router.get("/health")
async def health_check():
    """
    Health check endpoint for AI services
    
    Returns the status of all AI components:
    - Groq LLM client
    - ChromaDB vector store
    - Assessment coordinator
    - Individual AI agents
    """
    health_status = {
        "groq_client": groq_client is not None,
        "vector_store": vector_store is not None,
        "assessment_coordinator": assessment_coordinator is not None,
        "timestamp": datetime.utcnow().isoformat()
    }
    
    # Detailed component status
    components = {}
    
    if groq_client:
        try:
            # Test Groq connection with a simple request
            components["groq"] = {
                "status": "healthy",
                "model": "meta-llama/llama-4-scout-17b-16e-instruct"
            }
        except Exception as e:
            components["groq"] = {
                "status": "error",
                "error": str(e)
            }
    else:
        components["groq"] = {
            "status": "unavailable",
            "error": "API key not configured"
        }
    
    if vector_store:
        try:
            stats = await vector_store.get_collection_stats()
            components["vector_store"] = {
                "status": "healthy",
                "collection_size": stats.get("count", 0)
            }
        except Exception as e:
            components["vector_store"] = {
                "status": "error",
                "error": str(e)
            }
    else:
        components["vector_store"] = {
            "status": "unavailable",
            "error": "Initialization failed"
        }
    
    # Overall health
    all_healthy = all(
        comp.get("status") == "healthy" 
        for comp in components.values()
    )
    
    return {
        "status": "healthy" if all_healthy else "degraded",
        "components": components,
        "metadata": health_status
    }

# Privacy and Consent Management Endpoints

@router.post("/consent", response_model=ConsentResponse)
async def grant_consent(
    request: ConsentRequest,
    http_request: Request,
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """
    Grant or revoke user consent for data processing
    
    Consent types:
    - 'market_analysis': Allow market intelligence analysis
    - 'data_contribution': Allow anonymous data contribution
    - 'resume_storage': Allow resume storage in vector database
    """
    try:
        if not market_intelligence_service:
            raise HTTPException(status_code=503, detail="Market intelligence service unavailable")
        
        # Get client info for audit trail
        ip_address = http_request.client.host
        user_agent = http_request.headers.get("user-agent")
        
        if request.granted:
            success = market_intelligence_service.grant_user_consent(
                user_id=current_user["id"],
                consent_type=request.consent_type,
                ip_address=ip_address,
                user_agent=user_agent
            )
        else:
            success = market_intelligence_service.revoke_user_consent(
                user_id=current_user["id"],
                consent_type=request.consent_type
            )
        
        if not success:
            raise HTTPException(status_code=500, detail="Failed to update consent")
        
        return ConsentResponse(
            id=current_user["id"],
            consent_type=request.consent_type,
            granted=request.granted,
            granted_at=datetime.utcnow() if request.granted else None
        )
        
    except Exception as e:
        logger.error(f"Consent management failed for user {current_user.get('id')}: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/consent/{consent_type}")
async def get_consent_status(
    consent_type: str,
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """Get current consent status for a specific type"""
    try:
        if not market_intelligence_service:
            raise HTTPException(status_code=503, detail="Market intelligence service unavailable")
        
        has_consent = market_intelligence_service._check_user_consent(
            user_id=current_user["id"],
            consent_type=consent_type
        )
        
        return {
            "user_id": current_user["id"],
            "consent_type": consent_type,
            "granted": has_consent,
            "timestamp": datetime.utcnow().isoformat()
        }
        
    except Exception as e:
        logger.error(f"Consent check failed: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

# Market Intelligence Endpoints

@router.post("/market-intelligence")
async def get_market_intelligence(
    request: MarketIntelligenceRequest,
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """
    Get comprehensive market intelligence for specified skills
    
    Features:
    - Real-time job market analysis
    - Salary insights and trends
    - Skill demand analysis
    - Privacy-compliant data processing
    """
    try:
        if not market_intelligence_service:
            raise HTTPException(status_code=503, detail="Market intelligence service unavailable")
        
        # Get market analysis
        market_analysis = await market_intelligence_service.get_market_analysis_for_user(
            user_id=current_user["id"],
            skills=request.skills,
            include_salary_data=request.include_salary_data,
            cache_duration_hours=request.cache_duration_hours
        )
        
        return market_analysis
        
    except Exception as e:
        logger.error(f"Market intelligence failed for user {current_user.get('id')}: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/skill-demand/{skill}")
async def get_skill_demand(
    skill: str,
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """Get demand insights for a specific skill"""
    try:
        if not market_intelligence_service:
            raise HTTPException(status_code=503, detail="Market intelligence service unavailable")
        
        insights = await market_intelligence_service.get_skill_demand_insights([skill])
        
        return {
            "skill": skill,
            "insights": insights.get("skill_insights", {}).get(skill, {}),
            "timestamp": datetime.utcnow().isoformat()
        }
        
    except Exception as e:
        logger.error(f"Skill demand analysis failed: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/refresh-market-data")
async def refresh_market_data(
    request: MarketIntelligenceRequest,
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """Force refresh market data for specified skills"""
    try:
        if not market_intelligence_service:
            raise HTTPException(status_code=503, detail="Market intelligence service unavailable")
        
        result = await market_intelligence_service.refresh_market_data(
            skills=request.skills,
            force_refresh=True
        )
        
        return result
        
    except Exception as e:
        logger.error(f"Market data refresh failed: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/market-stats")
async def get_market_intelligence_stats(
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """Get market intelligence system statistics"""
    try:
        if not market_intelligence_service:
            raise HTTPException(status_code=503, detail="Market intelligence service unavailable")
        
        stats = market_intelligence_service.get_market_intelligence_stats()
        return stats
        
    except Exception as e:
        logger.error(f"Market stats failed: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

# Enhanced Analysis Session Endpoints

@router.post("/analysis-session")
async def create_analysis_session(
    request: AnalysisSessionRequest,
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """
    Create a new comprehensive analysis session with pre-analysis inputs
    
    Features:
    - Pre-analysis career planning inputs
    - Iterative analysis with up to 3 refinements
    - Personalized roadmap generation
    - Market intelligence integration
    """
    try:
        if not analysis_session_service:
            raise HTTPException(status_code=503, detail="Analysis session service unavailable")
        
        result = await analysis_session_service.create_analysis_session(
            user_id=current_user["id"],
            resume_text=request.resume_text,
            job_description=request.job_description,
            pre_analysis_input=request.pre_analysis_input.dict() if request.pre_analysis_input else None
        )
        
        if not result["success"]:
            raise HTTPException(status_code=500, detail=result["error"])
        
        return result
        
    except Exception as e:
        logger.error(f"Analysis session creation failed for user {current_user.get('id')}: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/analysis-session/{session_token}")
async def get_analysis_session(
    session_token: str,
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """Get analysis session with all iterations and feedback"""
    try:
        if not analysis_session_service:
            raise HTTPException(status_code=503, detail="Analysis session service unavailable")
        
        result = await analysis_session_service.get_analysis_session(
            session_token=session_token,
            user_id=current_user["id"]
        )
        
        if not result["success"]:
            raise HTTPException(status_code=404, detail=result["error"])
        
        return result
        
    except Exception as e:
        logger.error(f"Get analysis session failed: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/analysis-session/{session_token}/feedback")
async def submit_analysis_feedback(
    session_token: str,
    request: FeedbackRequest,
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """
    Submit feedback for analysis iteration
    
    Feedback types:
    - 'dissatisfaction': General dissatisfaction with results
    - 'refinement_request': Request specific refinements
    - 'positive': Positive feedback
    """
    try:
        if not analysis_session_service:
            raise HTTPException(status_code=503, detail="Analysis session service unavailable")
        
        result = await analysis_session_service.submit_feedback(
            session_token=session_token,
            user_id=current_user["id"],
            feedback_data=request.dict()
        )
        
        if not result["success"]:
            raise HTTPException(status_code=400, detail=result["error"])
        
        return result
        
    except Exception as e:
        logger.error(f"Feedback submission failed: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/analysis-session/{session_token}/refine")
async def request_analysis_refinement(
    session_token: str,
    request: FeedbackRequest,
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """
    Request analysis refinement with specific focus areas
    
    Allows up to 3 additional refinement iterations per session
    """
    try:
        if not analysis_session_service:
            raise HTTPException(status_code=503, detail="Analysis session service unavailable")
        
        result = await analysis_session_service.request_refinement(
            session_token=session_token,
            user_id=current_user["id"],
            refinement_request=request.dict()
        )
        
        if not result["success"]:
            raise HTTPException(status_code=400, detail=result["error"])
        
        return result
        
    except Exception as e:
        logger.error(f"Analysis refinement failed: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/analysis-session/{session_token}/complete")
async def complete_analysis_session(
    session_token: str,
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """Mark analysis session as completed"""
    try:
        if not analysis_session_service:
            raise HTTPException(status_code=503, detail="Analysis session service unavailable")
        
        result = await analysis_session_service.complete_session(
            session_token=session_token,
            user_id=current_user["id"]
        )
        
        if not result["success"]:
            raise HTTPException(status_code=400, detail=result["error"])
        
        return result
        
    except Exception as e:
        logger.error(f"Session completion failed: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

# Enhanced Analysis Endpoints with Iterative Refinement

@router.post("/enhanced-analysis")
async def enhanced_analysis_with_preferences(
    request: PreAnalysisInput,
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """
    Perform enhanced analysis with user preferences and iterative refinement capability
    
    Features:
    - Pre-analysis user input collection
    - Personalized analysis based on career goals and preferences
    - Iterative refinement capability
    - Session management for continuous improvement
    """
    if not iterative_analysis_manager:
        raise HTTPException(status_code=503, detail="Iterative analysis service unavailable")
    
    check_ai_availability()
    
    try:
        logger.info(f"Starting enhanced analysis for user {current_user.get('id')}")
        
        # Process initial analysis with preferences
        result = await iterative_analysis_manager.process_initial_analysis(
            user_id=current_user["id"],
            resume_data=request.resume_text,
            job_description=getattr(request, 'job_description', None),
            preferences=request.preferences
        )
        
        if not result["success"]:
            raise HTTPException(status_code=500, detail=result["error"])
        
        logger.info(f"Enhanced analysis completed for user {current_user.get('id')} - "
                   f"Session: {result.get('session_key')}")
        
        return result
        
    except Exception as e:
        logger.error(f"Enhanced analysis failed for user {current_user.get('id')}: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Enhanced analysis failed: {str(e)}")

@router.post("/analysis-iteration/{session_key}")
async def request_analysis_iteration(
    session_key: str,
    request: FeedbackRequest,
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """
    Request analysis refinement based on user feedback
    
    Features:
    - Process user satisfaction and feedback
    - Refine analysis based on specific improvement areas
    - Generate improved recommendations
    - Track iteration history
    """
    if not iterative_analysis_manager:
        raise HTTPException(status_code=503, detail="Iterative analysis service unavailable")
    
    try:
        logger.info(f"Processing iteration request for session {session_key}")
        
        # Process iteration request
        result = await iterative_analysis_manager.process_iteration_request(
            session_key=session_key,
            feedback=request.feedback_data,
            improvement_areas=request.improvement_areas or []
        )
        
        if not result["success"]:
            raise HTTPException(status_code=400, detail=result["error"])
        
        logger.info(f"Analysis iteration completed for session {session_key} - "
                   f"Remaining iterations: {result.get('remaining_iterations')}")
        
        return result
        
    except Exception as e:
        logger.error(f"Analysis iteration failed for session {session_key}: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Analysis iteration failed: {str(e)}")

@router.get("/vector-readiness")
async def check_vector_readiness(
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """
    Check vector database readiness for competitive analysis
    
    Returns:
    - Vector operations enabled status
    - Current resume count
    - Progress towards critical mass
    - Alternative insights when not ready
    """
    if not vector_store:
        raise HTTPException(status_code=503, detail="Vector store unavailable")
    
    try:
        # Check vector readiness
        is_ready = await vector_store.check_vector_readiness()
        
        # Get current stats
        stats = await vector_store.get_collection_stats()
        
        # Get alternative insights if not ready
        alternative_insights = None
        if not is_ready:
            alternative_insights = await vector_store.provide_general_insights("career analysis")
        
        return {
            "success": True,
            "vector_operations_enabled": vector_store.vector_operations_enabled,
            "current_resume_count": vector_store.current_resume_count,
            "minimum_required": vector_store.minimum_resumes_required,
            "progress_percentage": round((vector_store.current_resume_count / vector_store.minimum_resumes_required) * 100, 1),
            "collection_stats": stats,
            "alternative_insights": alternative_insights
        }
        
    except Exception as e:
        logger.error(f"Failed to check vector readiness: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/process-document")
async def process_document_endpoint(
    file: UploadFile = File(...),
    use_vision: bool = False,
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """
    Process an uploaded document (PDF, DOC, DOCX, TXT) and extract text
    
    Features:
    - Text extraction from PDF using PyPDF2/pdfplumber
    - DOCX/DOC processing with python-docx
    - Vision-based PDF processing to preserve formatting (optional)
    - Automatic format detection and processing
    """
    if not document_processor:
        raise HTTPException(
            status_code=503,
            detail="Document processing service unavailable"
        )
    
    # Validate file type
    if not file.filename:
        raise HTTPException(status_code=400, detail="Filename is required")
    
    file_ext = file.filename.split('.')[-1].lower()
    if file_ext not in ['pdf', 'doc', 'docx', 'txt']:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported file type: {file_ext}. Supported types: PDF, DOC, DOCX, TXT"
        )
    
    # Check file size (5MB limit)
    MAX_FILE_SIZE = 5 * 1024 * 1024  # 5MB
    file_content = await file.read()
    if len(file_content) > MAX_FILE_SIZE:
        raise HTTPException(
            status_code=400,
            detail=f"File too large. Maximum size: {MAX_FILE_SIZE // (1024*1024)}MB"
        )
    
    try:
        logger.info(f"Processing document {file.filename} for user {current_user.get('id')}")
        
        # Process the document
        result = await document_processor.process_uploaded_file(
            file_content=file_content,
            filename=file.filename,
            use_vision=use_vision
        )
        
        if not result['success']:
            raise HTTPException(
                status_code=500,
                detail=f"Document processing failed: {result.get('error', 'Unknown error')}"
            )
        
        # Log success
        logger.info(f"Document {file.filename} processed successfully for user {current_user.get('id')} - "
                   f"Method: {result['metadata'].get('processing_method', 'unknown')}, "
                   f"Text length: {len(result['text'])} characters")
        
        return {
            "success": True,
            "extracted_text": result['text'],
            "metadata": result['metadata'],
            "processing_info": {
                "filename": file.filename,
                "file_size": len(file_content),
                "processing_method": result['metadata'].get('processing_method'),
                "vision_used": result['metadata'].get('vision_used', False),
                "formatting_preserved": result['metadata'].get('formatting_preserved', False),
                "pages_processed": result['metadata'].get('pages_processed', 0)
            }
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Document processing failed for {file.filename}: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Document processing failed: {str(e)}"
        )

# Add the new endpoint after the existing ones
@router.get("/candidate-matching", response_model=CandidateMatchingResponse)
@limiter.limit("10/minute")  # Conservative rate limit for this sophisticated operation
async def get_my_ai_matches(
    request: Request,
    target_company: Optional[str] = None,
    max_matches: int = Query(default=5, ge=1, le=10),
    current_user = Depends(get_current_user)
):
    """
    Get AI-powered employee matches for the authenticated candidate.
    This is a convenience endpoint that automatically uses the current user's profile.
    
    No input required - automatically analyzes the authenticated candidate's profile
    and returns optimal employee matches using state-of-the-art AI algorithms.
    """
    try:
        logger.info(f"Getting AI matches for authenticated candidate {current_user['id']}")
        
        # Verify user is a candidate
        if current_user['role'] != 'candidate':
            raise HTTPException(
                status_code=403, 
                detail="Only candidates can request employee matching"
            )
        
        # Use the authenticated user's ID
        candidate_id = current_user['id']
        
        # Fetch real candidate data from database
        candidate_data = DatabaseManager.get_user_by_id(candidate_id)
        if not candidate_data:
            raise HTTPException(status_code=404, detail="Candidate profile not found")
        
        # Parse candidate skills from JSON
        candidate_skills = []
        if candidate_data.get('skills'):
            try:
                candidate_skills = json.loads(candidate_data['skills'])
            except (json.JSONDecodeError, TypeError):
                candidate_skills = []
        
        # Prepare candidate profile for matching
        candidate_profile = {
            "id": candidate_data["id"],
            "name": candidate_data["name"],
            "email": candidate_data["email"],
            "position": candidate_data.get("position", ""),
            "company": candidate_data.get("company", ""),
            "department": candidate_data.get("department", ""),
            "bio": candidate_data.get("bio", ""),
            "skills": candidate_skills,
            "experience_years": candidate_data.get("experience_years", 0),
            "location": candidate_data.get("location", ""),
            "is_verified": candidate_data.get("is_verified", False),
            "created_at": candidate_data.get("created_at"),
            "updated_at": candidate_data.get("updated_at")
        }
        
        # Fetch all active employees from database for matching pool
        employees_query = """
            SELECT * FROM users 
            WHERE role = 'employee' 
            AND is_active = TRUE
            ORDER BY rating DESC, total_referrals DESC
        """
        
        employee_records = DatabaseManager.execute_query(
            employees_query, 
            fetch_all=True
        )
        
        if not employee_records:
            return CandidateMatchingResponse(
                success=False,
                matches=[],
                summary={"message": "No active employees found for matching"},
                total_evaluated=0,
                matching_quality="none",
                message="No employees available for matching at this time"
            )
        
        # Prepare employee pool with parsed skills
        employee_pool = []
        for emp in employee_records:
            # Parse employee skills from JSON
            emp_skills = []
            if emp.get('skills'):
                try:
                    emp_skills = json.loads(emp['skills'])
                except (json.JSONDecodeError, TypeError):
                    emp_skills = []
            
            employee_profile = {
                "id": emp["id"],
                "name": emp["name"],
                "email": emp["email"],
                "position": emp.get("position", ""),
                "company": emp.get("company", ""),
                "department": emp.get("department", ""),
                "bio": emp.get("bio", ""),
                "skills": emp_skills,
                "experience_years": emp.get("experience_years", 0),
                "location": emp.get("location", ""),
                "rating": emp.get("rating", 0.0),
                "total_referrals": emp.get("total_referrals", 0),
                "successful_referrals": emp.get("successful_referrals", 0),
                "is_verified": emp.get("is_verified", False),
                "is_active": emp.get("is_active", True),
                "created_at": emp.get("created_at"),
                "updated_at": emp.get("updated_at")
            }
            employee_pool.append(employee_profile)
        
        logger.info(f"Found {len(employee_pool)} employees for matching analysis")
        
        # Initialize the sophisticated matching agent
        if not groq_client:
            raise HTTPException(
                status_code=503,
                detail="AI matching service temporarily unavailable"
            )
            
        matching_agent = CandidateMatchingAgent(groq_client)
        
        # Perform advanced matching with LLM reasoning
        matching_result = await matching_agent.match_candidate_with_employees(
            candidate_data=candidate_profile,
            employee_pool=employee_pool,
            target_company=target_company,
            max_matches=max_matches
        )
        
        if not matching_result.success:
            return CandidateMatchingResponse(
                success=False,
                matches=[],
                summary=matching_result.data.get("summary", {}),
                total_evaluated=matching_result.data.get("total_evaluated", 0),
                matching_quality="failed",
                message=matching_result.error or "Matching analysis failed"
            )
        
        # Format matches for response
        formatted_matches = []
        for match in matching_result.data.get("matches", []):
            formatted_match = MatchedEmployee(
                employee_id=match["employee_id"],
                employee_name=match["employee_name"],
                employee_position=match["employee_position"],
                employee_company=match["employee_company"],
                overall_score=match["overall_score"],
                confidence_level=match["confidence_level"],
                score_breakdown=match["score_breakdown"],
                match_reasoning=match.get("llm_insights", {}).get("match_reasoning"),
                referral_success_prediction=match.get("llm_insights", {}).get("referral_success_prediction"),
                actionable_insights=match.get("llm_insights", {}).get("actionable_insights")
            )
            formatted_matches.append(formatted_match)
        
        logger.info(f"Successfully matched candidate {candidate_id} with {len(formatted_matches)} employees")
        
        return CandidateMatchingResponse(
            success=True,
            matches=formatted_matches,
            summary=matching_result.data.get("summary", {}),
            total_evaluated=matching_result.data.get("total_evaluated", 0),
            matching_quality=matching_result.data.get("matching_quality", "moderate"),
            message=f"Found {len(formatted_matches)} high-quality matches using advanced AI analysis"
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error in GET candidate matching: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Internal server error during matching: {str(e)}"
        )

@router.post("/candidate-matching", response_model=CandidateMatchingResponse)
@limiter.limit("10/minute")  # Conservative rate limit for this sophisticated operation
async def advanced_candidate_matching(
    request: Request,
    matching_request: CandidateMatchingRequest,
    current_user = Depends(get_current_user)
):
    """
    Advanced AI-powered candidate-employee matching for optimal referrals.
    Uses state-of-the-art algorithms and LLM reasoning with only real data.
    
    Focus areas:
    - Skills & Expertise Alignment (35%)
    - Career Path & Experience Relevance (25%)
    - Performance & Success Metrics (20%) - VERY IMPORTANT
    - Availability & Engagement (15%)
    - Bias Neutrality (5%)
    """
    try:
        logger.info(f"Starting advanced candidate matching for user {current_user['id']}")
        
        # Verify user is a candidate or admin
        if current_user['role'] not in ['candidate', 'admin']:
            raise HTTPException(
                status_code=403, 
                detail="Only candidates can request employee matching"
            )
        
        # Get candidate data (use provided candidate_id or current user)
        candidate_id = matching_request.candidate_id
        if current_user['role'] != 'admin' and candidate_id != current_user['id']:
            raise HTTPException(
                status_code=403,
                detail="You can only request matches for your own profile"
            )
        
        # Fetch real candidate data from database
        candidate_data = DatabaseManager.get_user_by_id(candidate_id)
        if not candidate_data:
            raise HTTPException(status_code=404, detail="Candidate not found")
        
        if candidate_data['role'] != 'candidate':
            raise HTTPException(status_code=400, detail="User is not a candidate")
        
        # Parse candidate skills from JSON
        candidate_skills = []
        if candidate_data.get('skills'):
            try:
                candidate_skills = json.loads(candidate_data['skills'])
            except (json.JSONDecodeError, TypeError):
                candidate_skills = []
        
        # Prepare candidate profile for matching
        candidate_profile = {
            "id": candidate_data["id"],
            "name": candidate_data["name"],
            "email": candidate_data["email"],
            "position": candidate_data.get("position", ""),
            "company": candidate_data.get("company", ""),
            "department": candidate_data.get("department", ""),
            "bio": candidate_data.get("bio", ""),
            "skills": candidate_skills,
            "experience_years": candidate_data.get("experience_years", 0),
            "location": candidate_data.get("location", ""),
            "is_verified": candidate_data.get("is_verified", False),
            "created_at": candidate_data.get("created_at"),
            "updated_at": candidate_data.get("updated_at")
        }
        
        # Fetch all active employees from database for matching pool
        employees_query = """
            SELECT * FROM users 
            WHERE role = 'employee' 
            AND is_active = TRUE
            ORDER BY rating DESC, total_referrals DESC
        """
        
        employee_records = DatabaseManager.execute_query(
            employees_query, 
            fetch_all=True
        )
        
        if not employee_records:
            return CandidateMatchingResponse(
                success=False,
                matches=[],
                summary={"message": "No active employees found for matching"},
                total_evaluated=0,
                matching_quality="none",
                message="No employees available for matching at this time"
            )
        
        # Prepare employee pool with parsed skills
        employee_pool = []
        for emp in employee_records:
            # Parse employee skills from JSON
            emp_skills = []
            if emp.get('skills'):
                try:
                    emp_skills = json.loads(emp['skills'])
                except (json.JSONDecodeError, TypeError):
                    emp_skills = []
            
            employee_profile = {
                "id": emp["id"],
                "name": emp["name"],
                "email": emp["email"],
                "position": emp.get("position", ""),
                "company": emp.get("company", ""),
                "department": emp.get("department", ""),
                "bio": emp.get("bio", ""),
                "skills": emp_skills,
                "experience_years": emp.get("experience_years", 0),
                "location": emp.get("location", ""),
                "rating": emp.get("rating", 0.0),
                "total_referrals": emp.get("total_referrals", 0),
                "successful_referrals": emp.get("successful_referrals", 0),
                "is_verified": emp.get("is_verified", False),
                "is_active": emp.get("is_active", True),
                "created_at": emp.get("created_at"),
                "updated_at": emp.get("updated_at")
            }
            employee_pool.append(employee_profile)
        
        logger.info(f"Found {len(employee_pool)} employees for matching analysis")
        
        # Initialize the sophisticated matching agent
        if not groq_client:
            raise HTTPException(
                status_code=503,
                detail="AI matching service temporarily unavailable"
            )
            
        matching_agent = CandidateMatchingAgent(groq_client)
        
        # Perform advanced matching with LLM reasoning
        matching_result = await matching_agent.match_candidate_with_employees(
            candidate_data=candidate_profile,
            employee_pool=employee_pool,
            target_company=matching_request.target_company,
            max_matches=matching_request.max_matches
        )
        
        if not matching_result.success:
            return CandidateMatchingResponse(
                success=False,
                matches=[],
                summary=matching_result.data.get("summary", {}),
                total_evaluated=matching_result.data.get("total_evaluated", 0),
                matching_quality="failed",
                message=matching_result.error or "Matching analysis failed"
            )
        
        # Format matches for response
        formatted_matches = []
        for match in matching_result.data.get("matches", []):
            formatted_match = MatchedEmployee(
                employee_id=match["employee_id"],
                employee_name=match["employee_name"],
                employee_position=match["employee_position"],
                employee_company=match["employee_company"],
                overall_score=match["overall_score"],
                confidence_level=match["confidence_level"],
                score_breakdown=match["score_breakdown"],
                match_reasoning=match.get("llm_insights", {}).get("match_reasoning"),
                referral_success_prediction=match.get("llm_insights", {}).get("referral_success_prediction"),
                actionable_insights=match.get("llm_insights", {}).get("actionable_insights")
            )
            formatted_matches.append(formatted_match)
        
        logger.info(f"Successfully matched candidate {candidate_id} with {len(formatted_matches)} employees")
        
        return CandidateMatchingResponse(
            success=True,
            matches=formatted_matches,
            summary=matching_result.data.get("summary", {}),
            total_evaluated=matching_result.data.get("total_evaluated", 0),
            matching_quality=matching_result.data.get("matching_quality", "moderate"),
            message=f"Found {len(formatted_matches)} high-quality matches using advanced AI analysis"
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error in POST candidate matching: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Internal server error during matching: {str(e)}"
        )

@router.post("/customized-matching", response_model=CandidateMatchingResponse)
@limiter.limit("10/minute")  # Conservative rate limit for this sophisticated operation
async def customized_candidate_matching(
    request: Request,
    matching_request: CustomizedMatchingRequest,
    current_user = Depends(get_current_user)
):
    """
    Customized AI-powered candidate-employee matching based on user preferences.
    Allows candidates to specify their exact requirements and priorities.
    
    Customization options:
    - Target company and role
    - Priority focus (skills, performance, mentorship, balanced)
    - Experience level preferences
    - Specific skills and technologies
    - Response time importance
    - Additional custom requirements
    """
    try:
        logger.info(f"Starting customized candidate matching for user {current_user['id']}")
        
        # Verify user is a candidate
        if current_user['role'] != 'candidate':
            raise HTTPException(
                status_code=403, 
                detail="Only candidates can request customized employee matching"
            )
        
        candidate_id = current_user['id']
        
        # Fetch real candidate data from database
        candidate_data = DatabaseManager.get_user_by_id(candidate_id)
        if not candidate_data:
            raise HTTPException(status_code=404, detail="Candidate profile not found")
        
        # Parse candidate skills from JSON
        candidate_skills = []
        if candidate_data.get('skills'):
            try:
                candidate_skills = json.loads(candidate_data['skills'])
            except (json.JSONDecodeError, TypeError):
                candidate_skills = []
        
        # Enhance candidate profile with user preferences
        candidate_profile = {
            "id": candidate_data["id"],
            "name": candidate_data["name"],
            "email": candidate_data["email"],
            "position": candidate_data.get("position", ""),
            "company": candidate_data.get("company", ""),
            "department": candidate_data.get("department", ""),
            "bio": candidate_data.get("bio", ""),
            "skills": candidate_skills,
            "experience_years": candidate_data.get("experience_years", 0),
            "location": candidate_data.get("location", ""),
            "is_verified": candidate_data.get("is_verified", False),
            "created_at": candidate_data.get("created_at"),
            "updated_at": candidate_data.get("updated_at"),
            # Add customization preferences
            "target_role": matching_request.target_role,
            "target_company": matching_request.target_company,
            "priority_focus": matching_request.priority_focus,
            "experience_preference": matching_request.experience_level,
            "specific_skills_wanted": matching_request.specific_skills,
            "additional_requirements": matching_request.additional_requirements
        }
        
        # Build dynamic employee query based on preferences
        base_query = """
            SELECT * FROM users 
            WHERE role = 'employee' 
            AND is_active = TRUE
        """
        query_conditions = []
        query_params = []
        
        # Filter by target company if specified
        if matching_request.target_company:
            query_conditions.append("LOWER(company) LIKE LOWER(?)")
            query_params.append(f"%{matching_request.target_company}%")
        
        # Filter by industry preference if specified
        if matching_request.industry_preference:
            query_conditions.append("(LOWER(company) LIKE LOWER(?) OR LOWER(department) LIKE LOWER(?))")
            query_params.extend([f"%{matching_request.industry_preference}%", f"%{matching_request.industry_preference}%"])
        
        # Add experience level filtering
        if matching_request.experience_level != "any":
            if matching_request.experience_level == "junior":
                query_conditions.append("experience_years BETWEEN 1 AND 3")
            elif matching_request.experience_level == "senior":
                query_conditions.append("experience_years BETWEEN 4 AND 8")
            elif matching_request.experience_level == "executive":
                query_conditions.append("experience_years >= 8")
        
        # Build final query
        if query_conditions:
            base_query += " AND " + " AND ".join(query_conditions)
        
        # Order by priority focus
        if matching_request.priority_focus == "performance":
            base_query += " ORDER BY rating DESC, successful_referrals DESC"
        elif matching_request.priority_focus == "skills":
            base_query += " ORDER BY experience_years DESC, rating DESC"
        else:  # balanced or mentorship
            base_query += " ORDER BY rating DESC, total_referrals DESC, experience_years DESC"
        
        employee_records = DatabaseManager.execute_query(
            base_query, 
            params=query_params,
            fetch_all=True
        )
        
        if not employee_records:
            return CandidateMatchingResponse(
                success=False,
                matches=[],
                summary={"message": "No employees found matching your criteria"},
                total_evaluated=0,
                matching_quality="none",
                message="No employees match your specific requirements. Try adjusting your preferences."
            )
        
        # Prepare employee pool with parsed skills
        employee_pool = []
        for emp in employee_records:
            # Parse employee skills from JSON
            emp_skills = []
            if emp.get('skills'):
                try:
                    emp_skills = json.loads(emp['skills'])
                except (json.JSONDecodeError, TypeError):
                    emp_skills = []
            
            # Additional filtering based on specific skills if provided
            if matching_request.specific_skills:
                skill_keywords = [s.strip().lower() for s in matching_request.specific_skills.split(',')]
                emp_skills_lower = [s.lower() for s in emp_skills]
                
                # Check if employee has any of the requested skills
                has_matching_skills = any(
                    any(keyword in emp_skill for emp_skill in emp_skills_lower)
                    for keyword in skill_keywords
                )
                
                if not has_matching_skills:
                    continue  # Skip this employee if no matching skills
            
            employee_profile = {
                "id": emp["id"],
                "name": emp["name"],
                "email": emp["email"],
                "position": emp.get("position", ""),
                "company": emp.get("company", ""),
                "department": emp.get("department", ""),
                "bio": emp.get("bio", ""),
                "skills": emp_skills,
                "experience_years": emp.get("experience_years", 0),
                "location": emp.get("location", ""),
                "rating": emp.get("rating", 0.0),
                "total_referrals": emp.get("total_referrals", 0),
                "successful_referrals": emp.get("successful_referrals", 0),
                "is_verified": emp.get("is_verified", False),
                "is_active": emp.get("is_active", True),
                "created_at": emp.get("created_at"),
                "updated_at": emp.get("updated_at")
            }
            employee_pool.append(employee_profile)
        
        logger.info(f"Found {len(employee_pool)} employees matching customization criteria")
        
        # Initialize the sophisticated matching agent
        if not groq_client:
            raise HTTPException(
                status_code=503,
                detail="AI matching service temporarily unavailable"
            )
            
        matching_agent = CandidateMatchingAgent(groq_client)
        
        # Adjust matching weights based on priority focus
        if matching_request.priority_focus == "skills":
            matching_agent.matching_weights = {
                "skills_expertise": 0.50,  # Increased focus on skills
                "career_experience": 0.20,
                "performance_metrics": 0.15,
                "availability_engagement": 0.10,
                "bias_neutrality": 0.05,
            }
        elif matching_request.priority_focus == "performance":
            matching_agent.matching_weights = {
                "skills_expertise": 0.25,
                "career_experience": 0.20,
                "performance_metrics": 0.40,  # Increased focus on performance
                "availability_engagement": 0.10,
                "bias_neutrality": 0.05,
            }
        elif matching_request.priority_focus == "mentorship":
            matching_agent.matching_weights = {
                "skills_expertise": 0.30,
                "career_experience": 0.35,  # Increased focus on career relevance
                "performance_metrics": 0.20,
                "availability_engagement": 0.10,
                "bias_neutrality": 0.05,
            }
        # else: keep default balanced weights
        
        # Perform advanced matching with LLM reasoning and custom context
        matching_result = await matching_agent.match_candidate_with_employees(
            candidate_data=candidate_profile,
            employee_pool=employee_pool,
            target_company=matching_request.target_company,
            max_matches=matching_request.max_matches
        )
        
        if not matching_result.success:
            return CandidateMatchingResponse(
                success=False,
                matches=[],
                summary=matching_result.data.get("summary", {}),
                total_evaluated=matching_result.data.get("total_evaluated", 0),
                matching_quality="failed",
                message=matching_result.error or "Customized matching analysis failed"
            )
        
        # Format matches for response
        formatted_matches = []
        for match in matching_result.data.get("matches", []):
            # Extract LLM insights data properly
            llm_insights = match.get("llm_insights", {})
            
            formatted_match = MatchedEmployee(
                employee_id=match["employee_id"],
                employee_name=match["employee_name"],
                employee_position=match["employee_position"],
                employee_company=match["employee_company"],
                overall_score=match["overall_score"],
                confidence_level=match["confidence_level"],
                score_breakdown=match["score_breakdown"],
                match_reasoning=llm_insights.get("match_reasoning") if llm_insights else None,
                referral_success_prediction=llm_insights.get("referral_success_prediction") if llm_insights else None,
                actionable_insights=llm_insights.get("actionable_insights") if llm_insights else None
            )
            formatted_matches.append(formatted_match)
        
        logger.info(f"Successfully found {len(formatted_matches)} customized matches for candidate {candidate_id}")
        
        return CandidateMatchingResponse(
            success=True,
            matches=formatted_matches,
            summary=matching_result.data.get("summary", {}),
            total_evaluated=matching_result.data.get("total_evaluated", 0),
            matching_quality=matching_result.data.get("matching_quality", "moderate"),
            message=f"Found {len(formatted_matches)} employees matching your specific requirements"
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error in customized candidate matching: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Internal server error during customized matching: {str(e)}"
        )

@router.get("/cached-smart-matches", response_model=CandidateMatchingResponse)
@limiter.limit("20/minute")
async def get_cached_smart_matches(
    request: Request,
    current_user = Depends(get_current_user)
):
    """Get cached Smart Matching results for the current user"""
    try:
        candidate_id = current_user["id"]
        
        # Get cached smart matches
        cache_query = """
            SELECT matches_data, created_at, updated_at 
            FROM ai_match_cache 
            WHERE candidate_id = ? AND match_type = 'smart'
            ORDER BY updated_at DESC 
            LIMIT 1
        """
        
        cached_results = DatabaseManager.execute_query(
            cache_query, 
            params=[candidate_id], 
            fetch_all=True
        )
        
        cached_result = cached_results[0] if cached_results else None
        
        if not cached_result:
            return CandidateMatchingResponse(
                success=False,
                matches=[],
                summary={"message": "No cached matches found"},
                total_evaluated=0,
                matching_quality="none",
                message="No cached Smart Matches found. Click 'Generate Matches' to create new ones."
            )
        
        # Parse cached matches data
        import json
        matches_data = json.loads(cached_result['matches_data'])
        
        # Convert to MatchedEmployee objects
        formatted_matches = []
        for match in matches_data.get('matches', []):
            formatted_match = MatchedEmployee(
                employee_id=match["employee_id"],
                employee_name=match["employee_name"],
                employee_position=match["employee_position"],
                employee_company=match["employee_company"],
                overall_score=match["overall_score"],
                confidence_level=match["confidence_level"],
                score_breakdown=match["score_breakdown"],
                match_reasoning=match.get("match_reasoning"),
                referral_success_prediction=match.get("referral_success_prediction"),
                actionable_insights=match.get("actionable_insights")
            )
            formatted_matches.append(formatted_match)
        
        return CandidateMatchingResponse(
            success=True,
            matches=formatted_matches,
            summary=matches_data.get('summary', {}),
            total_evaluated=matches_data.get('total_evaluated', 0),
            matching_quality=matches_data.get('matching_quality', 'cached'),
            message=f"Loaded {len(formatted_matches)} cached Smart Matches from {cached_result['updated_at']}"
        )
        
    except Exception as e:
        logger.error(f"Error retrieving cached smart matches: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to retrieve cached matches: {str(e)}"
        )

@router.post("/cache-smart-matches")
@limiter.limit("10/minute")
async def cache_smart_matches(
    request: Request,
    matches_data: Dict[str, Any],
    current_user = Depends(get_current_user)
):
    """Cache Smart Matching results for the current user"""
    try:
        candidate_id = current_user["id"]
        
        # Convert matches data to JSON string
        import json
        matches_json = json.dumps(matches_data)
        
        # Insert or update cached matches
        cache_query = """
            INSERT OR REPLACE INTO ai_match_cache 
            (candidate_id, match_type, matches_data, preferences_hash, updated_at)
            VALUES (?, 'smart', ?, NULL, CURRENT_TIMESTAMP)
        """
        
        DatabaseManager.execute_query(
            cache_query,
            params=[candidate_id, matches_json]
        )
        
        logger.info(f"Cached Smart Matches for candidate {candidate_id}")
        
        return {"success": True, "message": "Smart Matches cached successfully"}
        
    except Exception as e:
        logger.error(f"Error caching smart matches: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to cache matches: {str(e)}"
        )

@router.get("/cached-customized-matches", response_model=CandidateMatchingResponse)
@limiter.limit("20/minute")
async def get_cached_customized_matches(
    request: Request,
    preferences_hash: str,
    current_user = Depends(get_current_user)
):
    """Get cached Customized Matching results for specific preferences"""
    try:
        candidate_id = current_user["id"]
        
        # Get cached customized matches for specific preferences
        cache_query = """
            SELECT matches_data, created_at, updated_at 
            FROM ai_match_cache 
            WHERE candidate_id = ? AND match_type = 'customized' AND preferences_hash = ?
            ORDER BY updated_at DESC 
            LIMIT 1
        """
        
        cached_results = DatabaseManager.execute_query(
            cache_query, 
            params=[candidate_id, preferences_hash], 
            fetch_all=True
        )
        
        cached_result = cached_results[0] if cached_results else None
        
        if not cached_result:
            return CandidateMatchingResponse(
                success=False,
                matches=[],
                summary={"message": "No cached matches found for these preferences"},
                total_evaluated=0,
                matching_quality="none",
                message="No cached matches found for these preferences."
            )
        
        # Parse cached matches data
        import json
        matches_data = json.loads(cached_result['matches_data'])
        
        # Convert to MatchedEmployee objects
        formatted_matches = []
        for match in matches_data.get('matches', []):
            formatted_match = MatchedEmployee(
                employee_id=match["employee_id"],
                employee_name=match["employee_name"],
                employee_position=match["employee_position"],
                employee_company=match["employee_company"],
                overall_score=match["overall_score"],
                confidence_level=match["confidence_level"],
                score_breakdown=match["score_breakdown"],
                match_reasoning=match.get("match_reasoning"),
                referral_success_prediction=match.get("referral_success_prediction"),
                actionable_insights=match.get("actionable_insights")
            )
            formatted_matches.append(formatted_match)
        
        return CandidateMatchingResponse(
            success=True,
            matches=formatted_matches,
            summary=matches_data.get('summary', {}),
            total_evaluated=matches_data.get('total_evaluated', 0),
            matching_quality=matches_data.get('matching_quality', 'cached'),
            message=f"Loaded {len(formatted_matches)} cached Customized Matches"
        )
        
    except Exception as e:
        logger.error(f"Error retrieving cached customized matches: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to retrieve cached matches: {str(e)}"
        )

@router.post("/cache-customized-matches")
@limiter.limit("10/minute")
async def cache_customized_matches(
    request: Request,
    cache_data: Dict[str, Any],  # Should include 'matches_data' and 'preferences_hash'
    current_user = Depends(get_current_user)
):
    """Cache Customized Matching results with preferences hash"""
    try:
        candidate_id = current_user["id"]
        matches_data = cache_data.get('matches_data')
        preferences_hash = cache_data.get('preferences_hash')
        
        if not matches_data or not preferences_hash:
            raise HTTPException(status_code=400, detail="matches_data and preferences_hash are required")
        
        # Convert matches data to JSON string
        import json
        matches_json = json.dumps(matches_data)
        
        # Insert or update cached matches
        cache_query = """
            INSERT OR REPLACE INTO ai_match_cache 
            (candidate_id, match_type, matches_data, preferences_hash, updated_at)
            VALUES (?, 'customized', ?, ?, CURRENT_TIMESTAMP)
        """
        
        DatabaseManager.execute_query(
            cache_query,
            params=[candidate_id, matches_json, preferences_hash]
        )
        
        logger.info(f"Cached Customized Matches for candidate {candidate_id} with preferences hash {preferences_hash}")
        
        return {"success": True, "message": "Customized Matches cached successfully"}
        
    except Exception as e:
        logger.error(f"Error caching customized matches: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to cache matches: {str(e)}"
        )

@router.post("/rejection-feedback", response_model=RejectionFeedbackAnalysisResponse)
async def analyze_rejection_feedback(
    request: RejectionFeedbackAnalysisRequest,
    current_user: dict = Depends(get_current_user)
):
    """
    Analyze rejection feedback from employee to provide comprehensive insights to candidate
    """
    try:
        # Create a cache key for this analysis
        cache_key = hashlib.md5(
            f"{request.feedback_text}_{request.position}_{request.company}".encode()
        ).hexdigest()
        
        # Check cache first
        cached_result = DatabaseManager.execute_query(
            "SELECT result_data FROM ai_analysis_cache WHERE content_hash = ? AND analysis_type = 'rejection_feedback'",
            (cache_key,),
            fetch_one=True
        )
        
        if cached_result:
            cached_data = json.loads(cached_result["result_data"])
            return RejectionFeedbackAnalysisResponse(**cached_data)
        
        # Prepare the AI prompt
        prompt = f"""
        You are an expert career counselor analyzing rejection feedback for a job referral. 
        Provide a comprehensive, constructive analysis that helps the candidate understand the rejection and improve.
        
        **Rejection Feedback:** {request.feedback_text}
        **Position:** {request.position}
        **Company:** {request.company}
        **Candidate Background:** {request.candidate_background or "Not provided"}
        
        Please analyze this rejection feedback and provide:
        
        1. **Primary Reasons**: Extract 3-5 main reasons for rejection from the feedback
        2. **Sentiment**: Overall sentiment (positive, neutral, negative, constructive)
        3. **Tone**: Communication tone (professional, harsh, encouraging, dismissive, etc.)
        4. **Constructiveness Score**: Rate 0-1 how constructive the feedback is
        5. **Improvement Suggestions**: Specific actionable advice based on the feedback
        6. **Potential Additional Reasons**: What the employee might not have mentioned but could be factors
        7. **Follow-up Questions**: Questions the candidate could ask to get more clarity
        8. **Overall Analysis**: A summary paragraph of the situation
        9. **Candidate Action Items**: Specific next steps the candidate should take
        
        Be empathetic but honest, and focus on growth opportunities.
        
        Respond in JSON format matching this structure:
        {{
            "primary_reasons": ["reason1", "reason2", "reason3"],
            "sentiment": "constructive",
            "tone": "professional",
            "constructiveness_score": 0.8,
            "improvement_suggestions": ["suggestion1", "suggestion2"],
            "potential_additional_reasons": ["reason1", "reason2"],
            "follow_up_questions": ["question1", "question2"],
            "overall_analysis": "summary paragraph",
            "candidate_action_items": ["action1", "action2"]
        }}
        """
        
        # Call OpenAI API
        response = await asyncio.to_thread(
            openai.ChatCompletion.create,
            model="gpt-4",
            messages=[
                {"role": "system", "content": "You are an expert career counselor and feedback analyst. Provide detailed, constructive analysis of rejection feedback."},
                {"role": "user", "content": prompt}
            ],
            temperature=0.3,
            max_tokens=2000
        )
        
        # Parse the response
        analysis_text = response.choices[0].message.content.strip()
        
        # Clean and parse JSON
        if analysis_text.startswith("```json"):
            analysis_text = analysis_text[7:]
        if analysis_text.endswith("```"):
            analysis_text = analysis_text[:-3]
            
        analysis_data = json.loads(analysis_text.strip())
        
        # Cache the result
        DatabaseManager.execute_query(
            """INSERT INTO ai_analysis_cache 
               (content_hash, analysis_type, input_data, result_data, confidence_score) 
               VALUES (?, ?, ?, ?, ?)""",
            (
                cache_key,
                "rejection_feedback",
                json.dumps(request.dict()),
                json.dumps(analysis_data),
                analysis_data.get("constructiveness_score", 0.5)
            )
        )
        
        return RejectionFeedbackAnalysisResponse(**analysis_data)
        
    except json.JSONDecodeError as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to parse AI response: {str(e)}"
        )
    except Exception as e:
        print(f"Error in rejection feedback analysis: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to analyze rejection feedback: {str(e)}"
        )