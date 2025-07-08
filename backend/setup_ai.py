#!/usr/bin/env python3
"""
Setup script for AI dependencies
Downloads required NLTK data and spaCy models
"""

import os
import sys
import subprocess

def download_nltk_data():
    """Download required NLTK data"""
    try:
        import nltk
        print("Downloading NLTK data...")
        
        # Download required NLTK data
        nltk.download('punkt', quiet=True)
        nltk.download('stopwords', quiet=True)
        nltk.download('wordnet', quiet=True)
        nltk.download('averaged_perceptron_tagger', quiet=True)
        nltk.download('punkt_tab', quiet=True)
        
        print("✓ NLTK data downloaded successfully")
        return True
    except Exception as e:
        print(f"✗ Error downloading NLTK data: {e}")
        return False

def download_spacy_model():
    """Download spaCy English model"""
    try:
        print("Downloading spaCy English model...")
        
        # Try to download the model
        result = subprocess.run([
            sys.executable, '-m', 'spacy', 'download', 'en_core_web_sm'
        ], capture_output=True, text=True)
        
        if result.returncode == 0:
            print("✓ spaCy model downloaded successfully")
            return True
        else:
            print(f"✗ Error downloading spaCy model: {result.stderr}")
            return False
    except Exception as e:
        print(f"✗ Error downloading spaCy model: {e}")
        return False

def verify_installations():
    """Verify that all AI dependencies are working"""
    try:
        # Test NLTK
        import nltk
        from nltk.tokenize import word_tokenize
        word_tokenize("Test sentence")
        print("✓ NLTK working correctly")
        
        # Test spaCy
        import spacy
        try:
            nlp = spacy.load("en_core_web_sm")
            doc = nlp("Test sentence")
            print("✓ spaCy working correctly")
        except OSError:
            print("⚠ spaCy model not found, but spaCy is installed")
        
        # Test other dependencies
        import chromadb
        print("✓ ChromaDB available")
        
        import groq
        print("✓ Groq client available")
        
        from sentence_transformers import SentenceTransformer
        print("✓ Sentence Transformers available")
        
        return True
    except Exception as e:
        print(f"✗ Error verifying installations: {e}")
        return False

def main():
    """Main setup function"""
    print("Setting up AI dependencies for ReferralInc...")
    print("=" * 50)
    
    success = True
    
    # Download NLTK data
    if not download_nltk_data():
        success = False
    
    # Download spaCy model
    if not download_spacy_model():
        success = False
    
    print("\n" + "=" * 50)
    print("Verifying installations...")
    
    # Verify installations
    if not verify_installations():
        success = False
    
    print("\n" + "=" * 50)
    if success:
        print("✓ AI setup completed successfully!")
        print("You can now run the backend with AI analysis features.")
    else:
        print("⚠ Some components failed to install properly.")
        print("The basic functionality should still work, but some AI features may be limited.")
    
    return success

if __name__ == "__main__":
    main() 