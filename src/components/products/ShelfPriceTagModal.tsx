import React, { useState } from 'react';
import { Product, StoreSettings } from '../../types';
import { formatNumber, getUnitLabel, toPersianDigits } from '../../utils/persian';
import {
  Printer,
  X,
  Tag,
  Sparkles,
  Maximize2,
  Type,
  LayoutGrid
} from 'lucide-react';

export type ShelfTagSize = 'JUMBO_WINDOW' | 'LARGE_STAND' | 'MEDIUM_TRAY' | 'COMPACT_RAIL';
export type FontSizeScale = 'LARGE' | 'EXTRA_LARGE' | 'GIGANTIC';

interface ShelfPriceTagModalProps {
  isOpen: boolean;
  onClose: () => void;
  products: Product[];
  settings: StoreSettings | null;
}

export const ShelfPriceTagModal: React.FC<ShelfPriceTagModalProps> = ({
  isOpen,
  onClose,
  products,
  settings,
}) => {
  const [tagSize, setTagSize] = useState<ShelfTagSize>('LARGE_STAND');
  const [fontScale, setFontScale] = useState<FontSizeScale>('GIGANTIC');
  const [copiesPerProduct, setCopiesPerProduct] = useState<number>(1);
  const [showStoreName, setShowStoreName] = useState<boolean>(true);
  const [showUnitText, setShowUnitText] = useState<boolean>(true);
  const [showCode, setShowCode] = useState<boolean>(true);
  const [customSubtitle, setCustomSubtitle] = useState<string>('درجه یک و اعلا');
  const [includeSubtitle, setIncludeSubtitle] = useState<boolean>(false);

  if (!isOpen || products.length === 0) return null;

  const handlePrint = () => {
    window.print();
  };

  // Build the list of printable tags taking copies into account
  const tagList: Product[] = [];
  products.forEach((p) => {
    for (let i = 0; i < copiesPerProduct; i++) {
      tagList.push(p);
    }
  });

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-[#141414] border border-white/10 rounded-3xl w-full max-w-5xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden text-right">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-white/5 flex items-center justify-between bg-white/5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center">
              <Tag className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <span>چاپ اتیکت قیمت قفسه و سینی کالا (فونت بسیار بزرگ)</span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-normal">
                  {toPersianDigits(products.length)} کالا
                </span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                طراحی شده با فونت فوق‌العاده درشت جهت خوانایی آسان قیمت و نام محصول از فاصله چند متری
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              id="print-shelf-tags-btn"
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-4 sm:px-5 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black rounded-xl text-xs transition-all shadow-md shadow-amber-500/20 cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>چاپ اتیکت‌ها ({toPersianDigits(tagList.length)} عدد)</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-white/5 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content: Settings on Left/Top + Live Printable Sheet on Right */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Controls Column (4 cols) */}
          <div className="lg:col-span-4 space-y-4">
            {/* Tag Size Selection */}
            <div className="bg-white/5 p-4 rounded-2xl border border-white/5 space-y-3">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-300">
                <Maximize2 className="w-4 h-4 text-amber-400" />
                <span>ابعاد و قالب کارت قیمت:</span>
              </div>
              <div className="grid grid-cols-1 gap-2">
                {[
                  {
                    id: 'JUMBO_WINDOW' as ShelfTagSize,
                    title: 'سایز غول‌پیکر ویترینی (نصف برگ A4 - ۱۶ × ۱۰ سانتی‌متر)',
                    desc: 'بزرگترین فونت ممکن - دید عالی از دورترین نقطه فروشگاه',
                  },
                  {
                    id: 'LARGE_STAND' as ShelfTagSize,
                    title: 'سایز بزرگ استند و سینی (۱۳ × ۹ سانتی‌متر)',
                    desc: 'فونت خیلی درشت برای سینی‌های خشکبار و استند قفسه',
                  },
                  {
                    id: 'MEDIUM_TRAY' as ShelfTagSize,
                    title: 'سایز متوسط سینی و شیشه (۹ × ۶ سانتی‌متر)',
                    desc: 'استاندارد برای باکس‌های زعفران و ظروف شیشه‌ای',
                  },
                  {
                    id: 'COMPACT_RAIL' as ShelfTagSize,
                    title: 'سایز نوار افقی لبه قفسه (۱۰ × ۴.۵ سانتی‌متر)',
                    desc: 'مخصوص ریل قیمت باریک فلزی یا پلاستیکی',
                  },
                ].map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => setTagSize(s.id)}
                    className={`p-3 rounded-xl text-right border transition-all cursor-pointer ${
                      tagSize === s.id
                        ? 'bg-amber-500/15 border-amber-500 text-white shadow-xs'
                        : 'bg-white/5 border-white/5 text-slate-400 hover:bg-white/10 hover:text-slate-200'
                    }`}
                  >
                    <div className="text-xs font-bold">{s.title}</div>
                    <div className="text-[10px] text-slate-400 mt-0.5">{s.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Font Scaling Options */}
            <div className="bg-white/5 p-4 rounded-2xl border border-white/5 space-y-2.5">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-300">
                <Type className="w-4 h-4 text-amber-400" />
                <span>میزان درشتی فونت قیمت:</span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'LARGE' as FontSizeScale, label: 'درشت' },
                  { id: 'EXTRA_LARGE' as FontSizeScale, label: 'خیلی درشت' },
                  { id: 'GIGANTIC' as FontSizeScale, label: 'حداکثر (غول‌پیکر)' },
                ].map((f) => (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => setFontScale(f.id)}
                    className={`py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                      fontScale === f.id
                        ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 border-amber-500 shadow-md shadow-amber-500/20'
                        : 'bg-white/5 text-slate-300 border-white/5 hover:bg-white/10'
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Copies per item */}
            <div className="bg-white/5 p-4 rounded-2xl border border-white/5 space-y-2">
              <label className="block text-xs font-bold text-slate-300">
                تعداد چاپ برای هر محصول:
              </label>
              <div className="grid grid-cols-4 gap-2">
                {[1, 2, 3, 4].map((num) => (
                  <button
                    key={num}
                    type="button"
                    onClick={() => setCopiesPerProduct(num)}
                    className={`py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                      copiesPerProduct === num
                        ? 'bg-amber-500 text-slate-950 border-amber-500'
                        : 'bg-white/5 text-slate-400 border-white/5 hover:bg-white/10'
                    }`}
                  >
                    {toPersianDigits(num)} عدد
                  </button>
                ))}
              </div>
            </div>

            {/* Options Checkboxes */}
            <div className="bg-white/5 p-4 rounded-2xl border border-white/5 space-y-3">
              <div className="text-xs font-bold text-slate-300 mb-1">تنظیمات ظاهر اتیکت:</div>
              
              <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={showStoreName}
                  onChange={(e) => setShowStoreName(e.target.checked)}
                  className="w-4 h-4 rounded text-amber-500 accent-amber-500 cursor-pointer"
                />
                <span>نمایش نام فروشگاه ({settings?.storeName || 'خشکبار'})</span>
              </label>

              <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={showUnitText}
                  onChange={(e) => setShowUnitText(e.target.checked)}
                  className="w-4 h-4 rounded text-amber-500 accent-amber-500 cursor-pointer"
                />
                <span>نمایش عبارت واحد (مثلاً: هر کیلوگرم / هر مثقال / هر صوت)</span>
              </label>

              <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={showCode}
                  onChange={(e) => setShowCode(e.target.checked)}
                  className="w-4 h-4 rounded text-amber-500 accent-amber-500 cursor-pointer"
                />
                <span>نمایش کد کالا (SKU / بارکد) در گوشه اتیکت</span>
              </label>

              <div className="pt-2 border-t border-white/5 space-y-1.5">
                <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={includeSubtitle}
                    onChange={(e) => setIncludeSubtitle(e.target.checked)}
                    className="w-4 h-4 rounded text-amber-500 accent-amber-500 cursor-pointer"
                  />
                  <span>افزودن برچسب کیفیت یا توضیحات:</span>
                </label>
                {includeSubtitle && (
                  <input
                    type="text"
                    value={customSubtitle}
                    onChange={(e) => setCustomSubtitle(e.target.value)}
                    placeholder="مثلاً درجه یک اعلا، محصول امسال، تازه و خوش‌طعم"
                    className="w-full px-3 py-1.5 bg-black/40 border border-white/10 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-hidden focus:ring-1 focus:ring-amber-500"
                  />
                )}
              </div>
            </div>
          </div>

          {/* Live Print Preview Sheet (8 cols) */}
          <div className="lg:col-span-8 bg-[#0d0d0d] p-4 sm:p-6 rounded-3xl border border-white/5 flex flex-col justify-between overflow-x-auto">
            <div>
              <div className="flex items-center justify-between mb-4 border-b border-white/5 pb-2">
                <span className="text-xs font-bold text-slate-300 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-amber-400" />
                  <span>پیش‌نمایش زنده صفحه چاپ (آماده برای برش با قیچی):</span>
                </span>
                <span className="text-[11px] text-slate-500">
                  {toPersianDigits(tagList.length)} اتیکت در صفحه
                </span>
              </div>

              {/* PRINTABLE CONTAINER - Visible in modal AND rendered directly in window.print() */}
              <div
                id="printable-price-labels"
                className={`w-full bg-white text-slate-950 p-4 rounded-2xl shadow-lg grid gap-4 ${
                  tagSize === 'JUMBO_WINDOW'
                    ? 'grid-cols-1'
                    : tagSize === 'LARGE_STAND'
                    ? 'grid-cols-1 sm:grid-cols-2'
                    : tagSize === 'COMPACT_RAIL'
                    ? 'grid-cols-2 sm:grid-cols-3'
                    : 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3'
                }`}
              >
                {tagList.map((product, idx) => {
                  // Determine price font size class based on tagSize + fontScale
                  let priceFontClass = 'text-3xl sm:text-4xl';
                  let nameFontClass = 'text-base sm:text-lg';
                  let cardMinHeight = 'min-h-[170px] p-3.5';

                  if (tagSize === 'JUMBO_WINDOW') {
                    cardMinHeight = 'min-h-[280px] p-6';
                    nameFontClass = 'text-2xl sm:text-3xl md:text-4xl font-black';
                    priceFontClass =
                      fontScale === 'GIGANTIC'
                        ? 'text-6xl sm:text-7xl md:text-8xl'
                        : fontScale === 'EXTRA_LARGE'
                        ? 'text-5xl sm:text-6xl md:text-7xl'
                        : 'text-4xl sm:text-5xl md:text-6xl';
                  } else if (tagSize === 'LARGE_STAND') {
                    cardMinHeight = 'min-h-[220px] p-4 sm:p-5';
                    nameFontClass = 'text-xl sm:text-2xl md:text-3xl font-black';
                    priceFontClass =
                      fontScale === 'GIGANTIC'
                        ? 'text-5xl sm:text-6xl'
                        : fontScale === 'EXTRA_LARGE'
                        ? 'text-4xl sm:text-5xl'
                        : 'text-3xl sm:text-4xl';
                  } else if (tagSize === 'MEDIUM_TRAY') {
                    cardMinHeight = 'min-h-[180px] p-3.5';
                    nameFontClass = 'text-lg sm:text-xl font-black';
                    priceFontClass =
                      fontScale === 'GIGANTIC'
                        ? 'text-4xl sm:text-5xl'
                        : fontScale === 'EXTRA_LARGE'
                        ? 'text-3xl sm:text-4xl'
                        : 'text-2xl sm:text-3xl';
                  } else if (tagSize === 'COMPACT_RAIL') {
                    cardMinHeight = 'min-h-[130px] p-3';
                    nameFontClass = 'text-base sm:text-lg font-black';
                    priceFontClass =
                      fontScale === 'GIGANTIC'
                        ? 'text-3xl sm:text-4xl'
                        : fontScale === 'EXTRA_LARGE'
                        ? 'text-2xl sm:text-3xl'
                        : 'text-xl sm:text-2xl';
                  }

                  return (
                    <div
                      key={`${product.id}-${idx}`}
                      className={`bg-white border-2 border-dashed border-slate-400 rounded-2xl flex flex-col justify-between text-center relative overflow-hidden transition-all print:border-solid print:border-slate-800 ${cardMinHeight}`}
                      style={{ direction: 'rtl' }}
                    >
                      {/* Top Bar: Store Name & Code */}
                      <div className="flex items-center justify-between border-b-2 border-slate-900 pb-1.5 mb-2 w-full">
                        {showStoreName ? (
                          <span className="text-xs sm:text-sm font-black text-slate-800 tracking-tight truncate">
                            {settings?.storeName || 'فروشگاه زعفران و خشکبار'}
                          </span>
                        ) : (
                          <span />
                        )}

                        {showCode && (
                          <span className="text-[11px] font-mono font-black text-slate-700 bg-slate-100 px-2 py-0.5 rounded-md">
                            {product.barcode || product.sku}
                          </span>
                        )}
                      </div>

                      {/* Product Name (EXTRA BOLD & PROMINENT) */}
                      <div className="my-auto py-1">
                        <div
                          className={`font-black text-slate-950 leading-tight tracking-tight ${nameFontClass}`}
                        >
                          {product.name}
                        </div>

                        {includeSubtitle && customSubtitle.trim() && (
                          <div className="text-xs sm:text-sm font-black text-amber-700 mt-1">
                            ★ {customSubtitle} ★
                          </div>
                        )}
                      </div>

                      {/* Price Block (MAXIMUM SIZE, BOLD HIGH-CONTRAST) */}
                      <div className="mt-2.5 pt-2 border-t-2 border-slate-900 bg-slate-50/80 rounded-xl p-2.5 sm:p-3 flex flex-col items-center justify-center">
                        <div className="flex items-baseline justify-center gap-1.5 sm:gap-2 flex-wrap">
                          <span
                            className={`font-black text-slate-950 tracking-tighter font-sans ${priceFontClass}`}
                            style={{ fontVariantNumeric: 'tabular-nums' }}
                          >
                            {formatNumber(product.salePrice)}
                          </span>
                          <span
                            className={`font-black text-slate-900 ${
                              tagSize === 'JUMBO_WINDOW'
                                ? 'text-lg sm:text-2xl'
                                : tagSize === 'LARGE_STAND'
                                ? 'text-sm sm:text-lg'
                                : 'text-xs sm:text-sm'
                            }`}
                          >
                            تومان
                          </span>
                        </div>

                        {showUnitText && (
                          <div
                            className={`font-black text-slate-800 mt-1 px-3 py-0.5 bg-slate-200/80 rounded-full ${
                              tagSize === 'JUMBO_WINDOW'
                                ? 'text-sm sm:text-base'
                                : 'text-xs sm:text-sm'
                            }`}
                          >
                            به ازای هر {getUnitLabel(product.unit)}
                          </div>
                        )}
                      </div>

                      {/* Scissors Cut Indicator Notice */}
                      <div className="text-[9px] text-slate-400 absolute bottom-0.5 left-1 font-mono print:hidden">
                        ✂ خط برش
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
