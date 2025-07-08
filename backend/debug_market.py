#!/usr/bin/env python3

import asyncio
import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from services.market_intelligence_service import MarketIntelligenceService

async def debug_market_intelligence():
    """Debug market intelligence service"""
    print("🔍 Debugging Market Intelligence Service...")
    
    try:
        service = MarketIntelligenceService()
        
        # Test with cache disabled
        result = await service.get_market_analysis_for_user(
            user_id=14, 
            skills=['Python', 'JavaScript'], 
            cache_duration_hours=0  # Force fresh data
        )
        
        print(f"✅ Service Response:")
        print(f"   Success: {result.get('success')}")
        print(f"   Keys: {list(result.keys())}")
        
        if 'data' in result:
            data = result['data']
            print(f"   Data freshness: {data.get('data_freshness')}")
            print(f"   Scraped at: {data.get('scraped_at')}")
            print(f"   Sources used: {data.get('sources_used')}")
            print(f"   Scraping stats: {data.get('scraping_stats')}")
            print(f"   Skills analysis: {len(data.get('skills_analysis', {}))}")
        else:
            print("   ❌ No 'data' key in response")
            
        return True
        
    except Exception as e:
        print(f"❌ Error: {e}")
        import traceback
        traceback.print_exc()
        return False

if __name__ == "__main__":
    success = asyncio.run(debug_market_intelligence())
    sys.exit(0 if success else 1) 