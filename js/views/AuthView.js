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
