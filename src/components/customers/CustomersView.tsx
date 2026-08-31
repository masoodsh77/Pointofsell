import React, { useState, useEffect } from 'react';
import { Customer, StoreSettings } from '../../types';
import { apiRequest } from '../../services/api';
import { formatCurrency, formatPersianDate, toPersianDigits } from '../../utils/persian';
import { CustomerDetailModal } from './CustomerDetailModal';
import {
  Users,
  Plus,
  Edit,
  Trash2,
  Search,
  Phone,
  CheckCircle,
  AlertCircle,
  X,
  FileText,
  CreditCard,
  Tag,
  DollarSign,
  UserCheck
} from 'lucide-react';

interface CustomersViewProps {
  settings?: StoreSettings | null;
}

export const CustomersView: React.FC<CustomersViewProps> = ({ settings = null }) => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [filterType, setFilterType] = useState<'ALL' | 'DEBTORS' | 'CREDITORS' | 'DISCOUNT'>('ALL');

  // Add / Edit Modal
  const [showModal, setShowModal] = useState<boolean>(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);

  // Form Fields
  const [name, setName] = useState<string>('');
  const [phone, setPhone] = useState<string>('');
  const [address, setAddress] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [fixedDiscountPercent, setFixedDiscountPercent] = useState<string>('0');
  const [fixedDiscountAmount, setFixedDiscountAmount] = useState<string>('0');
  const [creditBalance, setCreditBalance] = useState<string>('0');
  const [maxCreditLimit, setMaxCreditLimit] = useState<string>('0');

  // Details Modal (Invoices & Ledger)
  const [selectedCustomerForDetails, setSelectedCustomerForDetails] = useState<Customer | null>(null);

  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const loadCustomers = async () => {
    const res = await apiRequest<Customer[]>('/customers');
    if (res.success && res.data) setCustomers(res.data);
  };

  useEffect(() => {
    loadCustomers();
  }, []);

  const openAddModal = () => {
    setEditingCustomer(null);
    setName('');
    setPhone('');
    setAddress('');
    setNotes('');
    setFixedDiscountPercent('0');
    setFixedDiscountAmount('0');
    setCreditBalance('0');
    setMaxCreditLimit('0');
    setShowModal(true);
  };

  const openEditModal = (c: Customer) => {
    setEditingCustomer(c);
    setName(c.name);
    setPhone(c.phone || '');
    setAddress(c.address || '');
    setNotes(c.notes || '');
    setFixedDiscountPercent(String(c.fixedDiscountPercent || 0));
    setFixedDiscountAmount(String(c.fixedDiscountAmount || 0));
    setCreditBalance(String(c.creditBalance || 0));
    setMaxCreditLimit(String(c.maxCreditLimit || 0));
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setErrorMsg(null);
    const payload = {
      name: name.trim(),
      phone: phone.trim(),
      address: address.trim(),
      notes: notes.trim(),
      fixedDiscountPercent: parseFloat(fixedDiscountPercent) || 0,
      fixedDiscountAmount: parseFloat(fixedDiscountAmount) || 0,
      creditBalance: parseFloat(creditBalance) || 0,
      maxCreditLimit: parseFloat(maxCreditLimit) || 0,
    };

    if (editingCustomer) {
      const res = await apiRequest(`/customers/${editingCustomer.id}`, {
        method: 'PUT',
        body: JSON.stringify(payload),
      });
      if (res.success) {
        setSuccessMsg('اطلاعات مشتری با موفقیت ویرایش شد.');
        setShowModal(false);
        loadCustomers();
        setTimeout(() => setSuccessMsg(null), 3000);
      } else {
        setErrorMsg(res.message || 'خطا در ویرایش مشتری');
      }
    } else {
      const res = await apiRequest('/customers', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
      if (res.success) {
        setSuccessMsg('مشتری جدید با موفقیت افزوده شد.');
        setShowModal(false);
        loadCustomers();
        setTimeout(() => setSuccessMsg(null), 3000);
      } else {
        setErrorMsg(res.message || 'خطا در ایجاد مشتری');
      }
    }
  };

  const handleDelete = async (id: string, cName: string) => {
    if (!window.confirm(`آیا از حذف مشتری "${cName}" اطمینان دارید؟`)) return;
    const res = await apiRequest(`/customers/${id}`, { method: 'DELETE' });
    if (res.success) {
      setSuccessMsg('مشتری با موفقیت حذف شد.');
      loadCustomers();
      setTimeout(() => setSuccessMsg(null), 3000);
    } else {
      setErrorMsg(res.message || 'خطا در حذف مشتری');
    }
  };

  const filtered = customers.filter((c) => {
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !q ||
      c.name.toLowerCase().includes(q) ||
      (c.phone && c.phone.includes(q)) ||
      (c.address && c.address.toLowerCase().includes(q));

    const bal = c.creditBalance || 0;
    const matchesFilter =
      filterType === 'ALL' ||
      (filterType === 'DEBTORS' && bal < 0) ||
      (filterType === 'CREDITORS' && bal > 0) ||
      (filterType === 'DISCOUNT' && ((c.fixedDiscountPercent || 0) > 0 || (c.fixedDiscountAmount || 0) > 0));

    return matchesSearch && matchesFilter;
  });

  const totalDebtorsAmount = customers
    .filter((c) => (c.creditBalance || 0) < 0)
    .reduce((acc, c) => acc + Math.abs(c.creditBalance || 0), 0);

  const totalCreditorsAmount = customers
    .filter((c) => (c.creditBalance || 0) > 0)
    .reduce((acc, c) => acc + (c.creditBalance || 0), 0);

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Top Banner Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#141414] p-6 rounded-3xl border border-white/5 shadow-xl">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-black text-white">مدیریت مشتریان و حساب‌های دفتری</h2>
            <p className="text-xs text-slate-400 mt-0.5">
              تخفیف‌های اختصاصی، تاریخچه فاکتورها، مانده حساب بدهکاری و بستانکاری، تسویه حساب
            </p>
          </div>
        </div>

        <button
          id="add-customer-btn"
          onClick={openAddModal}
          className="flex items-center justify-center gap-2 px-5 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold rounded-2xl text-xs transition-all shadow-md shadow-amber-500/20 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>افزودن مشتری جدید</span>
        </button>
      </div>

      {/* Quick Financial Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-[#141414] p-4 rounded-3xl border border-white/5 shadow-sm flex items-center justify-between">
          <div>
            <div className="text-[11px] font-bold text-slate-400">کل مشتریان ثبت شده</div>
            <div className="text-lg font-black text-white mt-1 font-sans">
              {toPersianDigits(customers.length)} <span className="text-xs font-normal text-slate-500">نفر</span>
            </div>
          </div>
          <div className="w-10 h-10 rounded-2xl bg-white/5 text-slate-300 flex items-center justify-center">
            <UserCheck className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-[#141414] p-4 rounded-3xl border border-rose-500/20 shadow-sm flex items-center justify-between">
          <div>
            <div className="text-[11px] font-bold text-rose-400">مجموع طلب فروشگاه (بدهکاری مشتریان)</div>
            <div className="text-lg font-black text-rose-400 mt-1 font-sans">
              {formatCurrency(totalDebtorsAmount)}
            </div>
          </div>
          <div className="w-10 h-10 rounded-2xl bg-rose-500/10 text-rose-400 flex items-center justify-center">
            <DollarSign className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-[#141414] p-4 rounded-3xl border border-emerald-500/20 shadow-sm flex items-center justify-between">
          <div>
            <div className="text-[11px] font-bold text-emerald-400">مجموع بستانکاری مشتریان (پیش‌پرداخت)</div>
            <div className="text-lg font-black text-emerald-400 mt-1 font-sans">
              {formatCurrency(totalCreditorsAmount)}
            </div>
          </div>
          <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
            <CreditCard className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Messages */}
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

      {/* Search & Filter Bar */}
      <div className="bg-[#141414] p-4 rounded-3xl border border-white/5 shadow-sm flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:w-80">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="جستجوی نام، تلفن یا آدرس مشتری..."
            className="w-full pl-3 pr-9 py-2 bg-white/5 border border-white/10 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-hidden focus:ring-1 focus:ring-amber-500"
          />
          <Search className="w-4 h-4 text-slate-500 absolute right-3 top-2.5" />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setFilterType('ALL')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              filterType === 'ALL'
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                : 'bg-white/5 text-slate-400 hover:text-white'
            }`}
          >
            همه مشتریان ({toPersianDigits(customers.length)})
          </button>
          <button
            onClick={() => setFilterType('DEBTORS')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              filterType === 'DEBTORS'
                ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                : 'bg-white/5 text-slate-400 hover:text-white'
            }`}
          >
            بدهکاران ({toPersianDigits(customers.filter((c) => (c.creditBalance || 0) < 0).length)})
          </button>
          <button
            onClick={() => setFilterType('CREDITORS')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              filterType === 'CREDITORS'
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                : 'bg-white/5 text-slate-400 hover:text-white'
            }`}
          >
            بستانکاران ({toPersianDigits(customers.filter((c) => (c.creditBalance || 0) > 0).length)})
          </button>
          <button
            onClick={() => setFilterType('DISCOUNT')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              filterType === 'DISCOUNT'
                ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                : 'bg-white/5 text-slate-400 hover:text-white'
            }`}
          >
            دارای تخفیف ثابت
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-[#141414] rounded-3xl border border-white/5 shadow-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead className="bg-white/5 border-b border-white/5 text-slate-400 font-bold">
              <tr>
                <th className="py-3.5 px-4">نام مشتری</th>
                <th className="py-3.5 px-3">شماره تماس</th>
                <th className="py-3.5 px-3">تخفیف ثابت</th>
                <th className="py-3.5 px-3">مانده حساب (تراز)</th>
                <th className="py-3.5 px-3">تعداد فاکتورها</th>
                <th className="py-3.5 px-3">مجموع خرید</th>
                <th className="py-3.5 px-4 text-center">عملیات و پرونده</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-slate-200">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-500">
                    مشتری با مشخصات مورد نظر یافت نشد.
                  </td>
                </tr>
              ) : (
                filtered.map((c) => {
                  const bal = c.creditBalance || 0;
                  const isDebtor = bal < 0;
                  const isCreditor = bal > 0;
                  const hasDiscount = (c.fixedDiscountPercent || 0) > 0 || (c.fixedDiscountAmount || 0) > 0;

                  return (
                    <tr key={c.id} className="hover:bg-white/5 transition-colors">
                      <td className="py-3 px-4 font-bold text-white">
                        <div className="flex items-center gap-1.5">
                          <span>{c.name}</span>
                          {c.id === 'cust-1' && (
                            <span className="px-1.5 py-0.5 bg-white/10 text-[9px] text-slate-400 rounded">
                              پیش‌فرض
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-3 text-slate-400 font-mono">
                        {c.phone ? toPersianDigits(c.phone) : '-'}
                      </td>
                      <td className="py-3 px-3">
                        {hasDiscount ? (
                          <div className="flex items-center gap-1 text-purple-300 font-bold">
                            <Tag className="w-3.5 h-3.5" />
                            <span>
                              {(c.fixedDiscountPercent || 0) > 0
                                ? `${toPersianDigits(c.fixedDiscountPercent)}%`
                                : formatCurrency(c.fixedDiscountAmount || 0)}
                            </span>
                          </div>
                        ) : (
                          <span className="text-slate-600">-</span>
                        )}
                      </td>
                      <td className="py-3 px-3">
                        <span
                          className={`px-2.5 py-1 rounded-full font-bold font-sans text-[11px] ${
                            isDebtor
                              ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                              : isCreditor
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                              : 'bg-white/5 text-slate-400 border border-white/5'
                          }`}
                        >
                          {bal === 0
                            ? 'تسویه'
                            : isDebtor
                            ? `بدهکار: ${formatCurrency(Math.abs(bal))}`
                            : `بستانکار: ${formatCurrency(bal)}`}
                        </span>
                      </td>
                      <td className="py-3 px-3 font-semibold text-slate-300 font-sans">
                        {toPersianDigits(c.totalPurchases || 0)} فاکتور
                      </td>
                      <td className="py-3 px-3 font-black text-amber-400 font-sans">
                        {formatCurrency(c.totalSpent || 0)}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => setSelectedCustomerForDetails(c)}
                            className="px-2.5 py-1 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 rounded-lg text-xs font-bold transition-colors cursor-pointer flex items-center gap-1"
                            title="مشاهده پرونده، فاکتورها و تسویه حساب"
                          >
                            <FileText className="w-3.5 h-3.5" />
                            <span>فاکتورها و گردش</span>
                          </button>

                          <button
                            onClick={() => openEditModal(c)}
                            className="p-1.5 text-slate-400 hover:text-amber-400 rounded-lg hover:bg-white/5 transition-colors cursor-pointer"
                            title="ویرایش مشخصات و تخفیف"
                          >
                            <Edit className="w-4 h-4" />
                          </button>

                          {c.id !== 'cust-1' && (
                            <button
                              onClick={() => handleDelete(c.id, c.name)}
                              className="p-1.5 text-slate-400 hover:text-rose-400 rounded-lg hover:bg-rose-500/10 transition-colors cursor-pointer"
                              title="حذف مشتری"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Customer Full Profile, Invoices & Settlement Modal */}
      {selectedCustomerForDetails && (
        <CustomerDetailModal
          customer={selectedCustomerForDetails}
          settings={settings}
          onClose={() => setSelectedCustomerForDetails(null)}
          onCustomerUpdated={() => {
            loadCustomers();
          }}
        />
      )}

      {/* Add / Edit Customer Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[#141414] rounded-3xl p-6 shadow-2xl border border-white/10 w-full max-w-lg space-y-4 text-right max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-white/5 pb-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Users className="w-4 h-4 text-amber-400" />
                <span>{editingCustomer ? 'ویرایش مشخصات و شرایط مشتری' : 'افزودن مشتری جدید'}</span>
              </h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-white cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  نام و نام خانوادگی مشتری: <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="مثال: مهندس کاظمی"
                  className="w-full p-2.5 bg-white/5 border border-white/10 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-hidden focus:ring-1 focus:ring-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">شماره تلفن همراه:</label>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="۰۹۱۲۳۴۵۶۷۸۹"
                  className="w-full p-2.5 bg-white/5 border border-white/10 rounded-xl text-xs text-white placeholder-slate-500 text-left focus:outline-hidden focus:ring-1 focus:ring-amber-500"
                  dir="ltr"
                />
              </div>

              {/* Fixed Discounts section */}
              <div className="p-3 bg-purple-500/10 border border-purple-500/20 rounded-2xl space-y-2">
                <div className="text-xs font-bold text-purple-300 flex items-center gap-1.5">
                  <Tag className="w-3.5 h-3.5" />
                  <span>تخفیف ثابت مشتری (در هر فاکتور فروش خودکار اعمال می‌شود)</span>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] text-slate-300 mb-1">درصد تخفیف ثابت (%):</label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      step="0.5"
                      value={fixedDiscountPercent}
                      onChange={(e) => setFixedDiscountPercent(e.target.value)}
                      placeholder="۰"
                      className="w-full p-2 bg-[#181818] border border-white/10 rounded-xl text-xs text-white focus:border-purple-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-slate-300 mb-1">یا مبلغ تخفیف ثابت (تومان):</label>
                    <input
                      type="number"
                      min="0"
                      step="1000"
                      value={fixedDiscountAmount}
                      onChange={(e) => setFixedDiscountAmount(e.target.value)}
                      placeholder="۰"
                      className="w-full p-2 bg-[#181818] border border-white/10 rounded-xl text-xs text-white focus:border-purple-500 outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Financial Balance & Credit Limit */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    مانده اولیه تراز حساب (تومان):
                  </label>
                  <input
                    type="number"
                    value={creditBalance}
                    onChange={(e) => setCreditBalance(e.target.value)}
                    placeholder="مثبت: بستانکار / منفی: بدهکار"
                    className="w-full p-2.5 bg-white/5 border border-white/10 rounded-xl text-xs text-white focus:outline-hidden focus:ring-1 focus:ring-amber-500"
                  />
                  <span className="text-[10px] text-slate-500 mt-0.5 block">
                    عدد منفی = مشتری بدهکار است
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    سقف اعتبار نسیه (تومان):
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="100000"
                    value={maxCreditLimit}
                    onChange={(e) => setMaxCreditLimit(e.target.value)}
                    placeholder="مثلاً ۵,۰۰۰,۰۰۰"
                    className="w-full p-2.5 bg-white/5 border border-white/10 rounded-xl text-xs text-white focus:outline-hidden focus:ring-1 focus:ring-amber-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">آدرس تحویل یا محل سکونت:</label>
                <textarea
                  rows={2}
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="آدرس، پلاک، واحد..."
                  className="w-full p-2.5 bg-white/5 border border-white/10 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-hidden focus:ring-1 focus:ring-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">توضیحات و یادداشت دفتری:</label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="توضیحات اختصاصی مشتری..."
                  className="w-full p-2.5 bg-white/5 border border-white/10 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-hidden focus:ring-1 focus:ring-amber-500"
                />
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
                  {editingCustomer ? 'ذخیره تغییرات' : 'ثبت مشتری جدید'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
