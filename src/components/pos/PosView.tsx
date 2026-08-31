import React, { useState, useEffect, useRef } from 'react';
import { Product, Category, Customer, PaymentMethod, Sale, StoreSettings } from '../../types';
import { apiRequest } from '../../services/api';
import {
  formatCurrency,
  formatNumber,
  formatWeightOrQuantity,
  getUnitLabel,
  toPersianDigits
} from '../../utils/persian';
import { ReceiptModal } from './ReceiptModal';
import { CameraBarcodeScannerModal } from '../common/CameraBarcodeScannerModal';
import { PosTerminalModal } from './PosTerminalModal';
import { PosTransactionResult } from '../../types';
import {
  Barcode,
  Search,
  ShoppingCart,
  Trash2,
  Plus,
  Minus,
  Scale,
  CreditCard,
  Banknote,
  Split,
  UserPlus,
  AlertTriangle,
  CheckCircle,
  Tag,
  X,
  Package,
  Camera,
  ArrowRight,
  Sparkles,
  Wifi,
} from 'lucide-react';

interface CartItem {
  product: Product;
  quantity: number; // in KG or units
  unitSalePrice: number;
  discount: number;
  total: number;
}

interface PosViewProps {
  settings: StoreSettings | null;
  onRefreshData?: () => void;
}

