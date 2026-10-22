import { ChevronLeft, ChevronRight, Calendar } from 'lucide-react';
import { Button } from '../../atoms/Button/Button';
import './DateNavigator.css';

export function DateNavigator({
  selectedDate,
  onDateChange,
  todayDate,
}) {
  const isToday = selectedDate === todayDate;

  const shiftDays = (delta) => {
    const [y, m, d] = selectedDate.split('-').map(Number);
    const dateObj = new Date(y, m - 1, d + delta);
    const newY = dateObj.getFullYear();
    const newM = String(dateObj.getMonth() + 1).padStart(2, '0');
    const newD = String(dateObj.getDate()).padStart(2, '0');
    onDateChange(`${newY}-${newM}-${newD}`);
  };

  return (
    <div className="date-nav" aria-label="Date navigation">
      <Button
        variant="secondary"
        size="sm"
        onClick={() => shiftDays(-1)}
        title="Previous Day"
        aria-label="Previous day"
      >
        <ChevronLeft size={16} />
      </Button>

      <div className="date-nav__picker-wrap">
        <input
          type="date"
          className="date-nav__picker"
          value={selectedDate}
          onChange={(e) => e.target.value && onDateChange(e.target.value)}
          aria-label="Select date"
        />
      </div>

      <Button
        variant="secondary"
        size="sm"
        onClick={() => shiftDays(1)}
        title="Next Day"
        aria-label="Next day"
      >
        <ChevronRight size={16} />
      </Button>

      {!isToday ? (
        <Button
          variant="outline"
          size="sm"
          leftIcon={<Calendar size={14} />}
          onClick={() => onDateChange(todayDate)}
        >
          Jump to Today
        </Button>
      ) : (
        <span className="date-nav__today-badge">Today</span>
      )}
    </div>
  );
}
