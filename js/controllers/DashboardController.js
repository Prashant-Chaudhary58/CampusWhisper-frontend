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
    await this.#loadProfile();
    this.#bindNavEvents();
    this.#bindReportEvents();
    this.#bindMfaEvents();
  }

  // ─── Profile & Auth ──────────────────────────────────────────────────────────
  async #loadProfile() {
    try {
      this.#currentUser = await this.authModel.getProfile();
      this.view.renderHeader(this.#currentUser);
      await this.#loadReports();
    } catch {
      window.location.href = 'index.html';
    }
  }

  // ─── Navigation ──────────────────────────────────────────────────────────────
  #bindNavEvents() {
    this.view.logoutBtn?.addEventListener('click', async () => {
      try { await this.authModel.logout(); }
      finally { window.location.href = 'index.html'; }
    });

    this.view.navReports?.addEventListener('click', e => {
      e.preventDefault();
      this.#stopCommentPolling();
      this.view.clearAlert();
      this.view.hideBackupCodes();
      this.view.showPanel(this.view.panelList);
      this.#loadReports();
    });

    this.view.navSubmit?.addEventListener('click', e => {
      e.preventDefault();
      this.#stopCommentPolling();
      this.view.clearAlert();
      this.view.hideBackupCodes();
      this.view.showPanel(this.view.panelSubmit);
    });

    this.view.navMfa?.addEventListener('click', e => {
      e.preventDefault();
      this.#stopCommentPolling();
      this.view.clearAlert();
      this.view.hideBackupCodes();
      this.view.showPanel(this.view.panelMfa);
      this.#loadMfaStatus();
    });

    // Back button on detail panel
    document.getElementById('details-back-btn')?.addEventListener('click', e => {
      e.preventDefault();
      this.#stopCommentPolling();
      this.view.clearAlert();
      this.view.hideBackupCodes();
      this.view.showPanel(this.view.panelList);
      this.#loadReports();
    });
  }

  // ─── Reports ─────────────────────────────────────────────────────────────────
  async #loadReports() {
    this.view.setReportsLoading();
    try {
      const reports = await this.reportModel.getReports();
      this.view.renderReports(reports, caseId => this.#openDetail(caseId));
    } catch (err) {
      this.view.showAlert(`Error loading reports: ${err.message}`);
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
          this.view.clearAlert();
          this.view.showPanel(this.view.panelList);
          this.#loadReports();
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
    this.#activeCaseId = caseId;
    this.#stopCommentPolling();
    this.view.clearAlert();
    this.view.showPanel(this.view.panelDetails);

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
