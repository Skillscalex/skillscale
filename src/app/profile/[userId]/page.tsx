"use client";

import { use } from "react";
import Link from "next/link";
import {
  Gem,
  Wallet,
  Download,
  TrendingUp,
  Plus,
  Copy,
  ExternalLink,
  Coins,
} from "lucide-react";
import { SkillCard } from "@/components/SkillCard";
import { GemBadge } from "@/components/GemBadge";
import { MOCK_SKILLS } from "@/lib/mock-data";
import { useCurrency } from "@/components/Providers";
import { formatCurrency, formatNumber, truncateAddress, relativeTime } from "@/lib/utils";

const MOCK_USER = {
  id: "user-001",
  email: "alice@dev.io",
  username: "alice_dev",
  avatar_url: null,
  platform_token_balance: 5000,
  wallet_address: "0x742d35Cc6634C0532925a3b8D4C9B5B2f41f8Dca",
  created_at: "2024-01-01T00:00:00Z",
};

const MOCK_TRANSACTIONS = [
  { id: "tx-1", skillTitle: "CodeReview Pro", amount: 49.99, currency: "USD", type: "sale", created_at: "2024-06-10T14:23:00Z" },
  { id: "tx-2", skillTitle: "TestGen Ultra", amount: 39.99, currency: "USD", type: "sale", created_at: "2024-06-09T11:05:00Z" },
  { id: "tx-3", skillTitle: "DataViz Wizard", amount: 29.99, currency: "USD", type: "purchase", created_at: "2024-06-08T09:42:00Z" },
  { id: "tx-4", skillTitle: "APIDesigner Pro", amount: 59.99, currency: "USD", type: "sale", created_at: "2024-06-07T16:15:00Z" },
];

