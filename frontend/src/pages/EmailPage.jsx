import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import ThemeToggle from '../components/ThemeToggle';
import { useEffect, useState, useRef } from 'react';
import logo from '../components/logo.jpg';
import { supabase } from '../config/supabaseClient';

// Helper to decode Base64Url from Gmail API
const decodeBase64 = (data) => {
  if (!data) return '';
  try {
    return decodeURIComponent(escape(window.atob(data.replace(/-/g, '+').replace(/_/g, '/'))));
  } catch (e) {
    return 'Error decoding message';
  }
};

// Enhanced helper to recursively find the best email body (prefers HTML over Plain Text)
const getEmailBody = (payload) => {
  let bodyHTML = '';
  let bodyText = '';
  
  const findBody = (part) => {
    if (part.mimeType === 'text/html' && part.body && part.body.data) {
      bodyHTML = decodeBase64(part.body.data);
      return true;
    }
    if (part.mimeType === 'text/plain' && part.body && part.body.data) {
      bodyText = decodeBase64(part.body.data);
    }
    if (part.parts) {
      for (let p of part.parts) {
        if (findBody(p)) return true;
      }
    }
    return false;
  };

  if (payload) findBody(payload);
  
  if (!bodyHTML && !bodyText && payload.body && payload.body.data) {
    bodyHTML = decodeBase64(payload.body.data);
  }
  
  return bodyHTML || bodyText || 'Message format not supported for preview.';
};

