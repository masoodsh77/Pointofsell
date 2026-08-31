import React, { useState, useEffect } from 'react';
import { Product, StockMovement, StockMovementType } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { apiRequest } from '../../services/api';
import {
  formatCurrency,
  formatPersianDate,
  formatWeightOrQuantity,
  getStockMovementLabel,
  toPersianDigits
} from '../../utils/persian';
import {
  Boxes,
  Sliders,
  History,
  AlertTriangle,
  Search,
  CheckCircle,
  X,
  ArrowUpDown,
  FileSpreadsheet
} from 'lucide-react';

interface InventoryViewProps {
  onRefreshData?: () => void;
}

export const InventoryView: React.FC<InventoryViewProps> = ({ onRefreshData }) => {
  const { isAdmin } = useAuth();
  const [activeTab, setActiveTab] = useState<'STOCK' | 'MOVEMENTS'>('STOCK');
  const [inventoryItems, setInventoryItems] = useState<any[]>([]);
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedMovementType, setSelectedMovementType] = useState<string>('ALL');

  // Adjustment Modal
  const [showAdjustModal, setShowAdjustModal] = useState<boolean>(false);
  const [adjustingProduct, setAdjustingProduct] = useState<any | null>(null);
  const [newStockVal, setNewStockVal] = useState<string>('0');
  const [adjustNotes, setAdjustNotes] = useState<string>('');
  const [adjustType, setAdjustType] = useState<StockMovementType>('ADJUSTMENT');

  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const loadInventory = async () => {
    const [invRes, movRes] = await Promise.all([
      apiRequest<{ items: any[]; summary: any }>('/inventory'),
      apiRequest<StockMovement[]>('/inventory/movements'),
    ]);

    if (invRes.success && invRes.data) setInventoryItems(invRes.data.items);
    if (movRes.success && movRes.data) setMovements(movRes.data);
  };

  useEffect(() => {
    loadInventory();
  }, []);

  const openAdjustModal = (item: any) => {
    setAdjustingProduct(item);
    setNewStockVal(String(item.stock));
    setAdjustNotes('انبارگردانی و تطبیق موجودی فیزیکی');
    setAdjustType('ADJUSTMENT');
    setShowAdjustModal(true);
  };

  const handleAdjustSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adjustingProduct) return;

    setErrorMsg(null);
    const res = await apiRequest('/inventory/adjust', {
      method: 'POST',
      body: JSON.stringify({
        productId: adjustingProduct.id,
        newStock: parseFloat(newStockVal),
        notes: adjustNotes,
        type: adjustType,
      }),
    });

    if (res.success) {
      setSuccessMsg(`موجودی ${adjustingProduct.name} با موفقیت به روزرسانی و در تاریخچه انبار ثبت شد.`);
      setShowAdjustModal(false);
      loadInventory();
      if (onRefreshData) onRefreshData();
      setTimeout(() => setSuccessMsg(null), 4000);
    } else {
      setErrorMsg(res.message || 'خطا در اصلاح موجودی');
    }
  };

  const filteredItems = inventoryItems.filter(
    (i) =>
      i.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      i.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
      i.barcode.includes(searchQuery)
  );

  const filteredMovements = movements.filter((m) => {
    const matchesType = selectedMovementType === 'ALL' || m.type === selectedMovementType;
    const matchesSearch =
      m.productName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (m.referenceId && m.referenceId.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (m.notes && m.notes.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesType && matchesSearch;
  });

  const lowStockItems = inventoryItems.filter((i) => i.isLowStock);
  const totalPurchaseValue = inventoryItems.reduce((acc, i) => acc + (i.totalPurchaseValue || 0), 0);
  const totalSaleValue = inventoryItems.reduce((acc, i) => acc + (i.totalSaleValue || 0), 0);

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#141414] p-6 rounded-3xl border border-white/5 shadow-xl">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center">
            <Boxes className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-black text-white">مدیریت انبار، موجودی و کاردکس کالا</h2>
            <p className="text-xs text-slate-400 mt-0.5">
              رهگیری لحظه‌ای موجودی فیزیکی، ثبت انبارگردانی و تاریخچه دقیق ورود و خروج
            </p>
          </div>
        </div>

        {/* Tab Toggle: Stock vs Audit Log */}
        <div className="flex bg-white/5 p-1 rounded-2xl border border-white/5">
          <button
            onClick={() => setActiveTab('STOCK')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'STOCK'
                ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 shadow-md shadow-amber-500/20 font-black'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Boxes className="w-4 h-4" />
            <span>موجودی کالاها</span>
          </button>
          <button
            onClick={() => setActiveTab('MOVEMENTS')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'MOVEMENTS'
                ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 shadow-md shadow-amber-500/20 font-black'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <History className="w-4 h-4" />
            <span>کاردکس و تاریخچه تغییرات</span>
          </button>
        </div>
      </div>

      {/* KPI Cards (Admin Only) */}
      {isAdmin && activeTab === 'STOCK' && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-[#141414] p-5 rounded-3xl border border-white/5 shadow-lg">
            <div className="text-xs text-slate-400 mb-1">ارزش کل انبار (قیمت خرید):</div>
            <div className="text-lg font-black text-white font-sans">
              {formatCurrency(totalPurchaseValue)}
            </div>
          </div>
          <div className="bg-[#141414] p-5 rounded-3xl border border-white/5 shadow-lg">
            <div className="text-xs text-slate-400 mb-1">ارزش کل انبار (قیمت فروش):</div>
            <div className="text-lg font-black text-amber-400 font-sans">
              {formatCurrency(totalSaleValue)}
            </div>
          </div>
          <div className="bg-[#141414] p-5 rounded-3xl border border-white/5 shadow-lg">
            <div className="text-xs text-slate-400 mb-1">کالاهای زیر نقطه سفارش:</div>
            <div className="text-lg font-black text-rose-400 font-sans">
              {toPersianDigits(lowStockItems.length)} محصول
            </div>
          </div>
        </div>
      )}

      {/* Low Stock Warning Banner */}
      {lowStockItems.length > 0 && activeTab === 'STOCK' && (
        <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-3xl flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
          <div className="text-xs">
            <div className="font-bold text-rose-300 mb-0.5">
              هشدار کمبود موجودی ({toPersianDigits(lowStockItems.length)} کالا در آستانه اتمام):
            </div>
            <div className="text-rose-200/80 leading-relaxed">
              {lowStockItems.map((i) => i.name).join('، ')}
            </div>
          </div>
        </div>
      )}

      {/* Messages */}
      {successMsg && (
        <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 rounded-2xl text-xs flex items-center gap-2">
          <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Search & Filter Bar */}
      <div className="bg-[#141414] p-4 rounded-3xl border border-white/5 shadow-sm flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:w-80">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="جستجوی کالا، فاکتور، توضیحات..."
            className="w-full pl-3 pr-9 py-2 bg-white/5 border border-white/10 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-hidden focus:ring-1 focus:ring-amber-500"
          />
          <Search className="w-4 h-4 text-slate-500 absolute right-3 top-2.5" />
        </div>

        {activeTab === 'MOVEMENTS' && (
          <select
            value={selectedMovementType}
            onChange={(e) => setSelectedMovementType(e.target.value)}
            className="py-2 px-3 bg-white/5 border border-white/10 rounded-xl text-xs font-medium text-slate-200 w-full sm:w-auto focus:outline-hidden focus:ring-1 focus:ring-amber-500"
          >
            <option value="ALL" className="bg-[#181818] text-slate-200">همه انواع رویدادها</option>
            <option value="PURCHASE" className="bg-[#181818] text-slate-200">ورود با فاکتور خرید</option>
            <option value="SALE" className="bg-[#181818] text-slate-200">خروج با فاکتور فروش</option>
            <option value="SALE_CANCEL" className="bg-[#181818] text-slate-200">مرجوعی فاکتور فروش</option>
            <option value="ADJUSTMENT" className="bg-[#181818] text-slate-200">انبارگردانی و اصلاح</option>
            <option value="INITIAL_STOCK" className="bg-[#181818] text-slate-200">موجودی اولیه</option>
          </select>
        )}
      </div>

      {/* View 1: Stock Status Table */}
      {activeTab === 'STOCK' && (
        <div className="bg-[#141414] rounded-3xl border border-white/5 shadow-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead className="bg-white/5 border-b border-white/5 text-slate-400 font-bold">
                <tr>
                  <th className="py-3.5 px-4">نام کالا</th>
                  <th className="py-3.5 px-3">دسته‌بندی</th>
                  <th className="py-3.5 px-3">موجودی فعلی</th>
                  <th className="py-3.5 px-3">نقطه سفارش (حداقل)</th>
                  <th className="py-3.5 px-3">وضعیت موجودی</th>
                  {isAdmin && <th className="py-3.5 px-3">ارزش ریالی موجودی</th>}
                  {isAdmin && <th className="py-3.5 px-4 text-center">انبارگردانی</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filteredItems.map((item) => (
                  <tr key={item.id} className="hover:bg-white/5 transition-colors">
                    <td className="py-3 px-4 font-bold text-white">
                      <div>{item.name}</div>
                      <div className="text-[10px] text-slate-500 font-mono">{item.sku}</div>
                    </td>
                    <td className="py-3 px-3 text-slate-300">{item.categoryName}</td>
                    <td className="py-3 px-3 font-bold text-amber-400 font-sans">
                      {formatWeightOrQuantity(item.stock, item.unit)}
                    </td>
                    <td className="py-3 px-3 text-slate-400 font-sans">
                      {formatWeightOrQuantity(item.minimumStock, item.unit)}
                    </td>
                    <td className="py-3 px-3">
                      <span
                        className={`px-2.5 py-1 rounded-full font-bold text-[11px] ${
                          item.stock <= 0
                            ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                            : item.isLowStock
                            ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                            : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                        }`}
                      >
                        {item.stock <= 0
                          ? 'ناموجود'
                          : item.isLowStock
                          ? 'کم‌موجودی (سفارش دهید)'
                          : 'موجود در انبار'}
                      </span>
                    </td>
                    {isAdmin && (
                      <td className="py-3 px-3 font-bold text-slate-200 font-sans">
                        {formatCurrency(item.totalPurchaseValue)}
                      </td>
                    )}
                    {isAdmin && (
                      <td className="py-3 px-4 text-center">
                        <button
                          id={`adjust-stock-${item.id}`}
                          onClick={() => openAdjustModal(item)}
                          className="px-3 py-1.5 bg-white/5 hover:bg-amber-500 text-amber-400 hover:text-slate-950 font-bold rounded-xl text-xs border border-amber-500/30 transition-colors flex items-center gap-1 mx-auto cursor-pointer"
                        >
                          <Sliders className="w-3.5 h-3.5" />
                          <span>اصلاح موجودی</span>
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* View 2: Stock Movement Audit Log Table */}
      {activeTab === 'MOVEMENTS' && (
        <div className="bg-[#141414] rounded-3xl border border-white/5 shadow-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead className="bg-white/5 border-b border-white/5 text-slate-400 font-bold">
                <tr>
                  <th className="py-3.5 px-4">تاریخ و زمان</th>
                  <th className="py-3.5 px-3">نام کالا</th>
                  <th className="py-3.5 px-3">نوع رویداد</th>
                  <th className="py-3.5 px-3 text-center">مقدار تغییر</th>
                  <th className="py-3.5 px-3 text-center">موجودی قبلی</th>
                  <th className="py-3.5 px-3 text-center">موجودی جدید</th>
                  <th className="py-3.5 px-3">شماره مرجع / کاربر</th>
                  <th className="py-3.5 px-4">توضیحات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filteredMovements.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-slate-500">
                      هیچ رویدادی در تاریخچه یافت نشد.
                    </td>
                  </tr>
                ) : (
                  filteredMovements.map((m) => {
                    const badge = getStockMovementLabel(m.type);
                    const isIncrease = m.newStock > m.previousStock;
                    return (
                      <tr key={m.id} className="hover:bg-white/5 transition-colors">
                        <td className="py-3 px-4 text-slate-400 font-mono text-[11px]">
                          {formatPersianDate(m.createdAt, true)}
                        </td>
                        <td className="py-3 px-3 font-bold text-white">{m.productName}</td>
                        <td className="py-3 px-3">
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${badge.color}`}
                          >
                            {badge.label}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-center font-bold font-sans">
                          <span className={isIncrease ? 'text-emerald-400' : 'text-rose-400'}>
                            {isIncrease ? '+' : '-'}{toPersianDigits(m.quantity)}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-center font-mono text-slate-400">
                          {toPersianDigits(m.previousStock)}
                        </td>
                        <td className="py-3 px-3 text-center font-mono font-bold text-white">
                          {toPersianDigits(m.newStock)}
                        </td>
                        <td className="py-3 px-3 text-[11px]">
                          <div className="font-mono text-amber-400">{m.referenceId || '-'}</div>
                          <div className="text-slate-500 text-[10px]">{m.userName}</div>
                        </td>
                        <td className="py-3 px-4 text-slate-300 text-[11px] max-w-xs truncate">
                          {m.notes || '-'}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal: Manual Stock Adjustment */}
      {showAdjustModal && adjustingProduct && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[#141414] rounded-3xl p-6 shadow-2xl border border-white/10 w-full max-w-md space-y-4 text-right">
            <div className="flex items-center justify-between border-b border-white/5 pb-3">
              <h3 className="text-sm font-bold text-white">
                انبارگردانی و اصلاح موجودی: {adjustingProduct.name}
              </h3>
              <button
                onClick={() => setShowAdjustModal(false)}
                className="text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAdjustSubmit} className="space-y-4">
              <div className="p-3 bg-white/5 border border-white/10 rounded-2xl flex justify-between text-xs">
                <span className="text-slate-400">موجودی فعلی در سیستم:</span>
                <span className="font-bold text-amber-400 font-sans">
                  {formatWeightOrQuantity(adjustingProduct.stock, adjustingProduct.unit)}
                </span>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  موجودی جدید شمارش‌شده در انبار *
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  required
                  value={newStockVal}
                  onChange={(e) => setNewStockVal(e.target.value)}
                  className="w-full p-3 bg-white/5 border border-white/10 rounded-xl text-center text-lg font-black text-amber-400 font-sans focus:outline-hidden focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">علت و توضیحات انبارگردانی</label>
                <textarea
                  rows={2}
                  value={adjustNotes}
                  onChange={(e) => setAdjustNotes(e.target.value)}
                  placeholder="مثال: تطبیق شمارش پایان ماه"
                  className="w-full p-2.5 bg-white/5 border border-white/10 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-hidden focus:ring-1 focus:ring-amber-500"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAdjustModal(false)}
                  className="flex-1 py-2.5 bg-white/5 hover:bg-white/10 text-slate-300 rounded-xl text-xs font-bold border border-white/5 cursor-pointer"
                >
                  انصراف
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 rounded-xl text-xs font-bold shadow-md shadow-amber-500/20 cursor-pointer"
                >
                  ثبت اصلاحیه و ورود به کاردکس
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
