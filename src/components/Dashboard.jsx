import React, { useState, useEffect, useCallback, useRef } from 'react';
import { reportService } from '../services/ReportService';
import { authService } from '../services/AuthService';
import Sidebar from './Sidebar';
import ReportCard from './ReportCard';
import ReportDetail from './ReportDetail';

const CATEGORIES = ['Harassment', 'Safety Issue', 'Academic Misconduct', 'Other'];

// ─── Submit Report Panel ────────────────────────────────────────────────────
function SubmitPanel({ onSubmitted, onCancel }) {
  const [title, setTitle]       = useState('');
  const [category, setCategory] = useState('');
  const [desc, setDesc]         = useState('');
  const [anon, setAnon]         = useState(false);
  const [files, setFiles]       = useState(null);
  const [busy, setBusy]         = useState(false);
  const [error, setError]       = useState('');
  const [success, setSuccess]   = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(''); setSuccess('');
    setBusy(true);
    try {
      const fd = new FormData();
      fd.append('title', title);
      fd.append('category', category);
      fd.append('description', desc);
      fd.append('isAnonymous', String(anon));
      if (files) Array.from(files).forEach(f => fd.append('attachments', f));
      const data = await reportService.submitReport(fd);
      setSuccess(`Report ${data.report?.caseId || ''} submitted successfully!`);
      setTitle(''); setCategory(''); setDesc(''); setAnon(false); setFiles(null);
      setTimeout(() => { setSuccess(''); onSubmitted(); }, 2000);
    } catch (err) { setError(err.message); }
    finally { setBusy(false); }
  };

  return (
    <div id="panel-submit" className="panel-section" style={{ display: 'block' }}>
      <h2>File an Incident Report</h2>
      {error   && <div className="alert alert-danger">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}
      <form onSubmit={handleSubmit} encType="multipart/form-data">
        <div className="form-group">
          <label>Title / Brief Subject</label>
          <input type="text" className="form-control" placeholder="Summarize the incident" required
            value={title} onChange={e => setTitle(e.target.value)} />
        </div>
        <div className="form-group">
          <label>Category</label>
          <select className="form-control" required value={category} onChange={e => setCategory(e.target.value)}>
            <option value="" disabled>Select category</option>
            {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <div className="form-group">
          <label>Detailed Description</label>
          <textarea className="form-control" rows={6}
            placeholder="Provide complete facts, dates, times, and names (if public)."
            required value={desc} onChange={e => setDesc(e.target.value)} />
        </div>
        <div className="form-group">
          <label>Attachments (Max 3, JPEGs/PNGs/PDFs only, max 5MB total)</label>
          <input type="file" className="form-control" multiple accept=".png,.jpg,.jpeg,.pdf"
            onChange={e => setFiles(e.target.files)} />
        </div>
        <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '1.5rem' }}>
          <input type="checkbox" id="report-anonymous" checked={anon} onChange={e => setAnon(e.target.checked)}
            style={{ width: '1.2rem', height: '1.2rem', cursor: 'pointer' }} />
          <label htmlFor="report-anonymous" style={{ marginBottom: 0, cursor: 'pointer', textTransform: 'none' }}>
            File this report anonymously
          </label>
        </div>
        <div className="alert alert-danger" style={{ marginTop: '1rem', fontSize: '0.85rem', padding: '0.6rem 0.8rem' }}>
          ⚠️ Anonymous reports encrypt your user ID and hide your identity from moderators. You cannot revert this.
        </div>
        <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
          <button type="button" className="btn btn-secondary" onClick={onCancel}>Cancel</button>
          <button type="submit" className="btn btn-primary" disabled={busy}>
            {busy ? 'Submitting…' : 'Submit Security Report'}
          </button>
        </div>
      </form>
    </div>
  );
}

