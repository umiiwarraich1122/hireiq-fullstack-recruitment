import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import ThemeToggle from '../components/ThemeToggle';
import { useEffect, useState } from 'react';
import logo from '../components/hireiq_logo.jpg';
import { supabase } from '../config/supabaseClient';
import NovaChatbot from '../components/NovaChatbot';
import JobRoleModal from '../components/JobRoleModal';
import { extractGithubUsername, verifyGithubStats } from '../utils/githubApi';
import { extractTextFromPDFBase64 } from '../utils/pdfParser';
import { analyzeResumeText } from '../utils/aiService';

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
  const [jobRoles, setJobRoles] = useState([]);
  const [selectedJobRole, setSelectedJobRole] = useState('');
  const [scannedCandidates, setScannedCandidates] = useState([]);
  const [isScanning, setIsScanning] = useState(false);
  const [systemActivity, setSystemActivity] = useState([]);

  const addActivity = (agentName, action, color) => {
    setSystemActivity(prev => [
      { id: Date.now() + Math.random(), agentName, action, color, time: new Date().toLocaleTimeString() },
      ...prev
    ].slice(0, 6));
  };

  const getAttachments = (payload) => {
    let attachments = [];
    if (!payload || !payload.parts) return attachments;
    for (let part of payload.parts) {
      if (part.filename && part.body && part.body.attachmentId && part.filename.toLowerCase().endsWith('.pdf')) {
        attachments.push({
          filename: part.filename,
          mimeType: part.mimeType,
          attachmentId: part.body.attachmentId
        });
      }
      if (part.parts) {
        attachments = attachments.concat(getAttachments(part));
      }
    }
    return attachments;
  };

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
          const attachments = getAttachments(msgData.payload);
          
          return { id: msg.id, subject, sender, snippet: msgData.snippet, attachments };
        })
      );
      
      setEmails(emailDetails);
    } catch (error) {
      console.error("Error syncing Gmail:", error);
    } finally {
      setIsSyncing(false);
    }
  };

  // Auth Check and Reset Body Overflow
  useEffect(() => {
    document.body.style.overflow = 'unset';
    document.documentElement.style.overflow = 'unset';

    const fetchUser = async () => {
      const { data: { session }, error } = await supabase.auth.getSession();
      if (error || !session) {
        navigate('/login');
      } else {
        setUser(session.user);
        setSession(session);
        fetchJobRoles();
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
        fetchJobRoles();
      }
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, [navigate]);

  const fetchJobRoles = async () => {
    try {
      const { data, count, error } = await supabase
        .from('job_roles')
        .select('*', { count: 'exact' })
        .eq('status', 'Active');
      
      if (!error && data) {
        setJobRoles(data);
        setActiveRolesCount(count || data.length);
        if (data.length > 0) {
          // If no role is selected yet, default to the first active role
          setSelectedJobRole(prev => prev || data[0].title);
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  const [scanMessage, setScanMessage] = useState(null);
  const [toastMessage, setToastMessage] = useState(null);
  const [shortlistingIds, setShortlistingIds] = useState({});

  const showToast = (text, type = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  };

  const runAIScreening = async () => {
    try {
      setScanMessage({ type: 'info', text: `Starting scan... Found ${emails.length} emails to process.` });
      setIsScanning(true);
      const results = [];
      
      for (const email of emails) {
        if (!email.attachments || email.attachments.length === 0) {
          continue; // Skip emails without PDFs
        }
        
        const attachment = email.attachments[0]; // Process the first PDF attachment
        
        setScanMessage({ type: 'info', text: `Fetching PDF CV for ${email.sender}...` });
        const attRes = await fetch(`https://gmail.googleapis.com/gmail/v1/users/me/messages/${email.id}/attachments/${attachment.attachmentId}`, {
          headers: { Authorization: `Bearer ${session.provider_token}` }
        });
        const attData = await attRes.json();
        
        if (!attData.data) {
          setScanMessage({ type: 'error', text: `Failed to download PDF data for ${email.sender}` });
          continue;
        }

        setScanMessage({ type: 'info', text: `Extracting text from PDF for ${email.sender}...` });
        addActivity('Resume Parser Agent', `Extracted PDF text for ${email.sender.split('<')[0].trim()}`, 'green');
        const pdfText = await extractTextFromPDFBase64(attData.data);
        
        setScanMessage({ type: 'info', text: `Analyzing CV with Local AI (${selectedJobRole || 'Target Role'}) for ${email.sender}...` });
        addActivity('Matching Agent', `Evaluating skills against '${selectedJobRole || "Target Role"}'`, 'blue');
        const aiResult = await analyzeResumeText(pdfText, selectedJobRole || "Software Developer");
        
        let githubStats = null;
        if (aiResult.github_username) {
          setScanMessage({ type: 'info', text: `Verifying GitHub profile: ${aiResult.github_username}...` });
          addActivity('Coding Profile Agent', `Verifying GitHub stats for @${aiResult.github_username}`, 'yellow');
          const ghRes = await verifyGithubStats(aiResult.github_username);
          if (ghRes && ghRes.success) {
            githubStats = ghRes.data;
          }
        }
        
        const ensureArray = (val) => {
          if (Array.isArray(val)) {
            return val.map(item => typeof item === 'string' ? item : JSON.stringify(item));
          }
          if (typeof val === 'string') {
            return val.split(',').map(s => s.trim());
          }
          return [];
        };

        const safeName = typeof aiResult.name === 'string' ? aiResult.name : email.sender.split('<')[0].trim();
        const safeExperience = (aiResult.experience_years !== null && typeof aiResult.experience_years === 'object') 
          ? JSON.stringify(aiResult.experience_years) 
          : aiResult.experience_years;

        results.push({
          id: email.id || Math.random().toString(),
          name: safeName,
          email: typeof aiResult.email === 'string' ? aiResult.email : null,
          phone: typeof aiResult.phone === 'string' ? aiResult.phone : null,
          education: ensureArray(aiResult.education),
          projects: ensureArray(aiResult.projects),
          github: githubStats,
          matchScore: typeof aiResult.match_score === 'number' ? aiResult.match_score : parseInt(aiResult.match_score) || 0,
          targetRole: selectedJobRole || "Software Developer",
          skills: ensureArray(aiResult.skills),
          summary: typeof aiResult.summary === 'string' ? aiResult.summary : "No summary available.",
          experience: safeExperience
        });
      }
      
      setScannedCandidates(results);
      setScanMessage({ type: 'success', text: `Scan complete! Processed ${results.length} resumes.` });
    } catch (err) {
      setScanMessage({ type: 'error', text: `CRITICAL ERROR during scan: ${err.message}` });
      console.error(err);
    } finally {
      setIsScanning(false);
    }
  };

  const [manualGitLink, setManualGitLink] = useState('');
  const testManualGitLink = async () => {
    if (!manualGitLink.trim()) return;
    setIsScanning(true);
    
    // Extract username from link, or just use the input if it's already a username
    const username = extractGithubUsername(manualGitLink) || manualGitLink.replace('https://github.com/', '').replace('/', '').trim();
    
    if (username) {
      const result = await verifyGithubStats(username);
      if (result.success) {
        const stats = result.data;
        setScannedCandidates(prev => [{
          id: Math.random().toString(),
          name: `${stats.username} (Manual Test)`,
          github: stats,
          matchScore: Math.floor(Math.random() * 10) + 90 // 90-99
        }, ...prev]);
      } else {
        showToast(`GitHub API Error for '${username}': ${result.error}`, 'error');
      }
    } else {
      showToast("Please enter a valid GitHub link or username.", 'error');
    }
    
    setIsScanning(false);
    setManualGitLink('');
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  const handleShortlist = async (candidate) => {
    if (shortlistingIds[candidate.id]) return;
    setShortlistingIds(prev => ({ ...prev, [candidate.id]: true }));
    try {
      const { error } = await supabase.from('candidates').insert([{
        name: candidate.name,
        email: candidate.email || null,
        phone: candidate.phone || null,
        job_role: candidate.targetRole || "Candidate",
        match_score: candidate.matchScore,
        skills: candidate.skills,
        education: candidate.education || [],
        projects: candidate.projects || [],
        summary: candidate.summary,
        github_stats: candidate.github
      }]);
      if (error) throw error;
      
      showToast(`${candidate.name} has been shortlisted and saved!`, 'success');
    } catch (err) {
      showToast(`Error: ${err.message}. Make sure to add the new columns (email, phone, education, projects) to Supabase!`, 'error');
    } finally {
      setShortlistingIds(prev => ({ ...prev, [candidate.id]: false }));
    }
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
          <a href="#" className="dash-link" onClick={(e) => { e.preventDefault(); navigate('/candidates'); }}>
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
            {scannedCandidates.filter(c => c.matchScore >= 75).length === 0 ? (
              <div style={{ padding: '30px', textAlign: 'center', color: 'var(--text-secondary)', background: 'var(--bg-heavy)', borderRadius: '12px', border: '1px dashed var(--glass-border)' }}>
                No high-match candidates verified yet. Run AI scan to find top matches!
              </div>
            ) : (
              scannedCandidates
                .filter(c => c.matchScore >= 75)
                .sort((a, b) => b.matchScore - a.matchScore)
                .map((c, i) => (
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
                      <div className="c-role">{c.targetRole || "Candidate"}</div>
                    </div>
                  </div>
                  <div className="c-score">
                    <div className="score-val">{c.matchScore}% Match</div>
                    <div className="score-bar">
                      <div className="score-fill" style={{ width: `${c.matchScore}%`, background: 'var(--green)' }}></div>
                    </div>
                  </div>
                  <div className="c-tags">
                    {c.github && <span className="tag tag-green">GitHub Verified</span>}
                    {c.experience && <span className="tag tag-blue">{c.experience} Yrs Exp</span>}
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
                {systemActivity.length === 0 ? (
                  <li style={{ color: 'var(--text-muted)' }}>Waiting for AI agents to start working...</li>
                ) : (
                  systemActivity.map(activity => (
                    <motion.li 
                      key={activity.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                    >
                      <span className={`dot dot-${activity.color}`}></span>
                      <div>
                        <strong>{activity.agentName}</strong> {activity.action}
                        <span className="time">{activity.time}</span>
                      </div>
                    </motion.li>
                  ))
                )}
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
            <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span className="role-label" style={{ fontSize: '1.1rem' }}>🤖 AI Candidate Screening</span>
                <span className="meta-label">Verifies GitHub & Experience</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                {/* Manual Tester */}
                <input 
                  type="text" 
                  placeholder="Paste GitHub Profile Link or Username"
                  value={manualGitLink}
                  onChange={(e) => setManualGitLink(e.target.value)}
                  style={{
                    padding: '8px 12px', background: 'var(--bg-tab)', border: '1px solid var(--glass-border)',
                    borderRadius: '8px', color: 'var(--text-primary)', outline: 'none', width: '220px', fontSize: '0.85rem'
                  }}
                />
                <button 
                  className="btn-outline" 
                  onClick={() => {
                    if (!manualGitLink.trim()) {
                      setScanMessage({ type: 'error', text: "Please enter a GitHub link or username first." });
                      return;
                    }
                    testManualGitLink();
                  }} 
                  disabled={isScanning}
                  style={{ padding: '8px 16px', fontSize: '0.85rem' }}
                >
                  {isScanning ? 'Checking...' : 'Test Manual Link'}
                </button>
                {/* Job Role Selector */}
                <select 
                  value={selectedJobRole}
                  onChange={(e) => setSelectedJobRole(e.target.value)}
                  style={{
                    padding: '8px 12px', background: 'var(--bg-tab)', border: '1px solid var(--glass-border)',
                    borderRadius: '8px', color: 'var(--text-primary)', outline: 'none', fontSize: '0.85rem'
                  }}
                  title="Target Job Role for AI Match Score"
                >
                  {jobRoles.map(role => (
                    <option key={role.id} value={role.title}>{role.title}</option>
                  ))}
                  {jobRoles.length === 0 && <option value="Software Engineer">Software Engineer (Default)</option>}
                </select>

                <div style={{ width: '1px', height: '24px', background: 'var(--glass-border)', margin: '0 8px' }} />
                {/* Auto Inbox Scanner */}
                <button 
                  className="btn-glow" 
                  onClick={() => {
                    if (emails.length === 0) {
                      setScanMessage({ type: 'error', text: "No resumes found to scan! Please sync your Gmail inbox first by clicking 'Sync Recent Resumes' above." });
                      return;
                    }
                    runAIScreening();
                  }} 
                  disabled={isScanning}
                  style={{ padding: '8px 16px', fontSize: '0.85rem' }}
                >
                  {isScanning ? 'Scanning...' : 'Scan Inbox with AI'}
                </button>
              </div>
            </div>

            {scanMessage && (
              <div style={{
                padding: '12px 16px', marginBottom: '20px', borderRadius: '8px', fontSize: '0.9rem',
                background: scanMessage.type === 'error' ? 'rgba(239, 68, 68, 0.1)' : scanMessage.type === 'success' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(99, 102, 241, 0.1)',
                color: scanMessage.type === 'error' ? '#EF4444' : scanMessage.type === 'success' ? '#10B981' : '#6366f1',
                border: `1px solid ${scanMessage.type === 'error' ? '#EF4444' : scanMessage.type === 'success' ? '#10B981' : '#6366f1'}`
              }}>
                {scanMessage.type === 'error' ? '⚠️ ' : scanMessage.type === 'success' ? '✅ ' : 'ℹ️ '}
                {scanMessage.text}
              </div>
            )}

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
                        border: '1px solid var(--glass-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start'
                      }}
                    >
                      <div style={{ flex: 1 }}>
                        <h4 style={{ margin: '0 0 8px 0', color: 'var(--text-primary)', fontSize: '1.2rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                          {candidate.name}
                          {candidate.github && <span className="tag tag-green" style={{ fontSize: '0.75rem', padding: '2px 8px' }}>✓ Verified</span>}
                        </h4>
                        
                        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '12px' }}>
                          <span className="tag tag-blue" title={`Scored for: ${candidate.targetRole}`}>🤖 Match Score: {candidate.matchScore}%</span>
                          {candidate.experience !== null && candidate.experience !== undefined && (
                            <span className="tag tag-purple">💼 {candidate.experience} Yrs Exp</span>
                          )}
                          {candidate.github && (
                            <>
                              <span className="tag tag-yellow">⭐ {candidate.github.totalStars} Stars</span>
                              <span className="tag tag-blue">📚 {candidate.github.publicRepos} Repos</span>
                              <span className="tag tag-purple">👥 {candidate.github.followers} Followers</span>
                              <span className="tag tag-gray">📅 Active since {candidate.github.createdAt}</span>
                              {candidate.github.location && <span className="tag tag-dark">📍 {candidate.github.location}</span>}
                            </>
                          )}
                        </div>

                        {candidate.summary && (
                          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: '0 0 12px 0', lineHeight: '1.5' }}>
                            {candidate.summary}
                          </p>
                        )}

                        {candidate.skills && candidate.skills.length > 0 && (
                          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '12px' }}>
                            {candidate.skills.slice(0, 6).map(skill => (
                              <span key={skill} style={{ background: 'var(--bg-card)', border: '1px solid var(--glass-border)', padding: '2px 8px', borderRadius: '4px', fontSize: '0.75rem', color: 'var(--text-primary)' }}>
                                {skill}
                              </span>
                            ))}
                            {candidate.skills.length > 6 && <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', alignSelf: 'center' }}>+{candidate.skills.length - 6} more</span>}
                          </div>
                        )}

                        {candidate.github && candidate.github.topLanguages && candidate.github.topLanguages.length > 0 && (
                          <div style={{ background: 'var(--bg-heavy)', padding: '12px', borderRadius: '8px', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                            {candidate.github.bio && <div style={{ marginBottom: '8px', fontStyle: 'italic' }}>"{candidate.github.bio}"</div>}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                              <div style={{ fontWeight: 600 }}>Top Languages:</div>
                              <div style={{ display: 'flex', gap: '8px' }}>
                                {candidate.github.topLanguages.map(l => (
                                  <span key={l.name} style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                    <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: l.color }}></span>
                                    {l.name}
                                  </span>
                                ))}
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginLeft: '20px' }}>
                        {candidate.github && (
                          <a 
                            href={candidate.github.profileUrl} 
                            target="_blank" 
                            rel="noreferrer"
                            className="btn-outline" 
                            style={{ padding: '8px 16px', fontSize: '0.85rem', textDecoration: 'none', textAlign: 'center' }}
                          >
                            View GitHub
                          </a>
                        )}
                          <button 
                            className="btn-glow" 
                            onClick={() => handleShortlist(candidate)} 
                            disabled={shortlistingIds[candidate.id]}
                            style={{ 
                              padding: '8px 16px', 
                              fontSize: '0.85rem',
                              opacity: shortlistingIds[candidate.id] ? 0.6 : 1,
                              cursor: shortlistingIds[candidate.id] ? 'not-allowed' : 'pointer',
                              background: shortlistingIds[candidate.id] ? 'var(--bg-heavy)' : 'var(--accent)',
                              borderColor: shortlistingIds[candidate.id] ? 'var(--glass-border)' : 'var(--accent)'
                            }}
                          >
                            {shortlistingIds[candidate.id] ? 'Saving...' : 'Shortlist'}
                          </button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
      <NovaChatbot 
        isOpen={isChatOpen} 
        onClose={() => setIsChatOpen(false)} 
        emailsCount={emails.length} 
        inboxSenders={emails.map(e => e.sender.split('<')[0].trim()).join(', ')}
        user={user} 
      />
      <JobRoleModal 
        isOpen={isJobModalOpen} 
        onClose={() => setIsJobModalOpen(false)} 
        user={user} 
        onJobAdded={fetchJobRoles} 
      />

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
    </div>
  );
}
