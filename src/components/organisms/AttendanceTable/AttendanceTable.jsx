import { AttendanceRow } from '../AttendanceRow/AttendanceRow';
import { Spinner } from '../../atoms/Spinner/Spinner';
import './AttendanceTable.css';

export function AttendanceTable({
  employees = [],
  records = {},
  isToday = true,
  isLoading = false,
  onPatch,
  onPunchIn,
  onPunchOut,
  canEdit = true,
  canPunchFor = () => true,
}) {
  return (
    <div className="table-container">
      <table className="attendance-table" aria-label="Attendance Ledger Table">
        <thead>
          <tr>
            <th>Employee</th>
            <th>Status</th>
            <th>Location</th>
            <th>Clock In</th>
            <th>Clock Out</th>
            <th>Hours Worked</th>
            <th>Punch Action</th>
          </tr>
        </thead>
        <tbody>
          {isLoading ? (
            <tr>
              <td colSpan="7" className="attendance-table__empty">
                <Spinner size="md" />
                <p style={{ marginTop: 12 }}>Syncing attendance ledger...</p>
              </td>
            </tr>
          ) : employees.length === 0 ? (
            <tr>
              <td colSpan="7" className="attendance-table__empty">
                No matching team members found. Try adjusting filters or add a new employee.
              </td>
            </tr>
          ) : (
            employees.map((emp) => (
              <AttendanceRow
                key={emp.id}
                employee={emp}
                record={records[emp.id]}
                isToday={isToday}
                onPatch={onPatch}
                onPunchIn={onPunchIn}
                onPunchOut={onPunchOut}
                canEdit={canEdit}
                canPunch={canPunchFor(emp.id)}
              />
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
