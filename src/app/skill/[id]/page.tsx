"use client";

import { use, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Download,
  Share2,
  ExternalLink,
  Tag,
  User,
  Calendar,
  Sparkles,
  Check,
  Vault,
} from "lucide-react";
import { MOCK_SKILLS, MOCK_REVIEWS } from "@/lib/mock-data";
import { GemBadge } from "@/components/GemBadge";
import { OrderBook } from "@/components/OrderBook";
import { AgentAuditPanel } from "@/components/AgentAuditPanel";
import { PaymentModal } from "@/components/PaymentModal";
import { SecureScoreBar } from "@/components/SecureScoreBar";
import { ReviewSection } from "@/components/ReviewSection";
import { SkillReadme } from "@/components/SkillReadme";
import { useCurrency } from "@/components/Providers";
import { formatCurrency, formatNumber, formatPercent, relativeTime } from "@/lib/utils";
import type { AgentAudit } from "@/types/audit";
import { MODEL_CATALOG } from "@/types/audit";

// Mock audit for demo
function mockAudit(skill: (typeof MOCK_SKILLS)[0]): AgentAudit {
  return {
    id: "audit-" + skill.id,
    skill_id: skill.id,
    security_score: skill.secure_score ?? 75,
    model_score: 82,
    quality_score: 78,
    total_score: skill.secure_score ?? 75,
    flagged_issues:
      (skill.secure_score ?? 75) < 80
        ? [
            {
              type: "Description Ambiguity",
              description: "Plugin description could be more specific about data handling.",
              severity: "low" as const,
              recommendation: "Clarify what user data the plugin accesses.",
            },
          ]
        : [],
    model_recommendation: skill.model_recommendation ?? "claude-sonnet-4-6",
    audit_model: "claude-opus-4-7",
    status: "completed",
    security_result: null,
    model_result: null,
    quality_result: null,
    created_at: skill.created_at,
  };
}

