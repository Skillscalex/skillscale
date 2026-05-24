import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const TransferSchema = z.object({
  skillId: z.string(),
  quantity: z.number().min(1).default(1),
  toUserId: z.string().optional(),
});

const PurchaseSchema = z.object({
  amount: z.number().min(100), // min 100 SKL
  currency: z.string().default("USD"),
});

export async function POST(req: NextRequest) {
  const url = new URL(req.url);
  const action = url.searchParams.get("action") ?? "transfer";

  try {
    if (action === "purchase") {
      const { amount, currency } = PurchaseSchema.parse(await req.json());

      // 1000 SKL = $1 USD
      const usdCost = amount / 1000;

      // In production: create Stripe checkout for token purchase
      return NextResponse.json({
        tokens: amount,
        cost_usd: usdCost,
        message: `${amount} SKL tokens for ${currency} ${usdCost.toFixed(2)}`,
      });
    }

    // Default: transfer tokens for skill purchase
    const { skillId, quantity } = TransferSchema.parse(await req.json());

    // In production:
    // 1. Check user.platform_token_balance >= skill.price_skl
    // 2. Deduct from buyer, add to seller (85%), add platform fee (15%)
    // 3. Insert transaction record
    // 4. Emit realtime event

    return NextResponse.json({
      success: true,
      skillId,
      quantity,
      message: "Token transfer successful",
    });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: "Validation failed", issues: err.issues }, { status: 400 });
    }
    return NextResponse.json({ error: "Token transfer failed" }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  // Get current user token balance
  // In production: query Supabase users table
  return NextResponse.json({
    balance: 5000,
    currency: "SKL",
    usd_value: 5.0,
  });
}
