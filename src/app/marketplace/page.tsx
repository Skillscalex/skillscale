"use client";

import { useState, useMemo } from "react";
import { Search, SlidersHorizontal, X } from "lucide-react";
import { SkillCard } from "@/components/SkillCard";
import { GemBadge } from "@/components/GemBadge";
import { MOCK_SKILLS, CATEGORIES } from "@/lib/mock-data";
import { useCurrency } from "@/components/Providers";
import type { GemTier } from "@/types/skill";

const GEM_TIERS: GemTier[] = ["diamond", "emerald", "pearl", "quartz", "coal"];
const SORT_OPTIONS = [
  { value: "trending", label: "Trending" },
  { value: "newest", label: "Newest" },
  { value: "price_asc", label: "Price: Low to High" },
  { value: "price_desc", label: "Price: High to Low" },
  { value: "score", label: "Secure Score" },
  { value: "downloads", label: "Most Downloaded" },
];

export default function MarketplacePage() {
  const { currency } = useCurrency();
  const [search, setSearch] = useState("");
  const [selectedTiers, setSelectedTiers] = useState<GemTier[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [sort, setSort] = useState("trending");
  const [freeOnly, setFreeOnly] = useState(false);
  const [mintedOnly, setMintedOnly] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const filtered = useMemo(() => {
    let skills = [...MOCK_SKILLS];

    if (search) {
      const q = search.toLowerCase();
      skills = skills.filter(
        (s) =>
          s.title.toLowerCase().includes(q) ||
          s.description.toLowerCase().includes(q) ||
          s.tags.some((t) => t.toLowerCase().includes(q))
      );
    }

    if (selectedTiers.length > 0) {
      skills = skills.filter((s) => selectedTiers.includes(s.gem_tier));
    }

    if (selectedCategories.length > 0) {
      skills = skills.filter((s) => selectedCategories.includes(s.category));
    }

    if (freeOnly) skills = skills.filter((s) => s.is_free);
    if (mintedOnly) skills = skills.filter((s) => s.is_minted);

    skills.sort((a, b) => {
      switch (sort) {
        case "newest": return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        case "price_asc": return (a.price_usd) - (b.price_usd);
        case "price_desc": return (b.price_usd) - (a.price_usd);
        case "score": return (b.secure_score ?? 0) - (a.secure_score ?? 0);
        case "downloads": return b.downloads - a.downloads;
        default: return (b.volume_24h ?? 0) - (a.volume_24h ?? 0);
      }
    });

    return skills;
  }, [search, selectedTiers, selectedCategories, sort, freeOnly, mintedOnly]);

  function toggleTier(tier: GemTier) {
    setSelectedTiers((prev) =>
      prev.includes(tier) ? prev.filter((t) => t !== tier) : [...prev, tier]
    );
  }

  function toggleCategory(cat: string) {
    setSelectedCategories((prev) =>
      prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat]
    );
  }

  const filterCount = selectedTiers.length + selectedCategories.length + (freeOnly ? 1 : 0) + (mintedOnly ? 1 : 0);

  const Sidebar = () => (
    <div className="space-y-6">
      {/* Gem Tiers */}
      <div>
        <h3 className="text-xs font-semibold text-[#8b8ba7] uppercase tracking-wider mb-3">
          Gem Tier
        </h3>
        <div className="space-y-1">
          {GEM_TIERS.map((tier) => (
            <button
              key={tier}
              onClick={() => toggleTier(tier)}
              className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${
                selectedTiers.includes(tier)
                  ? "bg-[#7c3aed20] border border-[#7c3aed30]"
                  : "hover:bg-[#1e1e2e]"
              }`}
            >
              <GemBadge tier={tier} size="xs" showLabel />
            </button>
          ))}
        </div>
      </div>

      {/* Category */}
      <div>
        <h3 className="text-xs font-semibold text-[#8b8ba7] uppercase tracking-wider mb-3">
          Category
        </h3>
        <div className="space-y-1">
          {CATEGORIES.filter((c) => c !== "All").map((cat) => (
            <button
              key={cat}
              onClick={() => toggleCategory(cat)}
              className={`w-full flex items-center px-3 py-2 rounded-lg text-sm transition-colors text-left ${
                selectedCategories.includes(cat)
                  ? "bg-[#7c3aed20] text-[#f8f8ff] border border-[#7c3aed30]"
                  : "text-[#8b8ba7] hover:bg-[#1e1e2e] hover:text-[#f8f8ff]"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Toggles */}
      <div>
        <h3 className="text-xs font-semibold text-[#8b8ba7] uppercase tracking-wider mb-3">
          Filters
        </h3>
        <div className="space-y-2">
          {[
            { label: "Free only", value: freeOnly, toggle: () => setFreeOnly(!freeOnly) },
            { label: "NFT minted", value: mintedOnly, toggle: () => setMintedOnly(!mintedOnly) },
          ].map(({ label, value, toggle }) => (
            <label key={label} className="flex items-center gap-3 cursor-pointer px-3 py-2">
              <div
                onClick={toggle}
                className={`w-9 h-5 rounded-full transition-colors relative ${
                  value ? "bg-[#7c3aed]" : "bg-[#1e1e2e]"
                }`}
              >
                <div
                  className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform ${
                    value ? "translate-x-4" : "translate-x-0.5"
                  }`}
                />
              </div>
              <span className="text-sm text-[#8b8ba7]">{label}</span>
            </label>
          ))}
        </div>
      </div>
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-[#f8f8ff] mb-1">Marketplace</h1>
        <p className="text-[#8b8ba7]">{filtered.length} skills available</p>
      </div>

      {/* Search + Sort bar */}
      <div className="flex items-center gap-3 mb-6">
        <div className="flex-1 flex items-center gap-2 px-4 py-2.5 rounded-xl border border-[#1e1e2e] bg-[#12121a] focus-within:border-[#7c3aed] transition-colors">
          <Search size={16} className="text-[#8b8ba7] shrink-0" />
          <input
            type="text"
            placeholder="Search skills, tags, authors…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 bg-transparent text-sm text-[#f8f8ff] placeholder-[#8b8ba7] outline-none"
          />
          {search && (
            <button onClick={() => setSearch("")}>
              <X size={14} className="text-[#8b8ba7] hover:text-[#f8f8ff]" />
            </button>
          )}
        </div>

        <select
          value={sort}
          onChange={(e) => setSort(e.target.value)}
          className="bg-[#12121a] border border-[#1e1e2e] rounded-xl px-3 py-2.5 text-sm text-[#f8f8ff] focus:border-[#7c3aed] focus:outline-none hidden sm:block"
        >
          {SORT_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>

        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className={`lg:hidden flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm transition-colors ${
            filterCount > 0
              ? "border-[#7c3aed] bg-[#7c3aed20] text-[#f8f8ff]"
              : "border-[#1e1e2e] bg-[#12121a] text-[#8b8ba7]"
          }`}
        >
          <SlidersHorizontal size={15} />
          Filters {filterCount > 0 && `(${filterCount})`}
        </button>
      </div>

      {/* Active filters */}
      {filterCount > 0 && (
        <div className="flex flex-wrap gap-2 mb-5">
          {selectedTiers.map((tier) => (
            <button
              key={tier}
              onClick={() => toggleTier(tier)}
              className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#7c3aed20] border border-[#7c3aed30] text-sm text-[#a78bfa] hover:bg-[#7c3aed30] transition-colors"
            >
              <GemBadge tier={tier} size="xs" showLabel={false} />
              <span className="capitalize">{tier}</span>
              <X size={12} />
            </button>
          ))}
          {selectedCategories.map((cat) => (
            <button
              key={cat}
              onClick={() => toggleCategory(cat)}
              className="flex items-center gap-1 px-3 py-1 rounded-full bg-[#7c3aed20] border border-[#7c3aed30] text-sm text-[#a78bfa] hover:bg-[#7c3aed30] transition-colors"
            >
              {cat} <X size={12} />
            </button>
          ))}
          <button
            onClick={() => {
              setSelectedTiers([]);
              setSelectedCategories([]);
              setFreeOnly(false);
              setMintedOnly(false);
            }}
            className="text-xs text-[#8b8ba7] hover:text-[#ff4d4d] transition-colors px-2"
          >
            Clear all
          </button>
        </div>
      )}

      <div className="flex gap-6">
        {/* Sidebar — desktop */}
        <aside className="hidden lg:block w-56 shrink-0">
          <Sidebar />
        </aside>

        {/* Grid */}
        <div className="flex-1">
          {filtered.length === 0 ? (
            <div className="text-center py-16 text-[#8b8ba7]">
              <p className="text-4xl mb-3">🔍</p>
              <p className="text-lg font-medium text-[#f8f8ff]">No skills found</p>
              <p className="text-sm mt-1">Try adjusting your filters or search term</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
              {filtered.map((skill) => (
                <SkillCard key={skill.id} skill={skill} currency={currency} />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Mobile sidebar */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/60" onClick={() => setSidebarOpen(false)} />
          <div className="absolute right-0 top-0 bottom-0 w-72 bg-[#0e0e16] border-l border-[#1e1e2e] p-5 overflow-y-auto">
            <div className="flex items-center justify-between mb-5">
              <span className="font-semibold text-[#f8f8ff]">Filters</span>
              <button onClick={() => setSidebarOpen(false)}>
                <X size={18} className="text-[#8b8ba7]" />
              </button>
            </div>
            <Sidebar />
          </div>
        </div>
      )}
    </div>
  );
}
