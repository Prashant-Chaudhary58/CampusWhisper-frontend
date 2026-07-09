import { escapeHtml } from './AuthView.js';

/**
 * View: DashboardView
 * Pure DOM rendering for the dashboard page (dashboard.html).
 * Receives data objects and renders them — zero API calls.
 */
export class DashboardView {
  constructor() {
    // Header
    this.userDisplay    = document.getElementById('user-display');
    this.roleBadge      = document.getElementById('role-badge');
    this.logoutBtn      = document.getElementById('logout-btn');
    this.alertBox       = document.getElementById('alert-box');

    // Navigation links
    this.navReports     = document.getElementById('nav-reports');
    this.navSubmit      = document.getElementById('nav-submit');
    this.navSubmitWrap  = document.getElementById('nav-submit-wrapper');
    this.navMfa         = document.getElementById('nav-mfa');

    // Panels
    this.panelList      = document.getElementById('panel-list');
    this.panelSubmit    = document.getElementById('panel-submit');
    this.panelMfa       = document.getElementById('panel-mfa');
    this.panelDetails   = document.getElementById('panel-details');

    // Reports list
    this.reportsLoading = document.getElementById('reports-loading');
    this.reportsEmpty   = document.getElementById('reports-empty');
    this.reportsList    = document.getElementById('reports-list-container');

    // Detail view
    this.detailCaseId         = document.getElementById('detail-case-id');
    this.detailStatusBadge    = document.getElementById('detail-status-badge');
    this.detailAnonBadge      = document.getElementById('detail-anon-badge');
    this.detailTitle          = document.getElementById('detail-title');
    this.detailCategory       = document.getElementById('detail-category');
    this.detailDescription    = document.getElementById('detail-description');
    this.detailAttachArea     = document.getElementById('detail-attachments-area');
    this.detailAttachList     = document.getElementById('detail-attachments-list');
    this.detailReporterEmail  = document.getElementById('detail-reporter-email');
    this.modTriagePanel       = document.getElementById('moderator-triage-panel');
    this.reporterPanel        = document.getElementById('reporter-identity-panel');
    this.triageSelect         = document.getElementById('triage-status');

    // Comments
    this.commentsContainer    = document.getElementById('comments-container');

    // MFA settings
    this.mfaCurrentStatus     = document.getElementById('mfa-current-status');
    this.mfaEnableBtn         = document.getElementById('mfa-enable-btn');
    this.mfaDisableBtn        = document.getElementById('mfa-disable-btn');
    this.mfaSetupArea         = document.getElementById('mfa-setup-area');
    this.mfaQrContainer       = document.getElementById('mfa-qr-container');
    this.mfaSecretText        = document.getElementById('mfa-secret-text');

    // Recovery codes elements
    this.mfaBackupArea        = document.getElementById('mfa-backup-codes-area');
    this.mfaBackupList        = document.getElementById('mfa-backup-codes-list');
    this.mfaBackupAckBtn     = document.getElementById('mfa-backup-codes-ack-btn');
  }

  showBackupCodes(codes) {
    this.mfaSetupArea.style.display = 'none';
    this.mfaBackupArea.style.display = 'block';
    this.mfaBackupList.innerHTML = '';
    
    codes.forEach(code => {
      const el = document.createElement('div');
      el.style.border = '1px dashed rgba(255, 255, 255, 0.15)';
      el.style.padding = '0.5rem';
      el.style.borderRadius = '4px';
      el.style.letterSpacing = '0.1em';
      el.textContent = code;
      this.mfaBackupList.appendChild(el);
    });
  }

  hideBackupCodes() {
    if (this.mfaBackupArea) {
      this.mfaBackupArea.style.display = 'none';
      this.mfaBackupList.innerHTML = '';
    }
  }

