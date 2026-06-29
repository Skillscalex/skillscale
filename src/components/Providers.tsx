"use client";

import { useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Navbar } from "./Navbar";
import { CurrencySelector } from "./CurrencySelector";
import { AuthProvider } from "./AuthProvider";

type AllCurrencyCode = "USD" | "EUR" | "GBP" | "CAD" | "AUD" | "JPY" | "SGD" | "ETH" | "SOL" | "SKL";

// Simple global currency state via context
import { createContext, useContext } from "react";

const CurrencyContext = createContext<{
  currency: AllCurrencyCode;
  setCurrency: (c: AllCurrencyCode) => void;
}>({ currency: "USD", setCurrency: () => {} });

export function useCurrency() {
  return useContext(CurrencyContext);
}

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient());
  const [currency, setCurrency] = useState<AllCurrencyCode>("USD");

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <CurrencyContext.Provider value={{ currency, setCurrency }}>
          <Navbar currency={currency} onCurrencyChange={setCurrency} />
          <main className="flex-1">{children}</main>
          <CurrencyBar currency={currency} onChange={setCurrency} />
        </CurrencyContext.Provider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

function CurrencyBar({ currency, onChange }: { currency: AllCurrencyCode; onChange: (c: AllCurrencyCode) => void }) {
  return (
    <div className="sticky bottom-0 z-30 border-t border-[#1e1e2e] bg-[#0a0a0f]/95 backdrop-blur-xl px-4 py-2">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <span className="text-xs text-[#8b8ba7]">
          All prices shown in
        </span>
        <CurrencySelector value={currency} onChange={onChange} />
      </div>
    </div>
  );
}
