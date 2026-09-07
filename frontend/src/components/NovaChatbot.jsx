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
      <div style={{
        position: 'fixed', top: 0, left: 0, width: '100%', height: '100vh',
        background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(10px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
      }}>
        <motion.div 
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          style={{
            background: 'var(--bg-heavy)', border: '1px solid var(--glass-border)',
            borderRadius: '20px', width: '90%', maxWidth: '600px',
            padding: '30px', boxShadow: '0 25px 50px rgba(0,0,0,0.5)'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h2 style={{ margin: 0, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ fontSize: '1.5rem' }}>✨</span> Nova: Job Post Generator
            </h2>
            <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', fontSize: '1.2rem', cursor: 'pointer' }}>✕</button>
          </div>

          <div style={{ marginBottom: '20px' }}>
            <p style={{ margin: '0 0 10px 0', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
              Describe the role you are hiring for, and Nova will generate a professional LinkedIn post for you.
            </p>
            <textarea 
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="e.g. we are hiring a ai enginer for zylo software 3 year expiernace rag spicaltaiztion"
              style={{
                width: '100%', height: '100px', padding: '12px',
                background: 'var(--bg-tab)', border: '1px solid var(--glass-border)',
                borderRadius: '12px', color: 'var(--text-primary)',
                fontFamily: 'inherit', resize: 'none', outline: 'none'
              }}
            />
          </div>

          <button 
            className="btn-glow" 
            onClick={generatePost} 
            disabled={loading || !prompt.trim()}
            style={{ width: '100%', padding: '12px', display: 'flex', justifyContent: 'center', alignItems: 'center' }}
          >
            {loading ? 'Nova is thinking...' : 'Generate Job Post'}
          </button>

          {response && (
            <div style={{ marginTop: '24px' }}>
              <h3 style={{ margin: '0 0 10px 0', color: 'var(--accent)', fontSize: '1rem' }}>Generated Post:</h3>
              <div style={{ 
                background: 'var(--bg-card)', padding: '20px', borderRadius: '12px', 
                border: '1px solid var(--glass-border)', color: 'var(--text-primary)',
                fontSize: '0.95rem', lineHeight: '1.6', maxHeight: '250px', overflowY: 'auto',
                whiteSpace: 'pre-wrap'
              }}>
                {response}
              </div>
              <button 
                className="btn-outline"
                onClick={() => navigator.clipboard.writeText(response)}
                style={{ marginTop: '12px', width: '100%', padding: '10px' }}
              >
                📋 Copy to Clipboard
              </button>
            </div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
