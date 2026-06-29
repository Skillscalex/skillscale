"use client";

import { MintingWizard, type MintingData } from "@/components/MintingWizard";
import { Gem, Shield, Zap } from "lucide-react";

async function handleSubmit(data: MintingData) {
  await fetch("/api/skills", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      title: data.title,
      description: data.description,
      category: data.category,
      tags: data.tags.split(",").map((t) => t.trim()).filter(Boolean),
      price_usd: data.priceType === "free" ? 0 : parseFloat(data.priceUsd),
      is_free: data.priceType === "free",
      gem_tier: data.gemTier === "auto" ? "quartz" : data.gemTier,
      mint_as_nft: data.mintAsNft,
      plugin_json: data.pluginJsonStr ? JSON.parse(data.pluginJsonStr) : null,
    }),
  });
}

export default function SubmitPage() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
      {/* Header */}
      <div className="text-center mb-10">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#177CB015] border border-[#177CB030] text-[#4B5CC4] text-xs font-medium mb-4">
          <Gem size={12} />
          List Your Skill
        </div>
        <h1 className="text-3xl font-bold text-[#f8f8ff] mb-3">
          Submit a Skill to the Marketplace
        </h1>
        <p className="text-[#8b8ba7] max-w-lg mx-auto">
          Share your Claude Code plugin with thousands of developers. Our AI agents will audit it
          for security, quality, and assign a gem tier automatically.
        </p>
      </div>

      {/* Benefits */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-12 max-w-2xl mx-auto">
        {[
          {
            icon: <Shield size={20} className="text-[#00B0BA]" />,
            title: "AI Security Audit",
            desc: "3 agents check your skill before listing",
          },
          {
            icon: <Gem size={20} className="text-[#4B5CC4]" />,
            title: "Gem Tier Assigned",
            desc: "Diamond to Quartz based on score",
          },
          {
            icon: <Zap size={20} className="text-[#00d97e]" />,
            title: "85% Revenue Share",
            desc: "Keep most of what you earn",
          },
        ].map(({ icon, title, desc }) => (
          <div
            key={title}
            className="text-center p-4 rounded-xl bg-[#12121a] border border-[#1e1e2e]"
          >
            <div className="flex justify-center mb-2">{icon}</div>
            <div className="font-semibold text-sm text-[#f8f8ff]">{title}</div>
            <div className="text-xs text-[#8b8ba7] mt-0.5">{desc}</div>
          </div>
        ))}
      </div>

      <MintingWizard onComplete={handleSubmit} />
    </div>
  );
}
