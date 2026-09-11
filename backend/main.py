from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import os
import httpx
import json
from dotenv import load_dotenv

load_dotenv()

app = FastAPI(title="HireIQ AI Backend")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

CEREBRAS_API_KEY = os.getenv("CEREBRAS_API_KEY")
CEREBRAS_URL = "https://api.cerebras.ai/v1/chat/completions"
MODEL = "qwen-3.8-27b"

class ResumeParseRequest(BaseModel):
    resumeText: str
    targetRole: str

class QuestionRequest(BaseModel):
    jobRole: str
    candidateSkills: str = ""
    candidateSummary: str = ""

@app.get("/")
def read_root():
    return {"message": "Welcome to HireIQ FastAPI Backend"}

@app.get("/health")
def health_check():
    return {"status": "ok"}

@app.post("/api/parse-resume")
async def parse_resume(req: ResumeParseRequest):
    if not CEREBRAS_API_KEY:
        raise HTTPException(status_code=500, detail="CEREBRAS_API_KEY is not set in backend .env")
        
    prompt = f"""You are an expert technical recruiter and HR AI assistant. 
Your task is to strictly evaluate this resume against the requirements for the specific role: "{req.targetRole}".

CRITICAL SCORING INSTRUCTIONS:
- Calculate "match_score" (0 to 100) based ONLY on how well the candidate's skills, career interest, and experience align with the "{req.targetRole}" role.
- STRICT PENALTY FOR CAREER MISALIGNMENT: If the candidate's primary interest, objective, or dominant experience points toward a different field (e.g. AI/Machine Learning when the role is Full Stack), the match_score MUST be below 40.
- Heavily penalize if the candidate's core skills are irrelevant to "{req.targetRole}".
- If the resume is for a completely different profession, the match_score MUST be below 20.
- **EXPERIENCE CALCULATION RULE**: Count ONLY actual professional work experience, internships, or full-time jobs. DO NOT count the duration of their university degree (e.g. BS CS 2020-2024) as work experience. If they are a fresh graduate with no real jobs, their `experience_years` MUST be 0.

Return ONLY raw valid JSON matching exactly this structure. DO NOT use markdown formatting like ```json. DO NOT add conversational text:
{{
  "name": "Candidate's full name",
  "email": "Email address",
  "phone": "Phone number",
  "github_username": "GitHub username or null",
  "education": "Brief string of degrees/universities",
  "projects": "Brief string of key projects",
  "skills": ["Skill1", "Skill2", "Skill3"],
  "experience_years": 5,
  "match_score": 85,
  "summary": "1-sentence summary of relevance to the {req.targetRole} role."
}}

Resume Text:
{req.resumeText}"""

    async with httpx.AsyncClient() as client:
        try:
            res = await client.post(
                CEREBRAS_URL,
                headers={"Authorization": f"Bearer {CEREBRAS_API_KEY}"},
                json={
                    "model": MODEL,
                    "temperature": 0.0,
                    "messages": [
                        {"role": "system", "content": "You extract structured data from resumes. You output raw valid JSON only. No markdown, no prefixes."},
                        {"role": "user", "content": prompt}
                    ]
                },
                timeout=30.0
            )
            res.raise_for_status()
            data = res.json()
            content = data["choices"][0]["message"]["content"]
            
            content = content.replace("```json", "").replace("```", "").strip()
            start = content.find("{")
            end = content.rfind("}")
            if start != -1 and end != -1:
                content = content[start:end+1]
                
            return json.loads(content)
        except Exception as e:
            print("Cerebras Parse Error:", e)
            raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/generate-questions")
async def generate_questions(req: QuestionRequest):
    try:
        from langchain_community.chat_models import ChatOllama
        from langchain.prompts import PromptTemplate
        from langchain_core.output_parsers import JsonOutputParser
        
        # We assume local Ollama is running on default port
        llm = ChatOllama(model="llama3.2:3b", temperature=0.7)
        
        template = """You are an expert technical interviewer.
I need 5 technical interview questions and their concise answers for a candidate applying for the "{job_role}" role.

Candidate's Background Summary: {summary}
Candidate's Skills: {skills}

Generate questions that are highly relevant to their specific skills and background. 
If their skills are empty, just ask general questions for the {job_role} role.

Return ONLY raw valid JSON matching exactly this structure. DO NOT use markdown formatting like ```json:
[
  {{
    "question": "The interview question",
    "answer": "The concise, correct technical answer"
  }}
]"""
        
        prompt = PromptTemplate(
            template=template,
            input_variables=["job_role", "summary", "skills"]
        )
        
        parser = JsonOutputParser()
        chain = prompt | llm | parser
        
        result = chain.invoke({
            "job_role": req.jobRole,
            "summary": req.candidateSummary or "No summary available",
            "skills": req.candidateSkills or "No specific skills listed"
        })
        
        return result

    except Exception as e:
        print("Ollama QA Error:", e)
        raise HTTPException(status_code=500, detail=f"Ollama Error: Make sure Ollama is running! {str(e)}")
