import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import logo from '../components/hireiq_logo.jpg';

export default function Results() {
  const navigate = useNavigate();
  const [interviews, setInterviews] = useState([]);
  const [activeTab, setActiveTab] = useState('passed'); // 'passed' or 'failed'

  useEffect(() => {
    const stored = JSON.parse(localStorage.getItem('hireiq_interviews') || '[]');
    setInterviews(stored);
  }, []);

  const passedCandidates = interviews.filter(i => i.status === 'Passed');
  const failedCandidates = interviews.filter(i => i.status === 'Failed');

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
              {intv.status === 'Passed' ? '✅ Passed' : '❌ Failed'}
            </div>
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
      </main>
    </div>
  );
}
