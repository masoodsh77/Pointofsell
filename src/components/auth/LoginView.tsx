import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Lock, User, Store, ShieldCheck, UserCheck, AlertCircle, ArrowLeft } from 'lucide-react';

export const LoginView: React.FC = () => {
  const { login, isLoading } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!username.trim() || !password) {
      setError('لطفاً نام کاربری و رمز عبور را وارد نمایید.');
      return;
    }

    const res = await login(username, password);
    if (!res.success) {
      setError(res.message || 'نام کاربری یا رمز عبور اشتباه است.');
    }
  };

  const handleQuickLogin = async (u: string, p: string) => {
    setUsername(u);
    setPassword(p);
    setError(null);
    await login(u, p);
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center p-4 selection:bg-amber-500 selection:text-slate-950">
      <div className="w-full max-w-md bg-[#141414] rounded-3xl shadow-2xl border border-white/10 overflow-hidden">
        {/* Header Visual */}
        <div className="bg-gradient-to-br from-amber-500 via-amber-600 to-amber-700 p-8 text-center text-slate-950 relative">
          <div className="w-16 h-16 bg-black/20 backdrop-blur-md rounded-2xl mx-auto flex items-center justify-center mb-3 shadow-inner border border-white/20">
            <Store className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-xl font-black tracking-tight text-slate-950">نرم‌افزار مدیریت فروشگاه آجیل و خشکبار</h2>
          <p className="text-slate-900 font-semibold text-xs mt-1">سامانه جامع فروشگاهی زعفران طلایی</p>
        </div>

        {/* Login Form */}
        <div className="p-8 space-y-6">
          {error && (
            <div className="p-3.5 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-xl text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5">نام کاربری</label>
              <div className="relative">
                <input
                  id="login-username-input"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="مثال: admin یا seller"
                  className="w-full pl-3 pr-10 py-2.5 bg-white/5 border border-white/10 rounded-xl text-sm text-white placeholder:text-slate-500 focus:outline-hidden focus:ring-2 focus:ring-amber-500 focus:bg-white/10 transition-all text-left"
                  dir="ltr"
                />
                <User className="w-4 h-4 text-slate-500 absolute right-3.5 top-3" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5">رمز عبور</label>
              <div className="relative">
                <input
                  id="login-password-input"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-3 pr-10 py-2.5 bg-white/5 border border-white/10 rounded-xl text-sm text-white placeholder:text-slate-500 focus:outline-hidden focus:ring-2 focus:ring-amber-500 focus:bg-white/10 transition-all text-left"
                  dir="ltr"
                />
                <Lock className="w-4 h-4 text-slate-500 absolute right-3.5 top-3" />
              </div>
            </div>

            <button
              id="login-submit-btn"
              type="submit"
              disabled={isLoading}
              className="w-full py-3 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold rounded-xl shadow-lg shadow-amber-500/25 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {isLoading ? (
                <span>در حال ورود...</span>
              ) : (
                <>
                  <span>ورود به سامانه</span>
                  <ArrowLeft className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Quick Login for Instant Demo / Testing */}
          <div className="pt-4 border-t border-white/5">
            <div className="text-[11px] font-bold text-slate-400 text-center mb-3">
              حساب‌های آزمایشی برای ورود سریع:
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                id="quick-login-admin"
                onClick={() => handleQuickLogin('admin', 'Admin@123')}
                className="p-2.5 rounded-xl border border-amber-500/20 bg-amber-500/10 hover:bg-amber-500/20 transition-colors text-right cursor-pointer"
              >
                <div className="flex items-center gap-1.5 text-xs font-bold text-amber-400">
                  <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
                  <span>مدیر سیستم (ADMIN)</span>
                </div>
                <div className="text-[10px] text-amber-500/80 mt-0.5">رمز: Admin@123</div>
              </button>

              <button
                type="button"
                id="quick-login-seller"
                onClick={() => handleQuickLogin('seller', 'Seller@123')}
                className="p-2.5 rounded-xl border border-blue-500/20 bg-blue-500/10 hover:bg-blue-500/20 transition-colors text-right cursor-pointer"
              >
                <div className="flex items-center gap-1.5 text-xs font-bold text-blue-400">
                  <UserCheck className="w-3.5 h-3.5 text-blue-400" />
                  <span>صندوق‌دار (SELLER)</span>
                </div>
                <div className="text-[10px] text-blue-400/80 mt-0.5">رمز: Seller@123</div>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
