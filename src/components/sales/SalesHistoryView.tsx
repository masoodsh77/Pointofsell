import React, { useState, useEffect } from 'react';
import { Sale, StoreSettings } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { apiRequest } from '../../services/api';
import {
  formatCurrency,
  formatPersianDate,
  formatWeightOrQuantity,
  getPaymentMethodLabel,
  toPersianDigits
} from '../../utils/persian';
import { ReceiptModal } from '../pos/ReceiptModal';
import {
  Receipt,
  Search,
  Printer,
  Eye,
  RotateCcw,
  AlertCircle,
  CheckCircle,
  X,
  User,
  CreditCard
} from 'lucide-react';

interface SalesHistoryViewProps {
  settings: StoreSettings | null;
  onRefreshData?: () => void;
}

export const SalesHistoryView: React.FC<SalesHistoryViewProps> = ({ settings, onRefreshData }) => {
  const { isAdmin } = useAuth();
  const [sales, setSales] = useState<Sale[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  // Selected Sale for Detailed View or Reprint
  const [selectedSaleForDetails, setSelectedSaleForDetails] = useState<Sale | null>(null);
  const [receiptSaleToPrint, setReceiptSaleToPrint] = useState<Sale | null>(null);

  // Cancellation Modal
  const [showCancelModal, setShowCancelModal] = useState<boolean>(false);
  const [saleToCancel, setSaleToCancel] = useState<Sale | null>(null);
  const [cancelReason, setCancelReason] = useState<string>('');

  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const loadSales = async () => {
    const res = await apiRequest<Sale[]>('/sales');
    if (res.success && res.data) {
      setSales(res.data);
    }
  };

  useEffect(() => {
    loadSales();
  }, []);

  const openCancelModal = (sale: Sale) => {
    setSaleToCancel(sale);
    setCancelReason('مرجوعی کالا توسط مشتری و عودت وجه');
    setShowCancelModal(true);
  };

  const handleCancelSale = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!saleToCancel) return;

    setErrorMsg(null);
    const res = await apiRequest(`/sales/${saleToCancel.id}/cancel`, {
      method: 'POST',
      body: JSON.stringify({ reason: cancelReason }),
    });

    if (res.success) {
      setSuccessMsg(`فاکتور ${saleToCancel.invoiceNumber} ابطال شد و کلیه اقلام به موجودی انبار بازگردانده شدند.`);
      setShowCancelModal(false);
      loadSales();
      if (onRefreshData) onRefreshData();
      setTimeout(() => setSuccessMsg(null), 4000);
    } else {
      setErrorMsg(res.message || 'خطا در ابطال فاکتور');
    }
  };

  const filteredSales = sales.filter((s) => {
    const matchesStatus = statusFilter === 'ALL' || s.status === statusFilter;
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !q ||
      s.invoiceNumber.toLowerCase().includes(q) ||
      (s.customerName && s.customerName.toLowerCase().includes(q)) ||
      s.sellerName.toLowerCase().includes(q);
    return matchesStatus && matchesSearch;
  });

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#141414] p-6 rounded-3xl border border-white/5 shadow-xl">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center">
            <Receipt className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-black text-white">سوابق فاکتورهای فروش</h2>
            <p className="text-xs text-slate-400 mt-0.5">
              مشاهده، چاپ مجدد، بررسی جزئیات و ابطال/مرجوعی فاکتورهای صادر شده
            </p>
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

      {/* Filters */}
      <div className="bg-[#141414] p-4 rounded-3xl border border-white/5 shadow-sm flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:w-80">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="جستجوی شماره فاکتور، مشتری، صندوق‌دار..."
            className="w-full pl-3 pr-9 py-2 bg-white/5 border border-white/10 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-hidden focus:ring-1 focus:ring-amber-500"
          />
          <Search className="w-4 h-4 text-slate-500 absolute right-3 top-2.5" />
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="py-2 px-3 bg-white/5 border border-white/10 rounded-xl text-xs font-medium text-slate-200 w-full sm:w-auto focus:outline-hidden focus:ring-1 focus:ring-amber-500"
        >
          <option value="ALL" className="bg-[#181818] text-slate-200">همه وضعیت‌ها</option>
          <option value="COMPLETED" className="bg-[#181818] text-slate-200">موفق (تسویه شده)</option>
          <option value="CANCELLED" className="bg-[#181818] text-slate-200">ابطال شده (مرجوعی)</option>
        </select>
      </div>

      {/* Sales Invoices Table */}
      <div className="bg-[#141414] rounded-3xl border border-white/5 shadow-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead className="bg-white/5 border-b border-white/5 text-slate-400 font-bold">
              <tr>
                <th className="py-3.5 px-4">شماره فاکتور</th>
                <th className="py-3.5 px-3">تاریخ و ساعت</th>
                <th className="py-3.5 px-3">نام مشتری</th>
                <th className="py-3.5 px-3">صندوق‌دار</th>
                <th className="py-3.5 px-3">روش پرداخت</th>
                <th className="py-3.5 px-3">مبلغ کل فاکتور</th>
                {isAdmin && <th className="py-3.5 px-3">سود فاکتور</th>}
                <th className="py-3.5 px-3">وضعیت</th>
                <th className="py-3.5 px-4 text-center">عملیات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filteredSales.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-slate-500">
                    هیچ فاکتوری یافت نشد.
                  </td>
                </tr>
              ) : (
                filteredSales.map((sale) => {
                  const isCancelled = sale.status === 'CANCELLED';
                  return (
                    <tr
                      key={sale.id}
                      className={`hover:bg-white/5 transition-colors ${
                        isCancelled ? 'bg-rose-500/5 text-slate-500' : ''
                      }`}
                    >
                      <td className="py-3 px-4 font-bold text-white font-mono">
                        {sale.invoiceNumber}
                      </td>
                      <td className="py-3 px-3 text-slate-400 font-mono text-[11px]">
                        {formatPersianDate(sale.createdAt, true)}
                      </td>
                      <td className="py-3 px-3 font-semibold text-slate-200">
                        {sale.customerName || 'عمومی'}
                      </td>
                      <td className="py-3 px-3 text-slate-400">{sale.sellerName}</td>
                      <td className="py-3 px-3">
                        <span className="inline-flex items-center gap-1 text-[11px] text-slate-300 font-medium">
                          <CreditCard className="w-3.5 h-3.5 text-slate-500" />
                          {getPaymentMethodLabel(sale.paymentMethod)}
                        </span>
                      </td>
                      <td className="py-3 px-3 font-black text-amber-400 font-sans">
                        {formatCurrency(sale.finalAmount)}
                      </td>
                      {isAdmin && (
                        <td className="py-3 px-3 font-bold text-emerald-400 font-sans">
                          {isCancelled ? '-' : formatCurrency(sale.profit || 0)}
                        </td>
                      )}
                      <td className="py-3 px-3">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                            isCancelled
                              ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                              : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                          }`}
                        >
                          {isCancelled ? 'ابطال شده' : 'ثبت قطعی'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            id={`view-invoice-${sale.id}`}
                            onClick={() => setSelectedSaleForDetails(sale)}
                            className="p-1.5 text-slate-400 hover:text-amber-400 rounded-lg hover:bg-white/5 transition-colors cursor-pointer"
                            title="مشاهده اقلام فاکتور"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            id={`reprint-invoice-${sale.id}`}
                            onClick={() => setReceiptSaleToPrint(sale)}
                            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-white/5 transition-colors cursor-pointer"
                            title="چاپ مجدد رسید"
                          >
                            <Printer className="w-4 h-4" />
                          </button>
                          {!isCancelled && isAdmin && (
                            <button
                              id={`cancel-invoice-${sale.id}`}
                              onClick={() => openCancelModal(sale)}
                              className="p-1.5 text-slate-400 hover:text-rose-400 rounded-lg hover:bg-rose-500/10 transition-colors cursor-pointer"
                              title="ابطال و برگشت کالا به انبار"
                            >
                              <RotateCcw className="w-4 h-4" />
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

      {/* Modal: View Details */}
      {selectedSaleForDetails && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[#141414] rounded-3xl p-6 shadow-2xl border border-white/10 w-full max-w-lg max-h-[90vh] overflow-y-auto space-y-4 text-right">
            <div className="flex items-center justify-between border-b border-white/5 pb-3">
              <div className="flex items-center gap-2">
                <Receipt className="w-5 h-5 text-amber-400" />
                <h3 className="text-sm font-bold text-white">
                  جزئیات فاکتور شماره {selectedSaleForDetails.invoiceNumber}
                </h3>
              </div>
              <button
                onClick={() => setSelectedSaleForDetails(null)}
                className="text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between text-slate-400">
                <span>تاریخ و ساعت:</span>
                <span className="text-slate-200 font-mono">{formatPersianDate(selectedSaleForDetails.createdAt, true)}</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>صندوق‌دار:</span>
                <span className="text-slate-200">{selectedSaleForDetails.sellerName}</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>مشتری:</span>
                <span className="text-slate-200">{selectedSaleForDetails.customerName || 'عمومی'}</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>روش پرداخت:</span>
                <span className="text-slate-200">{getPaymentMethodLabel(selectedSaleForDetails.paymentMethod)}</span>
              </div>
            </div>

            {/* Table of items */}
            <div className="border border-white/10 rounded-2xl overflow-hidden">
              <table className="w-full text-right text-xs">
                <thead className="bg-white/5 border-b border-white/5 text-slate-400 font-bold">
                  <tr>
                    <th className="p-2.5">نام کالا</th>
                    <th className="p-2.5 text-center">مقدار</th>
                    <th className="p-2.5">قیمت واحد</th>
                    <th className="p-2.5">مبلغ کل</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 text-slate-200">
                  {selectedSaleForDetails.items.map((item, idx) => (
                    <tr key={idx}>
                      <td className="p-2.5 font-bold text-white">{item.productName}</td>
                      <td className="p-2.5 text-center font-sans">
                        {formatWeightOrQuantity(item.quantity, item.unit)}
                      </td>
                      <td className="p-2.5 font-sans text-slate-400">{formatCurrency(item.unitSalePrice)}</td>
                      <td className="p-2.5 font-black text-amber-400 font-sans">
                        {formatCurrency(item.total)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Totals */}
            <div className="p-3 bg-white/5 border border-white/5 rounded-2xl space-y-1.5 text-xs">
              <div className="flex justify-between text-slate-400">
                <span>جمع اقلام:</span>
                <span className="font-sans text-slate-200">{formatCurrency(selectedSaleForDetails.subtotal)}</span>
              </div>
              {selectedSaleForDetails.discount > 0 && (
                <div className="flex justify-between text-rose-400">
                  <span>تخفیف:</span>
                  <span className="font-sans">- {formatCurrency(selectedSaleForDetails.discount)}</span>
                </div>
              )}
              <div className="flex justify-between text-sm font-black text-white pt-2 border-t border-white/5">
                <span>مبلغ نهایی فاکتور:</span>
                <span className="text-amber-400 font-sans">{formatCurrency(selectedSaleForDetails.finalAmount)}</span>
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  setReceiptSaleToPrint(selectedSaleForDetails);
                  setSelectedSaleForDetails(null);
                }}
                className="flex-1 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-md shadow-amber-500/20 cursor-pointer"
              >
                <Printer className="w-4 h-4" />
                <span>چاپ رسید حرارتی</span>
              </button>
              <button
                type="button"
                onClick={() => setSelectedSaleForDetails(null)}
                className="py-2.5 px-4 bg-white/5 hover:bg-white/10 text-slate-300 rounded-xl text-xs font-bold border border-white/5 cursor-pointer"
              >
                بستن
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Cancel Sale */}
      {showCancelModal && saleToCancel && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[#141414] rounded-3xl p-6 shadow-2xl border border-white/10 w-full max-w-md space-y-4 text-right">
            <div className="flex items-center justify-between border-b border-white/5 pb-3">
              <h3 className="text-sm font-bold text-rose-400 flex items-center gap-2">
                <RotateCcw className="w-5 h-5 text-rose-400" />
                <span>ابطال فاکتور و بازگردانی کالا به انبار</span>
              </h3>
              <button
                onClick={() => setShowCancelModal(false)}
                className="text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCancelSale} className="space-y-4">
              <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-2xl text-xs text-rose-300 leading-relaxed">
                آیا از ابطال فاکتور شماره <strong className="text-rose-200">{saleToCancel.invoiceNumber}</strong> به مبلغ{' '}
                <strong className="text-amber-400 font-sans">{formatCurrency(saleToCancel.finalAmount)}</strong> اطمینان دارید؟ تمام اقلام
                به طور خودکار به موجودی انبار بازگردانده می‌شوند.
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  علت ابطال و مرجوعی:
                </label>
                <textarea
                  rows={2}
                  required
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  className="w-full p-2.5 bg-white/5 border border-white/10 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-hidden focus:ring-1 focus:ring-rose-500"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCancelModal(false)}
                  className="flex-1 py-2.5 bg-white/5 hover:bg-white/10 text-slate-300 rounded-xl text-xs font-bold border border-white/5 cursor-pointer"
                >
                  انصراف
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-bold shadow-md shadow-rose-600/20 cursor-pointer"
                >
                  تایید ابطال و برگشت کالا
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Receipt Print */}
      {receiptSaleToPrint && (
        <ReceiptModal
          sale={receiptSaleToPrint}
          settings={settings}
          onClose={() => setReceiptSaleToPrint(null)}
        />
      )}
    </div>
  );
};
