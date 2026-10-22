/**
 * Attendance service backed by the FastAPI backend (PostgreSQL).
 */
import { apiRequest, apiDownload } from './api';

export const attendanceService = {
  /** Returns a map of { [employeeId]: record } for the given date (YYYY-MM-DD). */
  async getRecordsByDate(dateStr) {
    return apiRequest(`/attendance/by-date/${dateStr}`);
  },

  /** Clock in/out for today. payload: { employee_id, type: 'in'|'out', location? } */
  async punch({ employee_id, type, location }) {
    return apiRequest('/attendance/punch', {
      method: 'POST',
      body: JSON.stringify({ employee_id, type, ...(location ? { location } : {}) }),
    });
  },

  /** Manager/admin edit of one field set on a record, e.g. { status, location, clock_in, clock_out }. */
  async patchRecord(employee_id, dateStr, patchData) {
    const { status, location, clock_in, clock_out, notes } = patchData;
    const body = { status, location, clock_in, clock_out, notes };
    Object.keys(body).forEach((k) => body[k] === undefined && delete body[k]);
    const qs = new URLSearchParams({ employee_id, target_date: dateStr });
    return apiRequest(`/attendance/patch-by-date?${qs}`, { method: 'POST', body: JSON.stringify(body) });
  },

  /** { total_staff, in_office, field_remote, absent, late, present, total_hours_worked } */
  async getSummary(dateStr) {
    return apiRequest(`/attendance/summary?target_date=${dateStr}`);
  },

  /** [{ date, day_name, rate, present, late, absent }] for the past N days. */
  async getTrends(days = 7) {
    return apiRequest(`/analytics/trends?days=${days}`);
  },

  /** [{ department, total, present, late, absent }] */
  async getDepartmentBreakdown(dateStr) {
    return apiRequest(`/analytics/department-breakdown?target_date=${dateStr}`);
  },

  /** Downloads the day's CSV (sends the JWT, which a plain link cannot). */
  async downloadCsv(dateStr) {
    return apiDownload(`/analytics/export-csv?target_date=${dateStr}`, `attendance-${dateStr}.csv`);
  },
};
