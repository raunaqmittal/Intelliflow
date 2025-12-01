import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import api from '@/lib/api';
import { mapEmployeeFromApi } from '@/lib/mappers';
import type { Employee, UserRole } from '@/types';

// Function to get the last used role from localStorage
const getLastUsedRole = (): UserRole | null => {
  const lastRole = localStorage.getItem('lastUserRole');
  return lastRole as UserRole | null;
};

// mapper moved to src/lib/mappers.ts

interface UserContextType {
  employee: Employee | null;
  userRole: UserRole | null;
  loading: boolean;
  token: string | null;
  loginEmployee: (email: string, password: string) => Promise<UserRole>;
  loginClient: (email: string, password: string) => Promise<UserRole>;
  logout: () => void;
  updateEmployee: (updatedInfo: Partial<Employee>) => void;
  setUserRole: (role: UserRole | null) => void;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({ children }: { children: ReactNode }) {
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [userRole, setUserRole] = useState<UserRole | null>(() => getLastUsedRole());
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('authToken'));

  // Save role to localStorage whenever it changes
  useEffect(() => {
    if (userRole) {
      localStorage.setItem('lastUserRole', userRole);
    }
  }, [userRole]);

  // Listen for storage changes from other tabs (detects when another tab logs in)
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      // If authToken changed in another tab
      if (e.key === 'authToken') {
        const newToken = e.newValue;
        const oldToken = token;
        
        // If token was removed (logout in another tab)
        if (!newToken && oldToken) {
          console.log('🔒 Logged out in another tab, logging out here too');
          logout();
          window.location.href = '/login'; // Redirect to login
          return;
        }
        
        // If token changed (different user logged in another tab)
        if (newToken && newToken !== oldToken) {
          console.log('⚠️ Different user logged in another tab, refreshing session');
          // Force logout and reload to prevent data mismatch
          logout();
          alert('Another user has logged in. This tab will now reload.');
          window.location.reload();
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [token]);

  // On mount, hydrate role and token
  useEffect(() => {
    setLoading(true);
    const storedRole = getLastUsedRole();
    const storedToken = localStorage.getItem('authToken');
    setUserRole(storedRole);
    setToken(storedToken);
    // If we had stored a minimal employee profile, hydrate it
    const storedEmp = localStorage.getItem('employeeProfile');
    if (storedEmp) {
      try { setEmployee(JSON.parse(storedEmp)); } catch { /* noop */ }
    }
    setLoading(false);
  }, []);

  // Auth actions
  const loginEmployee = async (email: string, password: string): Promise<UserRole> => {
    setLoading(true);
    try {
      const res = await api.post('/employees/login', { email, password });
      const tok = res.data?.token as string;
      const user = res.data?.data?.user;
      if (tok) {
        localStorage.setItem('authToken', tok);
        setToken(tok);
      }
      const emp = mapEmployeeFromApi(user);
      setEmployee(emp);
      localStorage.setItem('employeeProfile', JSON.stringify(emp));
      const role: UserRole = (user?.role === 'manager' ? 'manager' : 'employee');
      setUserRole(role);
      localStorage.setItem('lastUserRole', role);
      return role;
    } finally {
      setLoading(false);
    }
  };

  const loginClient = async (email: string, password: string): Promise<UserRole> => {
    setLoading(true);
    try {
      const res = await api.post('/clients/login', { email, password });
      const tok = res.data?.token as string;
      if (tok) {
        localStorage.setItem('authToken', tok);
        setToken(tok);
      }
      setEmployee(null); // clients don't have employee profile
      setUserRole('client');
      localStorage.setItem('lastUserRole', 'client');
      return 'client';
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    setEmployee(null);
    setUserRole(null);
    setToken(null);
    localStorage.removeItem('authToken');
    localStorage.removeItem('employeeProfile');
    localStorage.removeItem('lastUserRole');
  };

  const updateEmployee = (updatedInfo: Partial<Employee>) => {
    if (employee) {
      const updatedEmployee = { ...employee, ...updatedInfo };
      setEmployee(updatedEmployee);
      // Sync to localStorage so page refresh shows updated data
      localStorage.setItem('employeeProfile', JSON.stringify(updatedEmployee));
    }
  };

  return (
    <UserContext.Provider value={{ employee, userRole, loading, token, loginEmployee, loginClient, logout, updateEmployee, setUserRole }}>
      {children}
    </UserContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useUser() {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
}
