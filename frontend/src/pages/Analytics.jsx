import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { supabase } from '../config/supabaseClient';
import logo from '../components/hireiq_logo.jpg';

export default function Analytics() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalCandidates: 0,
    totalRoles: 0,
    avgScore: 0,
    topSkills: []
  });

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate('/login');
      } else {
        fetchAnalytics();
      }
    };
    checkAuth();
  }, [navigate]);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const { data: candidates, error: cErr } = await supabase.from('candidates').select('match_score, skills');
      const { data: roles, error: rErr } = await supabase.from('job_roles').select('id');
      
      if (cErr) throw cErr;
      if (rErr) throw rErr;

      const totalCandidates = candidates ? candidates.length : 0;
      const totalRoles = roles ? roles.length : 0;
      
      let totalScore = 0;
      const skillCounts = {};

      if (candidates) {
        candidates.forEach(c => {
          totalScore += (c.match_score || 0);
          
          let cSkills = c.skills;
          if (typeof cSkills === 'string') {
            cSkills = cSkills.split(',').map(s => s.trim());
          }
          if (Array.isArray(cSkills)) {
            cSkills.forEach(s => {
              if (s) {
                const skillName = typeof s === 'string' ? s : JSON.stringify(s);
                skillCounts[skillName] = (skillCounts[skillName] || 0) + 1;
              }
            });
          }
        });
      }

      const avgScore = totalCandidates > 0 ? Math.round(totalScore / totalCandidates) : 0;
      
      const topSkills = Object.entries(skillCounts)
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);

      setStats({ totalCandidates, totalRoles, avgScore, topSkills });
    } catch (err) {
      console.error('Error fetching analytics:', err);
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
          <a href="#" className="dash-link" onClick={(e) => { e.preventDefault(); navigate('/candidates'); }}>
            <span>👥</span> Candidates
          </a>
          <a href="#" className="dash-link" onClick={(e) => { e.preventDefault(); navigate('/open-roles'); }}>
            <span>💼</span> Open Roles
          </a>
          <a href="#" className="dash-link active">
            <span>📈</span> Analytics
          </a>
        </nav>
      </aside>

      {/* Main Content */}
      <main className="dash-main">
        <header className="dash-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h2 style={{ margin: 0 }}>Analytics Overview</h2>
            <p style={{ margin: '4px 0 0 0', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Insights into your recruitment pipeline</p>
          </div>
          <button className="btn-outline" onClick={handleLogout} style={{ padding: '8px 16px', fontSize: '0.85rem', borderColor: 'var(--red-soft)', color: 'var(--red)' }}>
            Sign Out
          </button>
        </header>

        <div className="dash-content">
          {loading ? (
            <div style={{ color: 'var(--text-secondary)' }}>Loading analytics data...</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
              
              {/* Top Stats Cards */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px' }}>
                <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="dash-card" style={{ textAlign: 'center', padding: '24px' }}>
                  <h3 style={{ margin: '0 0 10px 0', color: 'var(--text-secondary)', fontSize: '1rem' }}>Total Candidates</h3>
                  <div style={{ fontSize: '2.5rem', fontWeight: 'bold', color: 'var(--text-primary)' }}>{stats.totalCandidates}</div>
                </motion.div>

                <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="dash-card" style={{ textAlign: 'center', padding: '24px' }}>
                  <h3 style={{ margin: '0 0 10px 0', color: 'var(--text-secondary)', fontSize: '1rem' }}>Active Roles</h3>
                  <div style={{ fontSize: '2.5rem', fontWeight: 'bold', color: 'var(--text-primary)' }}>{stats.totalRoles}</div>
                </motion.div>

                <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="dash-card" style={{ textAlign: 'center', padding: '24px' }}>
                  <h3 style={{ margin: '0 0 10px 0', color: 'var(--text-secondary)', fontSize: '1rem' }}>Avg. Match Score</h3>
                  <div style={{ fontSize: '2.5rem', fontWeight: 'bold', color: 'var(--green)' }}>{stats.avgScore}%</div>
                </motion.div>
              </div>

              {/* Skills Chart / Bars */}
              <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="dash-card">
                <h3 style={{ margin: '0 0 20px 0', color: 'var(--text-primary)', fontSize: '1.2rem' }}>Most Sourced Skills</h3>
                
                {stats.topSkills.length === 0 ? (
                  <p style={{ color: 'var(--text-secondary)', margin: 0 }}>No skills data available yet.</p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    {stats.topSkills.map((skill, index) => {
                      const maxCount = stats.topSkills[0].count;
                      const percentage = (skill.count / maxCount) * 100;
                      
                      return (
                        <div key={skill.name} style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                          <div style={{ width: '120px', color: 'var(--text-secondary)', fontSize: '0.9rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {skill.name}
                          </div>
                          <div style={{ flex: 1, height: '10px', background: 'var(--bg-heavy)', borderRadius: '5px', overflow: 'hidden' }}>
                            <motion.div 
                              initial={{ width: 0 }}
                              animate={{ width: `${percentage}%` }}
                              transition={{ delay: 0.5 + (index * 0.1), duration: 0.8, ease: "easeOut" }}
                              style={{ height: '100%', background: 'linear-gradient(90deg, var(--indigo-soft), var(--indigo))', borderRadius: '5px' }}
                            />
                          </div>
                          <div style={{ width: '40px', textAlign: 'right', color: 'var(--text-primary)', fontWeight: 'bold', fontSize: '0.9rem' }}>
                            {skill.count}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </motion.div>

            </div>
          )}
        </div>
      </main>
    </div>
  );
}
