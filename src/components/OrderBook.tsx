"use client";

import { useState, useEffect } from "react";
import type { OrderBookEntry } from "@/types/skill";
import { formatCurrency } from "@/lib/utils";

interface OrderBookProps {
  skillId: string;
  currentPrice: number;
  currency?: string;
  // For demo purposes, pass mock data; real app uses Supabase Realtime
  mockBids?: OrderBookEntry[];
  mockAsks?: OrderBookEntry[];
}

function generateMockOrders(basePrice: number, side: "bid" | "ask"): OrderBookEntry[] {
  const entries: OrderBookEntry[] = [];
  let cumTotal = 0;
  for (let i = 0; i < 8; i++) {
    const offset = (i + 1) * (basePrice * 0.005);
    const price = side === "bid" ? basePrice - offset : basePrice + offset;
    const qty = Math.floor(Math.random() * 15) + 1;
    cumTotal += qty;
    entries.push({ price: Math.max(0, price), quantity: qty, total: cumTotal });
  }
  return entries;
}

export function OrderBook({ currentPrice, currency = "USD" }: OrderBookProps) {
  const [asks, setAsks] = useState<OrderBookEntry[]>([]);
  const [bids, setBids] = useState<OrderBookEntry[]>([]);

  useEffect(() => {
    setAsks(generateMockOrders(currentPrice, "ask").reverse());
    setBids(generateMockOrders(currentPrice, "bid"));

    // Simulate live updates
    const interval = setInterval(() => {
      setAsks(generateMockOrders(currentPrice * (1 + (Math.random() - 0.5) * 0.01), "ask").reverse());
      setBids(generateMockOrders(currentPrice * (1 + (Math.random() - 0.5) * 0.01), "bid"));
    }, 3000);

    return () => clearInterval(interval);
  }, [currentPrice]);

  const maxTotal = Math.max(
    ...bids.map((b) => b.total),
    ...asks.map((a) => a.total)
  );

  const spread = asks.length && bids.length
    ? asks[asks.length - 1].price - bids[0].price
    : 0;

  return (
    <div className="rounded-xl border border-[#1e1e2e] bg-[#0e0e16] overflow-hidden">
      <div className="px-4 py-3 border-b border-[#1e1e2e] flex items-center justify-between">
        <span className="text-sm font-semibold text-[#f8f8ff]">Order Book</span>
        <span className="text-xs text-[#8b8ba7]">
          Spread: {formatCurrency(spread, currency)}
        </span>
      </div>

      <div className="px-4 py-2 grid grid-cols-3 text-xs text-[#8b8ba7] uppercase tracking-wider">
        <span>Price</span>
        <span className="text-right">Qty</span>
        <span className="text-right">Total</span>
      </div>

      {/* Asks (sell orders) — shown top, in reverse */}
      <div className="flex flex-col">
        {asks.map((ask, i) => (
          <div
            key={i}
            className="relative px-4 py-1 grid grid-cols-3 text-xs hover:bg-[#1e1e2e] transition-colors"
          >
            <div
              className="absolute inset-y-0 right-0 bg-[#ff4d4d0d]"
              style={{ width: `${(ask.total / maxTotal) * 100}%` }}
            />
            <span className="text-[#ff4d4d] font-mono relative z-10">
              {formatCurrency(ask.price, currency)}
            </span>
            <span className="text-right text-[#f8f8ff] font-mono relative z-10">{ask.quantity}</span>
            <span className="text-right text-[#8b8ba7] font-mono relative z-10">{ask.total}</span>
          </div>
        ))}
      </div>

      {/* Mid price */}
      <div className="px-4 py-2 border-y border-[#1e1e2e] bg-[#12121a] flex items-center justify-between">
        <span className="text-base font-mono font-bold text-[#f8f8ff]">
          {formatCurrency(currentPrice, currency)}
        </span>
        <span className="text-xs text-[#8b8ba7]">Last price</span>
      </div>

      {/* Bids (buy orders) */}
      <div className="flex flex-col">
        {bids.map((bid, i) => (
          <div
            key={i}
            className="relative px-4 py-1 grid grid-cols-3 text-xs hover:bg-[#1e1e2e] transition-colors"
          >
            <div
              className="absolute inset-y-0 right-0 bg-[#00d97e0d]"
              style={{ width: `${(bid.total / maxTotal) * 100}%` }}
            />
            <span className="text-[#00d97e] font-mono relative z-10">
              {formatCurrency(bid.price, currency)}
            </span>
            <span className="text-right text-[#f8f8ff] font-mono relative z-10">{bid.quantity}</span>
            <span className="text-right text-[#8b8ba7] font-mono relative z-10">{bid.total}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
