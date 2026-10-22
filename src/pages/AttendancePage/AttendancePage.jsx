import { useState, useMemo } from 'react';
import { SummaryCards } from '../../components/organisms/SummaryCards/SummaryCards';
import { SearchFilterBar } from '../../components/molecules/SearchFilterBar/SearchFilterBar';
import { AttendanceTable } from '../../components/organisms/AttendanceTable/AttendanceTable';

export function AttendancePage({
  selectedDate,
  todayDate,
  employees = [],
  records = {},
  summary,
  isLoading = false,
  onPatchRecord,
  onPunchIn,
  onPunchOut,
  canEdit = true,
  canPunchFor = () => true,
  onExportCsv,
  onOpenAddModal,
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('');

  const isToday = selectedDate === todayDate;

  // Extract unique departments for filter dropdown
  const departments = useMemo(() => {
    const set = new Set();
    employees.forEach((e) => {
      if (e.department) set.add(e.department);
    });
    return Array.from(set).sort();
  }, [employees]);

  // Filter employees according to search query and department
  const filteredEmployees = useMemo(() => {
    return employees.filter((emp) => {
      const matchesSearch =
        !searchQuery ||
        emp.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        emp.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (emp.department && emp.department.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesDept = !departmentFilter || emp.department === departmentFilter;

      return matchesSearch && matchesDept;
    });
  }, [employees, searchQuery, departmentFilter]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* KPI Summary Cards */}
      <SummaryCards summary={summary} isToday={isToday} />

      {/* Search, Filter & Actions Bar */}
      <div className="glass-panel" style={{ padding: 14 }}>
        <SearchFilterBar
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          departmentFilter={departmentFilter}
          onDepartmentChange={setDepartmentFilter}
          departments={departments}
          onExportCsv={onExportCsv}
          onAddEmployee={onOpenAddModal}
        />
      </div>

      {/* Attendance Ledger Table */}
      <AttendanceTable
        employees={filteredEmployees}
        records={records}
        isToday={isToday}
        isLoading={isLoading}
        onPatch={onPatchRecord}
        onPunchIn={onPunchIn}
        onPunchOut={onPunchOut}
        canEdit={canEdit}
        canPunchFor={canPunchFor}
      />
    </div>
  );
}
