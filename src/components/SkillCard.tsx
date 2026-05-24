"use client";

import Link from "next/link";
import { TrendingUp, TrendingDown, Download, Zap } from "lucide-react";
import type { Skill } from "@/types/skill";
import { GemBadge } from "./GemBadge";
import { formatCurrency, formatNumber, formatPercent } from "@/lib/utils";
import { cn } from "@/lib/utils";

interface SkillCardProps {
  skill: Skill;
  currency?: string;
  compact?: boolean;
}

export function SkillCard({ skill, currency = "USD", compact = false }: SkillCardProps) {
  const priceChange = skill.price_change_24h ?? 0;
  const isUp = priceChange >= 0;

  return (
    <Link href={`/skill/${skill.id}`}>
      <div
        className={cn(
          "group relative rounded-2xl border transition-all duration-200 cursor-pointer",
          "bg-[#12121a] border-[#1e1e2e] hover:border-[#2e2e4e] hover:bg-[#15151f]",
          "hover:shadow-[0_8px_32px_rgba(0,0,0,0.4)]",
          compact ? "p-4" : "p-5"
        )}
      >
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <GemBadge tier={skill.gem_tier} size="xs" />
              {skill.is_free && (
                <span className="text-xs px-1.5 py-0.5 rounded bg-[#00d97e15] text-[#00d97e] border border-[#00d97e30] font-medium">
                  FREE
                </span>
              )}
              {skill.is_minted && (
                <span className="text-xs px-1.5 py-0.5 rounded bg-[#60efff15] text-[#60efff] border border-[#60efff30] font-medium">
                  NFT
                </span>
              )}
            </div>
            <h3 className="font-semibold text-[#f8f8ff] truncate group-hover:text-white transition-colors">
              {skill.title}
            </h3>
            <p className="text-xs text-[#8b8ba7] mt-0.5">
              by {skill.creator?.username ?? "unknown"}
            </p>
          </div>

          {/* Price block */}
          <div className="text-right ml-4 shrink-0">
            <div className="text-xl font-mono font-bold text-[#f8f8ff]">
              {skill.is_free
                ? "Free"
                : formatCurrency(skill.current_price ?? skill.price_usd, currency)}
            </div>
            {!skill.is_free && (
              <div
                className={cn(
                  "flex items-center justify-end gap-0.5 text-xs font-medium mt-0.5",
                  isUp ? "text-[#00d97e]" : "text-[#ff4d4d]"
                )}
              >
                {isUp ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
                {formatPercent(priceChange)}
              </div>
            )}
          </div>
        </div>

        {!compact && (
          <p className="text-sm text-[#8b8ba7] line-clamp-2 mb-4 leading-relaxed">
            {skill.description}
          </p>
        )}

        {/* Tags */}
        {!compact && (
          <div className="flex flex-wrap gap-1 mb-4">
            {skill.tags.slice(0, 3).map((tag) => (
              <span
                key={tag}
                className="text-xs px-2 py-0.5 rounded-full bg-[#1e1e2e] text-[#8b8ba7] border border-[#2e2e4e]"
              >
                {tag}
              </span>
            ))}
          </div>
        )}

        {/* Footer stats */}
        <div className="flex items-center justify-between text-xs text-[#8b8ba7]">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <Download size={11} />
              {formatNumber(skill.downloads)}
            </span>
            {(skill.volume_24h ?? 0) > 0 && (
              <span className="flex items-center gap-1">
                <Zap size={11} />
                {formatCurrency(skill.volume_24h ?? 0, currency)} vol
              </span>
            )}
          </div>
          {skill.model_recommendation && (
            <span className="text-[#60efff] opacity-70 truncate max-w-[100px]">
              {skill.model_recommendation.split("-").slice(1, 3).join(" ")}
            </span>
          )}
        </div>

        {/* Secure score bar */}
        {skill.secure_score !== null && skill.secure_score !== undefined && (
          <div className="mt-3 pt-3 border-t border-[#1e1e2e]">
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="text-[#8b8ba7]">Secure Score</span>
              <span
                className="font-mono font-semibold"
                style={{
                  color:
                    skill.secure_score >= 90 ? "#60efff" :
                    skill.secure_score >= 80 ? "#00d97e" :
                    skill.secure_score >= 65 ? "#e8e8f0" :
                    skill.secure_score >= 50 ? "#a78bfa" : "#ff4d4d",
                }}
              >
                {skill.secure_score}/100
              </span>
            </div>
            <div className="h-1 bg-[#1e1e2e] rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: `${skill.secure_score}%`,
                  background:
                    skill.secure_score >= 90 ? "#60efff" :
                    skill.secure_score >= 80 ? "#00d97e" :
                    skill.secure_score >= 65 ? "#e8e8f0" :
                    skill.secure_score >= 50 ? "#a78bfa" : "#ff4d4d",
                }}
              />
            </div>
          </div>
        )}
      </div>
    </Link>
  );
}
