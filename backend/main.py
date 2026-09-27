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
CEREBRAS_MODEL = "qwen-3.8-27b"

OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY")
OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions"
OPENROUTER_MODEL = "meta-llama/llama-3.1-8b-instruct"

GROQ_API_KEY = os.getenv("GROQ_API_KEY")
GROQ_URL = "https://api.groq.com/openai/v1/chat/completions"
GROQ_MODEL = "llama3-8b-8192"

class ResumeParseRequest(BaseModel):
    resumeText: str
    targetRole: str

class QuestionRequest(BaseModel):
    jobRole: str
    candidateSkills: str = ""
    candidateSummary: str = ""

class WhatsAppRequest(BaseModel):
    phone: str
    message: str

@app.get("/")
def read_root():
    return {"message": "Welcome to HireIQ FastAPI Backend"}

@app.get("/health")
def health_check():
    return {"status": "ok"}

@app.post("/api/send-whatsapp")
async def send_whatsapp(req: WhatsAppRequest):
    """
    Sends a WhatsApp message using the WAHA API running on localhost:3001
    """
    WAHA_URL = "http://localhost:3001/api/sendText"
    
    # Clean the phone number and format it for WhatsApp
    # e.g., 03353958839 -> 923353958839@c.us
    phone = req.phone.strip().replace("+", "").replace(" ", "").replace("-", "")
    
    # If it starts with 0 (local Pak number), replace 0 with 92
    if phone.startswith("0") and len(phone) == 11:
        phone = "92" + phone[1:]
    # If no country code but 10 digits, assume 92 (for 3353958839)
    elif len(phone) == 10 and phone.startswith("3"):
        phone = "92" + phone
        
    chat_id = f"{phone}@c.us"
    
    async with httpx.AsyncClient() as client:
        try:
            res = await client.post(
                WAHA_URL,
                headers={"X-Api-Key": "hireiq_secret_key"},
                json={
                    "session": "hireiq_session",
                    "chatId": chat_id,
                    "text": req.message
                },
                timeout=15.0
            )
            res.raise_for_status()
            return {"success": True, "chatId": chat_id, "message": "WhatsApp sent!"}
        except Exception as e:
            print("WAHA Error:", e)
            raise HTTPException(status_code=500, detail=f"Failed to send WhatsApp. Is WAHA running? Error: {str(e)}")

@app.get("/api/whatsapp/status")
async def get_wa_status():
    async with httpx.AsyncClient() as client:
        try:
            res = await client.get(
                "http://localhost:3001/api/sessions/hireiq_session",
                headers={"X-Api-Key": "hireiq_secret_key"},
                timeout=5.0
            )
            if res.status_code == 404:
                return {"status": "NOT_FOUND"}
            return res.json()
        except Exception as e:
            return {"status": "ERROR", "detail": str(e)}

@app.post("/api/whatsapp/start")
async def start_wa():
    async with httpx.AsyncClient() as client:
        try:
            await client.post("http://localhost:3001/api/sessions", json={"name": "hireiq_session"}, headers={"X-Api-Key": "hireiq_secret_key"})
            res = await client.post("http://localhost:3001/api/sessions/hireiq_session/start", headers={"X-Api-Key": "hireiq_secret_key"})
            return res.json()
        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/whatsapp/stop")
async def stop_wa():
    async with httpx.AsyncClient() as client:
        try:
            res = await client.post("http://localhost:3001/api/sessions/hireiq_session/stop", headers={"X-Api-Key": "hireiq_secret_key"})
            return res.json()
        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))

from fastapi.responses import Response

@app.get("/api/whatsapp/qr")
async def get_wa_qr():
    async with httpx.AsyncClient() as client:
        try:
            res = await client.get(
                "http://localhost:3001/api/hireiq_session/auth/qr?format=image",
                headers={"X-Api-Key": "hireiq_secret_key"},
                timeout=30.0
            )
            if res.status_code == 200:
                return Response(content=res.content, media_type="image/png")
            return Response(content=b"", status_code=res.status_code)
        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/parse-resume")
