import React, { createContext, useContext, useState, useEffect } from 'react';
import { loginUser } from '../api/apiService';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Restore session from localStorage on app boot
  useEffect(() => {
    try {
      const storedToken = localStorage.getItem('ucleare_token');
      const storedUser = localStorage.getItem('ucleare_user');

      if (storedToken && storedUser) {
        const parsedUser = JSON.parse(storedUser);
        setUser(parsedUser);
        setToken(storedToken);
        setIsAuthenticated(true);
      }
    } catch (err) {
      console.warn('Failed to restore auth session:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const login = async (credential, password, role) => {
    try {
      const res = await loginUser(credential, password, role);
      if (res && res.success) {
        setUser(res.user);
        setToken(res.token);
        setIsAuthenticated(true);
        localStorage.setItem('ucleare_user', JSON.stringify(res.user));
        return { success: true, user: res.user };
      }
      throw new Error('Invalid credentials. Please verify your details and try again.');
    } catch (err) {
      const msg = err.message && err.message.includes('Invalid credentials')
        ? err.message
        : 'Invalid credentials. Please verify your details and try again.';
      throw new Error(msg);
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    setIsAuthenticated(false);
    localStorage.removeItem('ucleare_token');
    localStorage.removeItem('ucleare_user');
  };

  const updateUser = (updatedProfile) => {
    setUser(updatedProfile);
    localStorage.setItem('ucleare_user', JSON.stringify(updatedProfile));
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        role: user?.role || 'student',
        token,
        isAuthenticated,
        isLoading,
        login,
        logout,
        updateUser,
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
