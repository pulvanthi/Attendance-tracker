import { useState, useEffect, useCallback } from 'react';
import { Spinner } from './components/atoms/Spinner/Spinner';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider } from './context/AuthContext';
import { useAuth } from './hooks/useAuth';
import { employeeService } from './services/employeeService';
import { attendanceService } from './services/attendanceService';
import { toDateKey, formatLongDate } from './utils/attendanceUtils';

// Atomic Design Components
import { DashboardTemplate } from './components/templates/DashboardTemplate/DashboardTemplate';
import { DateNavigator } from './components/molecules/DateNavigator/DateNavigator';
import { AddEmployeeModal } from './components/organisms/AddEmployeeModal/AddEmployeeModal';

// Pages
import { AttendancePage } from './pages/AttendancePage/AttendancePage';
import { EmployeesPage } from './pages/EmployeesPage/EmployeesPage';
import { AnalyticsPage } from './pages/AnalyticsPage/AnalyticsPage';
import { LoginPage } from './pages/LoginPage/LoginPage';

function AttendanceAppContent() {
  const { user, isAdmin } = useAuth();
  const isManager = isAdmin || user?.role === 'manager';
  // Admins/managers can punch anyone; staff only their own linked employee profile
  const canPunchFor = (employeeId) => isManager || user?.employee_id === employeeId;
  const todayDate = toDateKey();
  const [selectedDate, setSelectedDate] = useState(todayDate);
  const [activeTab, setActiveTab] = useState('attendance'); // 'attendance' | 'employees' | 'analytics'

  const [employees, setEmployees] = useState([]);
  const [records, setRecords] = useState({});
  const [summary, setSummary] = useState({
    total_staff: 0,
    in_office: 0,
    field_remote: 0,
    absent: 0,
    late: 0,
    present: 0,
    total_hours_worked: 0,
  });

  const [isLoading, setIsLoading] = useState(true);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // Fetch employees list
  const loadEmployees = useCallback(async () => {
    try {
      const data = await employeeService.getEmployees();
      setEmployees(data);
    } catch (err) {
      console.error('Error loading employees:', err);
    }
  }, []);

  // Fetch records and summary for the selected date
  const loadAttendance = useCallback(async (dateStr) => {
    setIsLoading(true);
    try {
      const [recordsMap, summaryData] = await Promise.all([
        attendanceService.getRecordsByDate(dateStr),
        attendanceService.getSummary(dateStr),
      ]);
      setRecords(recordsMap || {});
      setSummary(summaryData || {});
    } catch (err) {
      console.error('Error loading attendance for', dateStr, err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Initial load
  useEffect(() => {
    loadEmployees();
  }, [loadEmployees]);

  // Load attendance whenever selected date changes
  useEffect(() => {
    loadAttendance(selectedDate);
  }, [selectedDate, loadAttendance]);

  // Handle punch in
  const handlePunchIn = async (employeeId, location) => {
    try {
      const updatedRecord = await attendanceService.punch({
        employee_id: employeeId,
        type: 'in',
        location: location || 'In-Office',
      });
      // Optimistic update
      setRecords((prev) => ({ ...prev, [employeeId]: updatedRecord }));
      // Reload summary
      attendanceService.getSummary(selectedDate).then(setSummary);
    } catch (err) {
      alert(`Clock In Failed: ${err.message}`);
    }
  };

  // Handle punch out
  const handlePunchOut = async (employeeId) => {
    try {
      const updatedRecord = await attendanceService.punch({
        employee_id: employeeId,
        type: 'out',
      });
      // Optimistic update
      setRecords((prev) => ({ ...prev, [employeeId]: updatedRecord }));
      // Reload summary
      attendanceService.getSummary(selectedDate).then(setSummary);
    } catch (err) {
      alert(`Clock Out Failed: ${err.message}`);
    }
  };

  // Handle partial patch
  const handlePatchRecord = async (employeeId, patch) => {
    // Optimistic UI update
    setRecords((prev) => {
      const current = prev[employeeId] || {};
      return { ...prev, [employeeId]: { ...current, ...patch } };
    });

    try {
      const updated = await attendanceService.patchRecord(employeeId, selectedDate, patch);
      setRecords((prev) => ({ ...prev, [employeeId]: updated }));
      attendanceService.getSummary(selectedDate).then(setSummary);
    } catch (err) {
      console.error('Failed to patch record:', err);
      alert(`Could not save change: ${err.message}`);
      // Revert if error
      loadAttendance(selectedDate);
    }
  };

  // Handle adding employee
  const handleAddEmployee = async (newEmpData) => {
    const created = await employeeService.createEmployee(newEmpData);
    setEmployees((prev) => [...prev, created]);
    loadAttendance(selectedDate);
  };

  // Handle deleting employee
  const handleDeleteEmployee = async (empId) => {
    try {
      await employeeService.deleteEmployee(empId);
      setEmployees((prev) => prev.filter((e) => e.id !== empId));
      loadAttendance(selectedDate);
    } catch (err) {
      console.error('Failed to delete employee:', err);
      alert(`Could not remove this team member: ${err.message}`);
    }
  };

  // Handle CSV export
  const handleExportCsv = async () => {
    try {
      await attendanceService.downloadCsv(selectedDate);
    } catch (err) {
      alert(`CSV export failed: ${err.message}`);
    }
  };

  // Page title and actions based on active tab
  let pageTitle = 'Daily Attendance Ledger';
  let pageDescription = `${formatLongDate(selectedDate)} ${selectedDate === todayDate ? '(Today)' : ''}`;

  if (activeTab === 'employees') {
    pageTitle = 'Team Member Roster';
    pageDescription = `Manage company staff directory (${employees.length} total active members)`;
  } else if (activeTab === 'analytics') {
    pageTitle = 'Reports & Trend Analytics';
    pageDescription = 'Track weekly compliance, punctuality, and team attendance patterns';
  }

  const mastheadActions =
    activeTab === 'attendance' ? (
      <DateNavigator
        selectedDate={selectedDate}
        onDateChange={setSelectedDate}
        todayDate={todayDate}
      />
    ) : null;

  return (
    <DashboardTemplate
      activeTab={activeTab}
      onTabChange={setActiveTab}
      pageTitle={pageTitle}
      pageDescription={pageDescription}
      mastheadActions={mastheadActions}
    >
      {activeTab === 'attendance' && (
        <AttendancePage
          selectedDate={selectedDate}
          todayDate={todayDate}
          employees={employees}
          records={records}
          summary={summary}
          isLoading={isLoading}
          onPatchRecord={handlePatchRecord}
          onPunchIn={handlePunchIn}
          onPunchOut={handlePunchOut}
          canEdit={isManager}
          canPunchFor={canPunchFor}
          onExportCsv={handleExportCsv}
          onOpenAddModal={isAdmin ? () => setIsAddModalOpen(true) : undefined}
        />
      )}

      {activeTab === 'employees' && (
        <EmployeesPage
          employees={employees}
          isLoading={isLoading}
          onOpenAddModal={isAdmin ? () => setIsAddModalOpen(true) : undefined}
          onDeleteEmployee={isAdmin ? handleDeleteEmployee : undefined}
        />
      )}

      {activeTab === 'analytics' && (
        <AnalyticsPage
          selectedDate={selectedDate}
          onExportCsv={handleExportCsv}
        />
      )}

      {/* Add Employee Modal */}
      <AddEmployeeModal
        isOpen={isAdmin && isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onAdd={handleAddEmployee}
      />
    </DashboardTemplate>
  );
}

/** Shows the sign-in screen until the user is authenticated (the API requires a JWT). */
function AuthGate() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center' }}>
        <Spinner size="lg" />
      </div>
    );
  }
  if (!isAuthenticated) {
    return <LoginPage />;
  }
  return <AttendanceAppContent />;
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <AuthGate />
      </AuthProvider>
    </ThemeProvider>
  );
}
