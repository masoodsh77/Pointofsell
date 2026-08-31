import React, { createContext, useContext, useState, useEffect } from 'react';
import { ThemeColor, FontFamily, FontSize } from '../types';

export interface ThemeConfig {
  themeColor: ThemeColor;
  fontFamily: FontFamily;
  fontSize: FontSize;
}

interface ThemeContextType {
  themeColor: ThemeColor;
  fontFamily: FontFamily;
  fontSize: FontSize;
  setThemeColor: (color: ThemeColor) => void;
  setFontFamily: (font: FontFamily) => void;
  setFontSize: (size: FontSize) => void;
  updateTheme: (config: Partial<ThemeConfig>) => void;
  themeColorsList: Array<{ id: ThemeColor; name: string; hex: string; desc: string }>;
  fontFamiliesList: Array<{ id: FontFamily; name: string; desc: string }>;
  fontSizesList: Array<{ id: FontSize; name: string; label: string }>;
}

const THEME_COLORS: Array<{ id: ThemeColor; name: string; hex: string; desc: string }> = [
  { id: 'amber', name: 'زعفرانی و طلایی', hex: '#f59e0b', desc: 'گرم، اصیل و مخصوص خشکبار و زعفران' },
  { id: 'emerald', name: 'سبز زمردی و پسته', hex: '#10b981', desc: 'طبیعی، آرامش‌بخش و باطراوت' },
  { id: 'blue', name: 'آبی لاجوردی و سلطنتی', hex: '#3b82f6', desc: 'مدرن، اداری و پرکنتراست' },
  { id: 'rose', name: 'زرشکی و یاقوتی', hex: '#f43f5e', desc: 'جذاب، چشم‌نواز و پرحرارت' },
  { id: 'purple', name: 'بنفش شاه‌توتی و لوکس', hex: '#a855f7', desc: 'لاکچری و متمایز' },
  { id: 'teal', name: 'فیروزه‌ای اصیل ایرانی', hex: '#14b8a6', desc: 'سنتی و درخشان' },
  { id: 'slate', name: 'تیتانیوم و نقره‌ای', hex: '#94a3b8', desc: 'مینیمال، رسمی و مونوکروم' },
];

const FONT_FAMILIES: Array<{ id: FontFamily; name: string; desc: string }> = [
  { id: 'vazir', name: 'وزیرمتن (Vazirmatn)', desc: 'استاندارد، خوانا و بسیار شیک' },
  { id: 'shabnam', name: 'شبنم (Shabnam)', desc: 'گرد، نرم و چشم‌نواز' },
  { id: 'dana', name: 'دانا و استعداد (Dana)', desc: 'مدرن، هندسی و دقیق' },
  { id: 'sahel', name: 'ساحل (Sahel)', desc: 'صمیمی، سنتی و خوانا' },
  { id: 'system', name: 'یکان سیستم (System UI)', desc: 'کلاسیک و فشرده' },
];

