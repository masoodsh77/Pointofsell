import React, { useState, useEffect } from 'react';
import { Product, StoreSettings } from '../../types';
import { formatNumber, getUnitLabel, toPersianDigits } from '../../utils/persian';
import { useCurrency } from '../../context/CurrencyContext';
import { BarcodeSvg } from '../common/BarcodeSvg';
import {
  Printer,
  X,
  Tag,
  Sparkles,
  Maximize2,
  Type,
  Eraser,
  RotateCcw
} from 'lucide-react';

export type ShelfTagSize = 'JUMBO_WINDOW' | 'LARGE_STAND' | 'MEDIUM_TRAY' | 'COMPACT_RAIL';
export type FontSizeScale = 'LARGE' | 'EXTRA_LARGE' | 'GIGANTIC';

interface ShelfPriceTagModalProps {
  isOpen: boolean;
  onClose: () => void;
  products: Product[];
  settings: StoreSettings | null;
}

// Dynamic mathematical font size scaling to prevent any overflow outside the card frame
export function getSafePriceFontClass(
  formattedPrice: string,
  tagSize: ShelfTagSize,
  fontScale: FontSizeScale
): string {
  const len = formattedPrice.length; // e.g. "۱,۱۸۰,۰۰۰" is 9 chars

  if (tagSize === 'JUMBO_WINDOW') {
    // 1 column across the whole page (wide: ~600px)
    if (len <= 6) {
      return fontScale === 'GIGANTIC'
        ? 'text-6xl sm:text-7xl md:text-8xl'
        : fontScale === 'EXTRA_LARGE'
        ? 'text-5xl sm:text-6xl md:text-7xl'
        : 'text-4xl sm:text-5xl md:text-6xl';
    } else if (len <= 9) {
      return fontScale === 'GIGANTIC'
        ? 'text-5xl sm:text-6xl md:text-7xl'
        : fontScale === 'EXTRA_LARGE'
        ? 'text-4xl sm:text-5xl md:text-6xl'
        : 'text-3xl sm:text-4xl md:text-5xl';
    } else {
      return fontScale === 'GIGANTIC'
        ? 'text-4xl sm:text-5xl md:text-6xl'
        : fontScale === 'EXTRA_LARGE'
        ? 'text-3xl sm:text-4xl md:text-5xl'
        : 'text-2xl sm:text-3xl md:text-4xl';
    }
  }

  if (tagSize === 'LARGE_STAND') {
    // 2 columns (~300px per card)
    if (len <= 5) {
      return fontScale === 'GIGANTIC'
        ? 'text-4xl sm:text-5xl'
        : fontScale === 'EXTRA_LARGE'
        ? 'text-3xl sm:text-4xl'
        : 'text-2xl sm:text-3xl';
    } else if (len <= 8) {
      return fontScale === 'GIGANTIC'
        ? 'text-3xl sm:text-4xl'
        : fontScale === 'EXTRA_LARGE'
        ? 'text-2xl sm:text-3xl'
        : 'text-xl sm:text-2xl';
    } else {
      return fontScale === 'GIGANTIC'
        ? 'text-2xl sm:text-3xl'
        : fontScale === 'EXTRA_LARGE'
        ? 'text-xl sm:text-2xl'
        : 'text-lg sm:text-xl';
    }
  }

  if (tagSize === 'MEDIUM_TRAY') {
    // 2-3 columns (~220px per card)
    if (len <= 5) {
      return fontScale === 'GIGANTIC'
        ? 'text-3xl sm:text-4xl'
        : fontScale === 'EXTRA_LARGE'
        ? 'text-2xl sm:text-3xl'
        : 'text-xl sm:text-2xl';
    } else if (len <= 8) {
      return fontScale === 'GIGANTIC'
        ? 'text-2xl sm:text-3xl'
        : fontScale === 'EXTRA_LARGE'
        ? 'text-xl sm:text-2xl'
        : 'text-lg sm:text-xl';
    } else {
      return fontScale === 'GIGANTIC'
        ? 'text-xl sm:text-2xl'
        : fontScale === 'EXTRA_LARGE'
        ? 'text-lg sm:text-xl'
        : 'text-base sm:text-lg';
    }
  }

  // COMPACT_RAIL (narrow ~180px per card)
  if (len <= 5) {
    return fontScale === 'GIGANTIC'
      ? 'text-2xl sm:text-3xl'
      : fontScale === 'EXTRA_LARGE'
      ? 'text-xl sm:text-2xl'
      : 'text-lg sm:text-xl';
  } else if (len <= 8) {
    return fontScale === 'GIGANTIC'
      ? 'text-xl sm:text-2xl'
      : fontScale === 'EXTRA_LARGE'
      ? 'text-lg sm:text-xl'
      : 'text-base sm:text-lg';
  } else {
    return fontScale === 'GIGANTIC'
      ? 'text-lg sm:text-xl'
      : fontScale === 'EXTRA_LARGE'
      ? 'text-base sm:text-lg'
      : 'text-sm sm:text-base';
  }
}

