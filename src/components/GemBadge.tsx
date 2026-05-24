"use client";

import { GEM_TIER_CONFIG, type GemTier } from "@/types/skill";
import { cn } from "@/lib/utils";

interface GemBadgeProps {
  tier: GemTier;
  score?: number;
  size?: "xs" | "sm" | "md" | "lg";
  showLabel?: boolean;
}

const SIZE_CLASSES = {
  xs: "text-xs px-1.5 py-0.5 gap-1",
  sm: "text-xs px-2 py-1 gap-1",
  md: "text-sm px-3 py-1.5 gap-1.5",
  lg: "text-base px-4 py-2 gap-2",
};

const GLOW_CLASSES: Record<GemTier, string> = {
  coal:    "",
  quartz:  "shadow-[0_0_8px_rgba(167,139,250,0.4)]",
  pearl:   "shadow-[0_0_8px_rgba(232,232,240,0.3)]",
  emerald: "shadow-[0_0_10px_rgba(0,217,126,0.5)]",
  diamond: "shadow-[0_0_12px_rgba(96,239,255,0.6)]",
};

export function GemBadge({ tier, score, size = "sm", showLabel = true }: GemBadgeProps) {
  const config = GEM_TIER_CONFIG[tier];

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full font-semibold border",
        SIZE_CLASSES[size],
        GLOW_CLASSES[tier]
      )}
      style={{
        color: config.color,
        background: config.bg,
        borderColor: config.color + "40",
      }}
    >
      <span>{config.icon}</span>
      {showLabel && <span>{config.label}</span>}
      {score !== undefined && (
        <span className="opacity-70 text-xs">
          {score}
        </span>
      )}
    </span>
  );
}
