import './LocationToggle.css';

const LOCATIONS = ['In-Office', 'Remote', 'Field Duty'];

export function LocationToggle({
  value = 'In-Office',
  onChange,
  disabled = false,
}) {
  return (
    <div className="location-toggle" role="group" aria-label="Work location">
      {LOCATIONS.map((loc) => {
        const isActive = value === loc;
        return (
          <button
            key={loc}
            type="button"
            className={`location-toggle__btn ${isActive ? 'location-toggle__btn--active' : ''}`}
            aria-pressed={isActive}
            disabled={disabled}
            onClick={() => onChange(loc)}
          >
            {loc}
          </button>
        );
      })}
    </div>
  );
}
