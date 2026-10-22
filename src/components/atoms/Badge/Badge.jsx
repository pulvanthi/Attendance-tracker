import './Badge.css';

export function Badge({
  children,
  variant = 'neutral',
  showDot = true,
  className = '',
}) {
  const normVariant = (variant || '').toLowerCase().replace(/\s+/g, '-');

  return (
    <span className={`badge badge--${normVariant} ${className}`}>
      {showDot && <span className="badge__dot" aria-hidden="true" />}
      <span>{children}</span>
    </span>
  );
}