export default function ProfilePage({ params }: { params: Promise<{ userId: string }> }) {
  const { userId } = use(params);
  const { currency } = useCurrency();

  const isMe = userId === "me" || userId === MOCK_USER.id;
  const user = MOCK_USER;

  const createdSkills = MOCK_SKILLS.filter((s) => s.creator_id === user.id);
  const ownedSkills = MOCK_SKILLS.filter((s) => s.gem_tier === "diamond").slice(0, 2);

  const totalEarnings = MOCK_TRANSACTIONS
    .filter((t) => t.type === "sale")
    .reduce((sum, t) => sum + t.amount, 0);

  const gemStats = Object.entries(
    createdSkills.reduce((acc, s) => {
      acc[s.gem_tier] = (acc[s.gem_tier] ?? 0) + 1;
      return acc;
    }, {} as Record<string, number>)
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      {/* Profile header */}
      <div className="bg-[#12121a] border border-[#1e1e2e] rounded-2xl p-6 mb-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">
          {/* Avatar */}
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-[#177CB0] to-[#00B0BA] flex items-center justify-center text-3xl font-bold text-white shrink-0">
            {user.username[0].toUpperCase()}
          </div>

          <div className="flex-1 min-w-0">
            <h1 className="text-2xl font-bold text-[#f8f8ff]">@{user.username}</h1>
            <p className="text-[#8b8ba7] text-sm mt-0.5">Member since {relativeTime(user.created_at)}</p>

            {/* Wallet */}
            {user.wallet_address && (
              <div className="flex items-center gap-2 mt-2">
                <Wallet size={13} className="text-[#8b8ba7]" />
                <span className="text-xs font-mono text-[#8b8ba7]">
                  {truncateAddress(user.wallet_address)}
                </span>
                <button className="text-[#8b8ba7] hover:text-[#f8f8ff] transition-colors">
                  <Copy size={12} />
                </button>
                <a
                  href={`https://etherscan.io/address/${user.wallet_address}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#8b8ba7] hover:text-[#f8f8ff] transition-colors"
                >
                  <ExternalLink size={12} />
                </a>
              </div>
            )}

            {/* Gem breakdown */}
            <div className="flex flex-wrap gap-2 mt-3">
              {gemStats.map(([tier, count]) => (
                <div key={tier} className="flex items-center gap-1">
                  <GemBadge tier={tier as any} size="xs" />
                  <span className="text-xs text-[#8b8ba7]">×{count}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4 sm:gap-6 text-center">
            <div>
              <div className="text-xl font-mono font-bold text-[#f8f8ff]">{createdSkills.length}</div>
              <div className="text-xs text-[#8b8ba7]">Skills</div>
            </div>
            <div>
              <div className="text-xl font-mono font-bold text-[#00d97e]">
                {formatCurrency(totalEarnings, currency)}
              </div>
              <div className="text-xs text-[#8b8ba7]">Earnings</div>
            </div>
            <div>
              <div className="text-xl font-mono font-bold text-[#4B5CC4]">
                {formatNumber(createdSkills.reduce((s, k) => s + k.downloads, 0))}
              </div>
              <div className="text-xs text-[#8b8ba7]">Downloads</div>
            </div>
          </div>
        </div>

        {/* Token balance */}
        <div className="mt-5 pt-5 border-t border-[#1e1e2e] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Coins size={18} className="text-[#4B5CC4]" />
            <div>
              <div className="text-sm font-semibold text-[#f8f8ff]">
                {user.platform_token_balance.toLocaleString()} SKL
              </div>
              <div className="text-xs text-[#8b8ba7]">Platform Tokens</div>
            </div>
          </div>
          <button className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#177CB020] border border-[#177CB030] text-[#4B5CC4] text-sm font-medium hover:bg-[#177CB030] transition-colors">
            <Plus size={14} />
            Buy SKL
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Created skills */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-[#f8f8ff] flex items-center gap-2">
                <Gem size={16} className="text-[#4B5CC4]" />
                Created Skills
              </h2>
              {isMe && (
                <Link
                  href="/submit"
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#177CB0] text-white text-sm font-medium hover:bg-[#065279] transition-colors"
                >
                  <Plus size={13} />
                  New
                </Link>
              )}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {createdSkills.map((skill) => (
                <SkillCard key={skill.id} skill={skill} currency={currency} />
              ))}
              {createdSkills.length === 0 && (
                <div className="sm:col-span-2 text-center py-10 text-[#8b8ba7]">
                  <p className="text-3xl mb-2">💎</p>
                  <p>No skills created yet</p>
                </div>
              )}
            </div>
          </div>

          {/* Owned skills */}
          <div>
            <h2 className="text-lg font-bold text-[#f8f8ff] flex items-center gap-2 mb-4">
              <Download size={16} className="text-[#00d97e]" />
              Owned Skills
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {ownedSkills.map((skill) => (
                <SkillCard key={skill.id} skill={skill} currency={currency} compact />
              ))}
              {ownedSkills.length === 0 && (
                <div className="sm:col-span-2 text-center py-10 text-[#8b8ba7]">
                  <p className="text-3xl mb-2">🛒</p>
                  <p>No purchased skills yet</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Transaction history */}
        <div>
          <h2 className="text-lg font-bold text-[#f8f8ff] flex items-center gap-2 mb-4">
            <TrendingUp size={16} className="text-[#00B0BA]" />
            Transaction History
          </h2>
          <div className="bg-[#12121a] border border-[#1e1e2e] rounded-2xl overflow-hidden">
            {MOCK_TRANSACTIONS.map((tx, i) => (
              <div
                key={tx.id}
                className={`p-4 flex items-center gap-3 ${
                  i < MOCK_TRANSACTIONS.length - 1 ? "border-b border-[#1e1e2e]" : ""
                }`}
              >
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                    tx.type === "sale"
                      ? "bg-[#00d97e15] text-[#00d97e]"
                      : "bg-[#ff4d4d15] text-[#ff4d4d]"
                  }`}
                >
                  {tx.type === "sale" ? "↑" : "↓"}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-[#f8f8ff] truncate">
                    {tx.skillTitle}
                  </div>
                  <div className="text-xs text-[#8b8ba7]">{relativeTime(tx.created_at)}</div>
                </div>
                <div
                  className={`text-sm font-mono font-semibold shrink-0 ${
                    tx.type === "sale" ? "text-[#00d97e]" : "text-[#ff4d4d]"
                  }`}
                >
                  {tx.type === "sale" ? "+" : "-"}{formatCurrency(tx.amount, currency)}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
