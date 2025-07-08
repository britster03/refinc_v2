"""
Base Agent Class for AI Agents

Provides common functionality and interfaces for all AI agents in the system.
"""

import asyncio
import logging
import re
from abc import ABC, abstractmethod
from typing import Any, Dict, List, Optional, Union
from datetime import datetime
from groq import Groq
from pydantic import BaseModel, Field
import json
import time
from tenacity import retry, stop_after_attempt, wait_exponential

logger = logging.getLogger(__name__)

class AgentResponse(BaseModel):
    """Standard response format for all agents"""
    success: bool
    data: Optional[Dict[str, Any]] = None
    error: Optional[str] = None
    confidence: float = Field(ge=0.0, le=1.0)
    processing_time: float
    agent_name: str
    timestamp: datetime = Field(default_factory=datetime.utcnow)

class BaseAgent(ABC):
    """
    Base class for all AI agents providing common functionality
    """
    
    def __init__(
        self,
        groq_client: Groq,
        model_name: str = "meta-llama/llama-4-scout-17b-16e-instruct",
        max_tokens: int = 4000,
        temperature: float = 0.1
    ):
        self.groq_client = groq_client
        self.model_name = model_name
        self.max_tokens = max_tokens
        self.temperature = temperature
        self.agent_name = self.__class__.__name__
        
    @retry(
        stop=stop_after_attempt(3),
        wait=wait_exponential(multiplier=1, min=4, max=10)
    )
    async def _make_llm_call(
        self,
        messages: List[Dict[str, str]],
        temperature: Optional[float] = None,
        max_tokens: Optional[int] = None
    ) -> str:
        """
        Make a call to the LLM with retry logic
        """
        try:
            response = self.groq_client.chat.completions.create(
                model=self.model_name,
                messages=messages,
                temperature=temperature or self.temperature,
                max_tokens=max_tokens or self.max_tokens,
                top_p=0.9,
                stream=False
            )
            return response.choices[0].message.content
        except Exception as e:
            logger.error(f"LLM call failed for {self.agent_name}: {str(e)}")
            raise
    
    def _create_system_prompt(self, context: Dict[str, Any]) -> str:
        """
        Create a system prompt for the agent
        Override in subclasses for specific behavior
        """
        return f"""You are {self.agent_name}, an expert AI assistant specializing in resume analysis and job matching.
        
Context: {json.dumps(context, indent=2)}

Provide accurate, detailed, and actionable insights based on the given information.
Always respond in valid JSON format when requested."""
    
    def _parse_json_response(self, response: str) -> Dict[str, Any]:
        """
        Parse JSON response from LLM with error handling
        """
        try:
            # Clean the response
            response = response.strip()
            
            # Handle markdown code blocks
            if "```json" in response:
                # Extract JSON from markdown code block with json label
                start_idx = response.find("```json") + 7
                end_idx = response.find("```", start_idx)
                if end_idx != -1:
                    response = response[start_idx:end_idx].strip()
                else:
                    # If no closing ```, take everything after ```json
                    response = response[start_idx:].strip()
            elif "```" in response:
                # Handle generic code blocks (common case where LLM uses ``` without json label)
                lines = response.split('\n')
                start_line = -1
                end_line = -1
                
                for i, line in enumerate(lines):
                    if line.strip() == "```" and start_line == -1:
                        start_line = i + 1
                    elif line.strip() == "```" and start_line != -1:
                        end_line = i
                        break
                
                if start_line != -1 and end_line != -1:
                    response = '\n'.join(lines[start_line:end_line]).strip()
                elif start_line != -1:
                    # Only opening ```, take everything after
                    response = '\n'.join(lines[start_line:]).strip()
            elif response.startswith("```") and response.endswith("```"):
                # Handle simple case
                response = response[3:-3].strip()
            
            # Remove any leading/trailing whitespace and newlines
            response = response.strip()
            
            # Try to parse JSON directly first
            try:
                return json.loads(response)
            except json.JSONDecodeError:
                # If direct parsing fails, try to fix common JSON issues
                response = self._fix_json_issues(response)
                return json.loads(response)
            
        except json.JSONDecodeError as e:
            logger.error(f"Failed to parse JSON response: {str(e)}")
            logger.error(f"Raw response: {response}")
            raise ValueError(f"Invalid JSON response from {self.agent_name}")
    
    def _fix_json_issues(self, json_str: str) -> str:
        """
        Fix common JSON issues caused by LLM responses
        """
        # Find strings with unescaped newlines and fix them
        def fix_string_newlines(match):
            content = match.group(1)
            # Replace unescaped newlines with escaped newlines
            fixed_content = content.replace('\n', '\\n').replace('\r', '\\r')
            return f'"{fixed_content}"'
        
        # Pattern to match strings that may contain unescaped newlines
        # This is a simplified approach - looks for strings that span multiple lines
        pattern = r'"([^"]*(?:\n[^"]*)*)"'
        json_str = re.sub(pattern, fix_string_newlines, json_str, flags=re.MULTILINE)
        
        # Fix trailing commas
        json_str = re.sub(r',(\s*[}\]])', r'\1', json_str)
        
        # Fix double quotes in strings (basic approach)
        json_str = re.sub(r'([^\\])""', r'\1"', json_str)
        
        return json_str
    
    async def _process_with_timing(self, func, *args, **kwargs) -> AgentResponse:
        """
        Execute a function with timing and error handling
        """
        start_time = time.time()
        try:
            result = await func(*args, **kwargs)
            processing_time = time.time() - start_time
            
            return AgentResponse(
                success=True,
                data=result,
                confidence=self._calculate_confidence(result),
                processing_time=processing_time,
                agent_name=self.agent_name
            )
        except Exception as e:
            processing_time = time.time() - start_time
            logger.error(f"Error in {self.agent_name}: {str(e)}")
            
            return AgentResponse(
                success=False,
                error=str(e),
                confidence=0.0,
                processing_time=processing_time,
                agent_name=self.agent_name
            )
    
    def _calculate_confidence(self, result: Dict[str, Any]) -> float:
        """
        Calculate confidence score for the result
        Override in subclasses for specific confidence calculations
        """
        # Default confidence calculation
        if not result:
            return 0.0
        
        # Basic confidence based on completeness of data
        total_fields = len(result)
        filled_fields = sum(1 for v in result.values() if v is not None and v != "")
        
        return min(filled_fields / total_fields if total_fields > 0 else 0.0, 1.0)
    
    @abstractmethod
    async def process(self, input_data: Dict[str, Any]) -> AgentResponse:
        """
        Main processing method for the agent
        Must be implemented by subclasses
        """
        pass
    
    def get_agent_info(self) -> Dict[str, Any]:
        """
        Get information about the agent
        """
        return {
            "name": self.agent_name,
            "model": self.model_name,
            "max_tokens": self.max_tokens,
            "temperature": self.temperature
        } 