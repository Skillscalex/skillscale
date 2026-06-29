import Link from "next/link";
import { Gem, ArrowRight, Star, Shield, Zap, TrendingUp, Code, Users } from "lucide-react";
import { MOCK_STATS } from "@/lib/mock-data";
import AgentCostEstimator from "@/components/AgentCostEstimator";

function formatNumber(n: number) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000)     return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}

const FEATURES = [
  { icon: Shield, title: "Agent-Audited",    desc: "Every skill vetted by 7 specialised AI agents across security, quality, and model-fit dimensions." },
  { icon: TrendingUp, title: "Live Pricing", desc: "Polymarket-style dynamic prices driven by real demand, adoption, and gem-tier scores." },
  { icon: Gem, title: "Gem Tiers",           desc: "Coal → Quartz → Pearl → Emerald → Diamond. Skills evolve as the community validates them." },
  { icon: Code, title: "Claude Code Plugin", desc: "Registered in .claude-plugin/ — install any skill directly inside your Claude Code session." },
  { icon: Zap, title: "AgentOS",             desc: "Built-in agentic orchestration with cost & time estimation before every multi-agent run." },
  { icon: Users, title: "Creator Economy",   desc: "Mint your skill as an NFT, earn SKL tokens on every download, withdraw via Stripe." },
];

const STATS = [
  { label: "Total Skills",   value: formatNumber(MOCK_STATS.total_skills) },
  { label: "Creators",       value: formatNumber(3241) },
  { label: "Volume",         value: `$${formatNumber(MOCK_STATS.total_volume_24h)}` },
  { label: "Audits Run",     value: formatNumber(MOCK_STATS.new_skills_today * 47) },
];

export default function HomePage() {
  return (
    <main className="flex-1">
      {/* ── Hero ──────────────────────────────────────────────── */}
      <section
        className="relative overflow-hidden"
        style={{ background: "linear-gradient(135deg, #f4fafc 0%, #eaf6fb 58%, #d6f4f7 100%)" }}
      >
        <div className="relative max-w-5xl mx-auto px-4 sm:px-6 py-16 sm:py-24 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-semibold mb-6"
               style={{ background: "var(--accent-light)", color: "var(--accent)" }}>
            <Gem size={14} /> AI Skills Marketplace · Claude Code Powered
          </div>

          <h1 className="mb-6" style={{ color: "var(--text-primary)" }}>
            Discover & Deploy{" "}
            <span style={{ color: "var(--accent)" }}>AI Skills</span>{" "}
            in Seconds
          </h1>

          <p className="text-lg sm:text-xl max-w-2xl mx-auto mb-10 leading-relaxed"
             style={{ color: "var(--text-secondary)" }}>
            The marketplace for Claude Code plugins. Agent-audited, gem-tiered,
            with Polymarket-style live pricing. Buy, sell, and mint AI skills
            — earn SKL tokens on every download.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/marketplace"
              className="btn-primary inline-flex items-center justify-center gap-2 px-6 py-3 text-base">
              Browse Skills <ArrowRight size={16} />
            </Link>
            <Link href="/submit"
              className="btn-secondary inline-flex items-center justify-center gap-2 px-6 py-3 text-base">
              <Gem size={16} /> Submit Your Skill
            </Link>
          </div>
        </div>
      </section>

      {/* ── Live stats bar ─────────────────────────────────────── */}
      <div className="border-b" style={{ background: "var(--bg-surface)", borderColor: "var(--border)" }}>
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {STATS.map((stat) => (
              <div key={stat.label} className="stat-card">
                <div className="stat-value">{stat.value}</div>
                <div className="stat-label">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── AgentOS Estimator ─────────────────────────────────── */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 py-12">
        <div className="mb-6">
          <h2 style={{ color: "var(--text-primary)" }}>AgentOS — Plan Before You Run</h2>
          <p className="mt-2 text-base" style={{ color: "var(--text-secondary)" }}>
            Estimate cost and time for your agentic team before hitting execute.
            Respects Anthropic usage limits — Haiku for volume, Opus for reflection.
          </p>
        </div>
        <AgentCostEstimator />
      </section>

      {/* ── Features grid ─────────────────────────────────────── */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 py-12">
        <h2 className="mb-8 text-center" style={{ color: "var(--text-primary)" }}>
          Why Skillscale?
        </h2>
        <div className="skill-grid">
          {FEATURES.map((f) => (
            <div key={f.title} className="card p-5">
              <f.icon size={24} className="mb-3" style={{ color: "var(--accent)" }} aria-hidden />
              <h3 className="mb-1.5 text-base" style={{ color: "var(--text-primary)" }}>{f.title}</h3>
              <p className="text-sm leading-relaxed" style={{ color: "var(--text-secondary)" }}>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── CTA ───────────────────────────────────────────────── */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 py-12 pb-20">
        <div className="card p-8 sm:p-12 text-center"
             style={{ background: "linear-gradient(135deg, var(--accent-light), var(--bg-surface))" }}>
          <Star size={32} className="mx-auto mb-4" style={{ color: "var(--accent)" }} aria-hidden />
          <h2 className="mb-3" style={{ color: "var(--text-primary)" }}>
            Ready to scale your AI skills?
          </h2>
          <p className="mb-6 max-w-lg mx-auto" style={{ color: "var(--text-secondary)" }}>
            Join creators building the future of AI tooling. Submit a skill,
            earn SKL, and let the agent team audit it for free.
          </p>
          <Link href="/submit"
            className="btn-primary inline-flex items-center gap-2 px-8 py-3 text-base">
            <Gem size={16} /> Get Started <ArrowRight size={16} />
          </Link>
        </div>
      </section>

      <footer className="border-t" style={{ borderColor: "var(--border)", background: "var(--bg-surface)" }}>
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 text-sm" style={{ color: "var(--text-secondary)" }}>
          Component methodology and stale-record handling are documented outside the hero in the ingestion docs.
        </div>
      </footer>
    </main>
  );
}
