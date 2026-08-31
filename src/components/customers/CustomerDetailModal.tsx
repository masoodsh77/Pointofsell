import React, { useState, useEffect } from 'react';
import { Customer, Sale, CustomerTransaction, StoreSettings } from '../../types';
import { apiRequest } from '../../services/api';
import {
  formatCurrency,
  formatPersianDate,
  formatWeightOrQuantity,
  getPaymentMethodLabel,
  toPersianDigits
} from '../../utils/persian';
import { printReceipt } from '../../utils/printReceipt';
import {
  FileText,
  CreditCard,
  Plus,
  Printer,
  Calendar,
  DollarSign,
  TrendingDown,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  X,
  User,
  Phone,
  MapPin,
  Tag,
  ArrowDownLeft,
  ArrowUpRight
} from 'lucide-react';

interface CustomerDetailModalProps {
  customer: Customer;
  settings: StoreSettings | null;
  onClose: () => void;
  onCustomerUpdated: () => void;
}

export const CustomerDetailModal: React.FC<CustomerDetailModalProps> = ({
  customer,
  settings,
  onClose,
  onCustomerUpdated,
}) => {
  const [activeTab, setActiveTab] = useState<'INVOICES' | 'TRANSACTIONS' | 'SETTLE'>('INVOICES');
  const [invoices, setInvoices] = useState<Sale[]>([]);
  const [transactions, setTransactions] = useState<CustomerTransaction[]>([]);
  const [creditBalance, setCreditBalance] = useState<number>(customer.creditBalance || 0);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Settlement Form State
  const [txType, setTxType] = useState<'PAYMENT' | 'DEBT_ADD'>('PAYMENT');
  const [txAmount, setTxAmount] = useState<string>('');
  const [txMethod, setTxMethod] = useState<'CASH' | 'CARD' | 'BANK_TRANSFER' | 'CHEQUE'>('CASH');
  const [txDesc, setTxDesc] = useState<string>('');
  const [txRef, setTxRef] = useState<string>('');
  const [isSubmittingTx, setIsSubmittingTx] = useState<boolean>(false);
  const [txMessage, setTxMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const loadData = async () => {
    setIsLoading(true);
    const [invRes, txRes] = await Promise.all([
      apiRequest<{ invoices: Sale[] }>(`/customers/${customer.id}/invoices`),
      apiRequest<{ transactions: CustomerTransaction[]; creditBalance: number }>(`/customers/${customer.id}/transactions`),
    ]);

    if (invRes.success && invRes.data) {
      setInvoices(invRes.data.invoices);
    }
    if (txRes.success && txRes.data) {
      setTransactions(txRes.data.transactions || []);
      setCreditBalance(txRes.data.creditBalance || 0);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    loadData();
  }, [customer.id]);

  const handleSettleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const amount = Number(txAmount);
    if (isNaN(amount) || amount <= 0) {
      setTxMessage({ type: 'error', text: 'لطفاً مبلغ معتبری وارد کنید.' });
      return;
    }

    setIsSubmittingTx(true);
    setTxMessage(null);

    const res = await apiRequest(`/customers/${customer.id}/transactions`, {
      method: 'POST',
      body: JSON.stringify({
        type: txType,
        amount,
        paymentMethod: txMethod,
        description: txDesc || (txType === 'PAYMENT' ? 'دریافت وجه و تسویه حساب' : 'ثبت بدهی جدید'),
        referenceId: txRef,
      }),
    });

    setIsSubmittingTx(false);

    if (res.success) {
      setTxMessage({ type: 'success', text: 'تراکنش مالی با موفقیت ثبت و تراز حساب مشتری به‌روزرسانی شد.' });
      setTxAmount('');
      setTxDesc('');
      setTxRef('');
      loadData();
      onCustomerUpdated();
    } else {
      setTxMessage({ type: 'error', text: res.message || 'خطا در ثبت تراکنش' });
    }
  };

  const isDebtor = creditBalance < 0;
  const isCreditor = creditBalance > 0;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-[#141414] rounded-3xl shadow-2xl border border-white/10 w-full max-w-4xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header Profile */}
        <div className="px-6 py-5 bg-white/5 border-b border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center font-black text-base">
              <User className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-black text-white">{customer.name}</h3>
                {(customer.fixedDiscountPercent || 0) > 0 && (
                  <span className="px-2 py-0.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-full text-[10px] font-bold">
                    {toPersianDigits(customer.fixedDiscountPercent)}% تخفیف ثابت
                  </span>
                )}
                {(customer.fixedDiscountAmount || 0) > 0 && (
                  <span className="px-2 py-0.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-full text-[10px] font-bold">
                    {formatCurrency(customer.fixedDiscountAmount)} تخفیف ثابت
                  </span>
                )}
              </div>
              <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400 mt-1">
                {customer.phone && (
                  <span className="flex items-center gap-1">
                    <Phone className="w-3.5 h-3.5 text-slate-500" />
                    <span className="font-mono">{customer.phone}</span>
                  </span>
                )}
                {customer.address && (
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-slate-500" />
                    <span>{customer.address}</span>
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Balance Badge */}
            <div
              className={`px-4 py-2 rounded-2xl border flex flex-col items-end ${
                isDebtor
                  ? 'bg-rose-500/10 border-rose-500/20 text-rose-400'
                  : isCreditor
                  ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                  : 'bg-white/5 border-white/10 text-slate-400'
              }`}
            >
              <span className="text-[10px] font-medium text-slate-400">وضعیت تراز حساب:</span>
              <span className="text-sm font-black font-sans">
                {creditBalance === 0
                  ? 'تسویه (بی‌حساب)'
                  : isDebtor
                  ? `بدهکار: ${formatCurrency(Math.abs(creditBalance))}`
                  : `بستانکار: ${formatCurrency(creditBalance)}`}
              </span>
            </div>

            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-white/10 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="px-6 py-2.5 bg-white/2 border-b border-white/10 flex gap-2">
          <button
            onClick={() => setActiveTab('INVOICES')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'INVOICES'
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>فاکتورهای خرید ({toPersianDigits(invoices.length)})</span>
          </button>

          <button
            onClick={() => setActiveTab('TRANSACTIONS')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'TRANSACTIONS'
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <CreditCard className="w-4 h-4" />
            <span>گردش حساب و پرداخت‌ها ({toPersianDigits(transactions.length)})</span>
          </button>

          <button
            onClick={() => setActiveTab('SETTLE')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'SETTLE'
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Plus className="w-4 h-4" />
            <span>ثبت دریافت وجه / تسویه بدهی</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto flex-1">
          {isLoading ? (
            <div className="py-12 text-center text-slate-500 text-xs">در حال بارگذاری اطلاعات...</div>
          ) : activeTab === 'INVOICES' ? (
            /* ================= INVOICES TAB ================= */
            <div className="space-y-4">
              {invoices.length === 0 ? (
                <div className="py-12 text-center text-slate-500 text-xs">
                  تاکنون فاکتور فروشی برای این مشتری ثبت نشده است.
                </div>
              ) : (
                <div className="border border-white/5 rounded-2xl overflow-hidden bg-[#0d0d0d]">
                  <table className="w-full text-right text-xs">
                    <thead className="bg-white/5 border-b border-white/5 text-slate-400 font-bold">
                      <tr>
                        <th className="p-3">شماره فاکتور</th>
                        <th className="p-3">تاریخ ثبت</th>
                        <th className="p-3">صندوق‌دار</th>
                        <th className="p-3">تعداد اقلام</th>
                        <th className="p-3">تخفیف</th>
                        <th className="p-3">مبلغ نهایی</th>
                        <th className="p-3">روش پرداخت</th>
                        <th className="p-3 text-center">عملیات</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {invoices.map((inv) => (
                        <tr key={inv.id} className="hover:bg-white/5 transition-colors">
                          <td className="p-3 font-mono font-bold text-white">{inv.invoiceNumber}</td>
                          <td className="p-3 text-slate-400">{formatPersianDate(inv.createdAt, true)}</td>
                          <td className="p-3 text-slate-300">{inv.sellerName}</td>
                          <td className="p-3 text-slate-400">{toPersianDigits(inv.items.length)} قلم</td>
                          <td className="p-3 text-rose-400 font-sans">
                            {inv.discount > 0 ? formatCurrency(inv.discount) : '-'}
                          </td>
                          <td className="p-3 font-bold font-sans text-amber-300">
                            {formatCurrency(inv.finalAmount)}
                          </td>
                          <td className="p-3 text-slate-300">
                            <span className="px-2 py-0.5 bg-white/5 border border-white/10 rounded-md text-[11px]">
                              {getPaymentMethodLabel(inv.paymentMethod)}
                            </span>
                          </td>
                          <td className="p-3 text-center">
                            <button
                              onClick={() => printReceipt(inv, settings)}
                              className="p-1.5 bg-white/5 hover:bg-amber-500/20 text-slate-300 hover:text-amber-300 rounded-lg transition-colors cursor-pointer"
                              title="چاپ مجدد فاکتور"
                            >
                              <Printer className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          ) : activeTab === 'TRANSACTIONS' ? (
            /* ================= TRANSACTIONS TAB ================= */
            <div className="space-y-4">
              {transactions.length === 0 ? (
                <div className="py-12 text-center text-slate-500 text-xs">
                  هنوز هیچ تراکنش مالی برای این مشتری ثبت نشده است.
                </div>
              ) : (
                <div className="border border-white/5 rounded-2xl overflow-hidden bg-[#0d0d0d]">
                  <table className="w-full text-right text-xs">
                    <thead className="bg-white/5 border-b border-white/5 text-slate-400 font-bold">
                      <tr>
                        <th className="p-3">نوع تراکنش</th>
                        <th className="p-3">مبلغ</th>
                        <th className="p-3">شرح و توضیحات</th>
                        <th className="p-3">روش پرداخت</th>
                        <th className="p-3">شماره پیگیری</th>
                        <th className="p-3">تاریخ و زمان</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {transactions.map((tx) => {
                        const isPayment = tx.type === 'PAYMENT' || tx.type === 'DEBT_SETTLE';
                        return (
                          <tr key={tx.id} className="hover:bg-white/5 transition-colors">
                            <td className="p-3">
                              <span
                                className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full font-bold text-[10.5px] ${
                                  isPayment
                                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                    : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                                }`}
                              >
                                {isPayment ? <ArrowDownLeft className="w-3.5 h-3.5" /> : <ArrowUpRight className="w-3.5 h-3.5" />}
                                <span>{isPayment ? 'دریافت وجه / کاهش بدهی' : 'افزایش بدهی'}</span>
                              </span>
                            </td>
                            <td className="p-3 font-bold font-sans">
                              <span className={isPayment ? 'text-emerald-400' : 'text-rose-400'}>
                                {isPayment ? '+' : '-'} {formatCurrency(tx.amount)}
                              </span>
                            </td>
                            <td className="p-3 text-slate-300">{tx.description || '-'}</td>
                            <td className="p-3 text-slate-400 font-medium">
                              {getPaymentMethodLabel(tx.paymentMethod as any)}
                            </td>
                            <td className="p-3 font-mono text-slate-400">{tx.referenceId || '-'}</td>
                            <td className="p-3 text-slate-400">{formatPersianDate(tx.date || tx.createdAt, true)}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          ) : (
            /* ================= SETTLEMENT FORM TAB ================= */
            <form onSubmit={handleSettleSubmit} className="max-w-xl mx-auto space-y-4 bg-white/5 p-6 rounded-2xl border border-white/10">
              <div className="text-sm font-bold text-white flex items-center gap-2 mb-2">
                <DollarSign className="w-5 h-5 text-emerald-400" />
                <span>ثبت دریافت وجه، تسویه حساب یا تعدیل بدهی مشتری</span>
              </div>

              {txMessage && (
                <div
                  className={`p-3 rounded-xl text-xs flex items-center gap-2 border ${
                    txMessage.type === 'success'
                      ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-300'
                      : 'bg-rose-500/10 border-rose-500/20 text-rose-300'
                  }`}
                >
                  {txMessage.type === 'success' ? (
                    <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                  )}
                  <span>{txMessage.text}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">نوع عملیات مالی:</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setTxType('PAYMENT')}
                    className={`py-2.5 px-3 rounded-xl border text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                      txType === 'PAYMENT'
                        ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300 shadow-sm'
                        : 'bg-white/5 border-white/10 text-slate-400 hover:bg-white/10'
                    }`}
                  >
                    <ArrowDownLeft className="w-4 h-4 text-emerald-400" />
                    <span>دریافت وجه (تسویه/کاهش بدهی)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setTxType('DEBT_ADD')}
                    className={`py-2.5 px-3 rounded-xl border text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                      txType === 'DEBT_ADD'
                        ? 'bg-rose-500/20 border-rose-500 text-rose-300 shadow-sm'
                        : 'bg-white/5 border-white/10 text-slate-400 hover:bg-white/10'
                    }`}
                  >
                    <ArrowUpRight className="w-4 h-4 text-rose-400" />
                    <span>افزایش بدهی (خرید نسیه دستی)</span>
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  مبلغ تراکنش (تومان): <span className="text-rose-400">*</span>
                </label>
                <input
                  type="number"
                  min="1000"
                  step="1000"
                  value={txAmount}
                  onChange={(e) => setTxAmount(e.target.value)}
                  placeholder="مثلاً ۱۰۰,۰۰۰"
                  className="w-full p-2.5 bg-[#181818] border border-white/10 rounded-xl text-sm font-bold text-white focus:border-amber-500 outline-none"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">روش پرداخت:</label>
                  <select
                    value={txMethod}
                    onChange={(e) => setTxMethod(e.target.value as any)}
                    className="w-full p-2.5 bg-[#181818] border border-white/10 rounded-xl text-xs text-white focus:border-amber-500 outline-none"
                  >
                    <option value="CASH">نقدی</option>
                    <option value="CARD">کارتخوان بانکی (POS)</option>
                    <option value="BANK_TRANSFER">کارت به کارت / حواله پایا</option>
                    <option value="CHEQUE">چک صیادی</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">شماره پیگیری / ارجاع:</label>
                  <input
                    type="text"
                    value={txRef}
                    onChange={(e) => setTxRef(e.target.value)}
                    placeholder="شماره فیش یا پیگیری کارتخوان"
                    className="w-full p-2.5 bg-[#181818] border border-white/10 rounded-xl text-xs text-white focus:border-amber-500 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">بابت / توضیحات:</label>
                <input
                  type="text"
                  value={txDesc}
                  onChange={(e) => setTxDesc(e.target.value)}
                  placeholder={txType === 'PAYMENT' ? 'تسویه بدهی فاکتورهای قبلی' : 'خرید نسیه یا ثبت بدهی'}
                  className="w-full p-2.5 bg-[#181818] border border-white/10 rounded-xl text-xs text-white focus:border-amber-500 outline-none"
                />
              </div>

              <button
                type="submit"
                disabled={isSubmittingTx}
                className="w-full py-3 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-slate-950 font-bold rounded-xl text-xs transition-colors cursor-pointer flex items-center justify-center gap-2 shadow-md shadow-emerald-500/20 disabled:opacity-50"
              >
                {isSubmittingTx ? (
                  <span>در حال ثبت تراکنش...</span>
                ) : (
                  <>
                    <CheckCircle className="w-4 h-4" />
                    <span>ثبت نهایی تراکنش مالی</span>
                  </>
                )}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
