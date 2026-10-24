'use client';

import { createContext, useContext, useState, type ReactNode } from 'react';

interface CurrencyContextValue {
  currency: string;
  setCurrency: (code: string) => void;
  formatAmount: (amount: number) => string;
  currencies: typeof CURRENCIES;
}

export const CURRENCIES = [
  { code: 'USD', symbol: '$', name: 'US Dollar' },
  { code: 'EUR', symbol: '€', name: 'Euro' },
  { code: 'GBP', symbol: '£', name: 'British Pound' },
  { code: 'PKR', symbol: '₨', name: 'Pakistani Rupee' },
  { code: 'INR', symbol: '₹', name: 'Indian Rupee' },
  { code: 'AED', symbol: 'د.إ', name: 'UAE Dirham' },
  { code: 'CAD', symbol: 'C$', name: 'Canadian Dollar' },
  { code: 'AUD', symbol: 'A$', name: 'Australian Dollar' },
];

const RATES: Record<string, number> = {
  USD: 1,
  EUR: 0.92,
  GBP: 0.79,
  PKR: 278.5,
  INR: 83.2,
  AED: 3.67,
  CAD: 1.36,
  AUD: 1.53,
};

const CurrencyContext = createContext<CurrencyContextValue | undefined>(undefined);

export function CurrencyProvider({ children }: { children: ReactNode }) {
  const [currency, setCurrencyState] = useState<string>('USD');

  // localStorage is only available after mount; initialize lazily.
  useState(() => {
    if (typeof window !== 'undefined') {
      const saved = window.localStorage.getItem('selectedCurrency');
      if (saved) setCurrencyState(saved);
    }
  });

  const setCurrency = (code: string) => {
    setCurrencyState(code);
    window.localStorage.setItem('selectedCurrency', code);
  };

  const formatAmount = (amount: number) => {
    const meta = CURRENCIES.find((c) => c.code === currency) ?? CURRENCIES[0];
    const converted = amount * (RATES[currency] || 1);
    if (currency === 'PKR' || currency === 'INR') return `${meta.symbol}${converted.toFixed(0)}`;
    return `${meta.symbol}${converted.toFixed(2)}`;
  };

  return (
    <CurrencyContext.Provider value={{ currency, setCurrency, formatAmount, currencies: CURRENCIES }}>
      {children}
    </CurrencyContext.Provider>
  );
}

export function useCurrency() {
  const ctx = useContext(CurrencyContext);
  if (!ctx) throw new Error('useCurrency must be used within CurrencyProvider');
  return ctx;
}
