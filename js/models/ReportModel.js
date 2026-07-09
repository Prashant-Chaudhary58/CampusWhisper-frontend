/**
 * Model: ReportModel
 * Handles all API communication for reports, triage, and comments.
 * Shares the AuthModel's CSRF token through dependency injection.
 */
export class ReportModel {
  constructor(authModel) {
    this.authModel = authModel;
  }

  async #request(url, options = {}) {
    const safeMethods = ['GET', 'HEAD', 'OPTIONS'];
    const method = (options.method || 'GET').toUpperCase();

    if (!safeMethods.includes(method)) {
      const token = await this.authModel.ensureCsrf();
      options.headers = { ...options.headers, 'X-CSRF-Token': token };
    }

    options.credentials = 'include';
    const res = await fetch(url, options);
    return res;
  }

  async getReports() {
    const res = await this.#request('/api/reports');
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to fetch reports');
    return data.reports;
  }

  async getReport(caseId) {
    const res = await this.#request(`/api/reports/${caseId}`);
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Report not found');
    return data.report;
  }

  async submitReport(formData) {
    const res = await this.#request('/api/reports', {
      method: 'POST',
      body: formData  // FormData — do NOT set Content-Type manually
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to submit report');
    return data;
  }

  async updateStatus(caseId, status) {
    const res = await this.#request(`/api/reports/${caseId}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to update status');
    return data;
  }

  async getComments(caseId) {
    const res = await this.#request(`/api/reports/${caseId}/comments`);
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to fetch comments');
    return data.comments;
  }

  async postComment(caseId, text) {
    const res = await this.#request(`/api/reports/${caseId}/comments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to post comment');
    return data;
  }
}
