import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { apiRequest } from '../services/api';
import {
  CurrencyUnit,
  getAppCurrency,
  setAppCurrency as setPersianAppCurrency,
  formatNumber,
  numberToPersianWords,
} from '../utils/persian';

interface CurrencyContextType {
  currency: CurrencyUnit;
  setCurrency: (unit: CurrencyUnit, syncWithServer?: boolean) => Promise<void>;
  toggleCurrency: () => Promise<void>;
  multiplier: number; // 1 for تومان, 10 for ریال
  unitLabel: string; // 'تومان' or 'ریال'
  isRial: boolean;
  formatPrice: (amountInToman: number | undefined | null, showUnit?: boolean) => string;
  priceToWords: (amountInToman: number | undefined | null) => string;
  toDisplayPrice: (baseToman: number | undefined | null) => number;
  toBasePrice: (displayPrice: number | undefined | null) => number;
}

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined);

export const CurrencyProvider: React.FC<{
  initialCurrency?: string;
  children: React.ReactNode;
}> = ({ initialCurrency, children }) => {
  const [currency, setCurrencyState] = useState<CurrencyUnit>(() => {
    if (initialCurrency === 'ریال' || initialCurrency === 'تومان') {
      return initialCurrency;
    }
    return getAppCurrency();
  });

  // Keep synced with initialCurrency if passed from server
  useEffect(() => {
    if (initialCurrency === 'ریال' || initialCurrency === 'تومان') {
      if (initialCurrency !== currency) {
        setCurrencyState(initialCurrency);
        setPersianAppCurrency(initialCurrency);
      }
    }
  }, [initialCurrency]);

  // Listen to cross-component currency change events & sync on mount
  useEffect(() => {
    const handleCurrencyEvent = (e: Event) => {
      const customEvent = e as CustomEvent<CurrencyUnit>;
      if (customEvent.detail && (customEvent.detail === 'ریال' || customEvent.detail === 'تومان')) {
        setCurrencyState(customEvent.detail);
      }
    };
    window.addEventListener('nuts_currency_changed', handleCurrencyEvent);

    // If initial currency was not provided, check server settings
    if (!initialCurrency) {
      apiRequest<any>('/settings')
        .then((res) => {
          if (res.success && res.data?.currency) {
            const serverUnit = res.data.currency === 'ریال' ? 'ریال' : 'تومان';
            setCurrencyState(serverUnit);
            setPersianAppCurrency(serverUnit);
          }
        })
        .catch(() => {});
    }

    return () => {
      window.removeEventListener('nuts_currency_changed', handleCurrencyEvent);
    };
  }, [initialCurrency]);

  const multiplier = currency === 'ریال' ? 10 : 1;
  const isRial = currency === 'ریال';
  const unitLabel = currency;

  const setCurrency = useCallback(async (newUnit: CurrencyUnit, syncWithServer = true) => {
    setCurrencyState(newUnit);
    setPersianAppCurrency(newUnit);

    if (syncWithServer) {
      try {
        await apiRequest('/settings', {
          method: 'PUT',
          body: JSON.stringify({ currency: newUnit }),
        });
      } catch (err) {
        console.warn('Failed to sync currency setting with server:', err);
      }
    }
  }, []);

  const toggleCurrency = useCallback(async () => {
    const nextUnit: CurrencyUnit = currency === 'تومان' ? 'ریال' : 'تومان';
    await setCurrency(nextUnit);
  }, [currency, setCurrency]);

  // Convert base Toman to current display amount
  const toDisplayPrice = useCallback((baseToman: number | undefined | null): number => {
    if (baseToman === undefined || baseToman === null || isNaN(Number(baseToman))) return 0;
    return isRial ? Math.round(Number(baseToman) * 10) : Math.round(Number(baseToman));
  }, [isRial]);

  // Convert user input in current currency back to base Toman for saving
  const toBasePrice = useCallback((displayPrice: number | undefined | null): number => {
    if (displayPrice === undefined || displayPrice === null || isNaN(Number(displayPrice))) return 0;
    return isRial ? Math.round(Number(displayPrice) / 10) : Math.round(Number(displayPrice));
  }, [isRial]);

  // Format price string with commas and optional currency label
  const formatPrice = useCallback((amountInToman: number | undefined | null, showUnit = true): string => {
    if (amountInToman === undefined || amountInToman === null || isNaN(Number(amountInToman))) {
      return showUnit ? `۰ ${unitLabel}` : '۰';
    }
    const displayVal = toDisplayPrice(amountInToman);
    const formatted = formatNumber(displayVal);
    return showUnit ? `${formatted} ${unitLabel}` : formatted;
  }, [toDisplayPrice, unitLabel]);

  // Convert price to Persian words in currently active currency
  const priceToWords = useCallback((amountInToman: number | undefined | null): string => {
    if (amountInToman === undefined || amountInToman === null || isNaN(Number(amountInToman))) return '';
    const displayVal = toDisplayPrice(amountInToman);
    if (displayVal === 0) return 'صفر ' + unitLabel;
    const words = numberToPersianWords(displayVal);
    return `${words} ${unitLabel}`;
  }, [toDisplayPrice, unitLabel]);

  return (
    <CurrencyContext.Provider
      value={{
        currency,
        setCurrency,
        toggleCurrency,
        multiplier,
        unitLabel,
        isRial,
        formatPrice,
        priceToWords,
        toDisplayPrice,
        toBasePrice,
      }}
    >
      {children}
    </CurrencyContext.Provider>
  );
};

export const useCurrency = (): CurrencyContextType => {
  const context = useContext(CurrencyContext);
  if (!context) {
    throw new Error('useCurrency must be used within a CurrencyProvider');
  }
  return context;
};
