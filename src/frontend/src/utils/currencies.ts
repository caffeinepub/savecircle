/**
 * Supported currencies for SaveCircle
 */
export interface Currency {
  code: string;
  symbol: string;
  name: string;
  locale: string;
}

export const CURRENCIES: Currency[] = [
  { code: "USD", symbol: "$", name: "US Dollar", locale: "en-US" },
  { code: "INR", symbol: "₹", name: "Indian Rupee", locale: "en-IN" },
  { code: "EUR", symbol: "€", name: "Euro", locale: "de-DE" },
  { code: "GBP", symbol: "£", name: "British Pound", locale: "en-GB" },
  { code: "AED", symbol: "د.إ", name: "UAE Dirham", locale: "ar-AE" },
  { code: "BDT", symbol: "৳", name: "Bangladeshi Taka", locale: "bn-BD" },
  { code: "PKR", symbol: "₨", name: "Pakistani Rupee", locale: "ur-PK" },
  { code: "NGN", symbol: "₦", name: "Nigerian Naira", locale: "en-NG" },
  { code: "KES", symbol: "KSh", name: "Kenyan Shilling", locale: "sw-KE" },
  { code: "GHS", symbol: "₵", name: "Ghanaian Cedi", locale: "en-GH" },
  { code: "ZAR", symbol: "R", name: "South African Rand", locale: "en-ZA" },
  { code: "MYR", symbol: "RM", name: "Malaysian Ringgit", locale: "ms-MY" },
  { code: "PHP", symbol: "₱", name: "Philippine Peso", locale: "en-PH" },
  { code: "IDR", symbol: "Rp", name: "Indonesian Rupiah", locale: "id-ID" },
  { code: "BRL", symbol: "R$", name: "Brazilian Real", locale: "pt-BR" },
  { code: "MXN", symbol: "MX$", name: "Mexican Peso", locale: "es-MX" },
  { code: "CAD", symbol: "CA$", name: "Canadian Dollar", locale: "en-CA" },
  { code: "AUD", symbol: "A$", name: "Australian Dollar", locale: "en-AU" },
  { code: "SGD", symbol: "S$", name: "Singapore Dollar", locale: "en-SG" },
  { code: "JPY", symbol: "¥", name: "Japanese Yen", locale: "ja-JP" },
];

export const DEFAULT_CURRENCY = CURRENCIES[0]; // USD

export function getCurrencyByCode(code: string): Currency {
  return CURRENCIES.find((c) => c.code === code) ?? DEFAULT_CURRENCY;
}

const STORAGE_KEY = "savecircle_currency";

export function loadStoredCurrency(): Currency {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored) as { code: string };
      return getCurrencyByCode(parsed.code);
    }
  } catch {
    // ignore
  }
  return DEFAULT_CURRENCY;
}

export function storeCurrency(currency: Currency): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify({ code: currency.code }));
}
