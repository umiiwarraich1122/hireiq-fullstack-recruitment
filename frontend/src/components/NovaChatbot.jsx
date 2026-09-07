import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// Using API Key from environment variables to bypass GitHub secret scanning
const GROQ_API_KEY = import.meta.env.VITE_GROQ_API_KEY;

export default function NovaChatbot({ isOpen, onClose }) {
  const [prompt, setPrompt] = useState('');
  const [response, setResponse] = useState('');
  const [loading, setLoading] = useState(false);

  const generatePost = async () => {
    if (!prompt.trim()) return;
    setLoading(true);
    setResponse('');
    
    try {
      const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${GROQ_API_KEY}`
        },
        body: JSON.stringify({
          // Using llama3-8b-8192 as it is extremely fast and uses fewer tokens
          model: "llama3-8b-8192",
          messages: [
            { 
              role: "system", 
              content: "You are Nova, an expert HR copywriter. The user will give you rough details for a job opening. Create a short, highly professional, and engaging LinkedIn job post with emojis and bullet points. Keep it under 200 words." 
            },
            { 
              role: "user", 
              content: prompt 
            }
          ],
          max_tokens: 350,
          temperature: 0.7
        })
      });
      
      const data = await res.json();
      if (data.choices && data.choices.length > 0) {
        setResponse(data.choices[0].message.content);
      } else {
        setResponse("Received an empty response. Please try again.");
      }
    } catch (err) {
      console.error(err);
      setResponse("Error generating post. Please check your connection or API limit.");
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
          width: '450px', maxWidth: '100%',
          background: 'var(--bg-deep)', borderLeft: '1px solid var(--glass-border)',
          boxShadow: '-10px 0 40px rgba(0,0,0,0.5)', zIndex: 1000,
          display: 'flex', flexDirection: 'column'
        }}
      >
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

        {/* Scrollable Body Area */}
        <div style={{ padding: '24px', flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
          <div style={{ marginBottom: '24px' }}>
            <p style={{ margin: '0 0 12px 0', color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: '1.5' }}>
              Describe the role you are hiring for, and Nova will generate a professional LinkedIn post for you.
            </p>
            <textarea 
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="e.g. we are hiring an AI engineer for Zylo Software 3 year experience RAG specialization..."
              style={{
                width: '100%', height: '120px', padding: '16px',
                background: 'var(--bg-tab)', border: '1px solid var(--glass-border)',
                borderRadius: '12px', color: 'var(--text-primary)',
                fontFamily: 'inherit', fontSize: '0.95rem', resize: 'none', outline: 'none',
                boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.1)'
              }}
              onFocus={e => e.target.style.borderColor='var(--accent)'}
              onBlur={e => e.target.style.borderColor='var(--glass-border)'}
            />
          </div>

          <button 
            className="btn-glow" 
            onClick={generatePost} 
            disabled={loading || !prompt.trim()}
            style={{ width: '100%', padding: '14px', fontSize: '1rem', fontWeight: '600', display: 'flex', justifyContent: 'center', alignItems: 'center' }}
          >
            {loading ? 'Nova is thinking...' : 'Generate Job Post'}
          </button>

          {response && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              style={{ marginTop: '30px', display: 'flex', flexDirection: 'column', flex: 1 }}
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
                fontSize: '0.95rem', lineHeight: '1.6', flex: 1, overflowY: 'auto',
                whiteSpace: 'pre-wrap'
              }}>
                {response}
              </div>
            </motion.div>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
