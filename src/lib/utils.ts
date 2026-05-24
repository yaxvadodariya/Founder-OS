import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { useStore } from '../store/useStore';

export const CURRENCIES = [
  { code: 'USD', name: 'US Dollar', symbol: '$', locale: 'en-US', flag: '🇺🇸' },
  { code: 'INR', name: 'Indian Rupee', symbol: '₹', locale: 'en-IN', flag: '🇮🇳' },
  { code: 'EUR', name: 'Euro', symbol: '€', locale: 'en-DE', flag: '🇪🇺' },
  { code: 'GBP', name: 'British Pound', symbol: '£', locale: 'en-GB', flag: '🇬🇧' },
  { code: 'AUD', name: 'Australian Dollar', symbol: 'A$', locale: 'en-AU', flag: '🇦🇺' },
  { code: 'CAD', name: 'Canadian Dollar', symbol: 'C$', locale: 'en-CA', flag: '🇨🇦' },
  { code: 'SGD', name: 'Singapore Dollar', symbol: 'S$', locale: 'en-SG', flag: '🇸🇬' },
  { code: 'AED', name: 'UAE Dirham', symbol: 'د.إ', locale: 'ar-AE', flag: '🇦🇪' },
];

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number) {
  const currencyCode = useStore.getState().currency || 'USD';
  const currency = CURRENCIES.find(c => c.code === currencyCode) || CURRENCIES[0];
  
  return new Intl.NumberFormat(currency.locale, {
    style: 'currency',
    currency: currency.code,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatCurrencyPDF(amount: number) {
  const currencyCode = useStore.getState().currency || 'USD';
  const currency = CURRENCIES.find(c => c.code === currencyCode) || CURRENCIES[0];
  
  const numberPart = new Intl.NumberFormat(currency.locale, {
    maximumFractionDigits: 0,
  }).format(amount);
  
  if (currencyCode === 'INR') {
    return `Rs. ${numberPart}`;
  }
  if (currencyCode === 'AED') {
    return `AED ${numberPart}`;
  }
  if (currencyCode === 'USD') {
    return `$${numberPart}`;
  }
  if (currencyCode === 'EUR') {
    return `€${numberPart}`;
  }
  if (currencyCode === 'GBP') {
    return `£${numberPart}`;
  }
  return `${currency.symbol}${numberPart}`;
}
