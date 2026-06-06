import { createContext, useContext, useState, useEffect, useCallback } from 'react';

const AuthContext = createContext(null);

function parseJwt(token) {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch {
    return null;
  }
}

export function AuthProvider({ children }) {
  const [token, setToken] = useState(null);
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Hydrate from localStorage on mount
  useEffect(() => {
    const storedToken = localStorage.getItem('safari_token');
    const storedUser = localStorage.getItem('safari_user');

    if (storedToken) {
      setToken(storedToken);

      if (storedUser) {
        try {
          setUser(JSON.parse(storedUser));
        } catch {
          // If stored user is corrupted, parse from JWT
          const parsed = parseJwt(storedToken);
          if (parsed) {
            setUser(parsed);
          }
        }
      } else {
        // Derive user from JWT
        const parsed = parseJwt(storedToken);
        if (parsed) {
          setUser(parsed);
        }
      }
    }

    setIsLoading(false);
  }, []);

  const login = useCallback((newToken, userData) => {
    localStorage.setItem('safari_token', newToken);

    const userInfo = userData || parseJwt(newToken);
    if (userInfo) {
      localStorage.setItem('safari_user', JSON.stringify(userInfo));
    }

    setToken(newToken);
    setUser(userInfo);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('safari_token');
    localStorage.removeItem('safari_user');
    setToken(null);
    setUser(null);
  }, []);

  const isAuthenticated = !!token;

  const value = {
    user,
    token,
    login,
    logout,
    isAuthenticated,
    isLoading,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export default AuthContext;
