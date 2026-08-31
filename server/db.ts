import fs from 'fs';
import path from 'path';
import bcrypt from 'bcryptjs';
import {
  User,
  Category,
  Product,
  Customer,
  Supplier,
  Sale,
  Purchase,
  StockMovement,
  StoreSettings,
  BackupMeta,
  BackupItem,
  Role,
  Permission,
  Expense,
  Cheque,
  CustomerTransaction
} from '../src/types';

// Ensure data and backup directories exist
const DATA_DIR = path.join(process.cwd(), 'data');
const BACKUP_DIR = path.join(process.cwd(), 'backups');

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}
if (!fs.existsSync(BACKUP_DIR)) {
  fs.mkdirSync(BACKUP_DIR, { recursive: true });
}

const DB_FILE = path.join(DATA_DIR, 'store.json');

export interface DatabaseSchema {
  users: (User & { passwordHash: string })[];
  categories: Category[];
  products: Product[];
  customers: Customer[];
  suppliers: Supplier[];
  sales: Sale[];
  purchases: Purchase[];
  stockMovements: StockMovement[];
  expenses: Expense[];
  cheques: Cheque[];
  customerTransactions: CustomerTransaction[];
  settings: StoreSettings;
  backups: BackupItem[];
  counters: {
    invoice: number;
    purchase: number;
    barcode: number;
  };
}

const defaultSettings: StoreSettings = {
  storeName: 'فروشگاه آجیل و خشکبار زعفران طلایی',
  storePhone: '۰۲۱-۸۸۷۷۶۶۵۵',
  storeAddress: 'تهران، خیابان ولیعصر، نرسیده به میدان ونک، پلاک ۱۲۸',
  logoText: 'زعفران طلایی',
  currency: 'تومان',
  taxRate: 0,
  receiptFooter: 'از خرید و اعتماد شما صمیمانه سپاسگزاریم. لطفاً در حفظ فاکتور کوشا باشید.',
  receiptTemplate: 'CLASSIC_80',
  themeColor: 'amber',
  fontFamily: 'vazir',
  fontSize: 'base',
  posTerminal: {
    enabled: true,
    provider: 'BEHPARDAKHT',
    connectionType: 'LAN_IP',
    ipAddress: '192.168.1.150',
    port: 8080,
    terminalId: '8823491',
    merchantId: '1099824',
    autoSendOnCardPayment: false,
    timeoutSeconds: 60,
  },
  backupRetentionDays: 30,
  autoBackupEnabled: true,
};

