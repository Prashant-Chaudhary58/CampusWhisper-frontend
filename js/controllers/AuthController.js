import { AuthModel } from '../models/AuthModel.js';
import { AuthView }  from '../views/AuthView.js';
import { PasswordValidator } from '../utils/PasswordValidator.js';

/**
 * Controller: AuthController
 * Wires together the AuthModel and AuthView for index.html.
 * Handles all user interactions on the auth page.
 */
export class AuthController {
  constructor() {
    this.model = new AuthModel();
    this.view  = new AuthView();
  }

  init() {
    // Prefetch CSRF token silently on page load
    this.model.ensureCsrf();

    // Form toggles
    this.view.showRegister?.addEventListener('click', e => {
      e.preventDefault();
      this.view.showRegisterForm();
    });
    this.view.showLogin?.addEventListener('click', e => {
      e.preventDefault();
      this.view.showLoginForm();
    });

    // Password strength real-time feedback
    this.view.regPassword?.addEventListener('input', () => {
      const { score, label } = PasswordValidator.validate(this.view.regPassword.value);
      this.view.renderStrength(score, label);
    });

    // Login submission
    this.view.loginForm?.addEventListener('submit', e => this.#handleLogin(e));

    // Register submission
    this.view.registerForm?.addEventListener('submit', e => this.#handleRegister(e));

    // MFA modal actions
    this.view.mfaForm?.addEventListener('submit',   e => this.#handleMfaVerify(e));
    this.view.mfaCancel?.addEventListener('click',  ()  => this.view.closeMfaModal());

    // MFA mode toggle links
    this.view.mfaRequestEmailLink?.addEventListener('click', e => {
      e.preventDefault();
      this.view.setMfaMode('email');
    });

    this.view.mfaUseBackupLink?.addEventListener('click', e => {
      e.preventDefault();
      this.view.setMfaMode('backup');
    });

    this.view.mfaUseTotpLink?.addEventListener('click', e => {
      e.preventDefault();
      this.view.setMfaMode('totp');
    });

    // Send email code button
    this.view.mfaSendEmailBtn?.addEventListener('click', () => this.#handleSendEmailCode());
  }

  async #handleLogin(e) {
    e.preventDefault();
    this.view.clearAlert();
    const { email, password } = this.view.getLoginValues();

    try {
      const data = await this.model.login(email, password);
      if (data.mfaRequired) {
        this.view.setMfaMode('totp'); // Start with TOTP by default
        this.view.openMfaModal();
      } else {
        window.location.href = 'dashboard.html';
      }
    } catch (err) {
      this.view.showAlert(err.message);
    }
  }

  async #handleRegister(e) {
    e.preventDefault();
    this.view.clearAlert();
    const { email, password } = this.view.getRegisterValues();

    // Client-side domain validation (mirrors the server; never the only check)
    const allowedDomains = ['@university.edu', '@softwarica.edu', '@coventry.ac.uk'];
    const hasValidDomain = allowedDomains.some(domain => email.endsWith(domain));
    if (!hasValidDomain) {
      return this.view.showAlert('Only institutional emails (@university.edu, @softwarica.edu, or @coventry.ac.uk) are accepted.');
    }

    const { isValid } = PasswordValidator.validate(password);
    if (!isValid) {
      return this.view.showAlert(
        'Password must be at least 12 characters with uppercase, lowercase, a number, and a special character.'
      );
    }

    try {
      const data = await this.model.register(email, password);
      this.view.showAlert(data.message, 'success');
      this.view.resetRegisterForm();
      setTimeout(() => this.view.showLoginForm(), 2000);
    } catch (err) {
      this.view.showAlert(err.message);
    }
  }

  async #handleSendEmailCode() {
    this.view.clearAlert(this.view.mfaAlertBox);
    try {
      this.view.mfaSendEmailBtn.disabled = true;
      this.view.mfaSendEmailBtn.textContent = 'Sending...';
      const data = await this.model.requestEmailMfaCode();
      this.view.showAlert(data.message, 'success', this.view.mfaAlertBox);
    } catch (err) {
      this.view.showAlert(err.message, 'danger', this.view.mfaAlertBox);
    } finally {
      this.view.mfaSendEmailBtn.disabled = false;
      this.view.mfaSendEmailBtn.textContent = 'Send Code to Email';
    }
  }

  async #handleMfaVerify(e) {
    e.preventDefault();
    this.view.clearAlert(this.view.mfaAlertBox);
    const token = this.view.getMfaToken();

    try {
      let data;
      if (this.view.mfaMode === 'totp') {
        data = await this.model.loginVerifyMfa(token);
      } else if (this.view.mfaMode === 'email') {
        data = await this.model.loginVerifyEmailMfa(token);
      } else if (this.view.mfaMode === 'backup') {
        data = await this.model.loginVerifyMfaBackup(token);
      }

      this.view.closeMfaModal();
      window.location.href = 'dashboard.html';
    } catch (err) {
      this.view.showAlert(err.message, 'danger', this.view.mfaAlertBox);
    }
  }
}
