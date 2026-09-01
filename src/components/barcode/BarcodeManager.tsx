import React, { useState, useEffect } from 'react';
import { Product, StoreSettings } from '../../types';
import { apiRequest } from '../../services/api';
import { formatCurrency, formatNumber, getUnitLabel, toPersianDigits } from '../../utils/persian';
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
  Layers
} from 'lucide-react';

interface BarcodeManagerProps {
  settings: StoreSettings | null;
}

type PrintMode = 'STICKER_BARCODE' | 'SHELF_TAG';
type ShelfTagSize = 'JUMBO_WINDOW' | 'LARGE_STAND' | 'MEDIUM_TRAY' | 'COMPACT_RAIL';
type FontSizeScale = 'LARGE' | 'EXTRA_LARGE' | 'GIGANTIC';

export const BarcodeManager: React.FC<BarcodeManagerProps> = ({ settings }) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [printMode, setPrintMode] = useState<PrintMode>('SHELF_TAG');
  const [selectedProductId, setSelectedProductId] = useState<string>('');
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>([]);
  const [labelCount, setLabelCount] = useState<number>(6);
  const [shelfTagSize, setShelfTagSize] = useState<ShelfTagSize>('LARGE_STAND');
  const [fontScale, setFontScale] = useState<FontSizeScale>('GIGANTIC');
  const [showPrice, setShowPrice] = useState<boolean>(true);
  const [showStoreName, setShowStoreName] = useState<boolean>(true);
  const [showUnitText, setShowUnitText] = useState<boolean>(true);
  const [showBarcodeOnTag, setShowBarcodeOnTag] = useState<boolean>(true);
  const [includeSubtitle, setIncludeSubtitle] = useState<boolean>(false);
  const [customSubtitle, setCustomSubtitle] = useState<string>('درجه یک و دست‌چین اعلا');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const loadProducts = async () => {
    const res = await apiRequest<Product[]>('/products');
    if (res.success && res.data) {
      setProducts(res.data);
      if (res.data.length > 0 && !selectedProductId) {
        setSelectedProductId(res.data[0].id);
        setSelectedProductIds([res.data[0].id]);
      }
    }
  };

  useEffect(() => {
    loadProducts();
  }, []);

  const selectedProduct = products.find((p) => p.id === selectedProductId);

  const handleGenerateNewBarcode = async () => {
    if (!selectedProduct) return;
    setIsGenerating(true);
    const res = await apiRequest<{ barcode: string }>('/products/generate-barcode');
    if (res.success && res.data) {
      // Update product with new barcode
      const updateRes = await apiRequest<Product>(`/products/${selectedProduct.id}`, {
        method: 'PUT',
        body: JSON.stringify({ barcode: res.data.barcode }),
      });
      if (updateRes.success) {
        setSuccessMsg(`بارکد اختصاصی جدید (${res.data.barcode}) با موفقیت برای محصول ثبت شد.`);
        loadProducts();
        setTimeout(() => setSuccessMsg(null), 4000);
      }
    }
    setIsGenerating(false);
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
                ? 'چاپ اتیکت قیمت قفسه و سینی (فونت خیلی بزرگ)'
                : 'طراحی و چاپ بارکد و لیبل بسته‌بندی'}
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              {printMode === 'SHELF_TAG'
                ? 'کارت قیمت بزرگ و خوانا برای نصب روی لبه قفسه، ظروف شیشه‌ای و سینی‌های آجیل'
                : 'تولید بارکد استاندارد و چاپ برچسب‌های کوچک چسبان برای بسته‌ها'}
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
          <span>اتیکت قیمت قفسه و سینی (فونت درشت بدون برچسب تکی)</span>
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
          <span>برچسب بارکد کوچک چسبان (روی بسته کالا)</span>
        </button>
      </div>

      {successMsg && (
        <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 rounded-2xl text-xs flex items-center gap-2">
          <Check className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Main Content: Left Configuration + Right Printable Preview */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Configuration Column (5 Cols) */}
        <div className="lg:col-span-5 bg-[#141414] p-6 rounded-3xl border border-white/5 shadow-xl space-y-5">
          <h3 className="text-sm font-bold text-white border-b border-white/5 pb-3 flex items-center justify-between">
            <span>تنظیمات چاپ</span>
            <span className="text-[11px] text-amber-400 font-normal">
              {printMode === 'SHELF_TAG' ? 'حالت اتیکت قفسه' : 'حالت لیبل بارکد'}
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
              <div className="max-h-48 overflow-y-auto space-y-1.5 p-2 bg-white/5 rounded-2xl border border-white/10">
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
                    {p.name} - بارکد: {p.barcode}
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* If Sticker mode, show generate barcode button */}
          {printMode === 'STICKER_BARCODE' && selectedProduct && (
            <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-2xl flex items-center justify-between text-xs">
              <div>
                <div className="text-slate-400">بارکد فعلی محصول:</div>
                <div className="font-mono font-bold text-amber-400">{selectedProduct.barcode}</div>
              </div>
              <button
                type="button"
                onClick={handleGenerateNewBarcode}
                disabled={isGenerating}
                className="px-3 py-1.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 rounded-xl font-bold flex items-center gap-1 cursor-pointer transition-colors shadow-xs"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>تولید بارکد جدید</span>
              </button>
            </div>
          )}

          {/* Tag Size Selection for Shelf Mode */}
          {printMode === 'SHELF_TAG' && (
            <>
              <div className="space-y-2 pt-1">
                <label className="block text-xs font-bold text-slate-300">
                  ابعاد و سایز اتیکت قفسه:
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
                      title: 'سایز بزرگ استند و ویترین (۱۳ × ۹ سانتی‌متر)',
                      desc: 'دید عالی از فاصله دور با قیمت فوق‌العاده بزرگ',
                    },
                    {
                      id: 'MEDIUM_TRAY' as ShelfTagSize,
                      title: 'سایز متوسط سینی و شیشه (۹ × ۶ سانتی‌متر)',
                      desc: 'استاندارد برای سینی‌های آجیل، ظروف و قفسه‌ها',
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
                checked={showStoreName}
                onChange={(e) => setShowStoreName(e.target.checked)}
                className="w-4 h-4 rounded text-amber-500 focus:ring-amber-500 accent-amber-500 cursor-pointer"
              />
              <span>نمایش نام فروشگاه ({settings?.storeName || 'خشکبار'})</span>
            </label>

            <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={showPrice}
                onChange={(e) => setShowPrice(e.target.checked)}
                className="w-4 h-4 rounded text-amber-500 focus:ring-amber-500 accent-amber-500 cursor-pointer"
              />
              <span>نمایش قیمت فروش با فونت بزرگ</span>
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
                  <span>نمایش عبارت واحد (هر کیلوگرم / هر مثقال / هر صوت / هر عدد)</span>
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
                      placeholder="مثلاً: درجه یک اعلا، محصول امسال، اعلا"
                      className="w-full px-3 py-1.5 bg-black/40 border border-white/10 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-hidden focus:ring-1 focus:ring-amber-500"
                    />
                  )}
                </div>
              </>
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
                  : 'پیش‌نمایش برچسب‌های بارکد کوچک:'}
              </span>
              <span className="text-[11px] text-slate-500">
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
                      // Determine price font size class based on shelfTagSize + fontScale
                      let priceFontClass = 'text-3xl sm:text-4xl';
                      let nameFontClass = 'text-base sm:text-lg';
                      let cardMinHeight = 'min-h-[170px] p-3.5';

                      if (shelfTagSize === 'JUMBO_WINDOW') {
                        cardMinHeight = 'min-h-[280px] p-6';
                        nameFontClass = 'text-2xl sm:text-3xl md:text-4xl font-black';
                        priceFontClass =
                          fontScale === 'GIGANTIC'
                            ? 'text-6xl sm:text-7xl md:text-8xl'
                            : fontScale === 'EXTRA_LARGE'
                            ? 'text-5xl sm:text-6xl md:text-7xl'
                            : 'text-4xl sm:text-5xl md:text-6xl';
                      } else if (shelfTagSize === 'LARGE_STAND') {
                        cardMinHeight = 'min-h-[220px] p-4 sm:p-5';
                        nameFontClass = 'text-xl sm:text-2xl md:text-3xl font-black';
                        priceFontClass =
                          fontScale === 'GIGANTIC'
                            ? 'text-5xl sm:text-6xl'
                            : fontScale === 'EXTRA_LARGE'
                            ? 'text-4xl sm:text-5xl'
                            : 'text-3xl sm:text-4xl';
                      } else if (shelfTagSize === 'MEDIUM_TRAY') {
                        cardMinHeight = 'min-h-[180px] p-3.5';
                        nameFontClass = 'text-lg sm:text-xl font-black';
                        priceFontClass =
                          fontScale === 'GIGANTIC'
                            ? 'text-4xl sm:text-5xl'
                            : fontScale === 'EXTRA_LARGE'
                            ? 'text-3xl sm:text-4xl'
                            : 'text-2xl sm:text-3xl';
                      } else if (shelfTagSize === 'COMPACT_RAIL') {
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

                            {showBarcodeOnTag && (
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
                          {showPrice && (
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
                                    shelfTagSize === 'JUMBO_WINDOW'
                                      ? 'text-lg sm:text-2xl'
                                      : shelfTagSize === 'LARGE_STAND'
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
                          <div className="text-[9px] text-slate-400 absolute bottom-0.5 left-1 font-mono print:hidden">
                            ✂ خط برش
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
                  {Array.from({ length: labelCount }).map((_, idx) => (
                    <div
                      key={idx}
                      className="p-3 bg-white text-slate-900 border border-dashed border-slate-300 rounded-xl text-center flex flex-col items-center justify-between min-h-[140px] shadow-sm"
                    >
                      {showStoreName && (
                        <div className="text-[10px] font-bold text-slate-700 border-b border-slate-100 w-full pb-1 mb-1 truncate">
                          {settings?.storeName || 'زعفران طلایی'}
                        </div>
                      )}

                      <div className="text-[11px] font-black text-slate-900 leading-tight w-full truncate mb-1">
                        {selectedProduct.name}
                      </div>

                      {/* Standard Vector-like Barcode Simulation */}
                      <div className="w-full flex flex-col items-center py-1">
                        <div className="h-10 w-full max-w-[130px] flex items-stretch justify-center gap-[2px] bg-slate-950 px-1 py-0.5 rounded-xs">
                          {selectedProduct.barcode.split('').map((char, i) => (
                            <div
                              key={i}
                              className={`h-full ${
                                (parseInt(char, 10) + i) % 2 === 0
                                  ? 'bg-white w-[2px]'
                                  : 'bg-transparent w-[3px]'
                              }`}
                            />
                          ))}
                        </div>
                        <div className="font-mono text-[10px] font-bold tracking-widest text-slate-800 mt-1">
                          {selectedProduct.barcode}
                        </div>
                      </div>

                      {showPrice && (
                        <div className="text-xs font-black text-slate-900 pt-1 border-t border-slate-100 w-full mt-1">
                          {formatCurrency(selectedProduct.salePrice)}
                        </div>
                      )}
                    </div>
                  ))}
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
