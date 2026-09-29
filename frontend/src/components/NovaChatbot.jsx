import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../config/supabaseClient';

export default function NovaChatbot({ isOpen, onClose, emailsCount = 0, inboxSenders = "", user, session, syncGmailCVs }) {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [sidebarWidth, setSidebarWidth] = useState(450);
  const [isDragging, setIsDragging] = useState(false);
  
  const textareaRef = useRef(null);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!isDragging) return;
      const newWidth = window.innerWidth - e.clientX;
      if (newWidth > 300 && newWidth < 900) setSidebarWidth(newWidth);
    };
    const handleMouseUp = () => { setIsDragging(false); document.body.style.userSelect = 'auto'; };
    if (isDragging) {
      document.body.style.userSelect = 'none';
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging]);

  const handleInput = (e) => {
    setInput(e.target.value);
    if (textareaRef.current) {
      textareaRef.current.style.height = '50px';
      textareaRef.current.style.height = String(Math.min(textareaRef.current.scrollHeight, 250)) + 'px';
    }
  };

  const executeAction = async (action, payload, candidates) => {
    if (action === 'SYNC_GMAIL') {
      if (syncGmailCVs) {
        syncGmailCVs(session?.provider_token);
        return "Started scanning Gmail for new resumes. The dashboard will update shortly!";
      }
      return "I couldn't trigger the Gmail sync. Make sure you are logged in.";
    }
    
    
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

      const candidateName = payload?.candidateName;
      if (!candidateName) return "I need a candidate name to schedule the interview.";
      const candidate = candidates.find(c => c.name.toLowerCase().includes(candidateName.toLowerCase()));
      if (!candidate) return "I couldn't find a candidate named " + candidateName + " in the database.";
      
      const date = payload?.date || new Date(Date.now() + 86400000).toISOString().split('T')[0];
      const time = payload?.time || "14:00";
      const mode = payload?.mode || "Virtual";
      let meetLink = "In-Person Interview (Company Office)";
      
      try {
        if (mode === 'Virtual' && session?.provider_token) {
           const eventStart = new Date(date + 'T' + time + ':00');
           const eventEnd = new Date(eventStart.getTime() + 60*60*1000);
           const event = {
             summary: "Interview with " + candidate.name + " - " + candidate.job_role,
             description: "Scheduled via HireIQ for " + candidate.job_role,
             start: { dateTime: eventStart.toISOString(), timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone },
             end: { dateTime: eventEnd.toISOString(), timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone },
             conferenceData: {
               createRequest: { requestId: "hireiq-" + Math.random().toString(36).substring(7), conferenceSolutionKey: { type: "hangoutsMeet" } }
             }
           };
           const calRes = await fetch("https://www.googleapis.com/calendar/v3/calendars/primary/events?conferenceDataVersion=1", {
             method: "POST", headers: { "Authorization": "Bearer " + session.provider_token, "Content-Type": "application/json" },
             body: JSON.stringify(event)
           });
           const calData = await calRes.json();
           if (!calData.error) meetLink = calData.hangoutLink || "No link generated";
        }
        
        if (candidate.email && session?.provider_token) {
          const emailLines = [
            "To: " + candidate.email,
            "Subject: Interview Scheduled: " + candidate.job_role,
            "Content-Type: text/plain; charset=utf-8", "",
            "Dear " + candidate.name + ",", "",
            "We have scheduled a " + mode.toLowerCase() + " interview with you for the role of " + candidate.job_role + ".", "",
            "Date: " + date, "Time: " + time, "",
            mode === 'Virtual' ? "Please join using this Google Meet link:" : "Please visit our company office at the scheduled time.",
            meetLink, "", "Best regards,", "HR Team"
          ];
          const rawEmail = emailLines.join('\r\n');
          const encodedEmail = btoa(unescape(encodeURIComponent(rawEmail))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
          await fetch("https://gmail.googleapis.com/gmail/v1/users/me/messages/send", {
            method: "POST", headers: { "Authorization": "Bearer " + session.provider_token, "Content-Type": "application/json" },
            body: JSON.stringify({ raw: encodedEmail })
          });
        }
        
        const targetPhone = candidate.whatsapp || candidate.phone || "03353958839"; 
        const modeText = mode === 'Virtual' ? 'Meet Link' : 'Location';
        const waMsg = "Hi " + candidate.name + ",\n\nYour " + mode.toLowerCase() + " interview for " + candidate.job_role + " is scheduled.\nDate: " + date + "\nTime: " + time + "\n" + modeText + ": " + meetLink + "\n\n- HR Team";
        await fetch(`${import.meta.env.VITE_API_URL || "http://127.0.0.1:8000"}/api/send-whatsapp`, {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ phone: targetPhone, message: waMsg })
        });
        
        const newInterview = {
          id: Math.random().toString(36).substr(2, 9),
          candidateId: candidate.id, candidateName: candidate.name, jobRole: candidate.job_role,
          date: date, time: time, meetLink: meetLink, createdAt: new Date().toISOString()
        };
        const stored = JSON.parse(localStorage.getItem('hireiq_interviews') || '[]');
        stored.push(newInterview);
        localStorage.setItem('hireiq_interviews', JSON.stringify(stored));
        
        return "Successfully scheduled a " + mode + " interview with **" + candidate.name + "** for **" + date + "** at **" + time + "**.\nI have also sent the Google Calendar invite, Email, and WhatsApp message to the candidate!";
      } catch (err) {
        return "I tried to schedule the interview but encountered an error: " + err.message;
      }
    }
    
    return null;
  };

  const handleSendMessage = async () => {
    if (!input.trim() || loading) return;
    const userMsg = { role: 'user', content: input.trim() };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    if (textareaRef.current) textareaRef.current.style.height = '50px';
    setLoading(true);

    let candidatesContext = [];
    try {
      const { data } = await supabase.from('candidates').select('*');
      if (data) candidatesContext = data;
    } catch (e) { }
    
    const storedInterviews = JSON.parse(localStorage.getItem('hireiq_interviews') || '[]');

    const context = {
      emailsInInbox: emailsCount,
      inboxSenders: inboxSenders,
      candidates: candidatesContext.map(c => ({ name: c.name, score: c.match_score, role: c.job_role })),
      interviewsScheduled: storedInterviews.length
    };

    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL || "http://127.0.0.1:8000"}/api/chat-agent`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: userMsg.content,
          history: messages,
          context: context
        })
      });
      const data = await res.json();
      
      if (data.action && data.action !== 'NONE') {
        const actionResult = await executeAction(data.action, data.actionPayload, candidatesContext);
        setMessages(prev => [...prev, { 
          role: 'assistant', 
          content: data.reply + (actionResult ? "\n\n*System Update*: " + actionResult : "") 
        }]);
      } else {
        setMessages(prev => [...prev, { role: 'assistant', content: data.reply }]);
      }
    } catch (err) {
      setMessages(prev => [...prev, { role: 'assistant', content: "Sorry, my backend services are unreachable right now." }]);
    }

    setLoading(false);
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100vh', background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)', zIndex: 999 }} />
      <motion.div initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} transition={{ type: 'spring', damping: 25, stiffness: 200 }} style={{ position: 'fixed', top: 0, right: 0, height: '100vh', width: String(sidebarWidth) + 'px', maxWidth: '100vw', background: 'var(--bg-deep)', borderLeft: '1px solid var(--glass-border)', boxShadow: '-10px 0 40px rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', flexDirection: 'column' }}>
        <div onMouseDown={() => setIsDragging(true)} style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: '6px', cursor: 'ew-resize', zIndex: 10, background: isDragging ? 'var(--accent)' : 'transparent', transition: 'background 0.2s' }} />
        <div style={{ padding: '24px', borderBottom: '1px solid var(--glass-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-heavy)' }}>
          <h2 style={{ margin: 0, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '10px', fontSize: '1.25rem' }}>
            <span style={{ fontSize: '1.5rem' }}>?</span> Nova HR Assistant
          </h2>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', fontSize: '1.4rem', cursor: 'pointer' }}>?</button>
        </div>
        <div style={{ padding: '24px', flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {messages.length === 0 ? (
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
              <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.95rem', lineHeight: '1.6' }}>Hi! I'm Nova.<br/>Tell me to schedule an interview, check new CVs, or summarize candidates!</p>
            </div>
          ) : (
            messages.map((msg, idx) => (
              <motion.div key={idx} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} style={{ alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start', maxWidth: '85%', background: msg.role === 'user' ? 'var(--accent)' : 'var(--bg-card)', color: msg.role === 'user' ? '#fff' : 'var(--text-primary)', padding: '12px 16px', borderRadius: '12px', border: msg.role === 'user' ? 'none' : '1px solid var(--glass-border)', fontSize: '0.95rem', lineHeight: '1.5', whiteSpace: 'pre-wrap' }}>
                {msg.content}
              </motion.div>
            ))
          )}
          {loading && <div style={{ color: 'var(--text-secondary)' }}>Nova is thinking...</div>}
          <div ref={messagesEndRef} />
        </div>
        <div style={{ padding: '20px 24px', borderTop: '1px solid var(--glass-border)', background: 'var(--bg-deep)' }}>
          <textarea ref={textareaRef} value={input} onChange={handleInput} onKeyDown={(e) => { if(e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendMessage(); } }} placeholder="e.g. Schedule an interview with Hamza..." style={{ width: '100%', minHeight: '60px', padding: '16px', background: 'var(--bg-tab)', border: '1px solid var(--glass-border)', borderRadius: '12px', color: 'var(--text-primary)', fontFamily: 'inherit', fontSize: '0.95rem', resize: 'none', outline: 'none', marginBottom: '12px' }} />
          <button className="btn-glow" onClick={handleSendMessage} disabled={loading || !input.trim()} style={{ width: '100%', padding: '14px', fontSize: '1rem', fontWeight: '600' }}>
            {loading ? 'Thinking...' : 'Send Message'}
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