export default function SkillDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { currency } = useCurrency();
  const [paymentOpen, setPaymentOpen] = useState(false);
  const [orderType, setOrderType] = useState<"market" | "limit">("market");
  const [side, setSide] = useState<"buy" | "sell">("buy");
  const [limitPrice, setLimitPrice] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [dreamed, setDreamed] = useState(false);

  const skill = MOCK_SKILLS.find((s) => s.id === id);

  if (!skill) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center">
        <p className="text-4xl mb-4">💎</p>
        <h2 className="text-2xl font-bold text-[#f8f8ff] mb-2">Skill Not Found</h2>
        <Link href="/marketplace" className="text-[#177CB0] hover:underline">
          Back to marketplace
        </Link>
      </div>
    );
  }

  const audit = mockAudit(skill);
  const modelInfo = skill.model_recommendation ? MODEL_CATALOG[skill.model_recommendation] : null;
  const priceChange = skill.price_change_24h ?? 0;
  const isUp = priceChange >= 0;
  const reviews = MOCK_REVIEWS[skill.id] ?? [];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      {/* Back */}
      <Link
        href="/marketplace"
        className="inline-flex items-center gap-2 text-sm text-[#8b8ba7] hover:text-[#f8f8ff] transition-colors mb-6"
      >
        <ArrowLeft size={15} />
        Back to Marketplace
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column */}
        <div className="lg:col-span-2 space-y-5">
          {/* Skill header */}
          <div className="bg-[#12121a] border border-[#1e1e2e] rounded-2xl p-6">
            <div className="flex items-start justify-between gap-4 mb-4">
              <div className="flex-1">
                <div className="flex flex-wrap items-center gap-2 mb-2">
                  <GemBadge tier={skill.gem_tier} size="sm" />
                  {skill.is_free && (
                    <span className="text-xs px-2 py-0.5 rounded bg-[#00d97e15] text-[#00d97e] border border-[#00d97e30] font-medium">
                      FREE
                    </span>
                  )}
                  {skill.is_minted && (
                    <span className="text-xs px-2 py-0.5 rounded bg-[#00B0BA15] text-[#00B0BA] border border-[#00B0BA30] font-medium">
                      NFT #{skill.nft_token_id}
                    </span>
                  )}
                  <span className="text-xs px-2 py-0.5 rounded bg-[#1e1e2e] text-[#8b8ba7] border border-[#2e2e4e]">
                    {skill.category}
                  </span>
                </div>
                <h1 className="text-2xl font-bold text-[#f8f8ff]">{skill.title}</h1>
                <div className="flex flex-wrap items-center gap-4 mt-2 text-sm text-[#8b8ba7]">
                  <span className="flex items-center gap-1.5">
                    <User size={13} />
                    {skill.creator?.username ?? "unknown"}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Calendar size={13} />
                    {relativeTime(skill.created_at)}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Download size={13} />
                    {formatNumber(skill.downloads)} installs
                  </span>
                  {skill.rating != null && (
                    <span className="flex items-center gap-1">
                      <span className="text-[#00B0BA]">★</span>
                      <span className="font-semibold text-[#f8f8ff]">{skill.rating.toFixed(1)}</span>
                      <span className="text-xs text-[#4a4a5a]">({skill.review_count ?? 0})</span>
                    </span>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2">
                {/* Dream button */}
                <button
                  onClick={() => setDreamed(!dreamed)}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium border transition-all ${
                    dreamed
                      ? "bg-[#177CB020] border-[#177CB0] text-[#177CB0]"
                      : "bg-[#1e1e2e] border-[#2e2e4e] text-[#8b8ba7] hover:text-[#f8f8ff] hover:border-[#177CB0]"
                  }`}
                  title={dreamed ? "Saved to your Vault" : "Dream this skill — save to Vault"}
                >
                  {dreamed ? <Check size={14} /> : <Sparkles size={14} />}
                  {dreamed ? "Dreamed" : "Dream"}
                </button>
                {dreamed && (
                  <Link
                    href="/vault"
                    className="p-2 rounded-lg bg-[#1e1e2e] text-[#177CB0] hover:bg-[#177CB020] transition-colors"
                    title="View in Vault"
                  >
                    <Vault size={16} />
                  </Link>
                )}
                <button className="p-2 rounded-lg bg-[#1e1e2e] text-[#8b8ba7] hover:text-[#f8f8ff] transition-colors">
                  <Share2 size={16} />
                </button>
              </div>
            </div>

            <p className="text-[#8b8ba7] leading-relaxed mb-4">{skill.description}</p>

            {/* Tags */}
            <div className="flex flex-wrap gap-2">
              {skill.tags.map((tag) => (
                <span
                  key={tag}
                  className="flex items-center gap-1 text-xs px-2.5 py-1 rounded-full bg-[#1e1e2e] text-[#8b8ba7] border border-[#2e2e4e]"
                >
                  <Tag size={10} />
                  {tag}
                </span>
              ))}
            </div>
          </div>

          {/* SecureScore bar */}
          {skill.secure_score != null && (
            <div className="bg-[#12121a] border border-[#1e1e2e] rounded-2xl p-5">
              <SecureScoreBar score={skill.secure_score} />
            </div>
          )}

          {/* skills.md */}
          {skill.skills_readme && (
            <SkillReadme content={skill.skills_readme} skillTitle={skill.title} />
          )}

          {/* Plugin JSON preview */}
          {skill.plugin_json && (
            <div className="bg-[#12121a] border border-[#1e1e2e] rounded-2xl overflow-hidden">
              <div className="px-5 py-3 border-b border-[#1e1e2e] flex items-center justify-between">
                <span className="text-sm font-semibold text-[#f8f8ff]">plugin.json</span>
                <button className="flex items-center gap-1 text-xs text-[#8b8ba7] hover:text-[#f8f8ff] transition-colors">
                  <ExternalLink size={12} />
                  View raw
                </button>
              </div>
              <pre className="p-5 text-xs font-mono text-[#4B5CC4] overflow-x-auto leading-relaxed">
                {JSON.stringify(skill.plugin_json, null, 2)}
              </pre>
            </div>
          )}

          {/* Model recommendation card */}
          {modelInfo && (
            <div className="bg-[#12121a] border border-[#1e1e2e] rounded-2xl p-5">
              <h3 className="text-sm font-semibold text-[#f8f8ff] mb-3 flex items-center gap-2">
                <span className="text-[#00B0BA]">🤖</span>
                AI Model Recommendation
              </h3>
              <div className="flex items-start gap-4">
                <div className="flex-1">
                  <div className="text-base font-bold text-[#00B0BA]">{modelInfo.name}</div>
                  <div className="text-sm text-[#8b8ba7] mt-0.5">{modelInfo.description}</div>
                </div>
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                {modelInfo.strengths.map((s) => (
                  <span
                    key={s}
                    className="text-xs px-2.5 py-1 rounded-full bg-[#00B0BA10] text-[#00B0BA] border border-[#00B0BA20]"
                  >
                    {s}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Agent Audit Panel */}
          <AgentAuditPanel
            audit={audit}
            secureScore={skill.secure_score}
            modelRecommendation={skill.model_recommendation}
          />

          {/* Reviews */}
          <ReviewSection
            skillId={skill.id}
            rating={skill.rating}
            reviewCount={skill.review_count}
            reviews={reviews}
          />
        </div>

        {/* Right column — Trading panel */}
        <div className="space-y-4">
          {/* Price card */}
          <div className="bg-[#12121a] border border-[#1e1e2e] rounded-2xl p-5">
            <div className="mb-4">
              <div className="text-3xl font-mono font-bold text-[#f8f8ff]">
                {skill.is_free
                  ? "Free"
                  : formatCurrency(skill.current_price ?? skill.price_usd, currency)}
              </div>
              {!skill.is_free && (
                <div
                  className={`text-sm font-medium mt-1 ${isUp ? "text-[#00d97e]" : "text-[#ff4d4d]"}`}
                >
                  {isUp ? "▲" : "▼"} {formatPercent(Math.abs(priceChange))} today
                </div>
              )}
              {(skill.volume_24h ?? 0) > 0 && (
                <div className="text-xs text-[#8b8ba7] mt-0.5">
                  {formatCurrency(skill.volume_24h ?? 0, currency)} vol
                </div>
              )}
            </div>

            {/* Buy/Sell tabs */}
            {!skill.is_free && (
              <div className="flex mb-4">
                {(["buy", "sell"] as const).map((s) => (
                  <button
                    key={s}
                    onClick={() => setSide(s)}
                    className={`flex-1 py-2.5 text-sm font-semibold rounded-lg transition-colors first:rounded-r-none last:rounded-l-none capitalize ${
                      side === s
                        ? s === "buy"
                          ? "bg-[#00d97e] text-black"
                          : "bg-[#ff4d4d] text-white"
                        : "bg-[#0e0e16] text-[#8b8ba7] hover:text-[#f8f8ff]"
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            )}

            {/* Order type */}
            {!skill.is_free && (
              <div className="flex gap-2 mb-4">
                {(["market", "limit"] as const).map((t) => (
                  <button
                    key={t}
                    onClick={() => setOrderType(t)}
                    className={`flex-1 py-1.5 text-xs rounded-lg font-medium capitalize transition-colors ${
                      orderType === t
                        ? "bg-[#1e1e2e] text-[#f8f8ff] border border-[#2e2e4e]"
                        : "text-[#8b8ba7] hover:text-[#f8f8ff]"
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            )}

            {orderType === "limit" && !skill.is_free && (
              <div className="mb-4">
                <label className="block text-xs text-[#8b8ba7] mb-1">Limit Price</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8b8ba7] text-sm">$</span>
                  <input
                    type="number"
                    value={limitPrice}
                    onChange={(e) => setLimitPrice(e.target.value)}
                    placeholder={(skill.current_price ?? skill.price_usd).toFixed(2)}
                    className="w-full bg-[#0e0e16] border border-[#1e1e2e] rounded-xl pl-7 pr-4 py-2 text-sm text-[#f8f8ff] focus:border-[#177CB0] focus:outline-none transition-colors"
                  />
                </div>
              </div>
            )}

            <div className="mb-4">
              <label className="block text-xs text-[#8b8ba7] mb-1">Quantity</label>
              <input
                type="number"
                min="1"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                className="w-full bg-[#0e0e16] border border-[#1e1e2e] rounded-xl px-4 py-2 text-sm text-[#f8f8ff] focus:border-[#177CB0] focus:outline-none transition-colors"
              />
            </div>

            <button
              onClick={() => setPaymentOpen(true)}
              className={`w-full py-3.5 rounded-xl font-semibold text-sm transition-colors ${
                skill.is_free
                  ? "bg-[#177CB0] text-white hover:bg-[#065279]"
                  : side === "buy"
                  ? "bg-[#00d97e] text-black hover:bg-[#00c070]"
                  : "bg-[#ff4d4d] text-white hover:bg-[#e03030]"
              }`}
            >
              {skill.is_free ? "Get for Free" : side === "buy" ? "Buy Now" : "Sell"}
            </button>

            <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-[#8b8ba7]">
              <div>Platform fee: <span className="text-[#f8f8ff]">15%</span></div>
              <div>Creator share: <span className="text-[#f8f8ff]">85%</span></div>
            </div>
          </div>

          {/* Order Book */}
          {!skill.is_free && (
            <OrderBook
              skillId={skill.id}
              currentPrice={skill.current_price ?? skill.price_usd}
              currency={currency}
            />
          )}
        </div>
      </div>

      {paymentOpen && (
        <PaymentModal
          skill={skill}
          currency={currency}
          onClose={() => setPaymentOpen(false)}
          onSuccess={() => setPaymentOpen(false)}
        />
      )}
    </div>
  );
}
