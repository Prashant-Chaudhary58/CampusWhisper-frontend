import React, { useState, useEffect, useRef } from 'react';
import { reportService } from '../services/ReportService';

const BADGE = { 'Open': 'badge-open', 'Under Review': 'badge-review', 'Resolved': 'badge-resolved' };
const STATUS_OPTIONS = ['Open', 'Under Review', 'Resolved'];
const CATEGORIES = ['Harassment', 'Safety Issue', 'Academic Misconduct', 'Other'];

// ─── Delete Confirmation Modal ─────────────────────────────────────────────
function DeleteModal({ caseId, onConfirm, onCancel, busy }) {
  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)',
      backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 999999
    }}>
      <div className="card" style={{ maxWidth: 380, width: '90%', padding: '2rem', textAlign: 'center' }}>
        <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>🗑️</div>
        <h3 style={{ color: '#fff', marginBottom: '0.75rem', fontSize: '1.2rem' }}>Delete Report</h3>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '0.5rem' }}>
          Are you sure you want to permanently delete <strong style={{ color: '#fff' }}>{caseId}</strong>?
        </p>
        <p style={{ color: 'var(--danger)', fontSize: '0.8rem', marginBottom: '1.5rem' }}>
          ⚠️ This will also delete all comments and attachments. This cannot be undone.
        </p>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <button className="btn btn-secondary" onClick={onCancel} disabled={busy} style={{ flex: 1, width: 'auto' }}>
            Cancel
          </button>
          <button className="btn btn-danger" onClick={onConfirm} disabled={busy} style={{ flex: 1, width: 'auto' }}>
            {busy ? 'Deleting…' : 'Yes, Delete'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Edit Panel (inline) ────────────────────────────────────────────────────
function EditPanel({ report, onSave, onCancel }) {
  const [title, setTitle]       = useState(report.title);
  const [category, setCategory] = useState(report.category);
  const [desc, setDesc]         = useState(report.description);
  const [busy, setBusy]         = useState(false);
  const [error, setError]       = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!title.trim() || !category || !desc.trim()) {
      return setError('All fields are required.');
    }
    setBusy(true);
    try {
      await reportService.updateReport(report.caseId, { title: title.trim(), category, description: desc.trim() });
      onSave({ title: title.trim(), category, description: desc.trim() });
    } catch (err) { setError(err.message); }
    finally { setBusy(false); }
  };

  return (
    <div className="card" style={{ padding: '1.5rem', marginBottom: '1.5rem', border: '1px solid rgba(99,102,241,0.4)' }}>
      <h4 style={{ color: '#fff', marginBottom: '1.25rem', fontSize: '1rem' }}>✏️ Edit Report</h4>
      {error && <div className="alert alert-danger" style={{ marginBottom: '1rem' }}>{error}</div>}
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>Title</label>
          <input type="text" className="form-control" value={title}
            onChange={e => setTitle(e.target.value)} required />
        </div>
        <div className="form-group">
          <label>Category</label>
          <select className="form-control" value={category} onChange={e => setCategory(e.target.value)} required>
            {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <div className="form-group">
          <label>Description</label>
          <textarea className="form-control" rows={5} value={desc}
            onChange={e => setDesc(e.target.value)} required />
        </div>
        <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
          <button type="button" className="btn btn-secondary" onClick={onCancel}
            disabled={busy} style={{ flex: 1, width: 'auto' }}>
            Cancel
          </button>
          <button type="submit" className="btn btn-primary" disabled={busy}
            style={{ flex: 1, width: 'auto' }}>
            {busy ? 'Saving…' : 'Save Changes'}
          </button>
        </div>
      </form>
    </div>
  );
}

