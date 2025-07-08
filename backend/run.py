#!/usr/bin/env python3
"""
Development server runner for ReferralInc API
"""

import uvicorn
import os
from pathlib import Path
from dotenv import load_dotenv

if __name__ == "__main__":
    # Ensure we're in the backend directory
    backend_dir = Path(__file__).parent
    os.chdir(backend_dir)
    
    # Load environment variables from .env file
    load_dotenv()
    
    # Verify critical environment variables are loaded
    if os.getenv('GROQ_API_KEY'):
        print(f"✅ GROQ_API_KEY loaded successfully")
    else:
        print("❌ GROQ_API_KEY not found in environment variables")
    
    # Run the server
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        reload_dirs=["./"],
        log_level="info"
    ) 