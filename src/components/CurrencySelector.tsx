"use client";

import { useState } from "react";
import { ChevronUp } from "lucide-react";
import { SUPPORTED_CURRENCIES } from "@/lib/stripe";

type AllCurrencyCode = "USD" | "EUR" | "GBP" | "CAD" | "AUD" | "JPY" | "SGD" | "ETH" | "SOL" | "SKL";

interface CurrencySelectorProps {
  value: AllCurrencyCode;
  onChange: (currency: AllCurrencyCode) => void;
}

const CRYPTO_CURRENCIES = [
  { code: "ETH", symbol: "Ξ", flag: "⟠", name: "Ethereum" },
  { code: "SOL", symbol: "◎", flag: "◎", name: "Solana" },
  { code: "SKL", symbol: "◆", flag: "💎", name: "SKL Token" },
] as const;

export function CurrencySelector({ value, onChange }: CurrencySelectorProps) {
  const [open, setOpen] = useState(false);

  const current =
    [...SUPPORTED_CURRENCIES, ...CRYPTO_CURRENCIES].find((c) => c.code === value) ??
    SUPPORTED_CURRENCIES[0];

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#12121a] border border-[#1e1e2e] hover:border-[#2e2e4e] transition-colors text-sm"
      >
        <span>{current.flag}</span>
        <span className="text-[#f8f8ff] font-medium">{current.code}</span>
        <ChevronUp
          size={14}
          className={`text-[#8b8ba7] transition-transform ${open ? "" : "rotate-180"}`}
        />
      </button>

      {open && (
        <div className="absolute bottom-full mb-2 right-0 w-56 bg-[#12121a] border border-[#1e1e2e] rounded-xl shadow-2xl overflow-hidden z-50">
          <div className="p-2">
            <div className="text-xs text-[#8b8ba7] uppercase tracking-wider px-2 py-1.5">
              Fiat Currencies
            </div>
            {SUPPORTED_CURRENCIES.map((c) => (
              <button
                key={c.code}
                onClick={() => { onChange(c.code as AllCurrencyCode); setOpen(false); }}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                  value === c.code
                    ? "bg-[#7c3aed20] text-[#f8f8ff]"
                    : "text-[#8b8ba7] hover:bg-[#1e1e2e] hover:text-[#f8f8ff]"
                }`}
              >
                <span className="text-base">{c.flag}</span>
                <span className="font-medium">{c.code}</span>
                <span className="ml-auto text-xs opacity-60">{c.name}</span>
              </button>
            ))}

            <div className="h-px bg-[#1e1e2e] my-2" />
            <div className="text-xs text-[#8b8ba7] uppercase tracking-wider px-2 py-1.5">
              Crypto
            </div>
            {CRYPTO_CURRENCIES.map((c) => (
              <button
                key={c.code}
                onClick={() => { onChange(c.code as AllCurrencyCode); setOpen(false); }}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                  value === c.code
                    ? "bg-[#7c3aed20] text-[#f8f8ff]"
                    : "text-[#8b8ba7] hover:bg-[#1e1e2e] hover:text-[#f8f8ff]"
                }`}
              >
                <span className="text-base">{c.flag}</span>
                <span className="font-medium">{c.code}</span>
                <span className="ml-auto text-xs opacity-60">{c.name}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
