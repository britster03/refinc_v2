"""
Market Intelligence Service

Production-ready service layer for market intelligence operations
Integrates web scraping, database caching, and privacy-compliant data management
"""

import json
import logging
import hashlib
import asyncio
from typing import Dict, List, Optional, Any
from datetime import datetime, timedelta
from dataclasses import asdict

from ai_agents.market_intelligence import MarketIntelligenceManager, MarketIntelligenceScaper
from database import DatabaseManager

logger = logging.getLogger(__name__)

class MarketIntelligenceService:
    """
    High-level service for market intelligence operations with database integration
    """
    
    def __init__(self, redis_url: str = "redis://localhost:6379"):
        self.market_manager = MarketIntelligenceManager(redis_url)
        self.scraper = MarketIntelligenceScaper(redis_url)
        
    async def get_market_analysis_for_user(
        self, 
        user_id: int, 
        skills: List[str], 
        include_salary_data: bool = True,
        cache_duration_hours: int = 24
    ) -> Dict[str, Any]:
        """
        Get comprehensive market analysis for a user with privacy compliance
        """
        try:
            # Check user consent for market analysis
            if not self._check_user_consent(user_id, 'market_analysis'):
                return self._get_limited_market_analysis(skills)
            
            # Generate cache key
            skills_hash = self._generate_skills_hash(skills)
            cache_key = f"market_analysis:{skills_hash}"
            
            # Check database cache first (only if cache_duration_hours > 0)
            if cache_duration_hours > 0:
                cached_data = self._get_cached_market_data(cache_key)
                if cached_data and self._is_cache_valid(cached_data, cache_duration_hours):
                    logger.info(f"Returning cached market analysis for user {user_id}")
                    return self._format_market_response(cached_data['data'])
            else:
                logger.info(f"Cache bypassed - generating fresh market analysis for user {user_id}")
            
            # Get fresh market analysis
            logger.info(f"Generating fresh market analysis for user {user_id}")
            market_analysis = await self.market_manager.get_comprehensive_market_analysis(skills)
            
            # Store in database cache
            self._cache_market_data(cache_key, skills_hash, market_analysis, cache_duration_hours)
            
            # Update skill demand metrics
            await self._update_skill_metrics(market_analysis)
            
            return self._format_market_response(market_analysis)
            
        except Exception as e:
            logger.error(f"Market analysis failed for user {user_id}: {e}")
            return self._get_fallback_market_analysis(skills)
    
    async def get_skill_demand_insights(self, skills: List[str]) -> Dict[str, Any]:
        """
        Get skill demand insights from cached metrics
        """
        try:
            insights = {}
            
            for skill in skills:
                skill_data = self._get_skill_metrics(skill)
                if skill_data:
                    insights[skill] = {
                        "demand_level": skill_data.get("demand_level", "unknown"),
                        "job_count": skill_data.get("job_count", 0),
                        "average_salary": skill_data.get("average_salary"),
                        "salary_range": {
                            "min": skill_data.get("salary_min"),
                            "max": skill_data.get("salary_max")
                        },
                        "growth_trend": skill_data.get("growth_trend", "stable"),
                        "confidence_score": skill_data.get("confidence_score", 0.0),
                        "last_updated": skill_data.get("last_updated")
                    }
                else:
                    insights[skill] = {
                        "demand_level": "unknown",
                        "job_count": 0,
                        "note": "Data not available - will be updated in next scraping cycle"
                    }
            
            return {
                "skill_insights": insights,
                "summary": self._generate_skills_summary(insights),
                "recommendations": self._generate_skill_recommendations(insights)
            }
            
        except Exception as e:
            logger.error(f"Skill demand insights failed: {e}")
            return {"error": "Skill insights temporarily unavailable"}
    
    async def refresh_market_data(self, skills: List[str], force_refresh: bool = False) -> Dict[str, Any]:
        """
        Force refresh market data for specific skills
        """
        try:
            if force_refresh:
                # Clear existing cache
                skills_hash = self._generate_skills_hash(skills)
                cache_key = f"market_analysis:{skills_hash}"
                self._clear_cache_entry(cache_key)
            
            # Get fresh data
            market_analysis = await self.market_manager.get_comprehensive_market_analysis(skills)
            
            # Update cache and metrics
            skills_hash = self._generate_skills_hash(skills)
            cache_key = f"market_analysis:{skills_hash}"
            self._cache_market_data(cache_key, skills_hash, market_analysis, 24)
            await self._update_skill_metrics(market_analysis)
            
            return {
                "success": True,
                "message": f"Market data refreshed for {len(skills)} skills",
                "skills_updated": skills,
                "timestamp": datetime.utcnow().isoformat()
            }
            
        except Exception as e:
            logger.error(f"Market data refresh failed: {e}")
            return {"success": False, "error": str(e)}
    
    def get_market_intelligence_stats(self) -> Dict[str, Any]:
        """
        Get statistics about market intelligence data
        """
        try:
            # Get cache statistics
            cache_stats = self._get_cache_statistics()
            
            # Get skill metrics statistics
            skill_stats = self._get_skill_metrics_statistics()
            
            return {
                "cache_statistics": cache_stats,
                "skill_metrics": skill_stats,
                "data_freshness": self._assess_data_freshness(),
                "system_health": "operational"
            }
            
        except Exception as e:
            logger.error(f"Failed to get market intelligence stats: {e}")
            return {"error": "Statistics temporarily unavailable"}
    
    # Privacy and Consent Methods
    def _check_user_consent(self, user_id: int, consent_type: str) -> bool:
        """Check if user has granted consent for market analysis"""
        try:
            query = """
                SELECT granted FROM user_consents 
                WHERE user_id = ? AND consent_type = ? AND granted = TRUE AND revoked_at IS NULL
            """
            result = DatabaseManager.execute_query(query, (user_id, consent_type), fetch_one=True)
            return result is not None
        except Exception as e:
            logger.error(f"Consent check failed for user {user_id}: {e}")
            return False
    
    def grant_user_consent(self, user_id: int, consent_type: str, ip_address: str = None, user_agent: str = None) -> bool:
        """Grant user consent for market analysis"""
        try:
            # Check if consent already exists
            existing_query = """
                SELECT id FROM user_consents 
                WHERE user_id = ? AND consent_type = ?
            """
            existing = DatabaseManager.execute_query(existing_query, (user_id, consent_type), fetch_one=True)
            
            if existing:
                # Update existing consent
                update_query = """
                    UPDATE user_consents 
                    SET granted = TRUE, granted_at = ?, revoked_at = NULL, 
                        ip_address = ?, user_agent = ?, updated_at = ?
                    WHERE user_id = ? AND consent_type = ?
                """
                DatabaseManager.execute_query(
                    update_query, 
                    (datetime.utcnow().isoformat(), ip_address, user_agent, 
                     datetime.utcnow().isoformat(), user_id, consent_type)
                )
            else:
                # Create new consent
                insert_query = """
                    INSERT INTO user_consents 
                    (user_id, consent_type, granted, granted_at, ip_address, user_agent)
                    VALUES (?, ?, TRUE, ?, ?, ?)
                """
                DatabaseManager.execute_query(
                    insert_query, 
                    (user_id, consent_type, datetime.utcnow().isoformat(), ip_address, user_agent)
                )
            
            logger.info(f"Consent granted for user {user_id}, type: {consent_type}")
            return True
            
        except Exception as e:
            logger.error(f"Failed to grant consent for user {user_id}: {e}")
            return False
    
    def revoke_user_consent(self, user_id: int, consent_type: str) -> bool:
        """Revoke user consent"""
        try:
            query = """
                UPDATE user_consents 
                SET granted = FALSE, revoked_at = ?, updated_at = ?
                WHERE user_id = ? AND consent_type = ?
            """
            DatabaseManager.execute_query(
                query, 
                (datetime.utcnow().isoformat(), datetime.utcnow().isoformat(), user_id, consent_type)
            )
            
            logger.info(f"Consent revoked for user {user_id}, type: {consent_type}")
            return True
            
        except Exception as e:
            logger.error(f"Failed to revoke consent for user {user_id}: {e}")
            return False
    
    # Database Cache Methods
    def _get_cached_market_data(self, cache_key: str) -> Optional[Dict[str, Any]]:
        """Get cached market data from database"""
        try:
            query = """
                SELECT * FROM market_intelligence_cache 
                WHERE cache_key = ? AND expires_at > ?
            """
            result = DatabaseManager.execute_query(
                query, 
                (cache_key, datetime.utcnow().isoformat()), 
                fetch_one=True
            )
            
            if result:
                result['data'] = json.loads(result['data'])
                if result.get('sources_used'):
                    result['sources_used'] = json.loads(result['sources_used'])
                return result
            
            return None
            
        except Exception as e:
            logger.error(f"Failed to get cached data for key {cache_key}: {e}")
            return None
    
    def _cache_market_data(self, cache_key: str, skills_hash: str, data: Dict[str, Any], duration_hours: int):
        """Cache market data in database"""
        try:
            expires_at = datetime.utcnow() + timedelta(hours=duration_hours)
            
            # Extract metadata
            job_count = 0
            salary_data_available = False
            sources_used = []
            
            if 'market_analysis' in data:
                market_analysis = data['market_analysis']
                if 'demand_analysis' in market_analysis:
                    job_count = market_analysis['demand_analysis'].get('total_jobs_analyzed', 0)
                if 'salary_insights' in market_analysis:
                    salary_data_available = 'overall_average' in market_analysis['salary_insights']
            
            if 'metadata' in data:
                sources_used = data['metadata'].get('data_sources', [])
            
            # Insert or update cache
            query = """
                INSERT OR REPLACE INTO market_intelligence_cache 
                (cache_key, skills_hash, data, expires_at, sources_used, job_count, salary_data_available)
                VALUES (?, ?, ?, ?, ?, ?, ?)
            """
            
            DatabaseManager.execute_query(
                query,
                (cache_key, skills_hash, json.dumps(data, default=str), expires_at.isoformat(),
                 json.dumps(sources_used), job_count, salary_data_available)
            )
            
            logger.info(f"Cached market data for key {cache_key}")
            
        except Exception as e:
            logger.error(f"Failed to cache market data: {e}")
    
    def _is_cache_valid(self, cached_data: Dict[str, Any], duration_hours: int) -> bool:
        """Check if cached data is still valid"""
        try:
            expires_at = datetime.fromisoformat(cached_data['expires_at'])
            return datetime.utcnow() < expires_at
        except Exception:
            return False
    
    def _clear_cache_entry(self, cache_key: str):
        """Clear specific cache entry"""
        try:
            query = "DELETE FROM market_intelligence_cache WHERE cache_key = ?"
            DatabaseManager.execute_query(query, (cache_key,))
            logger.info(f"Cleared cache entry: {cache_key}")
        except Exception as e:
            logger.error(f"Failed to clear cache entry {cache_key}: {e}")
    
    # Skill Metrics Methods
    async def _update_skill_metrics(self, market_analysis: Dict[str, Any]):
        """Update skill demand metrics in database"""
        try:
            if 'market_analysis' not in market_analysis:
                return
            
            skills_breakdown = market_analysis['market_analysis'].get('skills_breakdown', {})
            
            for skill, data in skills_breakdown.items():
                # Extract metrics
                demand_level = data.get('demand_level', 'low')  # Default to 'low' instead of 'unknown'
                
                # Ensure demand_level is valid for database constraint
                if demand_level not in ['high', 'medium', 'low']:
                    demand_level = 'low'  # Default fallback
                
                job_count = data.get('job_count', 0)
                average_salary = data.get('average_salary')
                trend = data.get('trend', 'stable')
                
                # Determine salary range (if available)
                salary_min = None
                salary_max = None
                if average_salary:
                    # Estimate range based on average (±20%)
                    salary_min = int(average_salary * 0.8)
                    salary_max = int(average_salary * 1.2)
                
                # Insert or update skill metrics
                query = """
                    INSERT OR REPLACE INTO skill_demand_metrics 
                    (skill_name, demand_level, job_count, average_salary, salary_min, salary_max, 
                     growth_trend, data_source, confidence_score, last_updated)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """
                
                DatabaseManager.execute_query(
                    query,
                    (skill, demand_level, job_count, average_salary, salary_min, salary_max,
                     trend, 'web_scraping', 0.85, datetime.utcnow().isoformat())
                )
            
            logger.info(f"Updated metrics for {len(skills_breakdown)} skills")
            
        except Exception as e:
            logger.error(f"Failed to update skill metrics: {e}")
    
    def _get_skill_metrics(self, skill_name: str) -> Optional[Dict[str, Any]]:
        """Get skill metrics from database"""
        try:
            query = """
                SELECT * FROM skill_demand_metrics 
                WHERE skill_name = ? 
                ORDER BY last_updated DESC 
                LIMIT 1
            """
            return DatabaseManager.execute_query(query, (skill_name,), fetch_one=True)
        except Exception as e:
            logger.error(f"Failed to get skill metrics for {skill_name}: {e}")
            return None
    
    # Utility Methods
    def _generate_skills_hash(self, skills: List[str]) -> str:
        """Generate hash for skills list"""
        skills_str = "|".join(sorted(skills))
        return hashlib.md5(skills_str.encode()).hexdigest()
    
    def _get_limited_market_analysis(self, skills: List[str]) -> Dict[str, Any]:
        """Provide limited analysis without user consent"""
        return {
            "market_analysis": {
                "consent_required": True,
                "message": "Full market analysis requires consent for data processing",
                "available_insights": {
                    "skills_count": len(skills),
                    "general_market_health": "stable",
                    "recommendation": "Grant consent for detailed market intelligence"
                }
            },
            "metadata": {
                "consent_status": "required",
                "data_sources": [],
                "analysis_timestamp": datetime.utcnow().isoformat()
            }
        }
    
    def _get_fallback_market_analysis(self, skills: List[str]) -> Dict[str, Any]:
        """Provide fallback analysis when market intelligence fails"""
        return {
            "market_analysis": {
                "status": "limited",
                "message": "Market intelligence temporarily unavailable",
                "skills_analyzed": skills,
                "general_insights": {
                    "market_health": "stable",
                    "recommendation": "Focus on skill development and resume optimization"
                }
            },
            "metadata": {
                "analysis_timestamp": datetime.utcnow().isoformat(),
                "data_sources": [],
                "fallback_mode": True
            }
        }
    
    def _format_market_response(self, market_analysis: Dict[str, Any]) -> Dict[str, Any]:
        """Format market analysis response for API"""
        return {
            "success": True,
            "data": market_analysis,  # Pass through the raw market analysis data
            "market_intelligence": market_analysis.get('market_analysis', {}),
            "insights": market_analysis.get('insights', {}),
            "metadata": market_analysis.get('metadata', {}),
            "timestamp": datetime.utcnow().isoformat()
        }
    
    def _generate_skills_summary(self, insights: Dict[str, Any]) -> Dict[str, Any]:
        """Generate summary of skills insights"""
        high_demand = [skill for skill, data in insights.items() if data.get('demand_level') == 'high']
        medium_demand = [skill for skill, data in insights.items() if data.get('demand_level') == 'medium']
        low_demand = [skill for skill, data in insights.items() if data.get('demand_level') == 'low']
        
        return {
            "high_demand_skills": high_demand,
            "medium_demand_skills": medium_demand,
            "low_demand_skills": low_demand,
            "total_skills_analyzed": len(insights),
            "market_position": "strong" if len(high_demand) >= 3 else "developing"
        }
    
    def _generate_skill_recommendations(self, insights: Dict[str, Any]) -> List[Dict[str, Any]]:
        """Generate recommendations based on skill insights"""
        recommendations = []
        
        high_demand = [skill for skill, data in insights.items() if data.get('demand_level') == 'high']
        rising_trends = [skill for skill, data in insights.items() if data.get('growth_trend') == 'rising']
        
        if high_demand:
            recommendations.append({
                "type": "focus_high_demand",
                "priority": "high",
                "title": "Leverage High-Demand Skills",
                "description": f"Emphasize {', '.join(high_demand[:3])} in your applications",
                "skills": high_demand[:3]
            })
        
        if rising_trends:
            recommendations.append({
                "type": "emerging_opportunities",
                "priority": "medium",
                "title": "Emerging Skill Opportunities",
                "description": f"Consider developing {', '.join(rising_trends[:2])} for future growth",
                "skills": rising_trends[:2]
            })
        
        return recommendations
    
    def _get_cache_statistics(self) -> Dict[str, Any]:
        """Get cache statistics"""
        try:
            query = """
                SELECT 
                    COUNT(*) as total_entries,
                    COUNT(CASE WHEN expires_at > ? THEN 1 END) as valid_entries,
                    AVG(job_count) as avg_job_count,
                    COUNT(CASE WHEN salary_data_available = TRUE THEN 1 END) as entries_with_salary
                FROM market_intelligence_cache
            """
            result = DatabaseManager.execute_query(
                query, 
                (datetime.utcnow().isoformat(),), 
                fetch_one=True
            )
            return result or {}
        except Exception as e:
            logger.error(f"Failed to get cache statistics: {e}")
            return {}
    
    def _get_skill_metrics_statistics(self) -> Dict[str, Any]:
        """Get skill metrics statistics"""
        try:
            query = """
                SELECT 
                    COUNT(*) as total_skills,
                    COUNT(CASE WHEN demand_level = 'high' THEN 1 END) as high_demand_skills,
                    COUNT(CASE WHEN demand_level = 'medium' THEN 1 END) as medium_demand_skills,
                    COUNT(CASE WHEN demand_level = 'low' THEN 1 END) as low_demand_skills,
                    AVG(average_salary) as avg_salary_across_skills,
                    COUNT(CASE WHEN growth_trend = 'rising' THEN 1 END) as rising_trend_skills
                FROM skill_demand_metrics
            """
            result = DatabaseManager.execute_query(query, fetch_one=True)
            return result or {}
        except Exception as e:
            logger.error(f"Failed to get skill metrics statistics: {e}")
            return {}
    
    def _assess_data_freshness(self) -> Dict[str, Any]:
        """Assess overall data freshness"""
        try:
            # Check cache freshness
            cache_query = """
                SELECT 
                    MIN(scraped_at) as oldest_cache,
                    MAX(scraped_at) as newest_cache,
                    COUNT(*) as total_cache_entries
                FROM market_intelligence_cache
                WHERE expires_at > ?
            """
            cache_result = DatabaseManager.execute_query(
                cache_query, 
                (datetime.utcnow().isoformat(),), 
                fetch_one=True
            )
            
            # Check skill metrics freshness
            metrics_query = """
                SELECT 
                    MIN(last_updated) as oldest_metric,
                    MAX(last_updated) as newest_metric,
                    COUNT(*) as total_metrics
                FROM skill_demand_metrics
            """
            metrics_result = DatabaseManager.execute_query(metrics_query, fetch_one=True)
            
            return {
                "cache_freshness": cache_result or {},
                "metrics_freshness": metrics_result or {},
                "overall_status": "fresh" if (cache_result and cache_result.get('total_cache_entries', 0) > 0) else "stale"
            }
            
        except Exception as e:
            logger.error(f"Failed to assess data freshness: {e}")
            return {"overall_status": "unknown"} 