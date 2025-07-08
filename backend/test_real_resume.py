#!/usr/bin/env python3

import requests
import json

# Real resume text from the user
resume_text = """
Ronit Virwani
rvvirwani@binghamton.edu | www.linkedin.com/in/ronitvirwani | https://github.com/ronitvirwani03

EDUCATION
Binghamton University, State University of New York                                    December 2025
GPA: 3.9/4
Master of Science in Computer Science

MIT ADT University, India                                                              May 2024
Bachelor of Technology in Information Technology

WORK EXPERIENCE
AKOS, AI/LLM Engineer | Scottsdale, AZ                                                May 2025 – Present
• Shipped LLM-powered AI solutions from prototype to production, designed retrieval-augmented pipelines (RAG) and domain-specific fine-tuning using LangChain/LangGraph and FastAPI, supporting 99.9% uptime and sub-second (<500ms) API responses
• Built scalable data pipelines that process and embed 30K+ records of structured and unstructured data monthly, with access to ChromaDB Cloud (Beta Version for Developers) for fast semantic search and integrating serverless, scale-to-zero architecture, reducing compute costs by 35% and improving throughput
• Implemented retrieval-augmented generation (RAG) and cache-augmented generation(CAG) to boost answer accuracy by 20%, minimize hallucinations and deliver reliable, real-time outputs
• Managed the full AI workflow—from microservice API orchestration, CICD, and monitoring to incident resolution—while working closely with product and business experts to deliver several revenue-heavy features from prototype to release

Techpeek, AI Engineer | Bangalore, India                                              February 2024 – August 2024
• Spearheaded the creation and launch of a Legal AI platform, significantly enhancing legal services
• Implemented retrieval-augmented generation (RAG) using LangChain and integrated open-source Large Language Models
• Designed and optimized search algorithms for legal document retrieval, improving search accuracy and relevance
• Managed & created MilvusDB and ChromaDB collections for 10K+ documents, reducing query latency
• Integrated an ML model for legal case predictions with LLM reasoning, raising accuracy to 85 %
• Created robust Docker configurations and simplified Nginx settings, achieving 99.9% system uptime
• Ensured backend security with FastAPI, cutting the unauthorized access

RESEARCH EXPERIENCE
SUNY Binghamton University, Graduate Research Assistant | Binghamton, NY             September 2024 – Present
• Advancing research in NLP and ML, focusing on the Tip-of-the-Tongue phenomenon, utilizing TensorFlow and PyTorch to achieve improvement in word retrieval accuracy
• Developed a legal-text retrieval pipeline using SentenceTransformer embeddings and ChromaDB to search 570+ Indian Penal Code sections, introduced a mask-aware snippet extractor and MiniLM cross-encoder reranker, raising Top-1 accuracy to 60% and Top-2 to 80% on held-out queries, with automated evaluation and custom data cleaning

TECHNICAL SKILLS
Languages : Java, Python, C++, Javascript, Rust
Machine Learning Platforms : AWS Sagemaker, AWS Bedrock
Cloud Technologies : AWS (S3, EC2, Lambda), Docker, GCP
Web Development : React Js, Next Js, Svelte, LangChain, FastAPI
Libraries and Frameworks : TensorFlow, PyTorch, Scikit-learn, Pandas, NumPy, Matplotlib, Seaborn, Plotly, Streamlit, Gradio, Hugging Face, Transformers, OpenAI, Anthropic, Cohere, Mistral, Groq, Ollama, LangChain, LangGraph, LangSmith, Weights & Biases, MLflow, DVC, Apache Airflow, Kafka, Redis, Celery, FastAPI, Flask, Django, Express.js, Node.js, React, Next.js, Vue.js, Svelte, TailwindCSS, Bootstrap, Material-UI, Ant Design, Chakra UI, Mantine, Shadcn/ui, Framer Motion, GSAP, Three.js, D3.js, Chart.js, Plotly, Bokeh, Altair, Seaborn, Matplotlib, Pandas, NumPy, SciPy, Scikit-learn, XGBoost, LightGBM, CatBoost, Optuna, Hyperopt, Ray Tune, MLflow, Weights & Biases, TensorBoard, Neptune, Comet, Wandb, DVC, Git, GitHub, GitLab, Bitbucket, Jenkins, GitHub Actions, GitLab CI/CD, CircleCI, Travis CI, Docker, Kubernetes, Helm, Terraform, Ansible, Vagrant, VirtualBox, VMware, AWS, GCP, Azure, DigitalOcean, Heroku, Vercel, Netlify, Railway, Render, Fly.io, PlanetScale, Supabase, Firebase, MongoDB, PostgreSQL, MySQL, SQLite, Redis, Elasticsearch, Neo4j, InfluxDB, TimescaleDB, ClickHouse, Apache Cassandra, Apache Kafka, RabbitMQ, Apache Pulsar, Apache Storm, Apache Flink, Apache Spark, Apache Hadoop, Apache Hive, Apache Pig, Apache Sqoop, Apache Flume, Apache NiFi, Apache Airflow, Prefect, Dagster, Luigi, Argo Workflows, Kubeflow, MLflow, Metaflow, ZenML, Kedro, DVC, ClearML, Neptune, Weights & Biases, TensorBoard, Comet, Wandb, Optuna, Hyperopt, Ray Tune, Scikit-Optimize, SMAC, Hyperband, BOHB, Population Based Training, Evolutionary Strategies, Genetic Algorithms, Particle Swarm Optimization, Simulated Annealing, Tabu Search, Ant Colony Optimization, Differential Evolution, CMA-ES, Bayesian Optimization, Gaussian Processes, Tree-structured Parzen Estimator, Sequential Model-based Algorithm Configuration, Hyperopt-sklearn, Auto-sklearn, TPOT, H2O AutoML, AutoKeras, Auto-PyTorch, NAS-Bench, DARTS, ENAS, Progressive DARTS, PC-DARTS, DrNAS, GDAS, SNAS, FairNAS, Once-for-All, BigNAS, AttentiveNAS, DNA, ProxylessNAS, MobileNets, EfficientNets, RegNet, ResNets, DenseNets, Inception, Xception, VGG, AlexNet, LeNet, BERT, GPT, T5, RoBERTa, ELECTRA, DeBERTa, ALBERT, DistilBERT, MobileBERT, TinyBERT, FastBERT, StructBERT, SpanBERT, VideoBERT, VisualBERT, LayoutLM, MarkupLM, DialoGPT, BlenderBot, Meena, LaMDA, PaLM, Chinchilla, Gopher, Jurassic-1, GPT-J, GPT-NeoX, OPT, BLOOM, GLM, PanGu-α, CPM, Ernie, Wenxin, Baichuan, ChatGLM, Qwen, Baidu ERNIE, Alibaba Qwen, Tencent Hunyuan, ByteDance Doubao, SenseTime SenseNova, iFlytek Spark, 360 Zhinao, Minimax ABAB, Zhipu AI ChatGLM, Moonshot AI Kimi, Baichuan AI, MiniMax, 01.AI Yi, DeepSeek, Zhipu AI, Step AI, MiniMax, Moonshot AI, Baichuan AI, 01.AI, DeepSeek, Zhipu AI, Step AI, MiniMax, Moonshot AI, Baichuan AI, 01.AI, DeepSeek, Zhipu AI, Step AI
Databases : MySQL, MongoDB, ChromaDB, MilvusDB, Hadoop

PROJECT EXPERIENCE
ReferralInc | Bridging the gap between opportunity—with real-time job capture and real intelligence    March 2024 – Present
• Building a comprehensive AI SaaS platform, architecting and feedback visualization, and returning candidate-employee
• Implementing real-time data-driven insights and feedback visualization, and returning candidate-employee referral status tracking—solving a real problem of hiring bottlenecks with a modern, conversational user experience. Targeting 3+ faster placements and 40% higher engagement for users
• Developed a comprehensive end-to-end Consulting Team, On Demand                                      March 2025 – Present
• Built an end-to-end AI SaaS platform that brings virtual LLM-powered consultants to automate business analysis—engineered a multi-agent workflow (React, FastAPI, Python) simulating real teams to deliver tailored solutions, dynamic dashboards, and comprehensive business insights

Appliclient | Job Hunt... Supercharged                                                 May 2025 – Present
• Built Appliclient as the candidate-side selling to ReferralInc—with LLM workflows for real-time job capture, resume analysis, market intelligence, and application optimization. Designed an Excel-style dashboard to empower job seekers, completing the vision started with ReferralInc: Pre-launch, targeting 50+ users in year one.

ACHIEVEMENTS AND AWARDS
• Led Google Developers Program at MIT ADT University, selected among top 300 students in India.
• Won special recognition for outstanding academic performance and advanced to finals in 5 national hackathons in India.
"""

