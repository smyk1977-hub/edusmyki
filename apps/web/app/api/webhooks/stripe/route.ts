import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { getOrderByPaymentIntentId, updateOrderStatus } from "@/lib/strapi";
import { generateDownloadTokensForOrder } from "@/lib/download-tokens";
import { sendOrderConfirmationEmail, sendInvoiceRequestEmail } from "@/lib/email";
import type Stripe from "stripe";

export async function POST(req: NextRequest) {
  const rawBody = await req.text();
  const sig = req.headers.get("stripe-signature");

  if (!sig) {
    return NextResponse.json({ error: "Missing stripe-signature header" }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(
      rawBody,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err) {
    console.error("Stripe webhook signature verification failed:", err);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  if (event.type === "payment_intent.succeeded") {
    const paymentIntent = event.data.object as Stripe.PaymentIntent;

    try {
      const order = await getOrderByPaymentIntentId(paymentIntent.id);

      if (!order) {
        console.error(`Stripe webhook: order not found for paymentIntent ${paymentIntent.id}`);
        return NextResponse.json({ received: true, warning: "order_not_found" });
      }
      await sendInvoiceRequestEmail(order);
      if (order.status === "paid") {
        return NextResponse.json({ status: "already_processed" });
      }

      await updateOrderStatus(order.documentId, "paid");

      const tokens = await generateDownloadTokensForOrder(order);

      await sendOrderConfirmationEmail(order, tokens);
    } catch (err) {
      console.error("Stripe webhook processing error:", err);
      return NextResponse.json({ error: "Processing error" }, { status: 500 });
    }
  }

  return NextResponse.json({ received: true });
}
