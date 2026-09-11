import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../config/supabaseClient';
import Sidebar from '../components/Sidebar';
import JobRoleModal from '../components/JobRoleModal';

export default function OpenRoles() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState(null);
  const [isJobModalOpen, setIsJobModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);
  const [roleToDelete, setRoleToDelete] = useState(null);

  useEffect(() => {
    const fetchUserAndRoles = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate('/login');
      } else {
        setUser(session.user);
        fetchJobRoles();
      }
    };
    fetchUserAndRoles();
  }, [navigate]);

  const fetchJobRoles = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('job_roles')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      setRoles(data || []);
    } catch (err) {
      console.error(err);
      setErrorMsg(err.message);
    } finally {
      setLoading(false);
    }
  };

  const showToast = (text, type = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 3500);
  };

  const confirmDelete = async () => {
    if (!roleToDelete) return;
    try {
      const { error } = await supabase.from('job_roles').delete().eq('id', roleToDelete.id);
      if (error) throw error;
      setRoles(prev => prev.filter(r => r.id !== roleToDelete.id));
      showToast(`${roleToDelete.title} has been deleted.`, 'success');
    } catch (err) {
      showToast(`Error deleting: ${err.message}`, 'error');
    } finally {
      setRoleToDelete(null);
    }
  };

  const toggleStatus = async (role) => {
    const newStatus = role.status === 'Active' ? 'Closed' : 'Active';
    try {
      const { error } = await supabase.from('job_roles').update({ status: newStatus }).eq('id', role.id);
      if (error) throw error;
      setRoles(prev => prev.map(r => r.id === role.id ? { ...r, status: newStatus } : r));
      showToast(`Role marked as ${newStatus}`, 'success');
    } catch (err) {
      showToast(`Error updating status: ${err.message}`, 'error');
    }
  };

  return (
    <div className="dashboard-layout">
      <Sidebar activePage="/open-roles" />

      {/* Main Content */}
      <main className="dash-main">
        <header className="dash-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h2 className="page-title" style={{ margin: 0 }}>Open Roles</h2>
            <p style={{ margin: '4px 0 0 0', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Manage your hiring pipeline</p>
          </div>
          <div style={{ display: 'flex', gap: '12px' }}>
            <button className="btn-glow" onClick={() => setIsJobModalOpen(true)} style={{ padding: '8px 16px', fontSize: '0.9rem' }}>
              + Create Role
            </button>
          </div>
        </header>

        <div className="dash-content">
          {errorMsg && (
            <div style={{ padding: '16px', background: 'rgba(239, 68, 68, 0.1)', color: '#EF4444', border: '1px solid #EF4444', borderRadius: '8px', marginBottom: '20px' }}>
              <strong>Error fetching roles:</strong> {errorMsg}
            </div>
          )}

          {loading ? (
            <div style={{ color: 'var(--text-secondary)' }}>Loading job roles...</div>
          ) : roles.length === 0 && !errorMsg ? (
            <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-secondary)', background: 'var(--bg-heavy)', borderRadius: '12px', border: '1px dashed var(--glass-border)' }}>
              No job roles created yet. Click "+ Create Role" to get started!
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '20px' }}>
              {roles.map((r, i) => (
                <motion.div 
                  key={r.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className="dash-card"
                  style={{ display: 'flex', flexDirection: 'column', gap: '16px', position: 'relative' }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <h3 style={{ margin: '0 0 4px 0', color: 'var(--text-primary)', fontSize: '1.2rem' }}>{r.title}</h3>
                      <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                        {r.department} • {r.location}
                      </div>
                    </div>
                    <span 
                      onClick={() => toggleStatus(r)}
                      style={{ 
                        cursor: 'pointer',
                        padding: '4px 10px', 
                        borderRadius: '20px', 
                        fontSize: '0.75rem', 
                        fontWeight: '600',
                        background: r.status === 'Active' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                        color: r.status === 'Active' ? '#10B981' : '#EF4444',
                        border: `1px solid ${r.status === 'Active' ? '#10B981' : '#EF4444'}`
                      }}
                    >
                      {r.status}
                    </span>
                  </div>

                  <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', margin: 0, lineHeight: '1.5', flex: 1 }}>
                    {r.description ? (r.description.length > 150 ? r.description.substring(0, 150) + '...' : r.description) : 'No description provided.'}
                  </p>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '12px', borderTop: '1px solid var(--glass-border)' }}>
                    <span className="tag tag-blue">{r.job_type}</span>
                    <button 
                      onClick={() => setRoleToDelete(r)}
                      style={{ background: 'transparent', border: 'none', color: 'var(--red)', cursor: 'pointer', fontSize: '0.9rem', opacity: 0.8 }}
                      onMouseEnter={(e) => e.target.style.opacity = 1}
                      onMouseLeave={(e) => e.target.style.opacity = 0.8}
                    >
                      Delete Role
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Modals & Toasts */}
      <JobRoleModal 
        isOpen={isJobModalOpen} 
        onClose={() => setIsJobModalOpen(false)} 
        user={user} 
        onJobAdded={fetchJobRoles} 
      />

      {toastMessage && (
        <motion.div
          initial={{ opacity: 0, y: 50, x: '-50%' }}
          animate={{ opacity: 1, y: 0, x: '-50%' }}
          style={{ position: 'fixed', bottom: '40px', left: '50%', transform: 'translateX(-50%)', background: toastMessage.type === 'error' ? 'var(--red)' : 'var(--green)', color: '#fff', padding: '12px 24px', borderRadius: '30px', boxShadow: '0 10px 25px rgba(0,0,0,0.2)', zIndex: 9999, fontWeight: 500 }}
        >
          {toastMessage.text}
        </motion.div>
      )}

      {roleToDelete && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10000 }}>
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            style={{ background: 'var(--bg-card)', padding: '24px', borderRadius: '12px', width: '90%', maxWidth: '400px', border: '1px solid var(--glass-border)', boxShadow: '0 10px 30px rgba(0,0,0,0.3)' }}
          >
            <h3 style={{ margin: '0 0 12px 0', color: 'var(--text-primary)' }}>Delete Job Role</h3>
            <p style={{ margin: '0 0 24px 0', color: 'var(--text-secondary)' }}>
              Are you sure you want to delete <strong>{roleToDelete.title}</strong>? This action cannot be undone.
            </p>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
              <button onClick={() => setRoleToDelete(null)} className="btn-outline" style={{ padding: '8px 16px', fontSize: '0.9rem' }}>Cancel</button>
              <button onClick={confirmDelete} className="btn-glow" style={{ padding: '8px 16px', fontSize: '0.9rem', background: 'var(--red)', borderColor: 'var(--red)' }}>Yes, Delete</button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
