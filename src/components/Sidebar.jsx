import React, { useState, useEffect } from 'react';
import { authService } from '../services/AuthService';

export default function Sidebar({ user, show, onClose, onLogout, refreshUser }) {
  const [sidebarView, setSidebarView] = useState('menu'); // 'menu' | 'mfa'
  const [mfaEnabled, setMfaEnabled]   = useState(user?.mfaEnabled || false);
  const [mfaStatus, setMfaStatus]     = useState('');
  const [mfaSetup, setMfaSetup]       = useState(null); // { secret, qrCode }
  const [mfaCode, setMfaCode]         = useState('');
  const [backupCodes, setBackupCodes] = useState(null);
  const [busy, setBusy]               = useState(false);
  const [error, setError]             = useState('');
  const [success, setSuccess]         = useState('');

  useEffect(() => {
    setMfaEnabled(user?.mfaEnabled || false);
  }, [user]);

  const initial = (user?.email || 'U').charAt(0).toUpperCase();

  const handleClose = () => {
    setSidebarView('menu');
    setMfaSetup(null);
    setBackupCodes(null);
    setError(''); setSuccess('');
    onClose();
  };

  const handleOpenMfa = () => {
    setSidebarView('mfa');
    setMfaSetup(null);
    setBackupCodes(null);
    setError(''); setSuccess('');
    setMfaCode('');
  };

  const handleEnableMfa = async () => {
    setError(''); setSuccess('');
    setBusy(true);
    try {
      const data = await authService.initMfaSetup();
      setMfaSetup(data);
    } catch (e) { setError(e.message); }
    finally { setBusy(false); }
  };

  const handleActivateMfa = async (e) => {
    e.preventDefault();
    setError(''); setSuccess('');
    setBusy(true);
    try {
      const data = await authService.activateMfa(mfaCode.trim());
      setMfaEnabled(true);
      setMfaSetup(null);
      setMfaCode('');
      if (data.backupCodes) setBackupCodes(data.backupCodes);
      else setSuccess('MFA enabled successfully!');
      refreshUser();
    } catch (e) { setError(e.message); }
    finally { setBusy(false); }
  };

  const handleDisableMfa = async (e) => {
    e.preventDefault();
    setError(''); setSuccess('');
    setBusy(true);
    try {
      await authService.disableMfa(mfaCode.trim());
      setMfaEnabled(false);
      setMfaCode('');
      setSuccess('MFA has been disabled.');
      refreshUser();
    } catch (e) { setError(e.message); }
    finally { setBusy(false); }
  };

  const handleAckBackupCodes = () => {
    setBackupCodes(null);
    setSuccess('MFA is now active on your account.');
  };

  return (
    <>
      {/* Overlay */}
      <div
        className={`sidebar-overlay${show ? ' active' : ''}`}
        onClick={handleClose}
      />

      {/* Sidebar Panel */}
      <div className={`right-sidebar${show ? ' active' : ''}`} id="right-sidebar">

        {/* ── Menu View ── */}
        {sidebarView === 'menu' && (
          <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
            {/* Close button */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', padding: '1rem 1rem 0' }}>
              <button onClick={handleClose} style={{
                background: 'none', border: 'none', color: '#9ca3af',
                fontSize: '1.4rem', cursor: 'pointer', lineHeight: 1
              }}>✕</button>
            </div>

            {/* Profile Section */}
            <div style={{ padding: '1rem 1.5rem 1.5rem', borderBottom: '1px solid var(--border-card)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
                <div className="profile-avatar" style={{ width: 48, height: 48, fontSize: '1.4rem' }}>
                  {initial}
                </div>
                <div>
                  <div style={{ color: '#fff', fontWeight: 600, fontSize: '0.9rem' }}>{user?.email}</div>
                  <span className={`badge ${user?.role === 'Reporter' ? 'badge-open' : 'badge-review'}`} style={{ fontSize: '0.7rem' }}>
                    {user?.role}
                  </span>
                </div>
              </div>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                MFA Status: <span style={{ color: user?.mfaEnabled ? 'var(--success)' : 'var(--warning)' }}>
                  {user?.mfaEnabled ? '🛡️ Enabled' : '⚠️ Disabled'}
                </span>
              </div>
            </div>

            {/* Nav Links */}
            <nav style={{ padding: '1rem 0.5rem', flex: 1 }}>
              <button id="side-nav-mfa" onClick={handleOpenMfa} style={{
                display: 'flex', alignItems: 'center', gap: '0.75rem', width: '100%',
                padding: '0.75rem 1rem', background: 'none', border: 'none',
                color: '#e5e7eb', borderRadius: 8, cursor: 'pointer', fontSize: '0.9rem',
                transition: 'background 0.2s'
              }}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.06)'}
                onMouseLeave={e => e.currentTarget.style.background = 'none'}>
                🔐 Security Settings
              </button>
              <button id="side-nav-my-reports" onClick={() => { handleClose(); document.getElementById('side-nav-my-reports-trigger')?.click(); }}
                style={{
                display: 'flex', alignItems: 'center', gap: '0.75rem', width: '100%',
                padding: '0.75rem 1rem', background: 'none', border: 'none',
                color: '#e5e7eb', borderRadius: 8, cursor: 'pointer', fontSize: '0.9rem',
                transition: 'background 0.2s'
              }}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.06)'}
                onMouseLeave={e => e.currentTarget.style.background = 'none'}>
                📁 My Reports
              </button>
            </nav>

            {/* Logout */}
            <div style={{ padding: '1rem 1.5rem 1.5rem', borderTop: '1px solid var(--border-card)' }}>
              <button id="side-logout-btn" onClick={onLogout} className="btn btn-danger" style={{ width: '100%' }}>
                Logout
              </button>
            </div>
          </div>
        )}

        {/* ── MFA View ── */}
        {sidebarView === 'mfa' && (
          <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflowY: 'auto', padding: '1.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
              <button onClick={() => { setSidebarView('menu'); setError(''); setSuccess(''); setMfaSetup(null); setBackupCodes(null); }}
                style={{ background: 'none', border: 'none', color: '#9ca3af', fontSize: '1.2rem', cursor: 'pointer', lineHeight: 1 }}>
                ←
              </button>
              <h3 style={{ color: '#fff', fontSize: '1.1rem', margin: 0 }}>Security Settings</h3>
              <button onClick={handleClose} style={{
                marginLeft: 'auto', background: 'none', border: 'none',
                color: '#9ca3af', fontSize: '1.2rem', cursor: 'pointer'
              }}>✕</button>
            </div>

            {error   && <div className="alert alert-danger" style={{ marginBottom: '1rem' }}>{error}</div>}
            {success && <div className="alert alert-success" style={{ marginBottom: '1rem' }}>{success}</div>}

            {/* MFA Status */}
            <div className="card" style={{ marginBottom: '1.5rem', padding: '1rem' }}>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginBottom: '1rem' }}
                dangerouslySetInnerHTML={{ __html: mfaEnabled
                  ? '🔒 MFA is currently <strong style="color:var(--success)">ENABLED</strong>.'
                  : '🔓 MFA is currently <strong style="color:var(--danger)">DISABLED</strong>.' }}
              />

              {!mfaEnabled && !mfaSetup && !backupCodes && (
                <button className="btn btn-primary" onClick={handleEnableMfa} disabled={busy} style={{ width: '100%' }}>
                  {busy ? 'Setting up…' : 'Enable MFA'}
                </button>
              )}

              {mfaEnabled && !backupCodes && (
                <form onSubmit={handleDisableMfa}>
                  <div className="form-group" style={{ marginBottom: '0.75rem' }}>
                    <label style={{ fontSize: '0.8rem' }}>Authenticator Code</label>
                    <input type="text" className="form-control" placeholder="000000" maxLength={6} required
                      value={mfaCode} onChange={e => setMfaCode(e.target.value)}
                      style={{ textAlign: 'center', letterSpacing: '0.1em' }} />
                  </div>
                  <button type="submit" className="btn btn-danger" disabled={busy} style={{ width: '100%' }}>
                    {busy ? 'Disabling…' : 'Disable MFA'}
                  </button>
                </form>
              )}
            </div>

            {/* QR Setup */}
            {mfaSetup && !backupCodes && (
              <div className="card" style={{ padding: '1rem', marginBottom: '1rem' }}>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', marginBottom: '1rem' }}>
                  Scan the QR code in Google Authenticator or Authy.
                </p>
                <div style={{ textAlign: 'center', marginBottom: '0.75rem' }}>
                  <img src={mfaSetup.qrCode} alt="MFA QR Code" style={{ maxWidth: '100%', borderRadius: 8 }} />
                  <p style={{ fontFamily: 'monospace', fontSize: '0.85rem', color: '#fff', wordBreak: 'break-all', marginTop: '0.5rem' }}>
                    {mfaSetup.secret}
                  </p>
                </div>
                <form onSubmit={handleActivateMfa}>
                  <div className="form-group" style={{ marginBottom: '0.75rem' }}>
                    <label style={{ fontSize: '0.8rem' }}>Authenticator Code</label>
                    <input type="text" className="form-control" placeholder="000000" maxLength={6} required
                      value={mfaCode} onChange={e => setMfaCode(e.target.value)}
                      style={{ textAlign: 'center', letterSpacing: '0.1em' }} />
                  </div>
                  <button type="submit" className="btn btn-primary" disabled={busy} style={{ width: '100%' }}>
                    {busy ? 'Activating…' : 'Activate MFA'}
                  </button>
                </form>
              </div>
            )}

            {/* Backup Codes */}
            {backupCodes && (
              <div className="card" style={{ padding: '1rem' }}>
                <h4 style={{ color: 'var(--success)', marginBottom: '0.5rem' }}>🔒 MFA Enabled!</h4>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', marginBottom: '1rem' }}>
                  ⚠️ Save these recovery codes safely. They are single-use.
                </p>
                <div style={{
                  background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-card)',
                  borderRadius: 8, padding: '0.8rem', fontFamily: 'monospace', fontSize: '0.9rem',
                  display: 'grid', gap: '0.4rem', textAlign: 'center', color: '#fff'
                }}>
                  {backupCodes.map((c, i) => (
                    <div key={i} style={{ border: '1px dashed rgba(255,255,255,0.15)', padding: '0.4rem', borderRadius: 4, letterSpacing: '0.1em' }}>
                      {c}
                    </div>
                  ))}
                </div>
                <button className="btn btn-secondary" onClick={handleAckBackupCodes} style={{ marginTop: '1rem', width: '100%', fontSize: '0.85rem' }}>
                  I Have Saved the Codes
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
}
