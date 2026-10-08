import React, { useRef } from 'react';
import { formatMoney, parseMoney } from '../../utils/formatters';

interface MoneyInputProps {
  value: number | string;
  onChange: (numericValue: number) => void;
  placeholder?: string;
  className?: string;
  suffix?: string;
  disabled?: boolean;
}

export const MoneyInput: React.FC<MoneyInputProps> = ({
  value,
  onChange,
  placeholder = "0",
  className = "",
  suffix,
  disabled = false,
}) => {
  const inputRef = useRef<HTMLInputElement>(null);

  const numVal = typeof value === 'string' ? parseMoney(value) : (value || 0);
  const displayVal = numVal > 0 ? formatMoney(numVal) : '';

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawDigits = e.target.value.replace(/\D/g, '');
    const parsed = rawDigits ? parseInt(rawDigits, 10) : 0;
    onChange(parsed);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && inputRef.current) {
      const { selectionStart, selectionEnd, value: currentVal } = inputRef.current;
      
      // If single cursor position and character right before it is a space
      if (selectionStart !== null && selectionStart === selectionEnd && selectionStart > 0) {
        if (currentVal[selectionStart - 1] === ' ') {
          e.preventDefault();
          // Remove the digit before the space
          const before = currentVal.slice(0, selectionStart - 2);
          const after = currentVal.slice(selectionStart);
          const newRaw = (before + after).replace(/\D/g, '');
          const parsed = newRaw ? parseInt(newRaw, 10) : 0;
          onChange(parsed);

          setTimeout(() => {
            if (inputRef.current) {
              const newPos = Math.max(0, selectionStart - 2);
              inputRef.current.setSelectionRange(newPos, newPos);
            }
          }, 0);
        }
      }
    }
  };

  return (
    <div className={`relative flex items-center ${className}`}>
      <input
        ref={inputRef}
        type="text"
        inputMode="numeric"
        disabled={disabled}
        placeholder={placeholder}
        value={displayVal}
        onChange={handleInputChange}
        onKeyDown={handleKeyDown}
        className="w-full px-3 py-2 rounded-xl bg-surface-container-lowest border border-surface-container-highest text-white font-mono font-bold focus:outline-none focus:border-primary text-right"
      />
      {suffix && (
        <span className="absolute right-3 text-xs text-on-surface-variant pointer-events-none select-none">
          {suffix}
        </span>
      )}
    </div>
  );
};
