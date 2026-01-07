import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, usersApi, authApi, clearTokens, getAccessToken } from '@/lib/api';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: () => void;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const isAuthenticated = !!user && !!getAccessToken();

  // Check for existing auth on mount
  useEffect(() => {
    const initAuth = async () => {
      const token = getAccessToken();
      if (token) {
        // First try to load from localStorage for instant UI
        const storedUser = localStorage.getItem('skillloop_user');
        if (storedUser) {
          try {
            setUser(JSON.parse(storedUser));
          } catch (e) {
            console.error('Failed to parse stored user:', e);
          }
        }
        
        // Then try to refresh from API
        try {
          const userData = await usersApi.getMe();
          setUser(userData);
          localStorage.setItem('skillloop_user', JSON.stringify(userData));
        } catch (error) {
          console.error('Failed to fetch user from API:', error);
          // Keep using localStorage data if API fails but token exists
          if (!storedUser) {
            clearTokens();
          }
        }
      }
      setIsLoading(false);
    };

    initAuth();
  }, []);



  const login = () => {
    window.location.href = authApi.getLoginUrl();
  };

  const logout = async () => {
    // Clear local state first
    clearTokens();
    setUser(null);
    
    try {
      const response = await authApi.logout();
      // Redirect to Auth0 logout
      window.location.href = response.logout_url;
    } catch (error) {
      console.error('Logout API failed:', error);
      // If API fails, just redirect to home (will trigger Auth0 login)
      window.location.href = '/';
    }
  };

  const refreshUser = async () => {
    try {
      const userData = await usersApi.getMe();
      setUser(userData);
      localStorage.setItem('skillloop_user', JSON.stringify(userData));
    } catch (error) {
      console.error('Failed to refresh user:', error);
    }
  };

  return (
    <AuthContext.Provider value={{ user, isAuthenticated, isLoading, login, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
