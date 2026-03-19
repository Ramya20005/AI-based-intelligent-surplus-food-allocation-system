import React, { createContext, useContext, useEffect, useState, ReactNode } from "react";
import {
  apiKeys,
  getCurrentUser,
  loginUser,
  registerUser,
  type User,
  type UserRole,
} from "@/lib/api";

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string, role?: UserRole) => Promise<User>;
  register: (name: string, email: string, password: string, role: UserRole, ngoName?: string) => Promise<User>;
  logout: () => void;
  isAuthenticated: boolean;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const readStoredUser = (): User | null => {
  const raw = localStorage.getItem(apiKeys.user);
  if (!raw) return null;

  try {
    return JSON.parse(raw) as User;
  } catch {
    return null;
  }
};

const persistSession = (token: string, user: User) => {
  localStorage.setItem(apiKeys.token, token);
  localStorage.setItem(apiKeys.user, JSON.stringify(user));
};

const clearSession = () => {
  localStorage.removeItem(apiKeys.token);
  localStorage.removeItem(apiKeys.user);
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(readStoredUser);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem(apiKeys.token);
    if (!token) {
      setLoading(false);
      return;
    }

    getCurrentUser()
      .then(({ user: currentUser }) => {
        setUser(currentUser);
        localStorage.setItem(apiKeys.user, JSON.stringify(currentUser));
      })
      .catch(() => {
        clearSession();
        setUser(null);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  const login = async (email: string, password: string, role?: UserRole) => {
    const response = await loginUser({ email, password, role });
    persistSession(response.token, response.user);
    setUser(response.user);
    return response.user;
  };

  const register = async (name: string, email: string, password: string, role: UserRole, ngoName?: string) => {
    const response = await registerUser({ name, email, password, role, ngoName });
    persistSession(response.token, response.user);
    setUser(response.user);
    return response.user;
  };

  const logout = () => {
    clearSession();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, register, logout, isAuthenticated: !!user, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
};

export type { UserRole, User };