export const ShelfPriceTagModal: React.FC<ShelfPriceTagModalProps> = ({
  isOpen,
  onClose,
  products,
  settings,
}) => {
  const { toDisplayPrice, unitLabel } = useCurrency();
  const [tagSize, setTagSize] = useState<ShelfTagSize>('LARGE_STAND');
  const [fontScale, setFontScale] = useState<FontSizeScale>('GIGANTIC');
  const [copiesPerProduct, setCopiesPerProduct] = useState<number>(1);

  // Content control states - Minimalist default per user request: only price with large font, clearable name
  const [showProductName, setShowProductName] = useState<boolean>(true);
  const [customProductName, setCustomProductName] = useState<string>('');
  const [showStoreName, setShowStoreName] = useState<boolean>(false);
  const [showUnitText, setShowUnitText] = useState<boolean>(false);
  const [showCode, setShowCode] = useState<boolean>(false);
  const [includeSubtitle, setIncludeSubtitle] = useState<boolean>(false);
  const [customSubtitle, setCustomSubtitle] = useState<string>('درجه یک و اعلا');

  // Sync custom product name when single product is selected
  useEffect(() => {
    if (products.length === 1) {
      setCustomProductName(products[0].name);
    } else {
      setCustomProductName('');
    }
  }, [products]);

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
                <span>چاپ اتیکت و لیبل قیمت (فونت درشت بدون خروج از کادر)</span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-normal">
                  {toPersianDigits(products.length)} کالا
                </span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                طراحی خلوت و اختصاصی با فونت بزرگ، بدون بیرون‌زدگی قیمت از کادر و با نام قابل حذف
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
                  { id: 'GIGANTIC' as FontSizeScale, label: 'حداکثر (بزرگ)' },
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

            {/* Product Name Customization & Clear Option */}
            <div className="bg-white/5 p-4 rounded-2xl border border-white/5 space-y-3">
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 text-xs font-bold text-slate-300 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={showProductName}
                    onChange={(e) => setShowProductName(e.target.checked)}
                    className="w-4 h-4 rounded text-amber-500 accent-amber-500 cursor-pointer"
                  />
                  <span>نمایش نام محصول روی اتیکت</span>
                </label>

                {showProductName && (
                  <button
                    type="button"
                    onClick={() => {
                      setCustomProductName('');
                      setShowProductName(false);
                    }}
                    className="text-[11px] text-rose-400 hover:text-rose-300 flex items-center gap-1 cursor-pointer bg-rose-500/10 px-2 py-1 rounded-lg border border-rose-500/20 transition-colors"
                    title="پاک کردن کامل نام محصول تا فقط قیمت چاپ شود"
                  >
                    <Eraser className="w-3.5 h-3.5" />
                    <span>پاک کردن نام (فقط قیمت)</span>
                  </button>
                )}
              </div>

              {showProductName && products.length === 1 && (
                <div className="space-y-1.5 pt-1">
                  <div className="flex items-center justify-between text-[11px] text-slate-400">
                    <span>عنوان روی اتیکت (قابل ویرایش یا پاک کردن):</span>
                    {customProductName !== products[0].name && (
                      <button
                        type="button"
                        onClick={() => setCustomProductName(products[0].name)}
                        className="text-amber-400 hover:underline flex items-center gap-0.5"
                      >
                        <RotateCcw className="w-3 h-3" />
                        <span>بازگردانی نام اصلی</span>
                      </button>
                    )}
                  </div>
                  <div className="relative">
                    <input
                      type="text"
                      value={customProductName}
                      onChange={(e) => setCustomProductName(e.target.value)}
                      placeholder="نام محصول (یا خالی بگذارید تا فقط قیمت چاپ شود)"
                      className="w-full px-3 py-2 bg-black/40 border border-white/10 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-hidden focus:ring-1 focus:ring-amber-500 pr-3 pl-8"
                    />
                    {customProductName && (
                      <button
                        type="button"
                        onClick={() => setCustomProductName('')}
                        className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white cursor-pointer"
                        title="پاک کردن متن"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              )}

              {showProductName && products.length > 1 && (
                <p className="text-[11px] text-slate-400">
                  {toPersianDigits(products.length)} کالا انتخاب شده‌اند. با برداشتن تیک بالا، روی تمام اتیکت‌ها فقط قیمت بزرگ چاپ می‌شود.
                </p>
              )}
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

            {/* Other Options (Default Off per request) */}
            <div className="bg-white/5 p-4 rounded-2xl border border-white/5 space-y-3">
              <div className="text-xs font-bold text-slate-300 mb-1">سایر گزینه‌های اختیاری:</div>

              <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={showStoreName}
                  onChange={(e) => setShowStoreName(e.target.checked)}
                  className="w-4 h-4 rounded text-amber-500 accent-amber-500 cursor-pointer"
                />
                <span>نمایش نام فروشگاه ({settings?.storeName || 'آجیل و خشکبار برادران جهانتیغ'})</span>
              </label>

              <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={showUnitText}
                  onChange={(e) => setShowUnitText(e.target.checked)}
                  className="w-4 h-4 rounded text-amber-500 accent-amber-500 cursor-pointer"
                />
                <span>نمایش عبارت واحد (مثلاً هر کیلوگرم)</span>
              </label>

              <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={showCode}
                  onChange={(e) => setShowCode(e.target.checked)}
                  className="w-4 h-4 rounded text-amber-500 accent-amber-500 cursor-pointer"
                />
                <span>نمایش کد کالا (بارکد)</span>
              </label>

              <div className="pt-2 border-t border-white/5 space-y-1.5">
                <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={includeSubtitle}
                    onChange={(e) => setIncludeSubtitle(e.target.checked)}
                    className="w-4 h-4 rounded text-amber-500 accent-amber-500 cursor-pointer"
                  />
                  <span>افزودن برچسب کیفیت (مثلاً درجه یک اعلا):</span>
                </label>
                {includeSubtitle && (
                  <input
                    type="text"
                    value={customSubtitle}
                    onChange={(e) => setCustomSubtitle(e.target.value)}
                    placeholder="مثلاً درجه یک اعلا، دست‌چین امسال"
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
                  <span>پیش‌نمایش زنده اتیکت‌ها (اندازه دقیق بدون خروج قیمت از کادر):</span>
                </span>
                <span className="text-[11px] text-slate-400">
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
                  // Determine final name to display
                  const isSingle = products.length === 1;
                  const finalName = showProductName
                    ? isSingle && customProductName !== undefined
                      ? customProductName.trim()
                      : product.name
                    : '';

                  const displayPrice = toDisplayPrice(product.salePrice);
                  const formattedPrice = formatNumber(displayPrice);
                  const priceFontClass = getSafePriceFontClass(formattedPrice, tagSize, fontScale);

                  // Card sizing
                  let cardMinHeight = 'min-h-[170px] p-4';
                  let nameFontClass = 'text-base sm:text-lg font-black';

                  if (tagSize === 'JUMBO_WINDOW') {
                    cardMinHeight = 'min-h-[260px] p-6';
                    nameFontClass = 'text-xl sm:text-2xl md:text-3xl font-black';
                  } else if (tagSize === 'LARGE_STAND') {
                    cardMinHeight = 'min-h-[200px] p-4 sm:p-5';
                    nameFontClass = 'text-lg sm:text-xl font-black';
                  } else if (tagSize === 'MEDIUM_TRAY') {
                    cardMinHeight = 'min-h-[170px] p-3.5';
                    nameFontClass = 'text-base sm:text-lg font-black';
                  } else if (tagSize === 'COMPACT_RAIL') {
                    cardMinHeight = 'min-h-[130px] p-3';
                    nameFontClass = 'text-sm sm:text-base font-black';
                  }

                  const hasTopBar = showStoreName || showCode;

                  return (
                    <div
                      key={`${product.id}-${idx}`}
                      className={`bg-white border-2 border-dashed border-slate-400 rounded-2xl flex flex-col justify-between text-center relative overflow-hidden transition-all print:border-solid print:border-slate-800 ${cardMinHeight}`}
                      style={{ direction: 'rtl' }}
                    >
                      {/* Optional Top Bar (Store Name & Code) */}
                      {hasTopBar && (
                        <div className="flex items-center justify-between border-b-2 border-slate-900 pb-1.5 mb-2 w-full">
                          {showStoreName ? (
                            <span className="text-xs sm:text-sm font-black text-slate-800 tracking-tight truncate">
                              {settings?.storeName || 'آجیل و خشکبار برادران جهانتیغ'}
                            </span>
                          ) : (
                            <span />
                          )}

                          {showCode && (
                            <div className="flex flex-col items-center justify-center overflow-hidden bg-white p-0.5 rounded-sm">
                              <BarcodeSvg
                                value={product.barcode || product.sku}
                                format="CODE128"
                                width={1.2}
                                height={28}
                                displayValue={true}
                                fontSize={9}
                                margin={2}
                                className="max-w-[150px]"
                              />
                            </div>
                          )}
                        </div>
                      )}

                      {/* Product Name (Optional / Clearable) */}
                      {finalName ? (
                        <div className="pt-1 pb-1 w-full max-w-full overflow-hidden">
                          <div
                            className={`text-slate-950 leading-tight tracking-tight truncate px-1 w-full ${nameFontClass}`}
                          >
                            {finalName}
                          </div>

                          {includeSubtitle && customSubtitle.trim() && (
                            <div className="text-xs font-bold text-amber-800 mt-1">
                              ★ {customSubtitle} ★
                            </div>
                          )}
                        </div>
                      ) : null}

                      {/* HERO Price Block - Centered, guaranteed no overflow */}
                      <div className="my-auto py-2 w-full max-w-full overflow-hidden flex flex-col items-center justify-center">
                        <div
                          className={`font-black text-slate-950 tracking-tight font-sans w-full max-w-full overflow-hidden text-center truncate ${priceFontClass}`}
                          style={{
                            fontVariantNumeric: 'tabular-nums',
                            wordBreak: 'keep-all',
                            whiteSpace: 'nowrap',
                            lineHeight: 1.15,
                          }}
                        >
                          {formattedPrice}
                        </div>

                        {/* Unit label placed cleanly beneath the number to preserve 100% horizontal width for digits */}
                        <div className="text-xs sm:text-sm font-black text-slate-700 mt-1 tracking-wider">
                          {unitLabel}
                        </div>

                        {showUnitText && (
                          <div
                            className={`font-black text-slate-800 mt-1.5 px-3 py-0.5 bg-slate-100 border border-slate-200 rounded-full ${
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
                      <div className="text-[9px] text-slate-400 absolute bottom-0.5 left-1 font-mono print:hidden select-none">
                        ✂ برش
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
