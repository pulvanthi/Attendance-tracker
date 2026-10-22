import { useNow } from '../../../hooks/useNow';
import {
  STATUSES,
  isLate,
  minutesWorked,
  formatDuration,
} from '../../../utils/attendanceUtils';
import { Avatar } from '../../atoms/Avatar/Avatar';
import { Badge } from '../../atoms/Badge/Badge';
import { Button } from '../../atoms/Button/Button';
import { LocationToggle } from '../../molecules/LocationToggle/LocationToggle';
import './AttendanceRow.css';

function Elapsed({ clockIn }) {
  const now = useNow();
  const current = [now.getHours(), now.getMinutes(), now.getSeconds()]
    .map((n) => String(n).padStart(2, '0'))
    .join(':');

  const worked = minutesWorked(clockIn, current);

  return (
    <span className="attendance-row__elapsed">
      <span className="attendance-row__elapsed-dot animate-pulse-dot" />
      {formatDuration(worked)}
    </span>
  );
}

export function AttendanceRow({
  employee,
  record,
  isToday,
  onPatch,
  onPunchIn,
  onPunchOut,
  canEdit = true,
  canPunch = true,
}) {
  const { status = 'Absent', location = 'In-Office', clock_in = '', clock_out = '', minutes_worked = 0 } = record || {};

  const handleClockInChange = (newVal) => {
    if (newVal) {
      onPatch(employee.id, {
        clock_in: newVal,
        status: isLate(newVal) ? 'Late' : 'Present',
      });
    } else {
      onPatch(employee.id, {
        clock_in: '',
        clock_out: '',
        status: 'Absent',
      });
    }
  };

  const handleStatusChange = (newStatus) => {
    if (newStatus === 'Absent') {
      onPatch(employee.id, {
        status: newStatus,
        clock_in: '',
        clock_out: '',
      });
    } else {
      onPatch(employee.id, { status: newStatus });
    }
  };

  const totalMins = minutes_worked || minutesWorked(clock_in, clock_out);

  return (
    <tr className="attendance-row">
      {/* Employee Identity */}
      <td>
        <div className="attendance-row__emp">
          <Avatar name={employee.name} size="md" />
          <div className="attendance-row__emp-meta">
            <span className="attendance-row__emp-name">{employee.name}</span>
            <span className="attendance-row__emp-details">
              {employee.code} · {employee.department}
            </span>
          </div>
        </div>
      </td>

      {/* Status */}
      <td>
        <select
          value={status}
          onChange={(e) => handleStatusChange(e.target.value)}
          disabled={!canEdit}
          className={`badge badge--${status.toLowerCase()}`}
          style={{ cursor: 'pointer', border: '1px solid currentColor', outline: 'none' }}
          aria-label={`Status for ${employee.name}`}
        >
          {STATUSES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </td>

      {/* Location */}
      <td>
        <LocationToggle
          value={location}
          onChange={(loc) => canEdit && onPatch(employee.id, { location: loc })}
        />
      </td>

      {/* Clock In */}
      <td>
        <input
          type="time"
          step="1"
          value={clock_in || ''}
          disabled={!canEdit}
          onChange={(e) => handleClockInChange(e.target.value)}
          className="attendance-row__time-input"
          aria-label={`Clock in for ${employee.name}`}
        />
      </td>

      {/* Clock Out */}
      <td>
        <input
          type="time"
          step="1"
          value={clock_out || ''}
          disabled={!canEdit || !clock_in}
          onChange={(e) => onPatch(employee.id, { clock_out: e.target.value })}
          className="attendance-row__time-input"
          aria-label={`Clock out for ${employee.name}`}
        />
      </td>

      {/* Elapsed / Hours Worked */}
      <td>
        {clock_out ? (
          <span className="attendance-row__total-hours">{formatDuration(totalMins)}</span>
        ) : clock_in && isToday ? (
          <Elapsed clockIn={clock_in} />
        ) : clock_in ? (
          <span className="text-muted" style={{ fontSize: 13 }}>No clock-out</span>
        ) : (
          <span style={{ color: 'var(--text-muted)' }}>—</span>
        )}
      </td>

      {/* Action / Punch */}
      <td>
        {isToday && canPunch && !clock_in && (
          <Button
            variant="success"
            size="sm"
            onClick={() => onPunchIn(employee.id, location)}
          >
            Clock in
          </Button>
        )}
        {isToday && canPunch && clock_in && !clock_out && (
          <Button
            variant="dark"
            size="sm"
            onClick={() => onPunchOut(employee.id)}
          >
            Clock out
          </Button>
        )}
        {canEdit && clock_out && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPatch(employee.id, { clock_out: '' })}
          >
            Reopen shift
          </Button>
        )}
      </td>
    </tr>
  );
}
