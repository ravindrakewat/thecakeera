import React, { createContext, useState, useEffect, useContext } from 'react';
import { authService } from '../services/authService';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [authStatus, setAuthStatus] = useState('LOADING'); // 'LOADING' | 'AUTHENTICATED' | 'UNAUTHENTICATED'

  const checkAuthStatus = async () => {
    const token = localStorage.getItem('accessToken');
    if (!token) {
      setUser(null);
      setAuthStatus('UNAUTHENTICATED');
      return;
    }

    try {
      const response = await authService.getMe();
      if (response.data?.user) {
        setUser(response.data.user);
        setAuthStatus('AUTHENTICATED');
      } else {
        setUser(null);
        setAuthStatus('UNAUTHENTICATED');
      }
    } catch (error) {
      setUser(null);
      setAuthStatus('UNAUTHENTICATED');
    }
  };

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const login = async (credentials) => {
    const response = await authService.login(credentials);
    if (response.data?.user) {
      setUser(response.data.user);
      setAuthStatus('AUTHENTICATED');
    }
    return response;
  };

  const register = async (userData) => {
    const response = await authService.register(userData);
    if (response.data?.user) {
      setUser(response.data.user);
      setAuthStatus('AUTHENTICATED');
    }
    return response;
  };

  const logout = async () => {
    try {
      await authService.logout();
    } finally {
      setUser(null);
      setAuthStatus('UNAUTHENTICATED');
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        setUser,
        authStatus,
        isAuthenticated: authStatus === 'AUTHENTICATED',
        isLoading: authStatus === 'LOADING',
        login,
        register,
        logout,
        checkAuthStatus,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
