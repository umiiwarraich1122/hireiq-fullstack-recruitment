import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../config/supabaseClient';
import Sidebar from '../components/Sidebar';
import { motion, AnimatePresence } from 'framer-motion';

export default function Interviews() {
  const navigate = useNavigate();
  const [interviews, setInterviews] = useState([]);
  const [session, setSession] = useState(null);
  
  const [rescheduleIntv, setRescheduleIntv] = useState(null);
  const [rDate, setRDate] = useState('');
  const [rTime, setRTime] = useState('');
  const [rMode, setRMode] = useState('Virtual');
  const [toastMessage, setToastMessage] = useState(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session: currentSession } }) => {
      if (!currentSession) { navigate('/login'); }
      setSession(currentSession);
    });

    const stored = JSON.parse(localStorage.getItem('hireiq_interviews') || '[]');
    stored.sort((a, b) => new Date(a.date + 'T' + a.time) - new Date(b.date + 'T' + b.time));
    setInterviews(stored);
  }, [navigate]);

  const showToast = (text, type = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 4000);
  };

  const removeInterview = (id) => {
    const updated = interviews.filter(i => i.id !== id);
    setInterviews(updated);
    localStorage.setItem('hireiq_interviews', JSON.stringify(updated));
  };

  const handleReschedule = async () => {
    if (!rDate || !rTime) return;
    
    // Fetch candidate details from supabase for email/phone
    const { data: candidateData } = await supabase
      .from('candidates')
      .select('*')
      .eq('id', rescheduleIntv.candidateId)
      .single();

    let meetLink = rescheduleIntv.meetLink;

    if (rMode === 'Virtual') {
      showToast('Updating Google Meet Link...', 'info');
      try {
        const eventStart = new Date(`${rDate}T${rTime}:00`);
        const eventEnd = new Date(eventStart.getTime() + 60*60*1000);
        const event = {
          summary: `Rescheduled Interview with ${rescheduleIntv.candidateName} - ${rescheduleIntv.jobRole}`,
          start: { dateTime: eventStart.toISOString(), timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone },
          end: { dateTime: eventEnd.toISOString(), timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone },
          conferenceData: {
            createRequest: {
              requestId: `hireiq-${Math.random().toString(36).substring(7)}`,
              conferenceSolutionKey: { type: "hangoutsMeet" }
            }
          }
        };

        const calRes = await fetch("https://www.googleapis.com/calendar/v3/calendars/primary/events?conferenceDataVersion=1", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${session.provider_token}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify(event)
        });
        const calData = await calRes.json();
        if (calData.hangoutLink) {
          meetLink = calData.hangoutLink;
        }
      } catch (e) {
        console.error("Meet error", e);
      }
    } else {
      meetLink = "In-Person Interview (Company Office)";
    }

    // Send Email
    if (candidateData && candidateData.email) {
      const emailLines = [
        `From: ${session.user.email}`,
        `To: ${candidateData.email}`,
        `Subject: Interview Rescheduled: ${rescheduleIntv.jobRole}`,
        "Content-Type: text/plain; charset=utf-8",
        "",
        `Dear ${candidateData.name},`,
        "",
        `Your interview for the role of ${rescheduleIntv.jobRole} has been rescheduled.`,
        `New Date: ${rDate}`,
        `New Time: ${rTime}`,
        "",
        rMode === 'Virtual' ? `Please join using this Google Meet link: ${meetLink}` : `Please visit our company office at the scheduled time.`,
        "",
        "Best regards,",
        "HR Team"
      ];
      const rawEmail = btoa(unescape(encodeURIComponent(emailLines.join("\r\n")))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
      fetch("https://gmail.googleapis.com/gmail/v1/users/me/messages/send", {
        method: "POST",
        headers: { "Authorization": `Bearer ${session.provider_token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ raw: rawEmail })
      });
    }

    // Send WhatsApp
    if (candidateData) {
      const targetPhone = candidateData.whatsapp || candidateData.phone || "03353958839";
      const modeText = rMode === 'Virtual' ? 'Meet Link' : 'Location';
      const waMsg = `Hi ${candidateData.name},\n\nYour interview for ${rescheduleIntv.jobRole} has been rescheduled.\nNew Date: ${rDate}\nNew Time: ${rTime}\n${modeText}: ${meetLink}\n\n- HR Team`;
      fetch("http://127.0.0.1:8000/api/send-whatsapp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: targetPhone, message: waMsg })
      }).catch(e => console.warn(e));
    }

    // Update state
    const updated = interviews.map(i => {
      if (i.id === rescheduleIntv.id) {
        return { ...i, date: rDate, time: rTime, meetLink: meetLink };
      }
      return i;
    });
    updated.sort((a, b) => new Date(a.date + 'T' + a.time) - new Date(b.date + 'T' + b.time));
    setInterviews(updated);
    localStorage.setItem('hireiq_interviews', JSON.stringify(updated));
    
    showToast('Interview rescheduled successfully!');
    setRescheduleIntv(null);
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
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button onClick={() => removeInterview(intv.id)} style={{ background: 'transparent', border: 'none', color: 'var(--red)', cursor: 'pointer', fontSize: '1.2rem', opacity: 0.7 }} title="Cancel Interview">🗑️</button>
                    </div>
                  </div>
                  <div style={{ background: 'var(--bg-tab)', padding: '12px', borderRadius: '8px', border: '1px solid var(--glass-border)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}><span style={{ fontSize: '1.2rem' }}>📅</span><span style={{ color: 'var(--text-primary)', fontWeight: '500' }}>{intv.date}</span></div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><span style={{ fontSize: '1.2rem' }}>⏰</span><span style={{ color: 'var(--text-primary)', fontWeight: '500' }}>{intv.time}</span></div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '8px', wordBreak: 'break-all' }}>{intv.meetLink?.includes('meet') ? 'Virtual' : 'Physical'}: {intv.meetLink}</div>
                  </div>
                  <div style={{ marginTop: 'auto', paddingTop: '12px', display: 'flex', gap: '8px' }}>
                    <button className="btn-outline" style={{ flex: 1, padding: '8px', fontSize: '0.9rem' }} onClick={() => { setRescheduleIntv(intv); setRDate(intv.date); setRTime(intv.time); }}>📅 Reschedule</button>
                    <button className="btn-primary" style={{ flex: 1, padding: '8px', fontSize: '0.9rem' }} onClick={() => navigate(`/interview-room/${intv.id}`)}>🎥 Enter Room</button>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </main>

      {rescheduleIntv && (
        <div className="modal-overlay" style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div className="modal-content" style={{ background: 'var(--bg-card)', padding: '30px', borderRadius: '16px', width: '90%', maxWidth: '400px', border: '1px solid var(--glass-border)' }}>
            <h3 style={{ margin: '0 0 16px 0', color: 'var(--text-primary)' }}>Reschedule Interview</h3>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '20px' }}>For <strong>{rescheduleIntv.candidateName}</strong> ({rescheduleIntv.jobRole})</p>
            
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-primary)' }}>New Date</label>
              <input type="date" value={rDate} onClick={(e) => { try { e.target.showPicker() } catch(err){} }} onChange={e => setRDate(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--glass-border)', background: 'var(--bg-heavy)', color: 'var(--text-primary)' }} />
            </div>
            
            <div style={{ marginBottom: '24px' }}>
              <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-primary)' }}>New Time</label>
              <input type="time" value={rTime} onClick={(e) => { try { e.target.showPicker() } catch(err){} }} onChange={e => setRTime(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--glass-border)', background: 'var(--bg-heavy)', color: 'var(--text-primary)' }} />
            </div>

            <div style={{ marginBottom: '24px' }}>
              <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-primary)' }}>Interview Mode</label>
              <select value={rMode} onChange={e => setRMode(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--glass-border)', background: 'var(--bg-heavy)', color: 'var(--text-primary)' }}>
                <option value="Virtual">Virtual (Google Meet)</option>
                <option value="Physical">Physical (In-Person)</option>
              </select>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
              <button className="btn-outline" onClick={() => setRescheduleIntv(null)} style={{ padding: '8px 16px' }}>Cancel</button>
              <button className="btn-primary" onClick={handleReschedule} style={{ padding: '8px 16px' }}>Update Schedule</button>
            </div>
          </div>
        </div>
      )}

      {/* Toast */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            style={{
              position: 'fixed', bottom: '24px', left: '50%', transform: 'translateX(-50%)',
              background: toastMessage.type === 'error' ? '#ef4444' : toastMessage.type === 'info' ? '#3b82f6' : '#22c55e',
              color: 'white', padding: '12px 24px', borderRadius: '8px', fontWeight: '500',
              boxShadow: '0 4px 12px rgba(0,0,0,0.15)', zIndex: 10000,
              display: 'flex', alignItems: 'center', gap: '8px'
            }}
          >
            {toastMessage.type === 'error' ? '⚠️' : toastMessage.type === 'info' ? 'ℹ️' : '✅'} {toastMessage.text}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

