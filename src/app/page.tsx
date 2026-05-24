"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight, TrendingUp, Shield, Gem, Users, Zap } from "lucide-react";
import { SkillCard } from "@/components/SkillCard";
import { GemBadge } from "@/components/GemBadge";
import { MOCK_SKILLS, MOCK_STATS } from "@/lib/mock-data";
import { useCurrency } from "@/components/Providers";
import { formatCurrency, formatNumber } from "@/lib/utils";
import type { GemTier } from "@/types/skill";

const FEATURED = MOCK_SKILLS.filter((s) => s.gem_tier === "diamond").slice(0, 4);
const TRENDING = MOCK_SKILLS.sort((a, b) => (b.volume_24h ?? 0) - (a.volume_24h ?? 0)).slice(0, 6);
const FREE_SKILLS = MOCK_SKILLS.filter((s) => s.is_free).slice(0, 3);

const GEM_TIERS: { tier: GemTier; count: number }[] = [
  { tier: "diamond", count: 284 },
  { tier: "emerald", count: 512 },
  { tier: "pearl", count: 631 },
  { tier: "quartz", count: 420 },
];

export default function HomePage() {
  const { currency } = useCurrency();
  const [activeCategory, setActiveCategory] = useState("All");

  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="relative overflow-hidden">
        {/* Background glow */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-[#7c3aed] opacity-[0.06] blur-[120px] rounded-full" />
          <div className="absolute top-20 left-1/4 w-[300px] h-[300px] bg-[#60efff] opacity-[0.04] blur-[80px] rounded-full" />
          <div className="absolute top-20 right-1/4 w-[300px] h-[300px] bg-[#00d97e] opacity-[0.04] blur-[80px] rounded-full" />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 pt-16 pb-12 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#7c3aed15] border border-[#7c3aed30] text-[#a78bfa] text-xs font-medium mb-6">
            <Zap size={12} />
            Live trading · AI-audited · Gem-tiered
          </div>

          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-[#f8f8ff] mb-5 leading-tight">
            The Marketplace for
            <br />
            <span className="bg-gradient-to-r from-[#7c3aed] via-[#a78bfa] to-[#60efff] bg-clip-text text-transparent">
              AI Skills & Plugins
            </span>
          </h1>

          <p className="text-lg text-[#8b8ba7] max-w-2xl mx-auto mb-8">
            Discover, trade, and mint Claude Code skills. Every skill is audited by AI agents
            for security and quality — and tiered by gems.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              href="/marketplace"
              className="flex items-center gap-2 px-6 py-3.5 rounded-xl bg-[#7c3aed] text-white font-semibold hover:bg-[#6d28d9] transition-colors"
            >
              Explore Marketplace
              <ArrowRight size={16} />
            </Link>
            <Link
              href="/submit"
              className="flex items-center gap-2 px-6 py-3.5 rounded-xl bg-[#12121a] border border-[#1e1e2e] text-[#f8f8ff] font-semibold hover:bg-[#1e1e2e] transition-colors"
            >
              <Gem size={16} />
              List Your Skill
            </Link>
          </div>
        </div>

        {/* Live stats bar */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 pb-12">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { icon: <Gem size={18} className="text-[#a78bfa]" />, label: "Total Skills", value: formatNumber(MOCK_STATS.total_skills) },
              { icon: <TrendingUp size={18} className="text-[#00d97e]" />, label: "24h Volume", value: formatCurrency(MOCK_STATS.total_volume_24h, currency) },
              { icon: <Users size={18} className="text-[#60efff]" />, label: "Active Traders", value: formatNumber(MOCK_STATS.active_traders) },
              { icon: <Zap size={18} className="text-[#f8a800]" />, label: "New Today", value: `+${MOCK_STATS.new_skills_today}` },
            ].map(({ icon, label, value }) => (
              <div
                key={label}
                className="bg-[#12121a] border border-[#1e1e2e] rounded-xl p-4 text-center"
              >
                <div className="flex justify-center mb-1">{icon}</div>
                <div className="text-xl font-mono font-bold text-[#f8f8ff]">{value}</div>
                <div className="text-xs text-[#8b8ba7] mt-0.5">{label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Gem Tier Filters */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 mb-10">
        <div className="flex items-center gap-3 overflow-x-auto pb-2 scrollbar-hide">
          <button
            onClick={() => setActiveCategory("All")}
            className={`shrink-0 px-4 py-2 rounded-xl text-sm font-medium transition-colors border ${
              activeCategory === "All"
                ? "bg-[#7c3aed20] border-[#7c3aed] text-[#f8f8ff]"
                : "bg-[#12121a] border-[#1e1e2e] text-[#8b8ba7] hover:border-[#2e2e4e]"
            }`}
          >
            All
          </button>
          {GEM_TIERS.map(({ tier, count }) => (
            <button
              key={tier}
              onClick={() => setActiveCategory(tier)}
              className={`shrink-0 flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all border ${
                activeCategory === tier
                  ? "border-[#7c3aed] bg-[#7c3aed20]"
                  : "bg-[#12121a] border-[#1e1e2e] hover:border-[#2e2e4e]"
              }`}
            >
              <GemBadge tier={tier} size="xs" />
              <span className="text-[#8b8ba7] text-xs">{count}</span>
            </button>
          ))}
        </div>
      </section>

      {/* Featured section (horizontal scroll — App Store style) */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 mb-12">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-[#f8f8ff] flex items-center gap-2">
            <Shield size={18} className="text-[#60efff]" />
            Diamond Skills
          </h2>
          <Link
            href="/marketplace?tier=diamond"
            className="text-sm text-[#7c3aed] hover:text-[#a78bfa] transition-colors flex items-center gap-1"
          >
            See all <ArrowRight size={13} />
          </Link>
        </div>
        <div className="flex gap-4 overflow-x-auto pb-3 scrollbar-hide snap-x snap-mandatory">
          {FEATURED.map((skill) => (
            <div key={skill.id} className="shrink-0 w-72 snap-start">
              <SkillCard skill={skill} currency={currency} />
            </div>
          ))}
        </div>
      </section>

      {/* Trending grid (Polymarket style) */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 mb-12">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-[#f8f8ff] flex items-center gap-2">
            <TrendingUp size={18} className="text-[#00d97e]" />
            Trending Now
          </h2>
          <Link
            href="/marketplace?sort=trending"
            className="text-sm text-[#7c3aed] hover:text-[#a78bfa] transition-colors flex items-center gap-1"
          >
            See all <ArrowRight size={13} />
          </Link>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {TRENDING.map((skill) => (
            <SkillCard key={skill.id} skill={skill} currency={currency} />
          ))}
        </div>
      </section>

      {/* Free skills */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 mb-16">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-[#f8f8ff] flex items-center gap-2">
            <span className="text-[#00d97e]">🎁</span>
            Free Skills
          </h2>
          <Link
            href="/marketplace?free=true"
            className="text-sm text-[#7c3aed] hover:text-[#a78bfa] transition-colors flex items-center gap-1"
          >
            See all <ArrowRight size={13} />
          </Link>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {FREE_SKILLS.map((skill) => (
            <SkillCard key={skill.id} skill={skill} currency={currency} />
          ))}
        </div>
      </section>

      {/* CTA banner */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 mb-12">
        <div className="relative overflow-hidden rounded-2xl border border-[#7c3aed30] bg-gradient-to-br from-[#7c3aed10] to-[#60efff05] p-8 text-center">
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-0 right-0 w-48 h-48 bg-[#7c3aed] opacity-10 blur-3xl rounded-full" />
          </div>
          <h3 className="text-2xl font-bold text-[#f8f8ff] mb-2 relative">
            Have a Skill to Share?
          </h3>
          <p className="text-[#8b8ba7] mb-6 relative">
            List your Claude Code plugin and earn on every sale. AI agents audit it for you.
          </p>
          <Link
            href="/submit"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-[#7c3aed] text-white font-semibold hover:bg-[#6d28d9] transition-colors relative"
          >
            <Gem size={16} />
            Submit Your Skill
          </Link>
        </div>
      </section>
    </div>
  );
}
