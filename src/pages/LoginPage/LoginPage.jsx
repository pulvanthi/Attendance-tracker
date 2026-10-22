import { useState } from 'react';
import { ArrowRight, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import './LoginPage.css';

function BrandMark() {
  return (
    <svg width="34" height="34" viewBox="0 0 34 34" fill="none" aria-hidden="true">
      <path d="M17 3 4 31h6.2l2.2-5.2h9.2l2.2 5.2H30L17 3Zm0 12.4 2.9 6.9h-5.8l2.9-6.9Z" fill="#3b6ff5" />
    </svg>
  );
}

function Illustration() {
  return (
    <svg className="lp-illustration" viewBox="0 0 220 150" fill="none" aria-hidden="true">
      {/* floating clock chip */}
      <rect x="4" y="22" width="34" height="34" rx="9" fill="#ffffff" fillOpacity=".12" />
      <circle cx="21" cy="39" r="9" stroke="#cbd5e1" strokeWidth="2" />
      <path d="M21 33v6l4 2" stroke="#cbd5e1" strokeWidth="2" strokeLinecap="round" />
      {/* dashboard card */}
      <rect x="92" y="0" width="108" height="46" rx="8" fill="#ffffff" fillOpacity=".14" />
      <rect x="104" y="12" width="52" height="5" rx="2.5" fill="#fff" />
      <rect x="104" y="23" width="84" height="4" rx="2" fill="#ffffff" fillOpacity=".45" />
      <rect x="104" y="32" width="64" height="4" rx="2" fill="#ffffff" fillOpacity=".45" />
      <rect x="172" y="31" width="16" height="5" rx="2.5" fill="#3b6ff5" />
      {/* calendar */}
      <rect x="40" y="46" width="94" height="86" rx="8" fill="#fff" />
      <path d="M40 54a8 8 0 0 1 8-8h78a8 8 0 0 1 8 8v8H40v-8Z" fill="#2f5fe0" />
      <rect x="58" y="38" width="5" height="14" rx="2.5" fill="#cbd5e1" />
      <rect x="111" y="38" width="5" height="14" rx="2.5" fill="#cbd5e1" />
      {[0, 1, 2, 3].map((r) =>
        [0, 1, 2, 3, 4].map((c) => (
          <rect
            key={`${r}-${c}`}
            x={50 + c * 16}
            y={72 + r * 14}
            width="9"
            height="8"
            rx="2"
            fill={r === 1 && c === 1 ? '#2f5fe0' : '#dbe3f1'}
          />
        ))
      )}
      {/* clock badge */}
      <circle cx="140" cy="118" r="22" fill="#2f5fe0" stroke="#0b2a6f" strokeWidth="3" />
      <circle cx="140" cy="118" r="14" stroke="#fff" strokeWidth="2.5" />
      <path d="M140 110v9l6 3" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" />
      {/* chart chip */}
      <rect x="170" y="92" width="38" height="38" rx="9" fill="#ffffff" fillOpacity=".14" />
      <rect x="179" y="112" width="5" height="10" rx="1.5" fill="#cbd5e1" />
      <rect x="188" y="104" width="5" height="18" rx="1.5" fill="#cbd5e1" />
      <rect x="197" y="98" width="5" height="24" rx="1.5" fill="#cbd5e1" />
    </svg>
  );
}

export function LoginPage() {
  const { login, register } = useAuth();
  const [mode, setMode] = useState('login'); // 'login' | 'register'
  const [fullName, setFullName] = useState('');
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const isRegister = mode === 'register';

  const switchMode = (next) => {
    setMode(next);
    setError('');
    setNotice('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setNotice('');
    setIsLoading(true);
    try {
      if (isRegister) {
        await register(fullName.trim(), identifier.trim(), password, remember);
      } else {
        await login(identifier.trim(), password, remember);
      }
    } catch (err) {
      setError(err.message || 'Authentication failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="lp-page">
      <div className="lp-card">
        {/* ---------- Brand panel ---------- */}
        <aside className="lp-brand">
          <div className="lp-brand__top">
            <div className="lp-logo">
              <BrandMark />
              <div>
                <div className="lp-logo__name">TrackPulse</div>
                <div className="lp-logo__tag">EMPLOYEE ATTENDANCE PORTAL</div>
              </div>
            </div>
            <Illustration />
          </div>

          <div className="lp-brand__copy">
            <h2>Your Workday, Simplified</h2>
            <p>Track your time, manage your schedule, and access your dashboard with ease.</p>
          </div>
          <div className="lp-brand__waves" aria-hidden="true" />
        </aside>

        {/* ---------- Form panel ---------- */}
        <main className="lp-form-panel">
          <form className="lp-form" onSubmit={handleSubmit} noValidate={false}>
            <h1>{isRegister ? 'Create your account' : 'Welcome back'}</h1>
            <p className="lp-form__sub">
              {isRegister
                ? 'Register with your work email to get started.'
                : 'Sign in to access your attendance dashboard.'}
            </p>

            {error && <div className="lp-alert" role="alert">{error}</div>}
            {notice && <div className="lp-alert lp-alert--info" role="status">{notice}</div>}

            {isRegister && (
              <div className="lp-field">
                <label htmlFor="lp-name">Full Name</label>
                <input
                  id="lp-name"
                  type="text"
                  placeholder="Enter your full name"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  autoComplete="name"
                  required
                />
              </div>
            )}

            <div className="lp-field">
              <label htmlFor="lp-id">{isRegister ? 'Work Email' : 'Work Email or Employee ID'}</label>
              <input
                id="lp-id"
                type={isRegister ? 'email' : 'text'}
                placeholder={isRegister ? 'Enter your work email' : 'Enter your work email or ID'}
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                autoComplete="username"
                required
              />
            </div>

            <div className="lp-field">
              <div className="lp-field__row">
                <label htmlFor="lp-pw">Password</label>
                <button
                  type="button"
                  className="lp-link lp-link--muted"
                  onClick={() => setShowPassword((v) => !v)}
                >
                  Show/Hide
                </button>
              </div>
              <div className="lp-password">
                <input
                  id="lp-pw"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete={isRegister ? 'new-password' : 'current-password'}
                  minLength={isRegister ? 8 : undefined}
                  required
                />
                <button
                  type="button"
                  className="lp-password__toggle"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <Eye size={18} /> : <EyeOff size={18} />}
                </button>
              </div>
              {isRegister && <span className="lp-hint">At least 8 characters.</span>}
            </div>

            <div className="lp-options">
              <label className="lp-check">
                <input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} />
                <span>Remember me</span>
              </label>
              {!isRegister && (
                <button
                  type="button"
                  className="lp-link"
                  onClick={() => setNotice('To reset your password, please contact your administrator or IT Support.')}
                >
                  Forgot password?
                </button>
              )}
            </div>

            <button type="submit" className="lp-submit" disabled={isLoading}>
              {isLoading ? (
                <span className="lp-spinner" aria-label="Please wait" />
              ) : (
                <>
                  {isRegister ? 'Create Account' : 'Sign In'} <ArrowRight size={16} />
                </>
              )}
            </button>

            <p className="lp-switch">
              {isRegister ? 'Already have an account?' : 'New employee?'}{' '}
              <button type="button" className="lp-link" onClick={() => switchMode(isRegister ? 'login' : 'register')}>
                {isRegister ? 'Sign in' : 'Create an account'}
              </button>
            </p>

            {!isRegister && (
              <p className="lp-help">
                Having trouble signing in?{' '}
                <button
                  type="button"
                  className="lp-link"
                  onClick={() => setNotice('Please contact your IT Support team or administrator for help.')}
                >
                  Contact IT Support
                </button>
              </p>
            )}
          </form>

          <footer className="lp-footer">Secure employee access · © {new Date().getFullYear()} TrackPulse</footer>
        </main>
      </div>
    </div>
  );
}
