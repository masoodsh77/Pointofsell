import React, { useState, useEffect } from 'react';
import { User, Role } from '../../types';
import { apiRequest } from '../../services/api';
import { formatPersianDate, toPersianDigits } from '../../utils/persian';
import { UserCog, Plus, ShieldCheck, UserCheck, CheckCircle, AlertCircle, X, KeyRound, Power } from 'lucide-react';

export const UsersView: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [showModal, setShowModal] = useState<boolean>(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);

  const [username, setUsername] = useState<string>('');
  const [name, setName] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [role, setRole] = useState<Role>('SELLER');
  const [isActive, setIsActive] = useState<boolean>(true);

  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const loadUsers = async () => {
    const res = await apiRequest<User[]>('/users');
    if (res.success && res.data) setUsers(res.data);
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const openAddModal = () => {
    setEditingUser(null);
    setUsername('');
    setName('');
    setPassword('');
    setRole('SELLER');
    setIsActive(true);
    setShowModal(true);
  };

  const openEditModal = (u: User) => {
    setEditingUser(u);
    setUsername(u.username);
    setName(u.name);
    setPassword('');
    setRole(u.role);
    setIsActive(u.isActive);
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (editingUser) {
      const payload: any = { name, role, isActive };
      if (password.trim()) payload.password = password;

      const res = await apiRequest(`/users/${editingUser.id}`, {
        method: 'PUT',
        body: JSON.stringify(payload),
      });

      if (res.success) {
        setSuccessMsg('اطلاعات کاربر با موفقیت به روزرسانی شد.');
        setShowModal(false);
        loadUsers();
      } else {
        setErrorMsg(res.message || 'خطا در ویرایش کاربر');
      }
    } else {
      if (!username.trim() || !password.trim()) {
        setErrorMsg('نام کاربری و کلمه عبور الزامی است.');
        return;
      }

      const res = await apiRequest('/users', {
        method: 'POST',
        body: JSON.stringify({ username, name, password, role, isActive }),
      });

      if (res.success) {
        setSuccessMsg('کاربر جدید با موفقیت ایجاد شد.');
        setShowModal(false);
        loadUsers();
      } else {
        setErrorMsg(res.message || 'خطا در ساخت کاربر');
      }
    }
  };

  const toggleUserActive = async (u: User) => {
    if (u.username === 'admin') {
      alert('کاربر اصلی مدیر سیستم قابل غیرفعال‌سازی نیست.');
      return;
    }

    const res = await apiRequest(`/users/${u.id}`, {
      method: 'PUT',
      body: JSON.stringify({ isActive: !u.isActive }),
    });

    if (res.success) {
      loadUsers();
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#141414] p-6 rounded-3xl border border-white/5 shadow-xl">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center">
            <UserCog className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-black text-white">مدیریت کاربران و دسترسی‌های پرسنل</h2>
            <p className="text-xs text-slate-400 mt-0.5">
              تعریف صندوق‌داران، تغییر رمز عبور و تفکیک سطح دسترسی (مدیر / صندوق‌دار)
            </p>
          </div>
        </div>

        <button
          onClick={openAddModal}
          className="flex items-center justify-center gap-2 px-5 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold rounded-2xl text-xs transition-all shadow-md shadow-amber-500/20 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>افزودن کاربر جدید</span>
        </button>
      </div>

      {successMsg && (
        <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 rounded-2xl text-xs flex items-center gap-2">
          <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}
      {errorMsg && (
        <div className="p-4 bg-rose-500/10 border border-rose-500/20 text-rose-300 rounded-2xl text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Users Table */}
      <div className="bg-[#141414] rounded-3xl border border-white/5 shadow-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead className="bg-white/5 border-b border-white/5 text-slate-400 font-bold">
              <tr>
                <th className="py-3.5 px-4">نام کاربر</th>
                <th className="py-3.5 px-3">نام کاربری</th>
                <th className="py-3.5 px-3">نقش و سطح دسترسی</th>
                <th className="py-3.5 px-3">وضعیت حساب</th>
                <th className="py-3.5 px-3">تاریخ ایجاد</th>
                <th className="py-3.5 px-4 text-center">عملیات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-slate-200">
              {users.map((u) => (
                <tr key={u.id} className="hover:bg-white/5 transition-colors">
                  <td className="py-3 px-4 font-bold text-white">{u.name}</td>
                  <td className="py-3 px-3 font-mono text-slate-300">{u.username}</td>
                  <td className="py-3 px-3">
                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full font-bold text-[11px] ${
                        u.role === 'ADMIN'
                          ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                          : 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                      }`}
                    >
                      {u.role === 'ADMIN' ? (
                        <>
                          <ShieldCheck className="w-3.5 h-3.5" />
                          <span>مدیر کل (ADMIN)</span>
                        </>
                      ) : (
                        <>
                          <UserCheck className="w-3.5 h-3.5" />
                          <span>صندوق‌دار (SELLER)</span>
                        </>
                      )}
                    </span>
                  </td>
                  <td className="py-3 px-3">
                    <span
                      className={`px-2.5 py-0.5 rounded-full font-semibold text-[10px] ${
                        u.isActive
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                          : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                      }`}
                    >
                      {u.isActive ? 'فعال' : 'غیرفعال'}
                    </span>
                  </td>
                  <td className="py-3 px-3 text-slate-400 font-mono text-[11px]">
                    {formatPersianDate(u.createdAt, false)}
                  </td>
                  <td className="py-3 px-4 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <button
                        onClick={() => openEditModal(u)}
                        className="px-2.5 py-1 bg-white/5 hover:bg-white/10 text-slate-300 rounded-lg text-xs font-semibold border border-white/5 transition-colors cursor-pointer"
                      >
                        ویرایش / تغییر رمز
                      </button>
                      {u.username !== 'admin' && (
                        <button
                          onClick={() => toggleUserActive(u)}
                          className={`p-1.5 rounded-lg text-xs transition-colors cursor-pointer ${
                            u.isActive
                              ? 'text-rose-400 hover:bg-rose-500/10'
                              : 'text-emerald-400 hover:bg-emerald-500/10'
                          }`}
                          title={u.isActive ? 'غیرفعال‌سازی' : 'فعال‌سازی'}
                        >
                          <Power className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[#141414] rounded-3xl p-6 shadow-2xl border border-white/10 w-full max-w-md space-y-4 text-right">
            <div className="flex items-center justify-between border-b border-white/5 pb-3">
              <h3 className="text-sm font-bold text-white">
                {editingUser ? `ویرایش کاربر: ${editingUser.username}` : 'افزودن کاربر جدید'}
              </h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-white cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">نام کامل کاربر *</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="مثال: رضا صادقی"
                  className="w-full p-2.5 bg-white/5 border border-white/10 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-hidden focus:ring-1 focus:ring-amber-500"
                />
              </div>

              {!editingUser && (
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">نام کاربری (لاتین) *</label>
                  <input
                    type="text"
                    required
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="مثال: seller2"
                    className="w-full p-2.5 bg-white/5 border border-white/10 rounded-xl text-xs text-white placeholder-slate-500 text-left font-mono focus:outline-hidden focus:ring-1 focus:ring-amber-500"
                    dir="ltr"
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  {editingUser ? 'تغییر رمز عبور (در صورت نیاز)' : 'رمز عبور *'}
                </label>
                <input
                  type="password"
                  required={!editingUser}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={editingUser ? 'برای عدم تغییر خالی بگذارید' : '••••••••'}
                  className="w-full p-2.5 bg-white/5 border border-white/10 rounded-xl text-xs text-white placeholder-slate-500 text-left focus:outline-hidden focus:ring-1 focus:ring-amber-500"
                  dir="ltr"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">نقش کاربری</label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value as Role)}
                  className="w-full p-2.5 bg-white/5 border border-white/10 rounded-xl text-xs text-white focus:outline-hidden focus:ring-1 focus:ring-amber-500"
                >
                  <option value="SELLER" className="bg-[#1e1e1e] text-white">صندوق‌دار (فقط ثبت فروش و صدور فاکتور)</option>
                  <option value="ADMIN" className="bg-[#1e1e1e] text-white">مدیر سیستم (دسترسی کامل به سود، انبار و گزارشات)</option>
                </select>
              </div>

              <div className="pt-2">
                <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isActive}
                    onChange={(e) => setIsActive(e.target.checked)}
                    className="w-4 h-4 rounded text-amber-500 focus:ring-amber-500 accent-amber-500"
                  />
                  <span>حساب کاربری فعال باشد</span>
                </label>
              </div>

              <div className="flex gap-2 pt-3 border-t border-white/5">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 py-2.5 bg-white/5 hover:bg-white/10 text-slate-300 rounded-xl text-xs font-bold border border-white/5 cursor-pointer"
                >
                  انصراف
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 rounded-xl text-xs font-bold shadow-md shadow-amber-500/20 cursor-pointer"
                >
                  ذخیره اطلاعات
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
