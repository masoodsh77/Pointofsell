import React from 'react';
import { useTheme } from '../../context/ThemeContext';
import { ThemeColor, FontFamily, FontSize } from '../../types';
import { Palette, Type, Check, X, Sparkles, Sliders } from 'lucide-react';

interface ThemeSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveToSettings?: () => void;
}

export const ThemeSelectorModal: React.FC<ThemeSelectorModalProps> = ({
  isOpen,
  onClose,
  onSaveToSettings,
}) => {
  const {
    themeColor,
    fontFamily,
    fontSize,
    setThemeColor,
    setFontFamily,
    setFontSize,
    themeColorsList,
    fontFamiliesList,
    fontSizesList,
  } = useTheme();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-[#141414] rounded-3xl shadow-2xl border border-white/10 w-full max-w-xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="px-6 py-4 bg-white/5 border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center">
              <Palette className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">شخصی‌سازی تم و ظاهر نرم‌افزار</h3>
              <p className="text-[11px] text-slate-400">رنگ اصلی، فونت متون و اندازه قلم را مطابق سلیقه خود تغییر دهید</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-6 text-right">
          {/* 1. Theme Primary Colors */}
          <div className="space-y-3">
            <label className="text-xs font-bold text-slate-200 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span>انتخاب رنگ اصلی و جلوه‌های نرم‌افزار:</span>
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {themeColorsList.map((item) => {
                const isSelected = themeColor === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setThemeColor(item.id)}
                    className={`p-3 rounded-2xl border text-right transition-all flex items-center justify-between cursor-pointer ${
                      isSelected
                        ? 'bg-white/10 border-white/40 ring-1 ring-white/30 shadow-lg'
                        : 'bg-white/5 border-white/5 hover:bg-white/8 hover:border-white/15'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span
                        className="w-7 h-7 rounded-xl flex items-center justify-center shadow-md shrink-0"
                        style={{ backgroundColor: item.hex }}
                      >
                        {isSelected && <Check className="w-4 h-4 text-slate-950 font-bold" />}
                      </span>
                      <div>
                        <div className="text-xs font-bold text-white">{item.name}</div>
                        <div className="text-[10px] text-slate-400">{item.desc}</div>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 2. Persian Font Selection */}
          <div className="space-y-3">
            <label className="text-xs font-bold text-slate-200 flex items-center gap-2">
              <Type className="w-4 h-4 text-amber-400" />
              <span>فونت فارسی سیستم:</span>
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {fontFamiliesList.map((item) => {
                const isSelected = fontFamily === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setFontFamily(item.id)}
                    className={`p-3 rounded-2xl border text-right transition-all flex items-center justify-between cursor-pointer ${
                      isSelected
                        ? 'bg-white/10 border-amber-500/50 ring-1 ring-amber-500/30'
                        : 'bg-white/5 border-white/5 hover:bg-white/8 hover:border-white/15'
                    }`}
                  >
                    <div>
                      <div className="text-xs font-bold text-white">{item.name}</div>
                      <div className="text-[10px] text-slate-400 mt-0.5">{item.desc}</div>
                    </div>
                    {isSelected && (
                      <div className="w-5 h-5 rounded-full bg-amber-500 text-slate-950 flex items-center justify-center shrink-0">
                        <Check className="w-3 h-3 stroke-[3]" />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 3. Font Size Selection */}
          <div className="space-y-3">
            <label className="text-xs font-bold text-slate-200 flex items-center gap-2">
              <Sliders className="w-4 h-4 text-amber-400" />
              <span>اندازه سایز فونت و بزرگنمایی:</span>
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {fontSizesList.map((item) => {
                const isSelected = fontSize === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setFontSize(item.id)}
                    className={`p-3 rounded-2xl border text-center transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-amber-500 text-slate-950 font-bold border-amber-400 shadow-md shadow-amber-500/20'
                        : 'bg-white/5 border-white/5 text-slate-300 hover:bg-white/10 hover:text-white'
                    }`}
                  >
                    <div className="text-xs font-bold">{item.name}</div>
                    <div className={`text-[9.5px] mt-1 ${isSelected ? 'text-slate-900 font-medium' : 'text-slate-500'}`}>
                      {item.id === 'sm' ? 'کوچک' : item.id === 'base' ? 'عادی' : item.id === 'lg' ? 'بزرگ' : 'خیلی بزرگ'}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Live Preview Card */}
          <div className="p-4 bg-white/5 border border-white/10 rounded-2xl space-y-2">
            <div className="text-[11px] font-bold text-slate-400">پیش‌نمایش زنده ظاهر و قلم:</div>
            <div className="text-sm font-bold text-white">
              پسته اکبری درجه یک رفسنجان - ۱,۲۵۰,۰۰۰ تومان
            </div>
            <div className="text-xs text-slate-300">
              «فروشگاه آجیل و خشکبار زعفران طلایی - مجهز به سیستم پیشرفته صندوق فروشگاهی»
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-white/5 border-t border-white/10 flex items-center justify-between">
          <div className="text-[11px] text-slate-400">
            تغییرات به صورت آنی در تمام بخش‌ها ذخیره شد.
          </div>
          <button
            onClick={() => {
              if (onSaveToSettings) onSaveToSettings();
              onClose();
            }}
            className="px-6 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold rounded-xl text-xs transition-colors cursor-pointer shadow-md shadow-amber-500/20"
          >
            تأیید و بازگشت
          </button>
        </div>
      </div>
    </div>
  );
};
