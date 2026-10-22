import { Navbar } from '../../organisms/Navbar/Navbar';
import './DashboardTemplate.css';

export function DashboardTemplate({
  children,
  activeTab,
  onTabChange,
  onOpenAuth,
  pageTitle,
  pageDescription,
  mastheadActions,
}) {
  return (
    <div className="dashboard-layout">
      <Navbar
        activeTab={activeTab}
        onTabChange={onTabChange}
        onOpenAuth={onOpenAuth}
      />

      <section className="dashboard-masthead" aria-label="Page Header">
        <div className="dashboard-masthead__left">
          <h1 className="dashboard-masthead__title">{pageTitle}</h1>
          {pageDescription && (
            <p className="dashboard-masthead__desc">{pageDescription}</p>
          )}
        </div>
        {mastheadActions && (
          <div className="dashboard-masthead__actions">{mastheadActions}</div>
        )}
      </section>

      <main className="dashboard-content">{children}</main>

      <footer className="dashboard-footer">
        <span>TrackPulse Attendance System · Powered by FastAPI & React (Atomic Design)</span>
      </footer>
    </div>
  );
}
