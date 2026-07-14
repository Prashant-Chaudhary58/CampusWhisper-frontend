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
    this.alertBox       = document.getElementById('alert-box');

    // Right Sidebar elements
    this.profileTrigger        = document.getElementById('profile-trigger');
    this.profileAvatarInitial  = document.getElementById('profile-avatar-initial');
    this.rightSidebar          = document.getElementById('right-sidebar');
    this.sidebarOverlay        = document.getElementById('sidebar-overlay');
    this.closeSidebarBtn       = document.getElementById('close-sidebar');
    this.sidebarAvatarInitial  = document.getElementById('sidebar-avatar-initial');
    this.sidebarProfileEmail   = document.getElementById('sidebar-profile-email');
    this.sidebarRoleBadge      = document.getElementById('sidebar-role-badge');

    // Sidebar navigation links
    this.sideNavProfile        = document.getElementById('side-nav-profile');
    this.sideNavMfa            = document.getElementById('side-nav-mfa');
    this.logoutBtn             = document.getElementById('side-logout-btn');

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
    this.panelProfile   = document.getElementById('panel-profile');

    // Profile detail panel fields
    this.profileDetailEmail = document.getElementById('profile-detail-email');
    this.profileDetailRole  = document.getElementById('profile-detail-role');
    this.profileDetailMfa   = document.getElementById('profile-detail-mfa');

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

  toggleSidebar(show) {
    if (show) {
      this.rightSidebar?.classList.add('active');
      this.sidebarOverlay?.classList.add('active');
    } else {
      this.rightSidebar?.classList.remove('active');
      this.sidebarOverlay?.classList.remove('active');
    }
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
    [this.panelList, this.panelSubmit, this.panelMfa, this.panelDetails, this.panelProfile]
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
    const initial = (user.email || 'U').charAt(0).toUpperCase();
    if (this.profileAvatarInitial) this.profileAvatarInitial.textContent = initial;
    if (this.sidebarAvatarInitial) this.sidebarAvatarInitial.textContent = initial;

    this.userDisplay.textContent = user.email;
    this.roleBadge.textContent   = user.role;
    this.roleBadge.style.display = 'inline-block';
    this.roleBadge.className     = `badge ${user.role === 'Reporter' ? 'badge-open' : 'badge-review'}`;

    if (this.sidebarProfileEmail) this.sidebarProfileEmail.textContent = user.email;
    if (this.sidebarRoleBadge) {
      this.sidebarRoleBadge.textContent = user.role;
      this.sidebarRoleBadge.className = `badge ${user.role === 'Reporter' ? 'badge-open' : 'badge-review'}`;
    }

    if (this.profileDetailEmail) this.profileDetailEmail.textContent = user.email;
    if (this.profileDetailRole) this.profileDetailRole.textContent = user.role;
    if (this.profileDetailMfa) {
      this.profileDetailMfa.textContent = user.mfaEnabled ? '🛡️ Enabled' : '⚠️ Disabled';
      this.profileDetailMfa.style.color = user.mfaEnabled ? 'var(--success)' : 'var(--warning)';
    }

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

  renderReports(reports, onCardClick, onPinClick, onAgreeClick, onDisagreeClick) {
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
          <div style="display:flex;align-items:center;gap:0.5rem;">
            <button class="pin-btn ${report.isPinned ? 'pinned' : ''}" title="${report.isPinned ? 'Unpin report' : 'Pin report'}">
              📌
            </button>
            <span class="report-case-id">${escapeHtml(report.caseId)}</span>
          </div>
          <div style="display:flex;gap:0.5rem;align-items:center;">
            ${report.isAnonymous ? '<span class="badge badge-anon">Anonymous</span>' : ''}
            <span class="badge ${badgeClass}">${escapeHtml(report.status)}</span>
          </div>
        </div>
        <h3 style="font-size:1.1rem;color:#fff;margin-bottom:0.4rem;">${escapeHtml(report.title)}</h3>
        <p class="report-card-desc">
          ${escapeHtml(report.description)}
        </p>
        <div style="margin-top:1rem;font-size:0.75rem;color:var(--text-secondary);display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:0.5rem;">
          <span>${escapeHtml(report.category)}</span>
          <div style="display:flex;align-items:center;gap:1.2rem;">
            <div class="vote-container">
              <button class="vote-btn agree-btn ${report.userHasAgreed ? 'voted' : ''}" title="Agree with report">
                <span>✓</span> <span class="vote-count">${report.agreeCount || 0}</span>
              </button>
              <button class="vote-btn disagree-btn ${report.userHasDisagreed ? 'voted' : ''}" title="Disagree with report">
                <span>✗</span> <span class="vote-count">${report.disagreeCount || 0}</span>
              </button>
            </div>
            <span>${new Date(report.createdAt).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}</span>
          </div>
        </div>
      `;

      card.querySelector('.pin-btn').addEventListener('click', e => {
        e.stopPropagation();
        onPinClick(report.caseId);
      });

      card.querySelector('.agree-btn').addEventListener('click', e => {
        e.stopPropagation();
        onAgreeClick(report.caseId);
      });

      card.querySelector('.disagree-btn').addEventListener('click', e => {
        e.stopPropagation();
        onDisagreeClick(report.caseId);
      });

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
