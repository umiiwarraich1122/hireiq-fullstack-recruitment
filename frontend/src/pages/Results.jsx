import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../config/supabaseClient';
import logo from '../components/hireiq_logo.jpg';

export default function Results() {
  const navigate = useNavigate();
  const [interviews, setInterviews] = useState([]);
  const [activeTab, setActiveTab] = useState('passed'); // 'passed' or 'failed'
  
  // Scheduling Modal
  const [showModal, setShowModal] = useState(false);
  const [selectedCandidate, setSelectedCandidate] = useState(null);
  const [physDate, setPhysDate] = useState('');
  const [physTime, setPhysTime] = useState('');
  const [isSending, setIsSending] = useState(false);

  useEffect(() => {
    const stored = JSON.parse(localStorage.getItem('hireiq_interviews') || '[]');
    setInterviews(stored);
  }, []);

  const passedCandidates = interviews.filter(i => i.status === 'Passed');
  const failedCandidates = interviews.filter(i => i.status === 'Failed');

  const handleOpenSchedule = (intv) => {
    setSelectedCandidate(intv);
    setShowModal(true);
  };

  const handleSendEmail = async () => {
    if (!physDate || !physTime) {
      alert("Please select both date and time.");
      return;
    }
    
    setIsSending(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("No active session");
      if (!session.provider_token) throw new Error("Google access token missing. Please sign out and sign in with Google again.");

      // Fetch candidate email from Supabase
      let candidateEmail = null;
      if (selectedCandidate.candidateId) {
        const { data: candData, error: candErr } = await supabase
          .from('candidates')
          .select('email')
          .eq('id', selectedCandidate.candidateId)
          .single();
        if (!candErr && candData && candData.email) {
          candidateEmail = candData.email;
        }
      }
      
      if (!candidateEmail) {
        candidateEmail = prompt("Could not find candidate email in database. Please enter it manually:");
        if (!candidateEmail) throw new Error("Email is required to send the invitation.");
      }

      const emailLines = [
        `From: ${session.user.email}`,
        `To: ${candidateEmail}`,
        `Subject: Invitation for Physical Interview: ${selectedCandidate.jobRole}`,
        "Content-Type: text/plain; charset=utf-8",
        "",
        `Dear ${selectedCandidate.candidateName},`,
        "",
        `Congratulations! You have passed the online interview for the role of ${selectedCandidate.jobRole}.`,
        "",
        `We would like to invite you for a physical interview. Details are as follows:`,
        `Date: ${physDate}`,
        `Time: ${physTime}`,
        `Location: Zylo Solution, Lahore Phase 6, Sector D`,
        "",
        "We look forward to meeting you in person.",
        "",
        "Best regards,",
        "HR Team"
      ];
      const rawEmail = emailLines.join("\r\n");
      const encodedEmail = btoa(unescape(encodeURIComponent(rawEmail))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
      
      const mailRes = await fetch("https://gmail.googleapis.com/gmail/v1/users/me/messages/send", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${session.provider_token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ raw: encodedEmail })
      });
      const mailData = await mailRes.json();
      if (mailData.error) {
        throw new Error(mailData.error.message);
      }
      
      alert("Physical interview scheduled and email sent successfully!");
      setShowModal(false);
      setPhysDate('');
      setPhysTime('');
    } catch (err) {
      console.error(err);
      alert(`Error: ${err.message}`);
    } finally {
      setIsSending(false);
    }
  };

  const renderList = (list) => {
    if (list.length === 0) {
      return <div style={{ color: 'var(--text-secondary)', padding: '20px', textAlign: 'center' }}>No candidates found in this category.</div>;
    }
    return (
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
        {list.map(intv => (
          <div key={intv.id} className="dash-card" style={{ background: 'var(--bg-card)', border: '1px solid var(--glass-border)' }}>
            <h3 style={{ color: 'var(--text-primary)', margin: '0 0 8px 0' }}>{intv.candidateName}</h3>
            <div style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '16px' }}>
              Role: {intv.jobRole}
            </div>
            
            <div style={{ marginBottom: '16px' }}>
              <div style={{ 
                display: 'inline-block', 
                padding: '6px 12px', 
                borderRadius: '20px', 
                fontSize: '0.85rem', 
                fontWeight: '500',
                background: intv.status === 'Passed' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                color: intv.status === 'Passed' ? '#10B981' : '#EF4444',
                border: `1px solid ${intv.status === 'Passed' ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`
              }}>
                {intv.status === 'Passed' ? '✅ Passed Online' : '❌ Failed Online'}
              </div>
            </div>

            {intv.status === 'Passed' && (
              <button 
                onClick={() => handleOpenSchedule(intv)}
                className="btn-primary" 
                style={{ width: '100%', padding: '8px', fontSize: '0.9rem' }}
              >
                📅 Schedule Physical Interview
              </button>
            )}
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="dashboard-layout">
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
          <a href="#" className="dash-link" onClick={(e) => { e.preventDefault(); navigate('/emails'); }}>
            <span>✉️</span> Inbox
          </a>
          <a href="#" className="dash-link" onClick={(e) => { e.preventDefault(); navigate('/candidates'); }}>
            <span>👥</span> Candidates
          </a>
          <a href="#" className="dash-link" onClick={(e) => { e.preventDefault(); navigate('/interviews'); }}>
            <span>📅</span> Interviews
          </a>
          <a href="#" className="dash-link active">
            <span>✅</span> Results
          </a>
          <a href="#" className="dash-link" onClick={(e) => { e.preventDefault(); navigate('/open-roles'); }}>
            <span>💼</span> Open Roles
          </a>
          <a href="#" className="dash-link" onClick={(e) => { e.preventDefault(); navigate('/analytics'); }}>
            <span>📈</span> Analytics
          </a>
        </nav>
      </aside>

      {/* Main Content */}
      <main className="dash-main">
        <header className="dash-header">
          <div className="header-search">
            <h2>Interview Results</h2>
          </div>
        </header>

        <div className="dash-content">
          <div style={{ display: 'flex', gap: '16px', marginBottom: '24px' }}>
            <button 
              className={activeTab === 'passed' ? 'btn-primary' : 'btn-outline'} 
              onClick={() => setActiveTab('passed')}
              style={{ padding: '8px 24px', flex: 1 }}
            >
              ✅ Passed Candidates ({passedCandidates.length})
            </button>
            <button 
              className={activeTab === 'failed' ? 'btn-primary' : 'btn-outline'} 
              onClick={() => setActiveTab('failed')}
              style={{ padding: '8px 24px', flex: 1, borderColor: activeTab === 'failed' ? '#EF4444' : '', background: activeTab === 'failed' ? '#EF4444' : '' }}
            >
              ❌ Failed Candidates ({failedCandidates.length})
            </button>
          </div>

          <div style={{ padding: '20px', background: 'var(--bg-heavy)', borderRadius: '12px', border: '1px solid var(--glass-border)' }}>
            {activeTab === 'passed' ? renderList(passedCandidates) : renderList(failedCandidates)}
          </div>
        </div>

        {/* Schedule Modal */}
        {showModal && selectedCandidate && (
          <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 999
          }}>
            <div style={{
              background: 'var(--bg-card)', padding: '30px', borderRadius: '12px', width: '90%', maxWidth: '400px',
              border: '1px solid var(--glass-border)'
            }}>
              <h3 style={{ color: 'var(--text-primary)', marginTop: 0 }}>Schedule Physical Interview</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '20px' }}>
                For {selectedCandidate.candidateName} ({selectedCandidate.jobRole})
              </p>
              
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', color: 'var(--text-secondary)', marginBottom: '8px', fontSize: '0.9rem' }}>Date</label>
                <input 
                  type="date" 
                  value={physDate}
                  onChange={e => setPhysDate(e.target.value)}
                  style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--glass-border)', background: 'var(--bg-heavy)', color: 'white' }}
                />
              </div>

              <div style={{ marginBottom: '24px' }}>
                <label style={{ display: 'block', color: 'var(--text-secondary)', marginBottom: '8px', fontSize: '0.9rem' }}>Time</label>
                <input 
                  type="time" 
                  value={physTime}
                  onChange={e => setPhysTime(e.target.value)}
                  style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--glass-border)', background: 'var(--bg-heavy)', color: 'white' }}
                />
              </div>

              <div style={{ display: 'flex', gap: '12px' }}>
                <button 
                  className="btn-outline" 
                  onClick={() => setShowModal(false)}
                  style={{ flex: 1 }}
                >
                  Cancel
                </button>
                <button 
                  className="btn-primary" 
                  onClick={handleSendEmail}
                  disabled={isSending}
                  style={{ flex: 1 }}
                >
                  {isSending ? 'Sending...' : 'Send Invite'}
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
