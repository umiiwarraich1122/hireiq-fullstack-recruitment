export const analyzeResumeText = async (resumeText, targetRole = "Software Developer") => {
  // Use Local Ollama for development, switch back to Groq for production
  const isLocal = true; 
  
  let apiKey = "ollama"; // Dummy key for Ollama
  let endpoint = "http://localhost:11434/v1/chat/completions";
  let modelName = "llama3.2:3b";

  if (!isLocal) {
    apiKey = import.meta.env.VITE_GROQ_API_KEY;
    if (!apiKey) throw new Error("Groq API key is missing");
    endpoint = "https://api.groq.com/openai/v1/chat/completions";
    modelName = "openai/gpt-oss-20b";
  }

  const prompt = `You are an expert HR AI assistant. Your job is to extract comprehensive information from the provided resume text and evaluate how well the candidate matches the target job role: "${targetRole}".
Extract the following information and return ONLY a valid JSON object. Do not include markdown formatting like \`\`\`json.
{
  "name": "Candidate's full name, or null if not found",
  "email": "Candidate's email address, or null",
  "phone": "Candidate's phone number, or null",
  "github_username": "The candidate's GitHub username if a github.com link is found, otherwise null",
  "linkedin": "LinkedIn profile URL, or null",
  "education": ["Array of degrees and universities, e.g. 'BSc Computer Science from XYZ University'"],
  "projects": ["Array of short descriptions of key projects"],
  "skills": ["Array", "of", "top", "skills", "found"],
  "experience_years": "Estimated total years of experience as an integer, or null",
  "match_score": "An integer between 1 and 100 representing how well the candidate's skills and experience match the target role '${targetRole}'. Evaluate strictly based on the content.",
  "summary": "A 2-sentence summary of the candidate's profile, highlighting relevance to '${targetRole}'."
}

Resume Text:
${resumeText}`;

  try {
    const res = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: modelName,
        temperature: 0.0,
        seed: 42,
        messages: [
          { role: "system", content: "You extract structured data from resumes and output only valid JSON." },
          { role: "user", content: prompt }
        ]
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`AI API Error (${res.status}): ${errText}`);
    }
    
    const data = await res.json();
    let jsonString = data.choices[0].message.content;
    
    if (jsonString.includes('```')) {
      jsonString = jsonString.replace(/```json/g, '').replace(/```/g, '').trim();
    }
    
    // Defensive extraction: find the first { and last }
    const firstBrace = jsonString.indexOf('{');
    const lastBrace = jsonString.lastIndexOf('}');
    if (firstBrace !== -1 && lastBrace !== -1) {
      jsonString = jsonString.substring(firstBrace, lastBrace + 1);
    }
    
    // Attempt to fix common small-model JSON errors (like trailing commas)
    jsonString = jsonString.replace(/,\s*([}\]])/g, '$1');
    
    try {
      return JSON.parse(jsonString);
    } catch (parseError) {
      console.warn("JSON Parse failed for AI output. Attempting to return a partial object. Raw output:", jsonString);
      return {
        name: "Formatting Error",
        match_score: 0,
        skills: [],
        summary: "The AI model failed to format the resume details correctly.",
        experience_years: null
      };
    }
  } catch (error) {
    console.error("AI Analysis Error:", error);
    throw new Error(error.message);
  }
};
