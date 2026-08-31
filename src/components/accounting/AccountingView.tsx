import React, { useState, useEffect } from 'react';
import { Expense, Cheque, User } from '../../types';
import { apiRequest } from '../../services/api';
import {
  formatCurrency,
  formatPersianDate,
  toPersianDigits
} from '../../utils/persian';
import {
  Calculator,
  DollarSign,
  CreditCard,
  Plus,
  Trash2,
  Edit,
  AlertTriangle,
  CheckCircle,
  Clock,
  Calendar,
  Search,
  Filter,
  X,
  FileSpreadsheet,
  ArrowDownLeft,
  ArrowUpRight,
  PieChart,
  Tag,
  Briefcase,
  AlertCircle,
  BellRing
} from 'lucide-react';

interface AccountingViewProps {
  currentUser: User | null;
}

const EXPENSE_CATEGORIES = [
  { id: 'PACKAGING', label: 'نایلون، بسته‌بندی و ظروف' },
  { id: 'SALARY', label: 'حقوق و دستمزد پرسنل' },
  { id: 'RENT', label: 'اجاره بها فروشگاه/انبار' },
  { id: 'UTILITIES', label: 'قبوض (آب، برق، گاز، تلفن)' },
  { id: 'TRANSPORT', label: 'حمل و نقل و باربری' },
  { id: 'REPAIRS', label: 'تعمیرات و نگهداری تجهیزات' },
  { id: 'TAX_ACCOUNTING', label: 'مالیات، بیمه و حسابداری' },
  { id: 'OTHER', label: 'سایر هزینه‌های متفرقه' },
];

