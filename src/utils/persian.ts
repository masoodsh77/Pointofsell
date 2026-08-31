import { PaymentMethod, ProductUnit, Role, StockMovementType } from '../types';

// Convert English digits to Persian digits
export function toPersianDigits(input: string | number | undefined | null): string {
  if (input === undefined || input === null) return '';
  const str = String(input);
  const persianDigits = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
  return str.replace(/[0-9]/g, (w) => persianDigits[+w]);
}

// Format numbers with thousand commas (e.g. 850,000)
export function formatNumber(num: number | string | undefined | null, addPersianDigits = true): string {
  if (num === undefined || num === null || isNaN(Number(num))) return '۰';
  const val = Number(num);
  const formatted = val.toLocaleString('en-US', {
    maximumFractionDigits: 3,
  });
  return addPersianDigits ? toPersianDigits(formatted) : formatted;
}

// Format currency with Toman
export function formatCurrency(amount: number | undefined | null, suffix = 'تومان'): string {
  if (amount === undefined || amount === null) return `۰ ${suffix}`;
  return `${formatNumber(Math.round(amount))} ${suffix}`;
}

// Format Weight & Units
export function formatWeightOrQuantity(quantity: number, unit: ProductUnit): string {
  if (unit === 'KG') {
    if (quantity < 1) {
      const grams = Math.round(quantity * 1000);
      return `${formatNumber(grams)} گرم`;
    }
    return `${formatNumber(quantity)} کیلوگرم`;
  }
  if (unit === 'G') {
    return `${formatNumber(quantity)} گرم`;
  }
  if (unit === 'PIECE') {
    return `${formatNumber(quantity)} عدد`;
  }
  if (unit === 'PACK') {
    return `${formatNumber(quantity)} بسته`;
  }
  if (unit === 'BOX') {
    return `${formatNumber(quantity)} جعبه`;
  }
  if (unit === 'CARTON') {
    return `${formatNumber(quantity)} کارتن`;
  }
  return `${formatNumber(quantity)} ${getUnitLabel(unit)}`;
}

// Translate Product Units
export function getUnitLabel(unit: ProductUnit): string {
  switch (unit) {
    case 'KG':
      return 'کیلوگرم';
    case 'G':
      return 'گرم';
    case 'PIECE':
      return 'عدد';
    case 'PACK':
      return 'بسته';
    case 'BOX':
      return 'جعبه';
    case 'CARTON':
      return 'کارتن';
    default:
      return unit;
  }
}

// Translate Payment Methods
export function getPaymentMethodLabel(method: PaymentMethod): string {
  switch (method) {
    case 'CASH':
      return 'نقدی';
    case 'CARD':
      return 'کارت‌خوان';
    case 'SPLIT':
      return 'ترکیبی (نقد + پوز)';
    default:
      return method;
  }
}

// Translate Roles
export function getRoleLabel(role: Role): string {
  switch (role) {
    case 'ADMIN':
      return 'مدیر کل';
    case 'SELLER':
      return 'صندوق‌دار / فروشنده';
    default:
      return role;
  }
}

// Translate Stock Movement Types
export function getStockMovementLabel(type: StockMovementType): { label: string; color: string } {
  switch (type) {
    case 'PURCHASE':
      return { label: 'خرید از تامین‌کننده', color: 'text-emerald-700 bg-emerald-50 border-emerald-200' };
    case 'SALE':
      return { label: 'فروش به مشتری', color: 'text-blue-700 bg-blue-50 border-blue-200' };
    case 'SALE_CANCEL':
      return { label: 'مرجوعی / لغو فاکتور', color: 'text-rose-700 bg-rose-50 border-rose-200' };
    case 'ADJUSTMENT':
      return { label: 'اصلاح و انبارگردانی', color: 'text-amber-700 bg-amber-50 border-amber-200' };
    case 'INITIAL_STOCK':
      return { label: 'موجودی اولیه', color: 'text-purple-700 bg-purple-50 border-purple-200' };
    case 'RETURN':
      return { label: 'برگشت کالا', color: 'text-cyan-700 bg-cyan-50 border-cyan-200' };
    default:
      return { label: type, color: 'text-slate-700 bg-slate-50 border-slate-200' };
  }
}

// Convert Gregorian to Jalali (Solar Hijri)
export function gregorianToJalali(gy: number, gm: number, gd: number): [number, number, number] {
  const g_d_m = [0, 31, 59, 90, 120, 151, 181, 212, 243, 273, 304, 334];
  let gy2 = (gm > 2) ? (gy + 1) : gy;
  let days = 355666 + (365 * gy) + Math.floor((gy2 + 3) / 4) - Math.floor((gy2 + 99) / 100) + Math.floor((gy2 + 399) / 400) + gd + g_d_m[gm - 1];
  let jy = -1595 + (33 * Math.floor(days / 12053));
  days %= 12053;
  jy += 4 * Math.floor(days / 1461);
  days %= 1461;
  if (days > 365) {
    jy += Math.floor((days - 1) / 365);
    days = (days - 1) % 365;
  }
  let jm: number;
  let jd: number;
  if (days < 186) {
    jm = 1 + Math.floor(days / 31);
    jd = 1 + (days % 31);
  } else {
    jm = 7 + Math.floor((days - 186) / 30);
    jd = 1 + ((days - 186) % 30);
  }
  return [jy, jm, jd];
}

const persianMonths = [
  'فروردین', 'اردیبهشت', 'خرداد',
  'تیر', 'مرداد', 'شهریور',
  'مهر', 'آبان', 'آذر',
  'دی', 'بهمن', 'اسفند'
];

// Format ISO date string to Persian Solar Date (e.g. ۱۴۰۳/۰۶/۰۱ یا ۱ شهریور ۱۴۰۳)
export function formatPersianDate(dateInput: string | Date | undefined | null, includeTime = false, textMonth = false): string {
  if (!dateInput) return '-';
  try {
    const d = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
    if (isNaN(d.getTime())) return '-';

    const gy = d.getFullYear();
    const gm = d.getMonth() + 1;
    const gd = d.getDate();

    const [jy, jm, jd] = gregorianToJalali(gy, gm, gd);

    let dateStr = '';
    if (textMonth) {
      dateStr = `${toPersianDigits(jd)} ${persianMonths[jm - 1]} ${toPersianDigits(jy)}`;
    } else {
      const padM = jm < 10 ? `۰${jm}` : `${jm}`;
      const padD = jd < 10 ? `۰${jd}` : `${jd}`;
      dateStr = `${toPersianDigits(jy)}/${toPersianDigits(padM)}/${toPersianDigits(padD)}`;
    }

    if (includeTime) {
      const hours = d.getHours();
      const minutes = d.getMinutes();
      const padH = hours < 10 ? `۰${hours}` : toPersianDigits(hours);
      const padMin = minutes < 10 ? `۰${minutes}` : toPersianDigits(minutes);
      return `${dateStr} - ${padH}:${padMin}`;
    }

    return dateStr;
  } catch {
    return '-';
  }
}
