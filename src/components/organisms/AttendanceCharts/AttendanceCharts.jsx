import { BarChart3, PieChart } from 'lucide-react';
import './AttendanceCharts.css';

export function AttendanceCharts({
  trends = [],
  departments = [],
}) {
  return (
    <div className="charts-grid">
      {/* 7-Day Trend Chart */}
      <div className="chart-card">
        <div className="chart-header">
          <h3 className="chart-title">Weekly Attendance Rate (%)</h3>
          <BarChart3 size={18} color="var(--brand-primary)" />
        </div>

        <div className="chart-bars">
          {trends.length === 0 ? (
            <div style={{ margin: 'auto', color: 'var(--text-muted)', fontSize: 13 }}>
              No historical data available yet.
            </div>
          ) : (
            trends.map((t) => (
              <div key={t.date} className="chart-bar-col" title={`${t.date}: ${t.rate}% (${t.present} Present, ${t.late} Late, ${t.absent} Absent)`}>
                <span className="chart-bar-val">{t.rate}%</span>
                <div className="chart-bar-meter" style={{ height: '100%' }}>
                  <div
                    className="chart-bar-fill"
                    style={{ height: `${Math.min(100, Math.max(10, t.rate))}%` }}
                  />
                </div>
                <span className="chart-bar-label">{t.day_name}</span>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Department Breakdown */}
      <div className="chart-card">
        <div className="chart-header">
          <h3 className="chart-title">Department Distribution</h3>
          <PieChart size={18} color="var(--brand-primary)" />
        </div>

        <div className="dept-list">
          {departments.length === 0 ? (
            <div style={{ margin: 'auto', color: 'var(--text-muted)', fontSize: 13 }}>
              No department data available.
            </div>
          ) : (
            departments.map((dept) => {
              const presentPct = dept.total > 0 ? (dept.present / dept.total) * 100 : 0;
              const latePct = dept.total > 0 ? (dept.late / dept.total) * 100 : 0;
              const absentPct = dept.total > 0 ? (dept.absent / dept.total) * 100 : 0;

              return (
                <div key={dept.department} className="dept-row">
                  <div className="dept-meta">
                    <span style={{ color: 'var(--text-primary)' }}>{dept.department}</span>
                    <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>
                      {dept.present + dept.late} / {dept.total} attended
                    </span>
                  </div>
                  <div className="dept-track">
                    <div
                      className="dept-fill--present"
                      style={{ width: `${presentPct}%` }}
                      title={`${dept.present} Present`}
                    />
                    <div
                      className="dept-fill--late"
                      style={{ width: `${latePct}%` }}
                      title={`${dept.late} Late`}
                    />
                    <div
                      className="dept-fill--absent"
                      style={{ width: `${absentPct}%` }}
                      title={`${dept.absent} Absent`}
                    />
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
