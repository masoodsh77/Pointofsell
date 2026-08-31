import React, { useState, useEffect } from 'react';
import { StoreSettings, ThemeColor, FontFamily, FontSize, ReceiptTemplateType, PosProviderType } from '../../types';
import { apiRequest } from '../../services/api';
import { useTheme } from '../../context/ThemeContext';
import { ThemeSelectorModal } from '../common/ThemeSelectorModal';
import {
  Settings,
  Save,
  CheckCircle,
  AlertCircle,
  Store,
  Receipt,
  ShieldCheck,
  Palette,
  Type,
  CreditCard,
  Wifi,
  QrCode,
  FileText,
  Printer,
  Layout,
  RefreshCw,
  Sparkles,
} from 'lucide-react';

interface SettingsViewProps {
  settings: StoreSettings | null;
  onRefreshSettings: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({ settings, onRefreshSettings }) => {
  const { themeColor, fontFamily, fontSize, setThemeColor, setFontFamily, setFontSize } = useTheme();

  const [formData, setFormData] = useState<StoreSettings>({
    storeName: '',
    storePhone: '',
    storeAddress: '',
    logoText: '',
    currency: 'تومان',
    taxRate: 0,
    receiptFooter: '',
    backupRetentionDays: 30,
    autoBackupEnabled: true,
    themeColor: 'amber',
    fontFamily: 'vazirmatn',
    fontSize: 'md',
    receiptTemplate: 'CLASSIC_80',
    posTerminal: {
      enabled: true,
      provider: 'BEHPARDAKHT',
      connectionType: 'LAN_IP',
      ipAddress: '192.168.1.150',
      port: 8080,
      terminalId: '8823491',
      merchantId: '14092102',
      timeoutSeconds: 60,
      autoSendOnCardPayment: false,
    },
  });

  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState<boolean>(false);

  // Theme Selector Modal
  const [showThemeModal, setShowThemeModal] = useState<boolean>(false);

  // POS Terminal Test Connection State
  const [isTestingPos, setIsTestingPos] = useState<boolean>(false);
  const [posTestResult, setPosTestResult] = useState<{ success: boolean; message: string; terminalId?: string; pingMs?: number } | null>(null);

  useEffect(() => {
    if (settings) {
      setFormData((prev) => ({
        ...prev,
        ...settings,
        posTerminal: {
          ...prev.posTerminal,
          ...(settings.posTerminal || {}),
        },
      }));
    }
  }, [settings]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setErrorMsg(null);

    const res = await apiRequest<StoreSettings>('/settings', {
      method: 'PUT',
      body: JSON.stringify(formData),
    });

    if (res.success && res.data) {
      setSuccessMsg('تنظیمات فروشگاه با موفقیت ذخیره و اعمال شد.');
      onRefreshSettings();
      setTimeout(() => setSuccessMsg(null), 4000);
    } else {
      setErrorMsg(res.message || 'خطا در ذخیره تنظیمات');
    }
    setIsSaving(false);
  };

  // Test POS Terminal Connection
  const handleTestPos = async () => {
    setIsTestingPos(true);
    setPosTestResult(null);
    try {
      const res = await apiRequest<{ success: boolean; message: string; terminalId?: string; pingMs?: number }>(
        '/settings/pos-test',
        {
          method: 'POST',
          body: JSON.stringify({
            ip: formData.posTerminal?.ipAddress,
            port: formData.posTerminal?.port,
            terminalId: formData.posTerminal?.terminalId,
            provider: formData.posTerminal?.provider,
          }),
        }
      );
      if (res.success && res.data) {
        setPosTestResult(res.data);
      } else {
        setPosTestResult({
          success: false,
          message: res.message || 'خطا در برقراری ارتباط با پایانه بانکی',
        });
      }
    } catch {
      setPosTestResult({
        success: false,
        message: 'خطا در ارسال دستور تست ارتباط با کارت‌خوان',
      });
    } finally {
      setIsTestingPos(false);
    }
  };

  const themeColorsList: Array<{ id: ThemeColor; label: string; bgClass: string }> = [
    { id: 'amber', label: 'زعفرانی (پیش‌فرض)', bgClass: 'bg-amber-500' },
    { id: 'emerald', label: 'زمردی (پسته)', bgClass: 'bg-emerald-500' },
    { id: 'blue', label: 'لاجوردی', bgClass: 'bg-blue-500' },
    { id: 'rose', label: 'زرشکی (زرشک)', bgClass: 'bg-rose-500' },
    { id: 'violet', label: 'بنفش رویال', bgClass: 'bg-purple-500' },
    { id: 'cyan', label: 'فیروزه‌ای', bgClass: 'bg-cyan-500' },
    { id: 'slate', label: 'تیتانیوم تیره', bgClass: 'bg-slate-500' },
  ];

  const fontFamiliesList: Array<{ id: FontFamily; label: string; desc: string }> = [
    { id: 'vazirmatn', label: 'وزیرمتن (Vazirmatn)', desc: 'محبوب، خوانا و مدرن' },
    { id: 'shabnam', label: 'شبنم (Shabnam)', desc: 'شکیل، متعادل و رسمی' },
    { id: 'dana', label: 'دانا (Dana)', desc: 'هندسی و امروزی' },
    { id: 'sahel', label: 'ساحل (Sahel)', desc: 'کلاسیک و زیبا' },
    { id: 'system', label: 'فونت استاندارد سیستم', desc: 'بدون بارگذاری وب‌فونت' },
  ];

  const fontSizesList: Array<{ id: FontSize; label: string; desc: string }> = [
    { id: 'sm', label: 'کوچک', desc: 'مناسب نمایش فشرده اطلاعات' },
    { id: 'md', label: 'استاندارد', desc: 'اندازه بهینه و استاندارد' },
    { id: 'lg', label: 'بزرگ', desc: 'خوانایی بالا' },
    { id: 'xl', label: 'خیلی بزرگ', desc: 'مناسب مانیتورهای لمسی بزرگ' },
  ];

  const receiptTemplatesList: Array<{
    id: ReceiptTemplateType;
    label: string;
    width: string;
    icon: any;
    desc: string;
  }> = [
    {
      id: 'CLASSIC_80',
      label: 'حرارتی ۸۰mm کلاسیک',
      width: '۸۰ میلی‌متر',
      icon: Printer,
      desc: 'فیش‌پرینتر استاندارد با تفکیک دقیق اقلام و پانویس',
    },
    {
      id: 'COMPACT_58',
      label: 'فشرده ۵۸mm اقتصادی',
      width: '۵۸ میلی‌متر',
      icon: Layout,
      desc: 'کم‌مصرف‌ترین طرح جهت صرفه‌جویی در رول کاغذ',
    },
    {
      id: 'MODERN_QR',
      label: 'مدرن با بارکد QR',
      width: '۸۰ میلی‌متر',
      icon: QrCode,
      desc: 'حاشیه جذاب، جدول ردیف‌دار و بارکد کیوآر اختصاصی',
    },
    {
      id: 'OFFICIAL_A5',
      label: 'فاکتور رسمی شرکتی A5',
      width: 'ابعاد A5 / A4',
      icon: FileText,
      desc: 'جدول کامل مالیاتی، مشخصات خریدار، مهر و امضا',
    },
  ];

  const posProvidersList: Array<{ id: PosProviderType; label: string }> = [
    { id: 'BEHPARDAKHT', label: 'به‌پرداخت ملت' },
    { id: 'ASAN_PARDAKHT', label: 'آسان پرداخت (آپ)' },
    { id: 'SAMAN_KISH', label: 'پرداخت الکترونیک سامان (سپ)' },
    { id: 'IRAN_KISH', label: 'کارت اعتباری ایران‌کیش' },
    { id: 'FANAP', label: 'پرداخت الکترونیک پاسارگاد (فناپ)' },
    { id: 'PARSIAN', label: 'تجارت الکترونیک پارسیان' },
  ];

  return (
    <div className="p-4 sm:p-6 max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-[#141414] p-6 rounded-3xl border border-white/5 shadow-xl">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center">
            <Settings className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-black text-white">تنظیمات پیشرفته فروشگاه</h2>
            <p className="text-xs text-slate-400 mt-0.5">
              شخصی‌سازی تم و فونت، قالب فاکتورها، کارت‌خوان PC-POS و اطلاعات فروشگاه
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setShowThemeModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold rounded-2xl text-xs transition-all cursor-pointer shadow-md shadow-amber-500/20"
        >
          <Palette className="w-4 h-4" />
          <span>پنجره شخصی‌سازی زنده تم</span>
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

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* ================= SECTION 1: THEME & FONT CUSTOMIZATION ================= */}
        <div className="bg-[#141414] p-6 rounded-3xl border border-white/5 shadow-xl space-y-5">
          <div className="flex items-center justify-between border-b border-white/5 pb-3">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Palette className="w-4 h-4 text-amber-400" />
              <span>شخصی‌سازی تم و ظاهر نرم‌افزار (رنگ اصلی + قلم + اندازه)</span>
            </h3>
            <span className="text-[11px] text-amber-400 font-bold flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5" />
              <span>اعمال آنی در تمام بخش‌ها</span>
            </span>
          </div>

          {/* 1. Primary Accent Color */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-slate-300">رنگ اصلی و سازمانی نرم‌افزار:</label>
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2.5">
              {themeColorsList.map((c) => {
                const isSelected = (formData.themeColor || themeColor) === c.id;
                return (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => {
                      setFormData({ ...formData, themeColor: c.id });
                      setThemeColor(c.id);
                    }}
                    className={`p-2.5 rounded-2xl border flex flex-col items-center gap-1.5 transition-all cursor-pointer ${
                      isSelected
                        ? 'border-white bg-white/10 ring-2 ring-white/20 shadow-lg'
                        : 'border-white/5 bg-white/5 hover:border-white/20 hover:bg-white/10'
                    }`}
                  >
                    <div className={`w-7 h-7 rounded-xl ${c.bgClass} shadow-md flex items-center justify-center`}>
                      {isSelected && <CheckCircle className="w-4 h-4 text-white" />}
                    </div>
                    <span className="text-[11px] font-bold text-slate-200 text-center">{c.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 2. Font Family & Font Size Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-2">
            {/* Font Family */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-300 flex items-center gap-1.5">
                <Type className="w-4 h-4 text-amber-400" />
                <span>فونت فارسی سامانه:</span>
              </label>
              <div className="space-y-1.5">
                {fontFamiliesList.map((f) => {
                  const isSelected = (formData.fontFamily || fontFamily) === f.id;
                  return (
                    <div
                      key={f.id}
                      onClick={() => {
                        setFormData({ ...formData, fontFamily: f.id });
                        setFontFamily(f.id);
                      }}
                      className={`p-3 rounded-2xl border flex items-center justify-between cursor-pointer transition-all ${
                        isSelected
                          ? 'border-amber-500/50 bg-amber-500/10 text-white'
                          : 'border-white/5 bg-white/5 hover:bg-white/10 text-slate-300'
                      }`}
                    >
                      <div>
                        <div className="text-xs font-bold">{f.label}</div>
                        <div className="text-[10px] text-slate-400">{f.desc}</div>
                      </div>
                      {isSelected && <CheckCircle className="w-4 h-4 text-amber-400" />}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Font Size */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-300 flex items-center gap-1.5">
                <Type className="w-4 h-4 text-amber-400" />
                <span>اندازه فونت و مقیاس نمایشی:</span>
              </label>
              <div className="space-y-1.5">
                {fontSizesList.map((s) => {
                  const isSelected = (formData.fontSize || fontSize) === s.id;
                  return (
                    <div
                      key={s.id}
                      onClick={() => {
                        setFormData({ ...formData, fontSize: s.id });
                        setFontSize(s.id);
                      }}
                      className={`p-3 rounded-2xl border flex items-center justify-between cursor-pointer transition-all ${
                        isSelected
                          ? 'border-amber-500/50 bg-amber-500/10 text-white'
                          : 'border-white/5 bg-white/5 hover:bg-white/10 text-slate-300'
                      }`}
                    >
                      <div>
                        <div className="text-xs font-bold">{s.label}</div>
                        <div className="text-[10px] text-slate-400">{s.desc}</div>
                      </div>
                      {isSelected && <CheckCircle className="w-4 h-4 text-amber-400" />}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* ================= SECTION 2: RECEIPT TEMPLATES ================= */}
        <div className="bg-[#141414] p-6 rounded-3xl border border-white/5 shadow-xl space-y-4">
          <h3 className="text-sm font-bold text-white flex items-center gap-2 border-b border-white/5 pb-3">
            <Receipt className="w-4 h-4 text-amber-400" />
            <span>طرح‌های متنوع رسید و فاکتور فروش</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {receiptTemplatesList.map((tpl) => {
              const Icon = tpl.icon;
              const isSelected = formData.receiptTemplate === tpl.id;
              return (
                <div
                  key={tpl.id}
                  onClick={() => setFormData({ ...formData, receiptTemplate: tpl.id })}
                  className={`p-4 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between gap-3 ${
                    isSelected
                      ? 'border-amber-500 bg-amber-500/10 shadow-lg shadow-amber-500/10'
                      : 'border-white/5 bg-white/5 hover:bg-white/10 hover:border-white/20'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className={`p-2.5 rounded-xl ${isSelected ? 'bg-amber-500 text-slate-950' : 'bg-white/10 text-slate-300'}`}>
                        <Icon className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="text-xs font-bold text-white">{tpl.label}</div>
                        <div className="text-[10.5px] text-slate-400 mt-0.5 font-sans">{tpl.width}</div>
                      </div>
                    </div>
                    {isSelected && (
                      <span className="bg-amber-500 text-slate-950 text-[10px] font-black px-2 py-0.5 rounded-md">
                        طرح انتخابی
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-300 leading-relaxed">{tpl.desc}</p>
                </div>
              );
            })}
          </div>

          <div className="pt-2">
            <label className="block text-xs font-bold text-slate-300 mb-1">
              متن پانویس فاکتور و رسید مشتری
            </label>
            <textarea
              rows={2}
              value={formData.receiptFooter}
              onChange={(e) => setFormData({ ...formData, receiptFooter: e.target.value })}
              placeholder="از خرید شما صمیمانه متشکریم. لطفاً در حفظ فاکتور کوشا باشید."
              className="w-full p-2.5 bg-white/5 border border-white/10 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-hidden focus:ring-1 focus:ring-amber-500"
            />
          </div>
        </div>

        {/* ================= SECTION 3: PC-POS TERMINAL CONFIG ================= */}
        <div className="bg-[#141414] p-6 rounded-3xl border border-white/5 shadow-xl space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-white/5 pb-3">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-amber-400" />
              <span>پیکربندی ارسال مبلغ به کارت‌خوان (PC-POS)</span>
            </h3>
            <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.posTerminal?.enabled}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    posTerminal: {
                      ...formData.posTerminal,
                      enabled: e.target.checked,
                    },
                  })
                }
                className="w-4 h-4 rounded text-amber-500 focus:ring-amber-500 accent-amber-500"
              />
              <span className="font-bold text-white">اتصال مستقیم به کارت‌خوان فعال باشد</span>
            </label>
          </div>

          {formData.posTerminal?.enabled && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {/* 1. PSP Provider */}
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">شرکت ارائه‌دهنده کارت‌خوان (PSP)</label>
                  <select
                    value={formData.posTerminal?.provider || 'BEHPARDAKHT'}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        posTerminal: {
                          ...formData.posTerminal,
                          provider: e.target.value as PosProviderType,
                        },
                      })
                    }
                    className="w-full p-2.5 bg-white/5 border border-white/10 rounded-xl text-xs text-white focus:outline-hidden focus:ring-1 focus:ring-amber-500"
                  >
                    {posProvidersList.map((p) => (
                      <option key={p.id} value={p.id} className="bg-slate-900 text-white">
                        {p.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* 2. Connection Type */}
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">نوع پروتکل ارتباطی</label>
                  <select
                    value={formData.posTerminal?.connectionType || 'LAN_IP'}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        posTerminal: {
                          ...formData.posTerminal,
                          connectionType: e.target.value as any,
                        },
                      })
                    }
                    className="w-full p-2.5 bg-white/5 border border-white/10 rounded-xl text-xs text-white focus:outline-hidden focus:ring-1 focus:ring-amber-500"
                  >
                    <option value="LAN_IP" className="bg-slate-900 text-white">شبکه محلی LAN (IP / Port)</option>
                    <option value="SERIAL_COM" className="bg-slate-900 text-white">کابل سریال / USB (COM Port)</option>
                    <option value="BRIDGE_SERVER" className="bg-slate-900 text-white">پل محلی ویندوز (Local Bridge)</option>
                  </select>
                </div>

                {/* 3. IP Address */}
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">آدرس IP کارت‌خوان در شبکه</label>
                  <input
                    type="text"
                    value={formData.posTerminal?.ipAddress || ''}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        posTerminal: {
                          ...formData.posTerminal,
                          ipAddress: e.target.value,
                        },
                      })
                    }
                    placeholder="192.168.1.150"
                    className="w-full p-2.5 bg-white/5 border border-white/10 rounded-xl text-xs text-white font-mono text-left focus:outline-hidden focus:ring-1 focus:ring-amber-500"
                    dir="ltr"
                  />
                </div>

                {/* 4. Port */}
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">پورت ارتباطی (Port)</label>
                  <input
                    type="number"
                    value={formData.posTerminal?.port || 8080}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        posTerminal: {
                          ...formData.posTerminal,
                          port: Number(e.target.value),
                        },
                      })
                    }
                    placeholder="8080"
                    className="w-full p-2.5 bg-white/5 border border-white/10 rounded-xl text-xs text-white font-mono text-left focus:outline-hidden focus:ring-1 focus:ring-amber-500"
                    dir="ltr"
                  />
                </div>

                {/* 5. Terminal ID */}
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">شماره پایانه (Terminal ID)</label>
                  <input
                    type="text"
                    value={formData.posTerminal?.terminalId || ''}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        posTerminal: {
                          ...formData.posTerminal,
                          terminalId: e.target.value,
                        },
                      })
                    }
                    placeholder="8823491"
                    className="w-full p-2.5 bg-white/5 border border-white/10 rounded-xl text-xs text-white font-mono text-left focus:outline-hidden focus:ring-1 focus:ring-amber-500"
                    dir="ltr"
                  />
                </div>

                {/* 6. Merchant ID */}
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">شماره پذیرنده (Merchant ID)</label>
                  <input
                    type="text"
                    value={formData.posTerminal?.merchantId || ''}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        posTerminal: {
                          ...formData.posTerminal,
                          merchantId: e.target.value,
                        },
                      })
                    }
                    placeholder="14092102"
                    className="w-full p-2.5 bg-white/5 border border-white/10 rounded-xl text-xs text-white font-mono text-left focus:outline-hidden focus:ring-1 focus:ring-amber-500"
                    dir="ltr"
                  />
                </div>
              </div>

              {/* Test POS Connection Button & Live Ping Status */}
              <div className="p-4 bg-white/5 border border-white/10 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div>
                  <div className="text-xs font-bold text-white flex items-center gap-2">
                    <Wifi className="w-4 h-4 text-emerald-400" />
                    <span>تست زنده برقراری ارتباط با کارت‌خوان</span>
                  </div>
                  <div className="text-[11px] text-slate-400 mt-0.5">
                    ارسال پکت پینگ و درخواست وضعیت به آدرس {formData.posTerminal?.ipAddress || '192.168.1.150'}:{formData.posTerminal?.port || 8080}
                  </div>
                </div>

                <button
                  id="test-pos-connection-btn"
                  type="button"
                  onClick={handleTestPos}
                  disabled={isTestingPos}
                  className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer border border-white/10"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isTestingPos ? 'animate-spin' : ''}`} />
                  <span>{isTestingPos ? 'در حال ارسال پینگ...' : 'تست اتصال به پوز'}</span>
                </button>
              </div>

              {posTestResult && (
                <div
                  className={`p-3.5 rounded-2xl border text-xs flex items-center gap-2 ${
                    posTestResult.success
                      ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-300'
                      : 'bg-rose-500/10 border-rose-500/20 text-rose-300'
                  }`}
                >
                  {posTestResult.success ? (
                    <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                  )}
                  <div className="flex-1">
                    <div className="font-bold">{posTestResult.message}</div>
                    {posTestResult.pingMs && (
                      <div className="text-[10.5px] text-slate-400 mt-0.5 font-mono">
                        زمان پاسخ: {posTestResult.pingMs} میلی‌ثانیه | پایانه: {posTestResult.terminalId}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* ================= SECTION 4: STORE IDENTITY ================= */}
        <div className="bg-[#141414] p-6 rounded-3xl border border-white/5 shadow-xl space-y-4">
          <h3 className="text-sm font-bold text-white flex items-center gap-2 border-b border-white/5 pb-3">
            <Store className="w-4 h-4 text-amber-400" />
            <span>مشخصات و هویت فروشگاه</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">نام فروشگاه *</label>
              <input
                type="text"
                required
                value={formData.storeName}
                onChange={(e) => setFormData({ ...formData, storeName: e.target.value })}
                placeholder="مثال: آجیل و خشکبار زعفران طلایی"
                className="w-full p-2.5 bg-white/5 border border-white/10 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-hidden focus:ring-1 focus:ring-amber-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">شماره تماس ثابت / همراه</label>
              <input
                type="text"
                value={formData.storePhone}
                onChange={(e) => setFormData({ ...formData, storePhone: e.target.value })}
                placeholder="۰۲۱-۸۸۷۷۶۶۵۵"
                className="w-full p-2.5 bg-white/5 border border-white/10 rounded-xl text-xs text-white placeholder-slate-500 text-left focus:outline-hidden focus:ring-1 focus:ring-amber-500"
                dir="ltr"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-slate-300 mb-1">آدرس فروشگاه</label>
              <input
                type="text"
                value={formData.storeAddress}
                onChange={(e) => setFormData({ ...formData, storeAddress: e.target.value })}
                placeholder="تهران، خیابان ولیعصر، بالاتر از میدان ونک..."
                className="w-full p-2.5 bg-white/5 border border-white/10 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-hidden focus:ring-1 focus:ring-amber-500"
              />
            </div>
          </div>
        </div>

        {/* ================= SECTION 5: BACKUP & MAINTENANCE ================= */}
        <div className="bg-[#141414] p-6 rounded-3xl border border-white/5 shadow-xl space-y-4">
          <h3 className="text-sm font-bold text-white flex items-center gap-2 border-b border-white/5 pb-3">
            <ShieldCheck className="w-4 h-4 text-amber-400" />
            <span>تنظیمات پشتیبان‌گیری خودکار</span>
          </h3>

          <div className="space-y-3">
            <div>
              <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.autoBackupEnabled}
                  onChange={(e) => setFormData({ ...formData, autoBackupEnabled: e.target.checked })}
                  className="w-4 h-4 rounded text-amber-500 focus:ring-amber-500 accent-amber-500"
                />
                <span className="font-bold">پشتیبان‌گیری خودکار روزانه فعال باشد</span>
              </label>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">
                مدت زمان نگهداری نسخه‌های پشتیبان (روز):
              </label>
              <input
                type="number"
                min="1"
                max="365"
                value={formData.backupRetentionDays}
                onChange={(e) => setFormData({ ...formData, backupRetentionDays: Number(e.target.value) })}
                className="w-32 p-2 bg-white/5 border border-white/10 rounded-xl text-xs font-bold text-white focus:outline-hidden focus:ring-1 focus:ring-amber-500"
              />
            </div>
          </div>
        </div>

        {/* Submit */}
        <div className="flex justify-end">
          <button
            id="save-settings-btn"
            type="submit"
            disabled={isSaving}
            className="px-6 py-3 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold rounded-2xl text-xs flex items-center gap-2 shadow-lg shadow-amber-500/25 transition-all cursor-pointer disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            <span>{isSaving ? 'در حال ذخیره‌سازی...' : 'ذخیره تمام تنظیمات'}</span>
          </button>
        </div>
      </form>

      {/* Live Theme Customizer Modal */}
      <ThemeSelectorModal
        isOpen={showThemeModal}
        onClose={() => setShowThemeModal(false)}
      />
    </div>
  );
};
