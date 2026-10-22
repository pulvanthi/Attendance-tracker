import { Search, Filter, Download, Plus } from 'lucide-react';
import { Input } from '../../atoms/Input/Input';
import { Select } from '../../atoms/Select/Select';
import { Button } from '../../atoms/Button/Button';
import './SearchFilterBar.css';

export function SearchFilterBar({
  searchQuery,
  onSearchChange,
  departmentFilter,
  onDepartmentChange,
  departments = [],
  onExportCsv,
  onAddEmployee,
  canAdd = true,
}) {
  const deptOptions = [
    { value: '', label: 'All Departments' },
    ...departments.map((d) => ({ value: d, label: d })),
  ];

  return (
    <div className="search-filter-bar">
      <div className="search-filter-bar__inputs">
        <Input
          placeholder="Search by name, ID, or team..."
          icon={<Search size={16} />}
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="search-filter-bar__search"
          aria-label="Search employees"
        />

        {departments.length > 0 && (
          <Select
            options={deptOptions}
            value={departmentFilter}
            onChange={(e) => onDepartmentChange(e.target.value)}
            className="search-filter-bar__dept"
            aria-label="Filter by department"
          />
        )}
      </div>

      <div className="search-filter-bar__actions">
        {onExportCsv && (
          <Button
            variant="secondary"
            size="md"
            leftIcon={<Download size={16} />}
            onClick={onExportCsv}
            title="Download CSV report"
          >
            Export CSV
          </Button>
        )}

        {canAdd && onAddEmployee && (
          <Button
            variant="primary"
            size="md"
            leftIcon={<Plus size={16} />}
            onClick={onAddEmployee}
          >
            Add Member
          </Button>
        )}
      </div>
    </div>
  );
}