  // ─── Alerts ─────────────────────────────────────────────────────────────────
  showAlert(message, type = 'danger') {
    this.alertBox.textContent = message;
    this.alertBox.className = `alert alert-${type}`;
    this.alertBox.style.display = 'flex';
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  clearAlert() {
    this.alertBox.style.display = 'none';
    this.alertBox.textContent = '';
  }

  // ─── Panel switching ─────────────────────────────────────────────────────────
  showPanel(panel) {
    [this.panelList, this.panelSubmit, this.panelMfa, this.panelDetails]
      .forEach(p => { if (p) p.style.display = 'none'; });
    if (panel) panel.style.display = 'block';

    [this.navReports, this.navSubmit, this.navMfa]
      .forEach(n => n && n.classList.remove('active'));

    if (panel === this.panelList)    this.navReports?.classList.add('active');
    if (panel === this.panelSubmit)  this.navSubmit?.classList.add('active');
    if (panel === this.panelMfa)     this.navMfa?.classList.add('active');
  }

  // ─── Header ─────────────────────────────────────────────────────────────────
  renderHeader(user) {
    this.userDisplay.textContent = user.email;
    this.roleBadge.textContent   = user.role;
    this.roleBadge.style.display = 'inline-block';
    this.roleBadge.className     = `badge ${user.role === 'Reporter' ? 'badge-open' : 'badge-review'}`;

    if (user.role !== 'Reporter') {
      this.navSubmitWrap.style.display = 'none';
    }
  }

  // ─── Reports List ────────────────────────────────────────────────────────────
  setReportsLoading() {
    this.reportsLoading.style.display = 'block';
    this.reportsEmpty.style.display   = 'none';
    this.reportsList.innerHTML        = '';
  }

  renderReports(reports, onCardClick) {
    this.reportsLoading.style.display = 'none';

    if (!reports || reports.length === 0) {
      this.reportsEmpty.style.display = 'block';
      return;
    }

    this.reportsEmpty.style.display = 'none';
    this.reportsList.innerHTML = '';

    reports.forEach(report => {
      const badgeClass = {
        'Open': 'badge-open',
        'Under Review': 'badge-review',
        'Resolved': 'badge-resolved'
      }[report.status] || 'badge-open';

      const card = document.createElement('div');
      card.className = 'report-card';
      card.innerHTML = `
        <div class="report-header">
          <span class="report-case-id">${escapeHtml(report.caseId)}</span>
          <div style="display:flex;gap:0.5rem;">
            ${report.isAnonymous ? '<span class="badge badge-anon">Anonymous</span>' : ''}
            <span class="badge ${badgeClass}">${escapeHtml(report.status)}</span>
          </div>
        </div>
        <h3 style="font-size:1.1rem;color:#fff;margin-bottom:0.4rem;">${escapeHtml(report.title)}</h3>
        <p style="color:var(--text-secondary);font-size:0.85rem;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">
          ${escapeHtml(report.description)}
        </p>
        <div style="margin-top:0.8rem;font-size:0.75rem;color:var(--text-secondary);display:flex;justify-content:space-between;">
          <span>${escapeHtml(report.category)}</span>
          <span>${new Date(report.createdAt).toLocaleDateString()}</span>
        </div>
      `;
      card.addEventListener('click', () => onCardClick(report.caseId));
      this.reportsList.appendChild(card);
    });
  }

  // ─── Report Detail ──────────────────────────────────────────────────────────
  renderReportDetail(report, userRole) {
    this.detailCaseId.textContent     = report.caseId;
    this.detailTitle.textContent      = report.title;
    this.detailCategory.textContent   = report.category;
    this.detailDescription.textContent = report.description;

    // Status badge
    const statusCls = { 'Open': 'badge-open', 'Under Review': 'badge-review', 'Resolved': 'badge-resolved' };
    this.detailStatusBadge.textContent = report.status;
    this.detailStatusBadge.className   = `badge ${statusCls[report.status] || 'badge-open'}`;

    // Anonymity
    if (report.isAnonymous) {
      this.detailAnonBadge.style.display    = 'inline-block';
      this.reporterPanel.style.display      = 'none';
    } else {
      this.detailAnonBadge.style.display    = 'none';
      this.reporterPanel.style.display      = 'block';
      this.detailReporterEmail.textContent  = report.reporter?.email || 'Unknown';
    }

    // Attachments
    this.detailAttachList.innerHTML = '';
    if (report.attachments?.length > 0) {
      this.detailAttachArea.style.display = 'block';
      report.attachments.forEach(f => {
        const a = document.createElement('a');
        a.href      = `/api/reports/${report.caseId}/attachments/${f.filename}`;
        a.className = 'attachment-badge';
        a.target    = '_blank';
        a.textContent = `📎 ${escapeHtml(f.originalName)} (${(f.size / 1024).toFixed(1)} KB)`;
        this.detailAttachList.appendChild(a);
      });
    } else {
      this.detailAttachArea.style.display = 'none';
    }

    // Triage controls only for staff
    if (userRole !== 'Reporter') {
      this.modTriagePanel.style.display = 'block';
      this.triageSelect.value           = report.status;
    } else {
      this.modTriagePanel.style.display = 'none';
    }
  }

  // ─── Comments ────────────────────────────────────────────────────────────────
  renderComments(comments) {
    if (!comments || comments.length === 0) {
      this.commentsContainer.innerHTML =
        '<p style="text-align:center;color:var(--text-secondary);font-size:0.85rem;padding:1rem 0;">No messages yet.</p>';
      return;
    }

    this.commentsContainer.innerHTML = '';
    comments.forEach(c => {
      const isStaff = c.authorRole !== 'Reporter';
      const bubble  = document.createElement('div');
      bubble.className = `comment-bubble${isStaff ? ' moderator' : ''}`;

      let author = isStaff ? `${escapeHtml(c.authorRole)}` : 'Student Reporter';
      if (c.author?.email) author += ` (${escapeHtml(c.author.email)})`;
      if (!c.author && !isStaff) author = 'Anonymous Reporter';

      bubble.innerHTML = `
        <div class="comment-meta">
          <span style="font-weight:600;">${author}</span>
          <span>${new Date(c.createdAt).toLocaleTimeString()}</span>
        </div>
        <div class="comment-text">${escapeHtml(c.text)}</div>
      `;
      this.commentsContainer.appendChild(bubble);
    });

    this.commentsContainer.scrollTop = this.commentsContainer.scrollHeight;
  }

  // ─── MFA Settings ────────────────────────────────────────────────────────────
  renderMfaStatus(mfaEnabled) {
    this.mfaSetupArea.style.display   = 'none';
    this.mfaEnableBtn.style.display   = mfaEnabled ? 'none' : 'inline-block';
    this.mfaDisableBtn.style.display  = mfaEnabled ? 'inline-block' : 'none';
    this.mfaCurrentStatus.innerHTML = mfaEnabled
      ? '🔒 MFA is currently <strong style="color:var(--success);">ENABLED</strong>.'
      : '🔓 MFA is currently <strong style="color:var(--danger);">DISABLED</strong>.';
  }

  showMfaSetupArea(secret, qrCode) {
    this.mfaSetupArea.style.display  = 'block';
    this.mfaQrContainer.innerHTML    = `<img src="${qrCode}" alt="MFA QR Code">`;
    this.mfaSecretText.textContent   = `Secret: ${secret}`;
  }
}
