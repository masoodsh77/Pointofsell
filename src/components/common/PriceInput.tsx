import React, { useState, useEffect, useRef } from 'react';
import { toEnglishDigits, toPersianDigits, numberToPersianWords, formatCurrency } from '../../utils/persian';

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
}

export const PriceInput: React.FC<PriceInputProps> = ({
  value,
  onChange,
  placeholder = 'مبلغ به تومان',
  className = '',
  id,
  name,
  required = false,
  disabled = false,
  autoFocus = false,
  showInWords = true,
  unitLabel = 'تومان',
  min = 0,
  max,
  allowNegative = false,
}) => {
  const inputRef = useRef<HTMLInputElement>(null);

  // Helper to format a number into comma separated string
  const formatVal = (val: number | undefined | null): string => {
    if (val === undefined || val === null || isNaN(val)) return '';
    if (val === 0) return '';
    return val.toLocaleString('en-US');
  };

  const [displayValue, setDisplayValue] = useState<string>(() => formatVal(value));

  // Synchronize when value changes externally
  useEffect(() => {
    const currentNumeric = parseInt(toEnglishDigits(displayValue).replace(/[^\d-]/g, ''), 10) || 0;
    const incomingNumeric = value || 0;
    if (currentNumeric !== incomingNumeric) {
      setDisplayValue(formatVal(value));
    }
  }, [value]);

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

    let finalVal = numVal;
    if (max !== undefined && finalVal > max) {
      finalVal = max;
    }

    const formatted = finalVal.toLocaleString('en-US');
    setDisplayValue(formatted);
    onChange(finalVal);

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

  const numericValue = value ? Math.round(value) : 0;
  const words = numericValue !== 0 ? numberToPersianWords(numericValue) : '';

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
          placeholder={placeholder}
          className={`w-full font-mono font-bold text-left tracking-wide pl-3 pr-14 ${className}`}
        />
        {unitLabel && (
          <span className="absolute right-3 text-[11px] font-bold text-slate-400 pointer-events-none select-none">
            {unitLabel}
          </span>
        )}
      </div>

      {showInWords && words && numericValue > 0 && (
        <div className="text-[10px] text-amber-400/90 font-medium truncate pr-1 flex items-center gap-1">
          <span>به حروف:</span>
          <span className="text-slate-200">{words} {unitLabel}</span>
        </div>
      )}
    </div>
  );
};
