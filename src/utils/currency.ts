/**
 * Format currency in Malawian Kwacha (MWK)
 * @param amount - The amount to format
 * @param includeSymbol - Whether to include the MWK symbol
 * @returns Formatted currency string
 */
export const formatMWK = (amount: number, includeSymbol: boolean = true): string => {
  const formatted = amount.toLocaleString('en-MW', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });
  
  return includeSymbol ? `MWK ${formatted}` : formatted;
};

/**
 * Parse MWK currency string to number
 * @param currencyString - String like "MWK 5,000" or "5000"
 * @returns Parsed number
 */
export const parseMWK = (currencyString: string): number => {
  const cleaned = currencyString.replace(/[^\d.-]/g, '');
  return parseFloat(cleaned) || 0;
};

/**
 * Validate MWK amount
 * @param amount - Amount to validate
 * @returns Whether the amount is valid
 */
export const isValidMWKAmount = (amount: number): boolean => {
  return !isNaN(amount) && amount >= 0 && amount <= 999999999;
};
