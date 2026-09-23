import React, { useState, useEffect, useRef } from 'react';
import { toEnglishDigits, toPersianDigits, numberToPersianWords, formatCurrency } from '../../utils/persian';
import { useCurrency } from '../../context/CurrencyContext';

export interface PriceInputProps {
  value: number | undefined | null;
  onChange: (val: number) => void;
  placeholder?: string;
  className?: string;
  id?: string;
  name?: string;
  required?: boolean;
  disabled?: boolean;
  autoFocus?: boolean;
  showInWords?: boolean;
  unitLabel?: string;
  min?: number;
  max?: number;
  allowNegative?: boolean;
  convertCurrency?: boolean; // When true, converts base Toman to Rial (x10) and vice-versa
}

export const PriceInput: React.FC<PriceInputProps> = ({
  value,
  onChange,
  placeholder,
  className = '',
  id,
  name,
  required = false,
  disabled = false,
  autoFocus = false,
  showInWords = true,
  unitLabel,
  min = 0,
  max,
  allowNegative = false,
  convertCurrency = true,
}) => {
  let currencyCtx: ReturnType<typeof useCurrency> | null = null;
  try {
    currencyCtx = useCurrency();
  } catch (_) {
    currencyCtx = null;
  }

  const isRial = convertCurrency && currencyCtx ? currencyCtx.isRial : false;
  const currentUnit = currencyCtx ? currencyCtx.unitLabel : 'تومان';
  const effectiveUnitLabel = unitLabel !== undefined ? unitLabel : currentUnit;
  const effectivePlaceholder = placeholder || (isRial ? 'مبلغ به ریال' : 'مبلغ به تومان');

  const inputRef = useRef<HTMLInputElement>(null);

  // Helper to format display value
  const toDisplay = (val: number | undefined | null): number => {
    if (val === undefined || val === null || isNaN(val)) return 0;
    return isRial ? Math.round(val * 10) : Math.round(val);
  };

  const formatVal = (val: number | undefined | null): string => {
    const disp = toDisplay(val);
    if (!disp) return '';
    return disp.toLocaleString('en-US');
  };

  const [displayValue, setDisplayValue] = useState<string>(() => formatVal(value));

  // Synchronize when value or currency changes externally
  useEffect(() => {
    const currentNumeric = parseInt(toEnglishDigits(displayValue).replace(/[^\d-]/g, ''), 10) || 0;
    const targetNumeric = toDisplay(value);
    if (currentNumeric !== targetNumeric) {
      setDisplayValue(formatVal(value));
    }
  }, [value, isRial]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.target;
    const raw = input.value;
    const cursorPosition = input.selectionStart || 0;

    // Count non-comma characters before cursor
    const rawBeforeCursor = raw.slice(0, cursorPosition).replace(/,/g, '');
    const digitsBeforeCursor = toEnglishDigits(rawBeforeCursor).replace(/[^\d-]/g, '').length;

    // Convert Persian/Arabic digits to English digits
    let cleaned = toEnglishDigits(raw);

    if (allowNegative) {
      if (cleaned === '-') {
        setDisplayValue('-');
        return;
      }
      const isNeg = cleaned.startsWith('-');
      cleaned = (isNeg ? '-' : '') + cleaned.replace(/[^\d]/g, '');
    } else {
      cleaned = cleaned.replace(/[^\d]/g, '');
    }

    if (!cleaned || cleaned === '-') {
      setDisplayValue('');
      onChange(0);
      return;
    }

    const numVal = parseInt(cleaned, 10);
    if (isNaN(numVal)) {
      setDisplayValue('');
      onChange(0);
      return;
    }

    let finalDisplayVal = numVal;
    if (max !== undefined && finalDisplayVal > max) {
      finalDisplayVal = max;
    }

    const formatted = finalDisplayVal.toLocaleString('en-US');
    setDisplayValue(formatted);

    // Convert display value back to base Toman for parent component
    const parentVal = isRial ? Math.round(finalDisplayVal / 10) : finalDisplayVal;
    onChange(parentVal);

    // Reposition cursor naturally
    requestAnimationFrame(() => {
      if (!inputRef.current) return;
      let newCursor = formatted.length;
      let countedDigits = 0;
      for (let i = 0; i < formatted.length; i++) {
        if (formatted[i] !== ',') {
          countedDigits++;
        }
        if (countedDigits >= digitsBeforeCursor) {
          newCursor = i + 1;
          break;
        }
      }
      inputRef.current.setSelectionRange(newCursor, newCursor);
    });
  };

  const currentDisplayNumeric = toDisplay(value);
  const words = currentDisplayNumeric !== 0 ? numberToPersianWords(currentDisplayNumeric) : '';

  return (
    <div className="w-full space-y-1">
      <div className="relative flex items-center">
        <input
          ref={inputRef}
          id={id}
          name={name}
          type="text"
          inputMode="numeric"
          dir="ltr"
          required={required}
          disabled={disabled}
          autoFocus={autoFocus}
          value={displayValue}
          onChange={handleChange}
          placeholder={effectivePlaceholder}
          className={`w-full font-mono font-bold text-left tracking-wide pl-3 pr-14 ${className}`}
        />
        {effectiveUnitLabel && (
          <span className="absolute right-3 text-[11px] font-bold text-slate-400 pointer-events-none select-none">
            {effectiveUnitLabel}
          </span>
        )}
      </div>

      {showInWords && words && currentDisplayNumeric > 0 && (
        <div className="text-[10px] text-amber-400/90 font-medium truncate pr-1 flex items-center gap-1">
          <span>به حروف:</span>
          <span className="text-slate-200">{words} {effectiveUnitLabel}</span>
        </div>
      )}
    </div>
  );
};
