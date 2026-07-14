import { authService } from './AuthService';

class ReportService {
  async #request(url, options = {}) {
    const safeMethods = ['GET', 'HEAD', 'OPTIONS'];
    const method = (options.method || 'GET').toUpperCase();

    if (!safeMethods.includes(method)) {
      const token = await authService.ensureCsrf();
      options.headers = { ...options.headers, 'X-CSRF-Token': token };
    }

    options.credentials = 'include';
    const res = await fetch(url, options);
    return res;
  }

  async getReports(mine = false) {
    const url = mine ? '/api/reports?mine=true' : '/api/reports';
    const res = await this.#request(url);
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
      body: formData
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

  async togglePin(caseId) {
    const res = await this.#request(`/api/reports/${caseId}/pin`, {
      method: 'PATCH'
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to toggle pin');
    return data;
  }

  async agreeReport(caseId) {
    const res = await this.#request(`/api/reports/${caseId}/agree`, {
      method: 'PATCH'
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to toggle agreement');
    return data;
  }

  async disagreeReport(caseId) {
    const res = await this.#request(`/api/reports/${caseId}/disagree`, {
      method: 'PATCH'
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to toggle disagreement');
    return data;
  }
}

export const reportService = new ReportService();
