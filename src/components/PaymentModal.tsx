"use client";

import { useState } from "react";
import {
  CreditCard,
  Wallet,
  Coins,
  X,
  ExternalLink,
  CheckCircle,
  Loader2,
} from "lucide-react";
import type { Skill } from "@/types/skill";
import { formatCurrency } from "@/lib/utils";

interface PaymentModalProps {
  skill: Skill;
  currency?: string;
  onClose: () => void;
  onSuccess?: (txId: string) => void;
}

type Tab = "fiat" | "crypto" | "token";

const PAYMENT_METHODS = [
  { id: "card", label: "Credit / Debit Card", icon: "💳", brand: true },
  { id: "paypal", label: "PayPal", icon: "🅿️", brand: true },
  { id: "apple_pay", label: "Apple Pay", icon: "🍎", brand: true },
  { id: "google_pay", label: "Google Pay", icon: "G", brand: true },
];

export function PaymentModal({ skill, currency = "USD", onClose, onSuccess }: PaymentModalProps) {
  const [tab, setTab] = useState<Tab>("fiat");
  const [selectedMethod, setSelectedMethod] = useState("card");
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const price = skill.price_usd;
  const total = price * quantity;

  async function handleFiatPurchase() {
    setLoading(true);
    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ skillId: skill.id, quantity, currency, method: selectedMethod }),
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      }
    } catch {
      // demo mode
      await new Promise((r) => setTimeout(r, 1200));
      setSuccess(true);
      onSuccess?.("tx_demo_" + Date.now());
    } finally {
      setLoading(false);
    }
  }

  async function handleCryptoPurchase() {
    setLoading(true);
    await new Promise((r) => setTimeout(r, 1500));
    setSuccess(true);
    setLoading(false);
    onSuccess?.("0x" + Math.random().toString(16).slice(2, 18));
  }

  async function handleTokenPurchase() {
    setLoading(true);
    try {
      const res = await fetch("/api/tokens/transfer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ skillId: skill.id, quantity }),
      });
      if (res.ok) {
        setSuccess(true);
        onSuccess?.("token_tx_" + Date.now());
      }
    } catch {
      await new Promise((r) => setTimeout(r, 1000));
      setSuccess(true);
    } finally {
      setLoading(false);
    }
  }

  const tokenCost = Math.round(price * quantity * 1000);

  if (success) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
        <div className="bg-[#12121a] border border-[#1e1e2e] rounded-2xl p-8 w-full max-w-sm text-center">
          <CheckCircle size={48} className="text-[#00d97e] mx-auto mb-4" />
          <h3 className="text-xl font-bold text-[#f8f8ff] mb-2">Purchase Complete!</h3>
          <p className="text-[#8b8ba7] text-sm mb-6">
            You now own <strong className="text-[#f8f8ff]">{skill.title}</strong>.
            Check your profile for access details.
          </p>
          <button
            onClick={onClose}
            className="w-full py-3 rounded-xl bg-[#00d97e] text-black font-semibold hover:bg-[#00c070] transition-colors"
          >
            Continue
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="bg-[#12121a] border border-[#1e1e2e] rounded-2xl w-full max-w-md">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-[#1e1e2e]">
          <div>
            <h3 className="font-bold text-[#f8f8ff]">Purchase Skill</h3>
            <p className="text-sm text-[#8b8ba7] mt-0.5">{skill.title}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-[#1e1e2e] text-[#8b8ba7] hover:text-[#f8f8ff] transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-[#1e1e2e]">
          {[
            { id: "fiat" as Tab, icon: <CreditCard size={15} />, label: "Card / PayPal" },
            { id: "crypto" as Tab, icon: <Wallet size={15} />, label: "Crypto" },
            { id: "token" as Tab, icon: <Coins size={15} />, label: "SKL Tokens" },
          ].map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-medium transition-colors ${
                tab === t.id
                  ? "text-[#f8f8ff] border-b-2 border-[#177CB0]"
                  : "text-[#8b8ba7] hover:text-[#f8f8ff]"
              }`}
            >
              {t.icon}
              {t.label}
            </button>
          ))}
        </div>

        <div className="p-5 space-y-4">
          {/* Quantity */}
          <div className="flex items-center justify-between">
            <span className="text-sm text-[#8b8ba7]">Quantity</span>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                className="w-8 h-8 rounded-lg bg-[#1e1e2e] text-[#f8f8ff] hover:bg-[#2e2e4e] transition-colors flex items-center justify-center font-bold"
              >
                −
              </button>
              <span className="font-mono font-semibold text-[#f8f8ff] w-6 text-center">{quantity}</span>
              <button
                onClick={() => setQuantity(quantity + 1)}
                className="w-8 h-8 rounded-lg bg-[#1e1e2e] text-[#f8f8ff] hover:bg-[#2e2e4e] transition-colors flex items-center justify-center font-bold"
              >
                +
              </button>
            </div>
          </div>

          {/* Price breakdown */}
          <div className="bg-[#0e0e16] rounded-xl p-4 space-y-2 text-sm">
            <div className="flex justify-between text-[#8b8ba7]">
              <span>Subtotal ({quantity}×)</span>
              <span className="text-[#f8f8ff] font-mono">{formatCurrency(total, currency)}</span>
            </div>
            <div className="flex justify-between text-[#8b8ba7]">
              <span>Platform fee (15%)</span>
              <span className="text-[#f8f8ff] font-mono">{formatCurrency(total * 0.15, currency)}</span>
            </div>
            <div className="h-px bg-[#1e1e2e]" />
            <div className="flex justify-between font-bold">
              <span className="text-[#f8f8ff]">Total</span>
              <span className="text-[#f8f8ff] font-mono text-base">
                {tab === "token"
                  ? `${tokenCost.toLocaleString()} SKL`
                  : tab === "crypto"
                  ? `${((total * 1.15) / 3200).toFixed(6)} ETH`
                  : formatCurrency(total * 1.15, currency)}
              </span>
            </div>
          </div>

          {/* Fiat methods */}
          {tab === "fiat" && (
            <div className="space-y-2">
              {PAYMENT_METHODS.map((method) => (
                <button
                  key={method.id}
                  onClick={() => setSelectedMethod(method.id)}
                  className={`w-full flex items-center gap-3 p-3.5 rounded-xl border transition-all ${
                    selectedMethod === method.id
                      ? "border-[#177CB0] bg-[#177CB015]"
                      : "border-[#1e1e2e] bg-[#0e0e16] hover:border-[#2e2e4e]"
                  }`}
                >
                  <span className="text-2xl w-8 text-center">{method.icon}</span>
                  <span className="text-sm font-medium text-[#f8f8ff]">{method.label}</span>
                  {selectedMethod === method.id && (
                    <span className="ml-auto w-4 h-4 rounded-full bg-[#177CB0] flex items-center justify-center">
                      <span className="w-1.5 h-1.5 rounded-full bg-white" />
                    </span>
                  )}
                </button>
              ))}
            </div>
          )}

          {/* Crypto */}
          {tab === "crypto" && (
            <div className="space-y-3">
              <div className="p-4 rounded-xl border border-[#1e1e2e] bg-[#0e0e16]">
                <div className="text-xs text-[#8b8ba7] mb-2 flex items-center gap-1.5">
                  <Wallet size={12} />
                  Send to seller wallet
                </div>
                <div className="font-mono text-xs text-[#00B0BA] break-all">
                  0x742d35Cc6634C0532925a3b8D4C9B5B2f41f8Dca
                </div>
                <button className="mt-2 flex items-center gap-1 text-xs text-[#8b8ba7] hover:text-[#f8f8ff] transition-colors">
                  <ExternalLink size={11} />
                  View on Etherscan
                </button>
              </div>
              <div className="text-xs text-[#8b8ba7] text-center">
                Supports ETH, USDC, USDT on Ethereum / Polygon
              </div>
            </div>
          )}

          {/* Platform Token */}
          {tab === "token" && (
            <div className="p-4 rounded-xl border border-[#177CB030] bg-[#177CB00a]">
              <div className="flex items-center gap-2 mb-2">
                <Coins size={16} className="text-[#4B5CC4]" />
                <span className="text-sm font-semibold text-[#4B5CC4]">Skillscale Tokens (SKL)</span>
              </div>
              <div className="text-xs text-[#8b8ba7] space-y-1">
                <div className="flex justify-between">
                  <span>Your balance</span>
                  <span className="text-[#4B5CC4] font-mono">0 SKL</span>
                </div>
                <div className="flex justify-between">
                  <span>Required</span>
                  <span className="text-[#f8f8ff] font-mono">{tokenCost.toLocaleString()} SKL</span>
                </div>
              </div>
              <button className="mt-3 w-full text-xs py-2 rounded-lg bg-[#177CB020] border border-[#177CB040] text-[#4B5CC4] hover:bg-[#177CB030] transition-colors">
                Buy more SKL tokens
              </button>
            </div>
          )}

          {/* CTA */}
          <button
            onClick={tab === "fiat" ? handleFiatPurchase : tab === "crypto" ? handleCryptoPurchase : handleTokenPurchase}
            disabled={loading}
            className="w-full py-3.5 rounded-xl bg-[#177CB0] text-white font-semibold text-sm hover:bg-[#065279] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                Processing…
              </>
            ) : skill.is_free ? (
              "Get for Free"
            ) : (
              `Buy Now`
            )}
          </button>

          <p className="text-xs text-center text-[#8b8ba7]">
            By purchasing you agree to the{" "}
            <a href="#" className="text-[#177CB0] hover:underline">Terms of Service</a>
          </p>
        </div>
      </div>
    </div>
  );
}
