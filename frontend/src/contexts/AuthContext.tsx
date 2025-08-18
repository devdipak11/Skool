import React, { createContext, useContext, useState, useEffect } from 'react';

// User type for context
interface User {
  id?: string;
  name: string;
  role: string;
  [key: string]: any;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isAuthReady: boolean; // newly exposed flag to indicate localStorage has been loaded
  login: (user: User, token: string) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isAuthReady, setIsAuthReady] = useState(false);

  const normalizeRole = (role?: string) => (role ? role.toLowerCase() : '');

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    const storedToken = localStorage.getItem('token');
    console.log('AuthContext useEffect: storedUser', storedUser, 'storedToken', storedToken);
    if (storedUser && storedToken) {
      try {
        const parsed = JSON.parse(storedUser);
        if (parsed?.role) parsed.role = normalizeRole(parsed.role);
        setUser(parsed);
        setToken(storedToken);
      } catch (e) {
        console.warn('Failed to parse stored user', e);
      }
    }
    // Mark that we've finished attempting to read stored auth — consumers can rely on this
    setIsAuthReady(true);
  }, []);

  const login = (user: User, token: string) => {
    const normalizedUser = { ...user, role: normalizeRole(user.role) };
    setUser(normalizedUser);
    setToken(token);
    localStorage.setItem('user', JSON.stringify(normalizedUser));
    localStorage.setItem('token', token);
    // ensure ready flag is true after a login
    setIsAuthReady(true);
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('user');
    localStorage.removeItem('token');
  };

  const value: AuthContextType = {
    user,
    token,
    // Only consider authenticated after we've finished reading storage to avoid flashes/redirects
    isAuthenticated: isAuthReady && !!user && !!token,
    isAuthReady,
    login,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
}