job_description = """
AKOS is a Data & Technology Studio that builds AI-driven applications and automation tools for various industries, including Manufacturing, Logistics, and FinTech. We are looking for MSc students with strong Python and Machine Learning skills to contribute as individual contributors on our internal, experimental AI projects. This is not a traditional internship; you will work on real challenges involving large language models (LLMs), NLP, data pipelines, and predictive analytics.

Responsibilities
Build and fine-tune LLM-based applications using LangChain, LangGraph, and similar technologies
Develop data pipelines for processing and analyzing structured and unstructured data
Implement retrieval-augmented generation (RAG) techniques for LLMs
Deploy ML models using cloud services and scalable APIs
Create data visualizations and dashboards for insights

What We're Looking For
Strong proficiency in Python, SQL, and ML libraries (e.g., TensorFlow, PyTorch, Scikit-learn)
Experience with LLMs, NLP, or RAG architectures
Hands-on work with data engineering, ETL workflows, and APIs
Familiarity with cloud platforms like AWS or GCP
Bonus: Experience with Go, TypeScript, React, Node.js, or DevOps tools like Docker & Kubernetes
"""

def authenticate():
    """Authenticate and get token"""
    try:
        response = requests.post("http://localhost:8000/auth/login", json={
            "email": "ronitvirwani1@gmail.com",
            "password": "12345678"
        })
        
        if response.status_code == 200:
            return response.json()["access_token"]
        else:
            print(f"❌ Authentication failed: {response.status_code}")
            return None
    except Exception as e:
        print(f"❌ Authentication error: {str(e)}")
        return None