// ─── Main Component ─────────────────────────────────────────────────────────
export default function ReportDetail({ caseId, userRole, user, allowCrud = false, onBack, onDeleted }) {
  const [report, setReport]           = useState(null);
  const [comments, setComments]       = useState([]);
  const [commentText, setCommentText] = useState('');
  const [busy, setBusy]               = useState(false);
  const [loading, setLoading]         = useState(true);
  const [error, setError]             = useState('');
  const [isEditing, setIsEditing]     = useState(false);
  const [showDelete, setShowDelete]   = useState(false);
  const [deleteBusy, setDeleteBusy]   = useState(false);
  const commentsEndRef                 = useRef(null);
  const pollRef                        = useRef(null);
  const prevCommentCountRef            = useRef(0);
  const isEditingRef                   = useRef(false);

  const loadDetail = async () => {
    try {
      const r = await reportService.getReport(caseId);
      setReport(r);
    } catch (e) { setError(e.message); }
  };

  const loadComments = async (forceScroll = false) => {
    try {
      const c = await reportService.getComments(caseId);
      setComments(c);
      // Only auto-scroll when new comments arrive AND the edit panel is not open
      const hasNew = c.length > prevCommentCountRef.current;
      prevCommentCountRef.current = c.length;
      if ((hasNew || forceScroll) && !isEditingRef.current) {
        setTimeout(() => commentsEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 50);
      }
    } catch (e) { /* silent */ }
  };

  useEffect(() => {
    setLoading(true);
    setError('');
    Promise.all([loadDetail(), loadComments()]).finally(() => setLoading(false));
    pollRef.current = setInterval(loadComments, 5000);
    return () => clearInterval(pollRef.current);
  }, [caseId]);

  const handleStatusChange = async (e) => {
    try {
      await reportService.updateStatus(caseId, e.target.value);
      setReport(r => ({ ...r, status: e.target.value }));
    } catch (err) { setError(err.message); }
  };

  const handleCommentSubmit = async (e) => {
    e.preventDefault();
    if (!commentText.trim()) return;
    setBusy(true);
    try {
      await reportService.postComment(caseId, commentText.trim());
      setCommentText('');
      await loadComments(true); // always scroll after manually sending
    } catch (err) { setError(err.message); }
    finally { setBusy(false); }
  };

  const handleSaveEdit = (updated) => {
    setReport(r => ({ ...r, ...updated }));
    isEditingRef.current = false;
    setIsEditing(false);
  };

  const handleDelete = async () => {
    setDeleteBusy(true);
    try {
      await reportService.deleteReport(caseId);
      setShowDelete(false);
      onDeleted();
    } catch (err) {
      setError(err.message);
      setDeleteBusy(false);
      setShowDelete(false);
    }
  };

  if (loading) return <div style={{ padding: '2rem', color: 'var(--text-secondary)', textAlign: 'center' }}>Loading report…</div>;
  if (error && !report) return <div style={{ padding: '2rem' }}><div className="alert alert-danger">{error}</div></div>;
  if (!report) return null;

  const badgeClass = BADGE[report.status] || 'badge-open';

  return (
    <div id="panel-details" style={{ display: 'block' }}>

      {/* Top Bar: Back button + Owner Controls */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.5rem' }}>
        <button id="details-back-btn" className="btn btn-secondary" onClick={onBack} style={{ width: 'auto' }}>
          ← Back to Reports
        </button>

        {/* Show Edit/Delete only if user is the owner AND viewing from My Reports */}
        {report.isOwner && allowCrud && (
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button
              className="btn btn-secondary"
              onClick={() => setIsEditing(v => {
                const next = !v;
                isEditingRef.current = next;
                return next;
              })}
              style={{ width: 'auto', padding: '0.6rem 1.2rem', fontSize: '0.875rem' }}
            >
              {isEditing ? '✕ Cancel Edit' : '✏️ Edit'}
            </button>
            <button
              className="btn btn-danger"
              onClick={() => setShowDelete(true)}
              style={{ width: 'auto', padding: '0.6rem 1.2rem', fontSize: '0.875rem' }}
            >
              🗑️ Delete
            </button>
          </div>
        )}
      </div>

      {error && <div className="alert alert-danger" style={{ marginBottom: '1rem' }}>{error}</div>}

      {/* Edit Panel - shows inline above the detail cards */}
      {isEditing && (
        <EditPanel
          report={report}
          onSave={handleSaveEdit}
          onCancel={() => { isEditingRef.current = false; setIsEditing(false); }}
        />
      )}

      <div className="report-details-container">
        {/* ── Left Column: Report Info ── */}
        <div>
          <div className="card" style={{ marginBottom: '1.5rem', padding: '1.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '1rem' }}>
              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                <span className={`badge ${badgeClass}`}>{report.status}</span>
                {report.isAnonymous && <span className="badge badge-anon">Anonymous</span>}
                {report.isOwner && allowCrud && (
                  <span style={{
                    background: 'rgba(99,102,241,0.12)', color: 'var(--accent-color)',
                    border: '1px solid rgba(99,102,241,0.3)', borderRadius: '20px',
                    padding: '0.15rem 0.6rem', fontSize: '0.72rem', fontWeight: 600
                  }}>
                    ✍️ Your Report
                  </span>
                )}
              </div>
              <span style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>{report.caseId}</span>
            </div>

            <h2 style={{ color: '#fff', marginBottom: '0.5rem', fontSize: '1.4rem' }}>{report.title}</h2>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
              <span style={{
                background: 'rgba(99,102,241,0.15)', color: 'var(--accent-color)',
                padding: '0.2rem 0.6rem', borderRadius: 6, fontSize: '0.8rem'
              }}>
                {report.category}
              </span>
            </div>
            <p style={{ color: 'var(--text-secondary)', lineHeight: 1.7, fontSize: '0.95rem', whiteSpace: 'pre-wrap' }}>
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
              <p style={{ color: '#fff', fontSize: '0.9rem' }}>{report.reporter.email}</p>
            </div>
          )}

          {/* Moderator triage */}
          {userRole !== 'Reporter' && (
            <div className="card" style={{ padding: '1.5rem', marginBottom: '1.5rem' }}>
              <h4 style={{ color: '#fff', marginBottom: '1rem', fontSize: '0.95rem' }}>🛡️ Moderator Controls</h4>
              <div className="form-group">
                <label>Update Status</label>
                <select className="form-control" value={report.status} onChange={handleStatusChange}>
                  {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
            </div>
          )}
        </div>

        {/* ── Right Column: Comments ── */}
        <div>
          <div className="card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column' }}>
            <h4 style={{ color: '#fff', marginBottom: '1rem', fontSize: '0.95rem' }}>💬 Discussion</h4>
            <div style={{
              overflowY: 'auto', maxHeight: 360, marginBottom: '1rem',
              display: 'flex', flexDirection: 'column', gap: '0.75rem'
            }}>
              {comments.length === 0 && (
                <p style={{ textAlign: 'center', color: 'var(--text-secondary)', fontSize: '0.85rem', padding: '1rem 0' }}>
                  No messages yet. Be the first to comment!
                </p>
              )}
              {comments.map((c, i) => {
                const isStaff = c.authorRole !== 'Reporter';
                
                // Securely check if the comment is written by the current logged-in user:
                // 1) Match by email directly if available.
                // 2) If the report is anonymous, the reporter's email is set to null in the response.
                //    So if the current user is the owner of the report, and the authorRole is 'Reporter' 
                //    with no email, it belongs to the current user.
                const isMe = !!c.isMe;

                let author = isMe ? 'You' : (isStaff ? c.authorRole : 'Student Reporter');
                if (!isMe && c.author?.email) author += ` (${c.author.email})`;
                if (!isMe && !c.author && !isStaff) author = 'Anonymous Reporter';

                // Assign the bubble class: me floats to the right, moderator and regular reporters float left
                const bubbleClass = isMe ? 'me' : (isStaff ? 'moderator' : '');

                return (
                  <div key={i} className={`comment-bubble ${bubbleClass}`}>
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

            <form onSubmit={handleCommentSubmit} className="comment-input-area">
              <input
                type="text"
                className="form-control"
                placeholder="Add a comment…"
                value={commentText}
                onChange={e => setCommentText(e.target.value)}
                style={{ flex: 1 }}
              />
              <button type="submit" className="btn btn-primary" disabled={busy}
                style={{ width: 'auto', padding: '0.8rem 1.4rem', whiteSpace: 'nowrap' }}>
                {busy ? '…' : 'Send'}
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDelete && (
        <DeleteModal
          caseId={caseId}
          onConfirm={handleDelete}
          onCancel={() => setShowDelete(false)}
          busy={deleteBusy}
        />
      )}
    </div>
  );
}
