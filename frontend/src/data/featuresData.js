// ═══════════════════════════════════════════════════════════════
// HireIQ — All 25 Features, 7 Categories
// ═══════════════════════════════════════════════════════════════

const featuresData = [
  {
    letter: 'A',
    name: 'Core AI Screening Agents',
    icon: '🧠',
    desc: 'Run sequentially on every batch to produce a ranked shortlist in minutes.',
    features: [
      {
        n: 1, t: 'Resume Parser Agent',
        p: 'HR teams manually read hundreds of CVs in inconsistent formats, losing hours and introducing error.',
        b: ['Accepts PDF/DOCX individually or in bulk ZIP uploads', 'PaddleOCR falls back for scanned, image-based resumes', 'Outputs clean structured JSON per candidate to PostgreSQL'],
        v: 'Parses 150 CVs in under 30 seconds — eliminates hours of manual entry per cycle.'
      },
      {
        n: 2, t: 'Red Flag Detection Agent',
        p: 'Risky hire patterns are invisible to a tired reviewer scanning 200 CVs by hand.',
        b: ['Flags employment gaps over 6 months and job-hopping (3+ roles in 12 months)', 'Catches overlapping dates and overqualification for the role', 'Every flag carries a WARNING or CRITICAL severity with plain-English reasoning'],
        v: 'Saves interview slots by keeping high-risk candidates visible early.'
      },
      {
        n: 3, t: 'Smart Candidate Matching Agent',
        p: 'Keyword filters reject strong candidates whose CV just uses different words for the same skill.',
        b: ['Sentence-BERT embeddings compare meaning, not exact words', 'Cosine similarity produces a 0–100% Match Score', 'Lists matched and missing skills, fully explainable per section'],
        v: 'Surfaces the best candidates regardless of CV style — cuts screening time 85%.'
      },
      {
        n: 4, t: 'Coding Profile Analyzer Agent',
        p: 'Candidates overstate technical skills and HR has no developer on hand to check.',
        b: ['Pulls GitHub, Stack Overflow and LeetCode activity automatically', 'Generates a 0–100 Developer Verification Score with evidence', 'Flags claims with zero matching activity as inconsistent'],
        v: 'Cuts bad technical hires by up to 70% by verifying, not trusting, claims.'
      },
      {
        n: 5, t: 'Interview Question Generator Agent',
        p: 'Non-technical interviewers struggle to ask relevant, role-specific questions.',
        b: ['Llama-3-8B generates 10–15 questions personalized to each candidate', 'Categorized Easy / Medium / Hard, each with a model answer', 'Exports as a printable interview sheet'],
        v: 'Lets any HR interviewer run a consistent, structured technical round.'
      },
      {
        n: 6, t: 'Ranking & Explainability Agent',
        p: 'After all the analysis, HR still needs one clear answer: who to interview first.',
        b: ['Weighted formula: 40% match, 25% GitHub, 20% red-flag penalty, 15% experience', 'Produces a natural-language explanation for every rank position'],
        v: 'Turns hours of comparison into a defensible, bias-reduced shortlist in seconds.'
      },
    ]
  },
  {
    letter: 'B',
    name: 'Smart Intake & Communication',
    icon: '📨',
    desc: 'Captures applications and keeps every candidate informed automatically.',
    features: [
      {
        n: 7, t: 'Email Intake / Application Detection Agent',
        p: 'Candidates email CVs into an inbox HR has to sort by hand.',
        b: ['Monitors the careers inbox via IMAP for CV attachments', 'Extracts the target role from the subject line with NLP', 'Sends an instant acknowledgement to the candidate'],
        v: 'Zero manual effort — every emailed CV is captured and routed automatically.'
      },
      {
        n: 8, t: 'AI Job Description Generator',
        p: 'Writing a good JD is slow, and a poor one attracts the wrong candidates.',
        b: ['Turns 5–10 keywords into a complete, professional JD', 'Flags exclusionary language like "rockstar" or "young"', 'Scores completeness, clarity and predicted applicant volume'],
        v: 'Cuts JD writing from 2 hours to 2 minutes and lowers legal risk.'
      },
      {
        n: 9, t: 'Interview Scheduler & Calendar Sync',
        p: 'Scheduling one interview can take 5–10 emails and 1–2 days.',
        b: ['Sends a self-scheduling link against HR-defined slots', 'Auto-creates the calendar event and video link', 'Sends 24-hour and 1-hour reminders automatically'],
        v: 'Saves 1–2 hours per candidate and reduces interview no-shows.'
      },
      {
        n: 10, t: 'Candidate Communication Agent',
        p: 'Most companies never update candidates, which damages employer brand.',
        b: ['Auto-sends status emails at every pipeline stage', '24/7 AI chatbot answers candidate FAQs on the careers site', 'Keeps a full communication log per candidate'],
        v: 'Cuts HR email workload 80% while improving candidate experience.'
      },
    ]
  },
  {
    letter: 'C',
    name: 'Verification & Fraud Prevention',
    icon: '🛡️',
    desc: 'Catches fabricated CVs and automates reference checking.',
    features: [
      {
        n: 11, t: 'Resume Fraud Detection Agent',
        p: 'CV fraud — fake degrees, inflated experience, AI-written resumes — is increasingly common.',
        b: ['Flags timeline impossibilities and duplicate CVs across names', 'Cross-references institutions and validates contact formats', 'Perplexity scoring flags likely AI-generated resumes'],
        v: 'Prevents costly fraudulent hires and cuts background-check spend.'
      },
      {
        n: 12, t: 'Reference Check Automation Agent',
        p: 'Manual reference calls take days and yield vague, unstructured answers.',
        b: ['Sends structured questionnaires directly to references', 'Sentiment analysis produces a Reference Trust Score', 'Flags suspicious references sharing an IP or email domain'],
        v: 'Cuts reference checks from 3 days to under 3 hours.'
      },
    ]
  },
  {
    letter: 'D',
    name: 'Post-Selection & Talent Lifecycle',
    icon: '🎯',
    desc: 'Everything after the offer, plus candidates worth remembering.',
    features: [
      {
        n: 13, t: 'Offer Letter & Onboarding Automation Agent',
        p: 'Drafting offers and tracking onboarding paperwork is slow and error-prone.',
        b: ['Auto-generates offers with salary benchmarking built in', 'Sends for digital signature and triggers onboarding on acceptance', 'Tracks document collection with deadline alerts'],
        v: 'Cuts time-to-onboard by 70% and eliminates missed paperwork.'
      },
      {
        n: 14, t: 'Bias Detection & Fairness Audit Agent',
        p: 'Unconscious bias can exclude qualified candidates and create legal exposure.',
        b: ['Scans shortlists for disparities by institution or city', 'Excludes name, gender markers and age from scoring entirely', 'Produces a Fairness Audit Report for compliance'],
        v: 'Protects against discrimination claims with data-backed evidence.'
      },
      {
        n: 15, t: 'Talent Pool & Passive Candidate Tracker',
        p: "Strong candidates who aren't hired today are usually forgotten forever.",
        b: ['Every candidate joins a searchable, tagged talent pool', 'New roles automatically surface warm past candidates', 'Sends personalized re-engagement emails'],
        v: 'Lowers cost-per-hire and fills future roles faster.'
      },
    ]
  },
  {
    letter: 'E',
    name: 'Advanced Processing Features',
    icon: '⚙️',
    desc: 'Scales HireIQ to agencies and enterprises running many roles at once.',
    features: [
      {
        n: 16, t: 'Multi-Role Batch Processing',
        p: 'Agencies and enterprises run dozens of open roles at the same time.',
        b: ['Uploads 500+ CVs and multiple JDs in one batch', 'Auto-suggests alternate roles for a near-miss candidate', 'Delivers one unified dashboard across all roles'],
        v: 'Turns a week of manual sorting into a 10-minute automated run.'
      },
      {
        n: 17, t: 'ATS Integration / Plugin API',
        p: "Enterprise clients already run Workday, BambooHR or Greenhouse and won't switch.",
        b: ['Full REST API with webhook support for existing ATS tools', 'OAuth 2.0 authentication and Python / JavaScript SDKs', 'Ranked results pushed back into the existing ATS'],
        v: 'Makes HireIQ sellable to enterprises without disrupting their workflow.'
      },
    ]
  },
  {
    letter: 'F',
    name: 'Dashboard, Reporting & Analytics',
    icon: '📊',
    desc: 'A live, unified view of every job, pipeline and outcome.',
    features: [
      {
        n: 18, t: 'Recruitment Dashboard',
        p: 'Recruitment data is scattered across emails, spreadsheets and tools.',
        b: ['Real-time, WebSocket-powered view of every active job', 'Side-by-side comparison of 2–3 candidates at once', 'Fully responsive across desktop, tablet and mobile'],
        v: 'Gives leadership a real-time view for faster decisions.'
      },
      {
        n: 19, t: 'Live Kanban Hiring Pipeline',
        p: 'Tracking candidate stages by spreadsheet is always out of date.',
        b: ['Drag-and-drop stages from Applied through Hired', 'Color-coded cards show score, skills and red flags', 'Alerts when a candidate stalls in a stage too long'],
        v: 'Removes manual spreadsheet tracking entirely.'
      },
      {
        n: 20, t: 'PDF / Excel Reporting & Export',
        p: 'Sharing results with leadership or legal needs standard documents.',
        b: ['One-click branded PDF or Excel exports of any shortlist', 'Individual, comparative and fairness-audit report formats', 'Weekly summaries auto-emailed to leadership'],
        v: 'Client-ready reports in seconds, with no manual formatting.'
      },
      {
        n: 21, t: 'Smart Recruitment Alerts',
        p: 'Unreviewed CVs, no-shows and stale pipelines slip through unnoticed.',
        b: ['Instant alert on a 90%+ match "hot candidate"', 'Warns when CVs sit unreviewed for 48+ hours', 'Delivered via in-app, email and optional SMS'],
        v: 'Keeps recruitment moving so top candidates are never left waiting.'
      },
      {
        n: 22, t: 'Recruitment Analytics Dashboard',
        p: 'Sourcing decisions are often based on gut feeling rather than data.',
        b: ['Full hiring funnel from applied to hired', 'Time-to-hire and cost-per-hire by channel', 'Source-quality analysis across job portals'],
        v: 'Gives HR the evidence to justify sourcing and budget decisions.'
      },
    ]
  },
  {
    letter: 'G',
    name: 'Security, Compliance & Access Control',
    icon: '🔒',
    desc: 'Enterprise-grade controls over who can see and change what.',
    features: [
      {
        n: 23, t: 'RBAC & Role-Based Access Control',
        p: "Flat access lets junior staff see salary data or edit rankings they shouldn't.",
        b: ['Five permission tiers from Super Admin to Guest', 'JWT-based authentication with session management', 'Every permission change is logged with who and when'],
        v: 'Required for safe multi-team, enterprise and government use.'
      },
      {
        n: 24, t: 'Audit Logs & Activity Tracking',
        p: 'Hiring disputes have no record to consult without a full audit trail.',
        b: ['Immutable, tamper-proof log of every action and actor', 'Preserves the original AI score if HR overrides a ranking', 'Exportable for legal discovery and compliance reviews'],
        v: 'Protects the company in any hiring dispute and supports ISO/SOC 2.'
      },
      {
        n: 25, t: 'CV Encryption & Secure Storage',
        p: 'Unencrypted CVs turn any data breach into a legal liability.',
        b: ['AES-256 at rest and TLS 1.3 in transit', 'GDPR deletion requests purge all candidate records', 'PII masked in analytics to reduce bias'],
        v: 'Builds candidate trust and clears the bar for EU market entry.'
      },
    ]
  },
];

export default featuresData;
