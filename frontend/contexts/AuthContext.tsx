import { createContext, useContext, useState, ReactNode } from 'react';
import { setToken } from '../constants/services/api';

export type UserRole = 'store_manager' | 'admin' | 'staff';

interface AuthContextType {
  isLoggedIn: boolean;
  userRole: UserRole | null;
  userName: string;
  userId: string | null;
  assignedZone: string | null;
  login: (role: UserRole, name: string, id: string, token: string, assignedZone?: string | null) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType>({
  isLoggedIn: false,
  userRole: null,
  userName: '',
  userId: null,
  assignedZone: null,
  login: () => {},
  logout: () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userRole, setUserRole]     = useState<UserRole | null>(null);
  const [userName, setUserName]     = useState('');
  const [userId, setUserId]         = useState<string | null>(null);
  const [assignedZone, setAssignedZone] = useState<string | null>(null);

  const login = (role: UserRole, name: string, id: string, token: string, zone?: string | null) => {
    setToken(token);
    setUserRole(role);
    setUserName(name);
    setUserId(id);
    setAssignedZone(zone ?? null);
    setIsLoggedIn(true);
  };

  const logout = () => {
    setToken(null);
    setUserRole(null);
    setUserName('');
    setUserId(null);
    setAssignedZone(null);
    setIsLoggedIn(false);
  };

  return (
    <AuthContext.Provider value={{ isLoggedIn, userRole, userName, userId, assignedZone, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}