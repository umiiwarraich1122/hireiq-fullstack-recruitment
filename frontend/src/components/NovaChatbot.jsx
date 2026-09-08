import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../config/supabaseClient';

const GROQ_API_KEY = import.meta.env.VITE_GROQ_API_KEY;

export default function NovaChatbot({ isOpen, onClose, emailsCount = 0 }) {
  const [prompt, setPrompt] = useState('');
  const [response, setResponse] = useState('');
  const [loading, setLoading] = useState(false);
  
  // Resizable Sidebar State
  const [sidebarWidth, setSidebarWidth] = useState(450);
  const [isDragging, setIsDragging] = useState(false);
  const textareaRef = useRef(null);

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
    setPrompt(e.target.value);
    if (textareaRef.current) {
      textareaRef.current.style.height = '50px'; 
      const scrollHeight = textareaRef.current.scrollHeight;
      textareaRef.current.style.height = `${Math.min(scrollHeight, 250)}px`;
    }
  };

  const generatePost = async () => {
    if (!prompt.trim()) return;
    setLoading(true);
    setResponse('');
    
    // Fetch live dashboard context
    let candidatesContext = "No candidates shortlisted yet.";
    try {
      const { data, error } = await supabase.from('candidates').select('name, job_role, match_score, skills, github_stats');
      if (!error && data && data.length > 0) {
        candidatesContext = data.map(c => 
          `- Name: ${c.name}, Role: ${c.job_role}, Match: ${c.match_score}%, Skills: ${c.skills?.join(', ')}, GitHub/Contact Info: ${c.github_stats?.profileUrl || 'None'}`
        ).join('\n');
      }
    } catch (e) {
      console.warn("Could not fetch candidates for context");
    }

    const systemPrompt = `You are Nova, an intelligent AI HR assistant for HireIQ. 
Your purpose is to answer the user's questions about their recruitment pipeline, OR generate professional LinkedIn job posts if requested.

CURRENT DASHBOARD CONTEXT:
- Resumes/Emails currently in the inbox waiting to be scanned: ${emailsCount}
- Shortlisted Candidates Database:
${candidatesContext}

RULES:
1. Answer questions about the candidates based ONLY on the context provided above.
2. If asked about contact info or GitHub, provide the URL from the context.
3. If the user asks you to write a job post, create a short, professional LinkedIn post with emojis.
4. Be conversational, helpful, and concise.`;
    
    const userMessage = prompt;

    try {
      // Trying Local Ollama first
      const ollamaRes = await fetch("http://localhost:11434/v1/chat/completions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "llama3.2:3b",
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userMessage }
          ],
          temperature: 0.7
        })
      });

      if (ollamaRes.ok) {
        const data = await ollamaRes.json();
        setResponse(data.choices[0].message.content);
        setLoading(false);
        return;
      }
    } catch (e) {
      console.log("Local Ollama failed, falling back to Groq");
    }

    try {
      // Fallback to Groq
      const groqRes = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${GROQ_API_KEY}`
        },
        body: JSON.stringify({
          model: "llama3-8b-8192", 
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userMessage }
          ],
          temperature: 0.7
        })
      });
      
      const groqData = await groqRes.json();
      
      if (groqRes.ok && groqData.choices) {
        setResponse(groqData.choices[0].message.content);
      } else {
        setResponse(`Error: ${groqData.error?.message || "Both Ollama and Groq failed."}`);
      }

    } catch (err) {
      console.error(err);
      setResponse(`Network Error: Both AI services failed.`);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      {/* Optional: Subtle backdrop that can be clicked to close */}
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
            <span style={{ fontSize: '1.5rem' }}>✨</span> Nova: Post Generator
          </h2>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', fontSize: '1.4rem', cursor: 'pointer', transition: 'color 0.2s' }} onMouseOver={e => e.target.style.color='var(--text-primary)'} onMouseOut={e => e.target.style.color='var(--text-secondary)'}>✕</button>
        </div>

        {/* Scrollable Output Area */}
        <div style={{ padding: '24px', flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
          {!response && !loading && (
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
              <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.95rem', lineHeight: '1.6' }}>
                👋 Hi! I'm Nova.<br/>
                Type the details of the job role below, and I'll generate a professional LinkedIn post for you.
              </p>
            </div>
          )}

          {response && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              style={{ display: 'flex', flexDirection: 'column', flex: 1 }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                <h3 style={{ margin: 0, color: 'var(--accent)', fontSize: '1rem' }}>Generated Post:</h3>
                <button 
                  onClick={() => navigator.clipboard.writeText(response)}
                  style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '4px' }}
                  onMouseOver={e => e.target.style.color='var(--text-primary)'} onMouseOut={e => e.target.style.color='var(--text-secondary)'}
                >
                  📋 Copy
                </button>
              </div>
              <div style={{ 
                background: 'var(--bg-card)', padding: '20px', borderRadius: '12px', 
                border: '1px solid var(--glass-border)', color: 'var(--text-primary)',
                fontSize: '0.95rem', lineHeight: '1.6',
                whiteSpace: 'pre-wrap'
              }}>
                {response}
              </div>
            </motion.div>
          )}
        </div>

        {/* Bottom Input Area */}
        <div style={{ padding: '20px 24px', borderTop: '1px solid var(--glass-border)', background: 'var(--bg-deep)' }}>
          <textarea 
            ref={textareaRef}
            value={prompt}
            onChange={handleInput}
            placeholder="e.g. How many CVs in my inbox? or Write a LinkedIn post..."
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
            onClick={generatePost} 
            disabled={loading || !prompt.trim()}
            style={{ width: '100%', padding: '14px', fontSize: '1rem', fontWeight: '600', display: 'flex', justifyContent: 'center', alignItems: 'center' }}
          >
            {loading ? 'Nova is thinking...' : 'Ask Nova / Generate Post'}
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