// Initial Seed Generator
function getInitialSeedData(): DatabaseSchema {
  const adminPasswordHash = bcrypt.hashSync('Admin@123', 10);
  const sellerPasswordHash = bcrypt.hashSync('Seller@123', 10);
  const now = new Date().toISOString();

  const users: (User & { passwordHash: string })[] = [
    {
      id: 'u-admin-1',
      username: 'admin',
      name: 'مهندس حسینی (مدیر فروشگاه)',
      role: 'ADMIN',
      isActive: true,
      createdAt: now,
      passwordHash: adminPasswordHash,
    },
    {
      id: 'u-seller-1',
      username: 'seller',
      name: 'آقای رضایی (صندوق‌دار)',
      role: 'SELLER',
      isActive: true,
      createdAt: now,
      passwordHash: sellerPasswordHash,
    },
  ];

  const categories: Category[] = [
    { id: 'cat-1', name: 'آجیل و مغزها', description: 'انواع مغز پسته، بادام، فندق، گردو و آجیل مخلوط', icon: 'Nut', color: '#f59e0b' },
    { id: 'cat-2', name: 'خشکبار و میوه خشک', description: 'انواع کشمش، توت، انجیر خشک، آلو و میوه خشک اسلایس', icon: 'Apple', color: '#10b981' },
    { id: 'cat-3', name: 'شکلات و تافی', description: 'شکلات‌های کادویی، تخته‌ای، تلخ، مغزدار و پذیرایی', icon: 'Cookie', color: '#8b5cf6' },
    { id: 'cat-4', name: 'شیرینی و آبنبات', description: 'نقل، پولکی، آبنبات سنتی، گز و سوهان درجه یک', icon: 'Sparkles', color: '#ec4899' },
    { id: 'cat-5', name: 'تنقلات و چیپس', description: 'چیپس، پفک، پاپ کورن، بادام زمینی روکش‌دار', icon: 'Flame', color: '#ef4444' },
    { id: 'cat-6', name: 'نوشیدنی و دمنوش', description: 'چای اعلا، زعفران، دمنوش گیاهی و هل', icon: 'Coffee', color: '#06b6d4' },
  ];

  const products: Product[] = [
    {
      id: 'prod-1',
      name: 'پسته اکبری اعلا زعفرانی (دستچین)',
      sku: 'NUT-PST-001',
      barcode: '200000000001',
      categoryId: 'cat-1',
      purchasePrice: 950000,
      salePrice: 1180000,
      stock: 45.5,
      minimumStock: 10,
      unit: 'KG',
      isWeighted: true,
      description: 'پسته اکبری خندان، بو داده با زعفران قائنات درجه یک',
      isActive: true,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'prod-2',
      name: 'مغز گردو تویسرکان اعلا (سفید)',
      sku: 'NUT-GRD-002',
      barcode: '200000000002',
      categoryId: 'cat-1',
      purchasePrice: 650000,
      salePrice: 820000,
      stock: 28.0,
      minimumStock: 8,
      unit: 'KG',
      isWeighted: true,
      description: 'مغز گردو کاملاً روشن و پرروغن تویسرکان',
      isActive: true,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'prod-3',
      name: 'بادام هندی تفت زعفرانی درشت (WW240)',
      sku: 'NUT-BDM-003',
      barcode: '200000000003',
      categoryId: 'cat-1',
      purchasePrice: 850000,
      salePrice: 1050000,
      stock: 35.25,
      minimumStock: 10,
      unit: 'KG',
      isWeighted: true,
      description: 'بادام هندی لوکس درشت زعفرانی',
      isActive: true,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'prod-4',
      name: 'آجیل چهار مغز اعلا شور (پسته، بادام، فندق، هندی)',
      sku: 'NUT-MIX-004',
      barcode: '200000000004',
      categoryId: 'cat-1',
      purchasePrice: 880000,
      salePrice: 1090000,
      stock: 50.0,
      minimumStock: 15,
      unit: 'KG',
      isWeighted: true,
      description: 'ترکیب ممتاز مغز پسته اکبری، مغز بادام ایرانی، فندق قزوین و بادام هندی',
      isActive: true,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'prod-5',
      name: 'فندق شور خندان اشکورات درجه یک',
      sku: 'NUT-FND-005',
      barcode: '200000000005',
      categoryId: 'cat-1',
      purchasePrice: 540000,
      salePrice: 690000,
      stock: 18.5,
      minimumStock: 5,
      unit: 'KG',
      isWeighted: true,
      description: 'فندق دهان‌باز و تازه با طعم برشته خوشمزه',
      isActive: true,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'prod-6',
      name: 'توت خشک اعلا شمیرانی (سفید و شیرین)',
      sku: 'DRY-TOT-006',
      barcode: '200000000006',
      categoryId: 'cat-2',
      purchasePrice: 420000,
      salePrice: 560000,
      stock: 22.0,
      minimumStock: 6,
      unit: 'KG',
      isWeighted: true,
      description: 'توت خشک ارگانیک و نرم، بدون ماسه',
      isActive: true,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'prod-7',
      name: 'کشمش سبز قلمی کاشمر ممتاز',
      sku: 'DRY-KSH-007',
      barcode: '200000000007',
      categoryId: 'cat-2',
      purchasePrice: 220000,
      salePrice: 310000,
      stock: 4.5, // Intentionally low to test low-stock alerts!
      minimumStock: 10,
      unit: 'KG',
      isWeighted: true,
      description: 'کشمش سبز سایه‌خشک طبیعی و مجلسی',
      isActive: true,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'prod-8',
      name: 'انجیر خشک پرک استهبان گرید AAA',
      sku: 'DRY-INJ-008',
      barcode: '200000000008',
      categoryId: 'cat-2',
      purchasePrice: 620000,
      salePrice: 790000,
      stock: 3.0, // Low stock alert!
      minimumStock: 8,
      unit: 'KG',
      isWeighted: true,
      description: 'انجیر سفید شکفته شیراز مخصوص پذیرایی لوکس',
      isActive: true,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'prod-9',
      name: 'شکلات تلخ ۸۵٪ پارمیدا ۳۳۰ گرمی',
      sku: 'CHC-PRM-009',
      barcode: '6260123456789',
      categoryId: 'cat-3',
      purchasePrice: 125000,
      salePrice: 165000,
      stock: 42,
      minimumStock: 10,
      unit: 'PACK',
      isWeighted: false,
      description: 'شکلات خالص دارک، کم‌شکر و سرشار از آنتی‌اکسیدان',
      isActive: true,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'prod-10',
      name: 'شکلات کادویی رویال فرمند (جعبه متالایز)',
      sku: 'CHC-FRM-010',
      barcode: '6260987654321',
      categoryId: 'cat-3',
      purchasePrice: 240000,
      salePrice: 320000,
      stock: 15,
      minimumStock: 5,
      unit: 'BOX',
      isWeighted: false,
      description: 'مجموعه پرالین‌های بلژیکی با بسته‌بندی لوکس کادویی',
      isActive: true,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'prod-11',
      name: 'آبنبات سنتی هل و گلاب بجنوردی ۵۰۰ گرمی',
      sku: 'SND-HLL-011',
      barcode: '200000000011',
      categoryId: 'cat-4',
      purchasePrice: 65000,
      salePrice: 95000,
      stock: 30,
      minimumStock: 10,
      unit: 'PACK',
      isWeighted: false,
      description: 'آبنبات ترد با عطر زعفران و هل ناب',
      isActive: true,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'prod-12',
      name: 'چیپس چیتوز فلفلی کتل چیپس ۱۸۰ گرم',
      sku: 'SNK-CHZ-012',
      barcode: '6261112223334',
      categoryId: 'cat-5',
      purchasePrice: 32000,
      salePrice: 45000,
      stock: 5, // Low stock alert!
      minimumStock: 12,
      unit: 'PIECE',
      isWeighted: false,
      description: 'چیپس ترد تنوری با طعم تند و آتشین',
      isActive: true,
      createdAt: now,
      updatedAt: now,
    },
  ];

  const customers: Customer[] = [
    {
      id: 'cust-1',
      name: 'مشتری عمومی (حضوری)',
      phone: '۰۹۰۰۰۰۰۰۰۰۰',
      address: 'خرید حضوری در فروشگاه',
      description: 'مشتریان گذری',
      totalPurchases: 14,
      totalSpent: 4250000,
      createdAt: now,
    },
    {
      id: 'cust-2',
      name: 'دکتر علیرضا میرزایی',
      phone: '۰۹۱۲۱۱۱۴۴۵۵',
      address: 'تهران، زعفرانیه، خیابان اعجازی',
      description: 'مشتری ثابت آجیل و خشکبار سازمانی',
      totalPurchases: 5,
      totalSpent: 8900000,
      createdAt: now,
    },
    {
      id: 'cust-3',
      name: 'خانم مهندس سعیدی',
      phone: '۰۹۳۵۲۲۲۳۳۴۴',
      address: 'تهران، سعادت آباد، بلوار پاک‌نژاد',
      description: 'خریدار دائمی شکلات کادویی و پسته زعفرانی',
      totalPurchases: 3,
      totalSpent: 3400000,
      createdAt: now,
    },
  ];

  const suppliers: Supplier[] = [
    {
      id: 'sup-1',
      name: 'بازرگانی برادران رفسنجانی (پسته و بادام)',
      phone: '۰۳۴-۳۴۲۵۶۷۸۹',
      address: 'کرمان، رفسنجان، میدان آزادی',
      description: 'تامین‌کننده اصلی پسته اکبری و کله‌قوچی',
      totalPurchases: 125000000,
      createdAt: now,
    },
    {
      id: 'sup-2',
      name: 'خشکبار نمونه تویسرکان و تبریز',
      phone: '۰۸۱-۴۵۲۲۳۳۴۴',
      address: 'همدان، تویسرکان، خیابان انقلاب',
      description: 'تامین‌کننده مستقیم گردو، بادام درختی و کشمش',
      totalPurchases: 85000000,
      createdAt: now,
    },
    {
      id: 'sup-3',
      name: 'شرکت پخش سراسری شیرین‌عسل و فرمند',
      phone: '۰۲۱-۶۶۵۵۴۴۳۳',
      address: 'تهران، جاده مخصوص کرج، کیلومتر ۱۴',
      description: 'پخش رسمی انواع شکلات، تافی و تنقلات',
      totalPurchases: 45000000,
      createdAt: now,
    },
  ];

  // Initial stock movements for realistic ledger tracking
  const stockMovements: StockMovement[] = products.map((prod, idx) => ({
    id: `sm-init-${idx + 1}`,
    productId: prod.id,
    productName: prod.name,
    type: 'INITIAL_STOCK',
    quantity: prod.stock,
    previousStock: 0,
    newStock: prod.stock,
    userId: 'u-admin-1',
    userName: 'مهندس حسینی (مدیر فروشگاه)',
    notes: 'ثبت موجودی اولیه انبار فروشگاه',
    createdAt: new Date(Date.now() - 15 * 24 * 3600 * 1000).toISOString(),
  }));

  // Initial sample sales for analytics
  const pastDate1 = new Date(Date.now() - 2 * 24 * 3600 * 1000).toISOString();
  const pastDate2 = new Date(Date.now() - 1 * 24 * 3600 * 1000).toISOString();

  const sales: Sale[] = [
    {
      id: 'sale-1',
      invoiceNumber: 'INV-1403-1001',
      sellerId: 'u-seller-1',
      sellerName: 'آقای رضایی (صندوق‌دار)',
      customerId: 'cust-2',
      customerName: 'دکتر علیرضا میرزایی',
      customerPhone: '۰۹۱۲۱۱۱۴۴۵۵',
      items: [
        {
          id: 'si-1',
          productId: 'prod-1',
          productName: 'پسته اکبری اعلا زعفرانی (دستچین)',
          quantity: 1.5,
          unit: 'KG',
          unitSalePrice: 1180000,
          unitPurchasePrice: 950000,
          discount: 0,
          total: 1770000,
          profit: 345000,
        },
        {
          id: 'si-2',
          productId: 'prod-3',
          productName: 'بادام هندی تفت زعفرانی درشت (WW240)',
          quantity: 1.0,
          unit: 'KG',
          unitSalePrice: 1050000,
          unitPurchasePrice: 850000,
          discount: 50000,
          total: 1000000,
          profit: 150000,
        },
      ],
      subtotal: 2820000,
      discount: 50000,
      tax: 0,
      finalAmount: 2770000,
      paymentMethod: 'CARD',
      cashPaid: 0,
      cardPaid: 2770000,
      status: 'COMPLETED',
      createdAt: pastDate1,
      totalProfit: 495000,
    },
    {
      id: 'sale-2',
      invoiceNumber: 'INV-1403-1002',
      sellerId: 'u-seller-1',
      sellerName: 'آقای رضایی (صندوق‌دار)',
      customerId: 'cust-3',
      customerName: 'خانم مهندس سعیدی',
      customerPhone: '۰۹۳۵۲۲۲۳۳۴۴',
      items: [
        {
          id: 'si-3',
          productId: 'prod-10',
          productName: 'شکلات کادویی رویال فرمند (جعبه متالایز)',
          quantity: 2,
          unit: 'BOX',
          unitSalePrice: 320000,
          unitPurchasePrice: 240000,
          discount: 0,
          total: 640000,
          profit: 160000,
        },
        {
          id: 'si-4',
          productId: 'prod-2',
          productName: 'مغز گردو تویسرکان اعلا (سفید)',
          quantity: 0.75,
          unit: 'KG',
          unitSalePrice: 820000,
          unitPurchasePrice: 650000,
          discount: 0,
          total: 615000,
          profit: 127500,
        },
      ],
      subtotal: 1255000,
      discount: 0,
      tax: 0,
      finalAmount: 1255000,
      paymentMethod: 'CASH',
      cashPaid: 1255000,
      cardPaid: 0,
      status: 'COMPLETED',
      createdAt: pastDate2,
      totalProfit: 287500,
    },
  ];

  const purchases: Purchase[] = [
    {
      id: 'purch-1',
      invoiceNumber: 'PUR-1403-5001',
      supplierId: 'sup-1',
      supplierName: 'بازرگانی برادران رفسنجانی (پسته و بادام)',
      userId: 'u-admin-1',
      userName: 'مهندس حسینی (مدیر فروشگاه)',
      items: [
        {
          id: 'pi-1',
          productId: 'prod-1',
          productName: 'پسته اکبری اعلا زعفرانی (دستچین)',
          quantity: 50,
          unit: 'KG',
          unitPurchasePrice: 950000,
          total: 47500000,
        },
        {
          id: 'pi-2',
          productId: 'prod-3',
          productName: 'بادام هندی تفت زعفرانی درشت (WW240)',
          quantity: 40,
          unit: 'KG',
          unitPurchasePrice: 850000,
          total: 34000000,
        },
      ],
      totalAmount: 81500000,
      status: 'COMPLETED',
      description: 'خرید بار پاییزه ویژه پسته و بادام هندی',
      createdAt: new Date(Date.now() - 10 * 24 * 3600 * 1000).toISOString(),
    },
  ];

  const expenses: Expense[] = [
    {
      id: 'exp-1',
      title: 'خرید کیسه کرافت زیپ‌کیپ و نایلون دسته‌دار اختصاصی (۱۰۰ کیلو)',
      category: 'PACKAGING',
      amount: 4800000,
      date: new Date(Date.now() - 4 * 24 * 3600 * 1000).toISOString(),
      paymentMethod: 'CARD',
      recipient: 'صنایع پلاستیک و پاکت‌سازی پایتخت',
      receiptNumber: 'PKT-904',
      notes: 'شامل ۵۰ کیلو پاکت کرافت پنجره‌دار و ۵۰ کیلو نایلون چاپی فروشگاه',
      createdAt: new Date(Date.now() - 4 * 24 * 3600 * 1000).toISOString(),
    },
    {
      id: 'exp-2',
      title: 'حقوق و مساعده ماهانه صندوق‌دار و کارگر فروشگاه',
      category: 'SALARY',
      amount: 18500000,
      date: new Date(Date.now() - 7 * 24 * 3600 * 1000).toISOString(),
      paymentMethod: 'CARD',
      recipient: 'پرسنل فروشگاه (آقای رضایی و همکاران)',
      receiptNumber: 'SAL-1403-11',
      notes: 'پرداخت حقوق بهمن ماه به همراه پاداش فروش شب عید',
      createdAt: new Date(Date.now() - 7 * 24 * 3600 * 1000).toISOString(),
    },
    {
      id: 'exp-3',
      title: 'اجاره بهای ماهانه فروشگاه و انبار خشکبار',
      category: 'RENT',
      amount: 35000000,
      date: new Date(Date.now() - 15 * 24 * 3600 * 1000).toISOString(),
      paymentMethod: 'CARD',
      recipient: 'آقای شمس (مالک فروشگاه)',
      receiptNumber: 'RNT-882',
      notes: 'اجاره بهای ملک تجاری ونک',
      createdAt: new Date(Date.now() - 15 * 24 * 3600 * 1000).toISOString(),
    },
    {
      id: 'exp-4',
      title: 'قبض برق و مصارف سرمایش یخچال‌های خشکبار',
      category: 'UTILITIES',
      amount: 2400000,
      date: new Date(Date.now() - 2 * 24 * 3600 * 1000).toISOString(),
      paymentMethod: 'CARD',
      recipient: 'شرکت توزیع نیروی برق تهران',
      receiptNumber: 'ELC-1403',
      notes: 'دوره دوماهه زمستان',
      createdAt: new Date(Date.now() - 2 * 24 * 3600 * 1000).toISOString(),
    },
  ];

  const cheques: Cheque[] = [
    {
      id: 'chk-1',
      type: 'RECEIVABLE',
      chequeNumber: '78451296',
      sayadNumber: '1403987654321012',
      bankName: 'بانک ملت',
      branchName: 'شعبه ونک',
      accountOwner: 'آقای مسعود تقوی',
      amount: 15000000,
      issueDate: new Date(Date.now() - 12 * 24 * 3600 * 1000).toISOString(),
      dueDate: new Date(Date.now() + 2 * 24 * 3600 * 1000).toISOString(), // سررسید نزدیک (۲ روز آینده)
      status: 'PENDING',
      partyId: 'cust-2',
      partyName: 'دکتر مسعود تقوی',
      partyPhone: '۰۹۱۲۴۵۶۷۸۹۰',
      notes: 'بابت خرید آجیل کادویی و پذیرایی شرکتی',
      createdAt: new Date(Date.now() - 12 * 24 * 3600 * 1000).toISOString(),
    },
    {
      id: 'chk-2',
      type: 'RECEIVABLE',
      chequeNumber: '33490122',
      sayadNumber: '1403887766554433',
      bankName: 'بانک ملی ایران',
      branchName: 'شعبه مرکزی',
      accountOwner: 'خانم رستمی',
      amount: 8500000,
      issueDate: new Date(Date.now() - 5 * 24 * 3600 * 1000).toISOString(),
      dueDate: new Date().toISOString(), // سررسید امروز!
      status: 'PENDING',
      partyId: 'cust-3',
      partyName: 'خانم سارا رستمی',
      partyPhone: '۰۹۱۹۳۳۴۴۵۵۶',
      notes: 'بابت سفارش پک آجیل و زعفران شب یلدا',
      createdAt: new Date(Date.now() - 5 * 24 * 3600 * 1000).toISOString(),
    },
    {
      id: 'chk-3',
      type: 'PAYABLE',
      chequeNumber: '99104421',
      sayadNumber: '1403112233445566',
      bankName: 'بانک صادرات',
      branchName: 'شعبه بازار تهران',
      accountOwner: 'فروشگاه زعفران طلایی (حسینی)',
      amount: 45000000,
      issueDate: new Date(Date.now() - 10 * 24 * 3600 * 1000).toISOString(),
      dueDate: new Date(Date.now() + 5 * 24 * 3600 * 1000).toISOString(), // سررسید ۵ روز آینده
      status: 'PENDING',
      partyId: 'sup-1',
      partyName: 'بازرگانی برادران رفسنجانی',
      partyPhone: '۰۳۴-۳۴۲۲۱۱۰۰',
      notes: 'بابت فاکتور خرید پسته اکبری اعلا',
      createdAt: new Date(Date.now() - 10 * 24 * 3600 * 1000).toISOString(),
    },
    {
      id: 'chk-4',
      type: 'RECEIVABLE',
      chequeNumber: '44501988',
      sayadNumber: '1403554433221100',
      bankName: 'بانک پاسارگاد',
      branchName: 'شعبه میرداماد',
      accountOwner: 'شرکت مهندسی رهام',
      amount: 12000000,
      issueDate: new Date(Date.now() - 20 * 24 * 3600 * 1000).toISOString(),
      dueDate: new Date(Date.now() - 2 * 24 * 3600 * 1000).toISOString(),
      clearedDate: new Date(Date.now() - 2 * 24 * 3600 * 1000).toISOString(),
      status: 'CLEARED', // پاس شده
      partyName: 'شرکت مهندسی رهام',
      notes: 'نقد و به حساب جاری واریز شد',
      createdAt: new Date(Date.now() - 20 * 24 * 3600 * 1000).toISOString(),
    },
  ];

  const customerTransactions: CustomerTransaction[] = [
    {
      id: 'ctx-1',
      customerId: 'cust-2',
      customerName: 'دکتر مسعود تقوی',
      type: 'DEBT_ADD',
      amount: 500000,
      description: 'مانده نسیه فاکتور خرید آجیل ممتاز',
      date: new Date(Date.now() - 2 * 24 * 3600 * 1000).toISOString(),
      createdAt: new Date(Date.now() - 2 * 24 * 3600 * 1000).toISOString(),
    },
  ];

  return {
    users,
    categories,
    products,
    customers,
    suppliers,
    sales,
    purchases,
    stockMovements,
    expenses,
    cheques,
    customerTransactions,
    settings: defaultSettings,
    backups: [],
    counters: {
      invoice: 1003,
      purchase: 5002,
      barcode: 200000000015,
    },
  };
}

