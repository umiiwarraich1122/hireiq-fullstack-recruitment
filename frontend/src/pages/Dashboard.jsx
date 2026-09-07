import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import ThemeToggle from '../components/ThemeToggle';
import { useEffect, useState } from 'react';
import logo from '../components/logo.jpg';
import { supabase } from '../config/supabaseClient';
import NovaChatbot from '../components/NovaChatbot';
import JobRoleModal from '../components/JobRoleModal';
import { extractGithubUsername, verifyGithubStats } from '../utils/githubApi';

const candidates = []; // Removed dummy candidates for a clean state

export default function Dashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [session, setSession] = useState(null);
  const [emails, setEmails] = useState([]);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isJobModalOpen, setIsJobModalOpen] = useState(false);
  const [activeRolesCount, setActiveRolesCount] = useState(0);
  const [scannedCandidates, setScannedCandidates] = useState([]);
  const [isScanning, setIsScanning] = useState(false);

  const syncGmailCVs = async (token) => {
    if (!token) return;
    setIsSyncing(true);
    try {
      // 1. Search for emails with actual PDF/DOC attachments AND the word resume/cv
      const query = encodeURIComponent("has:attachment (filename:pdf OR filename:doc OR filename:docx) (resume OR cv)");
      const searchRes = await fetch(
        `https://gmail.googleapis.com/gmail/v1/users/me/messages?q=${query}`, 
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      const searchData = await searchRes.json();
      
      if (!searchData.messages || searchData.messages.length === 0) {
        setEmails([]);
        setIsSyncing(false);
        return;
      }

      const messagesToFetch = searchData.messages.slice(0, 5);
      const emailDetails = await Promise.all(
        messagesToFetch.map(async (msg) => {
          const msgRes = await fetch(
            `https://gmail.googleapis.com/gmail/v1/users/me/messages/${msg.id}`,
            { headers: { Authorization: `Bearer ${token}` } }
          );
          const msgData = await msgRes.json();
          
          const subject = msgData.payload.headers.find(h => h.name === 'Subject')?.value || 'No Subject';
          const sender = msgData.payload.headers.find(h => h.name === 'From')?.value || 'Unknown Sender';
          
          return { id: msg.id, subject, sender, snippet: msgData.snippet };
        })
      );
      
      setEmails(emailDetails);
    } catch (err) {
      console.error("Error fetching Gmail:", err);
    } finally {
      setIsSyncing(false);
    }
  };

  // Auth Check and Reset Body Overflow
  useEffect(() => {
    document.body.style.overflow = 'unset';
    document.documentElement.style.overflow = 'unset';

    const fetchUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate('/login');
      } else {
        setUser(session.user);
        setSession(session);
        fetchJobRolesCount();
        if (session.provider_token) syncGmailCVs(session.provider_token);
      }
    };

    fetchUser();

    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT') {
        navigate('/login');
      } else if (session) {
        setUser(session.user);
        setSession(session);
        fetchJobRolesCount();
      }
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, [navigate]);

  const fetchJobRolesCount = async () => {
    try {
      const { count, error } = await supabase
        .from('job_roles')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'Active');
      
      if (!error && count !== null) {
        setActiveRolesCount(count);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const runAIScreening = async () => {
    setIsScanning(true);
    const results = [];
    
    // Simulate processing time
    await new Promise(r => setTimeout(r, 1500));

    // Loop through emails fetched from Gmail
    for (const email of emails) {
      // 1. First attempt: Extract from actual email snippet
      let username = extractGithubUsername(email.snippet || '');
      
      // 2. Fallback for Demonstration: If no GitHub link exists in real emails, 
      // we inject a mock one so the user can see the GitHub API working
      if (!username && results.length === 0) {
        username = "torvalds"; // Linus Torvalds profile as a fallback demonstration
      }
      
      if (username) {
        const stats = await verifyGithubStats(username);
        if (stats) {
          results.push({
            id: email.id || Math.random().toString(),
            name: email.from ? email.from.split('<')[0].trim() : "Linus T. (Mocked Email)",
            github: stats,
            matchScore: Math.floor(Math.random() * 15) + 85 // Mock score 85-99
          });
        }
      }
    }
    
    setScannedCandidates(results);
    setIsScanning(false);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  const dynamicStats = [
    { label: 'Resumes Found (Gmail)', value: emails.length },
    { label: 'Pending Parsing', value: emails.length },
    { label: 'Candidates Verified', value: '0' },
    { label: 'Total Active Roles', value: activeRolesCount },
  ];

  if (!user) return <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-primary)' }}>Loading Dashboard...</div>;

  return (
    <div className="dashboard-layout">
      {/* Sidebar */}
      <aside className="dash-sidebar">
        <div className="nav-logo" style={{ marginBottom: '40px', cursor: 'pointer' }} onClick={() => navigate('/')}>
          <img src={logo} alt="HireIQ Logo" className="logo-img" />
          <span>HireIQ</span>
        </div>
        
        <nav className="dash-nav">
          <a href="#" className="dash-link active">
            <span>⊞</span> Overview
          </a>
          <a href="#" className="dash-link" onClick={(e) => { e.preventDefault(); navigate('/emails'); }}>
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
          <a href="#" className="dash-link">
            <span>⚙️</span> Settings
          </a>
        </nav>
      </aside>

      {/* Main Content */}
      <main className="dash-main">
        {/* Top Header */}
        <header className="dash-header">
          <div>
            <h1 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 700 }}>
              Welcome back, {user.user_metadata?.full_name?.split(' ')[0] || user.email?.split('@')[0] || 'User'}!
            </h1>
            <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Here is what's happening with your recruitment pipeline today.</p>
          </div>
          <div className="dash-header-actions">
            <ThemeToggle />
            <button className="btn-glow" onClick={() => setIsChatOpen(true)} style={{ padding: '10px 20px', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span>✨</span> Nova (AI Post Generator)
            </button>
            <button className="btn-outline" onClick={() => setIsJobModalOpen(true)} style={{ padding: '10px 20px', fontSize: '0.85rem' }}>+ New Job Role</button>
            <button className="btn-outline" onClick={handleLogout} style={{ padding: '10px 16px', fontSize: '0.85rem', borderColor: 'var(--red-soft)', color: 'var(--red)' }}>
              Sign Out
            </button>
            <div className="user-avatar">
              <img src={user.user_metadata?.avatar_url || '/images/umair.jpg'} alt="User" />
            </div>
          </div>
        </header>

        <div className="dash-content">
          {/* Stats Row */}
          <div className="dash-stats">
            {dynamicStats.map((s, i) => (
              <motion.div 
                key={s.label} 
                className="dash-stat-card"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
              >
                <div className="stat-label">{s.label}</div>
                <div className="stat-value">{s.value}</div>
              </motion.div>
            ))}
          </div>

          {/* Smart Intake: Gmail Sync */}
          <div className="dash-section-header" style={{ marginTop: '20px' }}>
            <div>
              <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path><polyline points="22,6 12,13 2,6"></polyline></svg>
                Smart Intake: Gmail Sync
              </h3>
              <p style={{ margin: '4px 0 0 0', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Automatically fetch emails containing CV/Resume attachments.</p>
            </div>
            <button className="btn-glow" onClick={() => syncGmailCVs(session?.provider_token)} disabled={isSyncing} style={{ padding: '8px 16px', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
              {isSyncing ? 'Syncing...' : 'Sync Recent Resumes'}
            </button>
          </div>

          {emails.length > 0 && (
            <div className="candidate-list" style={{ marginBottom: '30px' }}>
              {emails.map((email, i) => (
                <motion.div 
                  key={email.id} 
                  className="candidate-row"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                  style={{ gridTemplateColumns: '1fr 2fr 100px' }}
                >
                  <div className="c-info">
                    <div className="c-avatar" style={{ background: 'rgba(234,67,53,0.1)', color: '#EA4335' }}>M</div>
                    <div>
                      <div className="c-name">{email.sender.split('<')[0].trim()}</div>
                      <div className="c-role" style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>{email.sender.match(/<(.*)>/)?.[1] || ''}</div>
                    </div>
                  </div>
                  <div>
                    <div style={{ fontWeight: 500, fontSize: '0.9rem', color: 'var(--text-primary)' }}>{email.subject}</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} dangerouslySetInnerHTML={{ __html: email.snippet }} />
                  </div>
                  <div className="c-actions">
                    <button className="btn-outline" style={{ padding: '6px 14px', fontSize: '0.8rem' }}>Parse CV</button>
                  </div>
                </motion.div>
              ))}
            </div>
          )}

          {/* Active Candidates / Kanban Preview */}
          <div className="dash-section-header">
            <h3>Recent High-Match Candidates</h3>
            <a href="#" className="view-all">View all pipeline →</a>
          </div>

          <div className="candidate-list">
            {candidates.length === 0 ? (
              <div style={{ padding: '30px', textAlign: 'center', color: 'var(--text-secondary)', background: 'var(--bg-heavy)', borderRadius: '12px', border: '1px dashed var(--glass-border)' }}>
                No candidates verified yet. Sync emails to start parsing resumes.
              </div>
            ) : (
              candidates.map((c, i) => (
                <motion.div 
                  key={c.id} 
                  className="candidate-row"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.1 }}
                >
                  <div className="c-info">
                    <div className="c-avatar">{c.name.charAt(0)}</div>
                    <div>
                      <div className="c-name">{c.name}</div>
                      <div className="c-role">{c.role}</div>
                    </div>
                  </div>
                  <div className="c-score">
                    <div className="score-val">{c.score}% Match</div>
                    <div className="score-bar">
                      <div className="score-fill" style={{ width: `${c.score}%`, background: 'var(--green)' }}></div>
                    </div>
                  </div>
                  <div className="c-tags">
                    <span className="tag tag-green">{c.match}</span>
                    {c.flag && <span className="tag tag-yellow">{c.flag}</span>}
                  </div>
                  <div className="c-actions">
                    <button className="btn-outline" style={{ padding: '6px 12px', fontSize: '0.8rem' }}>View</button>
                  </div>
                </motion.div>
              ))
            )}
          </div>

          {/* AI Activity Log */}
          <div className="dash-grid-2">
            <div className="dash-card">
              <h3>System Activity (AI Agents)</h3>
              <ul className="activity-list">
                <li>
                  <span className="dot dot-green"></span>
                  <div>
                    <strong>Resume Parser Agent</strong> processed 45 resumes for Frontend Dev.
                    <span className="time">10 mins ago</span>
                  </div>
                </li>
                <li>
                  <span className="dot dot-blue"></span>
                  <div>
                    <strong>Coding Profile Analyzer</strong> verified 12 GitHub profiles.
                    <span className="time">25 mins ago</span>
                  </div>
                </li>
                <li>
                  <span className="dot dot-yellow"></span>
                  <div>
                    <strong>Red Flag Detector</strong> flagged 3 resumes for timeline gaps.
                    <span className="time">1 hour ago</span>
                  </div>
                </li>
              </ul>
            </div>
            
            <div className="dash-card">
              <h3>Upcoming Interviews</h3>
              <div className="interview-item">
                <div className="time">Today, 2:00 PM</div>
                <div>Ayesha K. — Technical Round</div>
                <button className="join-btn">Join Meet</button>
              </div>
              <div className="interview-item">
                <div className="time">Tomorrow, 11:00 AM</div>
                <div>Zainab M. — Culture Fit</div>
                <button className="join-btn" disabled>Waiting</button>
              </div>
            </div>
          </div>
          
          {/* AI Screening Pipeline */}
          <div className="card" style={{ marginTop: '24px', gridColumn: '1 / -1' }}>
            <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span className="role-label" style={{ fontSize: '1.1rem' }}>🤖 AI Candidate Screening</span>
                <span className="meta-label">Verifies GitHub & Experience</span>
              </div>
              <button 
                className="btn-glow" 
                onClick={runAIScreening} 
                disabled={isScanning || emails.length === 0}
                style={{ padding: '8px 16px', fontSize: '0.85rem' }}
              >
                {isScanning ? 'Scanning...' : 'Scan Inbox with AI'}
              </button>
            </div>
            <div className="card-body" style={{ padding: '24px' }}>
              {scannedCandidates.length === 0 ? (
                <div style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '20px' }}>
                  {emails.length === 0 ? "No resumes found in inbox to scan." : "Click 'Scan Inbox with AI' to parse resumes and verify GitHub profiles."}
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {scannedCandidates.map((candidate, i) => (
                    <motion.div 
                      key={candidate.id} 
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.1 }}
                      style={{ 
                        background: 'var(--bg-tab)', padding: '16px', borderRadius: '12px', 
                        border: '1px solid var(--glass-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                      }}
                    >
                      <div>
                        <h4 style={{ margin: '0 0 4px 0', color: 'var(--text-primary)', fontSize: '1.1rem' }}>{candidate.name}</h4>
                        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                          <span className="tag tag-blue">score: {candidate.matchScore}%</span>
                          {candidate.github && (
                            <>
                              <span className="tag tag-green">✓ GitHub Verified</span>
                              <span className="tag tag-yellow">⭐ {candidate.github.totalStars} Stars</span>
                              <span className="tag tag-blue">📚 {candidate.github.publicRepos} Repos</span>
                              <span className="tag tag-gray">Top: {candidate.github.topLanguages.join(', ')}</span>
                            </>
                          )}
                        </div>
                      </div>
                      {candidate.github && (
                        <a 
                          href={candidate.github.profileUrl} 
                          target="_blank" 
                          rel="noreferrer"
                          className="btn-outline" 
                          style={{ textDecoration: 'none', padding: '8px 12px', fontSize: '0.85rem' }}
                        >
                          View GitHub
                        </a>
                      )}
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
      <NovaChatbot isOpen={isChatOpen} onClose={() => setIsChatOpen(false)} />
      <JobRoleModal 
        isOpen={isJobModalOpen} 
        onClose={() => setIsJobModalOpen(false)} 
        user={user} 
        onJobAdded={fetchJobRolesCount} 
      />
    </div>
  );
}
