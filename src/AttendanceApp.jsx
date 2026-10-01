import { useMemo, useState } from 'react';
import {
  LOCATIONS, STATUSES, EMPTY_RECORD,
  toDateKey, nowTime, shiftDateKey, formatLongDate,
  isLate, minutesWorked, formatDuration,
  useLocalStorage, useNow, exportDayCsv,
} from './attendanceUtils';
import './styles.css';

/* Sample staff used the first time the app loads. Replace with your own data source. */
const SEED_STAFF = [
  { id: 's1', code: 'EMP-001', name: 'Asha Menon', department: 'Finance' },
  { id: 's2', code: 'EMP-002', name: 'Daniel Okafor', department: 'Engineering' },
  { id: 's3', code: 'EMP-003', name: 'Priya Raman', department: 'Operations' },
  { id: 's4', code: 'EMP-004', name: 'Lucas Ferreira', department: 'Sales' },
  { id: 's5', code: 'EMP-005', name: 'Mei Tanaka', department: 'Design' },
];

/* ---------- Live clock shown in the header ---------- */
function LiveClock() {
  const now = useNow();
  return (
    <div className="clock" aria-label="Current time">
      <span className="clock__dot" aria-hidden="true" />
      <time dateTime={now.toISOString()} className="clock__time">
        {now.toLocaleTimeString([], { hour12: false })}
      </time>
    </div>
  );
}

/* ---------- Running timer for staff who are clocked in today ---------- */
function Elapsed({ clockIn }) {
  const now = useNow();
  const current = [now.getHours(), now.getMinutes(), now.getSeconds()]
    .map((n) => String(n).padStart(2, '0')).join(':');
  return <span className="running">{formatDuration(minutesWorked(clockIn, current))} so far</span>;
}

/* ---------- Summary strip (Total / In-Office / Field+Remote / Absent) ---------- */
function SummaryStrip({ summary, isToday }) {
  const sub = isToday ? 'clocked in now' : 'attended';
  const items = [
    { key: 'total', label: 'Total staff', value: summary.total, note: 'on the roster' },
    { key: 'office', label: 'In-Office', value: summary.inOffice, note: sub },
    { key: 'field', label: 'Field / Remote', value: summary.fieldRemote, note: sub },
    { key: 'absent', label: 'Absent', value: summary.absent, note: 'not attending' },
  ];
  return (
    <section className="summary" aria-label="Attendance summary">
      {items.map((i) => (
        <div key={i.key} className={`summary__cell summary__cell--${i.key}`}>
          <p className="summary__label">{i.label}</p>
          <p className="summary__value">{i.value}</p>
          <p className="summary__note">{i.note}</p>
        </div>
      ))}
    </section>
  );
}

/* ---------- One row per employee ---------- */
function AttendanceRow({ person, record, isToday, onPatch, onClockIn, onClockOut }) {
  const { status, location, clockIn, clockOut } = record;
  const mins = minutesWorked(clockIn, clockOut);

  // Editing the clock-in time re-evaluates Late/Present automatically
  const changeClockIn = (value) =>
    onPatch(person.id, value
      ? { clockIn: value, status: isLate(value) ? 'Late' : 'Present' }
      : { clockIn: '', clockOut: '', status: 'Absent' });

  // Choosing "Absent" clears the punches so hours can't linger on an absent day
  const changeStatus = (value) =>
    onPatch(person.id, value === 'Absent' ? { status: value, clockIn: '', clockOut: '' } : { status: value });

  return (
    <tr>
      <td data-label="Employee">
        <strong>{person.name}</strong>
        <span className="muted">{person.code} · {person.department}</span>
      </td>

      <td data-label="Status">
        <select
          className={`status status--${status.toLowerCase()}`}
          value={status}
          aria-label={`Status for ${person.name}`}
          onChange={(e) => changeStatus(e.target.value)}
        >
          {STATUSES.map((s) => <option key={s}>{s}</option>)}
        </select>
      </td>

      <td data-label="Location">
        <div className="toggle" role="group" aria-label={`Work location for ${person.name}`}>
          {LOCATIONS.map((loc) => (
            <button
              key={loc} type="button"
              aria-pressed={location === loc}
              onClick={() => onPatch(person.id, { location: loc })}
            >{loc}</button>
          ))}
        </div>
      </td>

      <td data-label="Clock in">
        <input type="time" step="1" value={clockIn} aria-label={`Clock-in time for ${person.name}`}
          onChange={(e) => changeClockIn(e.target.value)} />
      </td>

      <td data-label="Clock out">
        <input type="time" step="1" value={clockOut} disabled={!clockIn}
          aria-label={`Clock-out time for ${person.name}`}
          onChange={(e) => onPatch(person.id, { clockOut: e.target.value })} />
      </td>

      <td data-label="Hours worked" className="hours">
        {clockOut ? <strong>{formatDuration(mins)}</strong>
          : clockIn && isToday ? <Elapsed clockIn={clockIn} />
          : clockIn ? <span className="muted">No clock-out</span>
          : '—'}
      </td>

      <td data-label="Punch">
        {!clockIn && <button className="btn btn--primary" onClick={() => onClockIn(person.id)}>Clock in</button>}
        {clockIn && !clockOut && <button className="btn btn--dark" onClick={() => onClockOut(person.id)}>Clock out</button>}
        {clockOut && <button className="btn" onClick={() => onPatch(person.id, { clockOut: '' })}>Reopen shift</button>}
      </td>
    </tr>
  );
}

