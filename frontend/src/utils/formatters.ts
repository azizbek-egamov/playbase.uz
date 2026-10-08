/**
 * Utility functions for formatting money (thousands space separators) and phone numbers (+998 prefix)
 */

/**
 * Format a number or numeric string to space-separated thousands: e.g. 1000000 -> "1 000 000"
 */
export const formatMoney = (val: number | string | undefined | null): string => {
  if (val === undefined || val === null || val === '') return '';
  const numStr = val.toString().replace(/\D/g, '');
  if (!numStr) return '';
  return numStr.replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
};

/**
 * Safely convert Django DecimalField (which comes as string in JSON) to a formatted number string.
 * Handles both number and string inputs. e.g. "390000.00" or 390000 → "390 000"
 */
export const formatAmount = (val: number | string | undefined | null): string => {
  if (val === undefined || val === null || val === '') return '0';
  const num = Number(val);
  if (isNaN(num)) return '0';
  return Math.round(num).toLocaleString('uz-UZ');
};

/**
 * Convert Django DecimalField string to number safely
 */
export const toNum = (val: number | string | undefined | null): number => {
  if (val === undefined || val === null) return 0;
  const num = Number(val);
  return isNaN(num) ? 0 : num;
};

/**
 * Parse a space-separated money string back into a numeric value
 */
export const parseMoney = (formattedVal: string): number => {
  const clean = formattedVal.replace(/\s+/g, '').replace(/[^\d]/g, '');
  return clean ? parseInt(clean, 10) : 0;
};

/**
 * Format Uzbekistan phone number with fixed prefix and groups: +998 (90) 123-45-67
 * Returns empty string if no local digits are provided, allowing clean deletion.
 */
export const formatUzPhone = (val: string): string => {
  if (!val) return '';

  // Extract all digits
  let digits = val.replace(/\D/g, '');

  // If user typed 998 at start, remove it to extract the local digits
  if (digits.startsWith('998')) {
    digits = digits.slice(3);
  }

  // If no local digits are left, return empty string so input can be cleared completely
  if (!digits || digits.length === 0) {
    return '';
  }

  // Limit to 9 digits (local Uzbek phone number)
  digits = digits.slice(0, 9);

  let formatted = '+998';
  if (digits.length > 0) {
    formatted += ' (' + digits.slice(0, 2);
  }
  if (digits.length >= 2) {
    formatted += ') ';
  }
  if (digits.length > 2) {
    formatted += digits.slice(2, 5);
  }
  if (digits.length >= 5) {
    formatted += '-' + digits.slice(5, 7);
  }
  if (digits.length >= 7) {
    formatted += '-' + digits.slice(7, 9);
  }

  return formatted;
};

/**
 * Extract clean international phone string for API: +998901234567
 * Returns undefined if incomplete or empty (prevents sending partial invalid numbers like +99899)
 */
export const cleanUzPhone = (formattedVal: string | undefined | null): string | undefined => {
  if (!formattedVal) return undefined;
  let digits = formattedVal.replace(/\D/g, '');
  if (digits.startsWith('998')) {
    digits = digits.slice(3);
  }
  // Must have exactly 9 local digits for a valid Uzbekistan mobile number
  if (digits.length !== 9) {
    return undefined;
  }
  return '+998' + digits;
};