class DatabaseManager {
  private data: DatabaseSchema;

  constructor() {
    this.data = this.loadData();
    this.runDailyBackupCheck();
  }

  private loadData(): DatabaseSchema {
    try {
      if (fs.existsSync(DB_FILE)) {
        const fileContent = fs.readFileSync(DB_FILE, 'utf-8');
        const parsed = JSON.parse(fileContent);
        // ensure all collections exist
        return {
          users: parsed.users || [],
          categories: parsed.categories || [],
          products: parsed.products || [],
          customers: parsed.customers || [],
          suppliers: parsed.suppliers || [],
          sales: parsed.sales || [],
          purchases: parsed.purchases || [],
          stockMovements: parsed.stockMovements || [],
          expenses: parsed.expenses || [],
          cheques: parsed.cheques || [],
          customerTransactions: parsed.customerTransactions || [],
          settings: parsed.settings || defaultSettings,
          backups: parsed.backups || [],
          counters: parsed.counters || { invoice: 1001, purchase: 5001, barcode: 200000000001 },
        };
      }
    } catch (e) {
      console.error('Failed to load database file, generating seed data:', e);
    }

    const initial = getInitialSeedData();
    this.saveData(initial);
    return initial;
  }

  private saveData(dataToSave: DatabaseSchema = this.data): void {
    try {
      fs.writeFileSync(DB_FILE, JSON.stringify(dataToSave, null, 2), 'utf-8');
    } catch (e) {
      console.error('Failed to write database file:', e);
    }
  }

