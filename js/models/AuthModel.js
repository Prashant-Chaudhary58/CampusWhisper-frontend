/**
 * Model: AuthModel
 * Handles all API communication for authentication and MFA.
 * No DOM interaction here — pure data access.
 */
export class AuthModel {
  #csrfToken = null;

  async #fetchCsrf() {
    const res = await fetch('/api/csrf-token', { credentials: 'include' });
    const data = await res.json();
    this.#csrfToken = data.csrfToken;
  }

  async #request(url, options = {}) {
    const safeMethods = ['GET', 'HEAD', 'OPTIONS'];
    const method = (options.method || 'GET').toUpperCase();

    if (!safeMethods.includes(method)) {
      if (!this.#csrfToken) await this.#fetchCsrf();
      options.headers = { ...options.headers, 'X-CSRF-Token': this.#csrfToken };
    }

    options.credentials = 'include';
    let res = await fetch(url, options);

    // CSRF token expired — rotate and retry once
    if (res.status === 403) {
      await this.#fetchCsrf();
      if (options.headers) options.headers['X-CSRF-Token'] = this.#csrfToken;
      res = await fetch(url, options);
    }

    return res;
  }

  async login(email, password) {
    const res = await this.#request('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Login failed');
    return data;
  }

  async register(email, password) {
    const res = await this.#request('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Registration failed');
    return data;
  }

  async getProfile() {
    const res = await this.#request('/api/auth/me');
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Session expired');
    return data.user;
  }

  async logout() {
    const res = await this.#request('/api/auth/logout', { method: 'POST' });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Logout failed');
    return data;
  }

  // ─── MFA ────────────────────────────────────────────────────────────────────

  async initMfaSetup() {
    const res = await this.#request('/api/mfa/setup', { method: 'POST' });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to initialize MFA');
    return data; // { secret, qrCode }
  }

  async activateMfa(token) {
    const res = await this.#request('/api/mfa/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'MFA activation failed');
    return data;
  }

  async loginVerifyMfa(token) {
    const res = await this.#request('/api/mfa/login-verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'MFA verification failed');
    return data;
  }

  async loginVerifyMfaBackup(code) {
    const res = await this.#request('/api/mfa/backup-verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Backup code verification failed');
    return data;
  }

  async requestEmailMfaCode() {
    const res = await this.#request('/api/mfa/email-request', { method: 'POST' });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Requesting Email code failed');
    return data;
  }

  async loginVerifyEmailMfa(token) {
    const res = await this.#request('/api/mfa/email-verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Email code verification failed');
    return data;
  }

  async disableMfa(token) {
    const res = await this.#request('/api/mfa/disable', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to disable MFA');
    return data;
  }

  // ─── CSRF Token Accessor (for ReportModel to reuse) ─────────────────────────
  async ensureCsrf() {
    if (!this.#csrfToken) await this.#fetchCsrf();
    return this.#csrfToken;
  }

  get csrfToken() {
    return this.#csrfToken;
  }
}
