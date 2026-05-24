"use client";

import Link from "next/link";
import { useState } from "react";
import { Search, Bell, User, Plus, Menu, X, Gem, Vault } from "lucide-react";
import { CurrencySelector } from "./CurrencySelector";

type AllCurrencyCode = "USD" | "EUR" | "GBP" | "CAD" | "AUD" | "JPY" | "SGD" | "ETH" | "SOL" | "SKL";

interface NavbarProps {
  currency: AllCurrencyCode;
  onCurrencyChange: (c: AllCurrencyCode) => void;
}

export function Navbar({ currency, onCurrencyChange }: NavbarProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchFocused, setSearchFocused] = useState(false);

  return (
    <header className="sticky top-0 z-40 border-b border-[#1e1e2e] bg-[#0a0a0f]/90 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center gap-4">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 shrink-0 mr-2">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#7c3aed] to-[#60efff] flex items-center justify-center">
            <Gem size={16} className="text-white" />
          </div>
          <span className="text-lg font-bold text-[#f8f8ff] hidden sm:block">
            Skill<span className="text-[#7c3aed]">scale</span>
          </span>
        </Link>

        {/* Nav links */}
        <nav className="hidden md:flex items-center gap-1">
          {[
            { href: "/marketplace", label: "Marketplace" },
            { href: "/vault", label: "Vault" },
            { href: "/submit", label: "Submit Skill" },
          ].map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="px-3 py-2 rounded-lg text-sm text-[#8b8ba7] hover:text-[#f8f8ff] hover:bg-[#1e1e2e] transition-colors"
            >
              {l.label}
            </Link>
          ))}
        </nav>

        {/* Search */}
        <div
          className={`flex-1 max-w-md hidden sm:flex items-center gap-2 px-3 py-2 rounded-xl border transition-all ${
            searchFocused ? "border-[#7c3aed] bg-[#12121a]" : "border-[#1e1e2e] bg-[#12121a]"
          }`}
        >
          <Search size={15} className="text-[#8b8ba7] shrink-0" />
          <input
            type="text"
            placeholder="Search skills…"
            className="flex-1 bg-transparent text-sm text-[#f8f8ff] placeholder-[#8b8ba7] outline-none"
            onFocus={() => setSearchFocused(true)}
            onBlur={() => setSearchFocused(false)}
          />
        </div>

        <div className="ml-auto flex items-center gap-2">
          <CurrencySelector value={currency} onChange={onCurrencyChange} />

          <Link
            href="/vault"
            className="hidden md:flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#1e1e2e] text-[#8b8ba7] hover:text-[#f8f8ff] text-sm font-medium border border-[#2e2e4e] hover:border-[#7c3aed] transition-colors"
          >
            <Vault size={15} />
            Vault
          </Link>

          <Link
            href="/submit"
            className="hidden md:flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#7c3aed] text-white text-sm font-medium hover:bg-[#6d28d9] transition-colors"
          >
            <Plus size={15} />
            List Skill
          </Link>

          <button className="p-2 rounded-lg hover:bg-[#1e1e2e] text-[#8b8ba7] hover:text-[#f8f8ff] transition-colors">
            <Bell size={18} />
          </button>

          <Link
            href="/profile/me"
            className="p-2 rounded-lg hover:bg-[#1e1e2e] text-[#8b8ba7] hover:text-[#f8f8ff] transition-colors"
          >
            <User size={18} />
          </Link>

          <button
            className="md:hidden p-2 rounded-lg hover:bg-[#1e1e2e] text-[#8b8ba7] hover:text-[#f8f8ff] transition-colors"
            onClick={() => setMobileOpen(!mobileOpen)}
          >
            {mobileOpen ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden border-t border-[#1e1e2e] bg-[#0a0a0f] px-4 py-3 space-y-1">
          <div className="flex items-center gap-2 px-3 py-2 rounded-xl border border-[#1e1e2e] bg-[#12121a] mb-3">
            <Search size={15} className="text-[#8b8ba7]" />
            <input
              type="text"
              placeholder="Search skills…"
              className="flex-1 bg-transparent text-sm text-[#f8f8ff] placeholder-[#8b8ba7] outline-none"
            />
          </div>
          {[
            { href: "/marketplace", label: "Marketplace" },
            { href: "/vault", label: "Vault" },
            { href: "/submit", label: "Submit Skill" },
            { href: "/profile/me", label: "Profile" },
          ].map((l) => (
            <Link
              key={l.href}
              href={l.href}
              onClick={() => setMobileOpen(false)}
              className="block px-3 py-2.5 rounded-lg text-sm text-[#8b8ba7] hover:text-[#f8f8ff] hover:bg-[#1e1e2e] transition-colors"
            >
              {l.label}
            </Link>
          ))}
        </div>
      )}
    </header>
  );
}
