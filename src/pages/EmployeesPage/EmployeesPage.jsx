import { useState, useMemo } from 'react';
import { Mail, Phone, Trash2, Plus, Search, Building } from 'lucide-react';
import { Avatar } from '../../components/atoms/Avatar/Avatar';
import { Badge } from '../../components/atoms/Badge/Badge';
import { Button } from '../../components/atoms/Button/Button';
import { Input } from '../../components/atoms/Input/Input';
import { Spinner } from '../../components/atoms/Spinner/Spinner';
import './EmployeesPage.css';

export function EmployeesPage({
  employees = [],
  isLoading = false,
  onOpenAddModal,
  onDeleteEmployee,
}) {
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    return employees.filter(
      (e) =>
        e.name.toLowerCase().includes(search.toLowerCase()) ||
        e.code.toLowerCase().includes(search.toLowerCase()) ||
        (e.department && e.department.toLowerCase().includes(search.toLowerCase()))
    );
  }, [employees, search]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div className="glass-panel" style={{ padding: 14, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
        <Input
          placeholder="Filter team roster..."
          icon={<Search size={16} />}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ maxWidth: 320 }}
          aria-label="Filter roster"
        />

        {onOpenAddModal && (
          <Button
            variant="primary"
            leftIcon={<Plus size={16} />}
            onClick={onOpenAddModal}
          >
            Add Team Member
          </Button>
        )}
      </div>

      {isLoading ? (
        <div style={{ textAlign: 'center', padding: 48 }}>
          <Spinner size="lg" />
          <p style={{ marginTop: 12, color: 'var(--text-muted)' }}>Loading staff roster...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="glass-panel" style={{ textAlign: 'center', padding: 48, color: 'var(--text-muted)' }}>
          No team members found matching your search.
        </div>
      ) : (
        <div className="employees-grid">
          {filtered.map((emp) => (
            <div key={emp.id} className="employee-card">
              <div className="employee-card__header">
                <Avatar name={emp.name} size="md" />
                <div className="employee-card__meta">
                  <span className="employee-card__name">{emp.name}</span>
                  <span className="employee-card__role">
                    {emp.code} Â· {emp.role_title || 'Staff'}
                  </span>
                </div>
              </div>

              <div className="employee-card__details">
                <div className="employee-card__row">
                  <Building size={14} style={{ color: 'var(--text-muted)' }} />
                  <span>{emp.department || 'General'}</span>
                </div>
                {emp.email && (
                  <div className="employee-card__row">
                    <Mail size={14} style={{ color: 'var(--text-muted)' }} />
                    <span style={{ fontSize: 12 }}>{emp.email}</span>
                  </div>
                )}
                {emp.phone && (
                  <div className="employee-card__row">
                    <Phone size={14} style={{ color: 'var(--text-muted)' }} />
                    <span style={{ fontSize: 12 }}>{emp.phone}</span>
                  </div>
                )}
              </div>

              <div className="employee-card__actions">
                <Badge variant={emp.is_active ? 'present' : 'absent'}>
                  {emp.is_active ? 'Active' : 'Inactive'}
                </Badge>
                {onDeleteEmployee && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      if (window.confirm(`Are you sure you want to remove ${emp.name}?`)) {
                        onDeleteEmployee(emp.id);
                      }
                    }}
                    title="Remove Employee"
                    aria-label={`Remove ${emp.name}`}
                  >
                    <Trash2 size={15} color="var(--status-absent)" />
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
