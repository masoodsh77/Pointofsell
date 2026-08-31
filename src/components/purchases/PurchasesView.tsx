import React, { useState, useEffect } from 'react';
import { Purchase, Supplier, Product } from '../../types';
import { apiRequest } from '../../services/api';
import {
  formatCurrency,
  formatPersianDate,
  formatWeightOrQuantity,
  getUnitLabel,
  toPersianDigits
} from '../../utils/persian';
import {
  Truck,
  Plus,
  Trash2,
  Edit,
  CheckCircle,
  AlertCircle,
  FileText,
  Search,
  Building2,
  X,
  Calendar,
  ChevronDown,
  ChevronUp,
  Package,
  Clock,
  Printer
} from 'lucide-react';

interface PurchasesViewProps {
  onRefreshData?: () => void;
}

export const PurchasesView: React.FC<PurchasesViewProps> = ({ onRefreshData }) => {
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Modal State
  const [showModal, setShowModal] = useState<boolean>(false);
  const [editingPurchase, setEditingPurchase] = useState<Purchase | null>(null);
  const [expandedPurchaseId, setExpandedPurchaseId] = useState<string | null>(null);

  // Form State
  const [selectedSupplierId, setSelectedSupplierId] = useState<string>('');
  const [invoiceDate, setInvoiceDate] = useState<string>('');
  const [description, setDescription] = useState<string>('');

  // Items in Purchase Form
  const [purchaseItems, setPurchaseItems] = useState<
    Array<{
      productId: string;
      productName: string;
      quantity: number;
      unitPurchasePrice: number;
      unit: string;
    }>
  >([]);

  // Item being added in Form
  const [selectedProductId, setSelectedProductId] = useState<string>('');
  const [itemQty, setItemQty] = useState<string>('10');
  const [itemUnitPrice, setItemUnitPrice] = useState<string>('0');

  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const loadData = async () => {
    const [purRes, supRes, prodRes] = await Promise.all([
      apiRequest<Purchase[]>('/purchases'),
      apiRequest<Supplier[]>('/suppliers'),
      apiRequest<Product[]>('/products'),
    ]);

    if (purRes.success && purRes.data) setPurchases(purRes.data);
    if (supRes.success && supRes.data) {
      setSuppliers(supRes.data);
      if (supRes.data.length > 0 && !selectedSupplierId) {
        setSelectedSupplierId(supRes.data[0].id);
      }
    }
    if (prodRes.success && prodRes.data) {
      setProducts(prodRes.data);
      if (prodRes.data.length > 0 && !selectedProductId) {
        setSelectedProductId(prodRes.data[0].id);
        setItemUnitPrice(String(prodRes.data[0].purchasePrice || 0));
      }
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const openAddModal = () => {
    setEditingPurchase(null);
    setSelectedSupplierId(suppliers.length > 0 ? suppliers[0].id : '');
    setInvoiceDate(new Date().toISOString().split('T')[0]);
    setDescription('');
    setPurchaseItems([]);
    if (products.length > 0) {
      setSelectedProductId(products[0].id);
      setItemUnitPrice(String(products[0].purchasePrice || 0));
      setItemQty('10');
    }
    setShowModal(true);
  };

  const openEditModal = (pur: Purchase) => {
    setEditingPurchase(pur);
    setSelectedSupplierId(pur.supplierId);
    setInvoiceDate(pur.createdAt ? pur.createdAt.split('T')[0] : new Date().toISOString().split('T')[0]);
    setDescription(pur.description || '');
    setPurchaseItems(
      pur.items.map((i) => ({
        productId: i.productId,
        productName: i.productName,
        quantity: i.quantity,
        unitPurchasePrice: i.unitPurchasePrice,
        unit: i.unit,
      }))
    );
    if (products.length > 0) {
      setSelectedProductId(products[0].id);
      setItemUnitPrice(String(products[0].purchasePrice || 0));
      setItemQty('10');
    }
    setShowModal(true);
  };

  const handleProductSelectChange = (productId: string) => {
    setSelectedProductId(productId);
    const p = products.find((prod) => prod.id === productId);
    if (p) {
      setItemUnitPrice(String(p.purchasePrice || 0));
    }
  };

  const handleAddItemToPurchase = () => {
    const p = products.find((prod) => prod.id === selectedProductId);
    const qty = parseFloat(itemQty);
    const price = parseFloat(itemUnitPrice);

    if (!p || isNaN(qty) || qty <= 0 || isNaN(price) || price < 0) {
      setErrorMsg('لطفاً محصول، مقدار/تعداد و قیمت خرید معتبر وارد کنید.');
      return;
    }

    setPurchaseItems((prev) => [
      ...prev,
      {
        productId: p.id,
        productName: p.name,
        quantity: qty,
        unitPurchasePrice: price,
        unit: p.unit,
      },
    ]);

    setItemQty('10');
    setErrorMsg(null);
  };

  const handleRemoveItemFromPurchase = (idx: number) => {
    setPurchaseItems((prev) => prev.filter((_, i) => i !== idx));
  };

  const calculateSubtotal = () =>
    purchaseItems.reduce((acc, i) => acc + i.quantity * i.unitPurchasePrice, 0);

  const handleSubmitPurchase = async (e: React.FormEvent) => {
    e.preventDefault();
    if (purchaseItems.length === 0) {
      setErrorMsg('حداقل یک قلم کالا باید به فاکتور خرید اضافه شود.');
      return;
    }

    if (!selectedSupplierId) {
      setErrorMsg('لطفاً تامین‌کننده را انتخاب کنید.');
      return;
    }

    setErrorMsg(null);

    const payload = {
      supplierId: selectedSupplierId,
      items: purchaseItems.map((i) => ({
        productId: i.productId,
        quantity: i.quantity,
        unitPurchasePrice: i.unitPurchasePrice,
      })),
      description: description.trim(),
      invoiceDate: invoiceDate ? new Date(invoiceDate).toISOString() : new Date().toISOString(),
    };

    if (editingPurchase) {
      const res = await apiRequest(`/purchases/${editingPurchase.id}`, {
        method: 'PUT',
        body: JSON.stringify(payload),
      });
      if (res.success) {
        setSuccessMsg('فاکتور خرید با موفقیت ویرایش و موجودی انبار بازتنظیم شد.');
        setShowModal(false);
        loadData();
        if (onRefreshData) onRefreshData();
        setTimeout(() => setSuccessMsg(null), 3500);
      } else {
        setErrorMsg(res.message || 'خطا در ویرایش فاکتور خرید');
      }
    } else {
      const res = await apiRequest('/purchases', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
      if (res.success) {
        setSuccessMsg('فاکتور خرید ثبت و موجودی انبار به طور خودکار افزایش یافت.');
        setShowModal(false);
        loadData();
        if (onRefreshData) onRefreshData();
        setTimeout(() => setSuccessMsg(null), 3500);
      } else {
        setErrorMsg(res.message || 'خطا در ثبت خرید');
      }
    }
  };

  const handleDeletePurchase = async (id: string, invoiceNum: string) => {
    if (!window.confirm(`آیا از ابطال و حذف فاکتور خرید "${invoiceNum}" اطمینان دارید؟ مقادیر آن از انبار کسر خواهد شد.`)) {
      return;
    }

    const res = await apiRequest(`/purchases/${id}`, { method: 'DELETE' });
    if (res.success) {
      setSuccessMsg('فاکتور خرید حذف و موجودی انبار اصلاح گردید.');
      loadData();
      if (onRefreshData) onRefreshData();
      setTimeout(() => setSuccessMsg(null), 3500);
    } else {
      setErrorMsg(res.message || 'خطا در حذف فاکتور خرید');
    }
  };

  const filteredPurchases = purchases.filter((p) => {
    const q = searchQuery.toLowerCase().trim();
    return (
      !q ||
      p.invoiceNumber.toLowerCase().includes(q) ||
      p.supplierName.toLowerCase().includes(q) ||
      p.items.some((i) => i.productName.toLowerCase().includes(q))
    );
  });

  const totalPurchasesSum = filteredPurchases.reduce((acc, p) => acc + p.totalAmount, 0);

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#141414] p-6 rounded-3xl border border-white/5 shadow-xl">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center">
            <Truck className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-black text-white">فاکتورهای خرید و ورود کالا به انبار</h2>
            <p className="text-xs text-slate-400 mt-0.5">
              ثبت فاکتورهای بنکداران و باغداران با افزایش خودکار موجودی انبار و ثبت میانگین قیمت خرید
            </p>
          </div>
        </div>

        <button
          id="new-purchase-btn"
          onClick={openAddModal}
          className="flex items-center justify-center gap-2 px-5 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold rounded-2xl text-xs transition-all shadow-md shadow-amber-500/20 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>ثبت فاکتور خرید جدید</span>
        </button>
      </div>

      {/* Messages */}
      {successMsg && (
        <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 rounded-2xl text-xs flex items-center gap-2">
          <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}
      {errorMsg && (
        <div className="p-4 bg-rose-500/10 border border-rose-500/20 text-rose-300 rounded-2xl text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Summary Cards & Search */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-[#141414] p-4 rounded-3xl border border-white/5 shadow-sm flex items-center justify-between">
          <div>
            <div className="text-[11px] font-bold text-slate-400">مجموع مبالغ خریدهای ثبت شده</div>
            <div className="text-lg font-black text-amber-400 mt-1 font-sans">
              {formatCurrency(totalPurchasesSum)}
            </div>
          </div>
          <div className="w-10 h-10 rounded-2xl bg-amber-500/10 text-amber-400 flex items-center justify-center">
            <Truck className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-[#141414] p-4 rounded-3xl border border-white/5 shadow-sm flex items-center justify-between">
          <div>
            <div className="text-[11px] font-bold text-slate-400">تعداد کل فاکتورهای ورودی</div>
            <div className="text-lg font-black text-white mt-1 font-sans">
              {toPersianDigits(filteredPurchases.length)} <span className="text-xs font-normal text-slate-500">فاکتور</span>
            </div>
          </div>
          <div className="w-10 h-10 rounded-2xl bg-white/5 text-slate-300 flex items-center justify-center">
            <FileText className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-[#141414] p-4 rounded-3xl border border-white/5 shadow-sm flex items-center justify-between">
          <div>
            <div className="text-[11px] font-bold text-slate-400">تامین‌کنندگان فعال</div>
            <div className="text-lg font-black text-white mt-1 font-sans">
              {toPersianDigits(suppliers.length)} <span className="text-xs font-normal text-slate-500">طرف حساب</span>
            </div>
          </div>
          <div className="w-10 h-10 rounded-2xl bg-white/5 text-slate-300 flex items-center justify-center">
            <Building2 className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Search Bar */}
      <div className="bg-[#141414] p-4 rounded-3xl border border-white/5 shadow-sm flex items-center justify-between">
        <div className="relative w-full sm:w-80">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="جستجوی شماره فاکتور، تامین‌کننده، کالا..."
            className="w-full pl-3 pr-9 py-2 bg-white/5 border border-white/10 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-hidden focus:ring-1 focus:ring-amber-500"
          />
          <Search className="w-4 h-4 text-slate-500 absolute right-3 top-2.5" />
        </div>
      </div>

      {/* Purchases History List with Expandable Line Items */}
      <div className="space-y-3">
        {filteredPurchases.length === 0 ? (
          <div className="bg-[#141414] p-12 text-center text-slate-500 rounded-3xl border border-white/5 text-xs">
            هیچ فاکتور خریدی ثبت نشده است.
          </div>
        ) : (
          filteredPurchases.map((pur) => {
            const isExpanded = expandedPurchaseId === pur.id;
            return (
              <div
                key={pur.id}
                className="bg-[#141414] rounded-3xl border border-white/5 shadow-lg overflow-hidden transition-all"
              >
                {/* Main Row */}
                <div
                  onClick={() => setExpandedPurchaseId(isExpanded ? null : pur.id)}
                  className="p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 cursor-pointer hover:bg-white/2 transition-colors"
                >
                  <div className="flex items-center gap-3.5">
                    <div className="w-11 h-11 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
                      <Truck className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-white font-mono">{pur.invoiceNumber}</span>
                        <span className="px-2 py-0.5 bg-white/5 border border-white/10 rounded text-[10.5px] text-slate-300">
                          {toPersianDigits(pur.items.length)} قلم کالا
                        </span>
                      </div>
                      <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400 mt-1">
                        <span className="flex items-center gap-1 text-slate-300 font-semibold">
                          <Building2 className="w-3.5 h-3.5 text-amber-400" />
                          <span>{pur.supplierName}</span>
                        </span>
                        <span className="flex items-center gap-1 font-mono text-[11px]">
                          <Clock className="w-3.5 h-3.5 text-slate-500" />
                          <span>{formatPersianDate(pur.createdAt, true)}</span>
                        </span>
                        {pur.userName && (
                          <span className="text-[11px] text-slate-500">ثبت‌کننده: {pur.userName}</span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between md:justify-end gap-5 pt-2 md:pt-0 border-t md:border-t-0 border-white/5">
                    <div className="text-right md:text-left">
                      <div className="text-[10.5px] text-slate-500">مبلغ کل فاکتور:</div>
                      <div className="text-base font-black text-amber-400 font-sans">
                        {formatCurrency(pur.totalAmount)}
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => openEditModal(pur)}
                        className="p-2 text-slate-400 hover:text-amber-400 rounded-xl hover:bg-white/5 transition-colors cursor-pointer"
                        title="ویرایش فاکتور خرید"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeletePurchase(pur.id, pur.invoiceNumber)}
                        className="p-2 text-slate-400 hover:text-rose-400 rounded-xl hover:bg-rose-500/10 transition-colors cursor-pointer"
                        title="حذف و ابطال فاکتور خرید"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setExpandedPurchaseId(isExpanded ? null : pur.id)}
                        className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-white/5 transition-colors cursor-pointer"
                        title="مشاهده اقلام"
                      >
                        {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Expanded Details Table */}
                {isExpanded && (
                  <div className="p-5 bg-[#0e0e0e] border-t border-white/5 space-y-3">
                    <div className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                      <Package className="w-4 h-4 text-amber-400" />
                      <span>اقلام خریداری شده و افزوده شده به انبار:</span>
                    </div>

                    <div className="border border-white/5 rounded-2xl overflow-hidden bg-[#141414]">
                      <table className="w-full text-right text-xs">
                        <thead className="bg-white/5 text-slate-400 font-bold border-b border-white/5">
                          <tr>
                            <th className="py-2.5 px-4">نام کالا / محصول</th>
                            <th className="py-2.5 px-3">مقدار / وزن</th>
                            <th className="py-2.5 px-3">قیمت خرید واحد (فی)</th>
                            <th className="py-2.5 px-4">جمع ردیف (تومان)</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5 text-slate-200">
                          {pur.items.map((it, idx) => (
                            <tr key={idx} className="hover:bg-white/5">
                              <td className="py-2.5 px-4 font-bold text-white">{it.productName}</td>
                              <td className="py-2.5 px-3 text-slate-300 font-sans font-bold">
                                {formatWeightOrQuantity(it.quantity, it.unit)}
                              </td>
                              <td className="py-2.5 px-3 text-slate-400 font-sans">
                                {formatCurrency(it.unitPurchasePrice)}
                              </td>
                              <td className="py-2.5 px-4 font-bold text-amber-300 font-sans">
                                {formatCurrency(it.total)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {pur.description && (
                      <div className="text-[11px] text-slate-400 bg-white/5 p-3 rounded-2xl">
                        توضیحات فاکتور: {pur.description}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Add / Edit Purchase Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[#141414] rounded-3xl p-6 shadow-2xl border border-white/10 w-full max-w-2xl space-y-4 text-right max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-white/5 pb-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Truck className="w-4 h-4 text-amber-400" />
                <span>{editingPurchase ? `ویرایش فاکتور خرید ${editingPurchase.invoiceNumber}` : 'ثبت فاکتور خرید و ورود کالا به انبار'}</span>
              </h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-white cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitPurchase} className="space-y-4">
              {/* Header Details */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    انتخاب تامین‌کننده / باغدار *
                  </label>
                  <select
                    value={selectedSupplierId}
                    onChange={(e) => setSelectedSupplierId(e.target.value)}
                    className="w-full p-2.5 bg-[#181818] border border-white/10 rounded-xl text-xs text-white focus:outline-hidden focus:ring-1 focus:ring-amber-500 font-medium"
                    required
                  >
                    {suppliers.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name} {s.contactPerson ? `(${s.contactPerson})` : ''}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">تاریخ فاکتور *</label>
                  <input
                    type="date"
                    required
                    value={invoiceDate}
                    onChange={(e) => setInvoiceDate(e.target.value)}
                    className="w-full p-2.5 bg-white/5 border border-white/10 rounded-xl text-xs text-white focus:outline-hidden focus:ring-1 focus:ring-amber-500 font-mono text-left"
                  />
                </div>
              </div>

              {/* Add Item Form Bar */}
              <div className="p-3 bg-white/5 rounded-2xl border border-white/10 space-y-2.5">
                <div className="text-xs font-bold text-slate-300">افزودن اقلام به فاکتور:</div>
                <div className="grid grid-cols-1 sm:grid-cols-12 gap-2">
                  <div className="sm:col-span-5">
                    <select
                      value={selectedProductId}
                      onChange={(e) => handleProductSelectChange(e.target.value)}
                      className="w-full p-2 bg-[#181818] border border-white/10 rounded-xl text-xs text-white focus:outline-hidden focus:ring-1 focus:ring-amber-500"
                    >
                      {products.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name} ({getUnitLabel(p.unit)})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="sm:col-span-3">
                    <input
                      type="number"
                      step="any"
                      min="0.01"
                      value={itemQty}
                      onChange={(e) => setItemQty(e.target.value)}
                      placeholder="مقدار / وزن"
                      className="w-full p-2 bg-white/5 border border-white/10 rounded-xl text-xs text-white font-sans text-left"
                    />
                  </div>

                  <div className="sm:col-span-3">
                    <input
                      type="number"
                      step="500"
                      min="0"
                      value={itemUnitPrice}
                      onChange={(e) => setItemUnitPrice(e.target.value)}
                      placeholder="قیمت خرید (فی)"
                      className="w-full p-2 bg-white/5 border border-white/10 rounded-xl text-xs text-white font-sans text-left"
                    />
                  </div>

                  <div className="sm:col-span-1">
                    <button
                      type="button"
                      onClick={handleAddItemToPurchase}
                      className="w-full h-full min-h-[34px] bg-amber-500 text-slate-950 rounded-xl flex items-center justify-center font-bold text-xs hover:bg-amber-400 transition-colors cursor-pointer"
                      title="افزودن قلم"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Items List Table */}
              <div className="border border-white/10 rounded-2xl overflow-hidden bg-[#0d0d0d]">
                <table className="w-full text-right text-xs">
                  <thead className="bg-white/5 text-slate-400 font-bold border-b border-white/5">
                    <tr>
                      <th className="py-2.5 px-3">نام کالا</th>
                      <th className="py-2.5 px-2">مقدار</th>
                      <th className="py-2.5 px-2">قیمت خرید (فی)</th>
                      <th className="py-2.5 px-3">جمع</th>
                      <th className="py-2.5 px-2 text-center">حذف</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5 text-slate-200">
                    {purchaseItems.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="py-6 text-center text-slate-500">
                          هنوز کالایی به فاکتور خرید اضافه نشده است.
                        </td>
                      </tr>
                    ) : (
                      purchaseItems.map((item, idx) => (
                        <tr key={idx}>
                          <td className="py-2 px-3 font-bold text-white">{item.productName}</td>
                          <td className="py-2 px-2 text-slate-300 font-sans">
                            {formatWeightOrQuantity(item.quantity, item.unit)}
                          </td>
                          <td className="py-2 px-2 text-slate-400 font-sans">
                            {formatCurrency(item.unitPurchasePrice)}
                          </td>
                          <td className="py-2 px-3 font-bold text-amber-300 font-sans">
                            {formatCurrency(item.quantity * item.unitPurchasePrice)}
                          </td>
                          <td className="py-2 px-2 text-center">
                            <button
                              type="button"
                              onClick={() => handleRemoveItemFromPurchase(idx)}
                              className="p-1 text-slate-500 hover:text-rose-400 rounded-lg hover:bg-rose-500/10 cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* Total Calculation */}
              <div className="flex items-center justify-between p-3 bg-amber-500/10 border border-amber-500/20 rounded-2xl">
                <span className="text-xs font-bold text-slate-300">مجموع کل فاکتور خرید:</span>
                <span className="text-sm font-black text-amber-300 font-sans">
                  {formatCurrency(calculateSubtotal())}
                </span>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">یادداشت و توضیحات</label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="مثال: محموله پسته کله قوچی و فندقی درجه یک انبار رفسنجان..."
                  className="w-full p-2.5 bg-white/5 border border-white/10 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-hidden focus:ring-1 focus:ring-amber-500"
                />
              </div>

              <div className="flex gap-2 pt-2 border-t border-white/5">
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
                  {editingPurchase ? 'ذخیره اصلاحات فاکتور' : 'ثبت فاکتور و ورود به انبار'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
