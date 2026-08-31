import React, { useState } from 'react';
import { Sale, StoreSettings, ReceiptTemplateType } from '../../types';
import {
  formatCurrency,
  formatPersianDate,
  formatWeightOrQuantity,
  getPaymentMethodLabel,
  toPersianDigits
} from '../../utils/persian';
import { printReceipt } from '../../utils/printReceipt';
import { Printer, X, CheckCircle, FileText, QrCode, CreditCard, Layout } from 'lucide-react';

interface ReceiptModalProps {
  sale: Sale | null;
  settings: StoreSettings | null;
  onClose: () => void;
}

export const ReceiptModal: React.FC<ReceiptModalProps> = ({ sale, settings, onClose }) => {
  const [selectedTemplate, setSelectedTemplate] = useState<ReceiptTemplateType>(
    settings?.receiptTemplate || 'CLASSIC_80'
  );

  if (!sale) return null;

  const handlePrint = () => {
    printReceipt(sale, settings, selectedTemplate);
  };

  const templates: Array<{ id: ReceiptTemplateType; label: string; width: string; icon: any; desc: string }> = [
    { id: 'CLASSIC_80', label: 'حرارتی ۸۰mm', width: '340px', icon: Printer, desc: 'استاندارد فروشگاهی' },
    { id: 'COMPACT_58', label: 'فشرده ۵۸mm', width: '270px', icon: Layout, desc: 'مینی و کم‌مصرف' },
    { id: 'MODERN_QR', label: 'مدرن با QR', width: '340px', icon: QrCode, desc: 'کادر و کیوآرکد' },
    { id: 'OFFICIAL_A5', label: 'رسمی A5', width: '100%', icon: FileText, desc: 'صورت‌حساب شرکتی' },
  ];

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="bg-[#141414] rounded-3xl shadow-2xl border border-white/10 w-full max-w-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Modal Top Action Bar */}
        <div className="px-5 py-4 bg-white/5 border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs sm:text-sm">
            <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-400" />
            <span>فاکتور فروش صادر شد</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              id="print-receipt-btn"
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold rounded-xl text-xs transition-colors cursor-pointer shadow-md shadow-amber-500/20"
            >
              <Printer className="w-4 h-4" />
              <span>چاپ فاکتور</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-white/10 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Template Switcher Bar */}
        <div className="px-5 py-3 bg-[#0d0d0d] border-b border-white/5 flex items-center justify-between gap-2 overflow-x-auto">
          <span className="text-[11px] font-bold text-slate-400 shrink-0 hidden sm:inline">انتخاب طرح فاکتور:</span>
          <div className="flex items-center gap-1.5 sm:gap-2 w-full sm:w-auto">
            {templates.map((t) => {
              const Icon = t.icon;
              const isSelected = selectedTemplate === t.id;
              return (
                <button
                  key={t.id}
                  onClick={() => setSelectedTemplate(t.id)}
                  className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                    isSelected
                      ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                      : 'bg-white/5 text-slate-300 hover:bg-white/10 hover:text-white border border-white/5'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{t.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Live Preview Container */}
        <div className="p-4 sm:p-6 overflow-y-auto bg-[#0a0a0a] flex justify-center items-start">
          {/* 1. CLASSIC_80 Preview */}
          {selectedTemplate === 'CLASSIC_80' && (
            <div
              id="printable-receipt"
              className="w-full max-w-[340px] bg-white p-5 rounded-2xl shadow-xl border border-slate-300 text-slate-900 text-xs select-none"
            >
              <div className="text-center pb-3 border-b border-dashed border-slate-400">
                <div className="font-black text-sm text-slate-950 mb-1">
                  {settings?.storeName || 'فروشگاه آجیل و خشکبار زعفران طلایی'}
                </div>
                <div className="text-[11px] text-slate-700 mb-0.5">
                  تلفن: {settings?.storePhone || '۰۲۱-۸۸۷۷۶۶۵۵'}
                </div>
                <div className="text-[10px] text-slate-600 leading-tight">
                  {settings?.storeAddress || 'تهران، خیابان ولیعصر'}
                </div>
              </div>

              <div className="py-2.5 border-b border-dashed border-slate-400 space-y-1 text-[11px]">
                <div className="flex justify-between">
                  <span className="text-slate-600">شماره فاکتور:</span>
                  <span className="font-bold text-slate-950">{sale.invoiceNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">تاریخ و زمان:</span>
                  <span className="font-medium text-slate-900">{formatPersianDate(sale.createdAt, true)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">صندوق‌دار:</span>
                  <span className="font-medium text-slate-900">{sale.sellerName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">مشتری:</span>
                  <span className="font-semibold text-slate-950">{sale.customerName || 'عمومی'}</span>
                </div>
              </div>

              <div className="py-2 border-b border-dashed border-slate-400">
                <table className="w-full text-right text-[11px]">
                  <thead>
                    <tr className="text-slate-600 border-b border-slate-300">
                      <th className="pb-1 font-semibold">شرح کالا</th>
                      <th className="pb-1 text-center font-semibold">مقدار</th>
                      <th className="pb-1 text-left font-semibold">مبلغ کل</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {sale.items.map((item, idx) => (
                      <tr key={idx} className="py-1">
                        <td className="py-1.5 font-medium text-slate-900">
                          <div>{item.productName}</div>
                          <div className="text-[10px] text-slate-600 font-sans">
                            {formatCurrency(item.unitSalePrice)} فی
                          </div>
                        </td>
                        <td className="py-1.5 text-center text-slate-800 font-sans font-medium">
                          {formatWeightOrQuantity(item.quantity, item.unit)}
                        </td>
                        <td className="py-1.5 text-left font-bold text-slate-950 font-sans">
                          {formatCurrency(item.total, '')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="py-2.5 border-b border-dashed border-slate-400 space-y-1 text-[11px]">
                <div className="flex justify-between text-slate-700">
                  <span>جمع اقلام:</span>
                  <span className="font-medium text-slate-900">{formatCurrency(sale.subtotal)}</span>
                </div>
                {sale.discount > 0 && (
                  <div className="flex justify-between text-rose-700 font-semibold">
                    <span>تخفیف:</span>
                    <span>- {formatCurrency(sale.discount)}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm font-black text-slate-950 pt-1 border-t border-slate-300">
                  <span>مبلغ قابل پرداخت:</span>
                  <span className="text-amber-800">{formatCurrency(sale.finalAmount)}</span>
                </div>
                <div className="flex justify-between text-[11px] text-slate-600 pt-0.5">
                  <span>روش پرداخت:</span>
                  <span className="font-semibold text-slate-900">{getPaymentMethodLabel(sale.paymentMethod)}</span>
                </div>
                {sale.cardTraceNumber && (
                  <div className="flex justify-between text-[10px] text-slate-600 pt-0.5 font-mono">
                    <span>پیگیری پوز:</span>
                    <span>{sale.cardTraceNumber}</span>
                  </div>
                )}
              </div>

              <div className="pt-3 text-center text-[10px] text-slate-600 leading-relaxed">
                <p>{settings?.receiptFooter || 'از خرید و اعتماد شما سپاسگزاریم.'}</p>
                <div className="mt-2 text-[9px] text-slate-500 font-sans">
                  * {sale.invoiceNumber} *
                </div>
              </div>
            </div>
          )}

          {/* 2. COMPACT_58 Preview */}
          {selectedTemplate === 'COMPACT_58' && (
            <div
              id="printable-receipt"
              className="w-full max-w-[270px] bg-white p-3 rounded-2xl shadow-xl border border-slate-300 text-slate-900 text-[10px] select-none compact-58"
            >
              <div className="text-center pb-2 border-b border-dashed border-slate-800">
                <div className="font-black text-xs text-slate-950">
                  {settings?.storeName || 'زعفران طلایی'}
                </div>
                <div className="text-[9px] text-slate-600">
                  {settings?.storePhone || '۰۲۱-۸۸۷۷۶۶۵۵'}
                </div>
              </div>

              <div className="py-2 border-b border-dashed border-slate-800 space-y-0.5 text-[9.5px]">
                <div className="flex justify-between"><span>شماره:</span><strong className="font-mono">{sale.invoiceNumber}</strong></div>
                <div className="flex justify-between"><span>تاریخ:</span><span>{formatPersianDate(sale.createdAt, true)}</span></div>
                <div className="flex justify-between"><span>مشتری:</span><strong>{sale.customerName || 'عمومی'}</strong></div>
              </div>

              <div className="py-1.5 border-b border-slate-300">
                <table className="w-full text-right text-[9.5px]">
                  <thead>
                    <tr className="border-b border-slate-300 text-slate-600">
                      <th className="pb-1">کالا</th>
                      <th className="pb-1 text-left">مبلغ</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {sale.items.map((item, idx) => (
                      <tr key={idx}>
                        <td className="py-1">
                          <div className="font-bold text-slate-900">{item.productName}</div>
                          <div className="text-[8.5px] text-slate-500">
                            {formatWeightOrQuantity(item.quantity, item.unit)} × {formatCurrency(item.unitSalePrice, '')}
                          </div>
                        </td>
                        <td className="py-1 text-left font-bold text-slate-950 font-mono">
                          {formatCurrency(item.total, '')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="py-2 border-b border-dashed border-slate-800 space-y-1">
                <div className="flex justify-between"><span>جمع:</span><span>{formatCurrency(sale.subtotal, '')}</span></div>
                {sale.discount > 0 && (
                  <div className="flex justify-between text-rose-700">
                    <span>تخفیف:</span><span>- {formatCurrency(sale.discount, '')}</span>
                  </div>
                )}
                <div className="flex justify-between text-xs font-black pt-1 border-t border-slate-300">
                  <span>قابل پرداخت:</span><span className="text-amber-800">{formatCurrency(sale.finalAmount)}</span>
                </div>
              </div>

              <div className="pt-2 text-center text-[8.5px] text-slate-600">
                <div>{settings?.receiptFooter || 'از خرید شما متشکریم'}</div>
                <div className="font-mono text-[8px] mt-1">* {sale.invoiceNumber} *</div>
              </div>
            </div>
          )}

          {/* 3. MODERN_QR Preview */}
          {selectedTemplate === 'MODERN_QR' && (
            <div
              id="printable-receipt"
              className="w-full max-w-[340px] bg-white p-4 rounded-2xl shadow-xl border-2 border-slate-900 text-slate-900 text-xs select-none"
            >
              <div className="text-center pb-2.5 border-b-2 border-dashed border-slate-900">
                <span className="inline-block bg-slate-900 text-white text-[9px] font-bold px-2 py-0.5 rounded-md mb-1">
                  فروشگاه تخصصی
                </span>
                <div className="font-black text-sm text-slate-950">
                  {settings?.storeName || 'فروشگاه آجیل و خشکبار زعفران طلایی'}
                </div>
                <div className="text-[10px] text-slate-600 mt-0.5">
                  {settings?.storeAddress || 'تهران، خیابان ولیعصر'}
                </div>
                <div className="text-[10px] text-slate-600">تلفن: {settings?.storePhone || '۰۲۱-۸۸۷۷۶۶۵۵'}</div>
              </div>

              <div className="py-2 border-b border-slate-200 text-[10.5px] space-y-1">
                <div className="flex justify-between"><span>شماره فاکتور:</span><strong className="font-mono">{sale.invoiceNumber}</strong></div>
                <div className="flex justify-between"><span>تاریخ و ساعت:</span><span>{formatPersianDate(sale.createdAt, true)}</span></div>
                <div className="flex justify-between"><span>مشتری:</span><strong>{sale.customerName || 'عمومی'}</strong></div>
              </div>

              <table className="w-full text-right text-[10.5px] my-2">
                <thead>
                  <tr className="bg-slate-100 text-slate-700 font-bold border-b border-slate-300">
                    <th className="p-1 text-center w-6">#</th>
                    <th className="p-1">کالا</th>
                    <th className="p-1 text-center">مقدار</th>
                    <th className="p-1 text-left">مبلغ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {sale.items.map((item, idx) => (
                    <tr key={idx}>
                      <td className="p-1 text-center text-slate-500">{toPersianDigits(idx + 1)}</td>
                      <td className="p-1 font-bold text-slate-900">{item.productName}</td>
                      <td className="p-1 text-center">{formatWeightOrQuantity(item.quantity, item.unit)}</td>
                      <td className="p-1 text-left font-mono font-bold">{formatCurrency(item.total, '')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div className="bg-slate-50 border border-slate-200 rounded-xl p-2.5 space-y-1 text-[11px]">
                <div className="flex justify-between"><span>جمع کل:</span><span>{formatCurrency(sale.subtotal)}</span></div>
                {sale.discount > 0 && (
                  <div className="flex justify-between text-rose-600 font-bold">
                    <span>تخفیف ویژه:</span><span>- {formatCurrency(sale.discount)}</span>
                  </div>
                )}
                <div className="flex justify-between font-black text-xs text-slate-950 pt-1.5 border-t border-slate-300">
                  <span>مبلغ قابل پرداخت:</span><span className="text-amber-800">{formatCurrency(sale.finalAmount)}</span>
                </div>
                {sale.cardTraceNumber && (
                  <div className="flex justify-between text-[10px] text-slate-600 pt-1 border-t border-slate-200 font-mono">
                    <span>پیگیری پوز:</span><span>{sale.cardTraceNumber}</span>
                  </div>
                )}
              </div>

              <div className="text-center pt-3 mt-1 border-t border-dashed border-slate-300">
                <div className="text-[9.5px] text-slate-600 mb-2">{settings?.receiptFooter || 'از خرید شما سپاسگزاریم.'}</div>
                {/* SVG QR */}
                <div className="flex justify-center mb-1">
                  <svg width="48" height="48" viewBox="0 0 100 100" fill="#0f172a">
                    <rect x="10" y="10" width="30" height="30" fill="none" stroke="#0f172a" strokeWidth="8"/>
                    <rect x="20" y="20" width="10" height="10"/>
                    <rect x="60" y="10" width="30" height="30" fill="none" stroke="#0f172a" strokeWidth="8"/>
                    <rect x="70" y="20" width="10" height="10"/>
                    <rect x="10" y="60" width="30" height="30" fill="none" stroke="#0f172a" strokeWidth="8"/>
                    <rect x="20" y="70" width="10" height="10"/>
                    <rect x="55" y="55" width="10" height="10"/>
                    <rect x="75" y="55" width="15" height="10"/>
                    <rect x="55" y="75" width="20" height="15"/>
                    <rect x="80" y="75" width="10" height="15"/>
                  </svg>
                </div>
                <div className="font-mono text-[9px] text-slate-500">{sale.invoiceNumber}</div>
              </div>
            </div>
          )}

          {/* 4. OFFICIAL_A5 Preview */}
          {selectedTemplate === 'OFFICIAL_A5' && (
            <div
              id="printable-receipt"
              className="w-full bg-white p-5 rounded-2xl shadow-xl border border-slate-300 text-slate-900 text-xs select-none official-a5"
            >
              <div className="flex justify-between items-center border-b-2 border-slate-900 pb-3 mb-3">
                <div>
                  <div className="text-base font-black text-slate-950">{settings?.storeName || 'زعفران طلایی'}</div>
                  <div className="text-[11px] text-slate-600">صورت‌حساب رسمی فروش کالا و خدمات</div>
                </div>
                <div className="text-left text-[11px] space-y-0.5">
                  <div><strong>شماره فاکتور:</strong> <span className="font-mono font-bold text-xs">{sale.invoiceNumber}</span></div>
                  <div><strong>تاریخ:</strong> {formatPersianDate(sale.createdAt, true)}</div>
                  <div><strong>صندوق‌دار:</strong> {sale.sellerName}</div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 border border-slate-300 rounded-lg p-2.5 mb-3 bg-slate-50 text-[10.5px]">
                <div>
                  <div className="font-bold text-slate-950 mb-1">فروشنده: {settings?.storeName}</div>
                  <div className="text-slate-600">تلفن: {settings?.storePhone}</div>
                  <div className="text-slate-600">نشانی: {settings?.storeAddress}</div>
                </div>
                <div>
                  <div className="font-bold text-slate-950 mb-1">خریدار: {sale.customerName || 'مشتری محترم (حضوری)'}</div>
                  <div className="text-slate-600">شماره تماس: {sale.customerPhone || '-'}</div>
                  <div className="text-slate-600">روش پرداخت: {getPaymentMethodLabel(sale.paymentMethod)}</div>
                </div>
              </div>

              <table className="w-full text-right text-[10.5px] border border-slate-300 mb-3">
                <thead>
                  <tr className="bg-slate-100 border-b border-slate-300 font-bold text-slate-700">
                    <th className="p-1.5 text-center border-l border-slate-300 w-8">ردیف</th>
                    <th className="p-1.5 border-l border-slate-300">شرح کالا</th>
                    <th className="p-1.5 text-center border-l border-slate-300">مقدار</th>
                    <th className="p-1.5 text-center border-l border-slate-300">مبلغ واحد</th>
                    <th className="p-1.5 text-center border-l border-slate-300">تخفیف</th>
                    <th className="p-1.5 text-left">مبلغ کل</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {sale.items.map((item, idx) => (
                    <tr key={idx}>
                      <td className="p-1.5 text-center border-l border-slate-200">{toPersianDigits(idx + 1)}</td>
                      <td className="p-1.5 font-bold border-l border-slate-200">{item.productName}</td>
                      <td className="p-1.5 text-center border-l border-slate-200">{formatWeightOrQuantity(item.quantity, item.unit)}</td>
                      <td className="p-1.5 text-center border-l border-slate-200 font-mono">{formatCurrency(item.unitSalePrice, '')}</td>
                      <td className="p-1.5 text-center border-l border-slate-200">{item.discount > 0 ? formatCurrency(item.discount, '') : '-'}</td>
                      <td className="p-1.5 text-left font-mono font-bold">{formatCurrency(item.total, '')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div className="flex justify-end mb-3">
                <div className="w-64 bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-[11px] space-y-1">
                  <div className="flex justify-between"><span>جمع اقلام:</span><span>{formatCurrency(sale.subtotal)}</span></div>
                  {sale.discount > 0 && (
                    <div className="flex justify-between text-rose-700"><span>تخفیف:</span><span>- {formatCurrency(sale.discount)}</span></div>
                  )}
                  <div className="flex justify-between font-black text-xs pt-1 border-t border-slate-300 text-slate-950">
                    <span>مبلغ قابل پرداخت:</span><span>{formatCurrency(sale.finalAmount)}</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-2 border-t border-slate-200 text-[10px] text-slate-600">
                <div className="border border-dashed border-slate-300 rounded-lg p-3 text-center h-16 flex items-center justify-center">
                  مهر و امضای فروشگاه
                </div>
                <div className="border border-dashed border-slate-300 rounded-lg p-3 text-center h-16 flex items-center justify-center">
                  امضای خریدار / تحویل‌گیرنده
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Bottom Footer */}
        <div className="p-4 bg-white/5 border-t border-white/10 flex items-center justify-between">
          <div className="text-[11px] text-slate-400">
            طرح انتخاب شده: <strong className="text-white">{templates.find((t) => t.id === selectedTemplate)?.label}</strong>
          </div>
          <button
            onClick={onClose}
            className="px-5 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer border border-white/10"
          >
            بستن و فاکتور بعدی
          </button>
        </div>
      </div>
    </div>
  );
};