const FONT_SIZES: Array<{ id: FontSize; name: string; label: string }> = [
  { id: 'sm', name: 'فشرده و ریز (Small)', label: '۱۴ پیکسل - مناسب مانیتورهای کوچک' },
  { id: 'base', name: 'استاندارد (Default)', label: '۱۶ پیکسل - بهینه و متوازن' },
  { id: 'lg', name: 'بزرگ و خوانا (Large)', label: '۱۸ پیکسل - راحتی چشم صندوق‌دار' },
  { id: 'xl', name: 'خیلی بزرگ لمسی (XL)', label: '۲۰ پیکسل - مانیتورهای لمسی با فاصله' },
];

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const COLOR_VARIABLES: Record<string, { primary: string; hover: string; soft: string; borderSoft: string; glow: string; textOnPrimary: string }> = {
  amber: {
    primary: '#f59e0b',
    hover: '#d97706',
    soft: 'rgba(245, 158, 11, 0.12)',
    borderSoft: 'rgba(245, 158, 11, 0.25)',
    glow: 'rgba(245, 158, 11, 0.35)',
    textOnPrimary: '#020617',
  },
  emerald: {
    primary: '#10b981',
    hover: '#059669',
    soft: 'rgba(16, 185, 129, 0.12)',
    borderSoft: 'rgba(16, 185, 129, 0.25)',
    glow: 'rgba(16, 185, 129, 0.35)',
    textOnPrimary: '#020617',
  },
  blue: {
    primary: '#3b82f6',
    hover: '#2563eb',
    soft: 'rgba(59, 130, 246, 0.12)',
    borderSoft: 'rgba(59, 130, 246, 0.25)',
    glow: 'rgba(59, 130, 246, 0.35)',
    textOnPrimary: '#ffffff',
  },
  rose: {
    primary: '#f43f5e',
    hover: '#e11d48',
    soft: 'rgba(244, 63, 94, 0.12)',
    borderSoft: 'rgba(244, 63, 94, 0.25)',
    glow: 'rgba(244, 63, 94, 0.35)',
    textOnPrimary: '#ffffff',
  },
  purple: {
    primary: '#a855f7',
    hover: '#9333ea',
    soft: 'rgba(168, 85, 247, 0.12)',
    borderSoft: 'rgba(168, 85, 247, 0.25)',
    glow: 'rgba(168, 85, 247, 0.35)',
    textOnPrimary: '#ffffff',
  },
  violet: {
    primary: '#8b5cf6',
    hover: '#7c3aed',
    soft: 'rgba(139, 92, 246, 0.12)',
    borderSoft: 'rgba(139, 92, 246, 0.25)',
    glow: 'rgba(139, 92, 246, 0.35)',
    textOnPrimary: '#ffffff',
  },
  teal: {
    primary: '#14b8a6',
    hover: '#0d9488',
    soft: 'rgba(20, 184, 166, 0.12)',
    borderSoft: 'rgba(20, 184, 166, 0.25)',
    glow: 'rgba(20, 184, 166, 0.35)',
    textOnPrimary: '#020617',
  },
  cyan: {
    primary: '#06b6d4',
    hover: '#0891b2',
    soft: 'rgba(6, 182, 212, 0.12)',
    borderSoft: 'rgba(6, 182, 212, 0.25)',
    glow: 'rgba(6, 182, 212, 0.35)',
    textOnPrimary: '#020617',
  },
  slate: {
    primary: '#cbd5e1',
    hover: '#94a3b8',
    soft: 'rgba(203, 213, 225, 0.12)',
    borderSoft: 'rgba(203, 213, 225, 0.25)',
    glow: 'rgba(203, 213, 225, 0.35)',
    textOnPrimary: '#020617',
  },
};

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [themeColor, setThemeColorState] = useState<ThemeColor>(() => {
    return (localStorage.getItem('app_theme_color') as ThemeColor) || 'amber';
  });

  const [fontFamily, setFontFamilyState] = useState<FontFamily>(() => {
    return (localStorage.getItem('app_font_family') as FontFamily) || 'vazir';
  });

  const [fontSize, setFontSizeState] = useState<FontSize>(() => {
    return (localStorage.getItem('app_font_size') as FontSize) || 'base';
  });

  // Apply CSS variables and document dataset attributes
  useEffect(() => {
    const root = document.documentElement;
    root.setAttribute('data-theme-color', themeColor);
    root.setAttribute('data-font', fontFamily === 'vazirmatn' ? 'vazir' : fontFamily);
    root.setAttribute('data-size', fontSize === 'md' ? 'base' : fontSize);

    const colors = COLOR_VARIABLES[themeColor] || COLOR_VARIABLES.amber;
    root.style.setProperty('--theme-primary', colors.primary);
    root.style.setProperty('--theme-hover', colors.hover);
    root.style.setProperty('--theme-soft', colors.soft);
    root.style.setProperty('--theme-border-soft', colors.borderSoft);
    root.style.setProperty('--theme-glow', colors.glow);
    root.style.setProperty('--theme-text-on-primary', colors.textOnPrimary);

    localStorage.setItem('app_theme_color', themeColor);
    localStorage.setItem('app_font_family', fontFamily);
    localStorage.setItem('app_font_size', fontSize);
  }, [themeColor, fontFamily, fontSize]);

  const setThemeColor = (color: ThemeColor) => {
    setThemeColorState(color);
  };

  const setFontFamily = (font: FontFamily) => {
    setFontFamilyState(font);
  };

  const setFontSize = (size: FontSize) => {
    setFontSizeState(size);
  };

  const updateTheme = (config: Partial<ThemeConfig>) => {
    if (config.themeColor) setThemeColorState(config.themeColor);
    if (config.fontFamily) setFontFamilyState(config.fontFamily);
    if (config.fontSize) setFontSizeState(config.fontSize);
  };

  return (
    <ThemeContext.Provider
      value={{
        themeColor,
        fontFamily,
        fontSize,
        setThemeColor,
        setFontFamily,
        setFontSize,
        updateTheme,
        themeColorsList: THEME_COLORS,
        fontFamiliesList: FONT_FAMILIES,
        fontSizesList: FONT_SIZES,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
