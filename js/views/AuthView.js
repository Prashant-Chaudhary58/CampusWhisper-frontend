/**
 * View: AuthView
 * Pure DOM rendering and form helpers for the authentication page (index.html).
 * No API calls — receives data, renders UI.
 */

// ─── Utility ────────────────────────────────────────────────────────────────
export const escapeHtml = (str = '') =>
  String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');

export class AuthView {
  constructor() {
    // Forms
    this.loginForm     = document.getElementById('login-form');
    this.registerForm  = document.getElementById('register-form');
    this.showRegister  = document.getElementById('show-register');
    this.showLogin     = document.getElementById('show-login');

    // Alert
    this.alertBox      = document.getElementById('alert-box');

    // Password strength
    this.regPassword   = document.getElementById('register-password');
    this.bars          = [1, 2, 3, 4].map(n => document.getElementById(`bar-${n}`));
    this.strengthLabel = document.getElementById('strength-label');

    // MFA modal elements
    this.mfaModal      = document.getElementById('mfa-modal');
    this.mfaForm       = document.getElementById('mfa-form');
    this.mfaToken      = document.getElementById('mfa-token');
    this.mfaCancel     = document.getElementById('mfa-cancel');
    this.mfaAlertBox   = document.getElementById('mfa-alert-box');

    // New MFA elements
    this.mfaModalTitle      = document.getElementById('mfa-modal-title');
    this.mfaModalDesc       = document.getElementById('mfa-modal-desc');
    this.mfaTokenLabel      = document.getElementById('mfa-token-label');
    this.mfaSendEmailBtn    = document.getElementById('mfa-send-email-btn');
    this.mfaRequestEmailLink = document.getElementById('mfa-request-email-link');
    this.mfaUseBackupLink   = document.getElementById('mfa-use-backup-link');
    this.mfaUseTotpLink     = document.getElementById('mfa-use-totp-link');
    this.mfaMode            = 'totp'; // default
  }

  setMfaMode(mode) {
    this.mfaMode = mode; // 'totp', 'email', 'backup'
    this.clearAlert(this.mfaAlertBox);
    this.mfaForm.reset();

    if (mode === 'totp') {
      this.mfaModalTitle.textContent = 'Two-Factor Auth';
      this.mfaModalDesc.textContent = 'Enter the 6-digit verification code from your authenticator app.';
      this.mfaTokenLabel.textContent = 'Verification Code';
      this.mfaToken.placeholder = '000000';
      this.mfaToken.maxLength = 6;
      this.mfaSendEmailBtn.style.display = 'none';
      this.mfaRequestEmailLink.style.display = 'block';
      this.mfaUseBackupLink.style.display = 'block';
      this.mfaUseTotpLink.style.display = 'none';
    } else if (mode === 'email') {
      this.mfaModalTitle.textContent = 'Verify via Email';
      this.mfaModalDesc.textContent = 'Request a verification PIN sent to your registered email, then check logs/email_inbox.log.';
      this.mfaTokenLabel.textContent = 'Email PIN Code';
      this.mfaToken.placeholder = '000000';
      this.mfaToken.maxLength = 6;
      this.mfaSendEmailBtn.style.display = 'block';
      this.mfaRequestEmailLink.style.display = 'none';
      this.mfaUseBackupLink.style.display = 'block';
      this.mfaUseTotpLink.style.display = 'block';
    } else if (mode === 'backup') {
      this.mfaModalTitle.textContent = 'Use Recovery Code';
      this.mfaModalDesc.textContent = 'Input a single-use backup recovery code (format: XXXX-XXXX).';
      this.mfaTokenLabel.textContent = 'Backup Recovery Code';
      this.mfaToken.placeholder = 'ABCD-1234';
      this.mfaToken.maxLength = 9;
      this.mfaSendEmailBtn.style.display = 'none';
      this.mfaRequestEmailLink.style.display = 'block';
      this.mfaUseBackupLink.style.display = 'none';
      this.mfaUseTotpLink.style.display = 'block';
    }
  }

  // ─── Alert helpers ──────────────────────────────────────────────────────────
  showAlert(message, type = 'danger', target = null) {
    const el = target || this.alertBox;
    el.textContent = message;
    el.className = `alert alert-${type}`;
    el.style.display = 'flex';
  }

  clearAlert(target = null) {
    const el = target || this.alertBox;
    el.style.display = 'none';
    el.textContent = '';
  }

  // ─── Form toggling ──────────────────────────────────────────────────────────
  showLoginForm() {
    this.clearAlert();
    this.registerForm.style.display = 'none';
    this.loginForm.style.display    = 'block';
  }

  showRegisterForm() {
    this.clearAlert();
    this.loginForm.style.display    = 'none';
    this.registerForm.style.display = 'block';
  }

  // ─── Password strength meter ─────────────────────────────────────────────────
  renderStrength(score, label) {
    this.bars.forEach(b => (b.className = 'strength-bar'));
    this.strengthLabel.textContent = `Strength: ${label}`;

    if (score === 0) return;
    const cls = score <= 2 ? 'weak' : score <= 4 ? 'medium' : 'strong';
    const count = score <= 2 ? 1 : score <= 4 ? 3 : 4;
    this.bars.slice(0, count).forEach(b => b.classList.add(cls));
  }

  // ─── MFA Modal ───────────────────────────────────────────────────────────────
  openMfaModal() {
    this.mfaModal.classList.add('active');
    this.mfaToken.focus();
  }

  closeMfaModal() {
    this.mfaModal.classList.remove('active');
    this.mfaForm.reset();
    this.clearAlert(this.mfaAlertBox);
  }

  // ─── Form value getters ──────────────────────────────────────────────────────
  getLoginValues() {
    return {
      email:    document.getElementById('login-email').value.trim(),
      password: document.getElementById('login-password').value
    };
  }

  getRegisterValues() {
    return {
      email:    document.getElementById('register-email').value.trim(),
      password: this.regPassword.value
    };
  }

  getMfaToken() {
    return this.mfaToken.value.trim();
  }

  resetRegisterForm() {
    this.registerForm.reset();
    this.bars.forEach(b => (b.className = 'strength-bar'));
    this.strengthLabel.textContent = 'Strength: Too Short';
  }
}
