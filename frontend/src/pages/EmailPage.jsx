import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import ThemeToggle from '../components/ThemeToggle';
import { useEffect, useState, useRef } from 'react';
import Sidebar from '../components/Sidebar';
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

  const getEmailBody = (payload) => {
    if (!payload) return "";
    if (payload.body && payload.body.size > 0 && payload.mimeType === "text/html") {
      return atob(payload.body.data.replace(/-/g, '+').replace(/_/g, '/'));
    }
    if (payload.parts) {
      let htmlPart = payload.parts.find(p => p.mimeType === "text/html");
      if (htmlPart && htmlPart.body.data) return atob(htmlPart.body.data.replace(/-/g, '+').replace(/_/g, '/'));
      
      let textPart = payload.parts.find(p => p.mimeType === "text/plain");
      if (textPart && textPart.body.data) return atob(textPart.body.data.replace(/-/g, '+').replace(/_/g, '/'));

      // If nested multipart (like multipart/alternative inside multipart/mixed)
      for (let part of payload.parts) {
        const body = getEmailBody(part);
        if (body) return body;
      }
    }
    return "Could not load email content.";
  };

  const getAttachments = (payload) => {
    let attachments = [];
    if (!payload.parts) return attachments;

    for (let part of payload.parts) {
      if (part.filename && part.body && part.body.attachmentId) {
        attachments.push({
          filename: part.filename,
          mimeType: part.mimeType,
          attachmentId: part.body.attachmentId,
          size: part.body.size
        });
      }
      if (part.parts) {
        attachments = attachments.concat(getAttachments(part));
      }
    }
    return attachments;
  };

  const downloadAttachment = async (messageId, attachmentId, filename, mimeType) => {
    try {
      const res = await fetch(
        `https://gmail.googleapis.com/gmail/v1/users/me/messages/${messageId}/attachments/${attachmentId}`,
        { headers: { Authorization: `Bearer ${session.provider_token}` } }
      );
      const data = await res.json();
      if (data.data) {
        const base64 = data.data.replace(/-/g, '+').replace(/_/g, '/');
        const byteCharacters = atob(base64);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
          byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        const blob = new Blob([byteArray], { type: mimeType });
        
        const link = document.createElement('a');
        link.href = window.URL.createObjectURL(blob);
        link.download = filename;
        link.click();
      }
    } catch (err) {
      console.error("Failed to download attachment:", err);
      alert("Failed to download attachment.");
    }
  };

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
            body: getEmailBody(msgData.payload),
            attachments: getAttachments(msgData.payload)
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
      <Sidebar activePage="/emails" />

      {/* Main Content Area */}
      <main className="dash-main" style={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
        <header className="dash-header">
          <div>
            <h1 className="page-title" style={{ margin: 0, fontSize: '1.5rem', fontWeight: 700 }}>HR Inbox</h1>
            <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Read and manage all candidate communications directly.</p>
          </div>
          <div className="dash-header-actions">
            <ThemeToggle />
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
                  <div style={{ padding: '24px', borderBottom: '1px solid var(--glass-border)' }}>
                    <h2 style={{ margin: '0 0 16px 0', color: 'var(--text-primary)', fontSize: '1.4rem' }}>
                      {selectedEmail.subject}
                    </h2>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div className="avatar" style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'var(--accent)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>
                        {selectedEmail.sender.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div style={{ color: 'var(--text-primary)', fontWeight: '500' }}>{selectedEmail.sender}</div>
                      </div>
                    </div>
                    <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '4px' }}>
                      {selectedEmail.date}
                    </div>
                  </div>

                  {/* Attachments Section */}
                  {selectedEmail.attachments && selectedEmail.attachments.length > 0 && (
                    <div style={{ padding: '16px 24px', borderBottom: '1px solid var(--glass-border)', background: 'var(--bg-tab)' }}>
                      <h4 style={{ margin: '0 0 12px 0', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>📎 Attachments ({selectedEmail.attachments.length})</h4>
                      <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                        {selectedEmail.attachments.map((att, i) => (
                          <button 
                            key={i}
                            className="btn-outline" 
                            onClick={() => downloadAttachment(selectedEmail.id, att.attachmentId, att.filename, att.mimeType)}
                            style={{ padding: '8px 12px', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '6px' }}
                          >
                            <span>📄</span> {att.filename}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {/* Full Message Body in an Iframe to isolate CSS and fix images */}
                  <div style={{ flex: 1, borderRadius: '8px', overflow: 'hidden', border: '1px solid var(--glass-border)', background: '#ffffff', margin: '24px' }}>
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
