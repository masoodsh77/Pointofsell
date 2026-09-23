import { PaymentMethod, ProductUnit, Role, StockMovementType } from '../types';

// Convert English digits to Persian digits
export function toPersianDigits(input: string | number | undefined | null): string {
  if (input === undefined || input === null) return '';
  const str = String(input);
  const persianDigits = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
  return str.replace(/[0-9]/g, (w) => persianDigits[+w]);
}

// Convert Persian and Arabic digits to standard English digits
export function toEnglishDigits(input: string | number | undefined | null): string {
  if (input === undefined || input === null) return '';
  const str = String(input);
  return str
    .replace(/[۰-۹]/g, (d) => String(d.charCodeAt(0) - 1776))
    .replace(/[٠-٩]/g, (d) => String(d.charCodeAt(0) - 1632));
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

export type CurrencyUnit = 'تومان' | 'ریال';

let currentAppCurrency: CurrencyUnit = (() => {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      const saved = window.localStorage.getItem('nuts_pos_currency') as CurrencyUnit;
      if (saved === 'ریال' || saved === 'تومان') return saved;
    }
  } catch (_) {}
  return 'تومان';
})();

export function getAppCurrency(): CurrencyUnit {
  return currentAppCurrency;
}

export function setAppCurrency(curr: CurrencyUnit): void {
  currentAppCurrency = curr;
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.setItem('nuts_pos_currency', curr);
      window.dispatchEvent(new CustomEvent('nuts_currency_changed', { detail: curr }));
    }
  } catch (_) {}
}

// Format currency with Toman or Rial (when Rial, multiplies by 10)
export function formatCurrency(
  amount: number | undefined | null,
  customSuffix?: string
): string {
  const activeCurr = currentAppCurrency;
  const isRial = (customSuffix === 'ریال') || (customSuffix === undefined && activeCurr === 'ریال');

  if (amount === undefined || amount === null || isNaN(Number(amount))) {
    const unit = customSuffix !== undefined ? customSuffix : activeCurr;
    return `۰${unit ? ' ' + unit : ''}`;
  }

  const num = Number(amount);
  const calculatedAmount = isRial ? Math.round(num * 10) : Math.round(num);
  const formatted = formatNumber(calculatedAmount);

  if (customSuffix === '') {
    return formatted;
  }

  const unit = customSuffix !== undefined ? customSuffix : activeCurr;
  return `${formatted} ${unit}`.trim();
}

// Convert numbers into Persian words (e.g. 1,500,000 -> یک میلیون و پانصد هزار)
export function numberToPersianWords(num: number | string | undefined | null): string {
  if (num === undefined || num === null || num === '') return '';
  const n = Math.abs(Math.round(Number(toEnglishDigits(num))));
  if (isNaN(n)) return '';
  if (n === 0) return 'صفر';

  const ones = ['', 'یک', 'دو', 'سه', 'چهار', 'پنج', 'شش', 'هفت', 'هشت', 'نه'];
  const teens = [
    'ده',
    'یازده',
    'دوازده',
    'سیزده',
    'چهارده',
    'پانزده',
    'شانزده',
    'هفده',
    'هجده',
    'نوزده',
  ];
  const tens = [
    '',
    '',
    'بیست',
    'سی',
    'چهل',
    'پنجاه',
    'شصت',
    'هفتاد',
    'هشتاد',
    'نود',
  ];
  const hundreds = [
    '',
    'یکصد',
    'دویست',
    'سیصد',
    'چهارصد',
    'پانصد',
    'ششصد',
    'هفتصد',
    'هشتصد',
    'نهصد',
  ];
  const groups = ['', 'هزار', 'میلیون', 'میلیارد', 'تریلیون'];

  function threeDigitsToWords(val: number): string {
    const h = Math.floor(val / 100);
    const remainder = val % 100;
    const parts: string[] = [];

    if (h > 0) parts.push(hundreds[h]);

    if (remainder >= 10 && remainder < 20) {
      parts.push(teens[remainder - 10]);
    } else {
      const t = Math.floor(remainder / 10);
      const o = remainder % 10;
      if (t > 0) parts.push(tens[t]);
      if (o > 0) parts.push(ones[o]);
    }
    return parts.join(' و ');
  }

  const chunks: string[] = [];
  let temp = n;
  let groupIdx = 0;

  while (temp > 0 && groupIdx < groups.length) {
    const chunk = temp % 1000;
    if (chunk > 0) {
      const chunkWords = threeDigitsToWords(chunk);
      const groupName = groups[groupIdx];
      chunks.unshift(groupName ? `${chunkWords} ${groupName}` : chunkWords);
    }
    temp = Math.floor(temp / 1000);
    groupIdx++;
  }

  const prefix = Number(num) < 0 ? 'منفی ' : '';
  return prefix + chunks.join(' و ');
}

// Format Weight & Units
export function formatWeightOrQuantity(quantity: number, unit: ProductUnit): string {
  if (unit === 'KG') {
    if (quantity < 1 && quantity > 0) {
      const grams = Math.round(quantity * 1000);
      return `${formatNumber(grams)} گرم`;
    }
    return `${formatNumber(quantity)} کیلوگرم`;
  }
  if (unit === 'G') {
    return `${formatNumber(quantity)} گرم`;
  }
  if (unit === 'MESGHAL') {
    return `${formatNumber(quantity)} مثقال`;
  }
  if (unit === 'SOUT') {
    return `${formatNumber(quantity)} صوت`;
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
    case 'MESGHAL':
      return 'مثقال';
    case 'SOUT':
      return 'صوت';
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
    case 'WASTE':
      return { label: 'ثبت خرابی و ضایعات کالا', color: 'text-rose-700 bg-rose-50 border-rose-200' };
    case 'EXPIRED':
      return { label: 'انقضای تاریخ مصرف کالا', color: 'text-orange-700 bg-orange-50 border-orange-200' };
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
