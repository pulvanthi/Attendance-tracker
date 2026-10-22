import { useEffect, useState } from 'react';
import { Download, TrendingUp, CheckCircle, Clock } from 'lucide-react';
import { attendanceService } from '../../services/attendanceService';
import { AttendanceCharts } from '../../components/organisms/AttendanceCharts/AttendanceCharts';
import { StatCard } from '../../components/molecules/StatCard/StatCard';
import { Button } from '../../components/atoms/Button/Button';
import { Spinner } from '../../components/atoms/Spinner/Spinner';

export function AnalyticsPage({ selectedDate, onExportCsv }) {
  const [trends, setTrends] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadAnalytics() {
      setIsLoading(true);
      try {
        const [trendData, deptData] = await Promise.all([
          attendanceService.getTrends(7),
          attendanceService.getDepartmentBreakdown(selectedDate),
        ]);
        setTrends(trendData);
        setDepartments(deptData);
      } catch (err) {
        console.error('Failed to load analytics:', err);
      } finally {
        setIsLoading(false);
      }
    }
    loadAnalytics();
  }, [selectedDate]);

  // Compute average attendance rate over the 7 days
  const avgRate = trends.length
    ? Math.round(trends.reduce((sum, t) => sum + (t.rate || 0), 0) / trends.length)
    : 0;

  const totalLate = trends.reduce((sum, t) => sum + (t.late || 0), 0);
  const totalPresent = trends.reduce((sum, t) => sum + (t.present || 0), 0);
  const punctualityScore = (totalPresent + totalLate) > 0
    ? Math.round((totalPresent / (totalPresent + totalLate)) * 100)
    : 100;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Top Action Header */}
      <div className="glass-panel" style={{ padding: 18, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h2 style={{ fontSize: 18, fontWeight: 700 }}>Attendance Analytics & Trends</h2>
          <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>
            Real-time compliance, punctuality index, and departmental distribution
          </p>
        </div>

        <Button
          variant="primary"
          leftIcon={<Download size={16} />}
          onClick={onExportCsv}
        >
          Download Audit CSV
        </Button>
      </div>

      {/* KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16 }}>
        <StatCard
          label="7-Day Avg Attendance"
          value={`${avgRate}%`}
          note="Across all team rosters"
          icon={<TrendingUp size={20} />}
          variant="primary"
        />
        <StatCard
          label="Punctuality Score"
          value={`${punctualityScore}%`}
          note="Arrivals before 09:30"
          icon={<CheckCircle size={20} />}
          variant="success"
        />
        <StatCard
          label="Active Departments"
          value={departments.length}
          note="Operating organizational units"
          icon={<Clock size={20} />}
          variant="info"
        />
      </div>

      {/* Visual Charts */}
      {isLoading ? (
        <div style={{ textAlign: 'center', padding: 60 }}>
          <Spinner size="lg" />
          <p style={{ marginTop: 12, color: 'var(--text-muted)' }}>Calculating analytics data...</p>
        </div>
      ) : (
        <AttendanceCharts trends={trends} departments={departments} />
      )}
    </div>
  );
}
