import json
with open('backend/main.py', 'a', encoding='utf-8') as f:
    f.write('''

class ChatAgentRequest(BaseModel):
    message: str
    history: list = []
    context: dict = {}

@app.post("/api/chat-agent")
async def chat_agent(req: ChatAgentRequest):
    try:
        user_prompt = f"User Message: {req.message}"
        
        system_prompt = f\"\"\"You are Nova, an AI HR Coordinator. You process HR requests and execute actions.
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
Do NOT output markdown (no \\\json).\"\"\"
        
        result = await run_llm_fallback(system_prompt, user_prompt)
        return result
        
    except Exception as e:
        print("Chat Agent Error:", e)
        raise HTTPException(status_code=500, detail=str(e))
'''
    )
