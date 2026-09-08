export const analyzeResumeText = async (resumeText, targetRole = "Software Developer") => {
  const CEREBRAS_API_KEY = import.meta.env.VITE_CEREBRAS_API_KEY;

  const prompt = `You are an HR AI assistant. Evaluate this resume for the role: "${targetRole}".
Return ONLY a valid JSON object.
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
  "summary": "1-sentence summary of relevance."
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
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: "You extract structured data from resumes and output strictly valid JSON." },
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
    const data = await callAI("https://api.cerebras.ai/v1/chat/completions", CEREBRAS_API_KEY, "llama3.1-8b");
    
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
