export type Role = 'ADMIN' | 'SELLER';

export type Permission =
  | 'PRODUCT_VIEW'
  | 'PRODUCT_CREATE'
  | 'PRODUCT_EDIT'
  | 'PRODUCT_DELETE'
  | 'SALES_VIEW'
  | 'SALES_CREATE'
  | 'SALES_CANCEL'
  | 'PURCHASE_VIEW'
  | 'PURCHASE_CREATE'
  | 'INVENTORY_VIEW'
  | 'INVENTORY_ADJUST'
  | 'PROFIT_VIEW'
  | 'REPORT_VIEW'
  | 'USER_MANAGEMENT'
  | 'SETTINGS'
  | 'BACKUP'
  | 'BARCODE_PRINT';

export interface User {
  id: string;
  username: string;
  name: string;
  role: Role;
  permissions?: Permission[];
  isActive: boolean;
  createdAt: string;
}

export type ProductUnit = 'KG' | 'G' | 'MESGHAL' | 'SOUT' | 'PIECE' | 'PACK' | 'BOX' | 'CARTON';

export interface Category {
  id: string;
  name: string;
  description?: string;
  icon?: string;
  color?: string;
  productCount?: number;
}

export interface Product {
  id: string;
  name: string;
  sku: string;
  barcode: string;
  categoryId: string;
  categoryName?: string;
  purchasePrice: number; // Stored securely on backend, stripped for SELLER
  salePrice: number;
  stock: number;
  minimumStock: number;
  unit: ProductUnit;
  isWeighted: boolean; // True for bulk nuts sold by kg/g
  description?: string;
  image?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  address?: string;
  description?: string;
  notes?: string;
  fixedDiscountPercent?: number; // تخفیف ثابت درصدی برای مشتری
  fixedDiscountAmount?: number; // تخفیف ثابت مبلغی
  creditBalance?: number; // مانده حساب (مثبت: بستانکار، منفی: بدهکار)
  maxCreditLimit?: number; // سقف اعتبار نسیه
  lastPurchaseDate?: string;
  totalPurchases?: number;
  totalSpent?: number;
  createdAt: string;
}

export type CustomerTransactionType = 'PAYMENT' | 'DEBT_ADD' | 'DEBT_SETTLE' | 'SALE_INVOICE' | 'REFUND';

export interface CustomerTransaction {
  id: string;
  customerId: string;
  customerName?: string;
  type: CustomerTransactionType;
  amount: number;
  description: string;
  paymentMethod?: PaymentMethod;
  referenceId?: string;
  date: string;
  createdAt: string;
}

export interface Supplier {
  id: string;
  name: string;
  phone: string;
  contactPerson?: string;
  address?: string;
  description?: string;
  creditBalance?: number; // مانده حساب با تامین کننده (مثبت: بستانکار تامین کننده)
  totalPurchases?: number;
  createdAt: string;
}

export type PaymentMethod = 'CASH' | 'CARD' | 'SPLIT';
export type SaleStatus = 'COMPLETED' | 'CANCELLED';

export interface SaleItem {
  id: string;
  saleId?: string;
  productId: string;
  productName: string;
  quantity: number; // in unit (e.g. 0.250 for 250g if unit is KG, or 2 for pieces)
  unit: ProductUnit;
  unitSalePrice: number;
  unitPurchasePrice: number; // Snapshot of purchase price at sale moment
  discount: number;
  total: number;
  profit?: number; // Calculated securely on backend
}

export interface Sale {
  id: string;
  invoiceNumber: string;
  sellerId: string;
  sellerName: string;
  customerId?: string;
  customerName?: string;
  customerPhone?: string;
  items: SaleItem[];
  subtotal: number;
  discount: number;
  tax: number;
  finalAmount: number;
  paymentMethod: PaymentMethod;
  cashPaid: number;
  cardPaid: number;
  status: SaleStatus;
  cancelReason?: string;
  cancelledAt?: string;
  createdAt: string;
  totalProfit?: number; // Only for ADMIN
  cardTraceNumber?: string;
  cardRRN?: string;
  cardMaskedPan?: string;
  cardTerminalId?: string;
}

