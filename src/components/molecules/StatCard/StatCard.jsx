import './StatCard.css';

export function StatCard({
  label,
  value,
  note,
  icon,
  variant = 'primary',
  className = '',
}) {
  return (
    <div className={`stat-card stat-card--${variant} ${className}`}>
      <div className="stat-card__top">
        <span className="stat-card__label">{label}</span>
        {icon && <div className="stat-card__icon-wrap">{icon}</div>}
      </div>
      <div className="stat-card__value">{value}</div>
      {note && <div className="stat-card__note">{note}</div>}
    </div>
  );
}