export const AccountingView: React.FC<AccountingViewProps> = ({ currentUser }) => {
  const [activeTab, setActiveTab] = useState<'EXPENSES' | 'CHEQUES'>('EXPENSES');

  // Expenses State
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [selectedExpenseCat, setSelectedExpenseCat] = useState<string>('ALL');
  const [expenseSearch, setExpenseSearch] = useState<string>('');
  const [showExpenseModal, setShowExpenseModal] = useState<boolean>(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);

  // Expense Form State
  const [expTitle, setExpTitle] = useState<string>('');
  const [expAmount, setExpAmount] = useState<string>('');
  const [expCategory, setExpCategory] = useState<string>('PACKAGING');
  const [expPaymentMethod, setExpPaymentMethod] = useState<'CASH' | 'CARD' | 'BANK_TRANSFER' | 'CHEQUE'>('CARD');
  const [expRecipient, setExpRecipient] = useState<string>('');
  const [expRef, setExpRef] = useState<string>('');
  const [expNotes, setExpNotes] = useState<string>('');

  // Cheques State
  const [cheques, setCheques] = useState<Cheque[]>([]);
  const [chequeTypeFilter, setChequeTypeFilter] = useState<'ALL' | 'PAYABLE' | 'RECEIVABLE'>('ALL');
  const [chequeStatusFilter, setChequeStatusFilter] = useState<'ALL' | 'PENDING' | 'CLEARED' | 'BOUNCED'>('ALL');
  const [chequeSearch, setChequeSearch] = useState<string>('');
  const [showChequeModal, setShowChequeModal] = useState<boolean>(false);
  const [editingCheque, setEditingCheque] = useState<Cheque | null>(null);

  // Cheque Form State
  const [chqNumber, setChqNumber] = useState<string>('');
  const [chqSayad, setChqSayad] = useState<string>('');
  const [chqBank, setChqBank] = useState<string>('');
  const [chqBranch, setChqBranch] = useState<string>('');
  const [chqType, setChqType] = useState<'RECEIVABLE' | 'PAYABLE'>('PAYABLE');
  const [chqAmount, setChqAmount] = useState<string>('');
  const [chqDueDate, setChqDueDate] = useState<string>('');
  const [chqParty, setChqParty] = useState<string>('');
  const [chqStatus, setChqStatus] = useState<'PENDING' | 'CLEARED' | 'BOUNCED' | 'CANCELLED'>('PENDING');
  const [chqDesc, setChqDesc] = useState<string>('');

  // Notifications / Alert Messages
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const loadAccountingData = async () => {
    const [expRes, chqRes] = await Promise.all([
      apiRequest<Expense[]>('/accounting/expenses'),
      apiRequest<Cheque[]>('/accounting/cheques'),
    ]);

    if (expRes.success && expRes.data) setExpenses(expRes.data);
    if (chqRes.success && chqRes.data) setCheques(chqRes.data);
  };

  useEffect(() => {
    loadAccountingData();
  }, []);

  // --- Expenses Actions ---
  const openAddExpenseModal = () => {
    setEditingExpense(null);
    setExpTitle('');
    setExpAmount('');
    setExpCategory('PACKAGING');
    setExpPaymentMethod('CARD');
    setExpRecipient('');
    setExpRef('');
    setExpNotes('');
    setShowExpenseModal(true);
  };

  const openEditExpenseModal = (exp: Expense) => {
    setEditingExpense(exp);
    setExpTitle(exp.title);
    setExpAmount(String(exp.amount));
    setExpCategory(exp.category);
    setExpPaymentMethod(exp.paymentMethod || 'CARD');
    setExpRecipient(exp.recipient || '');
    setExpRef(exp.referenceNumber || '');
    setExpNotes(exp.notes || '');
    setShowExpenseModal(true);
  };

  const handleExpenseSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const amount = Number(expAmount);
    if (isNaN(amount) || amount <= 0 || !expTitle.trim()) {
      setErrorMsg('لطفاً عنوان و مبلغ معتبر برای هزینه وارد کنید.');
      return;
    }

    const payload = {
      title: expTitle.trim(),
      amount,
      category: expCategory,
      paymentMethod: expPaymentMethod,
      recipient: expRecipient.trim(),
      referenceNumber: expRef.trim(),
      notes: expNotes.trim(),
    };

    if (editingExpense) {
      const res = await apiRequest(`/accounting/expenses/${editingExpense.id}`, {
        method: 'PUT',
        body: JSON.stringify(payload),
      });
      if (res.success) {
        setSuccessMsg('هزینه با موفقیت ویرایش شد.');
        setShowExpenseModal(false);
        loadAccountingData();
        setTimeout(() => setSuccessMsg(null), 3000);
      } else {
        setErrorMsg(res.message || 'خطا در ویرایش هزینه');
      }
    } else {
      const res = await apiRequest('/accounting/expenses', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
      if (res.success) {
        setSuccessMsg('هزینه جانبی جدید با موفقیت ثبت گردید.');
        setShowExpenseModal(false);
        loadAccountingData();
        setTimeout(() => setSuccessMsg(null), 3000);
      } else {
        setErrorMsg(res.message || 'خطا در ثبت هزینه');
      }
    }
  };

  const handleDeleteExpense = async (id: string, title: string) => {
    if (!window.confirm(`آیا از حذف هزینه "${title}" اطمینان دارید؟`)) return;
    const res = await apiRequest(`/accounting/expenses/${id}`, { method: 'DELETE' });
    if (res.success) {
      setSuccessMsg('هزینه با موفقیت حذف شد.');
      loadAccountingData();
      setTimeout(() => setSuccessMsg(null), 3000);
    }
  };

  // --- Cheques Actions ---
  const openAddChequeModal = () => {
    setEditingCheque(null);
    setChqNumber('');
    setChqSayad('');
    setChqBank('');
    setChqBranch('');
    setChqType('PAYABLE');
    setChqAmount('');
    // Default due date to today + 7 days
    const now = new Date();
    now.setDate(now.getDate() + 7);
    setChqDueDate(now.toISOString().split('T')[0]);
    setChqParty('');
    setChqStatus('PENDING');
    setChqDesc('');
    setShowChequeModal(true);
  };

  const openEditChequeModal = (chq: Cheque) => {
    setEditingCheque(chq);
    setChqNumber(chq.chequeNumber);
    setChqSayad(chq.sayadNumber || '');
    setChqBank(chq.bankName);
    setChqBranch(chq.branchName || '');
    setChqType(chq.type);
    setChqAmount(String(chq.amount));
    setChqDueDate(chq.dueDate ? chq.dueDate.split('T')[0] : '');
    setChqParty(chq.accountParty || '');
    setChqStatus(chq.status);
    setChqDesc(chq.description || '');
    setShowChequeModal(true);
  };

  const handleChequeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const amount = Number(chqAmount);
    if (isNaN(amount) || amount <= 0 || !chqNumber.trim() || !chqBank.trim()) {
      setErrorMsg('لطفاً شماره چک، بانک و مبلغ معتبر را وارد کنید.');
      return;
    }

    const payload = {
      chequeNumber: chqNumber.trim(),
      sayadNumber: chqSayad.trim(),
      bankName: chqBank.trim(),
      branchName: chqBranch.trim(),
      type: chqType,
      amount,
      dueDate: chqDueDate ? new Date(chqDueDate).toISOString() : new Date().toISOString(),
      accountParty: chqParty.trim(),
      status: chqStatus,
      description: chqDesc.trim(),
    };

    if (editingCheque) {
      const res = await apiRequest(`/accounting/cheques/${editingCheque.id}`, {
        method: 'PUT',
        body: JSON.stringify(payload),
      });
      if (res.success) {
        setSuccessMsg('اطلاعات چک با موفقیت به‌روزرسانی شد.');
        setShowChequeModal(false);
        loadAccountingData();
        setTimeout(() => setSuccessMsg(null), 3000);
      } else {
        setErrorMsg(res.message || 'خطا در ویرایش چک');
      }
    } else {
      const res = await apiRequest('/accounting/cheques', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
      if (res.success) {
        setSuccessMsg('چک جدید با موفقیت در سامانه ثبت گردید.');
        setShowChequeModal(false);
        loadAccountingData();
        setTimeout(() => setSuccessMsg(null), 3000);
      } else {
        setErrorMsg(res.message || 'خطا در ثبت چک');
      }
    }
  };

  const handleQuickStatusChange = async (id: string, newStatus: 'PENDING' | 'CLEARED' | 'BOUNCED' | 'CANCELLED') => {
    const res = await apiRequest(`/accounting/cheques/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status: newStatus }),
    });
    if (res.success) {
      setSuccessMsg('وضعیت چک تغییر یافت.');
      loadAccountingData();
      setTimeout(() => setSuccessMsg(null), 2500);
    }
  };

  const handleDeleteCheque = async (id: string, num: string) => {
    if (!window.confirm(`آیا از حذف چک شماره "${num}" اطمینان دارید؟`)) return;
    const res = await apiRequest(`/accounting/cheques/${id}`, { method: 'DELETE' });
    if (res.success) {
      setSuccessMsg('چک حذف شد.');
      loadAccountingData();
      setTimeout(() => setSuccessMsg(null), 2500);
    }
  };

  // --- Filtering Calculations ---
  const filteredExpenses = expenses.filter((exp) => {
    const q = expenseSearch.toLowerCase().trim();
    const matchesSearch =
      !q ||
      exp.title.toLowerCase().includes(q) ||
      (exp.recipient && exp.recipient.toLowerCase().includes(q)) ||
      (exp.notes && exp.notes.toLowerCase().includes(q));

    const matchesCat = selectedExpenseCat === 'ALL' || exp.category === selectedExpenseCat;
    return matchesSearch && matchesCat;
  });

  const totalExpensesAmount = filteredExpenses.reduce((acc, e) => acc + e.amount, 0);

  const filteredCheques = cheques.filter((chq) => {
    const q = chequeSearch.toLowerCase().trim();
    const matchesSearch =
      !q ||
      chq.chequeNumber.includes(q) ||
      (chq.sayadNumber && chq.sayadNumber.includes(q)) ||
      chq.bankName.toLowerCase().includes(q) ||
      (chq.accountParty && chq.accountParty.toLowerCase().includes(q));

    const matchesType = chequeTypeFilter === 'ALL' || chq.type === chequeTypeFilter;
    const matchesStatus = chequeStatusFilter === 'ALL' || chq.status === chequeStatusFilter;

    return matchesSearch && matchesType && matchesStatus;
  });

  // Cheque Reminders & Alerts (due within 5 days or overdue)
  const nowTime = new Date().getTime();
  const upcomingCheques = cheques.filter((chq) => {
    if (chq.status !== 'PENDING') return false;
    const dueTime = new Date(chq.dueDate).getTime();
    const diffDays = Math.ceil((dueTime - nowTime) / (1000 * 60 * 60 * 24));
    return diffDays <= 5; // Due within 5 days or overdue
  });

  const totalPendingPayableCheques = cheques
    .filter((c) => c.type === 'PAYABLE' && c.status === 'PENDING')
    .reduce((acc, c) => acc + c.amount, 0);

  const totalPendingReceivableCheques = cheques
    .filter((c) => c.type === 'RECEIVABLE' && c.status === 'PENDING')
    .reduce((acc, c) => acc + c.amount, 0);

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Top Banner Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#141414] p-6 rounded-3xl border border-white/5 shadow-xl">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center">
            <Calculator className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-black text-white">حسابداری و مدیریت مالی فروشگاه</h2>
            <p className="text-xs text-slate-400 mt-0.5">
              ثبت هزینه‌های جانبی (نایلون، حقوق، قبوض) و سررسید چک‌های صیادی پرداختی و دریافتی
            </p>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-2 bg-white/5 p-1.5 rounded-2xl border border-white/10">
          <button
            onClick={() => setActiveTab('EXPENSES')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'EXPENSES'
                ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 shadow-md shadow-amber-500/20'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <DollarSign className="w-4 h-4" />
            <span>هزینه‌های جاری فروشگاه ({toPersianDigits(expenses.length)})</span>
          </button>

          <button
            onClick={() => setActiveTab('CHEQUES')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'CHEQUES'
                ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 shadow-md shadow-amber-500/20'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <CreditCard className="w-4 h-4" />
            <span>مدیریت و سررسید چک‌ها ({toPersianDigits(cheques.length)})</span>
            {upcomingCheques.length > 0 && (
              <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
            )}
          </button>
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

      {/* ===================== TAB 1: EXPENSES ===================== */}
      {activeTab === 'EXPENSES' && (
        <div className="space-y-6">
          {/* Expenses Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-[#141414] p-4 rounded-3xl border border-white/5 shadow-sm flex items-center justify-between">
              <div>
                <div className="text-[11px] font-bold text-slate-400">مجموع هزینه‌های ثبت شده</div>
                <div className="text-lg font-black text-rose-400 mt-1 font-sans">
                  {formatCurrency(totalExpensesAmount)}
                </div>
              </div>
              <div className="w-10 h-10 rounded-2xl bg-rose-500/10 text-rose-400 flex items-center justify-center">
                <ArrowUpRight className="w-5 h-5" />
              </div>
            </div>

            <div className="bg-[#141414] p-4 rounded-3xl border border-white/5 shadow-sm flex items-center justify-between">
              <div>
                <div className="text-[11px] font-bold text-slate-400">تعداد کل ردیف هزینه‌ها</div>
                <div className="text-lg font-black text-white mt-1 font-sans">
                  {toPersianDigits(filteredExpenses.length)} <span className="text-xs font-normal text-slate-500">مورد</span>
                </div>
              </div>
              <div className="w-10 h-10 rounded-2xl bg-white/5 text-slate-300 flex items-center justify-center">
                <FileSpreadsheet className="w-5 h-5" />
              </div>
            </div>

            <div className="bg-[#141414] p-4 rounded-3xl border border-amber-500/20 shadow-sm flex items-center justify-between">
              <div>
                <div className="text-[11px] font-bold text-amber-400">بیشترین ردیف هزینه</div>
                <div className="text-sm font-black text-slate-200 mt-1">
                  نایلون، بسته‌بندی و حقوق
                </div>
              </div>
              <div className="w-10 h-10 rounded-2xl bg-amber-500/10 text-amber-400 flex items-center justify-center">
                <PieChart className="w-5 h-5" />
              </div>
            </div>
          </div>

          {/* Expenses Filter Bar & Add Button */}
          <div className="bg-[#141414] p-4 rounded-3xl border border-white/5 shadow-sm flex flex-col md:flex-row gap-3 items-center justify-between">
            <div className="relative w-full sm:w-80">
              <input
                type="text"
                value={expenseSearch}
                onChange={(e) => setExpenseSearch(e.target.value)}
                placeholder="جستجوی عنوان هزینه، طرف حساب یا یادداشت..."
                className="w-full pl-3 pr-9 py-2 bg-white/5 border border-white/10 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-hidden focus:ring-1 focus:ring-amber-500"
              />
              <Search className="w-4 h-4 text-slate-500 absolute right-3 top-2.5" />
            </div>

            <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
              <select
                value={selectedExpenseCat}
                onChange={(e) => setSelectedExpenseCat(e.target.value)}
                className="py-2 px-3 bg-white/5 border border-white/10 rounded-xl text-xs font-medium text-slate-200 focus:outline-hidden focus:ring-1 focus:ring-amber-500"
              >
                <option value="ALL" className="bg-[#181818] text-slate-200">همه دسته‌بندی‌های هزینه</option>
                {EXPENSE_CATEGORIES.map((c) => (
                  <option key={c.id} value={c.id} className="bg-[#181818] text-slate-200">
                    {c.label}
                  </option>
                ))}
              </select>

              <button
                onClick={openAddExpenseModal}
                className="flex items-center justify-center gap-2 px-4 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold rounded-xl text-xs transition-all shadow-md shadow-amber-500/20 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>ثبت هزینه جدید</span>
              </button>
            </div>
          </div>

          {/* Expenses Table */}
          <div className="bg-[#141414] rounded-3xl border border-white/5 shadow-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-right text-xs">
                <thead className="bg-white/5 border-b border-white/5 text-slate-400 font-bold">
                  <tr>
                    <th className="py-3.5 px-4">عنوان هزینه</th>
                    <th className="py-3.5 px-3">دسته‌بندی</th>
                    <th className="py-3.5 px-3">مبلغ (تومان)</th>
                    <th className="py-3.5 px-3">طرف حساب / دریافت‌کننده</th>
                    <th className="py-3.5 px-3">روش پرداخت</th>
                    <th className="py-3.5 px-3">شماره پیگیری</th>
                    <th className="py-3.5 px-3">تاریخ ثبت</th>
                    <th className="py-3.5 px-4 text-center">عملیات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 text-slate-200">
                  {filteredExpenses.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-8 text-center text-slate-500">
                        هیچ هزینه‌ای ثبت نشده است.
                      </td>
                    </tr>
                  ) : (
                    filteredExpenses.map((exp) => {
                      const catInfo = EXPENSE_CATEGORIES.find((c) => c.id === exp.category);
                      return (
                        <tr key={exp.id} className="hover:bg-white/5 transition-colors">
                          <td className="py-3 px-4 font-bold text-white">
                            <div>{exp.title}</div>
                            {exp.notes && <div className="text-[10px] text-slate-400 mt-0.5">{exp.notes}</div>}
                          </td>
                          <td className="py-3 px-3">
                            <span className="px-2 py-0.5 bg-white/5 border border-white/10 rounded-md text-[11px] text-slate-300 font-medium">
                              {catInfo ? catInfo.label : exp.category}
                            </span>
                          </td>
                          <td className="py-3 px-3 font-black text-rose-400 font-sans">
                            {formatCurrency(exp.amount)}
                          </td>
                          <td className="py-3 px-3 text-slate-300">{exp.recipient || '-'}</td>
                          <td className="py-3 px-3 text-slate-400">
                            {exp.paymentMethod === 'CARD' ? 'کارتخوان/کارت' : exp.paymentMethod === 'CASH' ? 'نقدی' : exp.paymentMethod === 'BANK_TRANSFER' ? 'حواله بانکی' : 'چک'}
                          </td>
                          <td className="py-3 px-3 font-mono text-slate-400">{exp.referenceNumber || '-'}</td>
                          <td className="py-3 px-3 text-slate-400">{formatPersianDate(exp.date || exp.createdAt, false)}</td>
                          <td className="py-3 px-4 text-center">
                            <div className="flex items-center justify-center gap-1.5">
                              <button
                                onClick={() => openEditExpenseModal(exp)}
                                className="p-1.5 text-slate-400 hover:text-amber-400 rounded-lg hover:bg-white/5 transition-colors cursor-pointer"
                                title="ویرایش هزینه"
                              >
                                <Edit className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleDeleteExpense(exp.id, exp.title)}
                                className="p-1.5 text-slate-400 hover:text-rose-400 rounded-lg hover:bg-rose-500/10 transition-colors cursor-pointer"
                                title="حذف هزینه"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
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
        </div>
      )}

      {/* ===================== TAB 2: CHEQUES ===================== */}
      {activeTab === 'CHEQUES' && (
        <div className="space-y-6">
          {/* Upcoming Due Cheques Alert Banner */}
          {upcomingCheques.length > 0 && (
            <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-3xl flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-lg">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
                  <BellRing className="w-5 h-5 animate-bounce" />
                </div>
                <div>
                  <h4 className="text-sm font-black text-amber-300">
                    یادآوری سررسید چک‌های صیادی ({toPersianDigits(upcomingCheques.length)} فقره چک نزدیک به سررسید یا معوق)
                  </h4>
                  <p className="text-xs text-slate-300 mt-0.5">
                    لطفاً نسبت به تأمین موجودی حساب برای چک‌های پرداختی یا پیگیری وصول چک‌های دریافتی اقدام فرمایید.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Cheques Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-[#141414] p-4 rounded-3xl border border-rose-500/20 shadow-sm flex items-center justify-between">
              <div>
                <div className="text-[11px] font-bold text-rose-400">مجموع چک‌های پرداختی در جریان</div>
                <div className="text-lg font-black text-rose-400 mt-1 font-sans">
                  {formatCurrency(totalPendingPayableCheques)}
                </div>
              </div>
              <div className="w-10 h-10 rounded-2xl bg-rose-500/10 text-rose-400 flex items-center justify-center">
                <ArrowUpRight className="w-5 h-5" />
              </div>
            </div>

            <div className="bg-[#141414] p-4 rounded-3xl border border-emerald-500/20 shadow-sm flex items-center justify-between">
              <div>
                <div className="text-[11px] font-bold text-emerald-400">مجموع چک‌های دریافتی در جریان</div>
                <div className="text-lg font-black text-emerald-400 mt-1 font-sans">
                  {formatCurrency(totalPendingReceivableCheques)}
                </div>
              </div>
              <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
                <ArrowDownLeft className="w-5 h-5" />
              </div>
            </div>

            <div className="bg-[#141414] p-4 rounded-3xl border border-white/5 shadow-sm flex items-center justify-between">
              <div>
                <div className="text-[11px] font-bold text-slate-400">کل فقرات چک‌ها</div>
                <div className="text-lg font-black text-white mt-1 font-sans">
                  {toPersianDigits(cheques.length)} <span className="text-xs font-normal text-slate-500">فقره</span>
                </div>
              </div>
              <div className="w-10 h-10 rounded-2xl bg-white/5 text-slate-300 flex items-center justify-center">
                <CreditCard className="w-5 h-5" />
              </div>
            </div>
          </div>

          {/* Filter & Action Bar */}
          <div className="bg-[#141414] p-4 rounded-3xl border border-white/5 shadow-sm flex flex-col md:flex-row gap-3 items-center justify-between">
            <div className="relative w-full sm:w-72">
              <input
                type="text"
                value={chequeSearch}
                onChange={(e) => setChequeSearch(e.target.value)}
                placeholder="جستجوی شماره چک، صیاد، بانک یا طرف حساب..."
                className="w-full pl-3 pr-9 py-2 bg-white/5 border border-white/10 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-hidden focus:ring-1 focus:ring-amber-500"
              />
              <Search className="w-4 h-4 text-slate-500 absolute right-3 top-2.5" />
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <select
                value={chequeTypeFilter}
                onChange={(e) => setChequeTypeFilter(e.target.value as any)}
                className="py-2 px-3 bg-white/5 border border-white/10 rounded-xl text-xs font-medium text-slate-200 focus:outline-hidden focus:ring-1 focus:ring-amber-500"
              >
                <option value="ALL" className="bg-[#181818] text-slate-200">همه انواع چک</option>
                <option value="PAYABLE" className="bg-[#181818] text-slate-200">چک‌های پرداختی (به تامین‌کنندگان)</option>
                <option value="RECEIVABLE" className="bg-[#181818] text-slate-200">چک‌های دریافتی (از مشتریان)</option>
              </select>

              <select
                value={chequeStatusFilter}
                onChange={(e) => setChequeStatusFilter(e.target.value as any)}
                className="py-2 px-3 bg-white/5 border border-white/10 rounded-xl text-xs font-medium text-slate-200 focus:outline-hidden focus:ring-1 focus:ring-amber-500"
              >
                <option value="ALL" className="bg-[#181818] text-slate-200">همه وضعیت‌ها</option>
                <option value="PENDING" className="bg-[#181818] text-slate-200">در جریان (در انتظار سررسید)</option>
                <option value="CLEARED" className="bg-[#181818] text-slate-200">پاس شده / وصول شده</option>
                <option value="BOUNCED" className="bg-[#181818] text-slate-200">برگشت خورده</option>
              </select>

              <button
                onClick={openAddChequeModal}
                className="flex items-center justify-center gap-2 px-4 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold rounded-xl text-xs transition-all shadow-md shadow-amber-500/20 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>ثبت چک جدید</span>
              </button>
            </div>
          </div>

          {/* Cheques Table */}
          <div className="bg-[#141414] rounded-3xl border border-white/5 shadow-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-right text-xs">
                <thead className="bg-white/5 border-b border-white/5 text-slate-400 font-bold">
                  <tr>
                    <th className="py-3.5 px-4">نوع</th>
                    <th className="py-3.5 px-3">شماره چک</th>
                    <th className="py-3.5 px-3">شناسه صیاد (۱۶ رقم)</th>
                    <th className="py-3.5 px-3">بانک و شعبه</th>
                    <th className="py-3.5 px-3">مبلغ چک</th>
                    <th className="py-3.5 px-3">سررسید</th>
                    <th className="py-3.5 px-3">طرف حساب</th>
                    <th className="py-3.5 px-3">وضعیت</th>
                    <th className="py-3.5 px-4 text-center">عملیات و تغییر وضعیت</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 text-slate-200">
                  {filteredCheques.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="py-8 text-center text-slate-500">
                        هیچ چکی ثبت نشده است.
                      </td>
                    </tr>
                  ) : (
                    filteredCheques.map((chq) => {
                      const isPayable = chq.type === 'PAYABLE';
                      const dueTime = new Date(chq.dueDate).getTime();
                      const isDueSoon = chq.status === 'PENDING' && (dueTime - nowTime) <= 5 * 24 * 3600 * 1000;
                      const isOverdue = chq.status === 'PENDING' && dueTime < nowTime;

                      return (
                        <tr key={chq.id} className={`hover:bg-white/5 transition-colors ${isDueSoon ? 'bg-amber-500/5' : ''}`}>
                          <td className="py-3 px-4">
                            <span
                              className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full font-bold text-[10.5px] ${
                                isPayable
                                  ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                                  : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                              }`}
                            >
                              {isPayable ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownLeft className="w-3 h-3" />}
                              <span>{isPayable ? 'پرداختی' : 'دریافتی'}</span>
                            </span>
                          </td>
                          <td className="py-3 px-3 font-mono font-bold text-white">{chq.chequeNumber}</td>
                          <td className="py-3 px-3 font-mono text-slate-400">{chq.sayadNumber || '-'}</td>
                          <td className="py-3 px-3 text-slate-300">
                            <div>{chq.bankName}</div>
                            {chq.branchName && <div className="text-[10px] text-slate-500">شعبه {chq.branchName}</div>}
                          </td>
                          <td className="py-3 px-3 font-black text-amber-300 font-sans">
                            {formatCurrency(chq.amount)}
                          </td>
                          <td className="py-3 px-3">
                            <div className="font-sans font-bold text-slate-200">
                              {formatPersianDate(chq.dueDate, false)}
                            </div>
                            {isOverdue ? (
                              <div className="text-[10px] text-rose-400 font-bold flex items-center gap-0.5">
                                <AlertTriangle className="w-3 h-3" />
                                <span>سررسید گذشته</span>
                              </div>
                            ) : isDueSoon ? (
                              <div className="text-[10px] text-amber-400 font-bold flex items-center gap-0.5">
                                <Clock className="w-3 h-3" />
                                <span>سررسید نزدیک</span>
                              </div>
                            ) : null}
                          </td>
                          <td className="py-3 px-3 text-slate-300">{chq.accountParty || '-'}</td>
                          <td className="py-3 px-3">
                            <span
                              className={`px-2 py-0.5 rounded-full font-bold text-[10.5px] ${
                                chq.status === 'CLEARED'
                                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                  : chq.status === 'BOUNCED'
                                  ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                                  : chq.status === 'CANCELLED'
                                  ? 'bg-slate-500/10 text-slate-400 border border-slate-500/20'
                                  : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                              }`}
                            >
                              {chq.status === 'CLEARED'
                                ? 'پاس شده'
                                : chq.status === 'BOUNCED'
                                ? 'برگشت خورده'
                                : chq.status === 'CANCELLED'
                                ? 'ابطال شده'
                                : 'در جریان'}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-center">
                            <div className="flex items-center justify-center gap-1">
                              {chq.status === 'PENDING' && (
                                <>
                                  <button
                                    onClick={() => handleQuickStatusChange(chq.id, 'CLEARED')}
                                    className="px-2 py-1 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 rounded-lg text-[10.5px] font-bold cursor-pointer transition-colors"
                                    title="ثبت به عنوان پاس / وصول شده"
                                  >
                                    پاس شد
                                  </button>
                                  <button
                                    onClick={() => handleQuickStatusChange(chq.id, 'BOUNCED')}
                                    className="px-2 py-1 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 rounded-lg text-[10.5px] font-bold cursor-pointer transition-colors"
                                    title="ثبت به عنوان برگشت خورده"
                                  >
                                    برگشت
                                  </button>
                                </>
                              )}
                              <button
                                onClick={() => openEditChequeModal(chq)}
                                className="p-1.5 text-slate-400 hover:text-amber-400 rounded-lg hover:bg-white/5 transition-colors cursor-pointer"
                                title="ویرایش مشخصات چک"
                              >
                                <Edit className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleDeleteCheque(chq.id, chq.chequeNumber)}
                                className="p-1.5 text-slate-400 hover:text-rose-400 rounded-lg hover:bg-rose-500/10 transition-colors cursor-pointer"
                                title="حذف چک"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
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
        </div>
      )}

      {/* ===================== MODALS ===================== */}

      {/* Expense Modal */}
      {showExpenseModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[#141414] rounded-3xl p-6 shadow-2xl border border-white/10 w-full max-w-md space-y-4 text-right">
            <div className="flex items-center justify-between border-b border-white/5 pb-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-amber-400" />
                <span>{editingExpense ? 'ویرایش هزینه جاری' : 'ثبت هزینه جانبی جدید'}</span>
              </h3>
              <button onClick={() => setShowExpenseModal(false)} className="text-slate-400 hover:text-white cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleExpenseSubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">عنوان هزینه *</label>
                <input
                  type="text"
                  required
                  value={expTitle}
                  onChange={(e) => setExpTitle(e.target.value)}
                  placeholder="مثال: خرید نایلون دسته‌دار، حقوق شاگرد..."
                  className="w-full p-2.5 bg-white/5 border border-white/10 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-hidden focus:ring-1 focus:ring-amber-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">مبلغ هزینه (تومان) *</label>
                  <input
                    type="number"
                    min="1000"
                    step="1000"
                    required
                    value={expAmount}
                    onChange={(e) => setExpAmount(e.target.value)}
                    placeholder="مثال: ۵۰۰,۰۰۰"
                    className="w-full p-2.5 bg-white/5 border border-white/10 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-hidden focus:ring-1 focus:ring-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">دسته‌بندی هزینه</label>
                  <select
                    value={expCategory}
                    onChange={(e) => setExpCategory(e.target.value)}
                    className="w-full p-2.5 bg-[#181818] border border-white/10 rounded-xl text-xs text-white focus:outline-hidden focus:ring-1 focus:ring-amber-500"
                  >
                    {EXPENSE_CATEGORIES.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">روش پرداخت</label>
                  <select
                    value={expPaymentMethod}
                    onChange={(e) => setExpPaymentMethod(e.target.value as any)}
                    className="w-full p-2.5 bg-[#181818] border border-white/10 rounded-xl text-xs text-white focus:outline-hidden focus:ring-1 focus:ring-amber-500"
                  >
                    <option value="CARD">کارت به کارت / پوز</option>
                    <option value="CASH">نقدی از صندوق</option>
                    <option value="BANK_TRANSFER">حواله پایا / ساتنا</option>
                    <option value="CHEQUE">چک</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">طرف حساب / دریافت کننده</label>
                  <input
                    type="text"
                    value={expRecipient}
                    onChange={(e) => setExpRecipient(e.target.value)}
                    placeholder="نام شخص یا شرکت"
                    className="w-full p-2.5 bg-white/5 border border-white/10 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-hidden focus:ring-1 focus:ring-amber-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">شماره ارجاع / فیش</label>
                <input
                  type="text"
                  value={expRef}
                  onChange={(e) => setExpRef(e.target.value)}
                  placeholder="شماره پیگیری واریز یا فاکتور..."
                  className="w-full p-2.5 bg-white/5 border border-white/10 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-hidden focus:ring-1 focus:ring-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">توضیحات تکمیلی</label>
                <textarea
                  rows={2}
                  value={expNotes}
                  onChange={(e) => setExpNotes(e.target.value)}
                  placeholder="شرح جزئیات هزینه..."
                  className="w-full p-2.5 bg-white/5 border border-white/10 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-hidden focus:ring-1 focus:ring-amber-500"
                />
              </div>

              <div className="flex gap-2 pt-3 border-t border-white/5">
                <button
                  type="button"
                  onClick={() => setShowExpenseModal(false)}
                  className="flex-1 py-2.5 bg-white/5 hover:bg-white/10 text-slate-300 rounded-xl text-xs font-bold border border-white/5 cursor-pointer"
                >
                  انصراف
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 rounded-xl text-xs font-bold shadow-md shadow-amber-500/20 cursor-pointer"
                >
                  {editingExpense ? 'ذخیره تغییرات' : 'ثبت هزینه'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Cheque Modal */}
      {showChequeModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[#141414] rounded-3xl p-6 shadow-2xl border border-white/10 w-full max-w-lg space-y-4 text-right max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-white/5 pb-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-amber-400" />
                <span>{editingCheque ? 'ویرایش اطلاعات چک صیادی' : 'ثبت چک صیادی جدید'}</span>
              </h3>
              <button onClick={() => setShowChequeModal(false)} className="text-slate-400 hover:text-white cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleChequeSubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">نوع چک *</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setChqType('PAYABLE')}
                    className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                      chqType === 'PAYABLE'
                        ? 'bg-rose-500/20 border-rose-500 text-rose-300'
                        : 'bg-white/5 border-white/10 text-slate-400'
                    }`}
                  >
                    <ArrowUpRight className="w-4 h-4 text-rose-400" />
                    <span>چک پرداختی (صادره توسط ما)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setChqType('RECEIVABLE')}
                    className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                      chqType === 'RECEIVABLE'
                        ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300'
                        : 'bg-white/5 border-white/10 text-slate-400'
                    }`}
                  >
                    <ArrowDownLeft className="w-4 h-4 text-emerald-400" />
                    <span>چک دریافتی (از مشتریان)</span>
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">شماره سریال چک *</label>
                  <input
                    type="text"
                    required
                    value={chqNumber}
                    onChange={(e) => setChqNumber(e.target.value)}
                    placeholder="مثال: ۱۲۳۴۵۶"
                    className="w-full p-2.5 bg-white/5 border border-white/10 rounded-xl text-xs text-white focus:outline-hidden focus:ring-1 focus:ring-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">شناسه ۱۶ رقمی صیاد</label>
                  <input
                    type="text"
                    maxLength={16}
                    value={chqSayad}
                    onChange={(e) => setChqSayad(e.target.value)}
                    placeholder="۱۶ رقم صیادی"
                    className="w-full p-2.5 bg-white/5 border border-white/10 rounded-xl text-xs text-white font-mono focus:outline-hidden focus:ring-1 focus:ring-amber-500 text-left"
                    dir="ltr"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">نام بانک صادرکننده *</label>
                  <input
                    type="text"
                    required
                    value={chqBank}
                    onChange={(e) => setChqBank(e.target.value)}
                    placeholder="مثال: ملی، ملت، صادرات..."
                    className="w-full p-2.5 bg-white/5 border border-white/10 rounded-xl text-xs text-white focus:outline-hidden focus:ring-1 focus:ring-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">نام یا کد شعبه</label>
                  <input
                    type="text"
                    value={chqBranch}
                    onChange={(e) => setChqBranch(e.target.value)}
                    placeholder="مثال: شعبه بازار کد ۱۲۳"
                    className="w-full p-2.5 bg-white/5 border border-white/10 rounded-xl text-xs text-white focus:outline-hidden focus:ring-1 focus:ring-amber-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">مبلغ چک (تومان) *</label>
                  <input
                    type="number"
                    min="1000"
                    step="1000"
                    required
                    value={chqAmount}
                    onChange={(e) => setChqAmount(e.target.value)}
                    placeholder="مبلغ به تومان"
                    className="w-full p-2.5 bg-white/5 border border-white/10 rounded-xl text-xs text-white focus:outline-hidden focus:ring-1 focus:ring-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">تاریخ سررسید چک *</label>
                  <input
                    type="date"
                    required
                    value={chqDueDate}
                    onChange={(e) => setChqDueDate(e.target.value)}
                    className="w-full p-2.5 bg-white/5 border border-white/10 rounded-xl text-xs text-white focus:outline-hidden focus:ring-1 focus:ring-amber-500 text-left font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">در وجه / طرف حساب</label>
                  <input
                    type="text"
                    value={chqParty}
                    onChange={(e) => setChqParty(e.target.value)}
                    placeholder="نام تامین‌کننده یا خریدار..."
                    className="w-full p-2.5 bg-white/5 border border-white/10 rounded-xl text-xs text-white focus:outline-hidden focus:ring-1 focus:ring-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">وضعیت چک</label>
                  <select
                    value={chqStatus}
                    onChange={(e) => setChqStatus(e.target.value as any)}
                    className="w-full p-2.5 bg-[#181818] border border-white/10 rounded-xl text-xs text-white focus:outline-hidden focus:ring-1 focus:ring-amber-500"
                  >
                    <option value="PENDING">در جریان (در انتظار سررسید)</option>
                    <option value="CLEARED">پاس شده / وصول شده</option>
                    <option value="BOUNCED">برگشت خورده</option>
                    <option value="CANCELLED">ابطال شده</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">بابت / توضیحات چک</label>
                <input
                  type="text"
                  value={chqDesc}
                  onChange={(e) => setChqDesc(e.target.value)}
                  placeholder="بابت خرید پسته، نایلون..."
                  className="w-full p-2.5 bg-white/5 border border-white/10 rounded-xl text-xs text-white focus:outline-hidden focus:ring-1 focus:ring-amber-500"
                />
              </div>

              <div className="flex gap-2 pt-3 border-t border-white/5">
                <button
                  type="button"
                  onClick={() => setShowChequeModal(false)}
                  className="flex-1 py-2.5 bg-white/5 hover:bg-white/10 text-slate-300 rounded-xl text-xs font-bold border border-white/5 cursor-pointer"
                >
                  انصراف
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 rounded-xl text-xs font-bold shadow-md shadow-amber-500/20 cursor-pointer"
                >
                  {editingCheque ? 'ذخیره تغییرات' : 'ثبت نهایی چک'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
