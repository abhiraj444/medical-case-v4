'use client';

import { createContext, useState, type ReactNode } from 'react';
import { Loader2 } from 'lucide-react';

// Mock User type since we are removing Firebase
type User = {
  uid: string;
  displayName: string | null;
  email: string | null;
};

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: () => void;
  logout: () => void;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(false);

  const login = () => {
    setUser({
      uid: 'mock-user-id',
      displayName: 'Mock User',
      email: 'user@example.com',
    });
  };

  const logout = () => {
    setUser(null);
  };

  if (loading) {
    return (
      <div className="flex min-h-screen w-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}