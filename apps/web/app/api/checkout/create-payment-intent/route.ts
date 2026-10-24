import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getEbooksByIds, createOrder } from "@/lib/strapi";
import { stripe } from "@/lib/stripe";
import {
  PUMPKIN_CODE,
  normalizePromoCode,
  isPumpkinPromotionActive,
  isPumpkinProduct,
  priceInGrosze,
  discountedPriceInGrosze,
} from "@/lib/promotion";

const checkoutSchema = z.object({
  ebookIds: z.array(z.number().int().positive()).min(1),
  email: z.string().email(),
  firstName: z.string().min(2).max(50),
  lastName: z.string().min(2).max(50),
  promoCode: z.string().trim().max(50).optional().default(""),
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
    const ebookIds = [...new Set(data.ebookIds)];
    const ebooks = await getEbooksByIds(ebookIds);

    if (
      ebooks.length !== ebookIds.length ||
      ebookIds.some((id) => !ebooks.some((ebook) => ebook.id === id))
    ) {
      return NextResponse.json(
        { error: "Jeden lub więcej ebooków jest niedostępnych" },
        { status: 400 }
      );
    }

    const promoCode = normalizePromoCode(data.promoCode);
    const applyDiscount = promoCode !== "";

    if (applyDiscount) {
      if (promoCode !== PUMPKIN_CODE) {
        return NextResponse.json(
          { error: "Nieprawidłowy kod rabatowy" },
          { status: 400 }
        );
      }

      if (!isPumpkinPromotionActive()) {
        return NextResponse.json(
          { error: "Promocja DYNIA już się zakończyła" },
          { status: 400 }
        );
      }

      const hasEligibleProduct = ebooks.some(
        (ebook) =>
          isPumpkinProduct(ebook.slug) &&
          priceInGrosze(ebook.price) > 0
      );

      if (!hasEligibleProduct) {
        return NextResponse.json(
          {
            error:
              "Kod DYNIA dotyczy wyłącznie czterech materiałów na Dzień Dyni objętych promocją",
          },
          { status: 400 }
        );
      }
    }

    const pricedItems = ebooks.map((ebook) => ({
      ebookId: ebook.id,
      title: ebook.title,
      originalGrosze: priceInGrosze(ebook.price),
      finalGrosze: discountedPriceInGrosze(
        ebook.price,
        ebook.slug,
        applyDiscount
      ),
    }));

    const amountInGrosze = pricedItems.reduce(
      (sum, item) => sum + item.finalGrosze,
      0
    );

    const originalInGrosze = pricedItems.reduce(
      (sum, item) => sum + item.originalGrosze,
      0
    );

    if (amountInGrosze <= 0) {
      return NextResponse.json(
        { error: "To zamówienie nie wymaga płatności" },
        { status: 400 }
      );
    }

    const totalAmount = amountInGrosze / 100;
    const discountAmount = (originalInGrosze - amountInGrosze) / 100;

    const items = pricedItems.map((item) => ({
      ebook: item.ebookId,
      ebookTitle: item.title,
      price: item.finalGrosze / 100,
    }));

    const orderNumber = `EDU-${new Date()
      .toISOString()
      .slice(0, 10)
      .replace(/-/g, "")}-${Math.random()
      .toString(36)
      .slice(2, 6)
      .toUpperCase()}`;

    const paymentIntent = await stripe.paymentIntents.create({
      amount: amountInGrosze,
      currency: "pln",
      automatic_payment_methods: { enabled: true },
      metadata: {
        orderNumber,
        promoCode,
        discountInGrosze: String(originalInGrosze - amountInGrosze),
      },
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
      totalAmount,
      discountAmount,
      promoCode,
      items: pricedItems.map((item) => ({
        ebookId: item.ebookId,
        title: item.title,
        originalPrice: item.originalGrosze / 100,
        price: item.finalGrosze / 100,
      })),
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          error: "Nieprawidłowe dane formularza",
          details: error.issues,
        },
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
