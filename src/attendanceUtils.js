import { useEffect, useState } from 'react';

/* ---------- Constants ---------- */
export const LOCATIONS = ['In-Office', 'Remote', 'Field Duty'];
export const STATUSES = ['Present', 'Late', 'Absent'];
export const SHIFT_START = '09:30'; // clock-ins after this time are marked "Late"
export const EMPTY_RECORD = { status: 'Absent', location: 'In-Office', clockIn: '', clockOut: '' };

/* ---------- Date / time helpers (all local time, never UTC) ---------- */
const pad = (n) => String(n).padStart(2, '0');

/** Date -> "YYYY-MM-DD" in the user's local timezone (toISOString would shift the day). */
export const toDateKey = (d = new Date()) =>
  `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

/** Current time as "HH:MM:SS". */
export const nowTime = () => {
  const d = new Date();
  return `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
};

/** Move a date key forward/back by N days. */
export const shiftDateKey = (key, days) => {
  const [y, m, d] = key.split('-').map(Number);
  return toDateKey(new Date(y, m - 1, d + days));
};

export const formatLongDate = (key) => {
  const [y, m, d] = key.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString(undefined, {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  });
};

/** "HH:MM" or "HH:MM:SS" -> minutes since midnight (null if empty). */
const toMinutes = (t) => {
  if (!t) return null;
  const [h, m, s = 0] = t.split(':').map(Number);
  return h * 60 + m + s / 60;
};

export const isLate = (time) => toMinutes(time) > toMinutes(SHIFT_START);

/** Minutes between clock-in and clock-out. A clock-out earlier than clock-in is treated as an overnight shift. */
export const minutesWorked = (clockIn, clockOut) => {
  const a = toMinutes(clockIn);
  const b = toMinutes(clockOut);
  if (a === null || b === null) return null;
  return b - a < 0 ? b - a + 1440 : b - a;
};

export const formatDuration = (min) => {
  if (min === null || min === undefined) return '—';
  const total = Math.round(min);
  return `${Math.floor(total / 60)}h ${pad(total % 60)}m`;
};

/* ---------- Hooks ---------- */

/** useState that mirrors to localStorage and stays in sync across browser tabs. */
export function useLocalStorage(key, initialValue) {
  const [value, setValue] = useState(() => {
    try {
      const raw = window.localStorage.getItem(key);
      return raw !== null ? JSON.parse(raw) : initialValue;
    } catch {
      return initialValue; // corrupted JSON or storage blocked
    }
  });

  useEffect(() => {
    try {
      window.localStorage.setItem(key, JSON.stringify(value));
    } catch (err) {
      console.warn(`Could not save "${key}" to localStorage`, err);
    }
  }, [key, value]);

  useEffect(() => {
    const onStorage = (e) => {
      if (e.key === key && e.newValue !== null) {
        try { setValue(JSON.parse(e.newValue)); } catch { /* ignore */ }
      }
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, [key]);

  return [value, setValue];
}

/** Returns a Date that refreshes every second (drives the live clock and running timers). */
export function useNow(intervalMs = 1000) {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), intervalMs);
    return () => clearInterval(id);
  }, [intervalMs]);
  return now;
}

/* ---------- CSV export ---------- */

/** Quote a CSV cell and neutralise spreadsheet formula injection (=, +, -, @). */
const cell = (value) => {
  let s = String(value ?? '');
  if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`;
  return /[",\r\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

export function exportDayCsv(dateKey, staff, dayRecords) {
  const header = ['Date', 'Employee ID', 'Name', 'Department', 'Status', 'Location', 'Clock In', 'Clock Out', 'Hours Worked'];
  const rows = staff.map((s) => {
    const r = { ...EMPTY_RECORD, ...(dayRecords[s.id] || {}) };
    const mins = minutesWorked(r.clockIn, r.clockOut);
    return [dateKey, s.code, s.name, s.department, r.status, r.location, r.clockIn, r.clockOut,
      mins === null ? '' : (mins / 60).toFixed(2)];
  });
  const csv = [header, ...rows].map((row) => row.map(cell).join(',')).join('\r\n');

  // BOM makes Excel read UTF-8 names correctly
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `attendance-${dateKey}.csv`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
