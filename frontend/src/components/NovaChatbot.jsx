import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../config/supabaseClient';

const GROQ_API_KEY = import.meta.env.VITE_GROQ_API_KEY;

export default function NovaChatbot({ isOpen, onClose, emailsCount = 0, inboxSenders = "", user }) {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  
  // Resizable Sidebar State
  const [sidebarWidth, setSidebarWidth] = useState(450);
  const [isDragging, setIsDragging] = useState(false);
  const textareaRef = useRef(null);
  const messagesEndRef = useRef(null);

  // Auto-scroll to bottom of chat
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!isDragging) return;
      const newWidth = window.innerWidth - e.clientX;
      if (newWidth > 300 && newWidth < 900) {
        setSidebarWidth(newWidth);
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      document.body.style.userSelect = 'auto'; 
    };

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
      const scrollHeight = textareaRef.current.scrollHeight;
      textareaRef.current.style.height = `${Math.min(scrollHeight, 250)}px`;
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const saveMessageToDB = async (role, content) => {
    if (!user) return;
    try {
      await supabase.from('nova_chats').insert([{
        user_id: user.id,
        role: role,
        content: content
      }]);
    } catch (e) {
      // Silently fail if table doesn't exist yet
    }
  };

  const handleSendMessage = async () => {
    if (!input.trim() || loading) return;
    
    const userMsg = { role: 'user', content: input.trim() };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    if (textareaRef.current) textareaRef.current.style.height = '50px';
    
    setLoading(true);
    await saveMessageToDB('user', userMsg.content);

    // Fetch live dashboard context
    let candidatesContext = "No candidates shortlisted yet.";
    try {
      const { data, error } = await supabase.from('candidates').select('name, email, phone, job_role, match_score, skills, education, projects, github_stats, summary');
      if (!error && data && data.length > 0) {
        candidatesContext = data.map(c => 
          `- Name: ${c.name}\n  Role: ${c.job_role}\n  Match: ${c.match_score}%\n  Contact: ${c.email || 'N/A'}, ${c.phone || 'N/A'}\n  Education: ${c.education ? c.education.join(', ') : 'None extracted'}\n  Projects: ${c.projects ? c.projects.join(', ') : 'None extracted'}\n  Skills: ${c.skills?.join(', ')}\n  Summary: ${c.summary}\n  GitHub Profile: ${c.github_stats?.profileUrl || 'None'}`
        ).join('\n\n');
      }
    } catch (e) { }

    const systemPrompt = {
      role: "system", 
      content: `You are Nova, an intelligent AI HR assistant for HireIQ. 
Your purpose is to answer the user's questions about their recruitment pipeline, OR generate professional LinkedIn job posts if requested.

CURRENT DASHBOARD CONTEXT:
- Resumes/Emails currently in the inbox waiting to be scanned: ${emailsCount}
- Names of people who sent the emails in the inbox: ${inboxSenders || "None"}
- Shortlisted Candidates Database:
${candidatesContext}

RULES:
1. Answer questions about the candidates based ONLY on the context provided above.
2. If the user asks for details not in the context (like education), politely explain that this specific information was not extracted by the AI parser, but provide the summary/skills that ARE available.
3. If the user asks you to write a job post, create a short, professional LinkedIn post with emojis.
4. Be conversational, helpful, and concise. Remember previous messages in this conversation.`
    };

    // Prepare message history for LLM (only sending last 10 to save tokens)
    const historyForLLM = messages.slice(-10).map(m => ({ role: m.role, content: m.content }));
    const llmMessages = [systemPrompt, ...historyForLLM, userMsg];

    let aiResponseContent = "";

    try {
      // Trying Local Ollama first
      const ollamaRes = await fetch("http://localhost:11434/v1/chat/completions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "llama3.2:3b",
          messages: llmMessages,
          temperature: 0.7
        })
      });

      if (ollamaRes.ok) {
        const data = await ollamaRes.json();
        aiResponseContent = data.choices[0].message.content;
      }
    } catch (e) {
      console.log("Local Ollama failed, falling back to Groq");
    }

    if (!aiResponseContent) {
      try {
        const groqRes = await fetch("https://api.groq.com/openai/v1/chat/completions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${GROQ_API_KEY}`
          },
          body: JSON.stringify({
            model: "llama3-8b-8192", 
            messages: llmMessages,
            temperature: 0.7
          })
        });
        const groqData = await groqRes.json();
        if (groqRes.ok && groqData.choices) {
          aiResponseContent = groqData.choices[0].message.content;
        } else {
          aiResponseContent = `Error: ${groqData.error?.message || "Both Ollama and Groq failed."}`;
        }
      } catch (err) {
        aiResponseContent = `Network Error: Both AI services failed.`;
      }
    }

    const aiMsg = { role: 'assistant', content: aiResponseContent };
    setMessages(prev => [...prev, aiMsg]);
    setLoading(false);
    
    await saveMessageToDB('assistant', aiMsg.content);
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      {/* Subtle backdrop */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        style={{
          position: 'fixed', top: 0, left: 0, width: '100%', height: '100vh',
          background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)',
          zIndex: 999
        }}
      />

      {/* Right Sidebar Drawer */}
      <motion.div 
        initial={{ x: '100%' }}
        animate={{ x: 0 }}
        exit={{ x: '100%' }}
        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
        style={{
          position: 'fixed', top: 0, right: 0, height: '100vh',
          width: `${sidebarWidth}px`, maxWidth: '100vw',
          background: 'var(--bg-deep)', borderLeft: '1px solid var(--glass-border)',
          boxShadow: '-10px 0 40px rgba(0,0,0,0.5)', zIndex: 1000,
          display: 'flex', flexDirection: 'column'
        }}
      >
        {/* Resize Handle */}
        <div 
          onMouseDown={() => setIsDragging(true)}
          style={{
            position: 'absolute', left: 0, top: 0, bottom: 0, width: '6px',
            cursor: 'ew-resize', zIndex: 10,
            background: isDragging ? 'var(--accent)' : 'transparent',
            transition: 'background 0.2s'
          }}
          onMouseEnter={(e) => { if (!isDragging) e.target.style.background = 'rgba(255,255,255,0.1)' }}
          onMouseLeave={(e) => { if (!isDragging) e.target.style.background = 'transparent' }}
        />

        {/* Header */}
        <div style={{ 
          padding: '24px', borderBottom: '1px solid var(--glass-border)', 
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          background: 'var(--bg-heavy)'
        }}>
          <h2 style={{ margin: 0, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '10px', fontSize: '1.25rem' }}>
            <span style={{ fontSize: '1.5rem' }}>🤖</span> Nova HR Assistant
          </h2>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', fontSize: '1.4rem', cursor: 'pointer', transition: 'color 0.2s' }} onMouseOver={e => e.target.style.color='var(--text-primary)'} onMouseOut={e => e.target.style.color='var(--text-secondary)'}>✖</button>
        </div>

        {/* Chat History Area */}
        <div style={{ padding: '24px', flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {messages.length === 0 ? (
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
              <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.95rem', lineHeight: '1.6' }}>
                👋 Hi! I'm Nova.<br/>
                Ask me about your inbox, shortlisted candidates, or tell me to write a job post!
              </p>
            </div>
          ) : (
            messages.map((msg, idx) => (
              <motion.div 
                key={idx}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                style={{ 
                  alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start',
                  maxWidth: '85%',
                  background: msg.role === 'user' ? 'var(--accent)' : 'var(--bg-card)',
                  color: msg.role === 'user' ? '#fff' : 'var(--text-primary)',
                  padding: '12px 16px',
                  borderRadius: '12px',
                  border: msg.role === 'user' ? 'none' : '1px solid var(--glass-border)',
                  fontSize: '0.95rem',
                  lineHeight: '1.5',
                  whiteSpace: 'pre-wrap'
                }}
              >
                {msg.content}
              </motion.div>
            ))
          )}

          {/* Typing Indicator */}
          {loading && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              style={{ alignSelf: 'flex-start', background: 'var(--bg-card)', padding: '12px 16px', borderRadius: '12px', border: '1px solid var(--glass-border)', display: 'flex', gap: '6px', alignItems: 'center' }}
            >
              <style>{`
                @keyframes blink {
                  0% { opacity: 0.2; }
                  20% { opacity: 1; }
                  100% { opacity: 0.2; }
                }
              `}</style>
              <span style={{ width: '6px', height: '6px', background: 'var(--text-secondary)', borderRadius: '50%', display: 'inline-block', animation: 'blink 1.4s infinite both' }}></span>
              <span style={{ width: '6px', height: '6px', background: 'var(--text-secondary)', borderRadius: '50%', display: 'inline-block', animation: 'blink 1.4s infinite both', animationDelay: '0.2s' }}></span>
              <span style={{ width: '6px', height: '6px', background: 'var(--text-secondary)', borderRadius: '50%', display: 'inline-block', animation: 'blink 1.4s infinite both', animationDelay: '0.4s' }}></span>
            </motion.div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Bottom Input Area */}
        <div style={{ padding: '20px 24px', borderTop: '1px solid var(--glass-border)', background: 'var(--bg-deep)' }}>
          <textarea 
            ref={textareaRef}
            value={input}
            onChange={handleInput}
            onKeyDown={handleKeyDown}
            placeholder="e.g. Give me the GitHub link of Massna..."
            style={{
              width: '100%', minHeight: '60px', padding: '16px',
              background: 'var(--bg-tab)', border: '1px solid var(--glass-border)',
              borderRadius: '12px', color: 'var(--text-primary)',
              fontFamily: 'inherit', fontSize: '0.95rem', resize: 'none', outline: 'none',
              boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.1)',
              marginBottom: '12px', overflowY: 'auto'
            }}
            onFocus={e => e.target.style.borderColor='var(--accent)'}
            onBlur={e => e.target.style.borderColor='var(--glass-border)'}
          />
          <button 
            className="btn-glow" 
            onClick={handleSendMessage} 
            disabled={loading || !input.trim()}
            style={{ width: '100%', padding: '14px', fontSize: '1rem', fontWeight: '600', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px' }}
          >
            {loading ? 'Thinking...' : 'Send Message'}
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
