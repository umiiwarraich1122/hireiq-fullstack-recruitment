# HireIQ - AI-Powered Technical Recruitment Platform

HireIQ is a full-stack, AI-driven recruitment pipeline designed to streamline the hiring process. It automatically parses resumes (PDFs) from emails, evaluates candidates against specific job roles using LLMs, verifies developer profiles, and manages interview scheduling with automated WhatsApp and Email notifications.

## Features

- **AI Resume Screening:** Extracts key information (skills, education, experience, WhatsApp numbers) from resumes and evaluates candidates with a strict match score based on career field and relevance to the target role.
- **Multi-LLM Support:** Uses Cerebras, OpenRouter (Llama 3.1), and Groq for blazing fast and intelligent resume parsing with automated fallbacks.
- **GitHub Integration:** Automatically verifies candidate GitHub profiles, extracting stars, repos, followers, and active years.
- **Smart Shortlisting:** Stores parsed candidates and their match scores in Supabase for a seamless recruitment pipeline.
- **Automated Scheduling:** Schedules interviews via Google Calendar integrations and generates Google Meet links.
- **Instant Notifications:** Notifies candidates instantly via Email (Gmail API) and WhatsApp (WAHA integration).

## Tech Stack

- **Frontend:** React, Vite, TailwindCSS, Framer Motion
- **Backend:** FastAPI (Python), Uvicorn, HTTPX
- **Database:** Supabase (PostgreSQL)
- **AI/LLMs:** OpenRouter, Groq, Cerebras
- **Integrations:** Google Calendar API, Gmail API, WAHA (WhatsApp API), GitHub API

## Getting Started

### Prerequisites

- Node.js & npm
- Python 3.10+
- Supabase Account
- Google Cloud Console Project (with Gmail and Calendar API enabled)

### Environment Variables

You need to set up `.env` files in both the `frontend` and `backend` directories.

**Backend (`backend/.env`):**
```env
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key
GROQ_API_KEY=your_groq_api_key
CEREBRAS_API_KEY=your_cerebras_api_key
GITHUB_TOKEN=your_github_token
```

**Frontend (`frontend/.env.local`):**
```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_GROQ_API_KEY=your_groq_api_key
VITE_CEREBRAS_API_KEY=your_cerebras_api_key
VITE_GITHUB_TOKEN=your_github_token
```

### Installation

1. **Backend Setup:**
   ```bash
   cd backend
   pip install -r requirements.txt
   uvicorn main:app --reload --host 0.0.0.0 --port 8000
   ```

2. **Frontend Setup:**
   ```bash
   cd frontend
   npm install
   npm run dev
   ```

### Supabase Schema

To use this project, ensure your `candidates` table in Supabase has the following schema:
- `id` (UUID)
- `name` (TEXT)
- `email` (TEXT)
- `phone` (TEXT)
- `whatsapp` (TEXT)
- `job_role` (TEXT)
- `match_score` (NUMERIC)
- `skills` (JSONB)
- `education` (JSONB)
- `projects` (JSONB)
- `summary` (TEXT)
- `github_stats` (JSONB)

## Usage

1. Authenticate with Google to allow Gmail scanning and Calendar invites.
2. Select a Target Role (e.g., "Full Stack Developer").
3. Click **Scan Inbox with AI** to process resumes.
4. Review the parsed candidates and their AI-generated Match Scores.
5. Shortlist top candidates.
6. Go to the **Candidates** tab and click **Schedule Interview** to generate a meeting link and automatically notify the candidate via Email and WhatsApp.

