import './Avatar.css';

const GRADIENTS = [
  'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)',
  'linear-gradient(135deg, #059669 0%, #10b981 100%)',
  'linear-gradient(135deg, #2563eb 0%, #38bdf8 100%)',
  'linear-gradient(135deg, #d97706 0%, #f59e0b 100%)',
  'linear-gradient(135deg, #db2777 0%, #f472b6 100%)',
  'linear-gradient(135deg, #7c3aed 0%, #c084fc 100%)',
];

function getGradient(name = '') {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % GRADIENTS.length;
  return GRADIENTS[index];
}

function getInitials(name = '') {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function Avatar({ name = '', size = 'md', className = '' }) {
  const initials = getInitials(name) || 'U';
  const background = getGradient(name);

  return (
    <div
      className={`avatar avatar--${size} ${className}`}
      style={{ background }}
      title={name}
      aria-label={name}
    >
      {initials}
    </div>
  );
}
