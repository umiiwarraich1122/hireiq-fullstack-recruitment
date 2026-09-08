import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../config/supabaseClient';
import logo from '../components/hireiq_logo.jpg';
import { motion } from 'framer-motion';

export default function Candidates() {
  const navigate = useNavigate();
  const [candidates, setCandidates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState(null);

  useEffect(() => {
    fetchCandidates();
  }, []);

  const fetchCandidates = async () => {
    try {
      const { data, error } = await supabase
        .from('candidates')
        .select('*')
        .order('match_score', { ascending: false });
      
      if (error) {
        throw error;
      }
      
      setCandidates(data || []);
    } catch (err) {
      console.error(err);
      setErrorMsg(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/login');
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
            <span>📊</span> Overview
          </a>
          <a href="#" className="dash-link" onClick={(e) => { e.preventDefault(); navigate('/emails'); }}>
            <span>📥</span> Inbox
          </a>
          <a href="#" className="dash-link active">
            <span>👥</span> Candidates
          </a>
          <a href="#" className="dash-link">
            <span>💼</span> Open Roles
          </a>
          <a href="#" className="dash-link">
            <span>📈</span> Analytics
          </a>
        </nav>
      </aside>

      {/* Main Content */}
      <main className="dash-main">
        <header className="dash-header" style={{ display: 'flex', justifyContent: 'space-between' }}>
          <h2>Shortlisted Candidates</h2>
          <button className="btn-outline" onClick={handleLogout} style={{ padding: '8px 16px', fontSize: '0.85rem', borderColor: 'var(--red-soft)', color: 'var(--red)' }}>
            Sign Out
          </button>
        </header>

        <div className="dash-content">
          {errorMsg && (
            <div style={{ padding: '16px', background: 'rgba(239, 68, 68, 0.1)', color: '#EF4444', border: '1px solid #EF4444', borderRadius: '8px', marginBottom: '20px' }}>
              <strong>Error fetching candidates:</strong> {errorMsg} 
              <br/><br/>
              <em>Note: Make sure you have created a "candidates" table in your Supabase database with columns: id, name, job_role, match_score, skills (jsonb), summary, github_stats (jsonb).</em>
            </div>
          )}

          {loading ? (
            <div style={{ color: 'var(--text-secondary)' }}>Loading candidates...</div>
          ) : candidates.length === 0 && !errorMsg ? (
            <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-secondary)', background: 'var(--bg-heavy)', borderRadius: '12px', border: '1px dashed var(--glass-border)' }}>
              No candidates shortlisted yet. Go to the Dashboard and scan your inbox to find matches!
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '20px' }}>
              {candidates.map((c, i) => (
                <motion.div 
                  key={c.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className="dash-card"
                  style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <h3 style={{ margin: '0 0 4px 0', color: 'var(--text-primary)' }}>{c.name}</h3>
                      <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{c.job_role}</div>
                    </div>
                    <div className="score-val" style={{ background: 'var(--bg-heavy)', padding: '4px 8px', borderRadius: '6px', fontSize: '0.85rem' }}>
                      {c.match_score}% Match
                    </div>
                  </div>

                  <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: '8px 0', lineHeight: '1.5' }}>
                    {c.summary}
                  </p>

                  {c.skills && c.skills.length > 0 && (
                    <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                      {c.skills.slice(0, 4).map(skill => (
                        <span key={skill} style={{ background: 'var(--bg-card)', border: '1px solid var(--glass-border)', padding: '2px 8px', borderRadius: '4px', fontSize: '0.75rem', color: 'var(--text-primary)' }}>
                          {skill}
                        </span>
                      ))}
                      {c.skills.length > 4 && <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>+{c.skills.length - 4} more</span>}
                    </div>
                  )}

                  {c.github_stats && (
                    <div style={{ marginTop: 'auto', paddingTop: '12px', borderTop: '1px solid var(--glass-border)', display: 'flex', gap: '12px' }}>
                      <span className="tag tag-yellow">⭐ {c.github_stats.totalStars}</span>
                      <span className="tag tag-blue">📚 {c.github_stats.publicRepos}</span>
                      <a href={c.github_stats.profileUrl} target="_blank" rel="noreferrer" style={{ marginLeft: 'auto', color: 'var(--text-primary)', fontSize: '0.85rem', textDecoration: 'none' }}>
                        GitHub ↗
                      </a>
                    </div>
                  )}
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
