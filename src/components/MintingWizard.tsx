"use client";

import { useState } from "react";
import {
  Upload,
  Tag,
  Gem,
  DollarSign,
  CheckCircle,
  Loader2,
  ChevronRight,
  ArrowLeft,
} from "lucide-react";
import type { GemTier } from "@/types/skill";
import { GEM_TIER_CONFIG } from "@/types/skill";
import { GemBadge } from "./GemBadge";

export type MintingData = {
  title: string;
  description: string;
  category: string;
  tags: string;
  priceType: "free" | "paid";
  priceUsd: string;
  gemTier: GemTier | "auto";
  mintAsNft: boolean;
  pluginJsonStr: string;
};

const INITIAL_DATA: MintingData = {
  title: "",
  description: "",
  category: "Development",
  tags: "",
  priceType: "paid",
  priceUsd: "9.99",
  gemTier: "auto",
  mintAsNft: false,
  pluginJsonStr: "",
};

const STEPS = [
  { icon: <Upload size={18} />, label: "Upload" },
  { icon: <Tag size={18} />, label: "Metadata" },
  { icon: <Gem size={18} />, label: "Gem Tier" },
  { icon: <DollarSign size={18} />, label: "Pricing" },
  { icon: <CheckCircle size={18} />, label: "Review" },
];

const CATEGORIES = [
  "Development", "Data Science", "Security", "Writing",
  "Marketing", "Productivity", "Design", "Finance", "Research",
];

interface MintingWizardProps {
  onComplete: (data: MintingData) => Promise<void>;
}