async def parse_resume(req: ResumeParseRequest):
    if not CEREBRAS_API_KEY and not OPENROUTER_API_KEY and not GROQ_API_KEY:
        raise HTTPException(status_code=500, detail="No API Keys configured for parsing resumes.")
        
    prompt = f"""You are an expert technical recruiter and HR AI assistant. 
Your task is to strictly evaluate this resume against the requirements for the specific role: "{req.targetRole}".

CRITICAL SCORING INSTRUCTIONS:
- Calculate "match_score" (0 to 100) based ONLY on how well the candidate's skills, career interest, and experience align with the "{req.targetRole}" role.

STRICT CAREER FIELD MATCHING RULES:
- First, determine the candidate's PRIMARY career field from their resume.
- If the candidate is a Student or Fresh Graduate (e.g., "Computer Science Student"), DO NOT instantly give a 0. Instead, evaluate their MATCH SCORE strictly based on their SKILLS, ACADEMIC PROJECTS, and GITHUB.
- If the candidate is a PROFESSIONAL whose primary career field is completely DIFFERENT from "{req.targetRole}", the match_score MUST be EXACTLY 0.
- Examples of MISMATCHES that MUST score exactly 0:
  * AI/ML Engineer applying for Full Stack Developer -> 0
  * Data Scientist applying for Frontend Developer -> 0
  * Backend Developer applying for AI Engineer -> 0
  * RAG/LLM specialist applying for Full Stack -> 0
- Only give high scores (70+) if the candidate's dominant skills AND projects directly match "{req.targetRole}".
- If skills partially overlap but career focus is different, cap at 40-50.

EXPERIENCE CALCULATION RULE (VERY STRICT):
- Count ONLY actual professional work experience: real jobs at companies, paid internships, or freelance work with clients.
- DO NOT count any of these as experience:
  * University/college degree duration (e.g., BS CS 2020-2024 is NOT 4 years experience)
  * Online courses, certifications, bootcamps
  * Academic projects or personal side projects
  * Study duration of any kind (1-year OS course, 2-year diploma, etc.)
- If the candidate is a fresh graduate with NO actual jobs/internships listed, experience_years MUST be 0.
- If they have one 3-month internship, experience_years should be 0.25, NOT rounded up.

PHONE/WHATSAPP EXTRACTION RULE:
- Extract the candidate's mobile/cell phone number from the resume.
- Look for numbers labeled "WhatsApp", "Mobile", "Cell", "Phone", or "Contact".
- For Pakistani numbers, they typically start with 03xx or +923xx.
- If multiple numbers exist, prefer the one labeled "WhatsApp" or "Mobile".
- Store this in the "whatsapp" field. If no phone number found, set to null.

Return ONLY raw valid JSON matching exactly this structure. DO NOT use markdown formatting like ```json. DO NOT add conversational text:
{{
  "name": "Candidate's full name",
  "email": "Email address",
  "phone": "Phone number or null",
  "whatsapp": "WhatsApp/Mobile number or null",
  "github_username": "GitHub username or null",
  "education": "Brief string of degrees/universities",
  "projects": "Brief string of key projects",
  "skills": ["Skill1", "Skill2", "Skill3"],
  "experience_years": 0,
  "career_field": "The candidate's primary career field (e.g. AI/ML Engineer, Full Stack Developer, etc.)",
  "match_score": 85,
  "summary": "1-sentence summary explaining WHY this score was given for the {req.targetRole} role, mentioning if there is a career field mismatch."
}}

Resume Text:
{req.resumeText}"""

    system_prompt = "You extract structured data from resumes. You output raw valid JSON only. No markdown, no prefixes."
    return await run_llm_fallback(system_prompt, prompt)