  public getRawData(): DatabaseSchema {
    return this.data;
  }

  public commit(): void {
    this.saveData(this.data);
  }

  // Backup Engine
  public createBackup(isManual = false): BackupItem {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `backup-${timestamp}.json`;
    const backupPath = path.join(BACKUP_DIR, filename);

    const snapshot = JSON.stringify(this.data, null, 2);
    fs.writeFileSync(backupPath, snapshot, 'utf-8');
    const stats = fs.statSync(backupPath);

    const backupItem: BackupMeta = {
      id: `bk-${Date.now()}`,
      filename,
      fileSizeBytes: stats.size,
      isManual,
      createdAt: new Date().toISOString(),
      recordCounts: {
        products: this.data.products.length,
        sales: this.data.sales.length,
        purchases: this.data.purchases.length,
        stockMovements: this.data.stockMovements.length,
        customers: this.data.customers.length,
        suppliers: this.data.suppliers.length,
        users: this.data.users.length,
      },
    };

    this.data.backups.unshift(backupItem);
    this.pruneOldBackups();
    this.commit();
    return backupItem;
  }

  public restoreBackup(filename: string): boolean {
    const backupPath = path.join(BACKUP_DIR, filename);
    if (!fs.existsSync(backupPath)) {
      throw new Error(`فایل پشتیبان ${filename} یافت نشد.`);
    }

    // Create a safety backup of current state before restoring
    this.createBackup(false);

    const fileContent = fs.readFileSync(backupPath, 'utf-8');
    const parsed = JSON.parse(fileContent);
    this.data = {
      users: parsed.users || [],
      categories: parsed.categories || [],
      products: parsed.products || [],
      customers: parsed.customers || [],
      suppliers: parsed.suppliers || [],
      sales: parsed.sales || [],
      purchases: parsed.purchases || [],
      stockMovements: parsed.stockMovements || [],
      expenses: parsed.expenses || [],
      cheques: parsed.cheques || [],
      customerTransactions: parsed.customerTransactions || [],
      settings: parsed.settings || defaultSettings,
      backups: this.data.backups, // preserve backups history
      counters: parsed.counters || { invoice: 1001, purchase: 5001, barcode: 200000000001 },
    };
    this.commit();
    return true;
  }

