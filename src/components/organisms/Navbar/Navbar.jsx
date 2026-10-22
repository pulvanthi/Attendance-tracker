import { Users, BarChart3, Clock, Moon, Sun, LogOut, LogIn, Shield } from 'lucide-react';
import { useTheme } from '../../../hooks/useTheme';
import { useAuth } from '../../../hooks/useAuth';
import { LiveClock } from '../../molecules/LiveClock/LiveClock';
import { Avatar } from '../../atoms/Avatar/Avatar';
import { Button } from '../../atoms/Button/Button';
import './Navbar.css';

export function Navbar({
  activeTab = 'attendance',
  onTabChange,
  onOpenAuth,
}) {
  const { isDark, toggleTheme } = useTheme();
  const { user, isAuthenticated, logout } = useAuth();

  return (
    <header className="navbar">
      <div className="navbar__brand" onClick={() => onTabChange('attendance')}>
        <div className="navbar__logo">
          <Clock size={22} strokeWidth={2.4} />
        </div>
        <div className="navbar__title-wrap">
          <span className="navbar__title">TrackPulse</span>
          <span className="navbar__subtitle">Enterprise Attendance</span>
        </div>
      </div>

      <nav className="navbar__nav" aria-label="Main Navigation">
        <button
          type="button"
          className={`navbar__link ${activeTab === 'attendance' ? 'navbar__link--active' : ''}`}
          onClick={() => onTabChange('attendance')}
        >
          <Clock size={16} />
          <span>Attendance</span>
        </button>

        <button
          type="button"
          className={`navbar__link ${activeTab === 'employees' ? 'navbar__link--active' : ''}`}
          onClick={() => onTabChange('employees')}
        >
          <Users size={16} />
          <span>Team Roster</span>
        </button>

        <button
          type="button"
          className={`navbar__link ${activeTab === 'analytics' ? 'navbar__link--active' : ''}`}
          onClick={() => onTabChange('analytics')}
        >
          <BarChart3 size={16} />
          <span>Analytics & Reports</span>
        </button>
      </nav>

      <div className="navbar__right">
        <LiveClock />

        <Button
          variant="ghost"
          size="sm"
          onClick={toggleTheme}
          title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          aria-label="Toggle theme"
        >
          {isDark ? <Sun size={18} color="#f59e0b" /> : <Moon size={18} />}
        </Button>

        {isAuthenticated && user ? (
          <div className="navbar__user-pill">
            <Avatar name={user.full_name || user.email} size="sm" />
            <div className="navbar__user-info">
              <span className="navbar__user-name">{user.full_name}</span>
              <span className="navbar__user-role">{user.role}</span>
            </div>
            <Button
              variant="outline"
              size="sm"
              leftIcon={<LogOut size={15} />}
              onClick={logout}
              title="Sign out of TrackPulse"
            >
              Logout
            </Button>
          </div>
        ) : (
          <Button
            variant="primary"
            size="sm"
            leftIcon={<LogIn size={15} />}
            onClick={onOpenAuth}
          >
            Sign In
          </Button>
        )}
      </div>
    </header>
  );
}
