"""
Vector Store Manager for Resume Analysis

Handles ChromaDB operations for storing and retrieving resume embeddings
for similarity search and matching operations.
"""

import logging
import asyncio
from typing import Dict, List, Optional, Any, Tuple
import chromadb
from chromadb.config import Settings
from sentence_transformers import SentenceTransformer
import numpy as np
from datetime import datetime
import hashlib
import json
import os

logger = logging.getLogger(__name__)

class VectorStoreManager:
    """
    Manages ChromaDB vector store for resume and job description embeddings
    """
    
    def __init__(
        self,
        persist_directory: str = "./chroma_db",
        embedding_model: str = "all-MiniLM-L6-v2",
        collection_name: str = "resumes"
    ):
        self.persist_directory = persist_directory
        self.embedding_model_name = embedding_model
        self.collection_name = collection_name
        
        # Critical mass strategy - Realistic approach
        self.minimum_resumes_required = 1000  # Critical mass threshold
        self.current_resume_count = 0
        self.vector_operations_enabled = False
        
        # Initialize ChromaDB client
        self.client = chromadb.PersistentClient(
            path=persist_directory,
            settings=Settings(
                anonymized_telemetry=False,
                allow_reset=True
            )
        )
        
        # Initialize embedding model
        self.embedding_model = SentenceTransformer(embedding_model)
        
        # Get or create collection
        self.collection = self._get_or_create_collection()
        
        # Check vector readiness
        asyncio.create_task(self.check_vector_readiness())
        
        logger.info(f"VectorStoreManager initialized with collection: {collection_name}")
    
    def _get_or_create_collection(self):
        """Get existing collection or create new one"""
        try:
            return self.client.get_collection(name=self.collection_name)
        except Exception:
            return self.client.create_collection(
                name=self.collection_name,
                metadata={"description": "Resume and job description embeddings"}
            )
    
    async def check_vector_readiness(self):
        """Only enable vector operations when we have enough real data"""
        try:
            self.current_resume_count = await self.get_resume_count()
            
            if self.current_resume_count >= self.minimum_resumes_required:
                self.vector_operations_enabled = True
                logger.info(f"Vector operations enabled - {self.current_resume_count} resumes available")
                return True
            else:
                self.vector_operations_enabled = False
                logger.info(f"Vector operations disabled - need {self.minimum_resumes_required - self.current_resume_count} more resumes")
                return False
        except Exception as e:
            logger.error(f"Error checking vector readiness: {str(e)}")
            self.vector_operations_enabled = False
            return False
    
    async def get_resume_count(self) -> int:
        """Get count of resumes in the database"""
        try:
            stats = await self.get_collection_stats()
            # Count only resume documents (not job descriptions)
            resume_count = 0
            if 'count' in stats:
                # For now, assume all documents are resumes
                # In production, you'd filter by metadata type
                resume_count = stats['count']
            return resume_count
        except Exception as e:
            logger.error(f"Error getting resume count: {str(e)}")
            return 0
    
    async def provide_general_insights(self, query: str) -> Dict[str, Any]:
        """Provide general insights when vector analysis isn't available"""
        return {
            "message": "Competitive analysis will be available once we have more user data",
            "alternative_insights": {
                "focus": "Individual assessment and market trends",
                "available_features": [
                    "Skills analysis and recommendations",
                    "Resume quality assessment", 
                    "Market demand insights",
                    "Personalized career roadmap"
                ],
                "coming_soon": [
                    "Competitive benchmarking",
                    "Salary comparison with similar profiles",
                    "Industry-specific insights"
                ]
            },
            "progress": {
                "current_users": self.current_resume_count,
                "target": self.minimum_resumes_required,
                "percentage": round((self.current_resume_count / self.minimum_resumes_required) * 100, 1)
            }
        }
    
    def _generate_document_id(self, content: str, doc_type: str) -> str:
        """Generate unique document ID based on content hash"""
        content_hash = hashlib.md5(content.encode()).hexdigest()
        timestamp = datetime.utcnow().isoformat()
        return f"{doc_type}_{content_hash}_{timestamp}"
    
    def _create_embeddings(self, texts: List[str]) -> List[List[float]]:
        """Create embeddings for given texts"""
        try:
            embeddings = self.embedding_model.encode(texts, convert_to_tensor=False)
            return embeddings.tolist()
        except Exception as e:
            logger.error(f"Error creating embeddings: {str(e)}")
            raise
    
    async def store_resume(
        self,
        resume_text: str,
        metadata: Dict[str, Any],
        user_id: Optional[str] = None
    ) -> str:
        """
        Store resume in vector database
        
        Args:
            resume_text: Full resume text
            metadata: Additional metadata (skills, experience, etc.)
            user_id: Optional user ID for ownership
            
        Returns:
            Document ID of stored resume
        """
        try:
            # Generate document ID
            doc_id = self._generate_document_id(resume_text, "resume")
            
            # Create embedding
            embedding = self._create_embeddings([resume_text])[0]
            
            # Prepare metadata (filter out None values)
            full_metadata = {
                "type": "resume",
                "user_id": user_id or "unknown",
                "created_at": datetime.utcnow().isoformat(),
                "text_length": len(resume_text),
                **metadata
            }
            
            # Filter out None values and convert unsupported types for ChromaDB
            filtered_metadata = {}
            for k, v in full_metadata.items():
                if v is not None:
                    if isinstance(v, (str, int, float, bool)):
                        filtered_metadata[k] = v
                    elif isinstance(v, list):
                        # Convert lists to comma-separated strings
                        filtered_metadata[k] = ','.join(str(item) for item in v)
                    else:
                        # Convert other types to string
                        filtered_metadata[k] = str(v)
            full_metadata = filtered_metadata
            
            # Store in ChromaDB
            self.collection.add(
                embeddings=[embedding],
                documents=[resume_text],
                metadatas=[full_metadata],
                ids=[doc_id]
            )
            
            logger.info(f"Resume stored with ID: {doc_id}")
            return doc_id
            
        except Exception as e:
            logger.error(f"Error storing resume: {str(e)}")
            raise
    
    async def store_job_description(
        self,
        job_text: str,
        metadata: Dict[str, Any],
        job_id: Optional[str] = None
    ) -> str:
        """
        Store job description in vector database
        
        Args:
            job_text: Full job description text
            metadata: Additional metadata (requirements, company, etc.)
            job_id: Optional job ID
            
        Returns:
            Document ID of stored job description
        """
        try:
            # Generate document ID
            doc_id = self._generate_document_id(job_text, "job")
            
            # Create embedding
            embedding = self._create_embeddings([job_text])[0]
            
            # Prepare metadata (filter out None values)
            full_metadata = {
                "type": "job_description",
                "job_id": job_id or "unknown",
                "created_at": datetime.utcnow().isoformat(),
                "text_length": len(job_text),
                **metadata
            }
            
            # Filter out None values and convert unsupported types for ChromaDB
            filtered_metadata = {}
            for k, v in full_metadata.items():
                if v is not None:
                    if isinstance(v, (str, int, float, bool)):
                        filtered_metadata[k] = v
                    elif isinstance(v, list):
                        # Convert lists to comma-separated strings
                        filtered_metadata[k] = ','.join(str(item) for item in v)
                    else:
                        # Convert other types to string
                        filtered_metadata[k] = str(v)
            full_metadata = filtered_metadata
            
            # Store in ChromaDB
            self.collection.add(
                embeddings=[embedding],
                documents=[job_text],
                metadatas=[full_metadata],
                ids=[doc_id]
            )
            
            logger.info(f"Job description stored with ID: {doc_id}")
            return doc_id
            
        except Exception as e:
            logger.error(f"Error storing job description: {str(e)}")
            raise
    
    async def find_similar_resumes(
        self,
        query_text: str,
        n_results: int = 10,
        filter_metadata: Optional[Dict[str, Any]] = None
    ) -> List[Dict[str, Any]]:
        """
        Find similar resumes based on query text
        
        Args:
            query_text: Text to search for (job description or resume)
            n_results: Number of results to return
            filter_metadata: Optional metadata filters
            
        Returns:
            List of similar resumes with metadata and similarity scores
        """
        try:
            # Create query embedding
            query_embedding = self._create_embeddings([query_text])[0]
            
            # Prepare where clause for filtering
            where_clause = {"type": "resume"}
            if filter_metadata:
                where_clause.update(filter_metadata)
            
            # Query ChromaDB
            results = self.collection.query(
                query_embeddings=[query_embedding],
                n_results=n_results,
                where=where_clause,
                include=["documents", "metadatas", "distances"]
            )
            
            # Format results
            formatted_results = []
            for i in range(len(results["ids"][0])):
                formatted_results.append({
                    "id": results["ids"][0][i],
                    "document": results["documents"][0][i],
                    "metadata": results["metadatas"][0][i],
                    "similarity_score": 1 - results["distances"][0][i],  # Convert distance to similarity
                    "distance": results["distances"][0][i]
                })
            
            return formatted_results
            
        except Exception as e:
            logger.error(f"Error finding similar resumes: {str(e)}")
            raise
    
    async def find_similar_jobs(
        self,
        resume_text: str,
        n_results: int = 10,
        filter_metadata: Optional[Dict[str, Any]] = None
    ) -> List[Dict[str, Any]]:
        """
        Find similar job descriptions based on resume text
        
        Args:
            resume_text: Resume text to match against jobs
            n_results: Number of results to return
            filter_metadata: Optional metadata filters
            
        Returns:
            List of similar job descriptions with metadata and similarity scores
        """
        try:
            # Create query embedding
            query_embedding = self._create_embeddings([resume_text])[0]
            
            # Prepare where clause for filtering
            where_clause = {"type": "job_description"}
            if filter_metadata:
                where_clause.update(filter_metadata)
            
            # Query ChromaDB
            results = self.collection.query(
                query_embeddings=[query_embedding],
                n_results=n_results,
                where=where_clause,
                include=["documents", "metadatas", "distances"]
            )
            
            # Format results
            formatted_results = []
            for i in range(len(results["ids"][0])):
                formatted_results.append({
                    "id": results["ids"][0][i],
                    "document": results["documents"][0][i],
                    "metadata": results["metadatas"][0][i],
                    "similarity_score": 1 - results["distances"][0][i],
                    "distance": results["distances"][0][i]
                })
            
            return formatted_results
            
        except Exception as e:
            logger.error(f"Error finding similar jobs: {str(e)}")
            raise
    
    async def get_resume_by_id(self, doc_id: str) -> Optional[Dict[str, Any]]:
        """Get resume by document ID"""
        try:
            results = self.collection.get(
                ids=[doc_id],
                include=["documents", "metadatas"]
            )
            
            if results["ids"]:
                return {
                    "id": results["ids"][0],
                    "document": results["documents"][0],
                    "metadata": results["metadatas"][0]
                }
            return None
            
        except Exception as e:
            logger.error(f"Error getting resume by ID: {str(e)}")
            return None
    
    async def delete_resume(self, doc_id: str) -> bool:
        """Delete resume by document ID"""
        try:
            self.collection.delete(ids=[doc_id])
            logger.info(f"Resume deleted: {doc_id}")
            return True
        except Exception as e:
            logger.error(f"Error deleting resume: {str(e)}")
            return False
    
    async def get_collection_stats(self) -> Dict[str, Any]:
        """Get statistics about the collection"""
        try:
            count = self.collection.count()
            
            # Get sample of documents to analyze
            sample_results = self.collection.get(
                limit=min(100, count),
                include=["metadatas"]
            )
            
            # Analyze metadata
            resume_count = sum(1 for meta in sample_results["metadatas"] if meta.get("type") == "resume")
            job_count = sum(1 for meta in sample_results["metadatas"] if meta.get("type") == "job_description")
            
            return {
                "total_documents": count,
                "estimated_resumes": int(resume_count * count / len(sample_results["metadatas"])) if sample_results["metadatas"] else 0,
                "estimated_jobs": int(job_count * count / len(sample_results["metadatas"])) if sample_results["metadatas"] else 0,
                "embedding_model": self.embedding_model_name,
                "collection_name": self.collection_name
            }
            
        except Exception as e:
            logger.error(f"Error getting collection stats: {str(e)}")
            return {"error": str(e)}
    
    async def similarity_search(
        self,
        query_text: str,
        k: int = 10,
        filter_metadata: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """
        Perform similarity search with graceful degradation when vector DB isn't ready
        
        Args:
            query_text: Text to search for similar documents
            k: Number of results to return
            filter_metadata: Optional metadata filters
            
        Returns:
            Dict with results or alternative insights when not ready
        """
        # Check if vector operations are enabled
        if not self.vector_operations_enabled:
            await self.check_vector_readiness()  # Re-check in case count changed
            
            if not self.vector_operations_enabled:
                return {
                    "enabled": False,
                    "message": "Similarity analysis will be available once we have more user data",
                    "alternative_insights": await self.provide_general_insights(query_text),
                    "results": []
                }
        
        # Normal vector operations when ready
        try:
            results = await self.find_similar_resumes(
                query_text=query_text,
                n_results=k,
                filter_metadata=filter_metadata
            )
            
            return {
                "enabled": True,
                "message": "Similarity analysis completed",
                "results": results,
                "total_resumes": self.current_resume_count
            }
        except Exception as e:
            logger.error(f"Similarity search failed: {str(e)}")
            return {
                "enabled": False,
                "message": "Similarity analysis temporarily unavailable",
                "alternative_insights": await self.provide_general_insights(query_text),
                "results": [],
                "error": str(e)
            }
    
    async def add_document(
        self,
        text: str,
        metadata: Dict[str, Any],
        doc_type: str = "resume"
    ) -> str:
        """
        Generic method to add a document to the vector store
        
        Args:
            text: Document text
            metadata: Document metadata
            doc_type: Type of document (resume or job_description)
            
        Returns:
            Document ID
        """
        if doc_type == "resume":
            return await self.store_resume(text, metadata)
        elif doc_type == "job_description":
            return await self.store_job_description(text, metadata)
        else:
            raise ValueError(f"Unsupported document type: {doc_type}")

    def reset_collection(self) -> bool:
        """Reset the entire collection (use with caution)"""
        try:
            self.client.delete_collection(name=self.collection_name)
            self.collection = self.client.create_collection(
                name=self.collection_name,
                metadata={"description": "Resume and job description embeddings"}
            )
            logger.warning(f"Collection {self.collection_name} has been reset")
            return True
        except Exception as e:
            logger.error(f"Error resetting collection: {str(e)}")
            return False 