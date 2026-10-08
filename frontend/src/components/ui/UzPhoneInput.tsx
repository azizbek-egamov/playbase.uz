import React, { useRef } from 'react';
import { triggerHaptic } from '../../utils/haptics';

interface UzPhoneInputProps {
  value: string; // e.g., "+998901234567", "901234567", or formatted
  onChange: (formattedFull: string, rawDigits: string) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  autoFocus?: boolean;
}

/**
 * Formats 9 local digits into "XX XXX XX XX"
 */
export const formatLocalPhoneDigits = (raw: string): string => {
  const digits = raw.replace(/\D/g, '').slice(0, 9);
  if (!digits) return '';

  let res = digits.slice(0, 2);
  if (digits.length > 2) res += ' ' + digits.slice(2, 5);
  if (digits.length > 5) res += ' ' + digits.slice(5, 7);
  if (digits.length > 7) res += ' ' + digits.slice(7, 9);
  return res;
};

export const UzPhoneInput: React.FC<UzPhoneInputProps> = ({
  value,
  onChange,
  placeholder = "90 123 45 67",
  className = "",
  disabled = false,
  autoFocus = false,
}) => {
  const inputRef = useRef<HTMLInputElement>(null);

  // Extract just the 9 local digits from whatever value is passed
  let localDigits = (value || '').replace(/\D/g, '');
  if (localDigits.startsWith('998')) {
    localDigits = localDigits.slice(3);
  }
  localDigits = localDigits.slice(0, 9);

  const displayValue = formatLocalPhoneDigits(localDigits);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let inputVal = e.target.value;

    // Extract all digits
    let digits = inputVal.replace(/\D/g, '');
    if (digits.startsWith('998')) {
      digits = digits.slice(3);
    }
    digits = digits.slice(0, 9);

    const fullFormatted = digits ? `+998${digits}` : '';
    onChange(fullFormatted, digits);
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
          const newRaw = (before + after).replace(/\D/g, '').slice(0, 9);
          
          const fullFormatted = newRaw ? `+998${newRaw}` : '';
          onChange(fullFormatted, newRaw);

          // Restore cursor position
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

  const handleClear = () => {
    triggerHaptic('light');
    onChange('', '');
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  return (
    <div
      className={`flex items-center rounded-2xl bg-surface-container-lowest border border-surface-container-highest focus-within:border-primary transition-all overflow-hidden ${
        disabled ? 'opacity-50 pointer-events-none' : ''
      } ${className}`}
    >
      {/* Fixed non-editable Uzbekistan prefix */}
      <div className="flex items-center gap-1.5 pl-3.5 pr-2.5 py-2.5 bg-surface-container border-r border-surface-container-highest/60 select-none shrink-0">
        <span className="text-sm">🇺🇿</span>
        <span className="font-mono font-bold text-white text-sm tracking-wide">+998</span>
      </div>

      {/* Local 9-digit input with auto spacing */}
      <div className="relative flex-1 flex items-center">
        <input
          ref={inputRef}
          type="tel"
          inputMode="numeric"
          pattern="[0-9]*"
          autoFocus={autoFocus}
          disabled={disabled}
          placeholder={placeholder}
          value={displayValue}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          className="w-full px-3 py-2.5 bg-transparent text-white font-mono font-bold text-sm tracking-wider placeholder:text-on-surface-variant/40 focus:outline-none"
        />

        {/* Clear Button */}
        {localDigits.length > 0 && (
          <button
            type="button"
            onClick={handleClear}
            className="mr-2.5 w-6 h-6 rounded-full bg-surface-container-highest hover:bg-surface-bright flex items-center justify-center text-on-surface-variant hover:text-white transition-colors active:scale-90 shrink-0"
            title="Tozalash"
          >
            <span className="material-symbols-outlined text-xs">close</span>
          </button>
        )}
      </div>
    </div>
  );
};
