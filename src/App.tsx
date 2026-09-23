import React, { useState, useEffect, useCallback } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { CurrencyProvider, useCurrency } from './context/CurrencyContext';
import { StoreSettings } from './types';
import { apiRequest } from './services/api';

// Components
import { Header } from './components/layout/Header';
import { Sidebar, TabType } from './components/layout/Sidebar';
import { BottomNav } from './components/layout/BottomNav';
import { NavigationSearchModal } from './components/layout/NavigationSearchModal';
import { LoginView } from './components/auth/LoginView';
import { PosView } from './components/pos/PosView';
import { SalesHistoryView } from './components/sales/SalesHistoryView';
import { ProductsView } from './components/products/ProductsView';
import { CategoriesView } from './components/categories/CategoriesView';
import { InventoryView } from './components/inventory/InventoryView';
import { PurchasesView } from './components/purchases/PurchasesView';
import { AccountingView } from './components/accounting/AccountingView';
import { CustomersView } from './components/customers/CustomersView';
import { SuppliersView } from './components/suppliers/SuppliersView';
import { ReportsView } from './components/reports/ReportsView';
import { BarcodeManager } from './components/barcode/BarcodeManager';
import { UsersView } from './components/users/UsersView';
import { BackupView } from './components/backup/BackupView';
import { SettingsView } from './components/settings/SettingsView';
import { DashboardView } from './components/dashboard/DashboardView';

