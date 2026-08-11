'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export interface UserProfile {
  id: string;
  email?: string;
  username?: string;
  name?: string;
  avatar_url?: string;
  github_id?: string;
  created_at?: string;
}

interface AuthContextType {
  user: UserProfile | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  loginWithGithub: () => void;
  setSession: (token: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Initialize session on mount
  useEffect(() => {
    const initAuth = async () => {
      // 1. Check if token is present in URL search params (e.g. redirected from GitHub OAuth callback)
      if (typeof window !== 'undefined') {
        const urlParams = new URLSearchParams(window.location.search);
        const urlToken = urlParams.get('token');

        if (urlToken) {
          localStorage.setItem('sentinel_auth_token', urlToken);
          // Clean up URL parameter without refreshing page
          const cleanUrl = window.location.pathname;
          window.history.replaceState({}, document.title, cleanUrl);
          await setSession(urlToken);
          setIsLoading(false);
          return;
        }
      }

      // 2. Check localStorage
      const savedToken = localStorage.getItem('sentinel_auth_token');
      if (savedToken) {
        await setSession(savedToken);
      }
      setIsLoading(false);
    };

    initAuth();
  }, []);

  const fetchUserProfile = async (authToken: string): Promise<UserProfile | null> => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/auth/me`, {
        headers: {
          Authorization: `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
      });

      if (res.ok) {
        const data = await res.json();
        return data.user || null;
      } else {
        console.warn('Failed to fetch user profile, token might be invalid/expired');
        return null;
      }
    } catch (err) {
      console.error('Error fetching user profile from api-service:', err);
      return null;
    }
  };

  const setSession = async (authToken: string) => {
    setToken(authToken);
    localStorage.setItem('sentinel_auth_token', authToken);
    const profile = await fetchUserProfile(authToken);
    if (profile) {
      setUser(profile);
    } else {
      // Token invalid
      localStorage.removeItem('sentinel_auth_token');
      setToken(null);
      setUser(null);
    }
  };

  const loginWithGithub = () => {
    // Redirect to backend OAuth route
    window.location.href = `${API_BASE_URL}/api/auth/github`;
  };

  const logout = async () => {
    if (token) {
      try {
        await fetch(`${API_BASE_URL}/api/auth/logout`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
      } catch (e) {
        console.warn('Backend logout request failed:', e);
      }
    }
    localStorage.removeItem('sentinel_auth_token');
    setToken(null);
    setUser(null);
    window.location.href = '/';
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        isAuthenticated: !!user,
        loginWithGithub,
        setSession,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
