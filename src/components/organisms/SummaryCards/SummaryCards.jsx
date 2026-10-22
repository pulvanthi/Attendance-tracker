import { Users, Building, Globe, UserX, AlertTriangle, Clock } from 'lucide-react';
import { StatCard } from '../../molecules/StatCard/StatCard';
import './SummaryCards.css';

export function SummaryCards({
  summary,
  isToday = true,
}) {
  const currentSub = isToday ? 'active on duty' : 'registered';

  return (
    <section className="summary-cards" aria-label="Key Performance Indicators">
      <StatCard
        label="Total Roster"
        value={summary.total_staff ?? 0}
        note="Active employees"
        icon={<Users size={20} />}
        variant="primary"
      />
      <StatCard
        label="In-Office"
        value={summary.in_office ?? 0}
        note={currentSub}
        icon={<Building size={20} />}
        variant="success"
      />
      <StatCard
        label="Remote / Field"
        value={summary.field_remote ?? 0}
        note="Off-site operations"
        icon={<Globe size={20} />}
        variant="info"
      />
      <StatCard
        label="Absent"
        value={summary.absent ?? 0}
        note="Not attended"
        icon={<UserX size={20} />}
        variant="danger"
      />
      <StatCard
        label="Late Arrivals"
        value={summary.late ?? 0}
        note="Punched past 09:30"
        icon={<AlertTriangle size={20} />}
        variant="warning"
      />
      <StatCard
        label="Total Hours"
        value={`${summary.total_hours_worked ?? 0}h`}
        note="Combined productive time"
        icon={<Clock size={20} />}
        variant="primary"
      />
    </section>
  );
}
