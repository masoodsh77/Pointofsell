import React, { useState, useEffect, useRef, useMemo } from 'react';
import { TabType } from './Sidebar';
import { useAuth } from '../../context/AuthContext';
import { useCurrency } from '../../context/CurrencyContext';
import {
  Search,
  X,
  ArrowRight,
  CornerDownLeft,
  Settings,
  Coins,
  ShoppingCart,
  Receipt,
  Package,
  Layers,
  Boxes,
  Truck,
  Calculator,
  Users,
  Building2,
  BarChart3,
  Barcode,
  UserCog,
  DatabaseBackup,
  LayoutDashboard,
  Palette,
  CreditCard,
  Printer,
  Sparkles,
  ChevronLeft,
  Check,
} from 'lucide-react';

export interface SearchItem {
  id: string;
  title: string;
  category: string;
  categoryType: 'operations' | 'products' | 'accounting' | 'admin' | 'settings';
  description: string;
  path: string;
  tab: TabType;
  sectionId?: string;
  keywords: string[];
  icon: React.ComponentType<{ className?: string }>;
  adminOnly?: boolean;
  isCurrencyAction?: boolean;
}

interface NavigationSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (tab: TabType, sectionId?: string) => void;
  onOpenThemeModal?: () => void;
}

export const NavigationSearchModal: React.FC<NavigationSearchModalProps> = ({
  isOpen,
  onClose,
  onNavigate,
  onOpenThemeModal,
}) => {
  const { isAdmin } = useAuth();
  const { currency, setCurrency, isRial } = useCurrency();
  const [query, setQuery] = useState<string>('');
  const [selectedIndex, setSelectedIndex] = useState<number>(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // Normalize Persian strings for fault-tolerant search
  const normalizePersian = (text: string): string => {
    return text
      .toLowerCase()
      .replace(/[\u200c\u200b\u200e\u200f]/g, ' ') // Remove zero-width spaces
      .replace(/[ي]/g, 'ی')
      .replace(/[ك]/g, 'ک')
      .replace(/[ة]/g, 'ه')
      .replace(/[آأإ]/g, 'ا')
      .replace(/[\u064B-\u065F]/g, '') // Remove diacritics
      .trim();
  };

  // Master Navigation & Features Catalog
  const allItems: SearchItem[] = useMemo(() => [
    // 1. Currency Unit (Exact user query match!)
    {
      id: 'currency-setting',
      title: 'تغییر واحد پولی فروشگاه (تومان / ریال)',
      category: 'تنظیمات و مالی',
      categoryType: 'settings',
      description: 'تنظیمات واحد پول: سوئیچ بین تومان و ریال با محاسبه ۱۰ برابری (مثال: ۲,۰۰۰ تومان = ۲۰,۰۰۰ ریال)',
      path: 'تنظیمات > واحد پولی فروشگاه',
      tab: 'settings',
      sectionId: 'currency-settings-section',
      keywords: [
        'واحد پولی',
        'واحد پول',
        'تغییر واحد پول',
        'تغییر واحد پولی',
        'تومان',
        'ریال',
        'تومان به ریال',
        'ریال به تومان',
        'نرخ ارز',
        'تبدیل قیمت',
        'صفر بیشتر',
        'ارز',
        'واحد',
        'پول',
        'قیمت گذاری',
        'currency',
        'rial',
        'toman',
        'از کجا میتونم واحد پولی رو تغییر بدم',
        'کجا واحد پول را تغییر بدم',
      ],
      icon: Coins,
      adminOnly: true,
      isCurrencyAction: true,
    },

    // 2. Settings Items
    {
      id: 'settings-pos',
      title: 'پیکربندی اتصال به کارتخوان بانکی (PC-POS)',
      category: 'تنظیمات سخت‌افزاری',
      categoryType: 'settings',
      description: 'تنظیمات IP، پورت و شرکت ارائه‌دهنده دستگاه کارتخوان (به‌پرداخت، سامان‌کیش، آپ، ایران‌کیش)',
      path: 'تنظیمات > پیکربندی کارت‌خوان PC-POS',
      tab: 'settings',
      sectionId: 'pos-settings-section',
      keywords: ['کارتخوان', 'دستگاه پوز', 'پوز', 'pc-pos', 'pos', 'به پرداخت', 'سامان کیش', 'بانک', 'دستگاه کارت خوان', 'ترمینال'],
      icon: CreditCard,
      adminOnly: true,
    },
    {
      id: 'settings-receipt',
      title: 'قالب چاپ فاکتور و پانویس فیش مشتری',
      category: 'تنظیمات چاپ',
      categoryType: 'settings',
      description: 'انتخاب سایز کاغذ حرارتی (۸۰mm، ۵۸mm، طرح QR، فاکتور A5) و تغییر متن پیام تشکر پانویس',
      path: 'تنظیمات > قالب چاپ فاکتور و رسید',
      tab: 'settings',
      sectionId: 'receipt-settings-section',
      keywords: ['فیش پرینتر', 'قالب فاکتور', 'پانویس', 'پرینت فاکتور', 'حرارتی', '۸۰ میلی متر', '۵۸ میلی متر', 'رسید', 'چاپگر'],
      icon: Printer,
      adminOnly: true,
    },
    {
      id: 'settings-theme',
      title: 'شخصی‌سازی رنگ و تم نرم‌افزار',
      category: 'تنظیمات ظاهری',
      categoryType: 'settings',
      description: 'تغییر رنگ سازمانی (زعفرانی، پسته، لاجوردی و...) و انتخاب قلم فارسی (وزیرمتن، شبنم، دانا، ساحل)',
      path: 'تنظیمات > شخصی‌سازی تم و قلم',
      tab: 'settings',
      sectionId: 'theme-settings-section',
      keywords: ['تم', 'رنگ', 'فونت', 'قلم', 'پوسته', 'ظاهر', 'شخصی سازی', 'وزیر', 'شبنم', 'دانا', 'ساحل', 'رنگ سازمانی'],
      icon: Palette,
      adminOnly: true,
    },
    {
      id: 'settings-identity',
      title: 'مشخصات، تلفن و آدرس فروشگاه',
      category: 'تنظیمات پایه',
      categoryType: 'settings',
      description: 'ویرایش نام فروشگاه، شماره‌های تماس ثابت و همراه، و آدرس جهت چاپ در بالای فاکتورها',
      path: 'تنظیمات > هویت و مشخصات فروشگاه',
      tab: 'settings',
      sectionId: 'store-identity-section',
      keywords: ['مشخصات فروشگاه', 'نام فروشگاه', 'تلفن فروشگاه', 'آدرس فروشگاه', 'سربرگ', 'لوگو'],
      icon: Settings,
      adminOnly: true,
    },
    {
      id: 'settings-backup-auto',
      title: 'تنظیمات پشتیبان‌گیری خودکار روزانه',
      category: 'تنظیمات پشتیبان',
      categoryType: 'settings',
      description: 'فعال‌سازی ذخیره‌سازی خودکار اطلاعات و تعیین مدت نگهداری نسخه‌ها',
      path: 'تنظیمات > پشتیبان‌گیری خودکار',
      tab: 'settings',
      sectionId: 'backup-settings-section',
      keywords: ['بک آپ خودکار', 'پشتیبان گیری خودکار', 'ذخیره خودکار'],
      icon: DatabaseBackup,
      adminOnly: true,
    },

    // 3. POS & Sales Operations
    {
      id: 'nav-pos',
      title: 'صندوق فروشگاهی (POS) - صدور فاکتور جدید',
      category: 'عملیات فروشگاه',
      categoryType: 'operations',
      description: 'ثبت فروش سریع، اسکن بارکد، اتصال به ترازو، تسویه نقدی و ارسال خودکار مبلغ به کارت‌خوان',
      path: 'صندوق فروش (POS)',
      tab: 'pos',
      keywords: ['صندوق', 'فروش', 'فاکتور جدید', 'صدور فاکتور', 'فروش سریع', 'اسکنر بارکد', 'ترازو', 'کارت', 'نقد', 'pos'],
      icon: ShoppingCart,
    },
    {
      id: 'nav-sales',
      title: 'سوابق فاکتورها و تاریخچه فروش',
      category: 'عملیات فروشگاه',
      categoryType: 'operations',
      description: 'مشاهده لیست تمام فاکتورهای صادرشده، چاپ مجدد رسید، لغو و ابطال فاکتور و جستجو بر اساس شماره',
      path: 'فاکتورها و سوابق فروش',
      tab: 'sales',
      keywords: ['فاکتورها', 'سوابق فروش', 'تاریخچه فاکتورها', 'چاپ مجدد', 'ابطال فاکتور', 'رسیدهای قبلی'],
      icon: Receipt,
    },
    {
      id: 'nav-customers',
      title: 'مشتریان، حساب دفتری و نسیه',
      category: 'عملیات فروشگاه',
      categoryType: 'operations',
      description: 'مدیریت اشخاص و خریداران، ثبت تسویه حساب بدهی، تعیین سقف اعتبار نسیه و درصد تخفیف اختصاصی',
      path: 'مشتریان و حساب دفتری',
      tab: 'customers',
      keywords: ['مشتریان', 'حساب دفتری', 'نسیه', 'بدهکاران', 'بستانکاران', 'تراز مشتری', 'طلب', 'بدهی', 'اعتبار'],
      icon: Users,
    },

    // 4. Products & Inventory
    {
      id: 'nav-products',
      title: 'مدیریت کالاها و قیمت‌گذاری',
      category: 'کالاها و انبار',
      categoryType: 'products',
      description: 'تعریف محصول جدید، ویرایش قیمت خرید و فروش، تعیین نقطه سفارش، تخصیص بارکد و واحد وزنی (کیلوگرم/گرم)',
      path: 'مدیریت کالاها و قیمت',
      tab: 'products',
      keywords: ['کالاها', 'محصولات', 'تعریف کالا', 'افزودن محصول', 'قیمت فروش', 'قیمت خرید', 'بارکد کالا', 'پسته', 'خشکبار'],
      icon: Package,
      adminOnly: true,
    },
    {
      id: 'nav-bulk-price',
      title: 'تغییر گروهی و درصدی قیمت کالاها',
      category: 'کالاها و انبار',
      categoryType: 'products',
      description: 'افزایش یا کاهش درصدی و مبلغی قیمت دسته‌ای از اقلام، رُند کردن خودکار به مبالغ هزار تومانی',
      path: 'مدیریت کالاها > تغییر دسته‌جمعی قیمت‌ها',
      tab: 'products',
      keywords: ['تغییر گروهی قیمت', 'افزایش قیمت', 'درصد تغییر قیمت', 'رند کردن قیمت', 'گرانی', 'تخفیف گروهی'],
      icon: Package,
      adminOnly: true,
    },
    {
      id: 'nav-categories',
      title: 'دسته‌بندی محصولات (پسته، بادام، زعفران و...)',
      category: 'کالاها و انبار',
      categoryType: 'products',
      description: 'ایجاد و ویرایش گروه‌بندی کالاها همراه با رنگ‌بندی و آیکون اختصاصی جهت دسته‌بندی سریع در صندوق',
      path: 'دسته‌بندی‌ها',
      tab: 'categories',
      keywords: ['دسته بندی', 'گروه کالا', 'دسته ها', 'گروه بندی', 'دسته بندی محصولات'],
      icon: Layers,
      adminOnly: true,
    },
    {
      id: 'nav-inventory',
      title: 'انبارداری، موجودی و هشدار کسری کالا',
      category: 'کالاها و انبار',
      categoryType: 'products',
      description: 'گزارش موجودی لحظه‌ای انبار، کالاهای زیر نقطه سفارش (کم‌موجودی)، اصلاح و انبارگردانی',
      path: 'انبار و موجودی کالا',
      tab: 'inventory',
      keywords: ['انبار', 'موجودی', 'کسری کالا', 'کم موجودی', 'انبارگردانی', 'موجودی منفی', 'کاردکس'],
      icon: Boxes,
    },
    {
      id: 'nav-barcode',
      title: 'تولید بارکد، چاپ لیبل و اتیکت قفسه',
      category: 'کالاها و انبار',
      categoryType: 'products',
      description: 'طراحی و چاپ بارکد استاندارد روی لیبل‌پرینتر حرارتی، چاپ اتیکت‌های بزرگ قیمت روی قفسه خشکبار',
      path: 'چاپ و تولید بارکد',
      tab: 'barcode',
      keywords: ['بارکد', 'چاپ بارکد', 'اتیکت قیمت', 'لیبل', 'اتیکت قفسه', 'پرینت بارکد', 'بارکدخوان'],
      icon: Barcode,
    },

    // 5. Purchases & Suppliers
    {
      id: 'nav-purchases',
      title: 'فاکتورهای خرید عمده (ورود کالا از باغدار)',
      category: 'خرید و تامین',
      categoryType: 'accounting',
      description: 'ثبت فاکتورهای خرید، افزایش خودکار موجودی انبار، محاسبه قیمت تمام‌شده و تسویه نقدی/چکی با فروشنده',
      path: 'فاکتورهای خرید (ورود کالا)',
      tab: 'purchases',
      keywords: ['خرید', 'فاکتور خرید', 'ورود کالا', 'خرید عمده', 'خرید از باغدار', 'رسید انبار'],
      icon: Truck,
      adminOnly: true,
    },
    {
      id: 'nav-suppliers',
      title: 'تامین‌کنندگان و باغداران',
      category: 'خرید و تامین',
      categoryType: 'accounting',
      description: 'ثبت مشخصات باغداران و توزیع‌کنندگان خشکبار، پیگیری مطالبات و تراز مالی حساب‌های بستانکاری',
      path: 'تامین‌کنندگان و باغداران',
      tab: 'suppliers',
      keywords: ['تامین کنندگان', 'باغدار', 'باغداران', 'حساب تامین کننده', 'طلب باغدار', 'خرید پسته'],
      icon: Building2,
      adminOnly: true,
    },

    // 6. Accounting & Reports
    {
      id: 'nav-accounting',
      title: 'حسابداری، ثبت هزینه‌ها و سررسید چک‌ها',
      category: 'حسابداری و مالی',
      categoryType: 'accounting',
      description: 'ثبت هزینه‌های جاری مغازه (اجاره، قبوض، بسته‌بندی)، چک‌های صیادی دریافتی و پرداختی و یادآور موعد وصول',
      path: 'حسابداری و سررسید چک',
      tab: 'accounting',
      keywords: ['حسابداری', 'هزینه ها', 'چک', 'سررسید چک', 'چک صیادی', 'چک دریافتی', 'چک پرداختی', 'مخارج'],
      icon: Calculator,
      adminOnly: true,
    },
    {
      id: 'nav-reports',
      title: 'گزارش سود و زیان جامع و نمودارهای مالی',
      category: 'گزارشات و تحلیل',
      categoryType: 'accounting',
      description: 'گزارش خالص سود، درآمد کل، پرفروش‌ترین کالاها در بازه‌های زمانی مختلف و خروجی رسمی اکسل',
      path: 'گزارش سود و زیان جامع',
      tab: 'reports',
      keywords: ['گزارش', 'سود و زیان', 'سود خالص', 'گزارش فروش', 'نمودار فروش', 'اکسل', 'تحلیل مالی'],
      icon: BarChart3,
      adminOnly: true,
    },
    {
      id: 'nav-dashboard',
      title: 'داشبورد مدیریتی و آمار لحظه‌ای',
      category: 'گزارشات و تحلیل',
      categoryType: 'admin',
      description: 'مشاهده شاخص‌های کلیدی عملکرد، جمع فروش امروز، سود روزانه، هفتگی و ماهانه فروشگاه',
      path: 'داشبورد مدیریتی',
      tab: 'dashboard',
      keywords: ['داشبورد', 'آمار فروش', 'فروش امروز', 'سود امروز', 'نمای کلی'],
      icon: LayoutDashboard,
      adminOnly: true,
    },

    // 7. Users & Security & Backup
    {
      id: 'nav-users',
      title: 'مدیریت کاربران، صندوق‌داران و دسترسی‌ها',
      category: 'مدیریت و امنیت',
      categoryType: 'admin',
      description: 'افزودن حساب کاربری برای صندوق‌داران، تغییر رمز عبور و تفکیک سطح دسترسی',
      path: 'مدیریت کاربران و دسترسی',
      tab: 'users',
      keywords: ['کاربران', 'صندوق دار', 'کاربر جدید', 'رمز عبور', 'دسترسی ها', 'امنیت'],
      icon: UserCog,
      adminOnly: true,
    },
    {
      id: 'nav-backup',
      title: 'پشتیبان‌گیری دستی و بازیابی اطلاعات (Backup & Restore)',
      category: 'مدیریت و امنیت',
      categoryType: 'admin',
      description: 'دانلود فایل نسخه پشتیبان دیتابیس روی کامپیوتر یا فلش و بازیابی آنی فایل‌های پشتیبان قبلی',
      path: 'پشتیبان‌گیری و بازیابی',
      tab: 'backup',
      keywords: ['پشتیبان گیری', 'بک آپ', 'دانلود دیتا', 'بازیابی اطلاعات', 'ریستور', 'backup'],
      icon: DatabaseBackup,
      adminOnly: true,
    },
  ], []);

  // Filter items based on user role and query
  const filteredItems = useMemo(() => {
    // Role filter
    const roleAllowed = allItems.filter((item) => (isAdmin ? true : !item.adminOnly));

    if (!query.trim()) {
      return roleAllowed.slice(0, 10);
    }

    const cleanQuery = normalizePersian(query);
    const queryWords = cleanQuery.split(/\s+/).filter(Boolean);

    // Stopwords filter for conversational questions like: "از کجا میتونم واحد پولی رو تغییر بدم"
    const stopWords = ['از', 'کجا', 'کجاست', 'میتونم', 'میتوانم', 'میخوام', 'میخواهم', 'رو', 'را', 'بدم', 'کنم', 'چطور', 'چگونه', 'در'];
    const meaningfulWords = queryWords.filter((w) => !stopWords.includes(w));
    const searchTerms = meaningfulWords.length > 0 ? meaningfulWords : queryWords;

    const scored = roleAllowed
      .map((item) => {
        let score = 0;
        const normTitle = normalizePersian(item.title);
        const normDesc = normalizePersian(item.description);
        const normPath = normalizePersian(item.path);
        const normKeywords = item.keywords.map(normalizePersian);

        // Exact match with full query
        if (normTitle.includes(cleanQuery)) score += 50;
        if (normKeywords.some((k) => k.includes(cleanQuery) || cleanQuery.includes(k))) score += 40;
        if (normDesc.includes(cleanQuery)) score += 20;

        // Individual word matches
        for (const word of searchTerms) {
          if (normTitle.includes(word)) score += 25;
          if (normKeywords.some((k) => k.includes(word))) score += 20;
          if (normDesc.includes(word)) score += 10;
          if (normPath.includes(word)) score += 15;
        }

        return { item, score };
      })
      .filter((entry) => entry.score > 0)
      .sort((a, b) => b.score - a.score)
      .map((entry) => entry.item);

    return scored;
  }, [allItems, isAdmin, query]);

  // Reset selected index when results change
  useEffect(() => {
    setSelectedIndex(0);
  }, [filteredItems]);

  // Auto-focus input when modal opens
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        inputRef.current?.focus();
        inputRef.current?.select();
      }, 50);
    } else {
      setQuery('');
    }
  }, [isOpen]);

  // Handle Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev < filteredItems.length - 1 ? prev + 1 : prev));
      scrollSelectedIntoView(selectedIndex + 1);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev > 0 ? prev - 1 : 0));
      scrollSelectedIntoView(selectedIndex - 1);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filteredItems[selectedIndex]) {
        executeItem(filteredItems[selectedIndex]);
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      onClose();
    }
  };

  const scrollSelectedIntoView = (index: number) => {
    if (!listRef.current) return;
    const elements = listRef.current.querySelectorAll('[data-search-item]');
    if (elements[index]) {
      (elements[index] as HTMLElement).scrollIntoView({ block: 'nearest' });
    }
  };

  const executeItem = (item: SearchItem) => {
    if (item.id === 'settings-theme' && onOpenThemeModal) {
      onOpenThemeModal();
      onClose();
      return;
    }

    onNavigate(item.tab, item.sectionId);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-14 sm:pt-20 px-3 bg-black/80 backdrop-blur-md animate-fadeIn"
      onClick={onClose}
      dir="rtl"
    >
      <div
        className="w-full max-w-2xl bg-[#121212] border border-white/10 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh] transition-all transform animate-scaleUp"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Input Bar */}
        <div className="relative flex items-center px-4 py-3.5 border-b border-white/10 bg-[#161616]">
          <Search className="w-5 h-5 text-amber-400 shrink-0 ml-3" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="مثال: تغییر واحد پول، تنظیمات کارتخوان، ثبت محصول، انبار..."
            className="flex-1 bg-transparent text-sm text-white placeholder-slate-400 focus:outline-hidden"
          />

          {query && (
            <button
              type="button"
              onClick={() => {
                setQuery('');
                inputRef.current?.focus();
              }}
              className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors ml-2 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          )}

          <div className="flex items-center gap-1 text-[10px] text-slate-400 bg-white/5 border border-white/10 px-2 py-1 rounded-lg select-none mr-2">
            <span>Esc</span>
          </div>
        </div>

        {/* Quick Suggestion Chips */}
        <div className="px-4 py-2 bg-black/30 border-b border-white/5 flex items-center gap-2 overflow-x-auto text-[11px] scrollbar-none">
          <span className="text-slate-400 shrink-0 font-medium">پیشنهاد سریع:</span>
          {[
            { label: 'تغییر واحد پول (تومان / ریال)', q: 'واحد پولی' },
            { label: 'کارتخوان بانکی', q: 'کارتخوان' },
            { label: 'افزودن کالا', q: 'کالا' },
            { label: 'صندوق فروش', q: 'صندوق' },
            { label: 'موجودی انبار', q: 'انبار' },
            { label: 'تغییر رنگ و تم', q: 'تم' },
          ].map((chip) => (
            <button
              key={chip.q}
              type="button"
              onClick={() => {
                setQuery(chip.q);
                inputRef.current?.focus();
              }}
              className="px-2.5 py-1 bg-white/5 hover:bg-amber-500/20 hover:text-amber-300 text-slate-300 border border-white/5 hover:border-amber-500/30 rounded-xl whitespace-nowrap transition-colors cursor-pointer shrink-0"
            >
              {chip.label}
            </button>
          ))}
        </div>

        {/* Search Results List */}
        <div ref={listRef} className="flex-1 overflow-y-auto p-2.5 space-y-1.5 min-h-[220px]">
          {filteredItems.length === 0 ? (
            <div className="py-12 text-center text-slate-400 space-y-2">
              <Search className="w-10 h-10 text-slate-600 mx-auto" />
              <div className="text-sm font-bold text-slate-300">موردی برای جستجوی شما یافت نشد</div>
              <div className="text-xs text-slate-500">
                عبارت دیگری مانند «واحد پول»، «محصول»، «صندوق» یا «تنظیمات» را جستجو کنید.
              </div>
            </div>
          ) : (
            filteredItems.map((item, index) => {
              const isSelected = index === selectedIndex;
              const Icon = item.icon;

              return (
                <div
                  key={item.id}
                  data-search-item
                  onClick={() => executeItem(item)}
                  onMouseEnter={() => setSelectedIndex(index)}
                  className={`p-3 rounded-2xl border transition-all cursor-pointer flex flex-col gap-1.5 ${
                    isSelected
                      ? 'bg-amber-500/10 border-amber-500/40 shadow-lg shadow-amber-500/5'
                      : 'bg-white/5 border-white/5 hover:bg-white/10 hover:border-white/10 text-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div
                        className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                          isSelected
                            ? 'bg-amber-500 text-slate-950 font-bold'
                            : 'bg-white/10 text-amber-400 border border-white/10'
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className={`text-xs font-bold ${isSelected ? 'text-white' : 'text-slate-100'}`}>
                            {item.title}
                          </span>
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-slate-400">
                            {item.category}
                          </span>
                        </div>
                        <div className="text-[10.5px] text-amber-400/80 font-medium truncate mt-0.5">
                          {item.path}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      {isSelected && (
                        <span className="text-[10px] text-amber-300 bg-amber-500/20 border border-amber-500/30 px-2 py-0.5 rounded-md flex items-center gap-1">
                          <span>انتخاب</span>
                          <CornerDownLeft className="w-3 h-3" />
                        </span>
                      )}
                      <ChevronLeft className={`w-4 h-4 transition-transform ${isSelected ? 'text-amber-400 translate-x-1' : 'text-slate-500'}`} />
                    </div>
                  </div>

                  <p className="text-[11px] text-slate-400 line-clamp-2 pr-11 leading-relaxed">
                    {item.description}
                  </p>

                  {/* Special Direct Currency Switcher Action if Currency Item */}
                  {item.isCurrencyAction && (
                    <div
                      className="mt-1 pt-2 pr-11 border-t border-white/5 flex items-center gap-2 flex-wrap"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <span className="text-[11px] text-slate-300 font-bold">تغییر سریع واحد پول:</span>
                      <button
                        type="button"
                        onClick={async () => {
                          await setCurrency('تومان');
                        }}
                        className={`px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                          currency === 'تومان'
                            ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                            : 'bg-white/10 text-slate-300 hover:bg-white/15'
                        }`}
                      >
                        {currency === 'تومان' && <Check className="w-3.5 h-3.5" />}
                        <span>تومان (معمولی)</span>
                      </button>

                      <button
                        type="button"
                        onClick={async () => {
                          await setCurrency('ریال');
                        }}
                        className={`px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                          currency === 'ریال'
                            ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                            : 'bg-white/10 text-slate-300 hover:bg-white/15'
                        }`}
                      >
                        {currency === 'ریال' && <Check className="w-3.5 h-3.5" />}
                        <span>ریال (یک صفر بیشتر ۱۰x)</span>
                      </button>

                      <span className="text-[10px] text-slate-400 mr-auto font-mono">
                        فعال: {currency}
                      </span>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Footer Hints */}
        <div className="px-4 py-2.5 bg-[#161616] border-t border-white/10 flex items-center justify-between text-[11px] text-slate-400">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 bg-white/10 rounded text-[10px] text-slate-300">↑</kbd>
              <kbd className="px-1.5 py-0.5 bg-white/10 rounded text-[10px] text-slate-300">↓</kbd>
              <span>حرکت</span>
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 bg-white/10 rounded text-[10px] text-slate-300">Enter</kbd>
              <span>ورود مستقیم به بخش</span>
            </span>
          </div>
          <div className="flex items-center gap-1.5 text-amber-400 font-medium">
            <Sparkles className="w-3.5 h-3.5" />
            <span>جستجوی هوشمند منوها و دسترسی سریع</span>
          </div>
        </div>
      </div>
    </div>
  );
};
