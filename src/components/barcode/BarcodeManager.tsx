import React, { useState, useEffect } from 'react';
import { Product, StoreSettings } from '../../types';
import { apiRequest } from '../../services/api';
import { formatCurrency, formatNumber, getUnitLabel, toPersianDigits } from '../../utils/persian';
import { getSafePriceFontClass, ShelfTagSize, FontSizeScale } from '../products/ShelfPriceTagModal';
import { BarcodeSvg } from '../common/BarcodeSvg';
import {
  Barcode as BarcodeIcon,
  Printer,
  Sparkles,
  Check,
  Search,
  Tag,
  Maximize2,
  CheckSquare,
  Square,
  Layers,
  Type,
  Eraser,
  RotateCcw,
  AlertCircle,
  X
} from 'lucide-react';

interface BarcodeManagerProps {
  settings: StoreSettings | null;
}

type PrintMode = 'STICKER_BARCODE' | 'SHELF_TAG';

export const BarcodeManager: React.FC<BarcodeManagerProps> = ({ settings }) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [printMode, setPrintMode] = useState<PrintMode>('SHELF_TAG');
  const [selectedProductId, setSelectedProductId] = useState<string>('');
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>([]);
  const [labelCount, setLabelCount] = useState<number>(6);
  const [shelfTagSize, setShelfTagSize] = useState<ShelfTagSize>('LARGE_STAND');
  const [fontScale, setFontScale] = useState<FontSizeScale>('GIGANTIC');

  // Minimalist defaults per user request: only price with large font, clearable name
  const [showPrice, setShowPrice] = useState<boolean>(true);
  const [showProductName, setShowProductName] = useState<boolean>(true);
  const [customProductName, setCustomProductName] = useState<string>('');
  const [showStoreName, setShowStoreName] = useState<boolean>(false);
  const [showUnitText, setShowUnitText] = useState<boolean>(false);
  const [showBarcodeOnTag, setShowBarcodeOnTag] = useState<boolean>(false);
  const [showBarcodeInSticker, setShowBarcodeInSticker] = useState<boolean>(true);
  const [includeSubtitle, setIncludeSubtitle] = useState<boolean>(false);
  const [customSubtitle, setCustomSubtitle] = useState<string>('درجه یک و دست‌چین اعلا');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const loadProducts = async () => {
    const res = await apiRequest<Product[]>('/products');
    if (res.success && res.data) {
      setProducts(res.data);
      if (res.data.length > 0 && !selectedProductId) {
        setSelectedProductId(res.data[0].id);
        setSelectedProductIds([res.data[0].id]);
        setCustomProductName(res.data[0].name);
      }
    }
  };

  useEffect(() => {
    loadProducts();
  }, []);

  const selectedProduct = products.find((p) => p.id === selectedProductId);

  // Sync custom name when selectedProduct changes
  useEffect(() => {
    if (selectedProduct) {
      setCustomProductName(selectedProduct.name);
    }
  }, [selectedProductId]);

  const handleGenerateNewBarcode = async (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    if (!selectedProduct) return;
    setIsGenerating(true);
    try {
      const res = await apiRequest<{ barcode: string }>('/products/generate-barcode');
      if (res.success && res.data?.barcode) {
        const updateRes = await apiRequest<Product>(`/products/${selectedProduct.id}`, {
          method: 'PUT',
          body: JSON.stringify({ barcode: res.data.barcode }),
        });
        if (updateRes.success) {
          setSuccessMsg(`بارکد اختصاصی جدید (${res.data.barcode}) با موفقیت برای محصول ثبت شد.`);
          await loadProducts();
          setTimeout(() => setSuccessMsg(null), 4000);
        } else {
          setErrorMsg(updateRes.message || 'خطا در ثبت بارکد جدید');
          setTimeout(() => setErrorMsg(null), 4000);
        }
      } else {
        setErrorMsg('خطا در تولید بارکد از سرور');
        setTimeout(() => setErrorMsg(null), 4000);
      }
    } catch (err: any) {
      setErrorMsg('خطای اتصال به سرور: ' + (err?.message || ''));
      setTimeout(() => setErrorMsg(null), 4000);
    } finally {
      setIsGenerating(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const filteredProducts = products.filter(
    (p) =>
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.barcode.includes(searchQuery)
  );

  // Products to print for shelf tags
  const shelfPrintProducts =
    selectedProductIds.length > 0
      ? products.filter((p) => selectedProductIds.includes(p.id))
      : selectedProduct
      ? [selectedProduct]
      : [];

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#141414] p-6 rounded-3xl border border-white/5 shadow-xl">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center">
            {printMode === 'SHELF_TAG' ? (
              <Tag className="w-6 h-6" />
            ) : (
              <BarcodeIcon className="w-6 h-6" />
            )}
          </div>
          <div>
            <h2 className="text-lg font-black text-white">
              {printMode === 'SHELF_TAG'
                ? 'چاپ اتیکت و لیبل قیمت (فونت درشت بدون خروج از کادر)'
                : 'طراحی و چاپ لیبل‌های برچسبی'}
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              {printMode === 'SHELF_TAG'
                ? 'کارت قیمت بزرگ با خوانایی بالا از دور، قابلیت حذف نام محصول و کنترل کامل متن'
                : 'چاپ برچسب‌های چسبان با قیمت بزرگ، بارکد و نام محصول'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            id="print-action-btn"
            onClick={handlePrint}
            disabled={printMode === 'SHELF_TAG' ? shelfPrintProducts.length === 0 : !selectedProduct}
            className="flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black rounded-2xl text-xs transition-all shadow-md shadow-amber-500/20 cursor-pointer disabled:opacity-50"
          >
            <Printer className="w-4 h-4" />
            <span>
              {printMode === 'SHELF_TAG'
                ? `چاپ اتیکت‌های قفسه (${toPersianDigits(shelfPrintProducts.length * labelCount)} عدد)`
                : `چاپ برچسب‌ها (${toPersianDigits(labelCount)} عدد)`}
            </span>
          </button>
        </div>
      </div>

      {/* Mode Switch Tabs */}
      <div className="flex bg-[#141414] p-1.5 rounded-2xl border border-white/5 w-fit">
        <button
          type="button"
          onClick={() => setPrintMode('SHELF_TAG')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            printMode === 'SHELF_TAG'
              ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Tag className="w-4 h-4" />
          <span>اتیکت قیمت قفسه و سینی (فونت خیلی بزرگ)</span>
        </button>
        <button
          type="button"
          onClick={() => setPrintMode('STICKER_BARCODE')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            printMode === 'STICKER_BARCODE'
              ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <BarcodeIcon className="w-4 h-4" />
          <span>لیبل برچسبی بارکد کالا</span>
        </button>
      </div>

      {/* Success Notification */}
      {successMsg && (
        <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl text-emerald-400 text-xs flex items-center gap-2">
          <Check className="w-4 h-4 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Error Notification */}
      {errorMsg && (
        <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-2xl text-rose-400 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Controls Column (5 cols) */}
        <div className="lg:col-span-5 bg-[#141414] p-6 rounded-3xl border border-white/5 shadow-xl space-y-5">
          <h3 className="text-sm font-bold text-white border-b border-white/5 pb-3 flex items-center justify-between">
            <span>تنظیمات چاپ لیبل</span>
            <span className="text-[11px] text-amber-400 font-normal">
              {printMode === 'SHELF_TAG' ? 'حالت اتیکت قفسه و سینی' : 'حالت برچسب بارکد'}
            </span>
          </h3>

          {/* Product Search & Select */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-bold text-slate-300">
                {printMode === 'SHELF_TAG' ? 'انتخاب کالاهای موردنظر:' : 'انتخاب کالا:'}
              </label>
              {printMode === 'SHELF_TAG' && (
                <button
                  type="button"
                  onClick={() => {
                    if (selectedProductIds.length === filteredProducts.length) {
                      setSelectedProductIds([]);
                    } else {
                      setSelectedProductIds(filteredProducts.map((p) => p.id));
                    }
                  }}
                  className="text-[11px] text-amber-400 hover:underline flex items-center gap-1 cursor-pointer"
                >
                  {selectedProductIds.length === filteredProducts.length ? (
                    <>
                      <CheckSquare className="w-3.5 h-3.5" />
                      <span>عدم انتخاب همه</span>
                    </>
                  ) : (
                    <>
                      <Square className="w-3.5 h-3.5" />
                      <span>انتخاب همه ({toPersianDigits(filteredProducts.length)})</span>
                    </>
                  )}
                </button>
              )}
            </div>

            <div className="relative mb-2">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="جستجوی نام یا بارکد کالا..."
                className="w-full pl-3 pr-8 py-2 bg-white/5 border border-white/10 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-hidden focus:ring-1 focus:ring-amber-500"
              />
              <Search className="w-3.5 h-3.5 text-slate-500 absolute right-2.5 top-2.5" />
            </div>

            {printMode === 'SHELF_TAG' ? (
              <div className="max-h-44 overflow-y-auto space-y-1.5 p-2 bg-white/5 rounded-2xl border border-white/10">
                {filteredProducts.map((p) => {
                  const isChecked = selectedProductIds.includes(p.id);
                  return (
                    <label
                      key={p.id}
                      className={`flex items-center justify-between p-2 rounded-xl text-xs cursor-pointer transition-colors ${
                        isChecked ? 'bg-amber-500/10 text-white' : 'hover:bg-white/5 text-slate-300'
                      }`}
                    >
                      <div className="flex items-center gap-2 truncate">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedProductIds((prev) => [...prev, p.id]);
                            } else {
                              setSelectedProductIds((prev) => prev.filter((id) => id !== p.id));
                            }
                          }}
                          className="w-4 h-4 rounded text-amber-500 accent-amber-500 cursor-pointer"
                        />
                        <span className="font-bold truncate">{p.name}</span>
                      </div>
                      <span className="text-[11px] font-mono text-amber-400 font-sans shrink-0 mr-2">
                        {formatCurrency(p.salePrice)}
                      </span>
                    </label>
                  );
                })}
              </div>
            ) : (
              <select
                id="barcode-product-select"
                value={selectedProductId}
                onChange={(e) => setSelectedProductId(e.target.value)}
                className="w-full p-2.5 bg-white/5 border border-white/10 rounded-xl text-xs font-medium text-white focus:outline-hidden focus:ring-1 focus:ring-amber-500"
              >
                {filteredProducts.map((p) => (
                  <option key={p.id} value={p.id} className="bg-[#1e1e1e] text-white">
                    {p.name} - قیمت: {formatNumber(p.salePrice)} تومان
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Product Name Controls & Eraser Button */}
          <div className="p-3.5 bg-white/5 rounded-2xl border border-white/5 space-y-3">
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 text-xs font-bold text-slate-300 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={showProductName}
                  onChange={(e) => setShowProductName(e.target.checked)}
                  className="w-4 h-4 rounded text-amber-500 accent-amber-500 cursor-pointer"
                />
                <span>نمایش نام محصول روی لیبل</span>
              </label>

              {showProductName && (
                <button
                  type="button"
                  onClick={() => {
                    setCustomProductName('');
                    setShowProductName(false);
                  }}
                  className="text-[11px] text-rose-400 hover:text-rose-300 flex items-center gap-1 cursor-pointer bg-rose-500/10 px-2 py-1 rounded-lg border border-rose-500/20 transition-colors"
                  title="پاک کردن نام محصول تا فقط قیمت چاپ شود"
                >
                  <Eraser className="w-3.5 h-3.5" />
                  <span>پاک کردن نام (فقط قیمت)</span>
                </button>
              )}
            </div>

            {showProductName && (
              <div className="space-y-1.5 pt-1">
                <div className="flex items-center justify-between text-[11px] text-slate-400">
                  <span>عنوان نمایشی روی لیبل (قابل ویرایش یا پاک کردن):</span>
                  {selectedProduct && customProductName !== selectedProduct.name && (
                    <button
                      type="button"
                      onClick={() => setCustomProductName(selectedProduct.name)}
                      className="text-amber-400 hover:underline flex items-center gap-0.5"
                    >
                      <RotateCcw className="w-3 h-3" />
                      <span>بازگردانی نام</span>
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
          </div>

          {/* Tag Size Selection for Shelf Mode */}
          {printMode === 'SHELF_TAG' && (
            <>
              <div className="space-y-2 pt-1">
                <label className="block text-xs font-bold text-slate-300">
                  ابعاد و قالب اتیکت قیمت:
                </label>
                <div className="grid grid-cols-1 gap-2">
                  {[
                    {
                      id: 'JUMBO_WINDOW' as ShelfTagSize,
                      title: 'سایز غول‌پیکر ویترینی (نصف برگ A4 - ۱۶ × ۱۰ سانتی‌متر)',
                      desc: 'بزرگترین فونت ممکن - دید عالی از دورترین فاصله',
                    },
                    {
                      id: 'LARGE_STAND' as ShelfTagSize,
                      title: 'سایز بزرگ استند و سینی (۱۳ × ۹ سانتی‌متر)',
                      desc: 'دید عالی از فاصله دور با قیمت درشت',
                    },
                    {
                      id: 'MEDIUM_TRAY' as ShelfTagSize,
                      title: 'سایز متوسط سینی و شیشه (۹ × ۶ سانتی‌متر)',
                      desc: 'استاندارد برای سینی‌های خشکبار و ظروف',
                    },
                    {
                      id: 'COMPACT_RAIL' as ShelfTagSize,
                      title: 'سایز باریک نوار قفسه (۱۰ × ۴.۵ سانتی‌متر)',
                      desc: 'مخصوص ریل قیمت فلزی یا پلاستیکی لبه قفسه',
                    },
                  ].map((s) => (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => setShelfTagSize(s.id)}
                      className={`p-2.5 rounded-xl text-right border transition-all cursor-pointer ${
                        shelfTagSize === s.id
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
              <div className="space-y-2 pt-1 border-t border-white/5">
                <label className="block text-xs font-bold text-slate-300">
                  میزان درشتی فونت قیمت:
                </label>
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
            </>
          )}

          {/* Label Copies */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-300">
              تعداد چاپ {printMode === 'SHELF_TAG' ? 'از هر اتیکت' : 'برچسب'}:
            </label>
            <div className="grid grid-cols-4 gap-2">
              {(printMode === 'SHELF_TAG' ? [1, 2, 4, 6] : [6, 12, 24, 48]).map((qty) => (
                <button
                  key={qty}
                  type="button"
                  onClick={() => setLabelCount(qty)}
                  className={`py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                    labelCount === qty
                      ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 border-amber-500 shadow-xs'
                      : 'bg-white/5 text-slate-300 border-white/5 hover:bg-white/10'
                  }`}
                >
                  {toPersianDigits(qty)} عدد
                </button>
              ))}
            </div>
          </div>

          {/* Options Checkboxes */}
          <div className="space-y-3 pt-2 border-t border-white/5">
            <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={showPrice}
                onChange={(e) => setShowPrice(e.target.checked)}
                className="w-4 h-4 rounded text-amber-500 focus:ring-amber-500 accent-amber-500 cursor-pointer"
              />
              <span>نمایش قیمت فروش با فونت بزرگ</span>
            </label>

            <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={showStoreName}
                onChange={(e) => setShowStoreName(e.target.checked)}
                className="w-4 h-4 rounded text-amber-500 focus:ring-amber-500 accent-amber-500 cursor-pointer"
              />
              <span>نمایش نام فروشگاه ({settings?.storeName || 'آجیل و خشکبار برادران جهانتیغ'})</span>
            </label>

            {printMode === 'SHELF_TAG' && (
              <>
                <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={showUnitText}
                    onChange={(e) => setShowUnitText(e.target.checked)}
                    className="w-4 h-4 rounded text-amber-500 focus:ring-amber-500 accent-amber-500 cursor-pointer"
                  />
                  <span>نمایش عبارت واحد (مثلاً هر کیلوگرم)</span>
                </label>

                <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={showBarcodeOnTag}
                    onChange={(e) => setShowBarcodeOnTag(e.target.checked)}
                    className="w-4 h-4 rounded text-amber-500 focus:ring-amber-500 accent-amber-500 cursor-pointer"
                  />
                  <span>نمایش بارکد و کد کالا در بالای اتیکت</span>
                </label>

                <div className="pt-2 border-t border-white/5 space-y-1.5">
                  <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={includeSubtitle}
                      onChange={(e) => setIncludeSubtitle(e.target.checked)}
                      className="w-4 h-4 rounded text-amber-500 accent-amber-500 cursor-pointer"
                    />
                    <span>درج نشان کیفیت یا توضیحات روی اتیکت:</span>
                  </label>
                  {includeSubtitle && (
                    <input
                      type="text"
                      value={customSubtitle}
                      onChange={(e) => setCustomSubtitle(e.target.value)}
                      placeholder="مثلاً: درجه یک اعلا، دست‌چین امسال"
                      className="w-full px-3 py-1.5 bg-black/40 border border-white/10 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-hidden focus:ring-1 focus:ring-amber-500"
                    />
                  )}
                </div>
              </>
            )}

            {printMode === 'STICKER_BARCODE' && (
              <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={showBarcodeInSticker}
                  onChange={(e) => setShowBarcodeInSticker(e.target.checked)}
                  className="w-4 h-4 rounded text-amber-500 focus:ring-amber-500 accent-amber-500 cursor-pointer"
                />
                <span>نمایش خطوط بارکد استاندارد روی برچسب</span>
              </label>
            )}
          </div>
        </div>

        {/* Printable Preview Sheet (7 Cols) */}
        <div className="lg:col-span-7 bg-[#141414] p-6 rounded-3xl border border-white/5 shadow-xl flex flex-col justify-between overflow-x-auto">
          <div>
            <div className="flex items-center justify-between mb-4 border-b border-white/5 pb-2">
              <span className="text-xs font-bold text-slate-300">
                {printMode === 'SHELF_TAG'
                  ? 'پیش‌نمایش اتیکت‌های قیمت قفسه (آماده برای برش با قیچی):'
                  : 'پیش‌نمایش برچسب‌های چاپ:'}
              </span>
              <span className="text-[11px] text-slate-400">
                {printMode === 'SHELF_TAG'
                  ? `${toPersianDigits(shelfPrintProducts.length * labelCount)} اتیکت در صفحه`
                  : 'مناسب کاغذهای لیبل و پرینتر حرارتی'}
              </span>
            </div>

            {/* SHELF TAG PRINTABLE VIEW */}
            {printMode === 'SHELF_TAG' ? (
              shelfPrintProducts.length > 0 ? (
                <div
                  id="printable-price-labels"
                  className={`w-full bg-white text-slate-950 p-4 rounded-2xl shadow-lg grid gap-4 ${
                    shelfTagSize === 'JUMBO_WINDOW'
                      ? 'grid-cols-1'
                      : shelfTagSize === 'LARGE_STAND'
                      ? 'grid-cols-1 sm:grid-cols-2'
                      : shelfTagSize === 'COMPACT_RAIL'
                      ? 'grid-cols-2 sm:grid-cols-3'
                      : 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3'
                  }`}
                >
                  {shelfPrintProducts.flatMap((product) =>
                    Array.from({ length: labelCount }).map((_, idx) => {
                      // Determine final name to display
                      const isSingle = shelfPrintProducts.length === 1;
                      const finalName = showProductName
                        ? isSingle && customProductName !== undefined
                          ? customProductName.trim()
                          : product.name
                        : '';

                      const formattedPrice = formatNumber(product.salePrice);
                      const priceFontClass = getSafePriceFontClass(formattedPrice, shelfTagSize, fontScale);

                      let cardMinHeight = 'min-h-[170px] p-4';
                      let nameFontClass = 'text-base sm:text-lg font-black';

                      if (shelfTagSize === 'JUMBO_WINDOW') {
                        cardMinHeight = 'min-h-[260px] p-6';
                        nameFontClass = 'text-xl sm:text-2xl md:text-3xl font-black';
                      } else if (shelfTagSize === 'LARGE_STAND') {
                        cardMinHeight = 'min-h-[200px] p-4 sm:p-5';
                        nameFontClass = 'text-lg sm:text-xl font-black';
                      } else if (shelfTagSize === 'MEDIUM_TRAY') {
                        cardMinHeight = 'min-h-[170px] p-3.5';
                        nameFontClass = 'text-base sm:text-lg font-black';
                      } else if (shelfTagSize === 'COMPACT_RAIL') {
                        cardMinHeight = 'min-h-[130px] p-3';
                        nameFontClass = 'text-sm sm:text-base font-black';
                      }

                      const hasTopBar = showStoreName || showBarcodeOnTag;

                      return (
                        <div
                          key={`${product.id}-${idx}`}
                          className={`bg-white border-2 border-dashed border-slate-400 rounded-2xl flex flex-col justify-between text-center relative overflow-hidden transition-all print:border-solid print:border-slate-800 ${cardMinHeight}`}
                          style={{ direction: 'rtl' }}
                        >
                          {/* Top Bar: Store Name & Code */}
                          {hasTopBar && (
                            <div className="flex items-center justify-between border-b-2 border-slate-900 pb-1.5 mb-2 w-full">
                              {showStoreName ? (
                                <span className="text-xs sm:text-sm font-black text-slate-800 tracking-tight truncate">
                                  {settings?.storeName || 'آجیل و خشکبار برادران جهانتیغ'}
                                </span>
                              ) : (
                                <span />
                              )}

                              {showBarcodeOnTag && (
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

                          {/* Product Name (EXTRA BOLD & PROMINENT, or omitted if cleared) */}
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

                          {/* HERO Price Block - Centered, guaranteed zero overflow */}
                          {showPrice && (
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

                              <div className="text-xs sm:text-sm font-black text-slate-700 mt-1 tracking-wider">
                                تومان
                              </div>

                              {showUnitText && (
                                <div
                                  className={`font-black text-slate-800 mt-1.5 px-3 py-0.5 bg-slate-100 border border-slate-200 rounded-full ${
                                    shelfTagSize === 'JUMBO_WINDOW'
                                      ? 'text-sm sm:text-base'
                                      : 'text-xs sm:text-sm'
                                  }`}
                                >
                                  به ازای هر {getUnitLabel(product.unit)}
                                </div>
                              )}
                            </div>
                          )}

                          {/* Scissors Cut Indicator Notice */}
                          <div className="text-[9px] text-slate-400 absolute bottom-0.5 left-1 font-mono print:hidden select-none">
                            ✂ برش
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              ) : (
                <div className="p-8 text-center text-slate-500 text-xs">
                  لطفاً حداقل یک محصول را از لیست سمت راست انتخاب نمایید.
                </div>
              )
            ) : (
              /* STICKER BARCODE PRINTABLE VIEW */
              selectedProduct ? (
                <div
                  id="printable-barcodes"
                  className="grid grid-cols-2 sm:grid-cols-3 gap-3 p-4 bg-white/5 rounded-2xl border border-white/10"
                >
                  {Array.from({ length: labelCount }).map((_, idx) => {
                    const finalName = showProductName
                      ? customProductName.trim() || selectedProduct.name
                      : '';

                    return (
                      <div
                        key={idx}
                        className="p-3.5 bg-white text-slate-900 border border-dashed border-slate-300 rounded-2xl text-center flex flex-col items-center justify-between min-h-[140px] shadow-sm overflow-hidden"
                      >
                        {showStoreName && (
                          <div className="text-[10px] font-bold text-slate-700 border-b border-slate-100 w-full pb-1 mb-1 truncate">
                            {settings?.storeName || 'آجیل و خشکبار برادران جهانتیغ'}
                          </div>
                        )}

                        {finalName && (
                          <div className="text-xs font-black text-slate-900 leading-tight w-full truncate mb-1 px-1">
                            {finalName}
                          </div>
                        )}

                        {/* Genuine High-Resolution Scanner-Readable Barcode (Code 128) */}
                        {showBarcodeInSticker && (
                          <div className="w-full flex flex-col items-center py-1 overflow-hidden bg-white">
                            <BarcodeSvg
                              value={selectedProduct.barcode || selectedProduct.sku}
                              format="CODE128"
                              width={1.6}
                              height={42}
                              displayValue={true}
                              fontSize={11}
                              margin={6}
                              className="w-full max-w-[210px]"
                            />
                          </div>
                        )}

                        {/* Large Price Display */}
                        {showPrice && (
                          <div className="my-auto py-1 w-full flex flex-col items-center justify-center">
                            <div
                              className="text-2xl sm:text-3xl font-black text-slate-950 font-sans tracking-tight truncate w-full"
                              style={{ fontVariantNumeric: 'tabular-nums' }}
                            >
                              {formatNumber(selectedProduct.salePrice)}
                            </div>
                            <div className="text-[11px] font-black text-slate-700 mt-0.5">
                              تومان
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="p-8 text-center text-slate-500 text-xs">
                  لطفاً یک محصول را انتخاب نمایید.
                </div>
              )
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
