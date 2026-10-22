import { useState } from 'react';
import { X, User, Briefcase, Mail, Phone } from 'lucide-react';
import { Input } from '../../atoms/Input/Input';
import { Button } from '../../atoms/Button/Button';
import './AddEmployeeModal.css';

export function AddEmployeeModal({ isOpen, onClose, onAdd }) {
  const [name, setName] = useState('');
  const [department, setDepartment] = useState('');
  const [roleTitle, setRoleTitle] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Employee name is required');
      return;
    }

    setIsLoading(true);
    setError('');
    try {
      await onAdd({
        name: name.trim(),
        department: department.trim() || 'General',
        role_title: roleTitle.trim() || 'Staff',
        email: email.trim() || null,
        phone: phone.trim() || null,
      });
      setName('');
      setDepartment('');
      setRoleTitle('');
      setEmail('');
      setPhone('');
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to add employee');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="modal-card animate-scale-in"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="add-emp-title"
      >
        <div className="modal-header">
          <h3 id="add-emp-title" className="modal-title">
            Add Team Member
          </h3>
          <button
            type="button"
            className="btn btn--ghost btn--sm"
            onClick={onClose}
            aria-label="Close dialog"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            {error && (
              <div style={{ padding: '8px 12px', background: 'var(--status-absent-bg)', color: 'var(--status-absent)', borderRadius: 'var(--radius-md)', fontSize: 13, border: '1px solid var(--status-absent-border)' }}>
                {error}
              </div>
            )}

            <Input
              label="Full Name *"
              placeholder="e.g. Maya Lin"
              icon={<User size={16} />}
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />

            <Input
              label="Department"
              placeholder="e.g. Engineering, Sales, Operations"
              icon={<Briefcase size={16} />}
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
            />

            <Input
              label="Role Title"
              placeholder="e.g. Senior Frontend Engineer"
              icon={<Briefcase size={16} />}
              value={roleTitle}
              onChange={(e) => setRoleTitle(e.target.value)}
            />

            <Input
              label="Work Email"
              type="email"
              placeholder="maya.lin@company.com"
              icon={<Mail size={16} />}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />

            <Input
              label="Phone Number"
              type="tel"
              placeholder="+1 (555) 019-2834"
              icon={<Phone size={16} />}
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
          </div>

          <div className="modal-footer">
            <Button variant="secondary" onClick={onClose} disabled={isLoading}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" isLoading={isLoading}>
              Add Employee
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
