"use client";

interface SecureScoreBarProps {
  score: number;
  label?: string;
  showLabel?: boolean;
}

function getScoreLabel(score: number): string {
  if (score >= 90) return "Excellent";
  if (score >= 80) return "Good";
  if (score >= 65) return "Acceptable";
  if (score >= 50) return "Marginal";
  return "Poor";
}

function getScoreColor(score: number): string {
  if (score >= 90) return "#60efff";
  if (score >= 80) return "#00d97e";
  if (score >= 65) return "#e8e8f0";
  if (score >= 50) return "#a78bfa";
  return "#ff4d4d";
}

export function SecureScoreBar({ score, label, showLabel = true }: SecureScoreBarProps) {
  const color = getScoreColor(score);
  const scoreLabel = label ?? getScoreLabel(score);

  // gradient stops: red → orange → yellow → green → cyan
  const gradient = `linear-gradient(90deg, #ff4d4d 0%, #ff8c00 25%, #ffd700 50%, #00d97e 75%, #60efff 100%)`;

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-[#8b8ba7] uppercase tracking-wider">
            SecureScore
          </span>
          <span
            className="text-xs px-2 py-0.5 rounded-full font-semibold border"
            style={{ color, borderColor: color + "40", background: color + "12" }}
          >
            {scoreLabel}
          </span>
        </div>
        <div className="flex items-baseline gap-0.5">
          <span className="text-2xl font-mono font-bold" style={{ color }}>
            {score}
          </span>
          <span className="text-sm text-[#8b8ba7]">/ 100</span>
        </div>
      </div>

      {/* Track */}
      <div className="relative h-3 rounded-full overflow-hidden bg-[#1e1e2e]">
        {/* Gradient background */}
        <div className="absolute inset-0 opacity-20" style={{ background: gradient }} />
        {/* Filled portion */}
        <div
          className="absolute top-0 left-0 h-full rounded-full transition-all duration-700 ease-out"
          style={{
            width: `${score}%`,
            background: gradient,
            backgroundSize: "500px 100%",
          }}
        />
        {/* Thumb marker */}
        <div
          className="absolute top-1/2 -translate-y-1/2 w-3 h-3 rounded-full border-2 border-[#0a0a0f] shadow-lg transition-all duration-700"
          style={{
            left: `calc(${score}% - 6px)`,
            background: color,
            boxShadow: `0 0 8px ${color}80`,
          }}
        />
      </div>

      {/* Tick labels */}
      {showLabel && (
        <div className="flex justify-between mt-1.5 text-[10px] text-[#4a4a5a]">
          <span>0 — Poor</span>
          <span>50</span>
          <span>65</span>
          <span>80</span>
          <span>100 — Diamond</span>
        </div>
      )}

      {/* Probability description */}
      <p className="mt-2 text-xs text-[#8b8ba7]">
        {score >= 90
          ? "Highly likely to be safe, well-documented, and optimal for production use."
          : score >= 80
          ? "Very likely safe with minor documentation gaps only."
          : score >= 65
          ? "Likely acceptable but has moderate security or quality gaps."
          : score >= 50
          ? "Borderline — significant improvements are recommended before production."
          : "High risk — fails security or quality thresholds. Not listed in marketplace."}
      </p>
    </div>
  );
}
