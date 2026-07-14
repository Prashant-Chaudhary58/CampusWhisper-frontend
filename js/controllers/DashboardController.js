import { AuthModel }      from '../models/AuthModel.js';
import { ReportModel }    from '../models/ReportModel.js';
import { DashboardView }  from '../views/DashboardView.js';

/**
 * Controller: DashboardController
 * Wires together models and view for dashboard.html.
 * Owns the live-update polling loop for the comments panel.
 */
export class DashboardController {
  #currentUser     = null;
  #activeCaseId    = null;
  #commentInterval = null;

  constructor() {
    this.authModel   = new AuthModel();
    this.reportModel = new ReportModel(this.authModel);
    this.view        = new DashboardView();
  }

  async init() {
    await this.authModel.ensureCsrf();
    
    try {
      this.#currentUser = await this.authModel.getProfile();
      this.view.renderHeader(this.#currentUser);
    } catch {
      window.location.href = 'index.html';
      return;
    }

    // Initialize state history: The browser's initial entry is null. We push panel-list on top.
    history.pushState({ panelId: 'panel-list' }, '');

    window.addEventListener('popstate', e => this.#handlePopState(e));

    this.#bindNavEvents();
    this.#bindReportEvents();
    this.#bindMfaEvents();
    this.#bindHistoryModalEvents();

    // Load initial list content
    await this.#loadReports();
  }

  async #loadProfileDetails() {
    try {
      this.#currentUser = await this.authModel.getProfile();
      this.view.renderHeader(this.#currentUser);
    } catch (err) {
      this.view.showAlert(`Error loading profile: ${err.message}`);
    }
  }

  // ─── Navigation ──────────────────────────────────────────────────────────────
  #bindNavEvents() {
    // Sidebar toggles
    this.view.profileTrigger?.addEventListener('click', () => {
      this.view.toggleSidebar(true);
    });

    this.view.closeSidebarBtn?.addEventListener('click', () => {
      this.view.toggleSidebar(false);
    });

    this.view.sidebarOverlay?.addEventListener('click', () => {
      this.view.toggleSidebar(false);
    });

    // Sidebar Links
    this.view.sideNavProfile?.addEventListener('click', e => {
      e.preventDefault();
      this.view.toggleSidebar(false);
      this.#navigateTo('panel-profile');
    });

    this.view.sideNavMfa?.addEventListener('click', e => {
      e.preventDefault();
      this.view.showSidebarView('mfa');
      this.#stopCommentPolling();
      this.view.clearAlert();
      this.view.hideBackupCodes();
      this.#loadMfaStatus();
    });

    this.view.closeSidebarMfaBtn?.addEventListener('click', () => {
      this.view.toggleSidebar(false);
    });

    this.view.mfaBackToMenuBtn?.addEventListener('click', e => {
      e.preventDefault();
      this.view.showSidebarView('menu');
    });

    this.view.sideNavMyReports?.addEventListener('click', e => {
      e.preventDefault();
      this.view.toggleSidebar(false);
      this.#navigateTo('panel-my-reports');
    });

    this.view.logoutBtn?.addEventListener('click', async () => {
      try { await this.authModel.logout(); }
      finally { window.location.href = 'index.html'; }
    });

    this.view.navReports?.addEventListener('click', e => {
      e.preventDefault();
      this.#navigateTo('panel-list');
    });

    this.view.navSubmit?.addEventListener('click', e => {
      e.preventDefault();
      this.#navigateTo('panel-submit');
    });



    // Back button on detail panel
    document.getElementById('details-back-btn')?.addEventListener('click', e => {
      e.preventDefault();
      history.back(); // Naturally goes back in history stack
    });
  }

  #navigateTo(panelId, pushState = true) {
    this.#stopCommentPolling();
    this.view.clearAlert();
    this.view.hideBackupCodes();

    let targetPanel = null;
    let loadFn = null;

    if (panelId === 'panel-list') {
      targetPanel = this.view.panelList;
      loadFn = () => this.#loadReports();
    } else if (panelId === 'panel-submit') {
      targetPanel = this.view.panelSubmit;
    } else if (panelId === 'panel-profile') {
      targetPanel = this.view.panelProfile;
      loadFn = () => this.#loadProfileDetails();
    } else if (panelId === 'panel-my-reports') {
      targetPanel = this.view.panelMyReports;
      loadFn = () => this.#loadMyReports();
    } else if (panelId.startsWith('panel-details:')) {
      const caseId = panelId.split(':')[1];
      targetPanel = this.view.panelDetails;
      loadFn = () => this.#openDetailContent(caseId);
    }

    if (targetPanel) {
      this.view.showPanel(targetPanel);
      if (loadFn) loadFn();
    }

    if (pushState) {
      history.pushState({ panelId }, '');
    }
  }