def test_real_resume_analysis():
    """Test comprehensive analysis with real resume and job description"""
    
    # Get authentication token
    auth_token = authenticate()
    if not auth_token:
        print("Cannot proceed without authentication")
        return None
    
    url = 'http://localhost:8000/api/ai/comprehensive-analysis'
    headers = {
        'Content-Type': 'application/json',
        'Authorization': f'Bearer {auth_token}'
    }

    data = {
        'resume_text': resume_text,
        'job_description': job_description
    }

    try:
        print("🔍 Testing comprehensive analysis with real resume...")
        response = requests.post(url, headers=headers, json=data, timeout=120)
        print(f'Status Code: {response.status_code}')
        
        if response.status_code == 200:
            result = response.json()
            if result.get('success'):
                # Extract resume analysis scores
                resume_data = result['data']['agent_results']['resume']['data']
                print(f'\n=== RESUME ANALYSIS SCORES ===')
                print(f'Overall Score: {resume_data.get("overall_score", "N/A")}%')
                
                ats_data = resume_data.get('ats_compatibility', {})
                print(f'ATS Score: {ats_data.get("score", "N/A")}%')
                print(f'Keyword Density: {ats_data.get("keyword_density", "N/A")}%')
                print(f'Format Compatibility: {ats_data.get("format_compatibility", "N/A")}%')
                print(f'Section Headers: {ats_data.get("section_headers", "N/A")}%')
                
                content_quality = resume_data.get('content_quality', {})
                print(f'\nReadability: {content_quality.get("readability_score", "N/A")}%')
                print(f'Professional Language: {content_quality.get("professional_language", "N/A")}%')
                print(f'Action Verbs: {content_quality.get("action_verbs_count", "N/A")}')
                print(f'Quantifiable Achievements: {content_quality.get("quantifiable_achievements", "N/A")}')
                
                print(f'\n=== STRENGTHS ===')
                for strength in resume_data.get('strengths', []):
                    print(f'• {strength}')
                    
                print(f'\n=== WEAKNESSES ===')
                for weakness in resume_data.get('weaknesses', []):
                    print(f'• {weakness}')
                    
                # Check final assessment scores
                final_assessment = result['data']['final_assessment']['executive_summary']
                print(f'\n=== FINAL ASSESSMENT ===')
                print(f'Overall Assessment Score: {final_assessment.get("overall_score", "N/A")}%')
                print(f'Recommendation: {final_assessment.get("recommendation", "N/A")}')
                print(f'Overall Assessment: {final_assessment.get("overall_assessment", "N/A")}')
                
                return result
            else:
                print(f'Analysis failed: {result.get("error", "Unknown error")}')
                return None
        else:
            print(f'HTTP Error: {response.text}')
            return None
            
    except Exception as e:
        print(f'Request failed: {str(e)}')
        return None

if __name__ == "__main__":
    result = test_real_resume_analysis() 