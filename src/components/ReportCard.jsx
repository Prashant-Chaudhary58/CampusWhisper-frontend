import React from 'react';

const BADGE = { 'Open': 'badge-open', 'Under Review': 'badge-review', 'Resolved': 'badge-resolved' };

export default function ReportCard({ report, onCardClick, onPinClick, onAgreeClick, onDisagreeClick }) {
  const badgeClass = BADGE[report.status] || 'badge-open';

  return (
    <div className="report-card" onClick={() => onCardClick(report.caseId)} style={{ cursor: 'pointer' }}>
      <div className="report-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <button
            className={`pin-btn${report.isPinned ? ' pinned' : ''}`}
            title={report.isPinned ? 'Unpin report' : 'Pin report'}
            onClick={e => { e.stopPropagation(); onPinClick(report.caseId); }}
          >📌</button>
          <span className="report-case-id">{report.caseId}</span>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          {report.isAnonymous && <span className="badge badge-anon">Anonymous</span>}
          <span className={`badge ${badgeClass}`}>{report.status}</span>
        </div>
      </div>

      <h3 style={{ fontSize: '1.1rem', color: '#fff', marginBottom: '0.4rem' }}>{report.title}</h3>
      <p className="report-card-desc">{report.description}</p>

      <div style={{
        marginTop: '1rem', fontSize: '0.75rem', color: 'var(--text-secondary)',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem'
      }}>
        <span>{report.category}</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.2rem' }}>
          <div className="vote-container">
            <button
              className={`vote-btn agree-btn${report.userHasAgreed ? ' voted' : ''}`}
              title="Agree with report"
              onClick={e => { e.stopPropagation(); onAgreeClick(report.caseId); }}
            >
              <span>✓</span> <span className="vote-count">{report.agreeCount || 0}</span>
            </button>
            <button
              className={`vote-btn disagree-btn${report.userHasDisagreed ? ' voted' : ''}`}
              title="Disagree with report"
              onClick={e => { e.stopPropagation(); onDisagreeClick(report.caseId); }}
            >
              <span>✗</span> <span className="vote-count">{report.disagreeCount || 0}</span>
            </button>
          </div>
          <span>{new Date(report.createdAt).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}</span>
        </div>
      </div>
    </div>
  );
}
