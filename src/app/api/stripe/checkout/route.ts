import { NextRequest, NextResponse } from "next/server";
import { getStripe } from "@/lib/stripe";
import { z } from "zod";

const CheckoutSchema = z.object({
  skillId: z.string(),
  quantity: z.number().min(1).default(1),
  currency: z.string().default("USD"),
  method: z.string().optional(),
  priceUsd: z.number().optional(),
  skillTitle: z.string().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { skillId, quantity, currency, priceUsd, skillTitle } = CheckoutSchema.parse(body);

    const unitAmount = Math.round((priceUsd ?? 9.99) * 100);
    const stripe = getStripe();

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      mode: "payment",
      currency: currency.toLowerCase(),
      line_items: [
        {
          quantity,
          price_data: {
            currency: currency.toLowerCase(),
            product_data: {
              name: skillTitle ?? `Skill: ${skillId}`,
              description: "Skillscale AI Skill — Claude Code Plugin",
            },
            unit_amount: unitAmount,
          },
        },
      ],
      metadata: { skillId, buyerId: "user-demo", quantity: String(quantity) },
      success_url: `${req.nextUrl.origin}/profile/me?purchased=true&skillId=${skillId}`,
      cancel_url: `${req.nextUrl.origin}/skill/${skillId}`,
      allow_promotion_codes: true,
    });

    return NextResponse.json({ url: session.url, sessionId: session.id });
  } catch (err) {
    console.error("Checkout error:", err);
    return NextResponse.json({ error: "Failed to create checkout session" }, { status: 500 });
  }
}
