import './Spinner.css';

export function Spinner({ size = 'md', className = '' }) {
  return (
    <div className={`spinner-container spinner--${size} ${className}`} role="status">
      <div className="spinner-circle" />
      <span style={{ position: 'absolute', width: 1, height: 1, padding: 0, margin: -1, overflow: 'hidden', clip: 'rect(0,0,0,0)', border: 0 }}>
        Loading...
      </span>
    </div>
  );
}