  public pruneOldBackups(): void {
    const retentionDays = this.data.settings.backupRetentionDays || 30;
    const cutoffTime = Date.now() - retentionDays * 24 * 3600 * 1000;

    const remainingBackups: BackupItem[] = [];
    for (const b of this.data.backups) {
      const backupTime = new Date(b.createdAt).getTime();
      if (backupTime < cutoffTime) {
        try {
          const filePath = path.join(BACKUP_DIR, b.filename);
          if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
          }
        } catch (e) {
          console.error('Error deleting old backup file:', e);
        }
      } else {
        remainingBackups.push(b);
      }
    }
    this.data.backups = remainingBackups;
  }

  private runDailyBackupCheck(): void {
    // If no backup exists for today, take one
    const today = new Date().toISOString().split('T')[0];
    const hasTodayBackup = this.data.backups.some((b) => b.createdAt.startsWith(today));
    if (!hasTodayBackup && this.data.settings.autoBackupEnabled) {
      this.createBackup(false);
    }
  }

  // Next Unique Numbers
  public getNextInvoiceNumber(): string {
    const nextVal = this.data.counters.invoice++;
    this.commit();
    return `INV-1403-${nextVal}`;
  }

  public getNextPurchaseNumber(): string {
    const nextVal = this.data.counters.purchase++;
    this.commit();
    return `PUR-1403-${nextVal}`;
  }

  public getNextBarcode(): string {
    const nextVal = this.data.counters.barcode++;
    this.commit();
    return String(nextVal);
  }
}

export const db = new DatabaseManager();