export default function EmailPage() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [session, setSession] = useState(null);
  const [emails, setEmails] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedEmail, setSelectedEmail] = useState(null);

  useEffect(() => {
    document.body.style.overflow = 'hidden'; 
    
    const fetchUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) navigate('/login');
      else {
        setUser(session.user);
        setSession(session);
        fetchInbox(session.provider_token);
      }
    };
    fetchUser();
  }, [navigate]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/login');
  };

  const [errorMsg, setErrorMsg] = useState('');

  const fetchInbox = async (providerToken) => {
    if (!providerToken) {
      setErrorMsg('Gmail connection expired. Please Sign Out and Sign In again to read your emails.');
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    setErrorMsg('');
    try {
      const searchRes = await fetch(
        "https://gmail.googleapis.com/gmail/v1/users/me/messages?labelIds=INBOX&maxResults=20", 
        { headers: { Authorization: `Bearer ${providerToken}` } }
      );
      const searchData = await searchRes.json();
      
      if (!searchData.messages) {
        setEmails([]);
        setIsLoading(false);
        return;
      }

      const emailDetails = await Promise.all(
        searchData.messages.map(async (msg) => {
          const msgRes = await fetch(
            `https://gmail.googleapis.com/gmail/v1/users/me/messages/${msg.id}?format=full`,
            { headers: { Authorization: `Bearer ${providerToken}` } }
          );
          const msgData = await msgRes.json();
          
          const subject = msgData.payload.headers.find(h => h.name === 'Subject')?.value || '(No Subject)';
          const sender = msgData.payload.headers.find(h => h.name === 'From')?.value || 'Unknown Sender';
          const date = msgData.payload.headers.find(h => h.name === 'Date')?.value || '';
          
          return { 
            id: msg.id, 
            subject, 
            sender: sender.replace(/"/g, ''), 
            date, 
            snippet: msgData.snippet,
            body: getEmailBody(msgData.payload)
          };
        })
      );
      setEmails(emailDetails);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  if (!user) return <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-primary)' }}>Loading Inbox...</div>;

  return (
    <div className="dashboard-layout" style={{ height: '100vh', overflow: 'hidden' }}>
      {/* Sidebar */}
      <aside className="dash-sidebar">
        <div className="nav-logo" style={{ marginBottom: '40px', cursor: 'pointer' }} onClick={() => navigate('/')}>
          <img src={logo} alt="HireIQ Logo" className="logo-img" />
          <span>HireIQ</span>
        </div>
        <nav className="dash-nav">
          <a href="#" className="dash-link" onClick={(e) => { e.preventDefault(); navigate('/dashboard'); }}>
            <span>⊞</span> Overview
          </a>
          <a href="#" className="dash-link active">
            <span>✉️</span> Inbox
          </a>
          <a href="#" className="dash-link">
            <span>👥</span> Candidates
          </a>
          <a href="#" className="dash-link">
            <span>💼</span> Open Roles
          </a>
          <a href="#" className="dash-link">
            <span>📊</span> Analytics
          </a>
        </nav>
      </aside>

      {/* Main Content Area */}
      <main className="dash-main" style={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
        <header className="dash-header">
          <div>
            <h1 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 700 }}>HR Inbox</h1>
            <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Read and manage all candidate communications directly.</p>
          </div>
          <div className="dash-header-actions">
            <ThemeToggle />
            <button className="btn-outline" onClick={handleLogout} style={{ padding: '10px 16px', fontSize: '0.85rem', borderColor: 'var(--red-soft)', color: 'var(--red)' }}>
              Sign Out
            </button>
            <div className="user-avatar">
              <img src={user.user_metadata?.avatar_url || '/images/umair.jpg'} alt="User" />
            </div>
          </div>
        </header>

        {/* Two-pane Email Layout */}
        <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
          
          {/* Email List Pane */}
          <div className="email-list" style={{ width: '400px', borderRight: '1px solid var(--glass-border)', overflowY: 'auto', background: 'var(--bg-card)', flexShrink: 0 }}>
          {isLoading ? (
            <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-secondary)' }}>Loading your inbox...</div>
          ) : errorMsg ? (
            <div style={{ padding: '20px', textAlign: 'center', color: 'var(--red)' }}>
              ⚠️ {errorMsg}
              <br/><br/>
              <button className="btn-outline" onClick={handleLogout} style={{ borderColor: 'var(--red)', color: 'var(--red)', margin: '0 auto' }}>Sign Out</button>
            </div>
          ) : emails.length === 0 ? (
            <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-secondary)' }}>No emails found.</div>
          ) : (
            emails.map((email) => (
                <div 
                  key={email.id} 
                  onClick={() => setSelectedEmail(email)}
                  style={{ 
                    padding: '16px 20px', 
                    borderBottom: '1px solid var(--glass-border)', 
                    cursor: 'pointer',
                    background: selectedEmail?.id === email.id ? 'var(--glass)' : 'transparent',
                    transition: 'background 0.2s'
                  }}
                >
                  <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.95rem', marginBottom: '4px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {email.sender.split('<')[0].trim()}
                  </div>
                  <div style={{ fontWeight: 500, color: 'var(--accent)', fontSize: '0.85rem', marginBottom: '6px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {email.subject}
                  </div>
                  <div style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                    {email.snippet}
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Email View Pane */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: 'var(--bg-deep)', overflow: 'hidden' }}>
            {selectedEmail ? (
              <motion.div 
                key={selectedEmail.id}
                initial={{ opacity: 0 }} 
                animate={{ opacity: 1 }} 
                transition={{ duration: 0.3 }}
                style={{ display: 'flex', flexDirection: 'column', height: '100%', padding: '20px' }}
              >
                {/* Email Header */}
                <div style={{ marginBottom: '20px', paddingBottom: '16px', borderBottom: '1px solid var(--glass-border)', flexShrink: 0 }}>
                  <h2 style={{ margin: '0 0 10px 0', color: 'var(--text-primary)', fontSize: '1.4rem' }}>{selectedEmail.subject}</h2>
                  <div style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                    <strong>From:</strong> {selectedEmail.sender}
                  </div>
                  <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '4px' }}>
                    {selectedEmail.date}
                  </div>
                </div>
                
                {/* Full Message Body in an Iframe to isolate CSS and fix images */}
                <div style={{ flex: 1, borderRadius: '8px', overflow: 'hidden', border: '1px solid var(--glass-border)', background: '#ffffff' }}>
                  <iframe 
                    title="Email Content"
                    srcDoc={selectedEmail.body}
                    style={{ width: '100%', height: '100%', border: 'none', backgroundColor: '#ffffff' }}
                  />
                </div>
              </motion.div>
            ) : (
              <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)' }}>
                Select an email to read the full message
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