// ─── Profile Panel ──────────────────────────────────────────────────────────
function ProfilePanel({ user }) {
  return (
    <div id="panel-profile" className="panel-section" style={{ display: 'block' }}>
      <h2>My Profile</h2>
      <div className="card" style={{ maxWidth: 480, padding: '2rem', marginTop: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', marginBottom: '2rem' }}>
          <div className="profile-avatar" style={{ width: 64, height: 64, fontSize: '2rem' }}>
            {(user?.email || 'U').charAt(0).toUpperCase()}
          </div>
          <div>
            <div style={{ color: '#fff', fontWeight: 600, fontSize: '1.1rem' }}>{user?.email}</div>
            <span className={`badge ${user?.role === 'Reporter' ? 'badge-open' : 'badge-review'}`}>{user?.role}</span>
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.75rem 0', borderBottom: '1px solid var(--border-card)' }}>
            <span style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Email</span>
            <span style={{ color: '#fff' }}>{user?.email}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.75rem 0', borderBottom: '1px solid var(--border-card)' }}>
            <span style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Role</span>
            <span style={{ color: '#fff' }}>{user?.role}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.75rem 0' }}>
            <span style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>MFA Status</span>
            <span style={{ color: user?.mfaEnabled ? 'var(--success)' : 'var(--warning)' }}>
              {user?.mfaEnabled ? '🛡️ Enabled' : '⚠️ Disabled'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Logout Confirmation Modal ──────────────────────────────────────────────
function LogoutModal({ show, onConfirm, onCancel }) {
  if (!show) return null;
  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)',
      backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 999999
    }}>
      <div className="card" style={{ maxWidth: 360, width: '90%', padding: '2rem', textAlign: 'center' }}>
        <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>🔐</div>
        <h3 style={{ color: '#fff', marginBottom: '0.75rem', fontSize: '1.25rem' }}>You will get logged out</h3>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', marginBottom: '1.5rem' }}>
          Are you sure you want to leave CampusWhisper?
        </p>
        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
          <button id="logout-confirm-no" className="btn btn-secondary" style={{ flex: 1 }} onClick={onCancel}>No, Stay</button>
          <button id="logout-confirm-yes" className="btn btn-danger" style={{ flex: 1 }} onClick={onConfirm}>Yes, Logout</button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Dashboard ─────────────────────────────────────────────────────────
export default function Dashboard({ user, onLogout, refreshUser }) {
  const [activePanel, setActivePanel]   = useState('list');  // 'list' | 'submit' | 'detail' | 'profile' | 'my-reports'
  const [detailCaseId, setDetailCaseId] = useState(null);
  const [reports, setReports]           = useState([]);
  const [myReports, setMyReports]       = useState([]);
  const [loadingReports, setLoadingReports] = useState(true);
  const [sidebarOpen, setSidebarOpen]   = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [alert, setAlert]               = useState(null); // { type, message }
  const popstateBound                   = useRef(false);

  const showAlert = (message, type = 'danger') => setAlert({ type, message });
  const clearAlert = () => setAlert(null);

  // ── History / back-button management ──
  const navigateTo = useCallback((panel, push = true) => {
    clearAlert();
    setActivePanel(panel);
    if (push) history.pushState({ panel }, '');
  }, []);

  useEffect(() => {
    // Push initial state on mount
    history.pushState({ panel: 'list' }, '');

    const handlePopState = (e) => {
      const state = e.state;
      if (!state || !state.panel) {
        // Root state — show logout modal and immediately push current state back
        history.pushState({ panel: 'list' }, '');
        setShowLogoutModal(true);
        return;
      }
      setActivePanel(state.panel);
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // ── Load reports ──
  const loadReports = useCallback(async () => {
    setLoadingReports(true);
    try {
      const data = await reportService.getReports();
      setReports(data);
    } catch (err) { showAlert(err.message); }
    finally { setLoadingReports(false); }
  }, []);

  const loadMyReports = useCallback(async () => {
    try {
      const data = await reportService.getReports(true);
      setMyReports(data);
    } catch (err) { showAlert(err.message); }
  }, []);

  useEffect(() => {
    loadReports();
  }, [loadReports]);

  // ── Pin / Vote handlers ──
  const handlePin = async (caseId) => {
    try {
      await reportService.togglePin(caseId);
      setReports(prev => prev.map(r => r.caseId === caseId ? { ...r, isPinned: !r.isPinned } : r));
    } catch (err) { showAlert(err.message); }
  };

  const handleAgree = async (caseId) => {
    try {
      const data = await reportService.agreeReport(caseId);
      setReports(prev => prev.map(r => r.caseId === caseId
        ? { ...r, agreeCount: data.agreeCount, disagreeCount: data.disagreeCount, userHasAgreed: data.userHasAgreed, userHasDisagreed: data.userHasDisagreed }
        : r));
    } catch (err) { showAlert(err.message); }
  };

  const handleDisagree = async (caseId) => {
    try {
      const data = await reportService.disagreeReport(caseId);
      setReports(prev => prev.map(r => r.caseId === caseId
        ? { ...r, agreeCount: data.agreeCount, disagreeCount: data.disagreeCount, userHasAgreed: data.userHasAgreed, userHasDisagreed: data.userHasDisagreed }
        : r));
    } catch (err) { showAlert(err.message); }
  };

  const handleMyReportAgree = async (caseId) => {
    try {
      const data = await reportService.agreeReport(caseId);
      setMyReports(prev => prev.map(r => r.caseId === caseId
        ? { ...r, agreeCount: data.agreeCount, disagreeCount: data.disagreeCount, userHasAgreed: data.userHasAgreed, userHasDisagreed: data.userHasDisagreed }
        : r));
    } catch (err) { showAlert(err.message); }
  };

  const handleMyReportDisagree = async (caseId) => {
    try {
      const data = await reportService.disagreeReport(caseId);
      setMyReports(prev => prev.map(r => r.caseId === caseId
        ? { ...r, agreeCount: data.agreeCount, disagreeCount: data.disagreeCount, userHasAgreed: data.userHasAgreed, userHasDisagreed: data.userHasDisagreed }
        : r));
    } catch (err) { showAlert(err.message); }
  };

  // ── Logout ──
  const doLogout = async () => {
    try { await authService.logout(); } finally { onLogout(); }
  };

  const initial = (user?.email || 'U').charAt(0).toUpperCase();

  // Sorted reports: pinned first
  const sortedReports = [...reports].sort((a, b) => (b.isPinned ? 1 : 0) - (a.isPinned ? 1 : 0));

  return (
    <div className="dashboard-page">
      {/* ── Sticky Top Header ── */}
      <header className="header-bar">
        <div style={{ fontWeight: 700, fontSize: '1.25rem', letterSpacing: '-0.02em' }}>CampusWhisper</div>
        <div className="header-user">
          <div id="profile-trigger" className="profile-trigger" onClick={() => setSidebarOpen(true)} style={{ cursor: 'pointer' }}>
            <div className="profile-avatar-small" id="profile-avatar-initial">{initial}</div>
            <span style={{ fontSize: '0.9rem', color: 'var(--text-primary)', fontWeight: 500 }}>{user?.email}</span>
            <span className={`badge ${user?.role === 'Reporter' ? 'badge-open' : 'badge-review'}`}>{user?.role}</span>
          </div>
        </div>
      </header>

      {/* ── Alert Banner ── */}
      {alert && (
        <div style={{ padding: '0 2rem', paddingTop: '1rem', maxWidth: 1400, margin: '0 auto', width: '100%' }}>
          <div className={`alert alert-${alert.type}`} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>{alert.message}</span>
            <button onClick={clearAlert} style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer', fontSize: '1.2rem', lineHeight: 1 }}>✕</button>
          </div>
        </div>
      )}

      {/* ── Main Content ── */}
      <main className="main-wrapper" style={{ flex: 1 }}>
        <div className="dashboard-grid">
          {/* ── Left Sidebar Navigation ── */}
          <aside className="sidebar">
            <nav>
              <ul className="nav-links">
                <li className="nav-item">
                  <a href="#" id="nav-reports"
                    className={`nav-link${activePanel === 'list' ? ' active' : ''}`}
                    onClick={e => { e.preventDefault(); navigateTo('list'); loadReports(); }}>
                    <span>📋</span> Reports List
                  </a>
                </li>
                {user?.role === 'Reporter' && (
                  <li className="nav-item" id="nav-submit-wrapper">
                    <a href="#" id="nav-submit"
                      className={`nav-link${activePanel === 'submit' ? ' active' : ''}`}
                      onClick={e => { e.preventDefault(); navigateTo('submit'); }}>
                      <span>✍️</span> Submit Report
                    </a>
                  </li>
                )}
              </ul>
            </nav>
          </aside>

          {/* ── Content Panels ── */}
          <section className="main-content">

            {/* Reports List Panel */}
            {activePanel === 'list' && (
              <div id="panel-list" className="panel-section" style={{ display: 'block' }}>
                <h2>Incident Reports</h2>
                {loadingReports && (
                  <div style={{ textAlign: 'center', color: 'var(--text-secondary)', marginTop: '2rem' }}>
                    Loading reports...
                  </div>
                )}
                {!loadingReports && sortedReports.length === 0 && (
                  <div style={{ textAlign: 'center', color: 'var(--text-secondary)', marginTop: '3rem' }}>
                    No reports found.
                  </div>
                )}
                <div id="reports-list-container">
                  {sortedReports.map(r => (
                    <ReportCard key={r.caseId} report={r}
                      onCardClick={(id) => { setDetailCaseId(id); navigateTo('detail'); }}
                      onPinClick={handlePin}
                      onAgreeClick={handleAgree}
                      onDisagreeClick={handleDisagree}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Submit Panel */}
            {activePanel === 'submit' && (
              <SubmitPanel onSubmitted={() => { navigateTo('list'); loadReports(); }} onCancel={() => navigateTo('list')} />
            )}

            {/* Detail Panel */}
            {activePanel === 'detail' && detailCaseId && (
              <ReportDetail
                caseId={detailCaseId}
                userRole={user?.role}
                onBack={() => { history.back(); }}
              />
            )}

            {/* Profile Panel */}
            {activePanel === 'profile' && <ProfilePanel user={user} />}

            {/* My Reports Panel */}
            {activePanel === 'my-reports' && (
              <div id="panel-my-reports" className="panel-section" style={{ display: 'block' }}>
                <h2>My Reports</h2>
                {myReports.length === 0 && (
                  <div style={{ textAlign: 'center', color: 'var(--text-secondary)', marginTop: '3rem' }}>
                    You haven't filed any reports yet.
                  </div>
                )}
                <div id="my-reports-list-container">
                  {myReports.map(r => (
                    <ReportCard key={r.caseId} report={r}
                      onCardClick={(id) => { setDetailCaseId(id); navigateTo('detail'); }}
                      onPinClick={async (id) => {
                        await reportService.togglePin(id);
                        setMyReports(prev => prev.map(r => r.caseId === id ? { ...r, isPinned: !r.isPinned } : r));
                      }}
                      onAgreeClick={handleMyReportAgree}
                      onDisagreeClick={handleMyReportDisagree}
                    />
                  ))}
                </div>
              </div>
            )}
          </section>
        </div>
      </main>

      {/* ── Footer ── */}
      <footer className="footer">
        <div className="footer-content">
          <div className="footer-logo">🔒 CampusWhisper</div>
          <div className="footer-tagline">Secure, anonymous incident reporting for your campus community</div>
          <div className="footer-meta">
            <span>© {new Date().getFullYear()} CampusWhisper. All rights reserved.</span>
            <span className="footer-badge">🛡️ End-to-End Encrypted</span>
            <span>Powered by argon2 + MFA</span>
          </div>
        </div>
      </footer>

      {/* ── Right Sidebar ── */}
      <Sidebar
        user={user}
        show={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        onLogout={doLogout}
        refreshUser={refreshUser}
      />
      {/* My Reports nav from sidebar */}
      <span id="side-nav-my-reports-trigger" style={{ display: 'none' }} onClick={() => { setSidebarOpen(false); navigateTo('my-reports'); loadMyReports(); }} />

      {/* ── Logout Confirmation Modal ── */}
      <LogoutModal
        show={showLogoutModal}
        onCancel={() => setShowLogoutModal(false)}
        onConfirm={doLogout}
      />
    </div>
  );
}
