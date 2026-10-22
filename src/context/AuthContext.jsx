import { createContext, useContext, useState, useEffect } from 'react';
import { authService } from '../services/authService';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => authService.getStoredUser());
  const [token, setToken] = useState(() => authService.getToken());
  const [isLoading, setIsLoading] = useState(true);

  // Synchronize on mount and whenever auth state changes
  useEffect(() => {
    async function initAuth() {
      const storedToken = authService.getToken();
      if (storedToken) {
        try {
          const profile = await authService.getCurrentUser();
          setUser(profile);
          setToken(storedToken);
        } catch {
          // If token invalid, clear
          setUser(null);
          setToken(null);
        }
      }
      setIsLoading(false);
    }

    initAuth();

    const handleAuthChange = () => {
      setUser(authService.getStoredUser());
      setToken(authService.getToken());
    };

    window.addEventListener('auth_state_changed', handleAuthChange);
    return () => window.removeEventListener('auth_state_changed', handleAuthChange);
  }, []);

  const login = async (identifier, password, remember = false) => {
    const data = await authService.login(identifier, password, remember);
    setUser(data.user);
    setToken(data.access_token);
    return data;
  };

  const register = async (fullName, email, password, remember = false) => {
    const data = await authService.register(fullName, email, password, remember);
    setUser(data.user);
    setToken(data.access_token);
    return data;
  };

  const logout = () => {
    authService.logout();
    setUser(null);
    setToken(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!token && !!user,
        isAdmin: user?.role === 'admin',
        isLoading,
        login,
        register,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
