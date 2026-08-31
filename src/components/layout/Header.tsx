import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { StoreSettings } from '../../types';
import { formatPersianDate, toPersianDigits } from '../../utils/persian';
import { ThemeSelectorModal } from '../common/ThemeSelectorModal';
import {
  Bell,
  Clock,
  LogOut,
  ShieldCheck,
  UserCheck,
  Store,
  Menu,
  X,
  Camera,
  Palette,
} from 'lucide-react';

interface HeaderProps {
  settings: StoreSettings | null;
  lowStockCount: number;
  onNavigateToInventory?: () => void;
  onToggleMobileMenu?: () => void;
  isMobileMenuOpen?: boolean;
  onQuickScan?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  settings,
  lowStockCount,
  onNavigateToInventory,
  onToggleMobileMenu,
  isMobileMenuOpen = false,
  onQuickScan,
}) => {
  const { user, logout, isAdmin } = useAuth();
  const [timeStr, setTimeStr] = useState<string>('');
  const [showThemeModal, setShowThemeModal] = useState<boolean>(false);

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const hours = now.getHours();
      const minutes = now.getMinutes();
      const seconds = now.getSeconds();
      const padH = hours < 10 ? `۰${hours}` : toPersianDigits(hours);
      const padM = minutes < 10 ? `۰${minutes}` : toPersianDigits(minutes);
      const padS = seconds < 10 ? `۰${seconds}` : toPersianDigits(seconds);
      setTimeStr(`${padH}:${padM}:${padS}`);
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <>
      <header className="h-16 bg-[#141414] border-b border-white/5 sticky top-0 z-40 px-3 sm:px-6 flex items-center justify-between shadow-md select-none">
        {/* Right side: Mobile Menu Button + Store Name & Solar Date */}
        <div className="flex items-center gap-2.5 sm:gap-4 min-w-0">
          {/* Mobile Hamburger Toggle Button */}
          {onToggleMobileMenu && (
            <button
              id="mobile-menu-toggle-btn"
              onClick={onToggleMobileMenu}
              className="lg:hidden p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white border border-white/5 transition-colors cursor-pointer shrink-0"
              aria-label="منوی سامانه"
            >
              {isMobileMenuOpen ? <X className="w-5 h-5 text-amber-400" /> : <Menu className="w-5 h-5" />}
            </button>
          )}

          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-br from-amber-500 to-amber-700 flex items-center justify-center text-slate-950 font-bold shadow-md shadow-amber-500/20 shrink-0">
            <Store className="w-4 h-4 sm:w-5 sm:h-5 text-slate-950" />
          </div>
          <div className="min-w-0">
            <h1 className="text-sm sm:text-base font-bold text-white tracking-tight truncate">
              {settings?.storeName || 'فروشگاه آجیل و خشکبار زعفران طلایی'}
            </h1>
            <div className="text-[10px] sm:text-xs text-slate-400 flex items-center gap-1.5 sm:gap-2 truncate">
              <span className="truncate">{formatPersianDate(new Date(), false, true)}</span>
              <span className="text-slate-600 hidden xs:inline">•</span>
              <span className="hidden xs:flex items-center gap-1 text-slate-300 font-medium">
                <Clock className="w-3 h-3 text-amber-400" />
                {timeStr}
              </span>
            </div>
          </div>
        </div>

        {/* Left side: Theme Customizer + Camera Scan + Low Stock Alert + User Profile + Logout */}
        <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
          {/* Quick Theme Selector Button */}
          <button
            id="header-theme-selector-btn"
            onClick={() => setShowThemeModal(true)}
            className="flex items-center gap-1.5 p-2 sm:px-3 sm:py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 hover:text-amber-400 transition-colors cursor-pointer text-xs font-semibold"
            title="شخصی‌سازی رنگ و تم نرم‌افزار"
          >
            <Palette className="w-4 h-4 text-amber-400" />
            <span className="hidden md:inline">تغییر تم</span>
          </button>

          {/* Quick Mobile Barcode Scan Button */}
          {onQuickScan && (
            <button
              id="header-quick-camera-btn"
              onClick={onQuickScan}
              className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-400 font-bold text-xs transition-colors cursor-pointer"
              title="اسکن بارکد با دوربین موبایل"
            >
              <Camera className="w-4 h-4" />
              <span className="hidden sm:inline">بارکدخوان</span>
            </button>
          )}

          {/* Low Stock Notification Badge */}
          {lowStockCount > 0 && (
            <button
              id="header-low-stock-alert"
              onClick={onNavigateToInventory}
              className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl bg-rose-500/10 text-rose-400 border border-rose-500/20 hover:bg-rose-500/20 transition-colors text-xs font-semibold animate-pulse cursor-pointer"
              title="مشاهده کالاهای در آستانه اتمام"
            >
              <Bell className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-rose-400" />
              <span className="hidden sm:inline">{toPersianDigits(lowStockCount)} کالا کم‌موجودی</span>
              <span className="sm:hidden font-mono font-bold text-[11px]">{toPersianDigits(lowStockCount)}</span>
            </button>
          )}

          {/* User Role Card */}
          <div className="hidden md:flex items-center gap-2.5 px-3 py-1.5 rounded-xl bg-white/5 border border-white/10">
            <div
              className={`w-7 h-7 rounded-lg flex items-center justify-center ${
                isAdmin
                  ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                  : 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
              }`}
            >
              {isAdmin ? <ShieldCheck className="w-3.5 h-3.5" /> : <UserCheck className="w-3.5 h-3.5" />}
            </div>
            <div className="text-right">
              <div className="text-xs font-bold text-white leading-none">{user?.name}</div>
              <div className="text-[10px] text-slate-400 mt-0.5">
                {isAdmin ? 'مدیر سیستم' : 'صندوق‌دار'}
              </div>
            </div>
          </div>

          {/* Logout Button */}
          <button
            id="header-logout-btn"
            onClick={logout}
            className="p-2 rounded-xl text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 border border-transparent hover:border-rose-500/20 transition-colors cursor-pointer"
            title="خروج از حساب کاربری"
          >
            <LogOut className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
        </div>
      </header>

      {/* Theme Selector Modal */}
      <ThemeSelectorModal
        isOpen={showThemeModal}
        onClose={() => setShowThemeModal(false)}
      />
    </>
  );
};
