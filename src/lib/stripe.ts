import Stripe from "stripe";

let stripeClient: Stripe | null = null;

export function getStripe() {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey || secretKey.includes("your-") || secretKey.includes("example")) {
    throw new Error("STRIPE_SECRET_KEY is not configured.");
  }
  stripeClient ??= new Stripe(secretKey, {
    apiVersion: "2026-04-22.dahlia",
  });
  return stripeClient;
}

export const PLATFORM_FEE_PERCENT = 15;

export const SUPPORTED_CURRENCIES = [
  { code: "USD", symbol: "$", flag: "🇺🇸", name: "US Dollar" },
  { code: "EUR", symbol: "€", flag: "🇪🇺", name: "Euro" },
  { code: "GBP", symbol: "£", flag: "🇬🇧", name: "British Pound" },
  { code: "CAD", symbol: "CA$", flag: "🇨🇦", name: "Canadian Dollar" },
  { code: "AUD", symbol: "A$", flag: "🇦🇺", name: "Australian Dollar" },
  { code: "JPY", symbol: "¥", flag: "🇯🇵", name: "Japanese Yen" },
  { code: "SGD", symbol: "S$", flag: "🇸🇬", name: "Singapore Dollar" },
] as const;

export type SupportedCurrency = (typeof SUPPORTED_CURRENCIES)[number]["code"];
