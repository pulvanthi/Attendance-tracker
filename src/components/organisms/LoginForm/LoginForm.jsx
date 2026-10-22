import { useState } from 'react';
import { Mail, Lock, User } from 'lucide-react';
import { useAuth } from '../../../hooks/useAuth';
import { Input } from '../../atoms/Input/Input';
import { Button } from '../../atoms/Button/Button';
import './LoginForm.css';

export function AuthModal({ isOpen, onClose }) {
  const [tab, setTab] = useState('login'); // 'login' or 'register'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const { login, register } = useAuth();

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      if (tab === 'login') {
        await login(email, password);
      } else {
        await register(fullName, email, password);
      }
      onClose();
    } catch (err) {
      setError(err.message || 'Authentication failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="auth-modal-card animate-scale-in"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        <div className="auth-tabs">
          <button
            type="button"
            className={`auth-tab ${tab === 'login' ? 'auth-tab--active' : ''}`}
            onClick={() => { setTab('login'); setError(''); }}
          >
            Sign In
          </button>
          <button
            type="button"
            className={`auth-tab ${tab === 'register' ? 'auth-tab--active' : ''}`}
            onClick={() => { setTab('register'); setError(''); }}
          >
            Create Account
          </button>
        </div>

        <form className="auth-form" onSubmit={handleSubmit}>
          {error && (
            <div style={{ padding: '8px 12px', background: 'var(--status-absent-bg)', color: 'var(--status-absent)', borderRadius: 'var(--radius-md)', fontSize: 13, border: '1px solid var(--status-absent-border)' }}>
              {error}
            </div>
          )}

          {tab === 'register' && (
            <Input
              label="Full Name"
              placeholder="e.g. John Doe"
              icon={<User size={16} />}
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
            />
          )}

          <Input
            label="Email Address"
            type="email"
            placeholder="you@company.com"
            icon={<Mail size={16} />}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          <Input
            label="Password"
            type="password"
            placeholder="••••••••"
            icon={<Lock size={16} />}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            minLength={tab === 'register' ? 8 : undefined}
            required
          />

          <Button variant="primary" type="submit" size="lg" isLoading={isLoading}>
            {tab === 'login' ? 'Sign In' : 'Create Account'}
          </Button>

        </form>
      </div>
    </div>
  );
}
