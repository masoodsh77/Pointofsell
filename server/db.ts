import fs from "fs";
import path from "path";
import bcrypt from "bcryptjs";
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
  CustomerTransaction,
} from "../src/types";

// Ensure data and backup directories exist
const DATA_DIR = path.join(process.cwd(), "data");
const BACKUP_DIR = path.join(process.cwd(), "backups");

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}
if (!fs.existsSync(BACKUP_DIR)) {
  fs.mkdirSync(BACKUP_DIR, { recursive: true });
}

const DB_FILE = path.join(DATA_DIR, "store.json");

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
  storeName: "فروشگاه آجیل و خشکبار زعفران طلایی",
  storePhone: "۰۲۱-۸۸۷۷۶۶۵۵",
  storeAddress: "تهران، خیابان ولیعصر، نرسیده به میدان ونک، پلاک ۱۲۸",
  logoText: "زعفران طلایی",
  currency: "تومان",
  taxRate: 0,
  receiptFooter:
    "از خرید و اعتماد شما صمیمانه سپاسگزاریم. لطفاً در حفظ فاکتور کوشا باشید.",
  receiptTemplate: "CLASSIC_80",
  themeColor: "amber",
  fontFamily: "vazir",
  fontSize: "base",
  posTerminal: {
    enabled: true,
    provider: "BEHPARDAKHT",
    connectionType: "LAN_IP",
    ipAddress: "192.168.1.150",
    port: 8080,
    terminalId: "8823491",
    merchantId: "1099824",
    autoSendOnCardPayment: false,
    timeoutSeconds: 60,
  },
  backupRetentionDays: 30,
  autoBackupEnabled: true,
};

// Initial Seed Generator
function getInitialSeedData(): DatabaseSchema {
  const adminPasswordHash = bcrypt.hashSync("Admin@123", 10);
  const sellerPasswordHash = bcrypt.hashSync("Seller@123", 10);
  const now = new Date().toISOString();

  const users: (User & { passwordHash: string })[] = [
    {
      id: "u-admin-1",
      username: "admin",
      name: "هادی جهانتیغ (مدیر فروشگاه)",
      role: "ADMIN",
      isActive: true,
      createdAt: now,
      passwordHash: adminPasswordHash,
    },
    {
      id: "u-seller-1",
      username: "seller",
      name: "رضا جهانتیغ (صندوق‌دار)",
      role: "SELLER",
      isActive: true,
      createdAt: now,
      passwordHash: sellerPasswordHash,
    },
  ];

  const categories: Category[] = [
    {
      id: "cat-1",
      name: "آجیل و مغزها",
      description: "انواع مغز پسته، بادام، فندق، گردو و آجیل مخلوط",
      icon: "Nut",
      color: "#f59e0b",
    },
    {
      id: "cat-2",
      name: "خشکبار و میوه خشک",
      description: "انواع کشمش، توت، انجیر خشک، آلو و میوه خشک اسلایس",
      icon: "Apple",
      color: "#10b981",
    },
    {
      id: "cat-3",
      name: "شکلات و تافی",
      description: "شکلات‌های کادویی، تخته‌ای، تلخ، مغزدار و پذیرایی",
      icon: "Cookie",
      color: "#8b5cf6",
    },
    {
      id: "cat-4",
      name: "شیرینی و آبنبات",
      description: "نقل، پولکی، آبنبات سنتی، گز و سوهان درجه یک",
      icon: "Sparkles",
      color: "#ec4899",
    },
    {
      id: "cat-5",
      name: "تنقلات و چیپس",
      description: "چیپس، پفک، پاپ کورن، بادام زمینی روکش‌دار",
      icon: "Flame",
      color: "#ef4444",
    },
    {
      id: "cat-6",
      name: "نوشیدنی و دمنوش",
      description: "چای اعلا، زعفران، دمنوش گیاهی و هل",
      icon: "Coffee",
      color: "#06b6d4",
    },
  ];

  const products: Product[] = [];

  const customers: Customer[] = [
    {
      id: "cust-1",
      name: "مشتری عمومی (حضوری)",
      phone: "۰۹۰۰۰۰۰۰۰۰۰",
      address: "خرید حضوری در فروشگاه",
      description: "مشتریان گذری",
      totalPurchases: 0,
      totalSpent: 0,
      createdAt: now,
    },
  ];

  const suppliers: Supplier[] = [];

  // Initial stock movements for realistic ledger tracking
  const stockMovements: StockMovement[] = products.map((prod, idx) => ({
    id: `sm-init-${idx + 1}`,
    productId: prod.id,
    productName: prod.name,
    type: "INITIAL_STOCK",
    quantity: prod.stock,
    previousStock: 0,
    newStock: prod.stock,
    userId: "u-admin-1",
    userName: "هادی جهانتیغ (مدیر فروشگاه)",
    notes: "ثبت موجودی اولیه انبار فروشگاه",
    createdAt: new Date(Date.now() - 15 * 24 * 3600 * 1000).toISOString(),
  }));

  // Initial sample sales for analytics
  const pastDate1 = new Date(Date.now() - 2 * 24 * 3600 * 1000).toISOString();
  const pastDate2 = new Date(Date.now() - 1 * 24 * 3600 * 1000).toISOString();

  const sales: Sale[] = [];

  const purchases: Purchase[] = [];

  const expenses: Expense[] = [];

  const cheques: Cheque[] = [];

  const customerTransactions: CustomerTransaction[] = [];

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
        const fileContent = fs.readFileSync(DB_FILE, "utf-8");
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
          counters: parsed.counters || {
            invoice: 1001,
            purchase: 5001,
            barcode: 200000000001,
          },
        };
      }
    } catch (e) {
      console.error("Failed to load database file, generating seed data:", e);
    }

    const initial = getInitialSeedData();
    this.saveData(initial);
    return initial;
  }

  private saveData(dataToSave: DatabaseSchema = this.data): void {
    try {
      fs.writeFileSync(DB_FILE, JSON.stringify(dataToSave, null, 2), "utf-8");
    } catch (e) {
      console.error("Failed to write database file:", e);
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
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const filename = `backup-${timestamp}.json`;
    const backupPath = path.join(BACKUP_DIR, filename);

    const snapshot = JSON.stringify(this.data, null, 2);
    fs.writeFileSync(backupPath, snapshot, "utf-8");
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

    const fileContent = fs.readFileSync(backupPath, "utf-8");
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
      counters: parsed.counters || {
        invoice: 1001,
        purchase: 5001,
        barcode: 200000000001,
      },
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
          console.error("Error deleting old backup file:", e);
        }
      } else {
        remainingBackups.push(b);
      }
    }
    this.data.backups = remainingBackups;
  }

  private runDailyBackupCheck(): void {
    // If no backup exists for today, take one
    const today = new Date().toISOString().split("T")[0];
    const hasTodayBackup = this.data.backups.some((b) =>
      b.createdAt.startsWith(today),
    );
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