  #handlePopState(e) {
    const state = e.state;
    console.log('[PopState] popped state:', state);
    if (!state || !state.panelId) {
      // Immediately push state back so they stay locked on dashboard if they click cancel (No)
      history.pushState({ panelId: 'panel-list' }, '');
      this.view.showLogoutConfirmModal(true);
      return;
    }
    this.#navigateTo(state.panelId, false);
  }

  #bindHistoryModalEvents() {
    this.view.logoutConfirmNo?.addEventListener('click', () => {
      this.view.showLogoutConfirmModal(false);
    });

    this.view.logoutConfirmYes?.addEventListener('click', async () => {
      this.view.showLogoutConfirmModal(false);
      try {
        await this.authModel.logout();
      } finally {
        window.location.href = 'index.html';
      }
    });
  }

  // ─── Reports ─────────────────────────────────────────────────────────────────
  async #loadReports() {
    this.view.setReportsLoading();
    try {
      const reports = await this.reportModel.getReports();
      this.view.renderReports(
        reports,
        caseId => this.#openDetail(caseId),
        caseId => this.#togglePin(caseId),
        caseId => this.#handleAgree(caseId),
        caseId => this.#handleDisagree(caseId)
      );
    } catch (err) {
      this.view.showAlert(`Error loading reports: ${err.message}`);
    }
  }

  async #loadMyReports() {
    this.view.setMyReportsLoading();
    try {
      const reports = await this.reportModel.getReports(true);
      this.view.renderMyReports(
        reports,
        caseId => this.#openDetail(caseId),
        caseId => this.#togglePin(caseId),
        caseId => this.#handleAgree(caseId),
        caseId => this.#handleDisagree(caseId)
      );
    } catch (err) {
      this.view.showAlert(`Error loading my reports: ${err.message}`);
    }
  }

  async #togglePin(caseId) {
    try {
      await this.reportModel.togglePin(caseId);
      await this.#reloadActivePanel();
    } catch (err) {
      this.view.showAlert(`Error toggling pin: ${err.message}`);
    }
  }

  async #handleAgree(caseId) {
    try {
      await this.reportModel.agreeReport(caseId);
      await this.#reloadActivePanel();
    } catch (err) {
      this.view.showAlert(`Error toggling agreement: ${err.message}`);
    }
  }

  async #handleDisagree(caseId) {
    try {
      await this.reportModel.disagreeReport(caseId);
      await this.#reloadActivePanel();
    } catch (err) {
      this.view.showAlert(`Error toggling disagreement: ${err.message}`);
    }
  }

  async #reloadActivePanel() {
    if (this.view.panelMyReports && this.view.panelMyReports.style.display === 'block') {
      await this.#loadMyReports();
    } else {
      await this.#loadReports();
    }
  }

  #bindReportEvents() {
    // Submit report form
    document.getElementById('submit-report-form')?.addEventListener('submit', async e => {
      e.preventDefault();
      this.view.clearAlert();

      const formData = new FormData();
      formData.append('title',       document.getElementById('report-title').value);
      formData.append('category',    document.getElementById('report-category').value);
      formData.append('description', document.getElementById('report-description').value);
      formData.append('isAnonymous', document.getElementById('report-anonymous').checked);

      const files = document.getElementById('report-files').files;
      for (let i = 0; i < Math.min(files.length, 3); i++) {
        formData.append('attachments', files[i]);
      }

      try {
        const result = await this.reportModel.submitReport(formData);
        this.view.showAlert(`Report submitted! Save your Case ID: ${result.caseId}`, 'success');
        e.target.reset();
        setTimeout(() => {
          this.#navigateTo('panel-list');
        }, 3000);
      } catch (err) {
        this.view.showAlert(err.message);
      }
    });

    // Triage status form (only rendered for staff)
    document.getElementById('triage-status-form')?.addEventListener('submit', async e => {
      e.preventDefault();
      this.view.clearAlert();
      const status = this.view.triageSelect.value;
      try {
        await this.reportModel.updateStatus(this.#activeCaseId, status);
        this.view.showAlert('Status updated successfully.', 'success');
        await this.#openDetail(this.#activeCaseId);
      } catch (err) {
        this.view.showAlert(err.message);
      }
    });

    // Comment submission form
    document.getElementById('comment-submission-form')?.addEventListener('submit', async e => {
      e.preventDefault();
      const input = document.getElementById('comment-text');
      const text  = input.value.trim();
      if (!text) return;

      try {
        await this.reportModel.postComment(this.#activeCaseId, text);
        input.value = '';
        await this.#loadComments();
      } catch (err) {
        this.view.showAlert(err.message);
      }
    });
  }

  async #openDetail(caseId) {
    this.#navigateTo(`panel-details:${caseId}`);
  }

  async #openDetailContent(caseId) {
    this.#activeCaseId = caseId;
    try {
      const report = await this.reportModel.getReport(caseId);
      this.view.renderReportDetail(report, this.#currentUser.role);
      await this.#loadComments();
      // Poll comments every 5 s while the detail panel is open
      this.#commentInterval = setInterval(() => this.#loadComments(), 5000);
    } catch (err) {
      this.view.showAlert(`Error loading details: ${err.message}`);
    }
  }

  async #loadComments() {
    try {
      const comments = await this.reportModel.getComments(this.#activeCaseId);
      this.view.renderComments(comments);
    } catch (err) {
      console.error('Comment fetch error:', err.message);
    }
  }

  #stopCommentPolling() {
    if (this.#commentInterval) {
      clearInterval(this.#commentInterval);
      this.#commentInterval = null;
    }
  }

  // ─── MFA Settings ────────────────────────────────────────────────────────────
  #bindMfaEvents() {
    this.view.mfaEnableBtn?.addEventListener('click', async () => {
      this.view.clearAlert();
      this.view.mfaQrContainer.innerHTML = 'Generating QR code...';
      this.view.mfaSetupArea.style.display = 'block';

      try {
        const { secret, qrCode } = await this.authModel.initMfaSetup();
        this.view.showMfaSetupArea(secret, qrCode);
      } catch (err) {
        this.view.showAlert(err.message);
        this.view.mfaSetupArea.style.display = 'none';
      }
    });

    document.getElementById('mfa-activation-form')?.addEventListener('submit', async e => {
      e.preventDefault();
      this.view.clearAlert();
      const token = document.getElementById('mfa-activation-code').value.trim();

      try {
        const data = await this.authModel.activateMfa(token);
        e.target.reset();
        
        if (data.backupCodes) {
          this.view.showAlert('MFA activated successfully! Please write down or print the backup recovery codes below.', 'success');
          this.view.showBackupCodes(data.backupCodes);
        } else {
          this.view.showAlert('MFA activated successfully!', 'success');
          setTimeout(() => {
            this.view.clearAlert();
            this.#loadMfaStatus();
          }, 2000);
        }
      } catch (err) {
        this.view.showAlert(err.message);
      }
    });

    this.view.mfaBackupAckBtn?.addEventListener('click', () => {
      this.view.clearAlert();
      this.view.hideBackupCodes();
      this.#loadMfaStatus();
    });

    this.view.mfaDisableBtn?.addEventListener('click', async () => {
      const token = prompt('Enter your current 6-digit authenticator code to disable MFA:');
      if (!token) return;

      try {
        await this.authModel.disableMfa(token);
        this.view.showAlert('MFA disabled successfully.', 'success');
        this.#loadMfaStatus();
      } catch (err) {
        this.view.showAlert(err.message);
      }
    });
  }

  async #loadMfaStatus() {
    try {
      const user = await this.authModel.getProfile();
      this.#currentUser = user;
      this.view.renderMfaStatus(user.mfaEnabled);
    } catch (err) {
      this.view.mfaCurrentStatus.textContent = 'Error loading security settings.';
    }
  }
}
