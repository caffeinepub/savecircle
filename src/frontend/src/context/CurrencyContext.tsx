import {
  type Currency,
  loadStoredCurrency,
  storeCurrency,
} from "@/utils/currencies";
import { createContext, useContext, useState } from "react";

interface CurrencyContextValue {
  currency: Currency;
  setCurrency: (currency: Currency) => void;
}

const CurrencyContext = createContext<CurrencyContextValue | null>(null);

export function CurrencyProvider({ children }: { children: React.ReactNode }) {
  const [currency, setCurrencyState] = useState<Currency>(loadStoredCurrency);

  function setCurrency(newCurrency: Currency) {
    storeCurrency(newCurrency);
    setCurrencyState(newCurrency);
  }

  return (
    <CurrencyContext.Provider value={{ currency, setCurrency }}>
      {children}
    </CurrencyContext.Provider>
  );
}

export function useCurrency(): CurrencyContextValue {
  const ctx = useContext(CurrencyContext);
  if (!ctx) throw new Error("useCurrency must be used inside CurrencyProvider");
  return ctx;
}
