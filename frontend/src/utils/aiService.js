const BACKEND_URL = "http://127.0.0.1:8000";

export const analyzeResumeText = async (resumeText, targetRole = "Software Developer") => {
  try {
    const res = await fetch(`${BACKEND_URL}/api/parse-resume`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        resumeText: resumeText,
        targetRole: targetRole
      }),
    });
    
    if (!res.ok) {
      const err = await res.text();
      throw new Error(err);
    }
    
    return await res.json();
  } catch (error) {
    console.error("AI Analysis Error:", error);
    throw new Error(error.message);
  }
};

export const generateInterviewQuestions = async (jobRole, skills = '', summary = '') => {
  try {
    const res = await fetch(`${BACKEND_URL}/api/generate-questions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        jobRole: jobRole,
        candidateSkills: Array.isArray(skills) ? skills.join(", ") : skills,
        candidateSummary: summary
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      throw new Error(err);
    }
    
    return await res.json();
  } catch (error) {
    console.error("AI QA Error:", error);
    throw new Error(error.message);
  }
};
