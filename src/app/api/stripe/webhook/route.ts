import { handleStripeEvent, stripe } from "@/lib/stripe";

// Stripe's notifications about payments. The signature proves they come from Stripe; anything that fails
// is answered with an error so Stripe tries again later.
export async function POST(req: Request) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  const signature = req.headers.get("stripe-signature");
  if (!secret || !signature) return new Response("Not configured", { status: 400 });
  let event;
  try {
    event = stripe().webhooks.constructEvent(await req.text(), signature, secret);
  } catch {
    return new Response("Bad signature", { status: 400 });
  }
  try {
    await handleStripeEvent(event);
  } catch (e) {
    console.error("[stripe] webhook failed", event.type, e);
    return new Response("Failed", { status: 500 });
  }
  return Response.json({ received: true });
}