export function MintingWizard({ onComplete }: MintingWizardProps) {
  const [step, setStep] = useState(0);
  const [data, setData] = useState<MintingData>(INITIAL_DATA);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  function update(patch: Partial<MintingData>) {
    setData((d) => ({ ...d, ...patch }));
  }

  async function handleSubmit() {
    setSubmitting(true);
    try {
      await onComplete(data);
      setDone(true);
    } finally {
      setSubmitting(false);
    }
  }

  if (done) {
    return (
      <div className="text-center py-12">
        <CheckCircle size={56} className="text-[#00d97e] mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-[#f8f8ff] mb-2">Skill Submitted!</h2>
        <p className="text-[#8b8ba7]">
          Our AI agents are auditing your skill. You&apos;ll be notified with the secure score and gem tier.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      {/* Step indicators */}
      <div className="flex items-center mb-10">
        {STEPS.map((s, i) => (
          <div key={i} className="flex items-center flex-1">
            <div
              className={`flex flex-col items-center gap-1.5 ${i <= step ? "opacity-100" : "opacity-30"}`}
            >
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all ${
                  i < step
                    ? "bg-[#7c3aed] border-[#7c3aed] text-white"
                    : i === step
                    ? "bg-[#7c3aed20] border-[#7c3aed] text-[#7c3aed]"
                    : "bg-[#12121a] border-[#1e1e2e] text-[#8b8ba7]"
                }`}
              >
                {i < step ? <CheckCircle size={18} /> : s.icon}
              </div>
              <span className="text-xs text-[#8b8ba7] hidden sm:block">{s.label}</span>
            </div>
            {i < STEPS.length - 1 && (
              <div className={`flex-1 h-px mx-2 ${i < step ? "bg-[#7c3aed]" : "bg-[#1e1e2e]"}`} />
            )}
          </div>
        ))}
      </div>

      {/* Step content */}
      <div className="bg-[#12121a] border border-[#1e1e2e] rounded-2xl p-6">
        {step === 0 && (
          <div className="space-y-4">
            <h2 className="text-xl font-bold text-[#f8f8ff]">Upload Your Skill</h2>
            <p className="text-sm text-[#8b8ba7]">
              Paste your <code className="text-[#a78bfa]">plugin.json</code> or fill in the form below.
            </p>
            <div>
              <label className="block text-sm font-medium text-[#f8f8ff] mb-2">
                plugin.json (optional)
              </label>
              <textarea
                value={data.pluginJsonStr}
                onChange={(e) => update({ pluginJsonStr: e.target.value })}
                placeholder='{"name": "my-skill", "version": "1.0.0", ...}'
                rows={8}
                className="w-full bg-[#0e0e16] border border-[#1e1e2e] rounded-xl px-4 py-3 text-sm font-mono text-[#f8f8ff] placeholder-[#4a4a5a] focus:border-[#7c3aed] focus:outline-none transition-colors resize-none"
              />
            </div>
            <div className="flex items-center gap-3 text-sm text-[#8b8ba7]">
              <div className="flex-1 h-px bg-[#1e1e2e]" />
              <span>or drag & drop a .json file</span>
              <div className="flex-1 h-px bg-[#1e1e2e]" />
            </div>
            <div className="border-2 border-dashed border-[#1e1e2e] rounded-xl p-8 text-center hover:border-[#7c3aed30] transition-colors cursor-pointer">
              <Upload size={24} className="text-[#8b8ba7] mx-auto mb-2" />
              <span className="text-sm text-[#8b8ba7]">Drop plugin.json here</span>
            </div>
          </div>
        )}

        {step === 1 && (
          <div className="space-y-4">
            <h2 className="text-xl font-bold text-[#f8f8ff]">Add Metadata</h2>
            <div>
              <label className="block text-sm font-medium text-[#f8f8ff] mb-1.5">Title *</label>
              <input
                value={data.title}
                onChange={(e) => update({ title: e.target.value })}
                placeholder="e.g. CodeReview Pro"
                className="w-full bg-[#0e0e16] border border-[#1e1e2e] rounded-xl px-4 py-2.5 text-sm text-[#f8f8ff] placeholder-[#4a4a5a] focus:border-[#7c3aed] focus:outline-none transition-colors"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#f8f8ff] mb-1.5">Description *</label>
              <textarea
                value={data.description}
                onChange={(e) => update({ description: e.target.value })}
                placeholder="Describe what your skill does and how it helps users…"
                rows={4}
                className="w-full bg-[#0e0e16] border border-[#1e1e2e] rounded-xl px-4 py-2.5 text-sm text-[#f8f8ff] placeholder-[#4a4a5a] focus:border-[#7c3aed] focus:outline-none transition-colors resize-none"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-[#f8f8ff] mb-1.5">Category</label>
                <select
                  value={data.category}
                  onChange={(e) => update({ category: e.target.value })}
                  className="w-full bg-[#0e0e16] border border-[#1e1e2e] rounded-xl px-4 py-2.5 text-sm text-[#f8f8ff] focus:border-[#7c3aed] focus:outline-none transition-colors"
                >
                  {CATEGORIES.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-[#f8f8ff] mb-1.5">Tags</label>
                <input
                  value={data.tags}
                  onChange={(e) => update({ tags: e.target.value })}
                  placeholder="tag1, tag2, tag3"
                  className="w-full bg-[#0e0e16] border border-[#1e1e2e] rounded-xl px-4 py-2.5 text-sm text-[#f8f8ff] placeholder-[#4a4a5a] focus:border-[#7c3aed] focus:outline-none transition-colors"
                />
              </div>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <h2 className="text-xl font-bold text-[#f8f8ff]">Choose Gem Tier</h2>
            <p className="text-sm text-[#8b8ba7]">
              Select a tier or let our AI agents automatically assign one based on the security audit.
            </p>
            <div className="grid grid-cols-1 gap-3">
              <button
                onClick={() => update({ gemTier: "auto" })}
                className={`p-4 rounded-xl border text-left transition-all ${
                  data.gemTier === "auto"
                    ? "border-[#7c3aed] bg-[#7c3aed15]"
                    : "border-[#1e1e2e] bg-[#0e0e16] hover:border-[#2e2e4e]"
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl">🤖</span>
                  <div>
                    <div className="font-semibold text-[#f8f8ff]">Auto-assign (Recommended)</div>
                    <div className="text-xs text-[#8b8ba7] mt-0.5">
                      AI agents audit and assign the tier based on security score
                    </div>
                  </div>
                </div>
              </button>
              {(Object.keys(GEM_TIER_CONFIG) as GemTier[]).filter((t) => t !== "coal").map((tier) => {
                const cfg = GEM_TIER_CONFIG[tier];
                return (
                  <button
                    key={tier}
                    onClick={() => update({ gemTier: tier })}
                    className={`p-4 rounded-xl border text-left transition-all ${
                      data.gemTier === tier
                        ? "border-[#7c3aed] bg-[#7c3aed15]"
                        : "border-[#1e1e2e] bg-[#0e0e16] hover:border-[#2e2e4e]"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <GemBadge tier={tier} size="md" />
                      <div>
                        <div className="font-semibold text-[#f8f8ff]">{cfg.label}</div>
                        <div className="text-xs text-[#8b8ba7] mt-0.5">
                          Secure score ≥ {cfg.minScore}
                        </div>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4">
            <h2 className="text-xl font-bold text-[#f8f8ff]">Set Pricing</h2>
            <div className="grid grid-cols-2 gap-3">
              {(["free", "paid"] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => update({ priceType: t })}
                  className={`p-4 rounded-xl border text-center transition-all capitalize ${
                    data.priceType === t
                      ? "border-[#7c3aed] bg-[#7c3aed15] text-[#f8f8ff]"
                      : "border-[#1e1e2e] bg-[#0e0e16] text-[#8b8ba7] hover:border-[#2e2e4e]"
                  }`}
                >
                  <div className="text-2xl mb-1">{t === "free" ? "🎁" : "💰"}</div>
                  <div className="font-semibold">{t === "free" ? "Free" : "Paid"}</div>
                </button>
              ))}
            </div>
            {data.priceType === "paid" && (
              <div>
                <label className="block text-sm font-medium text-[#f8f8ff] mb-1.5">Price (USD)</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#8b8ba7]">$</span>
                  <input
                    type="number"
                    min="0.99"
                    step="0.01"
                    value={data.priceUsd}
                    onChange={(e) => update({ priceUsd: e.target.value })}
                    className="w-full bg-[#0e0e16] border border-[#1e1e2e] rounded-xl pl-8 pr-4 py-2.5 text-sm text-[#f8f8ff] focus:border-[#7c3aed] focus:outline-none transition-colors"
                  />
                </div>
              </div>
            )}
            <div className="p-4 rounded-xl border border-[#1e1e2e] bg-[#0e0e16]">
              <label className="flex items-center gap-3 cursor-pointer">
                <div
                  onClick={() => update({ mintAsNft: !data.mintAsNft })}
                  className={`w-10 h-6 rounded-full transition-colors relative ${
                    data.mintAsNft ? "bg-[#7c3aed]" : "bg-[#1e1e2e]"
                  }`}
                >
                  <div
                    className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${
                      data.mintAsNft ? "translate-x-5" : "translate-x-1"
                    }`}
                  />
                </div>
                <div>
                  <div className="text-sm font-medium text-[#f8f8ff]">Mint as NFT</div>
                  <div className="text-xs text-[#8b8ba7]">
                    Creates an on-chain token (like OpenSea). Requires connected wallet.
                  </div>
                </div>
              </label>
            </div>
          </div>
        )}

        {step === 4 && (
          <div className="space-y-4">
            <h2 className="text-xl font-bold text-[#f8f8ff]">Review & Publish</h2>
            <div className="space-y-3">
              {[
                { label: "Title", value: data.title || "(not set)" },
                { label: "Category", value: data.category },
                { label: "Tags", value: data.tags || "(none)" },
                { label: "Pricing", value: data.priceType === "free" ? "Free" : `$${data.priceUsd}` },
                { label: "Gem Tier", value: data.gemTier === "auto" ? "Auto-assigned by AI" : data.gemTier },
                { label: "Mint as NFT", value: data.mintAsNft ? "Yes" : "No" },
              ].map(({ label, value }) => (
                <div key={label} className="flex justify-between py-2 border-b border-[#1e1e2e] text-sm">
                  <span className="text-[#8b8ba7]">{label}</span>
                  <span className="text-[#f8f8ff] font-medium capitalize">{value}</span>
                </div>
              ))}
            </div>
            <div className="p-4 rounded-xl bg-[#7c3aed10] border border-[#7c3aed30] text-sm text-[#a78bfa]">
              After publishing, 3 AI agents will audit your skill for security, quality, and model fit.
              Your gem tier will be assigned automatically if you chose auto.
            </div>
          </div>
        )}

        {/* Navigation */}
        <div className="flex items-center justify-between mt-6 pt-4 border-t border-[#1e1e2e]">
          <button
            onClick={() => setStep(Math.max(0, step - 1))}
            disabled={step === 0}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm text-[#8b8ba7] hover:text-[#f8f8ff] hover:bg-[#1e1e2e] transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <ArrowLeft size={15} />
            Back
          </button>

          {step < STEPS.length - 1 ? (
            <button
              onClick={() => setStep(step + 1)}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-[#7c3aed] text-white text-sm font-medium hover:bg-[#6d28d9] transition-colors"
            >
              Next
              <ChevronRight size={15} />
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-[#00d97e] text-black text-sm font-semibold hover:bg-[#00c070] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? (
                <>
                  <Loader2 size={15} className="animate-spin" />
                  Publishing…
                </>
              ) : (
                <>
                  <CheckCircle size={15} />
                  Publish Skill
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
