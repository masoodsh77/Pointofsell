import React, { useState, useEffect, useMemo } from 'react';
import { User, RoleDefinition, Permission } from '../../types';
import { apiRequest } from '../../services/api';
import { formatPersianDate, toPersianDigits } from '../../utils/persian';
import {
  PERMISSION_GROUPS,
  ALL_PERMISSIONS,
  getRoleBadgeColor,
} from '../../utils/permissions';
import { useAuth } from '../../context/AuthContext';
import {
  UserCog,
  Plus,
  ShieldCheck,
  UserCheck,
  CheckCircle,
  AlertCircle,
  X,
  KeyRound,
  Power,
  Shield,
  Sliders,
  Trash2,
  Edit3,
  Users,
  Lock,
  Check,
  CheckSquare,
  Square,
  Sparkles,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

const COLOR_OPTIONS: { id: string; name: string; hex: string; bg: string }[] = [
  { id: 'amber', name: 'کهربایی / طلایی', hex: '#f59e0b', bg: 'bg-amber-500' },
  { id: 'blue', name: 'آبی اقیانوسی', hex: '#3b82f6', bg: 'bg-blue-500' },
  { id: 'purple', name: 'بنفش سلطنتی', hex: '#a855f7', bg: 'bg-purple-500' },
  { id: 'emerald', name: 'سبز زمردی', hex: '#10b981', bg: 'bg-emerald-500' },
  { id: 'rose', name: 'یاقوتی / سرخ', hex: '#f43f5e', bg: 'bg-rose-500' },
  { id: 'cyan', name: 'فیروزه‌ای', hex: '#06b6d4', bg: 'bg-cyan-500' },
];

export const UsersView: React.FC = () => {
  const { user: currentLoggedUser, isAdmin, refreshUserProfile } = useAuth();
  const [activeTab, setActiveTab] = useState<'USERS' | 'ROLES'>('USERS');

  // Data states
  const [users, setUsers] = useState<User[]>([]);
  const [roles, setRoles] = useState<RoleDefinition[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // User modal states
  const [showUserModal, setShowUserModal] = useState<boolean>(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [userName, setUserName] = useState<string>('');
  const [username, setUsername] = useState<string>('');
  const [userPassword, setUserPassword] = useState<string>('');
  const [userRole, setUserRole] = useState<string>('SELLER');
  const [userIsActive, setUserIsActive] = useState<boolean>(true);
  const [customPermissionsEnabled, setCustomPermissionsEnabled] = useState<boolean>(false);
  const [userCustomPermissions, setUserCustomPermissions] = useState<Permission[]>([]);

  // Role modal states
  const [showRoleModal, setShowRoleModal] = useState<boolean>(false);
  const [editingRole, setEditingRole] = useState<RoleDefinition | null>(null);
  const [roleName, setRoleName] = useState<string>('');
  const [roleDescription, setRoleDescription] = useState<string>('');
  const [roleColor, setRoleColor] = useState<string>('amber');
  const [rolePermissions, setRolePermissions] = useState<Permission[]>([]);

  // Feedback notifications
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const clearMessages = () => {
    setSuccessMsg(null);
    setErrorMsg(null);
  };

  const showTempSuccess = (msg: string) => {
    setSuccessMsg(msg);
    setErrorMsg(null);
    setTimeout(() => setSuccessMsg(null), 5000);
  };

  const showTempError = (msg: string) => {
    setErrorMsg(msg);
    setSuccessMsg(null);
    setTimeout(() => setErrorMsg(null), 6000);
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const [usersRes, rolesRes] = await Promise.all([
        apiRequest<User[]>('/users'),
        apiRequest<RoleDefinition[]>('/roles'),
      ]);

      if (usersRes.success && usersRes.data) {
        setUsers(usersRes.data);
      }
      if (rolesRes.success && rolesRes.data) {
        setRoles(rolesRes.data);
      }
    } catch (err) {
      console.error('Error loading users/roles:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // ---------------- USER MODAL HANDLERS ----------------
  const openAddUserModal = () => {
    clearMessages();
    setEditingUser(null);
    setUserName('');
    setUsername('');
    setUserPassword('');
    setUserRole('SELLER');
    setUserIsActive(true);
    setCustomPermissionsEnabled(false);
    setUserCustomPermissions([]);
    setShowUserModal(true);
  };

  const openEditUserModal = (u: User) => {
    clearMessages();
    setEditingUser(u);
    setUserName(u.name);
    setUsername(u.username);
    setUserPassword('');
    setUserRole(u.role);
    setUserIsActive(u.isActive);

    if (u.customPermissions && u.customPermissions.length > 0) {
      setCustomPermissionsEnabled(true);
      setUserCustomPermissions([...u.customPermissions]);
    } else {
      setCustomPermissionsEnabled(false);
      setUserCustomPermissions([]);
    }
    setShowUserModal(true);
  };

  const handleUserSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearMessages();

    const payload: any = {
      name: userName.trim(),
      role: userRole,
      isActive: userIsActive,
      customPermissions: customPermissionsEnabled ? userCustomPermissions : undefined,
    };

    if (editingUser) {
      if (userPassword.trim()) {
        payload.password = userPassword.trim();
      }
      const res = await apiRequest(`/users/${editingUser.id}`, {
        method: 'PUT',
        body: JSON.stringify(payload),
      });

      if (res.success) {
        showTempSuccess('اطلاعات کاربر با موفقیت به‌روزرسانی شد.');
        setShowUserModal(false);
        await loadData();
        if (editingUser.id === currentLoggedUser?.id) {
          refreshUserProfile();
        }
      } else {
        showTempError(res.message || 'خطا در ویرایش کاربر');
      }
    } else {
      if (!username.trim() || !userPassword.trim() || !userName.trim()) {
        showTempError('نام، نام کاربری و رمز عبور الزامی است.');
        return;
      }

      payload.username = username.trim();
      payload.password = userPassword.trim();

      const res = await apiRequest('/users', {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      if (res.success) {
        showTempSuccess('کاربر جدید با موفقیت ایجاد شد.');
        setShowUserModal(false);
        await loadData();
      } else {
        showTempError(res.message || 'خطا در ایجاد کاربر');
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
      showTempSuccess(`وضعیت حساب ${u.name} تغییر یافت.`);
      loadData();
    } else {
      showTempError(res.message || 'خطا در تغییر وضعیت حساب');
    }
  };

  // ---------------- ROLE MODAL HANDLERS ----------------
  const openAddRoleModal = () => {
    clearMessages();
    setEditingRole(null);
    setRoleName('');
    setRoleDescription('');
    setRoleColor('amber');
    setRolePermissions([
      'POS_ACCESS',
      'SALES_VIEW',
      'PRODUCT_VIEW',
      'INVENTORY_VIEW',
      'CUSTOMERS_MANAGE',
    ]);
    setShowRoleModal(true);
  };

  const openEditRoleModal = (r: RoleDefinition) => {
    clearMessages();
    setEditingRole(r);
    setRoleName(r.name);
    setRoleDescription(r.description || '');
    setRoleColor(r.color || 'amber');
    setRolePermissions([...r.permissions]);
    setShowRoleModal(true);
  };

  const handleRoleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearMessages();

    if (!roleName.trim()) {
      showTempError('نام نقش الزامی است.');
      return;
    }

    const payload = {
      name: roleName.trim(),
      description: roleDescription.trim(),
      color: roleColor,
      permissions: rolePermissions,
    };

    if (editingRole) {
      const res = await apiRequest(`/roles/${editingRole.id}`, {
        method: 'PUT',
        body: JSON.stringify(payload),
      });

      if (res.success) {
        showTempSuccess('نقش با موفقیت به‌روزرسانی شد.');
        setShowRoleModal(false);
        await loadData();
        refreshUserProfile();
      } else {
        showTempError(res.message || 'خطا در ویرایش نقش');
      }
    } else {
      const res = await apiRequest('/roles', {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      if (res.success) {
        showTempSuccess('نقش جدید با موفقیت ایجاد شد.');
        setShowRoleModal(false);
        await loadData();
      } else {
        showTempError(res.message || 'خطا در تعریف نقش');
      }
    }
  };

  const handleDeleteRole = async (r: RoleDefinition) => {
    if (r.isSystem || r.id === 'ADMIN' || r.id === 'SELLER') {
      alert('نقش‌های اصلی سیستم قابل حذف نیستند.');
      return;
    }

    if (r.userCount && r.userCount > 0) {
      alert(`این نقش به ${r.userCount} کاربر اختصاص دارد. ابتدا نقش آن‌ها را تغییر دهید.`);
      return;
    }

    if (!confirm(`آیا از حذف کامل نقش «${r.name}» اطمینان دارید؟`)) {
      return;
    }

    const res = await apiRequest(`/roles/${r.id}`, {
      method: 'DELETE',
    });

    if (res.success) {
      showTempSuccess(`نقش «${r.name}» با موفقیت حذف شد.`);
      loadData();
    } else {
      showTempError(res.message || 'خطا در حذف نقش');
    }
  };

  // Quick Permission Selection Presets
  const applyRolePreset = (preset: 'ALL' | 'CLEAR' | 'SELLER' | 'ACCOUNTANT' | 'STOCK') => {
    if (preset === 'ALL') {
      setRolePermissions([...ALL_PERMISSIONS]);
    } else if (preset === 'CLEAR') {
      setRolePermissions([]);
    } else if (preset === 'SELLER') {
      setRolePermissions([
        'POS_ACCESS',
        'SALES_VIEW',
        'SALES_DISCOUNT',
        'PRODUCT_VIEW',
        'INVENTORY_VIEW',
        'CUSTOMERS_MANAGE',
        'BARCODE_PRINT',
      ]);
    } else if (preset === 'ACCOUNTANT') {
      setRolePermissions([
        'DASHBOARD_VIEW',
        'SALES_VIEW',
        'PURCHASE_PRICE_VIEW',
        'ACCOUNTING_MANAGE',
        'CUSTOMERS_MANAGE',
        'SUPPLIERS_MANAGE',
        'REPORTS_VIEW',
        'PROFIT_VIEW',
      ]);
    } else if (preset === 'STOCK') {
      setRolePermissions([
        'PRODUCT_VIEW',
        'PRODUCT_CREATE',
        'PRODUCT_EDIT',
        'INVENTORY_VIEW',
        'INVENTORY_ADJUST',
        'PURCHASES_MANAGE',
        'SUPPLIERS_MANAGE',
        'CATEGORIES_MANAGE',
        'BARCODE_PRINT',
      ]);
    }
  };

  const togglePermission = (perm: Permission) => {
    if (rolePermissions.includes(perm)) {
      setRolePermissions(rolePermissions.filter((p) => p !== perm));
    } else {
      setRolePermissions([...rolePermissions, perm]);
    }
  };

  const toggleGroupPermissions = (groupPerms: Permission[]) => {
    const allInGroupSelected = groupPerms.every((p) => rolePermissions.includes(p));
    if (allInGroupSelected) {
      setRolePermissions(rolePermissions.filter((p) => !groupPerms.includes(p)));
    } else {
      const merged = Array.from(new Set([...rolePermissions, ...groupPerms]));
      setRolePermissions(merged);
    }
  };

  // Compute selected role for user modal preview
  const selectedRoleDef = useMemo(() => {
    return roles.find((r) => r.id === userRole) || roles[0];
  }, [roles, userRole]);

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Top Banner Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#141414] p-6 rounded-3xl border border-white/5 shadow-xl">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center shadow-lg shadow-amber-500/5">
            <UserCog className="w-7 h-7" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-black text-white">مدیریت کاربران و تعریف نقش‌ها</h2>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black bg-amber-500/15 text-amber-400 border border-amber-500/30">
                <ShieldCheck className="w-3 h-3" />
                <span>دسترسی کامل ادمین</span>
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              تعریف نقش‌های سازمانی با ۲۱ ریزدسترسی تفکیک‌شده، صدور دسترسی اختصاصی، انتساب پرسنل و کنترل امنیت
            </p>
          </div>
        </div>

        {/* Action Button depending on active tab */}
        <div className="flex items-center gap-2">
          {activeTab === 'USERS' ? (
            <button
              onClick={openAddUserModal}
              className="flex items-center justify-center gap-2 px-5 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold rounded-2xl text-xs transition-all shadow-md shadow-amber-500/20 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>افزودن کاربر جدید</span>
            </button>
          ) : (
            <button
              onClick={openAddRoleModal}
              className="flex items-center justify-center gap-2 px-5 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold rounded-2xl text-xs transition-all shadow-md shadow-amber-500/20 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>تعریف نقش جدید</span>
            </button>
          )}
        </div>
      </div>

      {/* Tabs Switcher */}
      <div className="flex items-center gap-2 p-1.5 bg-[#141414] rounded-2xl border border-white/5 w-fit">
        <button
          onClick={() => setActiveTab('USERS')}
          className={`flex items-center gap-2 px-5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'USERS'
              ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 shadow-md shadow-amber-500/20'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>کاربران و پرسنل ({toPersianDigits(users.length)})</span>
        </button>

        <button
          onClick={() => setActiveTab('ROLES')}
          className={`flex items-center gap-2 px-5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'ROLES'
              ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 shadow-md shadow-amber-500/20'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Shield className="w-4 h-4" />
          <span>نقش‌ها و ریز دسترسی‌ها ({toPersianDigits(roles.length)})</span>
        </button>
      </div>

      {/* Success / Error Messages */}
      {successMsg && (
        <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 rounded-2xl text-xs flex items-center justify-between gap-2 shadow-lg animate-fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{successMsg}</span>
          </div>
          <button onClick={() => setSuccessMsg(null)} className="text-emerald-400 hover:text-white cursor-pointer">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
      {errorMsg && (
        <div className="p-4 bg-rose-500/10 border border-rose-500/20 text-rose-300 rounded-2xl text-xs flex items-center justify-between gap-2 shadow-lg animate-fade-in">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{errorMsg}</span>
          </div>
          <button onClick={() => setErrorMsg(null)} className="text-rose-400 hover:text-white cursor-pointer">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* ===================== TAB 1: USERS LIST ===================== */}
      {activeTab === 'USERS' && (
        <div className="bg-[#141414] rounded-3xl border border-white/5 shadow-xl overflow-hidden">
          <div className="p-4 border-b border-white/5 flex items-center justify-between text-xs text-slate-400">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-amber-400" />
              <span className="font-bold text-white">فهرست حساب‌های کاربری فعال در سیستم</span>
            </div>
            <span>تعداد کل: {toPersianDigits(users.length)} حساب</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead className="bg-white/5 border-b border-white/5 text-slate-400 font-bold">
                <tr>
                  <th className="py-3.5 px-4">نام و نام خانوادگی</th>
                  <th className="py-3.5 px-3">نام کاربری</th>
                  <th className="py-3.5 px-3">نقش سازمانی</th>
                  <th className="py-3.5 px-3">وضعیت دسترسی‌ها</th>
                  <th className="py-3.5 px-3">وضعیت حساب</th>
                  <th className="py-3.5 px-3">تاریخ ایجاد</th>
                  <th className="py-3.5 px-4 text-center">عملیات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-slate-200">
                {users.map((u) => {
                  const roleDef = roles.find((r) => r.id === u.role);
                  const badgeColor = getRoleBadgeColor(roleDef?.color || (u.role === 'ADMIN' ? 'amber' : 'blue'));
                  const roleTitle = roleDef ? roleDef.name : (u.role === 'ADMIN' ? 'مدیر کل' : 'صندوق‌دار');
                  const permCount = u.role === 'ADMIN' ? ALL_PERMISSIONS.length : (u.permissions?.length || 0);

                  return (
                    <tr key={u.id} className="hover:bg-white/5 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold text-xs ${badgeColor.bg} ${badgeColor.text} border ${badgeColor.border}`}>
                            {u.name.slice(0, 1)}
                          </div>
                          <div>
                            <span className="font-bold text-white block">{u.name}</span>
                            {u.id === currentLoggedUser?.id && (
                              <span className="text-[10px] text-amber-400 font-medium">حساب شما (کاربر جاری)</span>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-3 font-mono text-slate-300" dir="ltr">
                        @{u.username}
                      </td>
                      <td className="py-3.5 px-3">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full font-bold text-[11px] border ${badgeColor.bg} ${badgeColor.text} ${badgeColor.border}`}
                        >
                          <ShieldCheck className="w-3.5 h-3.5" />
                          <span>{roleTitle}</span>
                        </span>
                      </td>
                      <td className="py-3.5 px-3">
                        <div className="flex items-center gap-1.5">
                          <span className="text-[11px] font-mono font-bold text-slate-300">
                            {toPersianDigits(permCount)} / {toPersianDigits(ALL_PERMISSIONS.length)}
                          </span>
                          <span className="text-[10px] text-slate-500">دسترسی مجاز</span>
                          {u.customPermissions && u.customPermissions.length > 0 && (
                            <span className="text-[9px] px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                              سفارشی
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-3.5 px-3">
                        <span
                          className={`px-2.5 py-0.5 rounded-full font-bold text-[10px] ${
                            u.isActive
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                              : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                          }`}
                        >
                          {u.isActive ? 'فعال' : 'غیرفعال'}
                        </span>
                      </td>
                      <td className="py-3.5 px-3 text-slate-400 font-mono text-[11px]">
                        {formatPersianDate(u.createdAt, false)}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => openEditUserModal(u)}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-white/5 hover:bg-white/10 text-slate-200 rounded-xl text-xs font-bold border border-white/5 transition-colors cursor-pointer"
                          >
                            <Edit3 className="w-3.5 h-3.5 text-amber-400" />
                            <span>ویرایش و دسترسی</span>
                          </button>
                          {u.username !== 'admin' && (
                            <button
                              onClick={() => toggleUserActive(u)}
                              className={`p-1.5 rounded-xl text-xs transition-colors cursor-pointer border ${
                                u.isActive
                                  ? 'text-rose-400 hover:bg-rose-500/10 border-rose-500/20'
                                  : 'text-emerald-400 hover:bg-emerald-500/10 border-emerald-500/20'
                              }`}
                              title={u.isActive ? 'غیرفعال‌سازی حساب' : 'فعال‌سازی حساب'}
                            >
                              <Power className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ===================== TAB 2: ROLES & GRANULAR PERMISSIONS ===================== */}
      {activeTab === 'ROLES' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {roles.map((r) => {
              const badgeColor = getRoleBadgeColor(r.color);
              const enabledCount = r.id === 'ADMIN' ? ALL_PERMISSIONS.length : r.permissions.length;
              const percent = Math.round((enabledCount / ALL_PERMISSIONS.length) * 100);

              return (
                <div
                  key={r.id}
                  className="bg-[#141414] rounded-3xl border border-white/5 p-5 shadow-xl hover:border-white/10 transition-all flex flex-col justify-between group"
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2.5">
                        <div className={`w-10 h-10 rounded-2xl flex items-center justify-center font-bold border ${badgeColor.bg} ${badgeColor.text} ${badgeColor.border}`}>
                          <ShieldCheck className="w-5 h-5" />
                        </div>
                        <div>
                          <h3 className="font-bold text-white text-sm flex items-center gap-2">
                            <span>{r.name}</span>
                            {r.isSystem && (
                              <span className="text-[9px] px-1.5 py-0.5 rounded-md bg-white/10 text-slate-400 font-normal">
                                سیستمی
                              </span>
                            )}
                          </h3>
                          <span className="text-[10px] text-slate-500 font-mono">شناسه: {r.id}</span>
                        </div>
                      </div>

                      <span
                        className={`text-[11px] font-bold px-2 py-0.5 rounded-full border ${badgeColor.bg} ${badgeColor.text} ${badgeColor.border}`}
                      >
                        {toPersianDigits(r.userCount || 0)} کاربر
                      </span>
                    </div>

                    <p className="text-xs text-slate-400 min-h-[36px] line-clamp-2">
                      {r.description || 'توضیحاتی برای این نقش ثبت نشده است.'}
                    </p>

                    {/* Permissions Bar */}
                    <div className="pt-2 border-t border-white/5 space-y-1.5">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-slate-400">سطح دسترسی:</span>
                        <span className="font-mono font-bold text-amber-400">
                          {toPersianDigits(enabledCount)} از {toPersianDigits(ALL_PERMISSIONS.length)} ({toPersianDigits(percent)}٪)
                        </span>
                      </div>
                      <div className="w-full bg-white/5 rounded-full h-2 overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all ${badgeColor.solidBg}`}
                          style={{ width: `${percent}%` }}
                        />
                      </div>
                    </div>

                    {/* Key Groups Badges */}
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {PERMISSION_GROUPS.map((g) => {
                        const hasAny = r.id === 'ADMIN' || g.permissions.some((p) => r.permissions.includes(p.key));
                        if (!hasAny) return null;
                        return (
                          <span
                            key={g.id}
                            className="text-[10px] px-2 py-0.5 rounded-lg bg-white/5 text-slate-300 border border-white/5"
                          >
                            ✓ {g.name}
                          </span>
                        );
                      })}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 pt-4 mt-4 border-t border-white/5">
                    <button
                      onClick={() => openEditRoleModal(r)}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 bg-white/5 hover:bg-white/10 text-white rounded-xl text-xs font-bold border border-white/5 transition-all cursor-pointer"
                    >
                      <Sliders className="w-3.5 h-3.5 text-amber-400" />
                      <span>تنظیم ریز دسترسی‌ها</span>
                    </button>

                    {!r.isSystem && r.id !== 'ADMIN' && r.id !== 'SELLER' && (
                      <button
                        onClick={() => handleDeleteRole(r)}
                        className="p-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 rounded-xl text-xs border border-rose-500/20 transition-all cursor-pointer"
                        title="حذف نقش"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ===================== MODAL: ADD / EDIT USER ===================== */}
      {showUserModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[#141414] rounded-3xl p-6 shadow-2xl border border-white/10 w-full max-w-lg space-y-4 text-right max-h-[90vh] overflow-y-auto custom-scrollbar">
            <div className="flex items-center justify-between border-b border-white/5 pb-3">
              <div className="flex items-center gap-2">
                <UserCog className="w-5 h-5 text-amber-400" />
                <h3 className="text-sm font-bold text-white">
                  {editingUser ? `ویرایش کاربر: ${editingUser.name}` : 'افزودن کاربر جدید به سامانه'}
                </h3>
              </div>
              <button onClick={() => setShowUserModal(false)} className="text-slate-400 hover:text-white cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleUserSubmit(e);
              }}
              action="javascript:void(0);"
              method="POST"
              className="space-y-4"
            >
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">نام کامل کاربر *</label>
                <input
                  type="text"
                  required
                  value={userName}
                  onChange={(e) => setUserName(e.target.value)}
                  placeholder="مثال: رضا صادقی"
                  className="w-full p-2.5 bg-white/5 border border-white/10 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-hidden focus:ring-1 focus:ring-amber-500"
                />
              </div>

              {!editingUser && (
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">نام کاربری (ورود به سامانه) *</label>
                  <input
                    type="text"
                    required
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="مثال: seller_reza"
                    className="w-full p-2.5 bg-white/5 border border-white/10 rounded-xl text-xs text-white placeholder-slate-500 text-left font-mono focus:outline-hidden focus:ring-1 focus:ring-amber-500"
                    dir="ltr"
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  {editingUser ? 'تغییر رمز عبور (در صورت نیاز)' : 'رمز عبور ورود *'}
                </label>
                <input
                  type="password"
                  required={!editingUser}
                  value={userPassword}
                  onChange={(e) => setUserPassword(e.target.value)}
                  placeholder={editingUser ? 'برای عدم تغییر خالی بگذارید (حداقل ۴ کاراکتر)' : '••••••••'}
                  className="w-full p-2.5 bg-white/5 border border-white/10 rounded-xl text-xs text-white placeholder-slate-500 text-left focus:outline-hidden focus:ring-1 focus:ring-amber-500"
                  dir="ltr"
                />
              </div>

              {/* Role Selection Dropdown */}
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  نقش سازمانی و الگوی دسترسی:
                </label>
                <select
                  value={userRole}
                  onChange={(e) => setUserRole(e.target.value)}
                  disabled={editingUser?.username === 'admin'}
                  className="w-full p-2.5 bg-white/5 border border-white/10 rounded-xl text-xs text-white focus:outline-hidden focus:ring-1 focus:ring-amber-500 disabled:opacity-60 cursor-pointer"
                >
                  {roles.map((r) => (
                    <option key={r.id} value={r.id} className="bg-[#1e1e1e] text-white">
                      {r.name} ({r.id === 'ADMIN' ? 'دسترسی کامل مدیر' : `${toPersianDigits(r.permissions.length)} دسترسی`})
                    </option>
                  ))}
                </select>
                {selectedRoleDef && (
                  <p className="text-[11px] text-slate-400 mt-1.5 p-2 rounded-lg bg-white/5 border border-white/5">
                    {selectedRoleDef.description || 'نقش تعیین‌شده برای این کاربر.'}
                  </p>
                )}
              </div>

              {/* Custom Individual Permission Overrides */}
              {userRole !== 'ADMIN' && (
                <div className="pt-2 border-t border-white/5">
                  <div className="flex items-center justify-between mb-2">
                    <label className="flex items-center gap-2 text-xs font-bold text-slate-300 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={customPermissionsEnabled}
                        onChange={(e) => {
                          setCustomPermissionsEnabled(e.target.checked);
                          if (e.target.checked && userCustomPermissions.length === 0 && selectedRoleDef) {
                            setUserCustomPermissions([...selectedRoleDef.permissions]);
                          }
                        }}
                        className="w-4 h-4 rounded text-amber-500 focus:ring-amber-500 accent-amber-500"
                      />
                      <span>شخصی‌سازی ریز دسترسی‌های اختصاصی این کاربر (فراتر از نقش)</span>
                    </label>
                  </div>

                  {customPermissionsEnabled && (
                    <div className="p-3 bg-black/40 border border-white/10 rounded-xl space-y-3 max-h-48 overflow-y-auto custom-scrollbar">
                      <p className="text-[10px] text-amber-400 font-medium">
                        دسترسی‌های تیک‌خورده به طور مستقیم به این کاربر اعطا می‌شوند:
                      </p>
                      {PERMISSION_GROUPS.map((g) => (
                        <div key={g.id} className="space-y-1">
                          <span className="text-[11px] font-bold text-slate-300 block">{g.name}</span>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                            {g.permissions.map((p) => {
                              const isChecked = userCustomPermissions.includes(p.key);
                              return (
                                <label
                                  key={p.key}
                                  className="flex items-center gap-1.5 text-[11px] text-slate-400 hover:text-white cursor-pointer"
                                >
                                  <input
                                    type="checkbox"
                                    checked={isChecked}
                                    onChange={() => {
                                      if (isChecked) {
                                        setUserCustomPermissions(userCustomPermissions.filter((k) => k !== p.key));
                                      } else {
                                        setUserCustomPermissions([...userCustomPermissions, p.key]);
                                      }
                                    }}
                                    className="w-3.5 h-3.5 rounded text-amber-500 focus:ring-amber-500 accent-amber-500"
                                  />
                                  <span>{p.label}</span>
                                </label>
                              );
                            })}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              <div className="pt-2">
                <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={userIsActive}
                    onChange={(e) => setUserIsActive(e.target.checked)}
                    disabled={editingUser?.username === 'admin'}
                    className="w-4 h-4 rounded text-amber-500 focus:ring-amber-500 accent-amber-500 disabled:opacity-60"
                  />
                  <span>حساب کاربری فعال باشد و اجازه ورود داشته باشد</span>
                </label>
              </div>

              <div className="flex gap-2 pt-3 border-t border-white/5">
                <button
                  type="button"
                  onClick={() => setShowUserModal(false)}
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

      {/* ===================== MODAL: ADD / EDIT ROLE WITH GRANULAR PERMISSIONS ===================== */}
      {showRoleModal && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[#141414] rounded-3xl p-6 shadow-2xl border border-white/10 w-full max-w-3xl space-y-4 text-right max-h-[92vh] flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-white/5 pb-3 shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center border border-amber-500/20">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">
                    {editingRole ? `ویرایش نقش و تنظیم دسترسی‌ها: «${editingRole.name}»` : 'تعریف نقش سازمانی جدید'}
                  </h3>
                  <span className="text-[10px] text-slate-400">
                    تعیین دقیق دسترسی‌ها از بین ۲۱ مجوز سیستم
                  </span>
                </div>
              </div>
              <button onClick={() => setShowRoleModal(false)} className="text-slate-400 hover:text-white cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Scrollable Form Body */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleRoleSubmit(e);
              }}
              action="javascript:void(0);"
              method="POST"
              className="space-y-4 overflow-y-auto pr-1 custom-scrollbar flex-1"
            >
              {/* Role Title and Color */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">عنوان نقش *</label>
                  <input
                    type="text"
                    required
                    value={roleName}
                    onChange={(e) => setRoleName(e.target.value)}
                    placeholder="مثال: مدیر داخلی / صندوق‌دار شیفت شب"
                    disabled={editingRole?.id === 'ADMIN'}
                    className="w-full p-2.5 bg-white/5 border border-white/10 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-hidden focus:ring-1 focus:ring-amber-500 disabled:opacity-60"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">رنگ برچسب و شناسه دیداری:</label>
                  <div className="flex items-center gap-2 pt-1">
                    {COLOR_OPTIONS.map((c) => (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => setRoleColor(c.id)}
                        className={`w-7 h-7 rounded-xl transition-all cursor-pointer flex items-center justify-center ${c.bg} ${
                          roleColor === c.id ? 'ring-2 ring-white scale-110 shadow-md' : 'opacity-70 hover:opacity-100'
                        }`}
                        title={c.name}
                      >
                        {roleColor === c.id && <Check className="w-3.5 h-3.5 text-slate-950 stroke-[3]" />}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">شرح وظایف و اختیارات (اختیاری):</label>
                <input
                  type="text"
                  value={roleDescription}
                  onChange={(e) => setRoleDescription(e.target.value)}
                  placeholder="مثال: مسئول رسیدگی به فاکتورهای فروش و صدور صورتحساب بدون دسترسی به سود خالص"
                  className="w-full p-2.5 bg-white/5 border border-white/10 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-hidden focus:ring-1 focus:ring-amber-500"
                />
              </div>

              {/* Quick Presets Bar */}
              {editingRole?.id !== 'ADMIN' && (
                <div className="p-3 bg-white/5 border border-white/5 rounded-2xl space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-300 flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                      <span>الگوهای آماده برای انتخاب سریع:</span>
                    </span>
                    <span className="font-mono text-amber-400 font-bold">
                      {toPersianDigits(rolePermissions.length)} از {toPersianDigits(ALL_PERMISSIONS.length)} دسترسی فعال
                    </span>
                  </div>

                  <div className="flex flex-wrap gap-2 text-xs">
                    <button
                      type="button"
                      onClick={() => applyRolePreset('ALL')}
                      className="px-2.5 py-1 bg-white/5 hover:bg-white/10 text-slate-300 rounded-lg font-bold border border-white/5 cursor-pointer"
                    >
                      انتخاب همه (۲۱ مجوز)
                    </button>
                    <button
                      type="button"
                      onClick={() => applyRolePreset('CLEAR')}
                      className="px-2.5 py-1 bg-white/5 hover:bg-white/10 text-slate-300 rounded-lg font-bold border border-white/5 cursor-pointer"
                    >
                      لغو همه
                    </button>
                    <button
                      type="button"
                      onClick={() => applyRolePreset('SELLER')}
                      className="px-2.5 py-1 bg-blue-500/10 hover:bg-blue-500/20 text-blue-300 rounded-lg font-bold border border-blue-500/20 cursor-pointer"
                    >
                      الگوی صندوق‌دار
                    </button>
                    <button
                      type="button"
                      onClick={() => applyRolePreset('ACCOUNTANT')}
                      className="px-2.5 py-1 bg-purple-500/10 hover:bg-purple-500/20 text-purple-300 rounded-lg font-bold border border-purple-500/20 cursor-pointer"
                    >
                      الگوی حسابدار
                    </button>
                    <button
                      type="button"
                      onClick={() => applyRolePreset('STOCK')}
                      className="px-2.5 py-1 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 rounded-lg font-bold border border-emerald-500/20 cursor-pointer"
                    >
                      الگوی انباردار
                    </button>
                  </div>
                </div>
              )}

              {/* Notice if ADMIN */}
              {editingRole?.id === 'ADMIN' && (
                <div className="p-3 bg-amber-500/10 border border-amber-500/20 text-amber-300 rounded-2xl text-xs flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-amber-400 shrink-0" />
                  <span>نقش مدیر کل سیستم (ADMIN) به عنوان صاحب سیستم، دسترسی همیشگی و نامحدود به تمامی بخش‌ها دارد.</span>
                </div>
              )}

              {/* Granular Permission Checklist by Groups */}
              <div className="space-y-4 pt-1">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-black text-white uppercase tracking-wider">
                    فهرست دسترسی‌های تفکیک‌شده (Permissions Checklist)
                  </h4>
                </div>

                <div className="space-y-4">
                  {PERMISSION_GROUPS.map((group) => {
                    const groupPermKeys = group.permissions.map((p) => p.key);
                    const selectedInGroup = groupPermKeys.filter((k) =>
                      rolePermissions.includes(k)
                    ).length;
                    const allSelected = selectedInGroup === groupPermKeys.length;

                    return (
                      <div
                        key={group.id}
                        className="bg-black/30 border border-white/5 rounded-2xl p-4 space-y-3"
                      >
                        <div className="flex items-center justify-between pb-2 border-b border-white/5">
                          <div>
                            <span className="font-bold text-white text-xs block">{group.name}</span>
                            <span className="text-[10px] text-slate-400">{group.description}</span>
                          </div>

                          {editingRole?.id !== 'ADMIN' && (
                            <button
                              type="button"
                              onClick={() => toggleGroupPermissions(groupPermKeys)}
                              className="text-[11px] text-amber-400 hover:text-amber-300 font-bold cursor-pointer"
                            >
                              {allSelected ? 'لغو این دسته' : 'انتخاب همه این دسته'}
                            </button>
                          )}
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                          {group.permissions.map((perm) => {
                            const isGranted =
                              editingRole?.id === 'ADMIN' || rolePermissions.includes(perm.key);

                            return (
                              <div
                                key={perm.key}
                                onClick={() => {
                                  if (editingRole?.id !== 'ADMIN') {
                                    togglePermission(perm.key);
                                  }
                                }}
                                className={`p-2.5 rounded-xl border transition-all flex items-start gap-2.5 cursor-pointer ${
                                  isGranted
                                    ? 'bg-amber-500/10 border-amber-500/30 text-white'
                                    : 'bg-white/5 border-white/5 text-slate-400 hover:border-white/10 hover:text-slate-200'
                                }`}
                              >
                                <div className="pt-0.5 shrink-0">
                                  {isGranted ? (
                                    <CheckSquare className="w-4 h-4 text-amber-400" />
                                  ) : (
                                    <Square className="w-4 h-4 text-slate-500" />
                                  )}
                                </div>
                                <div className="space-y-0.5">
                                  <div className="flex items-center gap-1.5">
                                    <span className="font-bold text-xs">{perm.label}</span>
                                    {perm.adminOnly && (
                                      <span className="text-[9px] px-1 rounded bg-rose-500/20 text-rose-300 font-medium">
                                        حساس
                                      </span>
                                    )}
                                  </div>
                                  <p className="text-[10px] text-slate-400 leading-relaxed">
                                    {perm.description}
                                  </p>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="flex gap-2 pt-4 border-t border-white/5 sticky bottom-0 bg-[#141414] py-2">
                <button
                  type="button"
                  onClick={() => setShowRoleModal(false)}
                  className="flex-1 py-2.5 bg-white/5 hover:bg-white/10 text-slate-300 rounded-xl text-xs font-bold border border-white/5 cursor-pointer"
                >
                  انصراف
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 rounded-xl text-xs font-bold shadow-md shadow-amber-500/20 cursor-pointer"
                >
                  ذخیره مشخصات و دسترسی‌ها
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
