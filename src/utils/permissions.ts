import { Permission, RoleDefinition } from '../types';

export interface PermissionGroup {
  id: string;
  name: string;
  description: string;
  permissions: {
    key: Permission;
    label: string;
    description: string;
    adminOnly?: boolean;
  }[];
}

export const PERMISSION_GROUPS: PermissionGroup[] = [
  {
    id: 'pos_sales',
    name: 'صندوق و فروش (POS)',
    description: 'عملیات ثبت فاکتور، صدور رسید، تخفیفات و مشاهده فروش',
    permissions: [
      {
        key: 'POS_ACCESS',
        label: 'دسترسی به صندوق فروش (POS)',
        description: 'امکان ورود به صفحه صندوق، انتخاب کالا و صدور فاکتور',
      },
      {
        key: 'SALES_VIEW',
        label: 'مشاهده سوابق و فاکتورهای فروش',
        description: 'دسترسی به آرشیو فاکتورها، چاپ مجدد و جزئیات اقلام',
      },
      {
        key: 'SALES_DISCOUNT',
        label: 'اعمال تخفیف در فاکتور',
        description: 'مجوز ثبت تخفیف نقدی یا درصدی برای خریدار در صندوق',
      },
      {
        key: 'SALES_CANCEL',
        label: 'ابطال و مرجوعی فاکتور فروش',
        description: 'امکان لغو فاکتور و بازگرداندن اقلام به موجودی انبار',
      },
    ],
  },
  {
    id: 'products_pricing',
    name: 'کالاها و قیمت‌گذاری',
    description: 'تعریف محصولات، تغییر قیمت، بارکد، دسته‌بندی و عکس کالا',
    permissions: [
      {
        key: 'PRODUCT_VIEW',
        label: 'مشاهده لیست کالاها و کاتالوگ',
        description: 'دیدن فهرست محصولات، موجودی و قیمت فروش',
      },
      {
        key: 'PRODUCT_CREATE',
        label: 'افزودن کالای جدید',
        description: 'ثبت محصول جدید در سامانه همراه با تصویر و مشخصات',
      },
      {
        key: 'PRODUCT_EDIT',
        label: 'ویرایش مشخصات، قیمت و عکس کالا',
        description: 'تغییر قیمت فروش، بارکد، نام و تصویر محصول',
      },
      {
        key: 'PRODUCT_DELETE',
        label: 'حذف کالا از سیستم',
        description: 'غیرفعال‌سازی یا حذف دائمی کالا از پایگاه داده',
      },
      {
        key: 'PURCHASE_PRICE_VIEW',
        label: 'مشاهده قیمت خرید (قیمت تمام‌شده)',
        description: 'دیدن قیمت خرید خام کالاها و حاشیه سود هر محصول',
      },
      {
        key: 'CATEGORIES_MANAGE',
        label: 'مدیریت دسته‌بندی‌ها',
        description: 'تعریف، ویرایش و حذف گروه‌بندی‌های محصولات',
      },
      {
        key: 'BARCODE_PRINT',
        label: 'چاپ اتیکت قفسه و بارکد',
        description: 'طراحی و چاپ برچسب‌های بارکدخوان و اتیکت‌های قیمت قفسه',
      },
    ],
  },
  {
    id: 'inventory_purchases',
    name: 'انبارداری و تامین کالا',
    description: 'گردش انبار، انبارگردانی، فاکتورهای خرید از باغدار و بنکدار',
    permissions: [
      {
        key: 'INVENTORY_VIEW',
        label: 'مشاهده کاردکس و موجودی انبار',
        description: 'دیدن موجودی، هشدارهای کسری کالا و تاریخچه گردش کالا',
      },
      {
        key: 'INVENTORY_ADJUST',
        label: 'انبارگردانی و اصلاح دستی موجودی',
        description: 'امکان ثبت کسری، سرک بار و تنظیم مجدد تعداد/وزن',
      },
      {
        key: 'PURCHASES_MANAGE',
        label: 'ثبت و مدیریت فاکتورهای خرید',
        description: 'ورود بار جدید، افزایش موجودی انبار و ثبت بدهی به تامین‌کننده',
      },
      {
        key: 'SUPPLIERS_MANAGE',
        label: 'مدیریت تامین‌کنندگان و باغداران',
        description: 'مشاهده و ویرایش طرف‌حساب‌های خرید و حساب‌های بستانکاری',
      },
    ],
  },
  {
    id: 'accounting_customers',
    name: 'حسابداری، چک‌ها و مشتریان',
    description: 'هزینه‌ها، چک‌های دریافتی/پرداختی، سررسید و حساب‌های دفتری',
    permissions: [
      {
        key: 'ACCOUNTING_MANAGE',
        label: 'مدیریت هزینه‌ها و چک‌ها',
        description: 'ثبت هزینه‌های جاری فروشگاه، چک‌های مشتریان و سررسید',
      },
      {
        key: 'CUSTOMERS_MANAGE',
        label: 'مدیریت مشتریان و حساب دفتری',
        description: 'تعریف مشتری، تعیین سقف نسیه و ثبت تسویه حساب',
      },
    ],
  },
  {
    id: 'reports_analytics',
    name: 'گزارشات و داشبورد مدیریتی',
    description: 'تحلیل فروش، آمار سود خالص، نمودارها و شاخص‌های مالی',
    permissions: [
      {
        key: 'DASHBOARD_VIEW',
        label: 'مشاهده داشبورد مدیریتی',
        description: 'دیدن آمار سریع روزانه، مبالغ دخل و نمودارهای کلیدی',
      },
      {
        key: 'REPORTS_VIEW',
        label: 'گزارش‌های جامع مالی و عملکرد',
        description: 'گزارش فروش، دوره‌ای، استخراج اکسل و تفکیک عملکرد',
      },
      {
        key: 'PROFIT_VIEW',
        label: 'مشاهده سود و زیان خالص',
        description: 'دسترسی به نمودارها و ستون‌های سود خالص و درصدی',
      },
    ],
  },
  {
    id: 'system_admin',
    name: 'سیستم، کاربران و امنیت',
    description: 'تعریف پرسنل، کنترل نقش‌ها، پشتیبان‌گیری و تنظیمات کلی',
    permissions: [
      {
        key: 'USERS_MANAGE',
        label: 'مدیریت کاربران، نقش‌ها و دسترسی‌ها',
        description: 'تعریف نقش‌های اختصاصی، تعیین مجوزها، ایجاد کاربر و رمز عبور (فقط مدیر کل)',
        adminOnly: true,
      },
      {
        key: 'SETTINGS_MANAGE',
        label: 'تنظیمات فروشگاه، پوز و چاپگر',
        description: 'پیکربندی واحد پولی، کارتخوان بانکی، فیش‌پرینتر و اطلاعات فروشگاه',
        adminOnly: true,
      },
      {
        key: 'BACKUP_MANAGE',
        label: 'پشتیبان‌گیری و بازیابی پایگاه داده',
        description: 'دانلود نسخه پشتیبان، بازیابی فایل بک‌آپ و تنظیمات خودکار',
        adminOnly: true,
      },
    ],
  },
];

