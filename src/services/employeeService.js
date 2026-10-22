/**
 * Employee service backed by the FastAPI backend (PostgreSQL).
 */
import { apiRequest } from './api';

export const employeeService = {
  async getEmployees(params = {}) {
    const query = new URLSearchParams();
    if (params.search) query.set('search', params.search);
    if (params.department) query.set('department', params.department);
    if (params.active_only !== undefined) query.set('active_only', String(params.active_only));
    const qs = query.toString();
    return apiRequest(`/employees/${qs ? `?${qs}` : ''}`);
  },

  async createEmployee(data) {
    return apiRequest('/employees/', { method: 'POST', body: JSON.stringify(data) });
  },

  async updateEmployee(id, data) {
    return apiRequest(`/employees/${encodeURIComponent(id)}`, { method: 'PUT', body: JSON.stringify(data) });
  },

  async deleteEmployee(id) {
    return apiRequest(`/employees/${encodeURIComponent(id)}`, { method: 'DELETE' });
  },
};
