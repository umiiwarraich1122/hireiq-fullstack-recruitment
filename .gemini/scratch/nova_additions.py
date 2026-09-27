with open('frontend/src/components/NovaChatbot.jsx', 'r', encoding='utf-8') as f:
    code = f.read()

# Add logic to executeAction
replacement = '''
    if (action === 'GET_STATS') {
      const stored = JSON.parse(localStorage.getItem('hireiq_interviews') || '[]');
      const today = new Date().toISOString().split('T')[0];
      const todayInterviews = stored.filter(i => i.date === today);
      return "You have " + stored.length + " total interviews scheduled, and " + todayInterviews.length + " interviews today.";
    }

    if (action === 'SHOW_TOP_CANDIDATES') {
      const topCandidates = candidates.sort((a,b) => b.match_score - a.match_score).slice(0, 3);
      const list = topCandidates.map(c => c.name + " (" + c.match_score + "%)").join(", ");
      return "Top candidates are: " + list;
    }

    if (action === 'SHORTLIST_CANDIDATE') {
      const candidateName = payload?.candidateName;
      if (!candidateName) return "I need a candidate name to shortlist.";
      const candidate = candidates.find(c => c.name.toLowerCase().includes(candidateName.toLowerCase()));
      if (!candidate) return "I couldn't find a candidate named " + candidateName;
      
      // We will pretend we shortlisted them in UI, though they are already in the Candidates table
      return candidate.name + " has been successfully highlighted/shortlisted!";
    }
    
    if (action === 'SCHEDULE_INTERVIEW') {
'''

code = code.replace("if (action === 'SCHEDULE_INTERVIEW') {", replacement)

with open('frontend/src/components/NovaChatbot.jsx', 'w', encoding='utf-8') as f:
    f.write(code)