export const PosView: React.FC<PosViewProps> = ({ settings, onRefreshData }) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [barcodeInput, setBarcodeInput] = useState<string>('');

  // Mobile View Switch: 'products' or 'cart'
  const [mobileView, setMobileView] = useState<'products' | 'cart'>('products');

  // Camera Barcode Scanner
  const [showCameraScanner, setShowCameraScanner] = useState<boolean>(false);
  const [successToast, setSuccessToast] = useState<string | null>(null);

  // Cart State
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('cust-1');
  const [discountMode, setDiscountMode] = useState<'AMOUNT' | 'PERCENT'>('AMOUNT');
  const [discountValue, setDiscountValue] = useState<number>(0);
  const [editingPriceIndex, setEditingPriceIndex] = useState<number | null>(null);
  const [tempPriceInput, setTempPriceInput] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('CARD');
  const [cashPaid, setCashPaid] = useState<number>(0);
  const [cardPaid, setCardPaid] = useState<number>(0);
  const [showPosTerminalModal, setShowPosTerminalModal] = useState<boolean>(false);
  const [posTransactionResult, setPosTransactionResult] = useState<PosTransactionResult | null>(null);

  // Weight Modal for Bulk Nuts/Dried Fruits
  const [weightModalProduct, setWeightModalProduct] = useState<Product | null>(null);
  const [weightGrams, setWeightGrams] = useState<number>(500);
  const [weightCustomKg, setWeightCustomKg] = useState<string>('0.500');

  // Checkout Status & Receipt Modal
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [completedSale, setCompletedSale] = useState<Sale | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Quick Customer Add Modal
  const [showAddCustomerModal, setShowAddCustomerModal] = useState<boolean>(false);
  const [newCustomerName, setNewCustomerName] = useState<string>('');
  const [newCustomerPhone, setNewCustomerPhone] = useState<string>('');

  const barcodeInputRef = useRef<HTMLInputElement>(null);

  // Fetch products, categories, customers
  const loadPosData = async () => {
    const [prodRes, catRes, custRes] = await Promise.all([
      apiRequest<Product[]>('/products'),
      apiRequest<Category[]>('/categories'),
      apiRequest<Customer[]>('/customers'),
    ]);

    if (prodRes.success && prodRes.data) setProducts(prodRes.data.filter((p) => p.isActive));
    if (catRes.success && catRes.data) setCategories(catRes.data);
    if (custRes.success && custRes.data) setCustomers(custRes.data);
  };

  useEffect(() => {
    loadPosData();
  }, []);

  // Filtered Products
  const filteredProducts = products.filter((p) => {
    const matchesCat = selectedCategory === 'ALL' || p.categoryId === selectedCategory;
    const q = searchQuery.trim().toLowerCase();
    const matchesSearch =
      !q ||
      p.name.toLowerCase().includes(q) ||
      p.barcode.includes(q) ||
      p.sku.toLowerCase().includes(q);
    return matchesCat && matchesSearch;
  });

  // Handle Barcode Scanned via Camera or Input
  const handleBarcodeScanned = (scannedCode: string) => {
    const code = scannedCode.trim();
    if (!code) return;

    const matched = products.find(
      (p) => p.barcode === code || p.sku.toLowerCase() === code.toLowerCase()
    );

    if (matched) {
      if (matched.isWeighted) {
        openWeightModal(matched);
      } else {
        addToCart(matched, 1);
        setSuccessToast(`«${matched.name}» به سبد خرید اضافه شد.`);
        setTimeout(() => setSuccessToast(null), 3500);
      }
      setBarcodeInput('');
    } else {
      setErrorMsg(`کالایی با بارکد ${code} در انبار یافت نشد.`);
      setTimeout(() => setErrorMsg(null), 4000);
    }
  };

  // Handle Barcode Submit from Input Field
  const handleBarcodeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!barcodeInput.trim()) return;
    handleBarcodeScanned(barcodeInput);
  };

  // Open Weight Modal
  const openWeightModal = (product: Product) => {
    setWeightModalProduct(product);
    setWeightGrams(500);
    setWeightCustomKg('0.500');
  };

  const handleApplyWeight = () => {
    if (!weightModalProduct) return;
    const kg = parseFloat(weightCustomKg);
    if (isNaN(kg) || kg <= 0) {
      setErrorMsg('لطفاً مقدار وزن معتبر وارد کنید.');
      return;
    }
    addToCart(weightModalProduct, kg);
    setSuccessToast(`«${weightModalProduct.name}» (${formatWeightOrQuantity(kg, 'KG')}) افزوده شد.`);
    setTimeout(() => setSuccessToast(null), 3500);
    setWeightModalProduct(null);
  };

  // Add to Cart
  const addToCart = (product: Product, quantity: number) => {
    if (product.stock < quantity) {
      setErrorMsg(`موجودی ${product.name} در انبار کافی نیست (موجود: ${formatWeightOrQuantity(product.stock, product.unit)})`);
      setTimeout(() => setErrorMsg(null), 4000);
      return;
    }

    setCart((prev) => {
      const existingIdx = prev.findIndex((item) => item.product.id === product.id);
      if (existingIdx > -1) {
        const updated = [...prev];
        const newQty = updated[existingIdx].quantity + quantity;
        if (newQty > product.stock) {
          setErrorMsg(`تعداد درخواستی بیشتر از موجودی انبار است.`);
          return prev;
        }
        updated[existingIdx].quantity = Math.round(newQty * 1000) / 1000;
        updated[existingIdx].total = Math.max(
          0,
          updated[existingIdx].quantity * updated[existingIdx].unitSalePrice - updated[existingIdx].discount
        );
        return updated;
      } else {
        const total = Math.max(0, quantity * product.salePrice);
        return [
          ...prev,
          {
            product,
            quantity: Math.round(quantity * 1000) / 1000,
            unitSalePrice: product.salePrice,
            discount: 0,
            total,
          },
        ];
      }
    });
  };

  // Update Item Quantity
  const updateQuantity = (index: number, newQty: number) => {
    if (newQty <= 0) {
      removeFromCart(index);
      return;
    }

    setCart((prev) => {
      const item = prev[index];
      if (newQty > item.product.stock) {
        setErrorMsg(`موجودی ${item.product.name} فقط ${formatWeightOrQuantity(item.product.stock, item.product.unit)} است.`);
        setTimeout(() => setErrorMsg(null), 3000);
        return prev;
      }

      const updated = [...prev];
      updated[index] = {
        ...item,
        quantity: Math.round(newQty * 1000) / 1000,
        total: Math.max(0, newQty * item.unitSalePrice - item.discount),
      };
      return updated;
    });
  };

  // Update Item Discount
  const updateItemDiscount = (index: number, discountAmount: number) => {
    setCart((prev) => {
      const item = prev[index];
      const updated = [...prev];
      const disc = Math.max(0, discountAmount || 0);
      updated[index] = {
        ...item,
        discount: disc,
        total: Math.max(0, item.quantity * item.unitSalePrice - disc),
      };
      return updated;
    });
  };

  // Update Item Unit Sale Price
  const updateItemPrice = (index: number, newPrice: number) => {
    setCart((prev) => {
      const item = prev[index];
      const updated = [...prev];
      const price = Math.max(0, newPrice || 0);
      updated[index] = {
        ...item,
        unitSalePrice: price,
        total: Math.max(0, item.quantity * price - item.discount),
      };
      return updated;
    });
    setEditingPriceIndex(null);
  };

  // Remove From Cart
  const removeFromCart = (index: number) => {
    setCart((prev) => prev.filter((_, i) => i !== index));
  };

  // Clear Cart
  const clearCart = () => {
    setCart([]);
    setDiscountValue(0);
    setDiscountMode('AMOUNT');
    setPaymentMethod('CARD');
    setPosTransactionResult(null);
  };

  // Financial Calculations
  const subtotal = cart.reduce((acc, item) => acc + item.quantity * item.unitSalePrice, 0);
  const itemsDiscountTotal = cart.reduce((acc, item) => acc + item.discount, 0);

  // Calculate invoice discount based on Mode (PERCENT vs AMOUNT)
  const invoiceDiscount =
    discountMode === 'PERCENT'
      ? Math.round((subtotal * Math.min(100, Math.max(0, discountValue))) / 100)
      : Math.min(subtotal, Math.max(0, discountValue));

  const totalDiscount = itemsDiscountTotal + invoiceDiscount;
  const finalAmount = Math.max(0, subtotal - totalDiscount);

  // Selected Customer Object & Auto Discount Setup
  const selectedCustomer = customers.find((c) => c.id === selectedCustomerId);

  const handleCustomerChange = (newCustId: string) => {
    setSelectedCustomerId(newCustId);
    const targetCust = customers.find((c) => c.id === newCustId);
    if (targetCust) {
      if ((targetCust.fixedDiscountPercent || 0) > 0) {
        setDiscountMode('PERCENT');
        setDiscountValue(targetCust.fixedDiscountPercent || 0);
        setSuccessToast(`تخفیف ${targetCust.fixedDiscountPercent}% مشتری «${targetCust.name}» اعمال شد.`);
        setTimeout(() => setSuccessToast(null), 3000);
      } else if ((targetCust.fixedDiscountAmount || 0) > 0) {
        setDiscountMode('AMOUNT');
        setDiscountValue(targetCust.fixedDiscountAmount || 0);
        setSuccessToast(`تخفیف مبلغی ${formatCurrency(targetCust.fixedDiscountAmount || 0)} مشتری اعمال شد.`);
        setTimeout(() => setSuccessToast(null), 3000);
      }
    }
  };

  // Quick Customer Creation
  const handleCreateCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCustomerName.trim()) return;

    const res = await apiRequest<Customer>('/customers', {
      method: 'POST',
      body: JSON.stringify({
        name: newCustomerName,
        phone: newCustomerPhone,
      }),
    });

    if (res.success && res.data) {
      setCustomers((prev) => [res.data!, ...prev]);
      handleCustomerChange(res.data.id);
      setShowAddCustomerModal(false);
      setNewCustomerName('');
      setNewCustomerPhone('');
    }
  };

  // Complete Checkout Transaction
  const handleCheckout = async (posOverride?: PosTransactionResult) => {
    if (cart.length === 0) {
      setErrorMsg('سبد خرید خالی است.');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);

    const activePos = posOverride || posTransactionResult;

    const salePayload = {
      customerId: selectedCustomerId,
      items: cart.map((item) => ({
        productId: item.product.id,
        quantity: item.quantity,
        unitSalePrice: item.unitSalePrice,
        discount: item.discount,
      })),
      discount: invoiceDiscount,
      tax: 0,
      paymentMethod,
      cashPaid: paymentMethod === 'CASH' ? finalAmount : paymentMethod === 'SPLIT' ? cashPaid : 0,
      cardPaid: paymentMethod === 'CARD' ? finalAmount : paymentMethod === 'SPLIT' ? cardPaid : 0,
      cardTraceNumber: activePos?.traceNumber,
      cardRRN: activePos?.rrn,
      cardMaskedPan: activePos?.maskedPan,
      cardTerminalId: activePos?.terminalId,
    };

    const res = await apiRequest<Sale>('/sales', {
      method: 'POST',
      body: JSON.stringify(salePayload),
    });

    setIsSubmitting(false);

    if (res.success && res.data) {
      setCompletedSale(res.data);
      clearCart();
      setShowPosTerminalModal(false);
      setMobileView('products'); // return to products on mobile after checkout
      loadPosData(); // Refresh product stock
      if (onRefreshData) onRefreshData();
    } else {
      setErrorMsg(res.message || 'خطا در ثبت فاکتور فروش');
    }
  };

  return (
    <div className="h-[calc(100vh-4rem)] flex flex-col lg:flex-row overflow-hidden bg-[#0a0a0a] relative pb-16 lg:pb-0">
      {/* Toast Notification */}
      {successToast && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 bg-emerald-500 text-slate-950 px-4 py-2 rounded-2xl font-bold text-xs shadow-xl flex items-center gap-2 animate-bounce">
          <CheckCircle className="w-4 h-4" />
          <span>{successToast}</span>
        </div>
      )}

      {/* Mobile Tab Switcher (Visible only on < lg screens) */}
      <div className="lg:hidden bg-[#141414] border-b border-white/5 p-2 grid grid-cols-2 gap-2 shrink-0">
        <button
          onClick={() => setMobileView('products')}
          className={`py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
            mobileView === 'products'
              ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 shadow-md shadow-amber-500/20'
              : 'bg-white/5 text-slate-400'
          }`}
        >
          <Package className="w-4 h-4" />
          <span>فهرست کالاها ({toPersianDigits(products.length)})</span>
        </button>

        <button
          onClick={() => setMobileView('cart')}
          className={`py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer relative ${
            mobileView === 'cart'
              ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 shadow-md shadow-amber-500/20'
              : 'bg-white/5 text-slate-400'
          }`}
        >
          <ShoppingCart className="w-4 h-4" />
          <span>سبد فروش</span>
          {cart.length > 0 && (
            <span className="bg-rose-500 text-white text-[10px] px-1.5 py-0.2 rounded-full font-sans">
              {toPersianDigits(cart.length)}
            </span>
          )}
        </button>
      </div>

      {/* ================= RIGHT SIDE: PRODUCT BROWSER & SCANNER ================= */}
      <div className={`flex-1 flex flex-col min-w-0 border-l border-white/5 bg-[#0a0a0a] ${mobileView === 'cart' ? 'hidden lg:flex' : 'flex'}`}>
        {/* Top Control Bar: Barcode Scanner & Search */}
        <div className="p-3 sm:p-4 bg-[#141414] border-b border-white/5 space-y-2.5 sm:space-y-3">
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
            {/* Barcode Scanner Input + Camera Scanner Button */}
            <div className="flex-1 flex gap-2">
              <form onSubmit={handleBarcodeSubmit} className="flex-1 relative">
                <input
                  ref={barcodeInputRef}
                  id="pos-barcode-scanner-input"
                  type="text"
                  value={barcodeInput}
                  onChange={(e) => setBarcodeInput(e.target.value)}
                  placeholder="بارکد یا SKU..."
                  className="w-full pl-3 pr-9 py-2 sm:py-2.5 bg-amber-500/10 border border-amber-500/30 rounded-xl text-xs sm:text-sm text-amber-200 placeholder-slate-500 focus:outline-hidden focus:ring-2 focus:ring-amber-500 font-mono"
                />
                <Barcode className="w-4 h-4 sm:w-5 sm:h-5 text-amber-400 absolute right-2.5 sm:right-3 top-2 sm:top-2.5" />
              </form>

              {/* Camera Scanner Trigger Button */}
              <button
                type="button"
                id="pos-open-camera-scanner-btn"
                onClick={() => setShowCameraScanner(true)}
                className="px-3 sm:px-4 py-2 sm:py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-xs flex items-center gap-1.5 transition-all shadow-md shadow-amber-500/20 cursor-pointer shrink-0"
                title="اسکن با دوربین موبایل"
              >
                <Camera className="w-4 h-4" />
                <span className="hidden xs:inline">اسکن با دوربین</span>
              </button>
            </div>

            {/* Product Name / SKU Search */}
            <div className="flex-1 relative">
              <input
                id="pos-product-search-input"
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="جستجوی نام کالا، مغز، شکلات..."
                className="w-full pl-3 pr-9 py-2 sm:py-2.5 bg-white/5 border border-white/10 rounded-xl text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-hidden focus:ring-2 focus:ring-amber-500"
              />
              <Search className="w-4 h-4 text-slate-500 absolute right-3 top-2.5 sm:top-3" />
            </div>
          </div>

          {/* Categories Pills Filter */}
          <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto pb-1 text-xs no-scrollbar">
            <button
              onClick={() => setSelectedCategory('ALL')}
              className={`px-3 py-1.5 rounded-xl font-bold shrink-0 transition-all cursor-pointer text-xs ${
                selectedCategory === 'ALL'
                  ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 shadow-md shadow-amber-500/20'
                  : 'bg-white/5 text-slate-400 border border-white/5 hover:bg-white/10 hover:text-white'
              }`}
            >
              همه ({toPersianDigits(products.length)})
            </button>
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-3 py-1.5 rounded-xl font-medium shrink-0 transition-all cursor-pointer flex items-center gap-1.5 text-xs ${
                  selectedCategory === cat.id
                    ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 font-bold shadow-md shadow-amber-500/20'
                    : 'bg-white/5 text-slate-400 border border-white/5 hover:bg-white/10 hover:text-white'
                }`}
              >
                <span>{cat.name}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Product Cards Grid */}
        <div className="flex-1 p-3 sm:p-4 overflow-y-auto bg-[#0a0a0a]">
          {filteredProducts.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-slate-500 p-8">
              <Package className="w-12 h-12 stroke-1 mb-2 text-slate-600" />
              <p className="text-sm font-medium">هیچ محصولی با این مشخصات یافت نشد.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-2.5 sm:gap-3">
              {filteredProducts.map((product) => {
                const isOutOfStock = product.stock <= 0;
                const isLow = product.stock <= product.minimumStock;

                return (
                  <div
                    key={product.id}
                    id={`pos-product-card-${product.id}`}
                    onClick={() => {
                      if (isOutOfStock) return;
                      if (product.isWeighted) {
                        openWeightModal(product);
                      } else {
                        addToCart(product, 1);
                      }
                    }}
                    className={`bg-[#141414] rounded-2xl p-3 sm:p-3.5 border transition-all flex flex-col justify-between select-none text-right group ${
                      isOutOfStock
                        ? 'opacity-40 border-white/5 bg-[#101010] cursor-not-allowed'
                        : 'border-white/5 hover:border-amber-500/40 hover:shadow-xl hover:-translate-y-0.5 cursor-pointer active:scale-[0.98]'
                    }`}
                  >
                    <div>
                      {/* Badge Row */}
                      <div className="flex items-center justify-between gap-1 mb-1 sm:mb-1.5">
                        <span className="text-[9px] sm:text-[10px] text-slate-500 font-mono truncate max-w-[80px]">
                          {product.sku}
                        </span>
                        <span
                          className={`text-[9px] sm:text-[10px] px-1.5 sm:px-2 py-0.5 rounded-full font-bold ${
                            isOutOfStock
                              ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                              : isLow
                              ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                              : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                          }`}
                        >
                          {isOutOfStock
                            ? 'ناموجود'
                            : `موجود: ${formatWeightOrQuantity(product.stock, product.unit)}`}
                        </span>
                      </div>

                      {/* Title */}
                      <h3 className="text-xs sm:text-xs font-bold text-slate-200 line-clamp-2 leading-snug group-hover:text-amber-400 transition-colors">
                        {product.name}
                      </h3>
                    </div>

                    {/* Footer: Price & Add Icon */}
                    <div className="pt-2 sm:pt-3 mt-1.5 sm:mt-2 border-t border-white/5 flex items-center justify-between">
                      <div className="text-left">
                        <div className="text-xs font-black text-amber-400 font-sans">
                          {formatCurrency(product.salePrice)}
                        </div>
                        <div className="text-[9px] sm:text-[10px] text-slate-500">
                          {product.isWeighted ? 'هر کیلو' : `هر ${getUnitLabel(product.unit)}`}
                        </div>
                      </div>

                      <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-white/5 group-hover:bg-amber-500 text-slate-400 group-hover:text-slate-950 flex items-center justify-center transition-all shadow-xs shrink-0">
                        {product.isWeighted ? <Scale className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> : <Plus className="w-3.5 h-3.5 sm:w-4 sm:h-4" />}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Mobile Sticky Quick Cart Floating Bar (visible on mobile products view when cart has items) */}
        {cart.length > 0 && mobileView === 'products' && (
          <div className="lg:hidden p-3 bg-[#181818]/95 backdrop-blur-md border-t border-white/10 flex items-center justify-between gap-2 shadow-2xl z-20">
            <div className="text-right">
              <div className="text-[10px] text-slate-400">
                {toPersianDigits(cart.length)} قلم کالا انتخاب شده
              </div>
              <div className="text-sm font-black text-amber-400 font-sans">
                {formatCurrency(finalAmount)}
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => setShowCameraScanner(true)}
                className="p-2.5 bg-amber-500/10 text-amber-400 border border-amber-500/20 rounded-xl"
                title="اسکن با دوربین"
              >
                <Camera className="w-4 h-4" />
              </button>
              <button
                onClick={() => setMobileView('cart')}
                className="px-4 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-md shadow-amber-500/20 cursor-pointer"
              >
                <span>مشاهده سبد و تسویه</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ================= LEFT SIDE: CART & CHECKOUT PANEL ================= */}
      <div className={`w-full lg:w-[420px] bg-[#141414] flex flex-col justify-between shrink-0 shadow-2xl z-20 border-r border-white/5 ${mobileView === 'products' ? 'hidden lg:flex' : 'flex flex-1'}`}>
        {/* Cart Header */}
        <div className="p-3.5 sm:p-4 bg-[#181818] text-white flex items-center justify-between border-b border-white/5">
          <div className="flex items-center gap-2">
            {/* Mobile Back Button to Products */}
            <button
              onClick={() => setMobileView('products')}
              className="lg:hidden p-1 rounded-lg bg-white/5 text-slate-400 hover:text-white"
            >
              <ArrowRight className="w-4 h-4 rotate-180" />
            </button>
            <ShoppingCart className="w-5 h-5 text-amber-400" />
            <h2 className="text-sm font-bold">سبد فروش جاری</h2>
            <span className="bg-amber-500 text-slate-950 text-xs font-black px-2 py-0.5 rounded-full">
              {toPersianDigits(cart.length)} قلم
            </span>
          </div>
          {cart.length > 0 && (
            <button
              onClick={clearCart}
              className="text-xs text-rose-400 hover:text-rose-300 flex items-center gap-1 cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>پاک‌کردن</span>
            </button>
          )}
        </div>

        {/* Error Alert */}
        {errorMsg && (
          <div className="m-3 p-3 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-xl text-xs flex items-center gap-2 animate-shake">
            <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Cart Items List */}
        <div className="flex-1 overflow-y-auto p-3 space-y-2 bg-[#0e0e0e]">
          {cart.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-slate-500 p-6 text-center">
              <ShoppingCart className="w-12 h-12 stroke-1 mb-2 text-slate-700" />
              <p className="text-xs font-medium">سبد خرید در حال حاضر خالی است.</p>
              <p className="text-[11px] text-slate-600 mt-1">
                بارکد کالا را با دوربین اسکن کنید یا از لیست کالاها انتخاب نمایید.
              </p>
              <button
                onClick={() => setShowCameraScanner(true)}
                className="mt-4 px-4 py-2 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-400 rounded-xl text-xs font-bold flex items-center gap-2 cursor-pointer"
              >
                <Camera className="w-4 h-4" />
                <span>اسکن بارکد با دوربین</span>
              </button>
            </div>
          ) : (
            cart.map((item, idx) => (
              <div
                key={idx}
                className="bg-[#181818] p-3 rounded-2xl border border-white/5 shadow-sm space-y-2"
              >
                {/* Item Header */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1">
                    <h4 className="text-xs font-bold text-slate-200 leading-tight">
                      {item.product.name}
                    </h4>

                    {/* Unit Sale Price with Inline Quick Edit */}
                    {editingPriceIndex === idx ? (
                      <div className="flex items-center gap-1.5 mt-1">
                        <span className="text-[10px] text-amber-400">فی جدید:</span>
                        <input
                          type="number"
                          step="500"
                          value={tempPriceInput}
                          onChange={(e) => setTempPriceInput(e.target.value)}
                          className="w-24 px-2 py-0.5 bg-black/40 border border-amber-500/50 rounded-lg text-xs font-bold text-amber-300 outline-none"
                          autoFocus
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              updateItemPrice(idx, parseFloat(tempPriceInput) || item.unitSalePrice);
                            }
                          }}
                        />
                        <button
                          type="button"
                          onClick={() => updateItemPrice(idx, parseFloat(tempPriceInput) || item.unitSalePrice)}
                          className="px-2 py-0.5 bg-amber-500 text-slate-950 rounded-lg text-[10px] font-bold cursor-pointer"
                        >
                          تأیید
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditingPriceIndex(null)}
                          className="text-[10px] text-slate-400 hover:text-white px-1 cursor-pointer"
                        >
                          لغو
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1.5 text-[11px] text-slate-400 mt-0.5">
                        <span>فی: {formatCurrency(item.unitSalePrice)}</span>
                        <button
                          onClick={() => {
                            setEditingPriceIndex(idx);
                            setTempPriceInput(String(item.unitSalePrice));
                          }}
                          className="text-[10px] text-amber-400/80 hover:text-amber-300 underline cursor-pointer"
                          title="تغییر قیمت فروش در این فاکتور"
                        >
                          (تغییر قیمت)
                        </button>
                      </div>
                    )}
                  </div>
                  <button
                    onClick={() => removeFromCart(idx)}
                    className="p-1 text-slate-500 hover:text-rose-400 rounded-lg hover:bg-rose-500/10 transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Quantity & Weight Controls */}
                <div className="flex items-center justify-between pt-1">
                  {item.product.isWeighted ? (
                    /* Weighted Item controls */
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => openWeightModal(item.product)}
                        className="px-2.5 py-1 bg-amber-500/10 border border-amber-500/20 text-amber-400 rounded-lg text-xs font-bold flex items-center gap-1 hover:bg-amber-500/20 transition-colors cursor-pointer"
                      >
                        <Scale className="w-3.5 h-3.5 text-amber-400" />
                        <span>{formatWeightOrQuantity(item.quantity, item.product.unit)}</span>
                      </button>
                    </div>
                  ) : (
                    /* Piece / Pack counter */
                    <div className="flex items-center gap-1 bg-white/5 p-1 rounded-xl border border-white/10">
                      <button
                        onClick={() => updateQuantity(idx, item.quantity - 1)}
                        className="w-6 h-6 rounded-lg bg-white/10 text-slate-200 hover:bg-white/20 flex items-center justify-center cursor-pointer shadow-xs"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="w-8 text-center text-xs font-bold font-sans text-white">
                        {toPersianDigits(item.quantity)}
                      </span>
                      <button
                        onClick={() => updateQuantity(idx, item.quantity + 1)}
                        className="w-6 h-6 rounded-lg bg-white/10 text-slate-200 hover:bg-white/20 flex items-center justify-center cursor-pointer shadow-xs"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>
                  )}

                  {/* Line Total */}
                  <div className="text-left">
                    <span className="text-xs font-black text-amber-400 font-sans">
                      {formatCurrency(item.total)}
                    </span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Checkout Summary & Customer Bar */}
        <div className="p-3 sm:p-4 bg-[#141414] border-t border-white/5 space-y-2.5 sm:space-y-3">
          {/* Customer Selector */}
          <div>
            <div className="flex items-center gap-2">
              <select
                id="pos-customer-select"
                value={selectedCustomerId}
                onChange={(e) => handleCustomerChange(e.target.value)}
                className="flex-1 py-1.5 px-3 bg-white/5 border border-white/10 rounded-xl text-xs text-slate-200 focus:outline-hidden focus:ring-1 focus:ring-amber-500 font-medium"
              >
                {customers.map((c) => (
                  <option key={c.id} value={c.id} className="bg-[#181818] text-slate-200">
                    {c.name} {c.phone ? `(${toPersianDigits(c.phone)})` : ''}
                  </option>
                ))}
              </select>
              <button
                onClick={() => setShowAddCustomerModal(true)}
                className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 border border-white/10 text-xs font-semibold flex items-center justify-center cursor-pointer"
                title="ثبت مشتری جدید"
              >
                <UserPlus className="w-4 h-4 text-slate-300" />
              </button>
            </div>

            {selectedCustomer && ((selectedCustomer.fixedDiscountPercent || 0) > 0 || (selectedCustomer.fixedDiscountAmount || 0) > 0) && (
              <div className="text-[10.5px] text-purple-300 flex items-center gap-1 mt-1 font-bold">
                <Tag className="w-3 h-3" />
                <span>
                  تخفیف مشتری دائمی: {(selectedCustomer.fixedDiscountPercent || 0) > 0 ? `${toPersianDigits(selectedCustomer.fixedDiscountPercent)}%` : formatCurrency(selectedCustomer.fixedDiscountAmount || 0)}
                </span>
              </div>
            )}
          </div>

          {/* Payment Method Selector */}
          <div className="grid grid-cols-3 gap-1.5 bg-white/5 p-1 rounded-xl border border-white/5">
            <button
              type="button"
              onClick={() => setPaymentMethod('CARD')}
              className={`py-1.5 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1 cursor-pointer ${
                paymentMethod === 'CARD'
                  ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 shadow-md shadow-amber-500/20'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <CreditCard className="w-3.5 h-3.5" />
              <span>کارتخوان</span>
            </button>
            <button
              type="button"
              onClick={() => setPaymentMethod('CASH')}
              className={`py-1.5 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1 cursor-pointer ${
                paymentMethod === 'CASH'
                  ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 shadow-md shadow-amber-500/20'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Banknote className="w-3.5 h-3.5" />
              <span>نقدی</span>
            </button>
            <button
              type="button"
              onClick={() => setPaymentMethod('SPLIT')}
              className={`py-1.5 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1 cursor-pointer ${
                paymentMethod === 'SPLIT'
                  ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 shadow-md shadow-amber-500/20'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Split className="w-3.5 h-3.5" />
              <span>ترکیبی</span>
            </button>
          </div>

          {/* Split Payment Inputs */}
          {paymentMethod === 'SPLIT' && (
            <div className="grid grid-cols-2 gap-2 pt-1 text-xs">
              <div>
                <label className="block text-[11px] text-slate-400 mb-1">مبلغ نقدی:</label>
                <input
                  type="number"
                  value={cashPaid || ''}
                  onChange={(e) => {
                    const val = Number(e.target.value);
                    setCashPaid(val);
                    setCardPaid(Math.max(0, finalAmount - val));
                  }}
                  className="w-full p-2 bg-white/5 border border-white/10 rounded-lg text-xs text-white"
                  placeholder="تومان"
                />
              </div>
              <div>
                <label className="block text-[11px] text-slate-400 mb-1">مبلغ کارتخوان:</label>
                <input
                  type="number"
                  value={cardPaid || ''}
                  onChange={(e) => setCardPaid(Number(e.target.value))}
                  className="w-full p-2 bg-white/5 border border-white/10 rounded-lg text-xs text-white"
                  placeholder="تومان"
                />
              </div>
            </div>
          )}

          {/* PC-POS Card Reader Send Button */}
          {(paymentMethod === 'CARD' || paymentMethod === 'SPLIT') && (
            <div className="pt-1">
              <button
                id="send-to-pos-terminal-btn"
                type="button"
                onClick={() => setShowPosTerminalModal(true)}
                className={`w-full py-2.5 px-3 rounded-xl border text-xs font-bold transition-all flex items-center justify-between cursor-pointer ${
                  posTransactionResult
                    ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                    : 'bg-gradient-to-r from-blue-600/15 to-blue-700/25 border-blue-500/30 text-blue-300 hover:text-white hover:border-blue-400'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Wifi className={`w-4 h-4 ${posTransactionResult ? 'text-emerald-400' : 'text-blue-400'}`} />
                  <span>
                    {posTransactionResult
                      ? `رسید کارتخوان دریافت شد (پیگیری: ${toPersianDigits(posTransactionResult.traceNumber)})`
                      : 'ارسال مبلغ به کارت‌خوان (PC-POS)'}
                  </span>
                </div>
                <div className="flex items-center gap-1 text-[11px] font-mono">
                  <span>{formatCurrency(paymentMethod === 'CARD' ? finalAmount : cardPaid)}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </div>
              </button>
            </div>
          )}

          {/* Dual Mode (Percent / Amount) Invoice Discount Input */}
          <div className="pt-1 border-t border-white/5 space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-400 flex items-center gap-1">
                <Tag className="w-3.5 h-3.5 text-slate-500" />
                <span>تخفیف روی کل فاکتور:</span>
              </span>

              <div className="flex items-center gap-1 bg-white/5 p-0.5 rounded-lg border border-white/5">
                <button
                  type="button"
                  onClick={() => setDiscountMode('AMOUNT')}
                  className={`px-2 py-0.5 rounded-md text-[10px] font-bold transition-all cursor-pointer ${
                    discountMode === 'AMOUNT' ? 'bg-amber-500 text-slate-950' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  مبلغی (تومان)
                </button>
                <button
                  type="button"
                  onClick={() => setDiscountMode('PERCENT')}
                  className={`px-2 py-0.5 rounded-md text-[10px] font-bold transition-all cursor-pointer ${
                    discountMode === 'PERCENT' ? 'bg-amber-500 text-slate-950' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  درصدی (%)
                </button>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="number"
                min="0"
                max={discountMode === 'PERCENT' ? 100 : subtotal}
                value={discountValue || ''}
                onChange={(e) => setDiscountValue(Math.max(0, Number(e.target.value)))}
                placeholder={discountMode === 'PERCENT' ? 'درصد تخفیف (مثلاً ۱۰٪)' : 'مبلغ تخفیف (تومان)'}
                className="flex-1 text-left py-1.5 px-3 bg-white/5 border border-white/10 rounded-xl text-xs font-bold text-white placeholder-slate-600 focus:border-amber-500 outline-none"
              />
              {discountMode === 'PERCENT' && discountValue > 0 && (
                <span className="text-[11px] text-rose-400 font-sans font-bold whitespace-nowrap">
                  = {formatCurrency(invoiceDiscount)}
                </span>
              )}
            </div>
          </div>

          {/* Financial Totals */}
          <div className="pt-2 border-t border-white/5 space-y-1 text-xs">
            <div className="flex justify-between text-slate-400">
              <span>جمع اقلام:</span>
              <span>{formatCurrency(subtotal)}</span>
            </div>
            {totalDiscount > 0 && (
              <div className="flex justify-between text-rose-400 font-semibold">
                <span>مجموع تخفیفات:</span>
                <span>- {formatCurrency(totalDiscount)}</span>
              </div>
            )}
            <div className="flex justify-between items-center text-sm font-black text-white pt-1.5 border-t border-white/5">
              <span>مبلغ نهایی:</span>
              <span className="text-base sm:text-lg text-amber-400 font-sans">
                {formatCurrency(finalAmount)}
              </span>
            </div>
          </div>

          {/* Submit Checkout Button */}
          <button
            id="pos-checkout-btn"
            onClick={handleCheckout}
            disabled={cart.length === 0 || isSubmitting}
            className="w-full py-3 sm:py-3.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black rounded-2xl shadow-lg shadow-amber-500/25 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 text-xs sm:text-sm"
          >
            {isSubmitting ? (
              <span>در حال ثبت فاکتور...</span>
            ) : (
              <>
                <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5" />
                <span>ثبت نهایی و صدور فاکتور ({formatCurrency(finalAmount)})</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* ================= MODAL: CAMERA BARCODE SCANNER ================= */}
      <CameraBarcodeScannerModal
        isOpen={showCameraScanner}
        onClose={() => setShowCameraScanner(false)}
        onScan={handleBarcodeScanned}
        continuous={true}
        title="اسکن بارکد کالا با دوربین موبایل"
        subtitle="بارکد روی بسته‌بندی را روبروی دوربین بگیرید تا کالا خودکار به سبد افزوده شود"
      />

      {/* ================= MODAL: WEIGHT CALCULATOR ================= */}
      {weightModalProduct && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[#141414] rounded-3xl p-5 sm:p-6 shadow-2xl border border-white/10 w-full max-w-md space-y-4 sm:space-y-5 text-right">
            <div className="flex items-center justify-between border-b border-white/5 pb-3">
              <div className="flex items-center gap-2">
                <Scale className="w-5 h-5 text-amber-400" />
                <h3 className="text-sm font-bold text-white">
                  محاسبه وزن و قیمت فله: {weightModalProduct.name}
                </h3>
              </div>
              <button
                onClick={() => setWeightModalProduct(null)}
                className="text-slate-400 hover:text-white p-1 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-2xl flex justify-between items-center text-xs">
              <span className="text-slate-300">قیمت مصوب هر کیلوگرم:</span>
              <span className="font-bold text-amber-400 text-sm">
                {formatCurrency(weightModalProduct.salePrice)}
              </span>
            </div>

            {/* Quick Weight Presets */}
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-2">
                وزن‌های پرکاربرد (پیش‌فرض):
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { label: '۱۰۰ گرم', kg: '0.100', g: 100 },
                  { label: '۲۵۰ گرم', kg: '0.250', g: 250 },
                  { label: '۵۰۰ گرم', kg: '0.500', g: 500 },
                  { label: '۷۵۰ گرم', kg: '0.750', g: 750 },
                  { label: '۱ کیلوگرم', kg: '1.000', g: 1000 },
                  { label: '۱.۵ کیلوگرم', kg: '1.500', g: 1500 },
                ].map((item) => (
                  <button
                    key={item.kg}
                    type="button"
                    onClick={() => {
                      setWeightCustomKg(item.kg);
                      setWeightGrams(item.g);
                    }}
                    className={`py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                      weightCustomKg === item.kg
                        ? 'bg-amber-500 text-slate-950 border-amber-500 shadow-md shadow-amber-500/20'
                        : 'bg-white/5 text-slate-300 border-white/10 hover:bg-white/10'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Custom Decimal Input */}
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5">
                یا ورود وزن دقیق (کیلوگرم):
              </label>
              <input
                type="number"
                step="0.001"
                min="0.001"
                value={weightCustomKg}
                onChange={(e) => setWeightCustomKg(e.target.value)}
                className="w-full py-2.5 px-3 bg-white/5 border border-white/10 rounded-xl text-center text-base font-bold text-white focus:outline-hidden focus:ring-2 focus:ring-amber-500 font-mono"
                placeholder="مثلاً 0.350"
              />
            </div>

            {/* Live Calculated Price Preview */}
            <div className="p-3.5 bg-black/40 border border-white/5 text-white rounded-2xl flex items-center justify-between">
              <div>
                <div className="text-[11px] text-slate-400">مبلغ محاسبه شده:</div>
                <div className="text-xs text-amber-300 font-sans">
                  {formatWeightOrQuantity(parseFloat(weightCustomKg) || 0, 'KG')}
                </div>
              </div>
              <div className="text-base sm:text-lg font-black text-amber-400 font-sans">
                {formatCurrency((parseFloat(weightCustomKg) || 0) * weightModalProduct.salePrice)}
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setWeightModalProduct(null)}
                className="flex-1 py-2.5 bg-white/5 hover:bg-white/10 text-slate-300 font-bold rounded-xl text-xs cursor-pointer border border-white/5"
              >
                انصراف
              </button>
              <button
                type="button"
                onClick={handleApplyWeight}
                className="flex-1 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold rounded-xl text-xs cursor-pointer shadow-md shadow-amber-500/20"
              >
                افزودن به سبد خرید
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL: QUICK CUSTOMER ADD ================= */}
      {showAddCustomerModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[#141414] rounded-3xl p-6 shadow-2xl border border-white/10 w-full max-w-sm space-y-4 text-right">
            <div className="flex items-center justify-between border-b border-white/5 pb-2">
              <h3 className="text-sm font-bold text-white">ثبت سریع مشتری جدید</h3>
              <button
                onClick={() => setShowAddCustomerModal(false)}
                className="text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleCreateCustomer} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">نام مشتری *</label>
                <input
                  type="text"
                  required
                  value={newCustomerName}
                  onChange={(e) => setNewCustomerName(e.target.value)}
                  placeholder="نام و نام خانوادگی"
                  className="w-full p-2.5 bg-white/5 border border-white/10 rounded-xl text-xs text-white placeholder-slate-500"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">شماره تماس</label>
                <input
                  type="text"
                  value={newCustomerPhone}
                  onChange={(e) => setNewCustomerPhone(e.target.value)}
                  placeholder="۰۹۱۲..."
                  className="w-full p-2.5 bg-white/5 border border-white/10 rounded-xl text-xs text-left text-white placeholder-slate-500"
                  dir="ltr"
                />
              </div>
              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddCustomerModal(false)}
                  className="flex-1 py-2 bg-white/5 text-slate-300 hover:bg-white/10 border border-white/5 rounded-xl text-xs font-bold cursor-pointer"
                >
                  انصراف
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 rounded-xl text-xs font-bold cursor-pointer shadow-md shadow-amber-500/20"
                >
                  ثبت مشتری
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL: PC-POS TERMINAL ================= */}
      <PosTerminalModal
        isOpen={showPosTerminalModal}
        amount={paymentMethod === 'CARD' ? finalAmount : cardPaid}
        invoiceNumber="INV-POS"
        settings={settings}
        onSuccess={(result) => {
          setPosTransactionResult(result);
          handleCheckout(result);
        }}
        onCancel={() => setShowPosTerminalModal(false)}
      />

      {/* ================= MODAL: PRINT RECEIPT ================= */}
      {completedSale && (
        <ReceiptModal
          sale={completedSale}
          settings={settings}
          onClose={() => setCompletedSale(null)}
        />
      )}
    </div>
  );
};

