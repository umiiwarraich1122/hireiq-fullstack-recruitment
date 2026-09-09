import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../config/supabaseClient';
import logo from '../components/hireiq_logo.jpg';

export default function InterviewRoom() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [interview, setInterview] = useState(null);
  const [meetLink, setMeetLink] = useState('');

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) navigate('/login');
    });

    const stored = JSON.parse(localStorage.getItem('hireiq_interviews') || '[]');
    const current = stored.find(i => i.id === id);
    if (current) {
      setInterview(current);
      setMeetLink(current.meetLink || '');
    }
  }, [id, navigate]);

  const handleSaveLink = () => {
    const stored = JSON.parse(localStorage.getItem('hireiq_interviews') || '[]');
    const updated = stored.map(i => i.id === id ? { ...i, meetLink } : i);
    localStorage.setItem('hireiq_interviews', JSON.stringify(updated));
    alert('Meeting link saved successfully!');
  };

  if (!interview) return <div style={{ color: 'white', padding: '40px', textAlign: 'center' }}>Loading Room...</div>;

  return (
    <div className="dashboard-layout">
      <aside className="dash-sidebar">
        <div className="nav-logo" style={{ marginBottom: '40px', cursor: 'pointer' }} onClick={() => navigate('/')}>
          <img src={logo} alt="HireIQ Logo" className="logo-img" />
          <span>HireIQ</span>
        </div>
        <nav className="dash-nav">
          <a href="#" className="dash-link" onClick={(e) => { e.preventDefault(); navigate('/dashboard'); }}><span>📊</span> Overview</a>
          <a href="#" className="dash-link" onClick={(e) => { e.preventDefault(); navigate('/interviews'); }}><span>⬅️</span> Back to Schedule</a>
        </nav>
      </aside>

      <main className="dash-main">
        <header className="dash-header" style={{ display: 'flex', justifyContent: 'space-between' }}>
          <h2>Interview Room</h2>
        </header>

        <div className="dash-content" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
          
          {/* Candidate Info Side */}
          <div className="dash-card" style={{ background: 'var(--bg-card)' }}>
            <h3 style={{ color: 'var(--text-primary)', marginBottom: '16px' }}>Candidate Details</h3>
            <div style={{ marginBottom: '20px' }}>
              <div style={{ fontSize: '1.5rem', color: 'var(--text-primary)', fontWeight: 'bold' }}>{interview.candidateName}</div>
              <div style={{ color: 'var(--text-secondary)' }}>{interview.jobRole}</div>
            </div>
            
            <div style={{ background: 'var(--bg-heavy)', padding: '16px', borderRadius: '8px', marginBottom: '20px' }}>
              <div style={{ display: 'flex', gap: '12px', marginBottom: '12px' }}>
                <span style={{ color: 'var(--text-secondary)' }}>📅 Date:</span>
                <span style={{ color: 'var(--text-primary)' }}>{interview.date}</span>
              </div>
              <div style={{ display: 'flex', gap: '12px' }}>
                <span style={{ color: 'var(--text-secondary)' }}>⏰ Time:</span>
                <span style={{ color: 'var(--text-primary)' }}>{interview.time}</span>
              </div>
            </div>
            
            <p style={{ color: 'var(--text-secondary)', lineHeight: '1.6' }}>
              Have the candidate's resume ready. You can review their match score and skills in the Candidates tab.
            </p>
          </div>

          {/* Meeting Link Side */}
          <div className="dash-card" style={{ background: 'var(--bg-card)' }}>
            <h3 style={{ color: 'var(--text-primary)', marginBottom: '16px' }}>Video Conference</h3>
            
            <div style={{ marginBottom: '24px', padding: '20px', background: 'rgba(16, 185, 129, 0.1)', borderRadius: '8px', border: '1px solid rgba(16, 185, 129, 0.3)' }}>
              <h4 style={{ color: '#10B981', margin: '0 0 12px 0' }}>✅ Link Auto-Generated</h4>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '16px' }}>
                An invitation email has been sent to the candidate with this link.
              </p>
              
              <div style={{ background: 'var(--bg-heavy)', padding: '12px', borderRadius: '8px', wordBreak: 'break-all', fontFamily: 'monospace', color: 'var(--text-primary)', border: '1px solid var(--glass-border)' }}>
                {meetLink || 'No link generated.'}
              </div>
            </div>

            {meetLink && (
              <div style={{ borderTop: '1px solid var(--glass-border)', paddingTop: '20px' }}>
                <a href={meetLink} target="_blank" rel="noreferrer" className="btn-primary" style={{ display: 'block', textAlign: 'center', textDecoration: 'none', padding: '12px', fontSize: '1.1rem', background: '#10B981', borderColor: '#10B981' }}>
                  🎥 Join Google Meet
                </a>
              </div>
            )}
          </div>

        </div>
      </main>
    </div>
  );
}

