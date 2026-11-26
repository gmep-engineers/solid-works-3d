export interface CurrencyRate {
  code: string;
  name: string;
  symbol: string;
  rate_to_usd: number; // 1 USD = rate units of currency
  symbol_position: 'before' | 'after';
  country: string;
  flag: string;
}

export const DEFAULT_EXCHANGE_RATES: Record<string, CurrencyRate> = {
  USD: {
    code: 'USD',
    name: 'US Dollar',
    symbol: '$',
    rate_to_usd: 1.0,
    symbol_position: 'before',
    country: 'United States',
    flag: '🇺🇸',
  },
  CNY: {
    code: 'CNY',
    name: 'Chinese Yuan Renminbi',
    symbol: '¥',
    rate_to_usd: 7.24,
    symbol_position: 'before',
    country: 'China',
    flag: '🇨🇳',
  },
  JPY: {
    code: 'JPY',
    name: 'Japanese Yen',
    symbol: '¥',
    rate_to_usd: 154.5,
    symbol_position: 'before',
    country: 'Japan',
    flag: '🇯🇵',
  },
  EUR: {
    code: 'EUR',
    name: 'Euro',
    symbol: '€',
    rate_to_usd: 0.92,
    symbol_position: 'before',
    country: 'European Union',
    flag: '🇪🇺',
  },
  GBP: {
    code: 'GBP',
    name: 'British Pound',
    symbol: '£',
    rate_to_usd: 0.79,
    symbol_position: 'before',
    country: 'United Kingdom',
    flag: '🇬🇧',
  },
  CAD: {
    code: 'CAD',
    name: 'Canadian Dollar',
    symbol: 'CA$',
    rate_to_usd: 1.38,
    symbol_position: 'before',
    country: 'Canada',
    flag: '🇨🇦',
  },
};

export function convertToUsd(
  amountLocal: number,
  currencyCode: string,
  rates: Record<string, CurrencyRate> = DEFAULT_EXCHANGE_RATES,
): { amount_usd: number; rate: number } {
  const curr = rates[currencyCode?.toUpperCase()] || DEFAULT_EXCHANGE_RATES.USD;
  const rate = curr.rate_to_usd || 1.0;
  const amount_usd = Math.round((amountLocal / rate) * 100) / 100;
  return { amount_usd, rate };
}

export function convertFromUsd(
  amountUsd: number,
  targetCurrencyCode: string,
  rates: Record<string, CurrencyRate> = DEFAULT_EXCHANGE_RATES,
): { amount_local: number; rate: number; formatted: string } {
  const curr = rates[targetCurrencyCode?.toUpperCase()] || DEFAULT_EXCHANGE_RATES.USD;
  const rate = curr.rate_to_usd || 1.0;
  const amount_local = Math.round(amountUsd * rate * 100) / 100;
  const formatted =
    curr.symbol_position === 'before'
      ? `${curr.symbol}${amount_local.toLocaleString()} ${curr.code}`
      : `${amount_local.toLocaleString()}${curr.symbol} ${curr.code}`;
  return { amount_local, rate, formatted };
}