export const ALL_PERMISSIONS: Permission[] = PERMISSION_GROUPS.flatMap((g) =>
  g.permissions.map((p) => p.key)
);

export const DEFAULT_SYSTEM_ROLES: RoleDefinition[] = [
  {
    id: 'ADMIN',
    name: 'مدیر کل سیستم',
    description: 'دسترسی نامحدود و کامل به تمام بخش‌ها، سود خالص، انبار، تنظیمات و مدیریت دسترسی‌ها',
    isSystem: true,
    color: 'amber',
    permissions: [...ALL_PERMISSIONS],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'SELLER',
    name: 'صندوق‌دار (فروشنده)',
    description: 'دسترسی به صندوق فروش، ثبت فاکتور، اعمال تخفیف، بارکدخوان و جستجوی کالاها',
    isSystem: true,
    color: 'blue',
    permissions: [
      'POS_ACCESS',
      'SALES_VIEW',
      'SALES_DISCOUNT',
      'PRODUCT_VIEW',
      'INVENTORY_VIEW',
      'CUSTOMERS_MANAGE',
      'BARCODE_PRINT',
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'ACCOUNTANT',
    name: 'حسابدار و امور مالی',
    description: 'مدیریت چک‌ها، هزینه‌های جاری، مانده دفتری مشتریان، تامین‌کنندگان و گزارش سود و زیان',
    isSystem: false,
    color: 'purple',
    permissions: [
      'DASHBOARD_VIEW',
      'SALES_VIEW',
      'PURCHASE_PRICE_VIEW',
      'ACCOUNTING_MANAGE',
      'CUSTOMERS_MANAGE',
      'SUPPLIERS_MANAGE',
      'REPORTS_VIEW',
      'PROFIT_VIEW',
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'STOCK_KEEPER',
    name: 'مسئول انبار و تدارکات',
    description: 'کنترل موجودی کالاها، انبارگردانی، ثبت فاکتورهای ورود بار، دسته‌بندی و چاپ بارکد',
    isSystem: false,
    color: 'emerald',
    permissions: [
      'PRODUCT_VIEW',
      'PRODUCT_CREATE',
      'PRODUCT_EDIT',
      'INVENTORY_VIEW',
      'INVENTORY_ADJUST',
      'PURCHASES_MANAGE',
      'SUPPLIERS_MANAGE',
      'CATEGORIES_MANAGE',
      'BARCODE_PRINT',
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

export function getRoleBadgeColor(color?: string) {
  switch (color) {
    case 'amber':
      return {
        bg: 'bg-amber-500/10',
        text: 'text-amber-400',
        border: 'border-amber-500/20',
        glow: 'shadow-amber-500/20',
        solidBg: 'bg-amber-500',
      };
    case 'blue':
      return {
        bg: 'bg-blue-500/10',
        text: 'text-blue-400',
        border: 'border-blue-500/20',
        glow: 'shadow-blue-500/20',
        solidBg: 'bg-blue-500',
      };
    case 'purple':
      return {
        bg: 'bg-purple-500/10',
        text: 'text-purple-400',
        border: 'border-purple-500/20',
        glow: 'shadow-purple-500/20',
        solidBg: 'bg-purple-500',
      };
    case 'emerald':
      return {
        bg: 'bg-emerald-500/10',
        text: 'text-emerald-400',
        border: 'border-emerald-500/20',
        glow: 'shadow-emerald-500/20',
        solidBg: 'bg-emerald-500',
      };
    case 'rose':
      return {
        bg: 'bg-rose-500/10',
        text: 'text-rose-400',
        border: 'border-rose-500/20',
        glow: 'shadow-rose-500/20',
        solidBg: 'bg-rose-500',
      };
    case 'cyan':
      return {
        bg: 'bg-cyan-500/10',
        text: 'text-cyan-400',
        border: 'border-cyan-500/20',
        glow: 'shadow-cyan-500/20',
        solidBg: 'bg-cyan-500',
      };
    default:
      return {
        bg: 'bg-amber-500/10',
        text: 'text-amber-400',
        border: 'border-amber-500/20',
        glow: 'shadow-amber-500/20',
        solidBg: 'bg-amber-500',
      };
  }
}
