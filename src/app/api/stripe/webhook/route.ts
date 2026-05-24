import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import type Stripe from "stripe";

export async function POST(req: NextRequest) {
  const body = await req.text();
  const sig = req.headers.get("stripe-signature");

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  let event: Stripe.Event;

  try {
    if (!sig || !webhookSecret) {
      // Dev mode: parse body directly
      event = JSON.parse(body) as Stripe.Event;
    } else {
      event = stripe.webhooks.constructEvent(body, sig, webhookSecret);
    }
  } catch (err) {
    return NextResponse.json({ error: "Webhook signature invalid" }, { status: 400 });
  }

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;
      const { skillId, buyerId, quantity } = session.metadata ?? {};

      if (skillId && buyerId) {
        // In production: insert transaction into Supabase, update ownership
        console.log(`Payment complete: skill=${skillId} buyer=${buyerId} qty=${quantity}`);
      }
      break;
    }

    case "checkout.session.expired": {
      // Handle expired sessions
      break;
    }
  }

  return NextResponse.json({ received: true });
}

// Also handle GET for checkout creation (called from PaymentModal)
export async function createCheckoutSession(req: NextRequest) {
  try {
    const { skillId, quantity, currency } = await req.json();

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card", "paypal"],
      mode: "payment",
      currency: currency.toLowerCase(),
      line_items: [
        {
          quantity,
          price_data: {
            currency: currency.toLowerCase(),
            product_data: {
              name: `Skillscale: ${skillId}`,
            },
            unit_amount: Math.round(9.99 * 100), // In prod: fetch real price
          },
        },
      ],
      metadata: { skillId, buyerId: "user-demo", quantity: String(quantity) },
      success_url: `${req.nextUrl.origin}/profile/me?purchased=true`,
      cancel_url: `${req.nextUrl.origin}/skill/${skillId}`,
    });

    return NextResponse.json({ url: session.url });
  } catch (err) {
    return NextResponse.json({ error: "Checkout failed" }, { status: 500 });
  }
}
