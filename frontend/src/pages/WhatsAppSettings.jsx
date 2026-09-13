import React, { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar';

export default function WhatsAppSettings() {
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(false);
  const [qrKey, setQrKey] = useState(Date.now());

  // Poll status every 3 seconds
  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, 3000);
    return () => clearInterval(interval);
  }, []);

  const fetchStatus = async () => {
    try {
      const res = await fetch("http://127.0.0.1:8000/api/whatsapp/status");
      const data = await res.json();
      setStatus(data);
    } catch (err) {
      console.error(err);
      setStatus({ status: 'ERROR' });
    }
  };

  const startSession = async () => {
    setLoading(true);
    try {
      await fetch("http://127.0.0.1:8000/api/whatsapp/start", { method: "POST" });
      setQrKey(Date.now()); // Refresh QR image
      fetchStatus();
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  const stopSession = async () => {
    setLoading(true);
    try {
      await fetch("http://127.0.0.1:8000/api/whatsapp/stop", { method: "POST" });
      fetchStatus();
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  return (
    <div className="layout">
      <Sidebar activePage="/whatsapp" />
      <main className="main-content">
        <h2 className="page-title">WhatsApp Integration</h2>
        <div className="card" style={{ maxWidth: '600px', padding: '40px', textAlign: 'center' }}>
          
          {(!status || status.status === 'ERROR') && (
            <div>
              <h3>Connecting to WhatsApp Server...</h3>
              <p style={{ color: 'var(--text-secondary)' }}>Please ensure Docker WAHA is running.</p>
            </div>
          )}

          {(status?.status === 'STOPPED' || status?.status === 'NOT_FOUND') && (
            <div>
              <div style={{ fontSize: '3rem', marginBottom: '10px' }}>📱</div>
              <h3 style={{ marginBottom: '10px' }}>WhatsApp is Disconnected</h3>
              <p style={{ color: 'var(--text-secondary)', marginBottom: '20px' }}>Start the session to generate a QR code and connect your device.</p>
              <button className="btn-primary" onClick={startSession} disabled={loading}>
                {loading ? 'Starting...' : 'Start Session & Get QR'}
              </button>
            </div>
          )}

          {status?.status === 'STARTING' && (
            <div>
              <div className="spinner" style={{ margin: '0 auto 20px', width: '40px', height: '40px', border: '4px solid rgba(255,255,255,0.1)', borderTopColor: 'var(--accent)', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
              <h3>Starting WhatsApp Service...</h3>
              <p style={{ color: 'var(--text-secondary)' }}>Please wait a few seconds...</p>
            </div>
          )}

          {status?.status === 'SCAN_QR_CODE' && (
            <div>
              <h3 style={{ marginBottom: '10px', color: 'var(--accent)' }}>Scan QR Code</h3>
              <p style={{ color: 'var(--text-secondary)', marginBottom: '20px' }}>Open WhatsApp on your phone {"->"} Linked Devices {"->"} Link a Device.</p>
              
              <div style={{ background: '#fff', padding: '20px', borderRadius: '12px', display: 'inline-block', marginBottom: '20px' }}>
                <img 
                  src={`http://127.0.0.1:8000/api/whatsapp/qr?t=${qrKey}`} 
                  alt="WhatsApp QR Code" 
                  style={{ width: '250px', height: '250px' }}
                  onError={(e) => { e.target.style.display = 'none'; }}
                />
              </div>
              <br />
              <button className="btn-outline" onClick={() => setQrKey(Date.now())}>Refresh QR Code</button>
            </div>
          )}

          {status?.status === 'WORKING' && (
            <div>
              <div style={{ fontSize: '4rem', marginBottom: '10px' }}>✅</div>
              <h3 style={{ color: 'var(--green)', marginBottom: '10px' }}>Connected Successfully!</h3>
              <p style={{ color: 'var(--text-secondary)', marginBottom: '20px' }}>
                HireIQ can now send automated WhatsApp invitations and updates to candidates.
              </p>
              <button className="btn-outline" onClick={stopSession} disabled={loading} style={{ borderColor: 'var(--red)', color: 'var(--red)' }}>
                {loading ? 'Disconnecting...' : 'Disconnect WhatsApp'}
              </button>
            </div>
          )}

        </div>
      </main>
      <style>{`
        @keyframes spin { 100% { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
