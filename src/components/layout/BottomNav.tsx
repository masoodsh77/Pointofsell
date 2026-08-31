import React from 'react';
import { TabType } from './Sidebar';
import { useAuth } from '../../context/AuthContext';
import {
  ShoppingCart,
  Boxes,
  Receipt,
  LayoutDashboard,
  Menu,
} from 'lucide-react';

interface BottomNavProps {
  activeTab: TabType;
  onSelectTab: (tab: TabType) => void;
  onOpenMenu: () => void;
  lowStockCount: number;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  activeTab,
  onSelectTab,
  onOpenMenu,
  lowStockCount,
}) => {
  const { isAdmin } = useAuth();

  return (
    <nav className="lg:hidden fixed bottom-0 inset-x-0 bg-[#141414]/95 backdrop-blur-md border-t border-white/10 z-30 px-2 py-1.5 flex items-center justify-around shadow-2xl select-none">
      {/* 1. POS Register */}
      <button
        id="mobile-bottom-nav-pos"
        onClick={() => onSelectTab('pos')}
        className={`flex flex-col items-center justify-center py-1 px-3 rounded-xl transition-all cursor-pointer ${
          activeTab === 'pos'
            ? 'text-amber-400 font-bold scale-105'
            : 'text-slate-400 hover:text-white'
        }`}
      >
        <div className={`p-1 rounded-lg ${activeTab === 'pos' ? 'bg-amber-500/20' : ''}`}>
          <ShoppingCart className="w-5 h-5" />
        </div>
        <span className="text-[10px] mt-0.5">صندوق POS</span>
      </button>

      {/* 2. Inventory / Products */}
      <button
        id="mobile-bottom-nav-inventory"
        onClick={() => onSelectTab(isAdmin ? 'products' : 'inventory')}
        className={`flex flex-col items-center justify-center py-1 px-3 rounded-xl transition-all cursor-pointer relative ${
          activeTab === 'inventory' || activeTab === 'products'
            ? 'text-amber-400 font-bold scale-105'
            : 'text-slate-400 hover:text-white'
        }`}
      >
        <div className={`p-1 rounded-lg relative ${activeTab === 'inventory' || activeTab === 'products' ? 'bg-amber-500/20' : ''}`}>
          <Boxes className="w-5 h-5" />
          {lowStockCount > 0 && (
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-rose-500 rounded-full animate-ping" />
          )}
        </div>
        <span className="text-[10px] mt-0.5">انبار و کالا</span>
      </button>

      {/* 3. Sales History */}
      <button
        id="mobile-bottom-nav-sales"
        onClick={() => onSelectTab('sales')}
        className={`flex flex-col items-center justify-center py-1 px-3 rounded-xl transition-all cursor-pointer ${
          activeTab === 'sales'
            ? 'text-amber-400 font-bold scale-105'
            : 'text-slate-400 hover:text-white'
        }`}
      >
        <div className={`p-1 rounded-lg ${activeTab === 'sales' ? 'bg-amber-500/20' : ''}`}>
          <Receipt className="w-5 h-5" />
        </div>
        <span className="text-[10px] mt-0.5">فاکتورها</span>
      </button>

      {/* 4. Dashboard (Admin) / Reports */}
      {isAdmin && (
        <button
          id="mobile-bottom-nav-dashboard"
          onClick={() => onSelectTab('dashboard')}
          className={`flex flex-col items-center justify-center py-1 px-3 rounded-xl transition-all cursor-pointer ${
            activeTab === 'dashboard'
              ? 'text-amber-400 font-bold scale-105'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <div className={`p-1 rounded-lg ${activeTab === 'dashboard' ? 'bg-amber-500/20' : ''}`}>
            <LayoutDashboard className="w-5 h-5" />
          </div>
          <span className="text-[10px] mt-0.5">داشبورد</span>
        </button>
      )}

      {/* 5. More Menu Drawer */}
      <button
        id="mobile-bottom-nav-more"
        onClick={onOpenMenu}
        className="flex flex-col items-center justify-center py-1 px-3 rounded-xl text-slate-400 hover:text-white transition-all cursor-pointer"
      >
        <div className="p-1 rounded-lg">
          <Menu className="w-5 h-5" />
        </div>
        <span className="text-[10px] mt-0.5">سایر بخش‌ها</span>
      </button>
    </nav>
  );
};
