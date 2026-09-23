import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { User, Permission } from '../types';
import { apiRequest, setAuthToken, clearAuthToken, getAuthToken } from '../services/api';

export type TabPermissionTarget =
  | 'dashboard'
  | 'pos'
  | 'sales'
  | 'products'
  | 'categories'
  | 'inventory'
  | 'purchases'
  | 'accounting'
  | 'customers'
  | 'suppliers'
  | 'reports'
  | 'barcode'
  | 'users'
  | 'backup'
  | 'settings';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAdmin: boolean;
  hasPermission: (permission: Permission) => boolean;
  canAccessTab: (tab: TabPermissionTarget) => boolean;
  login: (username: string, password: string) => Promise<{ success: boolean; message?: string }>;
  logout: () => void;
  refreshUserProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(getAuthToken());
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const refreshUserProfile = useCallback(async () => {
    const storedToken = getAuthToken();
    if (!storedToken) {
      setUser(null);
      setIsLoading(false);
      return;
    }

    const res = await apiRequest<User>('/auth/me');
    if (res.success && res.data) {
      setUser(res.data);
    } else {
      clearAuthToken();
      setToken(null);
      setUser(null);
    }
    setIsLoading(false);
  }, []);

  // Validate token on mount
  useEffect(() => {
    refreshUserProfile();
  }, [refreshUserProfile]);

  const login = async (username: string, password: string) => {
    setIsLoading(true);
    const res = await apiRequest<{ user: User; token: string }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    });

    if (res.success && res.data) {
      setAuthToken(res.data.token);
      setToken(res.data.token);
      setUser(res.data.user);
      setIsLoading(false);
      return { success: true };
    }

    setIsLoading(false);
    return { success: false, message: res.message || 'نام کاربری یا رمز عبور اشتباه است.' };
  };

  const logout = () => {
    clearAuthToken();
    setToken(null);
    setUser(null);
  };

  const isAdmin = user?.role === 'ADMIN';

  const hasPermission = useCallback(
    (permission: Permission): boolean => {
      if (!user) return false;
      if (user.role === 'ADMIN' || isAdmin) return true;
      return Boolean(user.permissions && user.permissions.includes(permission));
    },
    [user, isAdmin]
  );

  const canAccessTab = useCallback(
    (tab: TabPermissionTarget): boolean => {
      if (!user) return false;
      if (user.role === 'ADMIN' || isAdmin) return true;

      switch (tab) {
        case 'dashboard':
          return hasPermission('DASHBOARD_VIEW');
        case 'pos':
          return hasPermission('POS_ACCESS');
        case 'sales':
          return hasPermission('SALES_VIEW');
        case 'products':
          return hasPermission('PRODUCT_VIEW');
        case 'categories':
          return hasPermission('CATEGORIES_MANAGE');
        case 'inventory':
          return hasPermission('INVENTORY_VIEW');
        case 'purchases':
          return hasPermission('PURCHASES_MANAGE') || hasPermission('PURCHASE_VIEW');
        case 'accounting':
          return hasPermission('ACCOUNTING_MANAGE');
        case 'customers':
          return hasPermission('CUSTOMERS_MANAGE');
        case 'suppliers':
          return hasPermission('SUPPLIERS_MANAGE');
        case 'reports':
          return hasPermission('REPORTS_VIEW');
        case 'barcode':
          return hasPermission('BARCODE_PRINT');
        case 'users':
          return user.role === 'ADMIN' || hasPermission('USERS_MANAGE');
        case 'backup':
          return user.role === 'ADMIN' || hasPermission('BACKUP_MANAGE');
        case 'settings':
          return user.role === 'ADMIN' || hasPermission('SETTINGS_MANAGE');
        default:
          return true;
      }
    },
    [user, isAdmin, hasPermission]
  );

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        isAdmin,
        hasPermission,
        canAccessTab,
        login,
        logout,
        refreshUserProfile,
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
