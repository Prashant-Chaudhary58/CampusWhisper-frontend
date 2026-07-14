import React, { useState, useEffect, useRef } from 'react';
import { reportService } from '../services/ReportService';

const BADGE = { 'Open': 'badge-open', 'Under Review': 'badge-review', 'Resolved': 'badge-resolved' };
const STATUS_OPTIONS = ['Open', 'Under Review', 'Resolved'];

export default function ReportDetail({ caseId, userRole, onBack }) {
  const [report, setReport]       = useState(null);
  const [comments, setComments]   = useState([]);
  const [commentText, setCommentText] = useState('');
  const [busy, setBusy]           = useState(false);
  const [error, setError]         = useState('');
  const [loading, setLoading]     = useState(true);
  const commentsEndRef             = useRef(null);
  const pollRef                    = useRef(null);

  const loadDetail = async () => {
    try {
      const r = await reportService.getReport(caseId);
      setReport(r);
    } catch (e) { setError(e.message); }
  };

  const loadComments = async () => {
    try {
      const c = await reportService.getComments(caseId);
      setComments(c);
      setTimeout(() => commentsEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 50);
    } catch (e) { /* silent poll failures */ }
  };

  useEffect(() => {
    setLoading(true);
    setError('');
    Promise.all([loadDetail(), loadComments()]).finally(() => setLoading(false));
    pollRef.current = setInterval(loadComments, 5000);
    return () => clearInterval(pollRef.current);
  }, [caseId]);

  const handleStatusChange = async (e) => {
    const newStatus = e.target.value;
    try {
      await reportService.updateStatus(caseId, newStatus);
      setReport(r => ({ ...r, status: newStatus }));
    } catch (err) { setError(err.message); }
  };

  const handleCommentSubmit = async (e) => {
    e.preventDefault();
    if (!commentText.trim()) return;
    setBusy(true);
    try {
      await reportService.postComment(caseId, commentText.trim());
      setCommentText('');
      await loadComments();
    } catch (err) { setError(err.message); }
    finally { setBusy(false); }
  };

  if (loading) return <div style={{ padding: '2rem', color: 'var(--text-secondary)', textAlign: 'center' }}>Loading report…</div>;
  if (error)   return <div style={{ padding: '2rem' }}><div className="alert alert-danger">{error}</div></div>;
  if (!report) return null;

  const badgeClass = BADGE[report.status] || 'badge-open';

  return (
    <div id="panel-details" style={{ display: 'block' }}>
      {/* Back button */}
      <button id="details-back-btn" className="btn btn-secondary" onClick={onBack} style={{ marginBottom: '1.5rem' }}>
        ← Back to Reports
      </button>

      <div className="report-details-container">
        {/* ── Left Column: Report Info ── */}
        <div>
          <div className="card" style={{ marginBottom: '1.5rem', padding: '1.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '1rem' }}>
              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                <span className={`badge ${badgeClass}`} id="detail-status-badge">{report.status}</span>
                {report.isAnonymous && <span className="badge badge-anon" id="detail-anon-badge">Anonymous</span>}
              </div>
              <span style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }} id="detail-case-id">{report.caseId}</span>
            </div>

            <h2 id="detail-title" style={{ color: '#fff', marginBottom: '0.5rem', fontSize: '1.4rem' }}>{report.title}</h2>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
              <span style={{ background: 'rgba(99,102,241,0.15)', color: 'var(--accent-color)', padding: '0.2rem 0.6rem', borderRadius: 6, fontSize: '0.8rem' }}>
                {report.category}
              </span>
            </div>
            <p id="detail-description" style={{ color: 'var(--text-secondary)', lineHeight: 1.7, fontSize: '0.95rem' }}>
              {report.description}
            </p>
          </div>

          {/* Attachments */}
          {report.attachments?.length > 0 && (
            <div className="card" style={{ marginBottom: '1.5rem', padding: '1.5rem' }}>
              <h4 style={{ color: '#fff', marginBottom: '1rem', fontSize: '0.95rem' }}>📎 Attachments</h4>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                {report.attachments.map((f, i) => (
                  <a key={i}
                    href={`/api/reports/${report.caseId}/attachments/${f.filename}`}
                    className="attachment-badge"
                    target="_blank"
                    rel="noopener noreferrer">
                    📎 {f.originalName} ({(f.size / 1024).toFixed(1)} KB)
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* Reporter identity (non-anon) */}
          {!report.isAnonymous && report.reporter?.email && (
            <div className="card" style={{ marginBottom: '1.5rem', padding: '1.5rem' }}>
              <h4 style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '0.5rem' }}>Reporter</h4>
              <p id="detail-reporter-email" style={{ color: '#fff', fontSize: '0.9rem' }}>{report.reporter.email}</p>
            </div>
          )}

          {/* Moderator triage */}
          {userRole !== 'Reporter' && (
            <div className="card" style={{ padding: '1.5rem', marginBottom: '1.5rem' }} id="moderator-triage-panel">
              <h4 style={{ color: '#fff', marginBottom: '1rem', fontSize: '0.95rem' }}>🛡️ Moderator Controls</h4>
              <div className="form-group">
                <label>Update Status</label>
                <select id="triage-status" className="form-control" value={report.status} onChange={handleStatusChange}>
                  {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
            </div>
          )}
        </div>

        {/* ── Right Column: Comments ── */}
        <div>
          <div className="card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', height: '100%' }}>
            <h4 style={{ color: '#fff', marginBottom: '1rem', fontSize: '0.95rem' }}>💬 Discussion</h4>
            <div id="comments-container" style={{
              flex: 1, overflowY: 'auto', maxHeight: 360, marginBottom: '1rem',
              display: 'flex', flexDirection: 'column', gap: '0.75rem'
            }}>
              {comments.length === 0 && (
                <p style={{ textAlign: 'center', color: 'var(--text-secondary)', fontSize: '0.85rem', padding: '1rem 0' }}>
                  No messages yet.
                </p>
              )}
              {comments.map((c, i) => {
                const isStaff = c.authorRole !== 'Reporter';
                let author = isStaff ? c.authorRole : 'Student Reporter';
                if (c.author?.email) author += ` (${c.author.email})`;
                if (!c.author && !isStaff) author = 'Anonymous Reporter';

                return (
                  <div key={i} className={`comment-bubble${isStaff ? ' moderator' : ''}`}>
                    <div className="comment-meta">
                      <span style={{ fontWeight: 600 }}>{author}</span>
                      <span>{new Date(c.createdAt).toLocaleTimeString()}</span>
                    </div>
                    <div className="comment-text">{c.text}</div>
                  </div>
                );
              })}
              <div ref={commentsEndRef} />
            </div>

            <form onSubmit={handleCommentSubmit} style={{ display: 'flex', gap: '0.5rem' }}>
              <input
                type="text"
                className="form-control"
                placeholder="Add a comment…"
                value={commentText}
                onChange={e => setCommentText(e.target.value)}
                style={{ flex: 1 }}
              />
              <button type="submit" className="btn btn-primary" disabled={busy}>
                {busy ? '…' : 'Send'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
