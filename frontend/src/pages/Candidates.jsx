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
  const [toastMessage, setToastMessage] = useState(null);
  const [candidateToDelete, setCandidateToDelete] = useState(null);

  const showToast = (text, type = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  };

  useEffect(() => {
    fetchCandidates();
  }, []);

  const fetchCandidates = async () => {
    try {
      const { data, error } = await supabase
        .from('candidates')
        .select('*')
        .order('match_score', { ascending: false });
      
      if (error) throw error;
      
      const ensureArray = (val) => {
        if (Array.isArray(val)) {
          return val.map(item => typeof item === 'string' ? item : JSON.stringify(item));
        }
        if (typeof val === 'string') {
          return val.split(',').map(s => s.trim());
        }
        return [];
      };

      const safeData = (data || []).map(c => ({
        ...c,
        skills: ensureArray(c.skills)
      }));

      setCandidates(safeData);
    } catch (err) {
      console.error(err);
      setErrorMsg(err.message);
    } finally {
      setLoading(false);
    }
  };

  const confirmDelete = async () => {
    if (!candidateToDelete) return;
    
    try {
      const { error } = await supabase.from('candidates').delete().eq('id', candidateToDelete.id);
      if (error) throw error;
      
      setCandidates(prev => prev.filter(c => c.id !== candidateToDelete.id));
      showToast(`${candidateToDelete.name} has been removed.`, 'success');
    } catch (err) {
      showToast(`Error deleting: ${err.message}`, 'error');
    } finally {
      setCandidateToDelete(null);
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
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div className="score-val" style={{ background: 'var(--bg-heavy)', padding: '4px 8px', borderRadius: '6px', fontSize: '0.85rem' }}>
                        {c.match_score}% Match
                      </div>
                      <button 
                        onClick={() => setCandidateToDelete(c)}
                        style={{ background: 'transparent', border: 'none', color: 'var(--red)', cursor: 'pointer', padding: '4px', fontSize: '1.2rem', opacity: 0.7 }}
                        title="Remove candidate"
                        onMouseEnter={(e) => e.target.style.opacity = 1}
                        onMouseLeave={(e) => e.target.style.opacity = 0.7}
                      >
                        🗑️
                      </button>
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

      {/* Toast Notification */}
      {toastMessage && (
        <motion.div
          initial={{ opacity: 0, y: 50, x: '-50%' }}
          animate={{ opacity: 1, y: 0, x: '-50%' }}
          style={{
            position: 'fixed',
            bottom: '40px',
            left: '50%',
            transform: 'translateX(-50%)',
            background: toastMessage.type === 'error' ? 'var(--red)' : 'var(--green)',
            color: '#fff',
            padding: '12px 24px',
            borderRadius: '30px',
            boxShadow: '0 10px 25px rgba(0,0,0,0.2)',
            zIndex: 9999,
            fontWeight: 500,
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
        >
          {toastMessage.type === 'error' ? '⚠️' : '✅'} {toastMessage.text}
        </motion.div>
      )}

      {/* Delete Confirmation Modal */}
      {candidateToDelete && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10000 }}>
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            style={{ background: 'var(--bg-card)', padding: '24px', borderRadius: '12px', width: '90%', maxWidth: '400px', border: '1px solid var(--glass-border)', boxShadow: '0 10px 30px rgba(0,0,0,0.3)' }}
          >
            <h3 style={{ margin: '0 0 12px 0', color: 'var(--text-primary)' }}>Remove Candidate</h3>
            <p style={{ margin: '0 0 24px 0', color: 'var(--text-secondary)' }}>
              Are you sure you want to remove <strong>{candidateToDelete.name}</strong> from your shortlisted candidates? This action cannot be undone.
            </p>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
              <button onClick={() => setCandidateToDelete(null)} className="btn-outline" style={{ padding: '8px 16px', fontSize: '0.9rem' }}>Cancel</button>
              <button onClick={confirmDelete} className="btn-glow" style={{ padding: '8px 16px', fontSize: '0.9rem', background: 'var(--red)', borderColor: 'var(--red)' }}>Yes, Remove</button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
