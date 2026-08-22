'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export interface UserProfile {
  id: string;
  email?: string;
  username?: string;
  name?: string;
  avatar_url?: string;
  avatarUrl?: string;
  github_id?: string;
  githubId?: string;
  created_at?: string;
  createdAt?: string;
}

interface AuthContextType {
  user: UserProfile | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  loginWithGithub: () => void;
  setSession: (token: string) => Promise<boolean>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const API_BASE_URL = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000').replace(/\/+$/, '');

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Initialize session on mount
  useEffect(() => {
    const initAuth = async () => {
      if (typeof window === 'undefined') {
        setIsLoading(false);
        return;
      }

      // 1. Check if token is present in URL search params (OAuth redirect)
      const urlParams = new URLSearchParams(window.location.search);
      const urlToken = urlParams.get('token');

      if (urlToken) {
        localStorage.setItem('sentinel_auth_token', urlToken);
        const cleanUrl = window.location.pathname;
        window.history.replaceState({}, document.title, cleanUrl);
        await setSession(urlToken);
        setIsLoading(false);
        return;
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

  const normalizeUser = (rawUser: any): UserProfile => {
    return {
      id: rawUser.id || 'usr_unknown',
      username: rawUser.username || rawUser.name || 'Developer',
      name: rawUser.name || rawUser.username || 'Developer',
      email: rawUser.email || undefined,
      avatar_url: rawUser.avatar_url || rawUser.avatarUrl || 'https://github.com/ghost.png',
      avatarUrl: rawUser.avatarUrl || rawUser.avatar_url || 'https://github.com/ghost.png',
      github_id: rawUser.github_id || rawUser.githubId || undefined,
      githubId: rawUser.githubId || rawUser.github_id || undefined,
      created_at: rawUser.created_at || rawUser.createdAt || undefined,
      createdAt: rawUser.createdAt || rawUser.created_at || undefined,
    };
  };

  const fetchUserProfile = async (authToken: string): Promise<UserProfile | null> => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/v1/auth/me`, {
        headers: {
          Authorization: `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
      });

      if (res.ok) {
        const data = await res.json();
        if (data.user) {
          return normalizeUser(data.user);
        }
      }

      // Fallback: decode JWT sub
      try {
        const base64Url = authToken.split('.')[1];
        if (base64Url) {
          const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
          const jsonPayload = decodeURIComponent(
            atob(base64)
              .split('')
              .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
              .join('')
          );
          const payload = JSON.parse(jsonPayload);
          if (payload.sub) {
            return {
              id: payload.sub,
              username: 'Developer',
              name: 'Developer',
              avatar_url: 'https://github.com/ghost.png',
              avatarUrl: 'https://github.com/ghost.png',
            };
          }
        }
      } catch {
        // ignore
      }

      return null;
    } catch (err) {
      console.warn('Network issue fetching user profile:', err);
      // Graceful session keep
      return {
        id: 'usr_local',
        username: 'Developer (Session Active)',
        name: 'Developer',
        avatar_url: 'https://github.com/ghost.png',
        avatarUrl: 'https://github.com/ghost.png',
      };
    }
  };

  const setSession = async (authToken: string): Promise<boolean> => {
    setToken(authToken);
    localStorage.setItem('sentinel_auth_token', authToken);
    const profile = await fetchUserProfile(authToken);
    if (profile) {
      setUser(profile);
      return true;
    } else {
      localStorage.removeItem('sentinel_auth_token');
      setToken(null);
      setUser(null);
      return false;
    }
  };

  const refreshProfile = async () => {
    if (token) {
      const profile = await fetchUserProfile(token);
      if (profile) setUser(profile);
    }
  };

  const loginWithGithub = () => {
    window.location.href = `${API_BASE_URL}/api/v1/auth/github`;
  };

  const logout = async () => {
    if (token) {
      try {
        await fetch(`${API_BASE_URL}/api/v1/auth/logout`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
      } catch (e) {
        console.warn('Backend logout request error:', e);
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
        refreshProfile,
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