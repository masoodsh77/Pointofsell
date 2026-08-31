import React, { useState, useEffect } from 'react';
import { Product, StoreSettings } from '../../types';
import { apiRequest } from '../../services/api';
import { formatCurrency, toPersianDigits } from '../../utils/persian';
import { Barcode as BarcodeIcon, Printer, RefreshCw, Sparkles, Check, Search } from 'lucide-react';

interface BarcodeManagerProps {
  settings: StoreSettings | null;
}

export const BarcodeManager: React.FC<BarcodeManagerProps> = ({ settings }) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedProductId, setSelectedProductId] = useState<string>('');
  const [labelCount, setLabelCount] = useState<number>(12);
  const [showPrice, setShowPrice] = useState<boolean>(true);
  const [showStoreName, setShowStoreName] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const loadProducts = async () => {
    const res = await apiRequest<Product[]>('/products');
    if (res.success && res.data) {
      setProducts(res.data);
      if (res.data.length > 0 && !selectedProductId) {
        setSelectedProductId(res.data[0].id);
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

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#141414] p-6 rounded-3xl border border-white/5 shadow-xl">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center">
            <BarcodeIcon className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-black text-white">طراحی و چاپ بارکد کالا</h2>
            <p className="text-xs text-slate-400 mt-0.5">
              تولید بارکد استاندارد برای محصولات فاقد بارکد و چاپ برچسب قیمت روی بسته‌بندی
            </p>
          </div>
        </div>

        <button
          id="print-barcodes-btn"
          onClick={handlePrint}
          disabled={!selectedProduct}
          className="flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold rounded-2xl text-xs transition-all shadow-md shadow-amber-500/20 cursor-pointer disabled:opacity-50"
        >
          <Printer className="w-4 h-4" />
          <span>چاپ برچسب‌ها ({toPersianDigits(labelCount)} عدد)</span>
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
          <h3 className="text-sm font-bold text-white border-b border-white/5 pb-3">
            تنظیمات چاپ برچسب
          </h3>

          {/* Product Search & Select */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-slate-300">انتخاب محصول:</label>
            <div className="relative mb-2">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="فیلتر نام یا بارکد..."
                className="w-full pl-3 pr-8 py-2 bg-white/5 border border-white/10 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-hidden focus:ring-1 focus:ring-amber-500"
              />
              <Search className="w-3.5 h-3.5 text-slate-500 absolute right-2.5 top-2.5" />
            </div>
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
          </div>

          {/* Generate Barcode Button */}
          {selectedProduct && (
            <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-2xl flex items-center justify-between text-xs">
              <div>
                <div className="text-slate-400">بارکد فعلی:</div>
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

          {/* Label Quantity */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-300">تعداد برچسب برای چاپ:</label>
            <div className="grid grid-cols-4 gap-2">
              {[6, 12, 24, 48].map((qty) => (
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

          {/* Label Customization Checkboxes */}
          <div className="space-y-3 pt-2 border-t border-white/5">
            <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={showStoreName}
                onChange={(e) => setShowStoreName(e.target.checked)}
                className="w-4 h-4 rounded text-amber-500 focus:ring-amber-500 accent-amber-500"
              />
              <span>نمایش نام فروشگاه در بالای برچسب</span>
            </label>

            <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={showPrice}
                onChange={(e) => setShowPrice(e.target.checked)}
                className="w-4 h-4 rounded text-amber-500 focus:ring-amber-500 accent-amber-500"
              />
              <span>نمایش قیمت فروش روی برچسب</span>
            </label>
          </div>
        </div>

        {/* Printable Label Grid Preview (7 Cols) */}
        <div className="lg:col-span-7 bg-[#141414] p-6 rounded-3xl border border-white/5 shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-bold text-slate-300">پیش‌نمایش برچسب‌های چاپی:</span>
              <span className="text-[11px] text-slate-500">مناسب کاغذهای لیبل و پرینتر حرارتی</span>
            </div>

            {selectedProduct ? (
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
              <div className="p-8 text-center text-slate-500 text-xs">لطفاً یک محصول را انتخاب نمایید.</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
