import { useNow } from '../../../hooks/useNow';
import './LiveClock.css';

export function LiveClock() {
  const now = useNow();

  const timeString = now.toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });

  return (
    <div className="live-clock" title="Real-time Server/Browser Synchronized Time">
      <span className="live-clock__dot animate-pulse-dot" />
      <span className="live-clock__time">{timeString}</span>
      <span className="live-clock__tz">LIVE</span>
    </div>
  );
}
