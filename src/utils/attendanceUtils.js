export const LOCATIONS = ['In-Office', 'Remote', 'Field Duty'];
export const STATUSES = ['Present', 'Late', 'Absent'];
export const SHIFT_START = '09:30';

const pad = (n) => String(n).padStart(2, '0');

export const toDateKey = (d = new Date()) =>
  `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

export const nowTime = () => {
  const d = new Date();
  return `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
};

export const shiftDateKey = (key, days) => {
  const [y, m, d] = key.split('-').map(Number);
  return toDateKey(new Date(y, m - 1, d + days));
};

export const formatLongDate = (key) => {
  const [y, m, d] = key.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString(undefined, {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
};

const toMinutes = (t) => {
  if (!t) return null;
  const parts = t.split(':').map(Number);
  const h = parts[0] || 0;
  const m = parts[1] || 0;
  const s = parts[2] || 0;
  return h * 60 + m + s / 60;
};

export const isLate = (time) => {
  const mins = toMinutes(time);
  return mins !== null && mins > toMinutes(SHIFT_START);
};

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
