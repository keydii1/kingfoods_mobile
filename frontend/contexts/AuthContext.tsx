import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { setToken, setOnUnauthorized } from '../constants/services/api';

export type UserRole = 'store_manager' | 'admin' | 'staff';

interface AuthContextType {
  isLoggedIn: boolean;
  userRole: UserRole | null;
  userName: string;
  userId: string | null;
  assignedZone: string | null;
  login: (role: UserRole, name: string, id: string, token: string, assignedZone?: string | null) => void;
  logout: () => void;
  updateName: (name: string) => void;
}

const AuthContext = createContext<AuthContextType>({
  isLoggedIn: false,
  userRole: null,
  userName: '',
  userId: null,
  assignedZone: null,
  login: () => {},
  logout: () => {},
  updateName: () => {},
});

// On web, restore session from localStorage before first render
const storage = typeof window !== 'undefined' && window.localStorage;
const savedSession = storage ? storage.getItem('authSession') : null;
const initialData = savedSession ? (() => { try { return JSON.parse(savedSession); } catch { return null; } })() : null;

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isLoggedIn, setIsLoggedIn] = useState(!!initialData);
  const [userRole, setUserRole]     = useState<UserRole | null>(initialData?.userRole ?? null);
  const [userName, setUserName]     = useState(initialData?.userName ?? '');
  const [userId, setUserId]         = useState<string | null>(initialData?.userId ?? null);
  const [assignedZone, setAssignedZone] = useState<string | null>(initialData?.assignedZone ?? null);

  const login = (role: UserRole, name: string, id: string, token: string, zone?: string | null) => {
    setToken(token);
    setUserRole(role);
    setUserName(name);
    setUserId(id);
    setAssignedZone(zone ?? null);
    setIsLoggedIn(true);
    if (storage) {
      storage.setItem('authSession', JSON.stringify({ token, userRole: role, userName: name, userId: id, assignedZone: zone ?? null }));
    }
  };

  const logout = () => {
    setToken(null);
    setUserRole(null);
    setUserName('');
    setUserId(null);
    setAssignedZone(null);
    setIsLoggedIn(false);
    if (storage) {
      storage.removeItem('authSession');
      storage.removeItem('authToken');
    }
  };

  // Auto-logout when API returns 401
  useEffect(() => {
    setOnUnauthorized(logout);
    return () => setOnUnauthorized(null);
  }, []);

  const updateName = (name: string) => {
    setUserName(name);
  };

  return (
    <AuthContext.Provider value={{ isLoggedIn, userRole, userName, userId, assignedZone, login, logout, updateName }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}