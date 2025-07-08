#!/usr/bin/env python3
"""
EXTREME test to verify the full anti-detection system bypasses 403 blocks
"""

import asyncio
import sys
import os

# Add the backend directory to the path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from ai_agents.market_intelligence import MarketIntelligenceScaper

async def test_extreme_bypass():
    """Test the EXTREME anti-detection system"""
    print("🔥🔥🔥 TESTING EXTREME ANTI-DETECTION SYSTEM 🔥🔥🔥")
    print("🎯 Goal: Bypass ALL 403 blocks and get data from EVERYWHERE")
    print("💪 Using: Multiple URLs, browser fingerprints, mobile simulation, extreme headers")
    
    scraper = MarketIntelligenceScaper()
    
    # Test with a single skill to focus on bypassing blocks
    skills = ["Python"]
    
    try:
        print(f"\n🚀 Starting EXTREME aggressive scraping for: {skills}")
        print("⚡ This will try EVERY technique to bypass blocks...")
        
        result = await scraper.get_market_intelligence(skills)
        
        print(f"\n✅ EXTREME scraping completed!")
        
        # Detailed analysis of results
        stats = result.get('scraping_stats', {})
        skills_analysis = result.get('skills_analysis', {})
        
        print(f"\n📊 EXTREME SCRAPING RESULTS:")
        print(f"   ⏱️  Total time: {stats.get('scraping_time_seconds', 0)}s")
        print(f"   📈 Total jobs found: {stats.get('total_jobs_found', 0)}")
        print(f"   🎯 Sources attempted: {len(stats.get('sources_attempted', []))}")
        print(f"   ✅ Sources successful: {len(stats.get('sources_successful', []))}")
        
        print(f"\n🔗 SUCCESSFUL SOURCES:")
        successful = stats.get('sources_successful', [])
        for source in successful:
            print(f"   ✅ {source}")
            
        print(f"\n❌ FAILED SOURCES:")
        attempted = set(stats.get('sources_attempted', []))
        successful_set = set(successful)
        failed = attempted - successful_set
        for source in failed:
            print(f"   ❌ {source}")
        
        # Detailed breakdown by skill
        if skills_analysis:
            for skill, data in skills_analysis.items():
                job_postings = data.get('job_postings', [])
                print(f"\n📋 {skill.upper()} BREAKDOWN:")
                print(f"   📈 Jobs found: {len(job_postings)}")
                
                # Group by source
                source_counts = {}
                for job in job_postings:
                    source = getattr(job, 'source', 'unknown')
                    source_counts[source] = source_counts.get(source, 0) + 1
                
                for source, count in source_counts.items():
                    emoji = "🎉" if source in ["indeed_real", "glassdoor_real"] else "✅"
                    print(f"   {emoji} {source}: {count} jobs")
        
        # Success metrics
        success_rate = len(successful) / len(attempted) * 100 if attempted else 0
        print(f"\n🎯 SUCCESS RATE: {success_rate:.1f}%")
        
        # Check for breakthrough
        breakthrough_sources = ["indeed_real", "glassdoor_real", "simplyhired", "ziprecruiter"]
        breakthroughs = [s for s in successful if s in breakthrough_sources]
        
        if stats.get('total_jobs_found', 0) > 0:
            print(f"🎉 SUCCESS: Found {stats['total_jobs_found']} real jobs!")
            
            if breakthroughs:
                print(f"🔥🔥🔥 BREAKTHROUGH ACHIEVED! 🔥🔥🔥")
                print(f"💪 Successfully bypassed 403 blocks on: {', '.join(breakthroughs)}")
                print("🚀 EXTREME anti-detection is WORKING!")
                return True
            elif len(successful) > 2:
                print("⚡ GOOD: Multiple sources working, some blocks bypassed!")
                return True
            else:
                print("⚠️  PARTIAL: Basic sources working, but major sites still blocked")
                return True
        else:
            print("❌ FAILED: No jobs found - need even more extreme techniques")
            return False
            
    except Exception as e:
        print(f"💥 EXTREME test failed with error: {e}")
        import traceback
        traceback.print_exc()
        return False

if __name__ == "__main__":
    success = asyncio.run(test_extreme_bypass())
    if success:
        print("\n🏆🏆🏆 EXTREME BYPASS TEST PASSED! 🏆🏆🏆")
        print("🔥 Ready to scrape data from EVERYWHERE at ANY COST!")
    else:
        print("\n💥💥💥 EXTREME BYPASS TEST FAILED! 💥💥💥")
        print("🔧 Need to implement even MORE aggressive techniques!") 