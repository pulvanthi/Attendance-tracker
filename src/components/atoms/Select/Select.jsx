import { ChevronDown } from 'lucide-react';
import './Select.css';

export function Select({
  label,
  options = [],
  value,
  onChange,
  className = '',
  id,
  ...props
}) {
  const selectId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

  return (
    <div className={`select-group ${className}`}>
      {label && (
        <label htmlFor={selectId} className="select-label">
          {label}
        </label>
      )}
      <div className="select-wrapper">
        <select
          id={selectId}
          value={value}
          onChange={onChange}
          className="select-field"
          {...props}
        >
          {options.map((opt) => {
            const val = typeof opt === 'object' ? opt.value : opt;
            const label = typeof opt === 'object' ? opt.label : opt;
            return (
              <option key={val} value={val}>
                {label}
              </option>
            );
          })}
        </select>
        <ChevronDown size={16} className="select-chevron" />
      </div>
    </div>
  );
}
