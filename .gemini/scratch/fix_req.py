import os

reqs = [
    "fastapi",
    "uvicorn",
    "python-dotenv",
    "supabase",
    "requests",
    "PyMuPDF",
    "groq",
    "pydantic",
    "httpx"
]

with open('d:/Internship/HR Project/hireiq/backend/requirements.txt', 'w', encoding='utf-8') as f:
    f.write('\n'.join(reqs) + '\n')
