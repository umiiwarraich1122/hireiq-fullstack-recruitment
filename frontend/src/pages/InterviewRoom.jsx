import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../config/supabaseClient';
import { generateInterviewQuestions } from '../utils/aiService';
import Sidebar from '../components/Sidebar';

export default function InterviewRoom() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [interview, setInterview] = useState(null);
  const [meetLink, setMeetLink] = useState('');
  const [questions, setQuestions] = useState(null);
  const [isLoadingQA, setIsLoadingQA] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) navigate('/login');
    });

    const stored = JSON.parse(localStorage.getItem('hireiq_interviews') || '[]');
    const current = stored.find(i => i.id === id);
    if (current) {
      setInterview(current);
      setMeetLink(current.meetLink || '');
    }
  }, [id, navigate]);

  const handleSaveLink = () => {
    const stored = JSON.parse(localStorage.getItem('hireiq_interviews') || '[]');
    const updated = stored.map(i => i.id === id ? { ...i, meetLink } : i);
    localStorage.setItem('hireiq_interviews', JSON.stringify(updated));
    alert('Meeting link saved successfully!');
  };

  const handleGenerateQA = async () => {
    if (!interview) return;
    try {
      setIsLoadingQA(true);
      const qa = await generateInterviewQuestions(interview.jobRole, interview.skills, interview.summary);
      setQuestions(qa);
    } catch (err) {
      console.error(err);
      alert("Failed to generate questions.");
    } finally {
      setIsLoadingQA(false);
    }
  };

  const handleUpdateStatus = (newStatus) => {
    const stored = JSON.parse(localStorage.getItem('hireiq_interviews') || '[]');
    const updated = stored.map(i => i.id === id ? { ...i, status: newStatus } : i);
    localStorage.setItem('hireiq_interviews', JSON.stringify(updated));
    setInterview(prev => ({ ...prev, status: newStatus }));
    alert(`Candidate marked as ${newStatus}!`);
  };

  if (!interview) return <div style={{ color: 'white', padding: '40px', textAlign: 'center' }}>Loading Room...</div>;

  return (
    <div className="dashboard-layout">
      <Sidebar activePage="/interviews" />

      <main className="dash-main">
        <header className="dash-header" style={{ display: 'flex', justifyContent: 'space-between' }}>
          <h2 className="page-title">Interview Room</h2>
        </header>

        <div className="dash-content" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
          
          {/* Candidate Info Side */}
          <div className="dash-card" style={{ background: 'var(--bg-card)' }}>
            <h3 style={{ color: 'var(--text-primary)', marginBottom: '16px' }}>Candidate Details</h3>
            <div style={{ marginBottom: '20px' }}>
              <div style={{ fontSize: '1.5rem', color: 'var(--text-primary)', fontWeight: 'bold' }}>{interview.candidateName}</div>
              <div style={{ color: 'var(--text-secondary)' }}>{interview.jobRole}</div>
            </div>
            
            <div style={{ background: 'var(--bg-heavy)', padding: '16px', borderRadius: '8px', marginBottom: '20px' }}>
              <div style={{ display: 'flex', gap: '12px', marginBottom: '12px' }}>
                <span style={{ color: 'var(--text-secondary)' }}>📅 Date:</span>
                <span style={{ color: 'var(--text-primary)' }}>{interview.date}</span>
              </div>
              <div style={{ display: 'flex', gap: '12px' }}>
                <span style={{ color: 'var(--text-secondary)' }}>⏰ Time:</span>
                <span style={{ color: 'var(--text-primary)' }}>{interview.time}</span>
              </div>
            </div>
            
            <p style={{ color: 'var(--text-secondary)', lineHeight: '1.6' }}>
              Have the candidate's resume ready. You can review their match score and skills in the Candidates tab.
            </p>
          </div>

          {/* Meeting Link Side */}
          <div className="dash-card" style={{ background: 'var(--bg-card)' }}>
            <h3 style={{ color: 'var(--text-primary)', marginBottom: '16px' }}>Video Conference</h3>
            
            <div style={{ marginBottom: '24px', padding: '20px', background: 'rgba(16, 185, 129, 0.1)', borderRadius: '8px', border: '1px solid rgba(16, 185, 129, 0.3)' }}>
              <h4 style={{ color: '#10B981', margin: '0 0 12px 0' }}>✅ Link Auto-Generated</h4>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '16px' }}>
                An invitation email has been sent to the candidate with this link.
              </p>
              
              <div style={{ background: 'var(--bg-heavy)', padding: '12px', borderRadius: '8px', wordBreak: 'break-all', fontFamily: 'monospace', color: 'var(--text-primary)', border: '1px solid var(--glass-border)' }}>
                {meetLink || 'No link generated.'}
              </div>
            </div>

            {meetLink && (
              <div style={{ borderTop: '1px solid var(--glass-border)', paddingTop: '20px' }}>
                <a href={meetLink} target="_blank" rel="noreferrer" className="btn-primary" style={{ display: 'block', textAlign: 'center', textDecoration: 'none', padding: '12px', fontSize: '1.1rem', background: '#10B981', borderColor: '#10B981', marginBottom: '16px' }}>
                  🎥 Join Google Meet
                </a>
              </div>
            )}

            <div style={{ borderTop: '1px solid var(--glass-border)', paddingTop: '20px', marginTop: '10px' }}>
              <h4 style={{ color: 'var(--text-primary)', marginBottom: '12px', fontSize: '1rem' }}>Interview Result</h4>
              {interview.status ? (
                <div style={{ padding: '12px', borderRadius: '8px', textAlign: 'center', fontWeight: 'bold', background: interview.status === 'Passed' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)', color: interview.status === 'Passed' ? '#10B981' : '#EF4444', border: `1px solid ${interview.status === 'Passed' ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)'}` }}>
                  {interview.status === 'Passed' ? '✅ Candidate Passed' : '❌ Candidate Failed'}
                </div>
              ) : (
                <div style={{ display: 'flex', gap: '12px' }}>
                  <button onClick={() => handleUpdateStatus('Passed')} className="btn-primary" style={{ flex: 1, background: '#10B981', borderColor: '#10B981' }}>
                    ✅ Pass
                  </button>
                  <button onClick={() => handleUpdateStatus('Failed')} className="btn-primary" style={{ flex: 1, background: '#EF4444', borderColor: '#EF4444' }}>
                    ❌ Fail
                  </button>
                </div>
              )}
            </div>
          </div>

        </div>

        {/* AI Questions Section */}
        <div className="dash-card" style={{ marginTop: '24px', background: 'var(--bg-card)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h3 style={{ color: 'var(--text-primary)', margin: 0 }}>🤖 AI Interview Assistant</h3>
            {!questions && (
              <button className="btn-glow" onClick={handleGenerateQA} disabled={isLoadingQA} style={{ padding: '8px 16px', fontSize: '0.9rem' }}>
                {isLoadingQA ? 'Generating...' : 'Generate Questions'}
              </button>
            )}
          </div>

          {!questions && !isLoadingQA && (
            <div style={{ padding: '30px', textAlign: 'center', color: 'var(--text-secondary)', background: 'var(--bg-heavy)', borderRadius: '12px', border: '1px dashed var(--glass-border)' }}>
              Click the button above to generate technical questions related to <strong>{interview.jobRole}</strong> to help you evaluate the candidate.
            </div>
          )}

          {isLoadingQA && (
            <div style={{ padding: '30px', textAlign: 'center', color: '#6366f1' }}>
              Generating role-specific questions and answers...
            </div>
          )}

          {questions && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <p style={{ color: 'var(--text-secondary)', marginBottom: '8px' }}>Here are some technical questions you can ask to evaluate their skills:</p>
              {questions.map((q, idx) => (
                <div key={idx} style={{ background: 'var(--bg-tab)', padding: '16px', borderRadius: '8px', border: '1px solid var(--glass-border)' }}>
                  <div style={{ color: 'var(--text-primary)', fontWeight: '600', marginBottom: '8px', fontSize: '1.05rem' }}>
                    <span style={{ color: '#6366f1', marginRight: '8px' }}>Q{idx + 1}:</span>
                    {q.question}
                  </div>
                  <div style={{ color: 'var(--text-secondary)', lineHeight: '1.5', paddingLeft: '32px', borderLeft: '2px solid #10B981', marginLeft: '4px' }}>
                    <span style={{ color: '#10B981', fontWeight: '500', display: 'block', marginBottom: '4px' }}>Answer Key:</span>
                    {q.answer}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </main>
    </div>
  );
}