async def run_llm_fallback(system_prompt: str, user_prompt: str):
    async def call_api(url, key, model, headers_extra=None):
        headers = {"Authorization": f"Bearer {key}"}
        if headers_extra:
            headers.update(headers_extra)
            
        async with httpx.AsyncClient() as client:
            res = await client.post(
                url,
                headers=headers,
                json={
                    "model": model,
                    "temperature": 0.0,
                    "messages": [
                        {"role": "system", "content": system_prompt},
                        {"role": "user", "content": user_prompt}
                    ]
                },
                timeout=30.0
            )
            res.raise_for_status()
            data = res.json()
            content = data["choices"][0]["message"]["content"]
            
            content = content.replace("```json", "").replace("```", "").strip()
            
            # Support both dict and list JSON
            start_dict = content.find("{")
            end_dict = content.rfind("}")
            start_list = content.find("[")
            end_list = content.rfind("]")
            
            if start_dict != -1 and end_dict != -1 and (start_list == -1 or start_dict < start_list):
                content = content[start_dict:end_dict+1]
            elif start_list != -1 and end_list != -1:
                content = content[start_list:end_list+1]
                
            return json.loads(content)

    last_exception = None
    
    if CEREBRAS_API_KEY:
        try:
            return await call_api(CEREBRAS_URL, CEREBRAS_API_KEY, CEREBRAS_MODEL)
        except Exception as e:
            print("Cerebras Parse Error:", e)
            last_exception = e
            
    if OPENROUTER_API_KEY:
        try:
            headers_extra = {
                "HTTP-Referer": "http://localhost:3000",
                "X-Title": "HireIQ"
            }
            return await call_api(OPENROUTER_URL, OPENROUTER_API_KEY, OPENROUTER_MODEL, headers_extra)
        except Exception as e:
            print("OpenRouter Parse Error:", e)
            last_exception = e
            
    if GROQ_API_KEY:
        try:
            return await call_api(GROQ_URL, GROQ_API_KEY, GROQ_MODEL)
        except Exception as e:
            print("Groq Parse Error:", e)
            last_exception = e
            
    if last_exception:
        raise HTTPException(status_code=500, detail=str(last_exception))
    else:
        raise HTTPException(status_code=500, detail="No API Keys configured.")

@app.post("/api/generate-questions")
async def generate_questions(req: QuestionRequest):
    try:
        user_prompt = f"""I need 5 technical interview questions and their concise answers for a candidate applying for the "{req.jobRole}" role.

Candidate's Background Summary: {req.candidateSummary or "No summary available"}
Candidate's Skills: {req.candidateSkills or "No specific skills listed"}

Generate questions that are highly relevant to their specific skills and background. 
If their skills are empty, just ask general questions for the {req.jobRole} role."""

        system_prompt = """You are an expert technical interviewer.
Return ONLY raw valid JSON matching exactly this structure. DO NOT use markdown formatting like ```json.
[
  {
    "question": "The interview question",
    "answer": "The concise, correct technical answer"
  }
]"""
        
        result = await run_llm_fallback(system_prompt, user_prompt)
        return result
        
    except Exception as e:
        print("Generate Questions Error:", e)
        raise HTTPException(status_code=500, detail=str(e))


class ChatAgentRequest(BaseModel):
    message: str
    history: list = []
    context: dict = {}

@app.post("/api/chat-agent")
async def chat_agent(req: ChatAgentRequest):

    try:
        history_text = "\n".join([f"{m.get('role', 'user').upper()}: {m.get('content', '')}" for m in req.history[-6:]])
        user_prompt = f"Chat History:\n{history_text}\n\nCurrent User Message: {req.message}"
        
        system_prompt = f"""You are Nova, an AI HR Coordinator. You process HR requests and execute actions.

Context Data:
{json.dumps(req.context)}

Your job is to reply to the user naturally AND output an action if needed.
Valid actions: 
- "NONE": just chatting
- "SYNC_GMAIL": if user asks to check/scan new emails/CVs
- "SHOW_TOP_CANDIDATES": if user asks to show top/best candidates
- "SHORTLIST_CANDIDATE": if user asks to shortlist a specific candidate
- "SCHEDULE_INTERVIEW": if user asks to schedule an interview or set a meeting with a candidate
- "GET_STATS": if user asks how many passed/failed, or how many interviews are scheduled today.

If scheduling an interview, extract 'candidateName', 'date' (YYYY-MM-DD), 'time' (HH:MM), 'mode' (Virtual/Physical) into actionPayload. If they didn't specify, use logical defaults (tomorrow at 14:00, Virtual).
If shortlisting, extract 'candidateName' into actionPayload.

Return ONLY a raw valid JSON object matching exactly this structure:
{{
  "reply": "Your natural language response to the user",
  "action": "ACTION_NAME",
  "actionPayload": {{}} 
}}
Do NOT output markdown (no \\json)."""
        
        result = await run_llm_fallback(system_prompt, user_prompt)
        return result
        
    except Exception as e:
        print("Chat Agent Error:", e)
        raise HTTPException(status_code=500, detail=str(e))



