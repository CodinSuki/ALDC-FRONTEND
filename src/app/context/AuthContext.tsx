import React, { createContext, useContext, useState, useEffect } from 'react';

interface AuthContextType {
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Check if user is already logged in on mount
  useEffect(() => {
    const storedAuth = localStorage.getItem('adminAuth');
    if (storedAuth) {
      try {
        const authData = JSON.parse(storedAuth);
        // Optional: Validate token expiration here if you add timestamps
        setIsAuthenticated(true);
      } catch (e) {
        localStorage.removeItem('adminAuth');
      }
    }
    setIsLoading(false);
  }, []);

  const login = async (email: string, password: string): Promise<void> => {
    // TODO: Replace with actual API call to your backend
    // This is a simple demo implementation
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        // Demo credentials - replace with real authentication
        if (email && password.length >= 6) {
          const authData = {
            email,
            timestamp: new Date().toISOString(),
            // In production, you'd store a JWT token here instead
          };
          localStorage.setItem('adminAuth', JSON.stringify(authData));
          setIsAuthenticated(true);
          resolve();
        } else {
          reject(new Error('Invalid credentials'));
        }
      }, 500);
    });
  };

  const logout = () => {
    localStorage.removeItem('adminAuth');
    setIsAuthenticated(false);
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
