import React, { useState, useEffect } from 'react';
import { Product, Category, ProductUnit, StoreSettings } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { apiRequest } from '../../services/api';
import {
  formatCurrency,
  formatWeightOrQuantity,
  getUnitLabel,
  toPersianDigits
} from '../../utils/persian';
import { CameraBarcodeScannerModal } from '../common/CameraBarcodeScannerModal';
import { BulkPriceUpdateModal } from './BulkPriceUpdateModal';
import { ShelfPriceTagModal } from './ShelfPriceTagModal';
import {
  Package,
  Plus,
  Edit,
  Trash2,
  Search,
  Filter,
  Sparkles,
  Barcode,
  Scale,
  AlertCircle,
  X,
  Check,
  Camera,
  CheckSquare,
  Square,
  DollarSign,
  Tag
} from 'lucide-react';

interface ProductsViewProps {
  settings?: StoreSettings | null;
  onRefreshData?: () => void;
}

export const ProductsView: React.FC<ProductsViewProps> = ({ settings, onRefreshData }) => {
  const { isAdmin } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [onlyLowStock, setOnlyLowStock] = useState<boolean>(false);

  // Bulk Selection & Price Modal State
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>([]);
  const [showBulkPriceModal, setShowBulkPriceModal] = useState<boolean>(false);

  // Shelf Price Tag Modal State
  const [showShelfTagModal, setShowShelfTagModal] = useState<boolean>(false);
  const [shelfTagProducts, setShelfTagProducts] = useState<Product[]>([]);

  // Modal State
  const [showModal, setShowModal] = useState<boolean>(false);
  const [showCameraScanner, setShowCameraScanner] = useState<boolean>(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    sku: '',
    barcode: '',
    categoryId: '',
    purchasePrice: 0,
    salePrice: 0,
    stock: 0,
    minimumStock: 5,
    unit: 'KG' as ProductUnit,
    isWeighted: true,
    description: '',
  });

  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const loadData = async () => {
    const [prodRes, catRes] = await Promise.all([
      apiRequest<Product[]>('/products'),
      apiRequest<Category[]>('/categories'),
    ]);

    if (prodRes.success && prodRes.data) setProducts(prodRes.data);
    if (catRes.success && catRes.data) {
      setCategories(catRes.data);
      if (catRes.data.length > 0 && !formData.categoryId) {
        setFormData((prev) => ({ ...prev, categoryId: catRes.data[0].id }));
      }
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const openAddModal = () => {
    setEditingProduct(null);
    setFormData({
      name: '',
      sku: `SKU-${Date.now().toString().slice(-6)}`,
      barcode: '',
      categoryId: categories[0]?.id || '',
      purchasePrice: 0,
      salePrice: 0,
      stock: 0,
      minimumStock: 5,
      unit: 'KG',
      isWeighted: true,
      description: '',
    });
    setShowModal(true);
  };

  const openEditModal = (p: Product) => {
    setEditingProduct(p);
    setFormData({
      name: p.name,
      sku: p.sku,
      barcode: p.barcode,
      categoryId: p.categoryId,
      purchasePrice: p.purchasePrice || 0,
      salePrice: p.salePrice,
      stock: p.stock,
      minimumStock: p.minimumStock,
      unit: p.unit,
      isWeighted: p.isWeighted,
      description: p.description || '',
    });
    setShowModal(true);
  };

  const handleGenerateBarcode = async () => {
    const res = await apiRequest<{ barcode: string }>('/products/generate-barcode');
    if (res.success && res.data) {
      setFormData((prev) => ({ ...prev, barcode: res.data!.barcode }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!formData.name.trim() || formData.salePrice <= 0) {
      setErrorMsg('نام محصول و قیمت فروش معتبر الزامی است.');
      return;
    }

    if (editingProduct) {
      const res = await apiRequest<Product>(`/products/${editingProduct.id}`, {
        method: 'PUT',
        body: JSON.stringify(formData),
      });

      if (res.success) {
        setSuccessMsg('محصول با موفقیت ویرایش شد.');
        setShowModal(false);
        loadData();
        if (onRefreshData) onRefreshData();
      } else {
        setErrorMsg(res.message || 'خطا در ویرایش محصول');
      }
    } else {
      const res = await apiRequest<Product>('/products', {
        method: 'POST',
        body: JSON.stringify(formData),
      });

      if (res.success) {
        setSuccessMsg('محصول جدید با موفقیت ثبت شد.');
        setShowModal(false);
        loadData();
        if (onRefreshData) onRefreshData();
      } else {
        setErrorMsg(res.message || 'خطا در ایجاد محصول');
      }
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!window.confirm(`آیا از حذف محصول "${name}" اطمینان دارید؟`)) return;

    const res = await apiRequest(`/products/${id}`, { method: 'DELETE' });
    if (res.success) {
      setSuccessMsg('محصول با موفقیت حذف شد.');
      loadData();
      if (onRefreshData) onRefreshData();
    } else {
      setErrorMsg(res.message || 'خطا در حذف محصول');
    }
  };

  const filteredProducts = products.filter((p) => {
    const matchesCat = selectedCategory === 'ALL' || p.categoryId === selectedCategory;
    const matchesLow = !onlyLowStock || p.stock <= p.minimumStock;
    const q = searchQuery.trim().toLowerCase();
    const matchesSearch =
      !q ||
      p.name.toLowerCase().includes(q) ||
      p.sku.toLowerCase().includes(q) ||
      p.barcode.includes(q);
    return matchesCat && matchesLow && matchesSearch;
  });

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#141414] p-6 rounded-3xl border border-white/5 shadow-xl">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center">
            <Package className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-black text-white">مدیریت محصولات و کالاها</h2>
            <p className="text-xs text-slate-400 mt-0.5">
              تعریف انواع آجیل، خشکبار، شکلات، قیمت‌گذاری، بارکد و نقطه سفارش
            </p>
          </div>
        </div>

        {isAdmin && (
          <div className="flex flex-wrap items-center gap-2">
            <button
              id="print-shelf-tag-bulk-btn"
              onClick={() => {
                const targetProds =
                  selectedProductIds.length > 0
                    ? products.filter((p) => selectedProductIds.includes(p.id))
                    : filteredProducts.length > 0
                    ? filteredProducts
                    : products;
                setShelfTagProducts(targetProds);
                setShowShelfTagModal(true);
              }}
              className="flex items-center justify-center gap-2 px-4 py-2.5 bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 font-bold rounded-2xl text-xs transition-all cursor-pointer shadow-sm"
              title="چاپ اتیکت قیمت بزرگ برای نصب روی قفسه، سینی و ظروف فروشگاه"
            >
              <Tag className="w-4 h-4 text-amber-400" />
              <span>چاپ اتیکت قیمت قفسه و سینی</span>
              {selectedProductIds.length > 0 && (
                <span className="px-2 py-0.5 bg-amber-500 text-slate-950 rounded-full text-[10px] font-black font-sans">
                  {toPersianDigits(selectedProductIds.length)}
                </span>
              )}
            </button>

            <button
              id="bulk-price-update-btn"
              onClick={() => setShowBulkPriceModal(true)}
              className="flex items-center justify-center gap-2 px-4 py-2.5 bg-white/10 hover:bg-white/15 text-amber-300 border border-amber-500/30 font-bold rounded-2xl text-xs transition-all cursor-pointer shadow-sm"
            >
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span>تغییر قیمت دسته‌جمعی</span>
              {selectedProductIds.length > 0 && (
                <span className="px-2 py-0.5 bg-amber-500 text-slate-950 rounded-full text-[10px] font-black font-sans">
                  {toPersianDigits(selectedProductIds.length)}
                </span>
              )}
            </button>

            <button
              id="add-product-btn"
              onClick={openAddModal}
              className="flex items-center justify-center gap-2 px-5 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold rounded-2xl text-xs transition-all shadow-md shadow-amber-500/20 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>تعریف محصول جدید</span>
            </button>
          </div>
        )}
      </div>

      {/* Messages */}
      {successMsg && (
        <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 rounded-2xl text-xs flex items-center gap-2">
          <Check className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}
      {errorMsg && (
        <div className="p-4 bg-rose-500/10 border border-rose-500/20 text-rose-300 rounded-2xl text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Filters Bar */}
      <div className="bg-[#141414] p-4 rounded-3xl border border-white/5 shadow-sm flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="relative w-full md:w-80">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="جستجوی نام، بارکد، SKU..."
            className="w-full pl-3 pr-9 py-2 bg-white/5 border border-white/10 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-hidden focus:ring-1 focus:ring-amber-500"
          />
          <Search className="w-4 h-4 text-slate-500 absolute right-3 top-2.5" />
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          {isAdmin && (
            <button
              onClick={() => {
                if (selectedProductIds.length === filteredProducts.length && filteredProducts.length > 0) {
                  setSelectedProductIds([]);
                } else {
                  setSelectedProductIds(filteredProducts.map((p) => p.id));
                }
              }}
              className="px-3 py-2 bg-white/5 border border-white/10 text-slate-300 hover:text-white rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5"
            >
              {selectedProductIds.length === filteredProducts.length && filteredProducts.length > 0 ? (
                <>
                  <CheckSquare className="w-4 h-4 text-amber-400" />
                  <span>عدم انتخاب همه</span>
                </>
              ) : (
                <>
                  <Square className="w-4 h-4 text-slate-400" />
                  <span>انتخاب همه ({toPersianDigits(filteredProducts.length)})</span>
                </>
              )}
            </button>
          )}

          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="py-2 px-3 bg-white/5 border border-white/10 rounded-xl text-xs font-medium text-slate-200 focus:outline-hidden focus:ring-1 focus:ring-amber-500"
          >
            <option value="ALL" className="bg-[#181818] text-slate-200">همه دسته‌بندی‌ها</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id} className="bg-[#181818] text-slate-200">
                {c.name}
              </option>
            ))}
          </select>

          <button
            onClick={() => setOnlyLowStock(!onlyLowStock)}
            className={`px-3 py-2 rounded-xl text-xs font-bold border transition-colors cursor-pointer flex items-center gap-1.5 ${
              onlyLowStock
                ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                : 'bg-white/5 text-slate-400 border-white/10 hover:bg-white/10 hover:text-white'
            }`}
          >
            <AlertCircle className="w-3.5 h-3.5" />
            <span>فقط کم‌موجودی</span>
          </button>
        </div>
      </div>

      {/* Products Table */}
      <div className="bg-[#141414] rounded-3xl border border-white/5 shadow-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead className="bg-white/5 border-b border-white/5 text-slate-400 font-bold">
              <tr>
                {isAdmin && (
                  <th className="py-3.5 px-3 w-10 text-center">
                    <input
                      type="checkbox"
                      checked={selectedProductIds.length > 0 && selectedProductIds.length === filteredProducts.length}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedProductIds(filteredProducts.map((p) => p.id));
                        } else {
                          setSelectedProductIds([]);
                        }
                      }}
                      className="w-4 h-4 rounded text-amber-500 focus:ring-amber-500 cursor-pointer"
                    />
                  </th>
                )}
                <th className="py-3.5 px-4">نام کالا</th>
                <th className="py-3.5 px-3">دسته‌بندی</th>
                <th className="py-3.5 px-3">بارکد</th>
                <th className="py-3.5 px-3">موجودی انبار</th>
                {isAdmin && <th className="py-3.5 px-3">قیمت خرید</th>}
                <th className="py-3.5 px-3">قیمت فروش</th>
                <th className="py-3.5 px-3">نوع فروش</th>
                {isAdmin && <th className="py-3.5 px-4 text-center">عملیات</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={isAdmin ? 9 : 8} className="py-8 text-center text-slate-500">
                    محصولی یافت نشد.
                  </td>
                </tr>
              ) : (
                filteredProducts.map((p) => {
                  const isLow = p.stock <= p.minimumStock;
                  const isSelected = selectedProductIds.includes(p.id);
                  return (
                    <tr
                      key={p.id}
                      className={`hover:bg-white/5 transition-colors ${
                        isSelected ? 'bg-amber-500/5' : ''
                      }`}
                    >
                      {isAdmin && (
                        <td className="py-3 px-3 text-center">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedProductIds((prev) => [...prev, p.id]);
                              } else {
                                setSelectedProductIds((prev) => prev.filter((id) => id !== p.id));
                              }
                            }}
                            className="w-4 h-4 rounded text-amber-500 focus:ring-amber-500 cursor-pointer"
                          />
                        </td>
                      )}
                      <td className="py-3 px-4 font-bold text-white">
                        <div>{p.name}</div>
                        <div className="text-[10px] text-slate-500 font-mono">{p.sku}</div>
                      </td>
                      <td className="py-3 px-3 text-slate-300">{p.categoryName || '-'}</td>
                      <td className="py-3 px-3 font-mono text-slate-400">{p.barcode}</td>
                      <td className="py-3 px-3">
                        <span
                          className={`px-2.5 py-1 rounded-full font-bold text-[11px] ${
                            p.stock <= 0
                              ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                              : isLow
                              ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                              : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                          }`}
                        >
                          {formatWeightOrQuantity(p.stock, p.unit)}
                        </span>
                      </td>
                      {isAdmin && (
                        <td className="py-3 px-3 text-slate-400 font-sans">
                          {formatCurrency(p.purchasePrice)}
                        </td>
                      )}
                      <td className="py-3 px-3 font-black text-amber-400 font-sans">
                        {formatCurrency(p.salePrice)}
                      </td>
                      <td className="py-3 px-3">
                        <span className="text-[11px] text-slate-400 font-medium">
                          {p.isWeighted ? 'فله‌ای (وزنی)' : `بسته‌ای (${getUnitLabel(p.unit)})`}
                        </span>
                      </td>
                      {isAdmin && (
                        <td className="py-3 px-4 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              id={`shelf-tag-product-${p.id}`}
                              onClick={() => {
                                setShelfTagProducts([p]);
                                setShowShelfTagModal(true);
                              }}
                              className="p-1.5 text-slate-400 hover:text-amber-400 rounded-lg hover:bg-amber-500/10 transition-colors cursor-pointer"
                              title="چاپ اتیکت قیمت قفسه و سینی این کالا (فونت خیلی بزرگ)"
                            >
                              <Tag className="w-4 h-4" />
                            </button>
                            <button
                              id={`edit-product-${p.id}`}
                              onClick={() => openEditModal(p)}
                              className="p-1.5 text-slate-400 hover:text-amber-400 rounded-lg hover:bg-white/5 transition-colors cursor-pointer"
                              title="ویرایش محصول"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              id={`delete-product-${p.id}`}
                              onClick={() => handleDelete(p.id, p.name)}
                              className="p-1.5 text-slate-400 hover:text-rose-400 rounded-lg hover:bg-rose-500/10 transition-colors cursor-pointer"
                              title="حذف محصول"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Product Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[#141414] rounded-3xl p-6 shadow-2xl border border-white/10 w-full max-w-xl max-h-[90vh] overflow-y-auto space-y-5 text-right">
            <div className="flex items-center justify-between border-b border-white/5 pb-3">
              <h3 className="text-sm font-bold text-white">
                {editingProduct ? 'ویرایش مشخصات محصول' : 'تعریف محصول جدید'}
              </h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-white cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-300 mb-1">نام کامل محصول *</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="مثال: پسته اکبری اعلا زعفرانی"
                    className="w-full p-2.5 bg-white/5 border border-white/10 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-hidden focus:ring-1 focus:ring-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">دسته‌بندی</label>
                  <select
                    value={formData.categoryId}
                    onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                    className="w-full p-2.5 bg-white/5 border border-white/10 rounded-xl text-xs text-slate-200 focus:outline-hidden focus:ring-1 focus:ring-amber-500"
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.id} className="bg-[#181818] text-slate-200">
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">کد کالا (SKU)</label>
                  <input
                    type="text"
                    value={formData.sku}
                    onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                    className="w-full p-2.5 bg-white/5 border border-white/10 rounded-xl text-xs font-mono text-white focus:outline-hidden focus:ring-1 focus:ring-amber-500"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-300 mb-1">بارکد محصول</label>
                  <div className="flex flex-wrap sm:flex-nowrap gap-2">
                    <input
                      type="text"
                      value={formData.barcode}
                      onChange={(e) => setFormData({ ...formData, barcode: e.target.value })}
                      placeholder="اسکن یا تایپ بارکد کارخانه‌ای"
                      className="flex-1 min-w-[160px] p-2.5 bg-white/5 border border-white/10 rounded-xl text-xs font-mono text-white placeholder-slate-500 focus:outline-hidden focus:ring-1 focus:ring-amber-500"
                    />
                    <button
                      type="button"
                      onClick={() => setShowCameraScanner(true)}
                      className="px-3 py-2 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer shrink-0"
                      title="اسکن بارکد بسته با دوربین موبایل"
                    >
                      <Camera className="w-3.5 h-3.5" />
                      <span>اسکن با دوربین</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleGenerateBarcode}
                      className="px-3 py-2 bg-white/5 hover:bg-white/10 text-slate-300 border border-white/10 rounded-xl text-xs font-bold flex items-center gap-1 cursor-pointer shrink-0"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                      <span>تولید خودکار</span>
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">قیمت خرید (تومان)</label>
                  <input
                    type="number"
                    value={formData.purchasePrice || ''}
                    onChange={(e) => setFormData({ ...formData, purchasePrice: Number(e.target.value) })}
                    className="w-full p-2.5 bg-white/5 border border-white/10 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-hidden focus:ring-1 focus:ring-amber-500"
                    placeholder="مبلغ خرید"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">قیمت فروش (تومان) *</label>
                  <input
                    type="number"
                    required
                    value={formData.salePrice || ''}
                    onChange={(e) => setFormData({ ...formData, salePrice: Number(e.target.value) })}
                    className="w-full p-2.5 bg-white/5 border border-white/10 rounded-xl text-xs font-bold text-amber-400 focus:outline-hidden focus:ring-1 focus:ring-amber-500"
                    placeholder="مبلغ فروش به مشتری"
                  />
                </div>

                {!editingProduct && (
                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1">موجودی اولیه انبار</label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.stock || ''}
                      onChange={(e) => setFormData({ ...formData, stock: Number(e.target.value) })}
                      className="w-full p-2.5 bg-white/5 border border-white/10 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-hidden focus:ring-1 focus:ring-amber-500"
                      placeholder="۰"
                    />
                  </div>
                )}

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">نقطه سفارش (حداقل موجودی)</label>
                  <input
                    type="number"
                    value={formData.minimumStock || ''}
                    onChange={(e) => setFormData({ ...formData, minimumStock: Number(e.target.value) })}
                    className="w-full p-2.5 bg-white/5 border border-white/10 rounded-xl text-xs text-white focus:outline-hidden focus:ring-1 focus:ring-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">واحد سنجش کالا</label>
                  <select
                    value={formData.unit}
                    onChange={(e) => {
                      const u = e.target.value as ProductUnit;
                      setFormData({
                        ...formData,
                        unit: u,
                        isWeighted: u === 'KG' || u === 'G' || u === 'MESGHAL' || u === 'SOUT',
                      });
                    }}
                    className="w-full p-2.5 bg-white/5 border border-white/10 rounded-xl text-xs text-slate-200 focus:outline-hidden focus:ring-1 focus:ring-amber-500"
                  >
                    <option value="KG" className="bg-[#181818] text-slate-200">کیلوگرم (فله / وزنی)</option>
                    <option value="G" className="bg-[#181818] text-slate-200">گرم</option>
                    <option value="SOUT" className="bg-[#181818] text-slate-200">صوت (زعفران و میلی‌گرم)</option>
                    <option value="MESGHAL" className="bg-[#181818] text-slate-200">مثقال (۴.۶۰۸ گرم)</option>
                    <option value="PIECE" className="bg-[#181818] text-slate-200">عدد</option>
                    <option value="PACK" className="bg-[#181818] text-slate-200">بسته</option>
                    <option value="BOX" className="bg-[#181818] text-slate-200">جعبه</option>
                    <option value="CARTON" className="bg-[#181818] text-slate-200">کارتن</option>
                  </select>
                </div>

                <div className="flex items-center pt-5">
                  <label className="flex items-center gap-2 text-xs font-bold text-slate-300 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.isWeighted}
                      onChange={(e) => setFormData({ ...formData, isWeighted: e.target.checked })}
                      className="w-4 h-4 rounded text-amber-500 focus:ring-amber-500"
                    />
                    <span>فروش وزنی فله‌ای (محاسبه گرم و کیلو)</span>
                  </label>
                </div>
              </div>

              <div className="flex gap-2 pt-4 border-t border-white/5">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 py-2.5 bg-white/5 hover:bg-white/10 text-slate-300 rounded-xl text-xs font-bold border border-white/5 cursor-pointer"
                >
                  انصراف
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 rounded-xl text-xs font-bold shadow-md shadow-amber-500/20 cursor-pointer"
                >
                  {editingProduct ? 'ذخیره تغییرات' : 'ثبت محصول'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Bulk Price Adjustment Modal */}
      {showBulkPriceModal && (
        <BulkPriceUpdateModal
          products={products}
          categories={categories}
          selectedProductIds={selectedProductIds}
          onClose={() => setShowBulkPriceModal(false)}
          onSuccess={() => {
            setSuccessMsg('تغییر قیمت دسته‌جمعی با موفقیت اعمال و ذخیره شد.');
            setSelectedProductIds([]);
            loadData();
            if (onRefreshData) onRefreshData();
            setTimeout(() => setSuccessMsg(null), 4000);
          }}
        />
      )}

      {/* Shelf Price Tag Modal */}
      <ShelfPriceTagModal
        isOpen={showShelfTagModal}
        onClose={() => setShowShelfTagModal(false)}
        products={shelfTagProducts}
        settings={settings || null}
      />

      {/* Camera Barcode Scanner for Product Form */}
      <CameraBarcodeScannerModal
        isOpen={showCameraScanner}
        onClose={() => setShowCameraScanner(false)}
        onScan={(code) => {
          setFormData((prev) => ({ ...prev, barcode: code }));
          setShowCameraScanner(false);
        }}
        title="اسکن بارکد بسته کالا"
        subtitle="بارکد چاپ شده روی بسته را مقابل دوربین بگیرید"
      />
    </div>
  );
};
