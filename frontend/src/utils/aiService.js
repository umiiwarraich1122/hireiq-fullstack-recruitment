export const analyzeResumeText = async (resumeText) => {
  const apiKey = import.meta.env.VITE_CEREBRAS_API_KEY;
  if (!apiKey) throw new Error("Cerebras API key is missing");

  const prompt = `You are an expert HR AI assistant. Your job is to extract specific information from the provided resume text.
Extract the following information and return ONLY a valid JSON object. Do not include markdown formatting like \`\`\`json.
{
  "name": "Candidate's full name, or null if not found",
  "github_username": "The candidate's GitHub username if a github.com link is found, otherwise null",
  "linkedin": "LinkedIn profile URL, or null",
  "skills": ["Array", "of", "top", "skills", "found"],
  "experience_years": "Estimated total years of experience as an integer, or null",
  "summary": "A 2-sentence summary of the candidate's profile"
}

Resume Text:
${resumeText}`;

  try {
    const res = await fetch("https://api.cerebras.ai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-oss-120b",
        messages: [
          { role: "system", content: "You extract structured data from resumes and output only valid JSON." },
          { role: "user", content: prompt }
        ],
        temperature: 0.1
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`Cerebras Error (${res.status}): ${errText}`);
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
    
    return JSON.parse(jsonString);
  } catch (error) {
    console.error("AI Analysis Error:", error);
    throw new Error(error.message);
  }
};