const MainLayout: React.FC = () => {
  const { user, isAdmin, isLoading } = useAuth();
  const { currency, setCurrency } = useCurrency();
  const [activeTab, setActiveTab] = useState<TabType>(() => {
    try {
      const saved = localStorage.getItem('nuts_pos_active_tab') as TabType;
      if (saved) return saved;
    } catch (_) {}
    return 'pos';
  });
  const [settings, setSettings] = useState<StoreSettings | null>(null);
  const [lowStockCount, setLowStockCount] = useState<number>(0);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState<boolean>(false);
  const [isSearchOpen, setIsSearchOpen] = useState<boolean>(false);
  const hasInitializedTab = React.useRef<boolean>(false);

  // Load Store Settings & Low Stock Alerts
  const loadInitialAppData = useCallback(async () => {
    if (!user) return;

    try {
      const [settingsRes, invRes] = await Promise.all([
        apiRequest<StoreSettings>('/settings'),
        apiRequest<{ items: any[]; summary: any }>('/inventory'),
      ]);

      if (settingsRes.success && settingsRes.data) {
        setSettings(settingsRes.data);
        if (settingsRes.data.currency === 'ریال' || settingsRes.data.currency === 'تومان') {
          setCurrency(settingsRes.data.currency, false);
        }
      }
      if (invRes.success && invRes.data) {
        const lowCount = invRes.data.items.filter((i) => i.isLowStock).length;
        setLowStockCount(lowCount);
      }
    } catch (err) {
      console.error('Failed to load initial data:', err);
    }
  }, [user, setCurrency]);

  // Initial load & initial tab setup (runs once per user authentication, never resets active tab on data refresh)
  useEffect(() => {
    loadInitialAppData();

    if (!hasInitializedTab.current && user) {
      hasInitializedTab.current = true;
      try {
        const saved = localStorage.getItem('nuts_pos_active_tab') as TabType;
        const adminOnlyTabs: TabType[] = [
          'dashboard',
          'products',
          'categories',
          'purchases',
          'accounting',
          'suppliers',
          'reports',
          'users',
          'backup',
          'settings',
        ];
        if (saved) {
          if (!isAdmin && adminOnlyTabs.includes(saved)) {
            setActiveTab('pos');
          } else {
            setActiveTab(saved);
          }
        } else if (!isAdmin) {
          setActiveTab('pos');
        }
      } catch (_) {}
    }
  }, [user, isAdmin, loadInitialAppData]);

  // Continuously sync activeTab with localStorage
  useEffect(() => {
    try {
      localStorage.setItem('nuts_pos_active_tab', activeTab);
    } catch (_) {}
  }, [activeTab]);

  // Global Keyboard Shortcut: Ctrl+K or Cmd+K to open Search in Menus & Settings
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsSearchOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Handle Role Guarding for Tab Navigation
  const handleSelectTab = (tab: TabType) => {
    const adminOnlyTabs: TabType[] = [
      'dashboard',
      'products',
      'categories',
      'purchases',
      'accounting',
      'suppliers',
      'reports',
      'users',
      'backup',
      'settings',
    ];

    const targetTab = !isAdmin && adminOnlyTabs.includes(tab) ? 'pos' : tab;
    setActiveTab(targetTab);
    try {
      localStorage.setItem('nuts_pos_active_tab', targetTab);
    } catch (_) {}
    setIsMobileMenuOpen(false);
  };

  // Handle Navigation from Search Modal with smooth scroll to targeted section
  const handleSearchNavigate = (tab: TabType, sectionId?: string) => {
    handleSelectTab(tab);
    setIsSearchOpen(false);

    if (sectionId) {
      setTimeout(() => {
        const el = document.getElementById(sectionId);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
          el.classList.add('ring-2', 'ring-amber-500', 'shadow-2xl', 'shadow-amber-500/20');
          setTimeout(() => {
            el.classList.remove('ring-2', 'ring-amber-500', 'shadow-2xl', 'shadow-amber-500/20');
          }, 3000);
        }
      }, 250);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex flex-col items-center justify-center text-white space-y-4">
        <div className="w-12 h-12 border-4 border-amber-500 border-t-transparent rounded-full animate-spin" />
        <div className="text-sm font-bold tracking-tight text-slate-300">در حال بارگذاری سامانه فروشگاهی...</div>
      </div>
    );
  }

  if (!user) {
    return <LoginView />;
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#0a0a0a] text-slate-100 font-sans selection:bg-amber-500 selection:text-slate-950" dir="rtl">
      {/* Top Navigation & Live Time Header */}
      <Header
        settings={settings}
        lowStockCount={lowStockCount}
        onNavigateToInventory={() => handleSelectTab('inventory')}
        onToggleMobileMenu={() => setIsMobileMenuOpen((prev) => !prev)}
        onQuickScan={() => handleSelectTab('pos')}
        onOpenSearch={() => setIsSearchOpen(true)}
      />

      {/* Main Workspace Layout (Sidebar + Active View) */}
      <div className="flex-1 flex overflow-hidden">
        <Sidebar
          activeTab={activeTab}
          onSelectTab={handleSelectTab}
          lowStockCount={lowStockCount}
          isMobileOpen={isMobileMenuOpen}
          onCloseMobile={() => setIsMobileMenuOpen(false)}
          onOpenSearch={() => setIsSearchOpen(true)}
        />

        <main key={currency} className="flex-1 overflow-y-auto min-w-0 pb-16 lg:pb-0 bg-[#0a0a0a]">
          {activeTab === 'dashboard' && isAdmin && (
            <DashboardView onNavigate={(tab) => handleSelectTab(tab)} />
          )}
          {activeTab === 'pos' && (
            <PosView settings={settings} onRefreshData={loadInitialAppData} />
          )}
          {activeTab === 'sales' && (
            <SalesHistoryView settings={settings} onRefreshData={loadInitialAppData} />
          )}
          {activeTab === 'products' && isAdmin && (
            <ProductsView settings={settings} onRefreshData={loadInitialAppData} />
          )}
          {activeTab === 'categories' && isAdmin && <CategoriesView />}
          {activeTab === 'inventory' && (
            <InventoryView onRefreshData={loadInitialAppData} />
          )}
          {activeTab === 'purchases' && isAdmin && (
            <PurchasesView onRefreshData={loadInitialAppData} />
          )}
          {activeTab === 'accounting' && isAdmin && (
            <AccountingView currentUser={user} />
          )}
          {activeTab === 'customers' && <CustomersView />}
          {activeTab === 'suppliers' && isAdmin && <SuppliersView />}
          {activeTab === 'reports' && isAdmin && <ReportsView />}
          {activeTab === 'barcode' && <BarcodeManager settings={settings} />}
          {activeTab === 'users' && isAdmin && <UsersView />}
          {activeTab === 'backup' && isAdmin && <BackupView />}
          {activeTab === 'settings' && isAdmin && (
            <SettingsView settings={settings} onRefreshSettings={loadInitialAppData} />
          )}
        </main>
      </div>

      {/* Mobile Bottom Navigation Bar */}
      <BottomNav
        activeTab={activeTab}
        onSelectTab={handleSelectTab}
        onOpenMenu={() => setIsMobileMenuOpen(true)}
        lowStockCount={lowStockCount}
      />

      {/* Menu & Settings Search Modal (Ctrl + K) */}
      <NavigationSearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        onNavigate={handleSearchNavigate}
      />
    </div>
  );
};

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <CurrencyProvider>
          <MainLayout />
        </CurrencyProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
