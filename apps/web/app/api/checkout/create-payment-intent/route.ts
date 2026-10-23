import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getEbooksByIds, createOrder } from "@/lib/strapi";
import { stripe } from "@/lib/stripe";

const checkoutSchema = z.object({
  ebookIds: z.array(z.number()).min(1),
  email: z.string().email(),
  firstName: z.string().min(2).max(50),
  lastName: z.string().min(2).max(50),
  invoiceRequested: z.boolean().optional().default(false),
  invoiceData: z.object({
    companyName: z.string().trim().min(1).max(200),
    nip: z.string().regex(/^\d{10}$/),
    address: z.string().trim().min(1).max(200),
    city: z.string().trim().min(1).max(100),
    postalCode: z.string().regex(/^\d{2}-\d{3}$/),
    country: z.literal("PL"),
  }).optional(),
}).superRefine((data, ctx) => {
  if (data.invoiceRequested && !data.invoiceData) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["invoiceData"],
      message: "Uzupełnij dane do faktury",
    });
  }
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const data = checkoutSchema.parse(body);

    const ebooks = await getEbooksByIds(data.ebookIds);

    if (ebooks.length !== data.ebookIds.length) {
      return NextResponse.json(
        { error: "Jeden lub więcej ebooków jest niedostępnych" },
        { status: 400 }
      );
    }

    const items = ebooks.map((e) => ({
      ebook: e.id,
      ebookTitle: e.title,
      price: e.price,
    }));

    const totalAmount = items.reduce((sum, i) => sum + i.price, 0);
    const amountInGrosze = Math.round(totalAmount * 100);

    const orderNumber = `EDU-${new Date().toISOString().slice(0, 10).replace(/-/g, "")}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;

    const paymentIntent = await stripe.paymentIntents.create({
      amount: amountInGrosze,
      currency: "pln",
      automatic_payment_methods: { enabled: true },
      metadata: { orderNumber },
    });

    await createOrder({
      orderNumber,
      status: "pending",
      items,
      totalAmount,
      guestEmail: data.email,
      guestFirstName: data.firstName,
      guestLastName: data.lastName,
     invoiceRequested: data.invoiceRequested,
invoiceData: data.invoiceRequested ? data.invoiceData : undefined,
      paymentIntentId: paymentIntent.id,
    });

    return NextResponse.json({
      clientSecret: paymentIntent.client_secret,
      orderNumber,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Nieprawidłowe dane formularza", details: error.issues },
        { status: 400 }
      );
    }

    console.error("Checkout error:", error);
    return NextResponse.json(
      { error: "Błąd podczas tworzenia zamówienia" },
      { status: 500 }
    );
  }
}