export interface PurchaseItem {
  id: string;
  purchaseId?: string;
  productId: string;
  productName: string;
  quantity: number;
  unit: ProductUnit;
  unitPurchasePrice: number;
  total: number;
}

export interface Purchase {
  id: string;
  invoiceNumber: string;
  supplierId: string;
  supplierName: string;
  userId: string;
  userName: string;
  items: PurchaseItem[];
  totalAmount: number;
  status: 'COMPLETED' | 'CANCELLED';
  description?: string;
  createdAt: string;
}

export type StockMovementType =
  | 'PURCHASE'
  | 'SALE'
  | 'SALE_CANCEL'
  | 'ADJUSTMENT'
  | 'RETURN'
  | 'INITIAL_STOCK'
  | 'WASTE'
  | 'EXPIRED';

export interface StockMovement {
  id: string;
  productId: string;
  productName: string;
  type: StockMovementType;
  quantity: number;
  previousStock: number;
  newStock: number;
  referenceId?: string;
  userId: string;
  userName: string;
  notes?: string;
  createdAt: string;
}

export type ThemeColor = 'amber' | 'emerald' | 'blue' | 'rose' | 'purple' | 'violet' | 'teal' | 'cyan' | 'slate';
export type FontFamily = 'vazir' | 'vazirmatn' | 'shabnam' | 'dana' | 'sahel' | 'system';
export type FontSize = 'sm' | 'base' | 'md' | 'lg' | 'xl';
export type ReceiptTemplateType = 'CLASSIC_80' | 'COMPACT_58' | 'MODERN_QR' | 'OFFICIAL_A5';
export type PosProviderType = 'BEHPARDAKHT' | 'ASAN_PARDAKHT' | 'SAMAN_KISH' | 'IRAN_KISH' | 'FANAP' | 'PARSIAN';

export interface PosTerminalConfig {
  enabled: boolean;
  provider: PosProviderType;
  connectionType: 'LAN_IP' | 'SERIAL_COM' | 'BRIDGE_AGENT' | 'BRIDGE_SERVER';
  ipAddress: string;
  port: number;
  terminalId: string;
  merchantId?: string;
  serialPort?: string;
  baudRate?: number;
  autoSendOnCardPayment: boolean;
  timeoutSeconds: number;
}

export interface PosTransactionResult {
  success: boolean;
  message: string;
  traceNumber?: string;
  rrn?: string;
  maskedPan?: string;
  terminalId?: string;
  amount?: number;
  transactionTime?: string;
}

export interface StoreSettings {
  storeName: string;
  storePhone: string;
  storeAddress: string;
  logoText: string;
  currency: string;
  taxRate: number;
  receiptFooter: string;
  receiptTemplate?: ReceiptTemplateType;
  themeColor?: ThemeColor;
  fontFamily?: FontFamily;
  fontSize?: FontSize;
  posTerminal?: PosTerminalConfig;
  backupRetentionDays: number;
  autoBackupEnabled: boolean;
}

export interface BackupMeta {
  id: string;
  filename: string;
  createdAt: string;
  fileSizeBytes: number;
  isManual: boolean;
  recordCounts: {
    products: number;
    sales: number;
    purchases: number;
    stockMovements: number;
    customers: number;
    suppliers: number;
    users: number;
  };
}

export interface BackupItem extends BackupMeta {}

