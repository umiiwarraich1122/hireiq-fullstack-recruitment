import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import ThemeToggle from '../components/ThemeToggle';
import { useEffect, useState } from 'react';
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

const getEmailBody = (payload) => {
  if (!payload) return 'No content';
  
  // If it's a simple text/html or text/plain
  if (payload.body && payload.body.data) {
    return decodeBase64(payload.body.data);
  }

  // If it has parts (multipart email)
  if (payload.parts && payload.parts.length > 0) {
    // Try to find HTML first
    let part = payload.parts.find(p => p.mimeType === 'text/html');
    if (part && part.body && part.body.data) return decodeBase64(part.body.data);
    
    // Fallback to plain text
    part = payload.parts.find(p => p.mimeType === 'text/plain');
    if (part && part.body && part.body.data) return decodeBase64(part.body.data);
    
    // If nested parts exist
    if (payload.parts[0].parts) {
      return getEmailBody(payload.parts[0]);
    }
  }
  
  return 'Message format not supported for preview.';
};

export default function EmailPage() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [session, setSession] = useState(null);
  const [emails, setEmails] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedEmail, setSelectedEmail] = useState(null);

  useEffect(() => {
    document.body.style.overflow = 'hidden'; // Keep layout fixed for app-like feel
    
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

  const fetchInbox = async (providerToken) => {
    if (!providerToken) return;
    setIsLoading(true);
    try {
      // Fetch latest 10 emails from INBOX
      const searchRes = await fetch(
        "https://gmail.googleapis.com/gmail/v1/users/me/messages?labelIds=INBOX&maxResults=15", 
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
          
          const subject = msgData.payload.headers.find(h => h.name === 'Subject')?.value || 'No Subject';
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
      <main className="dash-main" style={{ display: 'flex', flexDirection: 'column' }}>
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
          <div style={{ width: '400px', borderRight: '1px solid var(--glass-border)', overflowY: 'auto', background: 'var(--bg-card)' }}>
            {isLoading ? (
              <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-secondary)' }}>Syncing inbox...</div>
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
          <div style={{ flex: 1, overflowY: 'auto', padding: '30px', background: 'var(--bg-deep)' }}>
            {selectedEmail ? (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
                <div style={{ marginBottom: '30px', paddingBottom: '20px', borderBottom: '1px solid var(--glass-border)' }}>
                  <h2 style={{ margin: '0 0 10px 0', color: 'var(--text-primary)', fontSize: '1.6rem' }}>{selectedEmail.subject}</h2>
                  <div style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                    <strong>From:</strong> {selectedEmail.sender}
                  </div>
                  <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '4px' }}>
                    {selectedEmail.date}
                  </div>
                </div>
                
                {/* Full Message Body */}
                <div 
                  style={{ color: 'var(--text-primary)', fontSize: '0.95rem', lineHeight: '1.6', background: 'var(--bg-card)', padding: '30px', borderRadius: '12px', border: '1px solid var(--glass-border)' }}
                  dangerouslySetInnerHTML={{ __html: selectedEmail.body }} 
                />
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
