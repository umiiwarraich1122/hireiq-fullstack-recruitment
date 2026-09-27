import re
with open('d:/Internship/HR Project/hireiq/backend/main.py', 'r', encoding='utf-8') as f:
    code = f.read()

replacement = '''STRICT CAREER FIELD MATCHING RULES:
- First, determine the candidate's PRIMARY career field from their resume.
- If the candidate is a Student or Fresh Graduate (e.g., "Computer Science Student"), DO NOT instantly give a 0. Instead, evaluate their MATCH SCORE strictly based on their SKILLS, ACADEMIC PROJECTS, and GITHUB.
- If the candidate is a PROFESSIONAL whose primary career field is completely DIFFERENT from "{req.targetRole}", the match_score MUST be EXACTLY 0.
- Examples of MISMATCHES that MUST score exactly 0:
  * AI/ML Engineer applying for Full Stack Developer -> 0
  * Data Scientist applying for Frontend Developer -> 0
  * Backend Developer applying for AI Engineer -> 0
  * RAG/LLM specialist applying for Full Stack -> 0
- Only give high scores (70+) if the candidate's dominant skills AND projects directly match "{req.targetRole}".
- If skills partially overlap but career focus is different, cap at 40-50.'''

code = re.sub(
    r'STRICT CAREER FIELD MATCHING RULES:.*?If skills partially overlap but career focus is different, cap at 40-50\.',
    replacement,
    code,
    flags=re.DOTALL
)

with open('d:/Internship/HR Project/hireiq/backend/main.py', 'w', encoding='utf-8') as f:
    f.write(code)

print("Updated prompt rules.")
