import React, { useState } from 'react';
import { Product, Category } from '../../types';
import { apiRequest } from '../../services/api';
import { formatCurrency, toPersianDigits } from '../../utils/persian';
import {
  TrendingUp,
  TrendingDown,
  Percent,
  Coins,
  CheckCircle,
  AlertCircle,
  X,
  Sparkles,
  ArrowRight
} from 'lucide-react';

interface BulkPriceUpdateModalProps {
  products: Product[];
  categories: Category[];
  selectedProductIds: string[];
  onClose: () => void;
  onSuccess: () => void;
}

export const BulkPriceUpdateModal: React.FC<BulkPriceUpdateModalProps> = ({
  products,
  categories,
  selectedProductIds,
  onClose,
  onSuccess,
}) => {
  const [scope, setScope] = useState<'SELECTED' | 'ALL' | 'CATEGORY'>(
    selectedProductIds.length > 0 ? 'SELECTED' : 'ALL'
  );
  const [selectedCategory, setSelectedCategory] = useState<string>(categories[0]?.id || 'ALL');
  const [targetPrice, setTargetPrice] = useState<'salePrice' | 'purchasePrice' | 'both'>('salePrice');
  const [mode, setMode] = useState<'PERCENT' | 'AMOUNT'>('PERCENT');
  const [operation, setOperation] = useState<'INCREASE' | 'DECREASE'>('INCREASE');
  const [value, setValue] = useState<string>('10');
  const [roundTo, setRoundTo] = useState<number>(1000);

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Determine affected products
  const affectedProducts = products.filter((p) => {
    if (scope === 'SELECTED') {
      return selectedProductIds.includes(p.id);
    }
    if (scope === 'CATEGORY') {
      return selectedCategory === 'ALL' || p.categoryId === selectedCategory;
    }
    return true;
  });

  const numValue = parseFloat(value) || 0;

  const calculatePreviewPrice = (currentPrice: number): number => {
    if (numValue <= 0) return currentPrice;
    let delta = 0;
    if (mode === 'PERCENT') {
      delta = (currentPrice * numValue) / 100;
    } else {
      delta = numValue;
    }
    let next = operation === 'INCREASE' ? currentPrice + delta : currentPrice - delta;
    if (roundTo > 1) {
      next = Math.round(next / roundTo) * roundTo;
    }
    return Math.max(0, Math.round(next));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (numValue <= 0) {
      setErrorMsg('لطفاً یک مقدار عددی بزرگتر از صفر برای تغییر قیمت وارد کنید.');
      return;
    }

    if (affectedProducts.length === 0) {
      setErrorMsg('هیچ کالایی برای اعمال تغییر قیمت انتخاب نشده است.');
      return;
    }

    setIsLoading(true);
    setErrorMsg(null);

    const payload = {
      productIds: scope === 'SELECTED' ? selectedProductIds : scope === 'ALL' ? ['ALL'] : affectedProducts.map((p) => p.id),
      categoryId: scope === 'CATEGORY' ? selectedCategory : undefined,
      targetPrice,
      mode,
      operation,
      value: numValue,
      roundTo,
    };

    const res = await apiRequest('/products/bulk-update-price', {
      method: 'POST',
      body: JSON.stringify(payload),
    });

    setIsLoading(false);

    if (res.success) {
      onSuccess();
      onClose();
    } else {
      setErrorMsg(res.message || 'خطا در اعمال تغییر قیمت گروهی');
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-[#141414] rounded-3xl shadow-2xl border border-white/10 w-full max-w-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Modal Header */}
        <div className="px-6 py-4 bg-white/5 border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-2 text-amber-400 font-bold text-base">
            <Sparkles className="w-5 h-5" />
            <span>تغییر قیمت دسته‌جمعی محصولات</span>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-xl hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-6 flex-1">
          {errorMsg && (
            <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-400 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Scope Selector */}
          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-2">
              محدوده اعمال تغییر:
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setScope('SELECTED')}
                disabled={selectedProductIds.length === 0}
                className={`p-3 rounded-xl border text-xs font-bold transition-all text-center cursor-pointer ${
                  scope === 'SELECTED'
                    ? 'bg-amber-500/20 border-amber-500 text-amber-300'
                    : selectedProductIds.length === 0
                    ? 'bg-white/2 border-white/5 text-slate-600 cursor-not-allowed'
                    : 'bg-white/5 border-white/10 text-slate-400 hover:bg-white/10'
                }`}
              >
                کالاهای انتخاب شده ({toPersianDigits(selectedProductIds.length)})
              </button>

              <button
                type="button"
                onClick={() => setScope('ALL')}
                className={`p-3 rounded-xl border text-xs font-bold transition-all text-center cursor-pointer ${
                  scope === 'ALL'
                    ? 'bg-amber-500/20 border-amber-500 text-amber-300'
                    : 'bg-white/5 border-white/10 text-slate-400 hover:bg-white/10'
                }`}
              >
                تمام کالاها ({toPersianDigits(products.length)})
              </button>

              <button
                type="button"
                onClick={() => setScope('CATEGORY')}
                className={`p-3 rounded-xl border text-xs font-bold transition-all text-center cursor-pointer ${
                  scope === 'CATEGORY'
                    ? 'bg-amber-500/20 border-amber-500 text-amber-300'
                    : 'bg-white/5 border-white/10 text-slate-400 hover:bg-white/10'
                }`}
              >
                بر اساس دسته‌بندی
              </button>
            </div>

            {scope === 'CATEGORY' && (
              <div className="mt-3">
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="w-full bg-[#1c1c1c] border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:border-amber-500 outline-none"
                >
                  <option value="ALL">همه دسته‌بندی‌ها</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* Target Price Type */}
          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-2">
              کدام قیمت تغییر کند؟
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setTargetPrice('salePrice')}
                className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all text-center cursor-pointer ${
                  targetPrice === 'salePrice'
                    ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300'
                    : 'bg-white/5 border-white/10 text-slate-400 hover:bg-white/10'
                }`}
              >
                فقط قیمت فروش
              </button>
              <button
                type="button"
                onClick={() => setTargetPrice('purchasePrice')}
                className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all text-center cursor-pointer ${
                  targetPrice === 'purchasePrice'
                    ? 'bg-blue-500/20 border-blue-500 text-blue-300'
                    : 'bg-white/5 border-white/10 text-slate-400 hover:bg-white/10'
                }`}
              >
                فقط قیمت خرید
              </button>
              <button
                type="button"
                onClick={() => setTargetPrice('both')}
                className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all text-center cursor-pointer ${
                  targetPrice === 'both'
                    ? 'bg-purple-500/20 border-purple-500 text-purple-300'
                    : 'bg-white/5 border-white/10 text-slate-400 hover:bg-white/10'
                }`}
              >
                هم خرید و هم فروش
              </button>
            </div>
          </div>

          {/* Mode & Operation */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Operation: Increase vs Decrease */}
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-2">
                نوع عملیات:
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setOperation('INCREASE')}
                  className={`flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                    operation === 'INCREASE'
                      ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400 shadow-sm'
                      : 'bg-white/5 border-white/10 text-slate-400 hover:bg-white/10'
                  }`}
                >
                  <TrendingUp className="w-4 h-4" />
                  <span>افزایش قیمت (+)</span>
                </button>
                <button
                  type="button"
                  onClick={() => setOperation('DECREASE')}
                  className={`flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                    operation === 'DECREASE'
                      ? 'bg-rose-500/20 border-rose-500 text-rose-400 shadow-sm'
                      : 'bg-white/5 border-white/10 text-slate-400 hover:bg-white/10'
                  }`}
                >
                  <TrendingDown className="w-4 h-4" />
                  <span>کاهش قیمت (-)</span>
                </button>
              </div>
            </div>

            {/* Mode: Percentage vs Amount */}
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-2">
                نحوه محاسبه:
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setMode('PERCENT')}
                  className={`flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                    mode === 'PERCENT'
                      ? 'bg-amber-500/20 border-amber-500 text-amber-300'
                      : 'bg-white/5 border-white/10 text-slate-400 hover:bg-white/10'
                  }`}
                >
                  <Percent className="w-4 h-4" />
                  <span>درصدی (%)</span>
                </button>
                <button
                  type="button"
                  onClick={() => setMode('AMOUNT')}
                  className={`flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                    mode === 'AMOUNT'
                      ? 'bg-amber-500/20 border-amber-500 text-amber-300'
                      : 'bg-white/5 border-white/10 text-slate-400 hover:bg-white/10'
                  }`}
                >
                  <Coins className="w-4 h-4" />
                  <span>مبلغ ثابت (تومان)</span>
                </button>
              </div>
            </div>
          </div>

          {/* Value & Rounding */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-2">
                {mode === 'PERCENT' ? 'میزان درصد تغییر:' : 'مبلغ تغییر (تومان):'}
              </label>
              <div className="relative">
                <input
                  type="number"
                  min="0"
                  step={mode === 'PERCENT' ? '0.5' : '1000'}
                  value={value}
                  onChange={(e) => setValue(e.target.value)}
                  placeholder={mode === 'PERCENT' ? 'مثلاً ۱۰' : 'مثلاً ۵۰۰۰۰'}
                  className="w-full bg-[#1c1c1c] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white font-bold focus:border-amber-500 outline-none"
                  required
                />
                <span className="absolute left-3 top-3 text-xs text-slate-500 font-sans">
                  {mode === 'PERCENT' ? 'درصد ٪' : 'تومان'}
                </span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-2">
                رُند کردن مبالغ نهایی:
              </label>
              <select
                value={roundTo}
                onChange={(e) => setRoundTo(Number(e.target.value))}
                className="w-full bg-[#1c1c1c] border border-white/10 rounded-xl px-3 py-2.5 text-xs text-white focus:border-amber-500 outline-none"
              >
                <option value={0}>بدون رُند کردن (دقیق)</option>
                <option value={1000}>رُند به نزدیک‌ترین ۱,۰۰۰ تومان</option>
                <option value={5000}>رُند به نزدیک‌ترین ۵,۰۰۰ تومان</option>
                <option value={10000}>رُند به نزدیک‌ترین ۱۰,۰۰۰ تومان</option>
              </select>
            </div>
          </div>

          {/* Live Preview Table */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-slate-400">
                پیش‌نمایش تغییرات ({toPersianDigits(affectedProducts.length)} کالا تحت تاثیر):
              </span>
            </div>
            <div className="border border-white/10 rounded-2xl overflow-hidden bg-[#0d0d0d] max-h-48 overflow-y-auto">
              <table className="w-full text-right text-xs">
                <thead className="bg-white/5 text-slate-400 border-b border-white/10 sticky top-0">
                  <tr>
                    <th className="p-2.5">نام محصول</th>
                    <th className="p-2.5 text-center">قیمت فعلی</th>
                    <th className="p-2.5 text-center">قیمت جدید</th>
                    <th className="p-2.5 text-left">تغییر</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {affectedProducts.slice(0, 8).map((p) => {
                    const curr = targetPrice === 'purchasePrice' ? p.purchasePrice : p.salePrice;
                    const next = calculatePreviewPrice(curr);
                    const diff = next - curr;
                    return (
                      <tr key={p.id} className="hover:bg-white/5">
                        <td className="p-2.5 text-white font-medium truncate max-w-[180px]">
                          {p.name}
                        </td>
                        <td className="p-2.5 text-center text-slate-400 font-sans">
                          {formatCurrency(curr, '')}
                        </td>
                        <td className="p-2.5 text-center text-amber-300 font-bold font-sans">
                          {formatCurrency(next, '')}
                        </td>
                        <td className="p-2.5 text-left font-sans font-bold">
                          <span
                            className={
                              diff > 0
                                ? 'text-emerald-400'
                                : diff < 0
                                ? 'text-rose-400'
                                : 'text-slate-500'
                            }
                          >
                            {diff > 0 ? '+' : ''}
                            {formatCurrency(diff)}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </form>

        {/* Modal Footer */}
        <div className="p-4 bg-white/5 border-t border-white/10 flex items-center justify-between">
          <div className="text-xs text-slate-400">
            تعداد کالاهای انتخابی: <strong className="text-white">{toPersianDigits(affectedProducts.length)}</strong> کالا
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
            >
              انصراف
            </button>
            <button
              onClick={handleSubmit}
              disabled={isLoading || affectedProducts.length === 0}
              className="px-5 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold rounded-xl text-xs transition-colors cursor-pointer disabled:opacity-50 flex items-center gap-1.5 shadow-md shadow-amber-500/20"
            >
              {isLoading ? (
                <span>در حال اعمال تغییرات...</span>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4" />
                  <span>اعمال و ذخیره نهایی قیمت‌ها</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
