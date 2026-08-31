import React, { useState, useEffect } from 'react';
import { Supplier, PurchaseInvoice } from '../../types';
import { apiRequest } from '../../services/api';
import {
  formatCurrency,
  formatPersianDate,
  formatWeightOrQuantity,
  toPersianDigits
} from '../../utils/persian';
import {
  Building2,
  FileText,
  Calendar,
  X,
  Package,
  Printer,
  DollarSign,
  Phone,
  MapPin,
  ChevronDown,
  ChevronUp
} from 'lucide-react';

interface SupplierPurchasesModalProps {
  supplier: Supplier;
  onClose: () => void;
}

export const SupplierPurchasesModal: React.FC<SupplierPurchasesModalProps> = ({
  supplier,
  onClose,
}) => {
  const [purchases, setPurchases] = useState<PurchaseInvoice[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [expandedInvoiceId, setExpandedInvoiceId] = useState<string | null>(null);

  const loadPurchases = async () => {
    setIsLoading(true);
    const res = await apiRequest<{ purchases: PurchaseInvoice[] }>(`/suppliers/${supplier.id}/purchases`);
    if (res.success && res.data) {
      setPurchases(res.data.purchases || []);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    loadPurchases();
  }, [supplier.id]);

  const totalSpent = purchases.reduce((acc, p) => acc + p.totalAmount, 0);

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-[#141414] rounded-3xl shadow-2xl border border-white/10 w-full max-w-4xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header Profile */}
        <div className="px-6 py-5 bg-white/5 border-b border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center font-black text-base">
              <Building2 className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-black text-white">{supplier.name}</h3>
              <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400 mt-1">
                {supplier.contactPerson && <span>مسئول: {supplier.contactPerson}</span>}
                {supplier.phone && (
                  <span className="flex items-center gap-1 font-mono">
                    <Phone className="w-3.5 h-3.5 text-slate-500" />
                    <span>{supplier.phone}</span>
                  </span>
                )}
                {supplier.address && (
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-slate-500" />
                    <span>{supplier.address}</span>
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="px-4 py-2 bg-amber-500/10 border border-amber-500/20 rounded-2xl text-left">
              <span className="text-[10px] font-medium text-slate-400 block">مجموع خریدهای ثبت شده:</span>
              <span className="text-sm font-black text-amber-300 font-sans">
                {formatCurrency(totalSpent)}
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

        {/* Content Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold text-slate-300 flex items-center gap-2">
              <FileText className="w-4 h-4 text-amber-400" />
              <span>لیست فاکتورهای خرید ورودی به انبار ({toPersianDigits(purchases.length)} فاکتور)</span>
            </h4>
          </div>

          {isLoading ? (
            <div className="py-12 text-center text-slate-500 text-xs">در حال بارگذاری فاکتورها...</div>
          ) : purchases.length === 0 ? (
            <div className="py-12 text-center text-slate-500 text-xs bg-white/2 rounded-2xl border border-white/5">
              تاکنون فاکتور خریدی برای این تامین‌کننده ثبت نشده است.
            </div>
          ) : (
            <div className="space-y-3">
              {purchases.map((inv) => {
                const isExpanded = expandedInvoiceId === inv.id;
                return (
                  <div
                    key={inv.id}
                    className="border border-white/10 rounded-2xl overflow-hidden bg-[#0d0d0d] transition-all"
                  >
                    {/* Invoice Bar */}
                    <div
                      onClick={() => setExpandedInvoiceId(isExpanded ? null : inv.id)}
                      className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 cursor-pointer hover:bg-white/5 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center font-bold text-xs">
                          <FileText className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="text-xs font-bold text-white flex items-center gap-2">
                            <span>شماره فاکتور: {inv.invoiceNumber}</span>
                            <span className="px-2 py-0.5 bg-white/5 border border-white/10 rounded text-[10px] text-slate-400">
                              {toPersianDigits(inv.items.length)} قلم کالا
                            </span>
                          </div>
                          <div className="text-[11px] text-slate-400 mt-0.5">
                            تاریخ: {formatPersianDate(inv.date || inv.createdAt, true)}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-4">
                        <div className="text-left">
                          <span className="text-[10px] text-slate-500 block">مبلغ کل فاکتور:</span>
                          <span className="text-sm font-black text-amber-300 font-sans">
                            {formatCurrency(inv.totalAmount)}
                          </span>
                        </div>

                        <div className="p-1 rounded-lg bg-white/5 text-slate-400">
                          {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        </div>
                      </div>
                    </div>

                    {/* Expandable Items Table */}
                    {isExpanded && (
                      <div className="p-4 bg-[#141414] border-t border-white/5 space-y-3">
                        <div className="text-[11px] font-bold text-slate-400">اقلام خریداری شده و افزوده شده به انبار:</div>
                        <div className="border border-white/5 rounded-xl overflow-hidden">
                          <table className="w-full text-right text-xs">
                            <thead className="bg-white/5 text-slate-400 font-bold">
                              <tr>
                                <th className="p-2.5">نام محصول</th>
                                <th className="p-2.5">مقدار / تعداد</th>
                                <th className="p-2.5">قیمت خرید واحد (فی)</th>
                                <th className="p-2.5">جمع ردیف</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5 text-slate-200">
                              {inv.items.map((item, itemIdx) => (
                                <tr key={itemIdx} className="hover:bg-white/5">
                                  <td className="p-2.5 font-bold text-white">{item.productName}</td>
                                  <td className="p-2.5 text-slate-300 font-sans">
                                    {toPersianDigits(item.quantity)}
                                  </td>
                                  <td className="p-2.5 text-slate-400 font-sans">
                                    {formatCurrency(item.unitPurchasePrice)}
                                  </td>
                                  <td className="p-2.5 font-bold text-amber-300 font-sans">
                                    {formatCurrency(item.total)}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                        {inv.notes && (
                          <div className="text-[11px] text-slate-400 bg-white/5 p-2.5 rounded-xl">
                            یادداشت فاکتور: {inv.notes}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
