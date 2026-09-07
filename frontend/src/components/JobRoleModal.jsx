import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../config/supabaseClient';

export default function JobRoleModal({ isOpen, onClose, user, onJobAdded }) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    department: '',
    location: '',
    job_type: 'Full-Time',
    description: ''
  });

  if (!isOpen) return null;

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data, error } = await supabase
        .from('job_roles')
        .insert([
          {
            user_id: user.id,
            title: formData.title,
            department: formData.department,
            location: formData.location,
            job_type: formData.job_type,
            description: formData.description,
            status: 'Active'
          }
        ]);

      if (error) throw error;
      
      onJobAdded(); // Refresh dashboard stats
      onClose(); // Close modal
    } catch (err) {
      console.error("Error adding job:", err);
      alert("Failed to add job. Please ensure you have created the 'job_roles' table in Supabase.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      <div style={{
        position: 'fixed', top: 0, left: 0, width: '100%', height: '100vh',
        background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
      }}>
        <motion.div 
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          style={{
            background: 'var(--bg-heavy)', border: '1px solid var(--glass-border)',
            borderRadius: '20px', width: '90%', maxWidth: '550px',
            padding: '30px', boxShadow: '0 25px 50px rgba(0,0,0,0.5)'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
            <h2 style={{ margin: 0, color: 'var(--text-primary)', fontSize: '1.4rem' }}>
              💼 Create New Job Role
            </h2>
            <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', fontSize: '1.4rem', cursor: 'pointer' }}>✕</button>
          </div>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '6px', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Job Title *</label>
              <input 
                type="text" name="title" required
                value={formData.title} onChange={handleChange}
                placeholder="e.g. Senior AI Engineer"
                style={{ width: '100%', padding: '12px', background: 'var(--bg-tab)', border: '1px solid var(--glass-border)', borderRadius: '8px', color: 'var(--text-primary)', outline: 'none' }}
              />
            </div>

            <div style={{ display: 'flex', gap: '16px' }}>
              <div style={{ flex: 1 }}>
                <label style={{ display: 'block', marginBottom: '6px', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Department</label>
                <input 
                  type="text" name="department"
                  value={formData.department} onChange={handleChange}
                  placeholder="e.g. Engineering"
                  style={{ width: '100%', padding: '12px', background: 'var(--bg-tab)', border: '1px solid var(--glass-border)', borderRadius: '8px', color: 'var(--text-primary)', outline: 'none' }}
                />
              </div>
              <div style={{ flex: 1 }}>
                <label style={{ display: 'block', marginBottom: '6px', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Job Type</label>
                <select 
                  name="job_type" value={formData.job_type} onChange={handleChange}
                  style={{ width: '100%', padding: '12px', background: 'var(--bg-tab)', border: '1px solid var(--glass-border)', borderRadius: '8px', color: 'var(--text-primary)', outline: 'none' }}
                >
                  <option value="Full-Time">Full-Time</option>
                  <option value="Part-Time">Part-Time</option>
                  <option value="Contract">Contract</option>
                  <option value="Internship">Internship</option>
                </select>
              </div>
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '6px', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Location</label>
              <input 
                type="text" name="location"
                value={formData.location} onChange={handleChange}
                placeholder="e.g. Remote, New York, etc."
                style={{ width: '100%', padding: '12px', background: 'var(--bg-tab)', border: '1px solid var(--glass-border)', borderRadius: '8px', color: 'var(--text-primary)', outline: 'none' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '6px', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Job Description</label>
              <textarea 
                name="description" required
                value={formData.description} onChange={handleChange}
                placeholder="Paste the description generated by Nova AI here..."
                style={{ width: '100%', height: '120px', padding: '12px', background: 'var(--bg-tab)', border: '1px solid var(--glass-border)', borderRadius: '8px', color: 'var(--text-primary)', outline: 'none', resize: 'none' }}
              />
            </div>

            <button 
              type="submit" 
              className="btn-glow" 
              disabled={loading}
              style={{ marginTop: '10px', padding: '14px', fontSize: '1rem', fontWeight: '600', display: 'flex', justifyContent: 'center' }}
            >
              {loading ? 'Saving...' : 'Publish Job Role'}
            </button>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