/* ---------- Root component ---------- */
export default function AttendanceApp() {
  const todayKey = toDateKey();
  const [selectedDate, setSelectedDate] = useState(todayKey);
  const [staff, setStaff] = useLocalStorage('attendance.staff', SEED_STAFF);
  // Shape: { "2026-09-29": { [staffId]: { status, location, clockIn, clockOut } } }
  const [records, setRecords] = useLocalStorage('attendance.records', {});
  const [newName, setNewName] = useState('');
  const [newDept, setNewDept] = useState('');

  const isToday = selectedDate === todayKey;
  const dayRecords = records[selectedDate] || {};

  /** Merge a partial change into one employee's record for the selected date. */
  const patchRecord = (id, patch) =>
    setRecords((prev) => {
      const day = prev[selectedDate] || {};
      const current = { ...EMPTY_RECORD, ...(day[id] || {}) };
      return { ...prev, [selectedDate]: { ...day, [id]: { ...current, ...patch } } };
    });

  // Punch buttons stamp the current time; use the time inputs to correct past/future days
  const clockIn = (id) => {
    const t = nowTime();
    patchRecord(id, { clockIn: t, clockOut: '', status: isLate(t) ? 'Late' : 'Present' });
  };
  const clockOut = (id) => patchRecord(id, { clockOut: nowTime() });

  const addStaff = (e) => {
    e.preventDefault();
    const name = newName.trim();
    if (!name) return;
    const maxCode = staff.reduce((m, s) => Math.max(m, parseInt(s.code.replace(/\D/g, ''), 10) || 0), 0);
    setStaff([...staff, {
      id: `s${Date.now().toString(36)}`,
      code: `EMP-${String(maxCode + 1).padStart(3, '0')}`,
      name,
      department: newDept.trim() || 'General',
    }]);
    setNewName('');
    setNewDept('');
  };

  /* Card counters. On today's date only people still clocked in are counted;
     on other dates everyone who attended (not Absent) is counted. */
  const summary = useMemo(() => {
    let inOffice = 0, fieldRemote = 0, absent = 0;
    staff.forEach((s) => {
      const r = { ...EMPTY_RECORD, ...(dayRecords[s.id] || {}) };
      if (r.status === 'Absent') { absent += 1; return; }
      if (isToday && r.clockOut) return;
      if (r.location === 'In-Office') inOffice += 1; else fieldRemote += 1;
    });
    return { total: staff.length, inOffice, fieldRemote, absent };
  }, [staff, dayRecords, isToday]);

  return (
    <div className="app">
      <header className="masthead">
        <div>
          <h1>Attendance</h1>
          <p className="masthead__date">{formatLongDate(selectedDate)}{isToday && ' (today)'}</p>
        </div>
        <LiveClock />
      </header>

      <main>
        <div className="toolbar">
          <div className="datebar">
            <button className="btn" onClick={() => setSelectedDate(shiftDateKey(selectedDate, -1))} aria-label="Previous day">‹</button>
            <input type="date" value={selectedDate} aria-label="Select date"
              onChange={(e) => e.target.value && setSelectedDate(e.target.value)} />
            <button className="btn" onClick={() => setSelectedDate(shiftDateKey(selectedDate, 1))} aria-label="Next day">›</button>
            {!isToday && <button className="btn" onClick={() => setSelectedDate(todayKey)}>Back to today</button>}
          </div>
          <button className="btn btn--dark" onClick={() => exportDayCsv(selectedDate, staff, dayRecords)}>
            Export {selectedDate} as CSV
          </button>
        </div>

        <SummaryStrip summary={summary} isToday={isToday} />

        <div className="table-wrap">
          <table className="ledger">
            <thead>
              <tr>
                <th>Employee</th><th>Status</th><th>Location</th>
                <th>Clock in</th><th>Clock out</th><th>Hours worked</th><th>Punch</th>
              </tr>
            </thead>
            <tbody>
              {staff.length === 0 && (
                <tr><td colSpan="7" className="empty">No staff yet. Add your first employee below.</td></tr>
              )}
              {staff.map((s) => (
                <AttendanceRow
                  key={s.id}
                  person={s}
                  record={{ ...EMPTY_RECORD, ...(dayRecords[s.id] || {}) }}
                  isToday={isToday}
                  onPatch={patchRecord}
                  onClockIn={clockIn}
                  onClockOut={clockOut}
                />
              ))}
            </tbody>
          </table>
        </div>

        <form className="add" onSubmit={addStaff}>
          <input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="Employee name" aria-label="Employee name" required />
          <input value={newDept} onChange={(e) => setNewDept(e.target.value)} placeholder="Department" aria-label="Department" />
          <button className="btn btn--primary" type="submit">Add employee</button>
        </form>
      </main>
    </div>
  );
}
