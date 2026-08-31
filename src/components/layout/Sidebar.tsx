import React from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  LayoutDashboard,
  ShoppingCart,
  Receipt,
  Package,
  Layers,
  Boxes,
  Truck,
  Users,
  Building2,
  BarChart3,
  Barcode,
  UserCog,
  DatabaseBackup,
  Settings,
  Sparkles,
  Calculator
} from 'lucide-react';

export type TabType =
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

interface SidebarProps {
  activeTab: TabType;
  onSelectTab: (tab: TabType) => void;
  lowStockCount: number;
  isMobileOpen?: boolean;
  onCloseMobile?: () => void;
}

interface NavItem {
  id: TabType;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  adminOnly?: boolean;
  badge?: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onSelectTab,
  lowStockCount,
  isMobileOpen = false,
  onCloseMobile,
}) => {
  const { isAdmin } = useAuth();

  const handleNavClick = (tab: TabType) => {
    onSelectTab(tab);
    if (onCloseMobile) {
      onCloseMobile();
    }
  };

  const mainNavItems: NavItem[] = [
    { id: 'dashboard', label: 'داشبورد مدیریتی', icon: LayoutDashboard, adminOnly: true },
    { id: 'pos', label: 'صندوق فروش (POS)', icon: ShoppingCart },
    { id: 'sales', label: 'فاکتورها و سوابق فروش', icon: Receipt },
    { id: 'products', label: 'مدیریت کالاها و قیمت', icon: Package, adminOnly: true },
    { id: 'categories', label: 'دسته‌بندی‌ها', icon: Layers, adminOnly: true },
    { id: 'inventory', label: 'انبار و موجودی کالا', icon: Boxes, badge: lowStockCount > 0 ? lowStockCount : undefined },
    { id: 'purchases', label: 'فاکتورهای خرید (ورود کالا)', icon: Truck, adminOnly: true },
    { id: 'accounting', label: 'حسابداری و سررسید چک', icon: Calculator, adminOnly: true },
    { id: 'customers', label: 'مشتریان و حساب دفتری', icon: Users },
    { id: 'suppliers', label: 'تامین‌کنندگان و باغداران', icon: Building2, adminOnly: true },
    { id: 'reports', label: 'گزارش سود و زیان جامع', icon: BarChart3, adminOnly: true },
    { id: 'barcode', label: 'چاپ و تولید بارکد', icon: Barcode },
  ];

  const adminNavItems: NavItem[] = [
    { id: 'users', label: 'مدیریت کاربران و دسترسی', icon: UserCog, adminOnly: true },
    { id: 'backup', label: 'پشتیبان‌گیری و بازیابی', icon: DatabaseBackup, adminOnly: true },
    { id: 'settings', label: 'تنظیمات فروشگاه و پوز', icon: Settings, adminOnly: true },
  ];

  const sidebarContent = (
    <div className="flex flex-col justify-between h-full">
      <div className="py-4 px-3 space-y-6 overflow-y-auto">
        {/* Navigation Group 1: Store Operations */}
        <div>
          <div className="px-3 mb-2 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
            عملیات فروشگاه و حسابداری
          </div>
          <nav className="space-y-1">
            {mainNavItems
              .filter((item) => !item.adminOnly || isAdmin)
              .map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    id={`sidebar-nav-${item.id}`}
                    onClick={() => handleNavClick(item.id)}
                    className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                      isActive
                        ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 font-bold shadow-md shadow-amber-500/20'
                        : 'hover:bg-white/5 hover:text-white text-slate-400'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Icon className={`w-4 h-4 ${isActive ? 'text-slate-950' : 'text-slate-400'}`} />
                      <span>{item.label}</span>
                    </div>
                    {item.badge && item.badge > 0 && (
                      <span
                        className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${
                          isActive
                            ? 'bg-slate-950 text-amber-400'
                            : 'bg-rose-500 text-white'
                        }`}
                      >
                        {item.badge}
                      </span>
                    )}
                  </button>
                );
              })}
          </nav>
        </div>

        {/* Navigation Group 2: System Management (Admin Only) */}
        {isAdmin && (
          <div>
            <div className="px-3 mb-2 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              مدیریت و امنیت سامانه
            </div>
            <nav className="space-y-1">
              {adminNavItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    id={`sidebar-nav-${item.id}`}
                    onClick={() => handleNavClick(item.id)}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-all cursor-pointer ${
                      isActive
                        ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 font-bold shadow-md shadow-amber-500/20'
                        : 'hover:bg-white/5 hover:text-white text-slate-400'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Icon className={`w-4 h-4 ${isActive ? 'text-slate-950' : 'text-slate-400'}`} />
                      <span>{item.label}</span>
                    </div>
                  </button>
                );
              })}
            </nav>
          </div>
        )}
      </div>

      {/* System Status Footer */}
      <div className="p-3 border-t border-white/5 bg-[#0a0a0a]">
        <div className="p-3 rounded-2xl bg-white/5 border border-white/5 text-[11px] text-slate-400 space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="font-medium">پایگاه داده آفلاین</span>
            <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          </div>
          <div className="text-[10px] text-slate-500">نسخه ۳.۲ - سیستم پوز اختصاصی آجیل و خشکبار</div>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Persistent Sidebar */}
      <aside className="hidden lg:block w-64 bg-[#111111] border-l border-white/5 shrink-0 select-none">
        {sidebarContent}
      </aside>

      {/* Mobile Drawer Sidebar */}
      {isMobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div
            className="fixed inset-0 bg-black/80 backdrop-blur-xs transition-opacity"
            onClick={onCloseMobile}
          />
          <div className="relative w-72 max-w-[80vw] bg-[#111111] border-l border-white/10 shadow-2xl flex flex-col z-10">
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  );
};
