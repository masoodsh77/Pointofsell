import React, { useState, useEffect } from 'react';
import { Supplier } from '../../types';
import { apiRequest } from '../../services/api';
import { formatCurrency, toPersianDigits } from '../../utils/persian';
import { SupplierPurchasesModal } from './SupplierPurchasesModal';
import {
  Building2,
  Plus,
  Edit,
  Trash2,
  Search,
  CheckCircle,
  AlertCircle,
  X,
  FileText,
  Phone,
  MapPin
} from 'lucide-react';

export const SuppliersView: React.FC = () => {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [showModal, setShowModal] = useState<boolean>(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
  const [selectedSupplierForPurchases, setSelectedSupplierForPurchases] = useState<Supplier | null>(null);

  const [name, setName] = useState<string>('');
  const [contactPerson, setContactPerson] = useState<string>('');
  const [phone, setPhone] = useState<string>('');
  const [address, setAddress] = useState<string>('');

  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const loadSuppliers = async () => {
    const res = await apiRequest<Supplier[]>('/suppliers');
    if (res.success && res.data) setSuppliers(res.data);
  };

  useEffect(() => {
    loadSuppliers();
  }, []);

  const openAddModal = () => {
    setEditingSupplier(null);
    setName('');
    setContactPerson('');
    setPhone('');
    setAddress('');
    setShowModal(true);
  };

  const openEditModal = (s: Supplier) => {
    setEditingSupplier(s);
    setName(s.name);
    setContactPerson(s.contactPerson || '');
    setPhone(s.phone);
    setAddress(s.address || '');
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !phone.trim()) return;

    setErrorMsg(null);
    if (editingSupplier) {
      const res = await apiRequest(`/suppliers/${editingSupplier.id}`, {
        method: 'PUT',
        body: JSON.stringify({ name, contactPerson, phone, address }),
      });
      if (res.success) {
        setSuccessMsg('اطلاعات تامین‌کننده ویرایش شد.');
        setShowModal(false);
        loadSuppliers();
        setTimeout(() => setSuccessMsg(null), 3000);
      } else {
        setErrorMsg(res.message || 'خطا در ویرایش');
      }
    } else {
      const res = await apiRequest('/suppliers', {
        method: 'POST',
        body: JSON.stringify({ name, contactPerson, phone, address }),
      });
      if (res.success) {
        setSuccessMsg('تامین‌کننده جدید ثبت شد.');
        setShowModal(false);
        loadSuppliers();
        setTimeout(() => setSuccessMsg(null), 3000);
      } else {
        setErrorMsg(res.message || 'خطا در ثبت تامین‌کننده');
      }
    }
  };

  const handleDelete = async (id: string, sName: string) => {
    if (!window.confirm(`آیا از حذف تامین‌کننده "${sName}" اطمینان دارید؟`)) return;
    const res = await apiRequest(`/suppliers/${id}`, { method: 'DELETE' });
    if (res.success) {
      setSuccessMsg('تامین‌کننده حذف شد.');
      loadSuppliers();
      setTimeout(() => setSuccessMsg(null), 3000);
    } else {
      setErrorMsg(res.message || 'خطا در حذف');
    }
  };

  const filtered = suppliers.filter(
    (s) =>
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (s.contactPerson && s.contactPerson.toLowerCase().includes(searchQuery.toLowerCase())) ||
      s.phone.includes(searchQuery)
  );

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#141414] p-6 rounded-3xl border border-white/5 shadow-xl">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center">
            <Building2 className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-black text-white">بانک اطلاعات تامین‌کنندگان و باغداران</h2>
            <p className="text-xs text-slate-400 mt-0.5">
              مدیریت بنکداران، کشاورزان پسته، گردو و مشاهده سوابق فاکتورهای خرید ورودی به انبار
            </p>
          </div>
        </div>

        <button
          onClick={openAddModal}
          className="flex items-center justify-center gap-2 px-5 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold rounded-2xl text-xs transition-all shadow-md shadow-amber-500/20 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>افزودن تامین‌کننده جدید</span>
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

      {/* Search Bar */}
      <div className="bg-[#141414] p-4 rounded-3xl border border-white/5 shadow-sm flex items-center justify-between">
        <div className="relative w-full sm:w-80">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="جستجوی نام شرکت، نام شخص یا تلفن..."
            className="w-full pl-3 pr-9 py-2 bg-white/5 border border-white/10 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-hidden focus:ring-1 focus:ring-amber-500"
          />
          <Search className="w-4 h-4 text-slate-500 absolute right-3 top-2.5" />
        </div>
      </div>

      {/* Table */}
      <div className="bg-[#141414] rounded-3xl border border-white/5 shadow-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead className="bg-white/5 border-b border-white/5 text-slate-400 font-bold">
              <tr>
                <th className="py-3.5 px-4">عنوان شرکت / تامین‌کننده</th>
                <th className="py-3.5 px-3">شخص رابط</th>
                <th className="py-3.5 px-3">شماره تماس</th>
                <th className="py-3.5 px-3">مجموع خریدهای ثبت شده</th>
                <th className="py-3.5 px-3">آدرس</th>
                <th className="py-3.5 px-4 text-center">عملیات و سوابق</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-slate-200">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-500">
                    تامین‌کننده‌ای یافت نشد.
                  </td>
                </tr>
              ) : (
                filtered.map((s) => (
                  <tr key={s.id} className="hover:bg-white/5 transition-colors">
                    <td className="py-3 px-4 font-bold text-white">{s.name}</td>
                    <td className="py-3 px-3 text-slate-300">{s.contactPerson || '-'}</td>
                    <td className="py-3 px-3 text-slate-400 font-mono">{toPersianDigits(s.phone)}</td>
                    <td className="py-3 px-3 font-black text-amber-400 font-sans">
                      {formatCurrency(s.totalPurchases || 0)}
                    </td>
                    <td className="py-3 px-3 text-slate-400 max-w-xs truncate">{s.address || '-'}</td>
                    <td className="py-3 px-4 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => setSelectedSupplierForPurchases(s)}
                          className="px-2.5 py-1 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 rounded-lg text-xs font-bold transition-colors cursor-pointer flex items-center gap-1"
                          title="مشاهده تمام فاکتورهای خرید این تامین‌کننده"
                        >
                          <FileText className="w-3.5 h-3.5" />
                          <span>فاکتورهای خرید</span>
                        </button>

                        <button
                          onClick={() => openEditModal(s)}
                          className="p-1.5 text-slate-400 hover:text-amber-400 rounded-lg hover:bg-white/5 transition-colors cursor-pointer"
                          title="ویرایش تامین‌کننده"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(s.id, s.name)}
                          className="p-1.5 text-slate-400 hover:text-rose-400 rounded-lg hover:bg-rose-500/10 transition-colors cursor-pointer"
                          title="حذف تامین‌کننده"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Supplier Purchases History Modal */}
      {selectedSupplierForPurchases && (
        <SupplierPurchasesModal
          supplier={selectedSupplierForPurchases}
          onClose={() => setSelectedSupplierForPurchases(null)}
        />
      )}

      {/* Add / Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[#141414] rounded-3xl p-6 shadow-2xl border border-white/10 w-full max-w-md space-y-4 text-right">
            <div className="flex items-center justify-between border-b border-white/5 pb-3">
              <h3 className="text-sm font-bold text-white">
                {editingSupplier ? 'ویرایش تامین‌کننده' : 'ثبت تامین‌کننده جدید'}
              </h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-white cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  نام تامین‌کننده / باغدار *
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="مثال: بازرگانی خشکبار کرمان"
                  className="w-full p-2.5 bg-white/5 border border-white/10 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-hidden focus:ring-1 focus:ring-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">شخص رابط / مدیر فروش</label>
                <input
                  type="text"
                  value={contactPerson}
                  onChange={(e) => setContactPerson(e.target.value)}
                  placeholder="نام مسئول فروش"
                  className="w-full p-2.5 bg-white/5 border border-white/10 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-hidden focus:ring-1 focus:ring-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">شماره تماس *</label>
                <input
                  type="text"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="۰۲۱... یا ۰۹۱۲..."
                  className="w-full p-2.5 bg-white/5 border border-white/10 rounded-xl text-xs text-white placeholder-slate-500 text-left focus:outline-hidden focus:ring-1 focus:ring-amber-500"
                  dir="ltr"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">آدرس انبار / دفتر</label>
                <textarea
                  rows={2}
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="آدرس..."
                  className="w-full p-2.5 bg-white/5 border border-white/10 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-hidden focus:ring-1 focus:ring-amber-500"
                />
              </div>

              <div className="flex gap-2 pt-2">
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
