import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../config/supabaseClient';
import Sidebar from '../components/Sidebar';
import { motion } from 'framer-motion';

export default function Interviews() {
  const navigate = useNavigate();
  const [interviews, setInterviews] = useState([]);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) { navigate('/login'); }
    });

    const stored = JSON.parse(localStorage.getItem('hireiq_interviews') || '[]');
    stored.sort((a, b) => new Date(a.date + 'T' + a.time) - new Date(b.date + 'T' + b.time));
    setInterviews(stored);
  }, [navigate]);


  const removeInterview = (id) => {
    const updated = interviews.filter(i => i.id !== id);
    setInterviews(updated);
    localStorage.setItem('hireiq_interviews', JSON.stringify(updated));
  };

  return (
    <div className="dashboard-layout">
      <Sidebar activePage="/interviews" />

      <main className="dash-main">
        <header className="dash-header" style={{ display: 'flex', justifyContent: 'space-between' }}>
          <h2 className="page-title">Interview Schedule</h2>
        </header>

        <div className="dash-content">
          {interviews.length === 0 ? (
            <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-secondary)', background: 'var(--bg-heavy)', borderRadius: '12px', border: '1px dashed var(--glass-border)' }}>
              No interviews scheduled yet. Go to Candidates to schedule one!
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '20px' }}>
              {interviews.map((intv, i) => (
                <motion.div key={intv.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }} className="dash-card" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div><h3 style={{ margin: '0 0 4px 0', color: 'var(--text-primary)' }}>{intv.candidateName}</h3><div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{intv.jobRole}</div></div>
                    <div style={{ display: 'flex', gap: '8px' }}><button onClick={() => removeInterview(intv.id)} style={{ background: 'transparent', border: 'none', color: 'var(--red)', cursor: 'pointer', fontSize: '1.2rem', opacity: 0.7 }} title="Cancel Interview">🗑️</button></div>
                  </div>
                  <div style={{ background: 'var(--bg-tab)', padding: '12px', borderRadius: '8px', border: '1px solid var(--glass-border)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}><span style={{ fontSize: '1.2rem' }}>📅</span><span style={{ color: 'var(--text-primary)', fontWeight: '500' }}>{intv.date}</span></div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><span style={{ fontSize: '1.2rem' }}>⏰</span><span style={{ color: 'var(--text-primary)', fontWeight: '500' }}>{intv.time}</span></div>
                  </div>
                  <div style={{ marginTop: 'auto', paddingTop: '12px' }}><button className="btn-primary" style={{ width: '100%', padding: '8px' }} onClick={() => navigate(`/interview-room/${intv.id}`)}>🎥 Open Interview Room</button></div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

