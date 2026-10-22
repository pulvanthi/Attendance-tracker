/**
 * Authentication service backed by the FastAPI backend (JWT).
 * With "Remember me" the session is kept in localStorage; otherwise only for the browser session.
 */
import { apiRequest, getStoredToken, clearStoredSession } from './api';

const TOKEN_KEY = 'trackpulse_token';
const USER_KEY = 'trackpulse_user';

function storeSession(data, remember) {
  clearStoredSession();
  const store = remember ? localStorage : sessionStorage;
  store.setItem(TOKEN_KEY, data.access_token);
  store.setItem(USER_KEY, JSON.stringify(data.user));
  window.dispatchEvent(new Event('auth_state_changed'));
  return data;
}

function activeStore() {
  return localStorage.getItem(TOKEN_KEY) ? localStorage : sessionStorage;
}

export const authService = {
  /** `identifier` is a work email or an employee ID (e.g. EMP-004). */
  async login(identifier, password, remember = false) {
    const data = await apiRequest('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email: identifier, password }),
    });
    return storeSession(data, remember);
  },

  async register(fullName, email, password, remember = false) {
    const data = await apiRequest('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ full_name: fullName, email, password }),
    });
    return storeSession(data, remember);
  },

  async getCurrentUser() {
    const user = await apiRequest('/auth/me');
    activeStore().setItem(USER_KEY, JSON.stringify(user));
    return user;
  },

  logout() {
    clearStoredSession();
    window.dispatchEvent(new Event('auth_state_changed'));
  },

  getStoredUser() {
    try {
      const user = localStorage.getItem(USER_KEY) || sessionStorage.getItem(USER_KEY);
      return user ? JSON.parse(user) : null;
    } catch {
      return null;
    }
  },

  getToken() {
    return getStoredToken();
  },
};
