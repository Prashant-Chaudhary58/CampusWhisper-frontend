import React, { useState, useRef } from 'react';
import { authService } from '../services/AuthService';

function validatePassword(password) {
  if (!password || password.length < 12) return { score: 0, isValid: false, label: 'Too Short (Min 12)' };
  let score = 0;
  if (password.length >= 12)       score++;
  if (/[A-Z]/.test(password))      score++;
  if (/[a-z]/.test(password))      score++;
  if (/[0-9]/.test(password))      score++;
  if (/[@$!%*?&]/.test(password))  score++;
  const label = score <= 2 ? 'Weak' : score <= 4 ? 'Medium' : 'Strong';
  return { score, isValid: score === 5, label };
}

function StrengthBar({ score }) {
  const cls = score <= 2 ? 'weak' : score <= 4 ? 'medium' : 'strong';
  const count = score <= 2 ? 1 : score <= 4 ? 3 : 4;
  return (
    <div className="strength-meter">
      {[1, 2, 3, 4].map(n => (
        <div key={n} className={`strength-bar${score > 0 && n <= count ? ` ${cls}` : ''}`} />
      ))}
    </div>
  );
}

// MFA modes: 'totp' | 'email' | 'backup'
function MfaModal({ show, onClose, onVerified }) {
  const [mode, setMode] = useState('totp');
  const [code, setCode]   = useState('');
  const [error, setError] = useState('');
  const [info, setInfo]   = useState('');
  const [busy, setBusy]   = useState(false);

  const config = {
    totp:   { title: 'Two-Factor Auth',    desc: 'Enter the 6-digit code from your authenticator app.', placeholder: '000000', maxLen: 6 },
    email:  { title: 'Verify via Email',   desc: 'Request a PIN sent to your registered email, then enter it below.', placeholder: '000000', maxLen: 6 },
    backup: { title: 'Use Recovery Code',  desc: 'Enter a single-use backup recovery code (format: XXXX-XXXX).', placeholder: 'ABCD-1234', maxLen: 9 }
  };
  const { title, desc, placeholder, maxLen } = config[mode];

  const handleSendEmail = async () => {
    setError(''); setInfo('');
    setBusy(true);
    try {
      const data = await authService.requestEmailMfaCode();
      setInfo(data.message || 'Code sent to your email.');
    } catch (e) { setError(e.message); }
    finally { setBusy(false); }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(''); setInfo('');
    setBusy(true);
    try {
      if (mode === 'totp')   await authService.loginVerifyMfa(code.trim());
      if (mode === 'email')  await authService.loginVerifyEmailMfa(code.trim());
      if (mode === 'backup') await authService.loginVerifyMfaBackup(code.trim());
      onVerified();
    } catch (e) { setError(e.message); }
    finally { setBusy(false); }
  };

  if (!show) return null;

  return (
    <div className="modal-overlay active">
      <div className="modal-container" style={{ maxWidth: 440 }}>
        <h2>{title}</h2>
        <p className="subtitle" style={{ marginBottom: '1.5rem' }}>{desc}</p>

        {error && <div className="alert alert-danger">{error}</div>}
        {info  && <div className="alert alert-success">{info}</div>}

        <form onSubmit={handleSubmit}>
          {mode === 'email' && (
            <button type="button" className="btn btn-secondary"
              onClick={handleSendEmail} disabled={busy}
              style={{ marginBottom: '1.5rem', width: '100%' }}>
              {busy ? 'Sending…' : 'Send Code to Email'}
            </button>
          )}

          <div className="form-group">
            <label>Verification Code</label>
            <input
              type="text"
              className="form-control"
              placeholder={placeholder}
              maxLength={maxLen}
              required
              autoComplete="off"
              value={code}
              onChange={e => setCode(e.target.value)}
              style={{ textAlign: 'center', letterSpacing: '0.2em', fontSize: '1.5rem' }}
            />
          </div>

          <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem' }}>
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={busy} style={{ flex: 1 }}>
              {busy ? 'Verifying…' : 'Verify'}
            </button>
          </div>

          <div style={{ textAlign: 'center', fontSize: '0.85rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {mode !== 'email'  && <a href="#" onClick={e => { e.preventDefault(); setMode('email'); setCode(''); setError(''); }}>✉️ Verify via Email PIN</a>}
            {mode !== 'backup' && <a href="#" onClick={e => { e.preventDefault(); setMode('backup'); setCode(''); setError(''); }}>🔑 Use a Backup Recovery Code</a>}
            {mode !== 'totp'   && <a href="#" onClick={e => { e.preventDefault(); setMode('totp'); setCode(''); setError(''); }}>📱 Use Authenticator App Code</a>}
          </div>
        </form>
      </div>
    </div>
  );
}

export default function Login({ onLoginSuccess }) {
  const [view, setView]             = useState('login'); // 'login' | 'register'
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPass, setLoginPass]   = useState('');
  const [regEmail, setRegEmail]     = useState('');
  const [regPass, setRegPass]       = useState('');
  const [error, setError]           = useState('');
  const [success, setSuccess]       = useState('');
  const [busy, setBusy]             = useState(false);
  const [showMfa, setShowMfa]       = useState(false);
  const { score, label } = validatePassword(regPass);

  const ALLOWED = ['@university.edu', '@softwarica.edu', '@coventry.ac.uk'];

  const handleLogin = async (e) => {
    e.preventDefault();
    setError(''); setSuccess('');
    setBusy(true);
    try {
      const data = await authService.login(loginEmail, loginPass);
      if (data.mfaRequired) {
        setShowMfa(true);
      } else {
        const profile = await authService.getProfile();
        onLoginSuccess(profile);
      }
    } catch (err) { setError(err.message); }
    finally { setBusy(false); }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setError(''); setSuccess('');
    if (!ALLOWED.some(d => regEmail.endsWith(d))) {
      return setError('Only institutional emails (@university.edu, @softwarica.edu, or @coventry.ac.uk) are accepted.');
    }
    const { isValid } = validatePassword(regPass);
    if (!isValid) return setError('Password must be at least 12 characters with uppercase, lowercase, a number, and a special character.');
    setBusy(true);
    try {
      const data = await authService.register(regEmail, regPass);
      setSuccess(data.message || 'Account created! You can now log in.');
      setRegEmail(''); setRegPass('');
      setTimeout(() => { setView('login'); setSuccess(''); }, 2000);
    } catch (err) { setError(err.message); }
    finally { setBusy(false); }
  };

  const handleMfaVerified = async () => {
    setShowMfa(false);
    const profile = await authService.getProfile();
    onLoginSuccess(profile);
  };

  return (
    <>
      <div className="container">
        <div className="glass-panel" id="auth-panel">
          <div id="brand-header">
            <h1>CampusWhisper</h1>
            <p className="subtitle">Secure, Anonymous Campus Incident Reporting</p>
          </div>

          {error   && <div className="alert alert-danger">{error}</div>}
          {success && <div className="alert alert-success">{success}</div>}

          {view === 'login' && (
            <form onSubmit={handleLogin}>
              <h2>Account Login</h2>
              <div className="form-group">
                <label>Institutional Email</label>
                <input type="email" className="form-control" placeholder="username@university.edu" required
                  autoComplete="username" value={loginEmail} onChange={e => setLoginEmail(e.target.value)} />
              </div>
              <div className="form-group">
                <label>Password</label>
                <input type="password" className="form-control" placeholder="••••••••••••" required
                  autoComplete="current-password" value={loginPass} onChange={e => setLoginPass(e.target.value)} />
              </div>
              <button type="submit" className="btn btn-primary" disabled={busy}>
                {busy ? 'Logging in…' : 'Login'}
              </button>
              <div className="auth-toggle">
                Don't have an account? <a href="#" onClick={e => { e.preventDefault(); setView('register'); setError(''); }}>Register here</a>
              </div>
            </form>
          )}

          {view === 'register' && (
            <form onSubmit={handleRegister}>
              <h2>Create Account</h2>
              <div className="form-group">
                <label>Institutional Email</label>
                <input type="email" className="form-control" placeholder="username@university.edu" required
                  autoComplete="username" value={regEmail} onChange={e => setRegEmail(e.target.value)} />
                <small className="strength-text">Only institutional domains allowed</small>
              </div>
              <div className="form-group">
                <label>Password</label>
                <input type="password" className="form-control" placeholder="••••••••••••" required
                  autoComplete="new-password" value={regPass} onChange={e => setRegPass(e.target.value)} />
                {regPass && <StrengthBar score={score} />}
                <small className="strength-text">Strength: {regPass ? label : 'Too Short'}</small>
              </div>
              <button type="submit" className="btn btn-primary" disabled={busy}>
                {busy ? 'Registering…' : 'Register'}
              </button>
              <div className="auth-toggle">
                Already have an account? <a href="#" onClick={e => { e.preventDefault(); setView('login'); setError(''); }}>Login here</a>
              </div>
            </form>
          )}
        </div>
      </div>

      <MfaModal show={showMfa} onClose={() => setShowMfa(false)} onVerified={handleMfaVerified} />
    </>
  );
}
