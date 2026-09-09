export const analyzeResumeText = async (resumeText, targetRole = "Software Developer") => {
  const GROQ_API_KEY = import.meta.env.VITE_GROQ_API_KEY;

  const prompt = `You are an expert technical recruiter and HR AI assistant. 
Your task is to strictly evaluate this resume against the requirements for the specific role: "${targetRole}".

CRITICAL SCORING INSTRUCTIONS:
- Calculate "match_score" (0 to 100) based ONLY on how well the candidate's skills, career interest, and experience align with the "${targetRole}" role.
- STRICT PENALTY FOR CAREER MISALIGNMENT: If the candidate's primary interest, objective, or dominant experience points toward a different field (e.g. AI/Machine Learning when the role is Full Stack, or vice versa), the match_score MUST be below 40, even if they have some overlapping basic skills (like Python or JS).
- Heavily penalize (lower score) if the candidate's core skills are irrelevant to "${targetRole}".
- If the resume is for a completely different profession, the match_score MUST be below 20.

Return ONLY raw valid JSON matching exactly this structure. DO NOT use markdown formatting like \`\`\`json. DO NOT add conversational text:
{
  "name": "Candidate's full name",
  "email": "Email address",
  "phone": "Phone number",
  "github_username": "GitHub username or null",
  "education": "Brief string of degrees/universities",
  "projects": "Brief string of key projects",
  "skills": ["Skill1", "Skill2", "Skill3"],
  "experience_years": 5,
  "match_score": 85,
  "summary": "1-sentence summary of relevance to the ${targetRole} role."
}

Resume Text:
${resumeText}`;

  const callAI = async (endpoint, apiKey, model) => {
    const res = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: model,
        temperature: 0.0,
        seed: 42,
        messages: [
          { role: "system", content: "You extract structured data from resumes. You output raw valid JSON only. No markdown, no prefixes." },
          { role: "user", content: prompt }
        ]
      }),
    });
    if (!res.ok) {
      const err = await res.text();
      throw new Error(err);
    }
    return res.json();
  };

  try {
    const data = await callAI("https://api.groq.com/openai/v1/chat/completions", GROQ_API_KEY, "openai/gpt-oss-20b");
    
    let jsonString = data.choices[0].message.content;
    
    if (jsonString.includes('```')) {
      jsonString = jsonString.replace(/```json/g, '').replace(/```/g, '').trim();
    }
    
    const firstBrace = jsonString.indexOf('{');
    const lastBrace = jsonString.lastIndexOf('}');
    if (firstBrace !== -1 && lastBrace !== -1) {
      jsonString = jsonString.substring(firstBrace, lastBrace + 1);
    }
    
    jsonString = jsonString.replace(/,\s*([}\]])/g, '$1');
    
    try {
      return JSON.parse(jsonString);
    } catch (parseError) {
      console.warn("JSON Parse failed for AI output. Using Regex fallback. Raw output:", jsonString);
      
      const scoreMatch = jsonString.match(/"match_score"\s*:\s*(\d+)/);
      const nameMatch = jsonString.match(/"name"\s*:\s*"([^"]+)"/);
      const sumMatch = jsonString.match(/"summary"\s*:\s*"([^"]+)"/);
      const expMatch = jsonString.match(/"experience_years"\s*:\s*(\d+)/);
      
      return {
        name: nameMatch ? nameMatch[1] : "Format Error",
        match_score: scoreMatch ? parseInt(scoreMatch[1]) : 0,
        skills: ["Regex Fallback Active"],
        summary: sumMatch ? sumMatch[1] : "The AI model provided broken formatting, but score was recovered.",
        experience_years: expMatch ? parseInt(expMatch[1]) : null
      };
    }
  } catch (error) {
    console.error("AI Analysis Error:", error);
    throw new Error(error.message);
  }
};

export const generateInterviewQuestions = async (jobRole) => {
  const GROQ_API_KEY = import.meta.env.VITE_GROQ_API_KEY;

  const prompt = `You are an expert technical interviewer. I am an HR recruiter who doesn't know much about technical fields.
Generate 5 technical interview questions and their easy-to-understand answers for a "${jobRole}" role. 
The questions should evaluate their core knowledge. Keep the answers concise so I can quickly read them before the interview.

Return ONLY raw valid JSON matching exactly this structure. DO NOT use markdown formatting like \`\`\`json:
[
  {
    "question": "The interview question",
    "answer": "The concise, correct technical answer"
  }
]`;

  const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${GROQ_API_KEY}`,
    },
    body: JSON.stringify({
      model: "llama-3.1-8b-instant",
      temperature: 0.7,
      messages: [
        { role: "system", content: "You generate technical interview questions. You output raw valid JSON array only. No markdown, no prefixes." },
        { role: "user", content: prompt }
      ]
    }),
  });

  if (!res.ok) {
    throw new Error(await res.text());
  }
  const data = await res.json();
  let jsonString = data.choices[0].message.content;
  if (jsonString.includes('```')) {
    jsonString = jsonString.replace(/```json/g, '').replace(/```/g, '').trim();
  }
  const firstBracket = jsonString.indexOf('[');
  const lastBracket = jsonString.lastIndexOf(']');
  if (firstBracket !== -1 && lastBracket !== -1) {
    jsonString = jsonString.substring(firstBracket, lastBracket + 1);
  }
  
  return JSON.parse(jsonString);
};
