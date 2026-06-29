export type GemTier = "coal" | "quartz" | "pearl" | "emerald" | "diamond";

export type PaymentType = "stripe" | "crypto" | "token";

export type OrderSide = "buy" | "sell";

export type OrderStatus = "open" | "filled" | "cancelled";

export interface Skill {
  id: string;
  title: string;
  description: string;
  creator_id: string;
  creator?: User;
  gem_tier: GemTier;
  price_usd: number;
  crypto_price_eth: number | null;
  is_free: boolean;
  is_minted: boolean;
  nft_token_id: string | null;
  plugin_json: PluginJson | null;
  category: string;
  tags: string[];
  secure_score: number | null;
  model_recommendation: string | null;
  downloads: number;
  created_at: string;
  skills_readme?: string;
  rating?: number;
  review_count?: number;
  // Computed from orders
  current_price?: number;
  price_change_24h?: number;
  volume_24h?: number;
}

export interface Review {
  id: string;
  skill_id: string;
  user_id: string;
  username: string;
  avatar_url: string | null;
  rating: number;
  comment: string;
  created_at: string;
  helpful_count: number;
}

export interface PluginJson {
  name: string;
  version: string;
  description: string;
  author: string;
  commands?: PluginCommand[];
  agents?: PluginAgent[];
  skills?: PluginSkill[];
  mcp?: McpConfig;
}

export interface PluginCommand {
  name: string;
  description: string;
  script: string;
}

export interface PluginAgent {
  name: string;
  description: string;
  model: string;
}

export interface PluginSkill {
  name: string;
  description: string;
  trigger: string;
}

export interface McpConfig {
  server: string;
  args?: string[];
  env?: Record<string, string>;
}

export interface User {
  id: string;
  email: string;
  username: string;
  avatar_url: string | null;
  platform_token_balance: number;
  wallet_address: string | null;
  created_at: string;
}

export interface Order {
  id: string;
  skill_id: string;
  user_id: string;
  side: OrderSide;
  price: number;
  quantity: number;
  status: OrderStatus;
  created_at: string;
}

export interface Transaction {
  id: string;
  skill_id: string;
  buyer_id: string;
  seller_id: string;
  amount: number;
  currency: string;
  payment_type: PaymentType;
  stripe_session_id: string | null;
  tx_hash: string | null;
  created_at: string;
  skill?: Skill;
}

export interface OrderBookEntry {
  price: number;
  quantity: number;
  total: number;
}

export interface OrderBook {
  bids: OrderBookEntry[];
  asks: OrderBookEntry[];
  mid_price: number;
  spread: number;
}

export const GEM_TIER_CONFIG: Record<GemTier, {
  label: string;
  color: string;
  bg: string;
  minScore: number;
  icon: string;
}> = {
  coal:    { label: "Coal",    color: "#4a4a5a", bg: "#1a1a22", minScore: 0,  icon: "⬛" },
  quartz:  { label: "Quartz",  color: "#4B5CC4", bg: "#1e1829", minScore: 50, icon: "💜" },
  pearl:   { label: "Pearl",   color: "#e8e8f0", bg: "#1e1e28", minScore: 65, icon: "🤍" },
  emerald: { label: "Emerald", color: "#00d97e", bg: "#0d1f18", minScore: 80, icon: "💚" },
  diamond: { label: "Diamond", color: "#00B0BA", bg: "#0d1e22", minScore: 90, icon: "💎" },
};

export function scoreToTier(score: number): GemTier {
  if (score >= 90) return "diamond";
  if (score >= 80) return "emerald";
  if (score >= 65) return "pearl";
  if (score >= 50) return "quartz";
  return "coal";
}
