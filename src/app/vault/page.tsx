"use client";

import { useState } from "react";
import Link from "next/link";
import { Vault, ArrowUpRight, Eye, EyeOff, Trash2, Upload, Lock, Sparkles, Plus } from "lucide-react";
import { MOCK_SKILLS } from "@/lib/mock-data";
import { GemBadge } from "@/components/GemBadge";
import { formatCurrency } from "@/lib/utils";
import type { Skill } from "@/types/skill";

type VaultItem = {
  skill: Skill;
  savedAt: string;
  note: string;
  isOwned: boolean;
};

// Seed vault with a couple of dreamed skills for demo
const INITIAL_VAULT: VaultItem[] = [
  {
    skill: MOCK_SKILLS[0],
    savedAt: "2024-11-10T09:00:00Z",
    note: "Review for production use — waiting on security approval",
    isOwned: false,
  },
  {
    skill: MOCK_SKILLS[5],
    savedAt: "2024-11-08T14:30:00Z",
    note: "Already using in CI pipeline",
    isOwned: true,
  },
  {
    skill: MOCK_SKILLS[8],
    savedAt: "2024-11-05T11:00:00Z",
    note: "",
    isOwned: false,
  },
];

export default function VaultPage() {
  const [items, setItems] = useState<VaultItem[]>(INITIAL_VAULT);
  const [activeTab, setActiveTab] = useState<"saved" | "owned">("saved");
  const [editingNote, setEditingNote] = useState<string | null>(null);
  const [noteText, setNoteText] = useState("");

  const savedItems = items.filter((i) => !i.isOwned);
  const ownedItems = items.filter((i) => i.isOwned);
  const displayItems = activeTab === "saved" ? savedItems : ownedItems;

  const removeItem = (skillId: string) => {
    setItems((prev) => prev.filter((i) => i.skill.id !== skillId));
  };

  const startEditNote = (skillId: string, currentNote: string) => {
    setEditingNote(skillId);
    setNoteText(currentNote);
  };

  const saveNote = (skillId: string) => {
    setItems((prev) =>
      prev.map((i) => (i.skill.id === skillId ? { ...i, note: noteText } : i))
    );
    setEditingNote(null);
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#177CB0] to-[#00B0BA] flex items-center justify-center">
            <Vault size={20} className="text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-[#f8f8ff]">My Vault</h1>
            <p className="text-sm text-[#8b8ba7]">Private skill storage — dream, modify, publish when ready</p>
          </div>
        </div>

        {/* Stats */}
        <div className="mt-5 grid grid-cols-3 gap-3">
          {[
            { label: "Dreamed Skills", value: savedItems.length, icon: Sparkles, color: "#177CB0" },
            { label: "Owned Skills", value: ownedItems.length, icon: Lock, color: "#00d97e" },
            { label: "Total in Vault", value: items.length, icon: Vault, color: "#00B0BA" },
          ].map(({ label, value, icon: Icon, color }) => (
            <div key={label} className="bg-[#12121a] border border-[#1e1e2e] rounded-xl p-4">
              <Icon size={16} style={{ color }} className="mb-1.5" />
              <div className="text-2xl font-mono font-bold text-[#f8f8ff]">{value}</div>
              <div className="text-xs text-[#8b8ba7]">{label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-5 bg-[#12121a] border border-[#1e1e2e] rounded-xl p-1 w-fit">
        {(["saved", "owned"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors capitalize ${
              activeTab === tab
                ? "bg-[#177CB0] text-white"
                : "text-[#8b8ba7] hover:text-[#f8f8ff]"
            }`}
          >
            {tab === "saved" ? "Dreamed" : "Owned"} ({(tab === "saved" ? savedItems : ownedItems).length})
          </button>
        ))}
      </div>

      {/* Vault items */}
      {displayItems.length === 0 ? (
        <div className="text-center py-20 border border-dashed border-[#1e1e2e] rounded-2xl">
          <Vault size={40} className="mx-auto mb-3 text-[#2e2e4e]" />
          <p className="text-[#8b8ba7] mb-2">
            {activeTab === "saved" ? "No dreamed skills yet" : "No owned skills yet"}
          </p>
          <p className="text-sm text-[#4a4a5a] mb-5">
            {activeTab === "saved"
              ? "Hit the Dream button on any skill to save it here privately"
              : "Skills you purchase or create appear here"}
          </p>
          <Link
            href="/marketplace"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#177CB0] text-white text-sm font-medium hover:bg-[#065279] transition-colors"
          >
            <Plus size={15} />
            Browse Marketplace
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {displayItems.map(({ skill, savedAt, note, isOwned }) => (
            <div
              key={skill.id}
              className="bg-[#12121a] border border-[#1e1e2e] rounded-2xl p-5 hover:border-[#2e2e4e] transition-colors group"
            >
              <div className="flex items-start gap-4">
                {/* Gem indicator */}
                <div className="shrink-0 mt-0.5">
                  <GemBadge tier={skill.gem_tier} size="sm" />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <Link
                        href={`/skill/${skill.id}`}
                        className="text-base font-semibold text-[#f8f8ff] hover:text-[#177CB0] transition-colors"
                      >
                        {skill.title}
                      </Link>
                      <p className="text-xs text-[#8b8ba7] mt-0.5 line-clamp-1">{skill.description}</p>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      {/* Price */}
                      <span className="text-sm font-mono text-[#f8f8ff]">
                        {skill.is_free ? "Free" : formatCurrency(skill.price_usd, "USD")}
                      </span>
                    </div>
                  </div>

                  {/* Meta row */}
                  <div className="flex items-center gap-3 mt-2 text-xs text-[#4a4a5a]">
                    <span className="flex items-center gap-1">
                      {isOwned ? <Lock size={10} className="text-[#00d97e]" /> : <Sparkles size={10} className="text-[#177CB0]" />}
                      {isOwned ? "Owned" : "Dreamed"} {new Date(savedAt).toLocaleDateString()}
                    </span>
                    <span>{skill.category}</span>
                    {skill.secure_score && (
                      <span className="text-[#00B0BA]">SecureScore {skill.secure_score}</span>
                    )}
                  </div>

                  {/* Note */}
                  {editingNote === skill.id ? (
                    <div className="mt-3 flex gap-2">
                      <input
                        autoFocus
                        value={noteText}
                        onChange={(e) => setNoteText(e.target.value)}
                        onKeyDown={(e) => { if (e.key === "Enter") saveNote(skill.id); if (e.key === "Escape") setEditingNote(null); }}
                        placeholder="Add a private note…"
                        className="flex-1 text-xs bg-[#0e0e16] border border-[#2e2e4e] rounded-lg px-3 py-1.5 text-[#f8f8ff] placeholder-[#4a4a5a] focus:border-[#177CB0] focus:outline-none"
                      />
                      <button onClick={() => saveNote(skill.id)} className="text-xs px-3 py-1.5 bg-[#177CB0] text-white rounded-lg hover:bg-[#065279]">Save</button>
                      <button onClick={() => setEditingNote(null)} className="text-xs px-3 py-1.5 text-[#8b8ba7] hover:text-[#f8f8ff] rounded-lg border border-[#1e1e2e]">Cancel</button>
                    </div>
                  ) : (
                    <button
                      onClick={() => startEditNote(skill.id, note)}
                      className="mt-2 text-xs text-[#4a4a5a] hover:text-[#8b8ba7] transition-colors text-left"
                    >
                      {note || "+ Add private note"}
                    </button>
                  )}
                </div>

                {/* Actions */}
                <div className="flex flex-col gap-2 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Link
                    href={`/skill/${skill.id}`}
                    className="p-2 rounded-lg bg-[#1e1e2e] text-[#8b8ba7] hover:text-[#f8f8ff] transition-colors"
                    title="View skill"
                  >
                    <ArrowUpRight size={14} />
                  </Link>
                  {!isOwned && (
                    <Link
                      href="/submit"
                      className="p-2 rounded-lg bg-[#1e1e2e] text-[#8b8ba7] hover:text-[#4B5CC4] transition-colors"
                      title="Publish to marketplace"
                    >
                      <Upload size={14} />
                    </Link>
                  )}
                  <button
                    onClick={() => removeItem(skill.id)}
                    className="p-2 rounded-lg bg-[#1e1e2e] text-[#8b8ba7] hover:text-[#ff4d4d] transition-colors"
                    title="Remove from vault"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Info banner */}
      <div className="mt-8 p-4 rounded-xl bg-[#177CB010] border border-[#177CB030] flex items-start gap-3">
        <Lock size={15} className="text-[#177CB0] mt-0.5 shrink-0" />
        <div>
          <p className="text-sm font-medium text-[#f8f8ff] mb-0.5">Your vault is private</p>
          <p className="text-xs text-[#8b8ba7]">
            Skills here are visible only to you. Use the <Upload size={10} className="inline" /> icon to list any skill publicly on the marketplace when you&apos;re ready. Owned skills remain accessible even if they&apos;re delisted.
          </p>
        </div>
      </div>
    </div>
  );
}
