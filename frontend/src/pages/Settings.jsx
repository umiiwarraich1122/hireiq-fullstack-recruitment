import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../config/supabaseClient';
import { useTheme } from '../context/ThemeContext';
import Sidebar from '../components/Sidebar';

export default function Settings() {
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();
  const [user, setUser] = useState(null);

  useEffect(() => {
    const fetchUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) navigate('/login');
      else setUser(session.user);
    };
    fetchUser();
  }, [navigate]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/login');
  };

  if (!user) return <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-primary)' }}>Loading...</div>;

  return (
    <div className="dashboard-layout">
      <Sidebar activePage="/settings" />

      <main className="dash-main">
        <header className="dash-header">
          <div>
            <h1 className="page-title" style={{ margin: 0, fontSize: '1.5rem', fontWeight: 700 }}>Settings</h1>
            <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Manage your preferences and account</p>
          </div>
        </header>

        <div className="dash-content">
          {/* Profile Section */}
          <div className="settings-section">
            <h3 className="settings-section-title">Profile</h3>
            <div className="settings-card">
              <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                <div className="settings-avatar">
                  <img src={user.user_metadata?.avatar_url || '/images/umair.jpg'} alt="User" />
                </div>
                <div>
                  <div style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                    {user.user_metadata?.full_name || 'User'}
                  </div>
                  <div style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '4px' }}>
                    {user.email}
                  </div>
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', marginTop: '8px', padding: '4px 12px', borderRadius: '20px', background: 'var(--green-soft)', color: 'var(--green)', fontSize: '0.8rem', fontWeight: 600 }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" /></svg>
                    Connected with Google
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Appearance Section */}
          <div className="settings-section">
            <h3 className="settings-section-title">Appearance</h3>
            <div className="settings-card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontWeight: 600, color: 'var(--text-primary)', marginBottom: '4px' }}>Theme</div>
                  <div style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                    Currently using <strong>{theme === 'dark' ? 'Dark' : 'Light'}</strong> mode
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    onClick={() => { if (theme !== 'light') toggleTheme(); }}
                    className={`theme-btn ${theme === 'light' ? 'active' : ''}`}
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="5" /><line x1="12" y1="1" x2="12" y2="3" /><line x1="12" y1="21" x2="12" y2="23" /><line x1="4.22" y1="4.22" x2="5.64" y2="5.64" /><line x1="18.36" y1="18.36" x2="19.78" y2="19.78" /><line x1="1" y1="12" x2="3" y2="12" /><line x1="21" y1="12" x2="23" y2="12" /><line x1="4.22" y1="19.78" x2="5.64" y2="18.36" /><line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
                    </svg>
                    Light
                  </button>
                  <button
                    onClick={() => { if (theme !== 'dark') toggleTheme(); }}
                    className={`theme-btn ${theme === 'dark' ? 'active' : ''}`}
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
                    </svg>
                    Dark
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Account Actions */}
          <div className="settings-section">
            <h3 className="settings-section-title">Account</h3>
            <div className="settings-card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontWeight: 600, color: 'var(--text-primary)', marginBottom: '4px' }}>Sign Out</div>
                  <div style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Sign out of your HireIQ account</div>
                </div>
                <button onClick={handleLogout} className="btn-outline" style={{ padding: '10px 24px', borderColor: 'var(--red-soft)', color: 'var(--red)', fontSize: '0.9rem' }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '8px' }}>
                    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" />
                  </svg>
                  Sign Out
                </button>
              </div>
            </div>
          </div>

          {/* About Section */}
          <div className="settings-section">
            <h3 className="settings-section-title">About</h3>
            <div className="settings-card">
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '4px' }}>Application</div>
                  <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>HireIQ</div>
                </div>
                <div>
                  <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '4px' }}>Version</div>
                  <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>1.0.0</div>
                </div>
                <div style={{ gridColumn: '1 / -1' }}>
                  <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '4px' }}>Built With</div>
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    {['React', 'FastAPI', 'Supabase', 'Ollama', 'Google API'].map(tech => (
                      <span key={tech} style={{ padding: '4px 12px', borderRadius: '20px', background: 'rgba(99,102,241,0.1)', color: 'var(--accent)', fontSize: '0.8rem', fontWeight: 600 }}>
                        {tech}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
