/**
 * Formatting utilities for SaveCircle
 */

import type { Currency } from "@/utils/currencies";

/**
 * Format a number as currency using the provided currency object.
 * Falls back to USD if no currency is given.
 */
export function formatCurrency(amount: number, currency?: Currency): string {
  const code = currency?.code ?? "USD";
  const locale = currency?.locale ?? "en-US";
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency: code,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

/**
 * Convert bigint nanoseconds to a Date object
 */
export function bigintNsToDate(ns: bigint): Date {
  return new Date(Number(ns / 1_000_000n));
}

/**
 * Format bigint nanoseconds as a locale date string
 */
export function formatDate(ns: bigint): string {
  return bigintNsToDate(ns).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

/**
 * Format bigint nanoseconds as a short date
 */
export function formatShortDate(ns: bigint): string {
  return bigintNsToDate(ns).toLocaleDateString("en-US", {
    month: "short",
    year: "numeric",
  });
}

/**
 * Get month name from month number (1-12)
 */
export function getMonthName(month: number): string {
  return new Date(2000, month - 1, 1).toLocaleString("en-US", {
    month: "long",
  });
}

/**
 * Get abbreviated month name
 */
export function getMonthShort(month: number): string {
  return new Date(2000, month - 1, 1).toLocaleString("en-US", {
    month: "short",
  });
}

/**
 * Format month/year from bigints
 */
export function formatMonthYear(month: bigint, year: bigint): string {
  return `${getMonthName(Number(month))} ${Number(year)}`;
}

/**
 * Get current month and year
 */
export function getCurrentMonthYear(): { month: number; year: number } {
  const now = new Date();
  return { month: now.getMonth() + 1, year: now.getFullYear() };
}

/**
 * Format a percentage: 12.5%
 */
export function formatPercent(rate: number): string {
  return `${rate.toFixed(1)}%`;
}