export interface DashboardStats {
  todaySalesAmount: number;
  todaySalesCount: number;
  todayProfit: number;
  todayAverageInvoice: number;
  weekSalesAmount: number;
  weekProfit: number;
  monthSalesAmount: number;
  monthProfit: number;
  yearSalesAmount: number;
  yearProfit: number;
  totalProductsCount: number;
  lowStockProductsCount: number;
  topSellingProducts: {
    productId: string;
    productName: string;
    totalQuantity: number;
    unit: ProductUnit;
    totalRevenue: number;
    totalProfit: number;
  }[];
  worstSellingProducts: {
    productId: string;
    productName: string;
    stock: number;
    unit: ProductUnit;
  }[];
  recentSales: Sale[];
  recentPurchases: Purchase[];
  salesChartData: {
    date: string;
    sales: number;
    profit: number;
    invoices: number;
  }[];
  categorySalesData: {
    name: string;
    value: number;
  }[];
}

// Accounting & Expenses
export type ExpenseCategory =
  | 'PACKAGING' // خرید نایلون و بسته‌بندی
  | 'SALARY' // حقوق و دستمزد پرسنل
  | 'RENT' // اجاره فروشگاه و انبار
  | 'UTILITIES' // قبوض (آب، برق، گاز، تلفن و اینترنت)
  | 'MAINTENANCE' // تعمیرات و نگهداری تجهیزات
  | 'MARKETING' // تبلیغات و بازاریابی
  | 'TRANSPORT' // حمل‌ونقل و پیک
  | 'TAX_LEGAL' // مالیات و امور حقوقی
  | 'CONSUMABLES' // ملزومات مصرفی و نظافت
  | 'OTHER'; // سایر هزینه‌های متفرقه

export interface Expense {
  id: string;
  title: string;
  category: ExpenseCategory;
  amount: number;
  date: string;
  paymentMethod: PaymentMethod;
  recipient?: string; // دریافت کننده (مثلا نام پرسنل، صاحب ملک، فروشنده نایلون)
  notes?: string;
  receiptNumber?: string;
  referenceNumber?: string;
  userId?: string;
  userName?: string;
  createdAt: string;
}

// Cheque Management
export type ChequeType = 'RECEIVABLE' | 'PAYABLE'; // دریافتی از مشتری / پرداختی به تامین‌کننده یا هزینه‌ها
export type ChequeStatus = 'PENDING' | 'CLEARED' | 'BOUNCED' | 'CANCELLED'; // در انتظار / پاس شده / برگشتی / باطل شده

export interface Cheque {
  id: string;
  type: ChequeType;
  chequeNumber: string;
  sayadNumber?: string;
  bankName: string;
  branchName?: string;
  accountOwner?: string; // صاحب حساب / صادرکننده
  accountParty?: string; // طرف حساب
  amount: number;
  issueDate?: string; // تاریخ صدور
  dueDate: string; // تاریخ سررسید
  status: ChequeStatus;
  partyId?: string; // شناسه مشتری یا تامین‌کننده
  partyName?: string; // نام طرف حساب
  partyPhone?: string;
  notes?: string;
  description?: string;
  clearedDate?: string;
  createdAt: string;
}

export type PurchaseInvoice = Purchase;

export interface BulkPriceUpdatePayload {
  productIds: string[]; // 'ALL' or array of IDs
  categoryId?: string;
  targetPrice: 'salePrice' | 'purchasePrice' | 'both';
  mode: 'PERCENT' | 'AMOUNT';
  operation: 'INCREASE' | 'DECREASE';
  value: number;
  roundTo?: number; // e.g. 1000, 5000, 10000
}

export interface AccountingSummary {
  totalSales: number;
  totalPurchases: number;
  totalExpenses: number;
  netProfit: number;
  pendingReceivableCheques: {
    count: number;
    totalAmount: number;
  };
  pendingPayableCheques: {
    count: number;
    totalAmount: number;
  };
  dueTodayCheques: Cheque[];
  upcomingCheques: Cheque[]; // Next 7 days
  overdueCheques: Cheque[];
  expensesByCategory: {
    category: ExpenseCategory;
    label: string;
    amount: number;
    count: number;
  }[];
}

