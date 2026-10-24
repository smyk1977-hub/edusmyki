"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useCartStore } from "@/lib/cart-store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";
import { loadStripe } from "@stripe/stripe-js";
import { Elements } from "@stripe/react-stripe-js";
import { StripePaymentForm } from "./StripePaymentForm";
import { CartRecommendations } from "@/components/cart/CartRecommendations";
import {
  PUMPKIN_CODE,
  normalizePromoCode,
  isPumpkinPromotionActive,
  isPumpkinProduct,
  priceInGrosze,
  discountedPriceInGrosze,
} from "@/lib/promotion";

const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!
);

const checkoutSchema = z.object({
  email: z.string().email("Podaj prawidłowy adres email"),
  firstName: z.string().min(2, "Imię jest za krótkie").max(50),
  lastName: z.string().min(2, "Nazwisko jest za krótkie").max(50),
  termsAccepted: z.boolean().refine(
    (val) => val === true,
    "Musisz zaakceptować regulamin"
  ),
  digitalDeliveryConsent: z.boolean().refine(
    (val) => val === true,
    "Zgoda na dostarczenie treści cyfrowej jest wymagana"
  ),
  marketingConsent: z.boolean().optional(),
  invoiceRequested: z.boolean().optional(),
  companyName: z.string().trim().max(200).optional(),
  nip: z.string().trim().optional(),
  address: z.string().trim().max(200).optional(),
  city: z.string().trim().max(100).optional(),
  postalCode: z.string().trim().optional(),
}).superRefine((data, ctx) => {
  if (!data.invoiceRequested) return;

  const requiredFields = [
    ["companyName", "Podaj nazwę firmy lub placówki"],
    ["address", "Podaj ulicę i numer budynku"],
    ["city", "Podaj miejscowość"],
  ] as const;

  for (const [field, message] of requiredFields) {
    if (!data[field]) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: [field],
        message,
      });
    }
  }

  if (!/^\d{10}$/.test(data.nip || "")) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["nip"],
      message: "Podaj NIP: 10 cyfr bez spacji i myślników",
    });
  }

  if (!/^\d{2}-\d{3}$/.test(data.postalCode || "")) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["postalCode"],
      message: "Podaj kod pocztowy w formacie 00-000",
    });
  }
});

const paymentResponseSchema = z.object({
  clientSecret: z.string().min(1),
  orderNumber: z.string().min(1),
  totalAmount: z.number().positive(),
  discountAmount: z.number().nonnegative(),
  promoCode: z.string(),
  items: z.array(z.object({
    ebookId: z.number(),
    title: z.string(),
    originalPrice: z.number().nonnegative(),
    price: z.number().nonnegative(),
  })).min(1),
});

type CheckoutFormData = z.infer<typeof checkoutSchema>;
type PaymentState = z.infer<typeof paymentResponseSchema>;

export function CheckoutForm() {
  const [loading, setLoading] = useState(false);
  const [paymentState, setPaymentState] = useState<PaymentState | null>(null);
  const [promoInput, setPromoInput] = useState("");
  const [appliedCode, setAppliedCode] = useState("");
  const [promoError, setPromoError] = useState("");

  const { items, totalPrice } = useCartStore();
  const router = useRouter();
  const isFree = totalPrice() === 0;

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<CheckoutFormData>({
    resolver: zodResolver(checkoutSchema),
    defaultValues: {
      termsAccepted: undefined,
      digitalDeliveryConsent: undefined,
      invoiceRequested: false,
      companyName: "",
      nip: "",
      address: "",
      city: "",
      postalCode: "",
    },
  });

  const invoiceRequested = watch("invoiceRequested");
  const hasEligibleProduct = items.some(
    (item) => isPumpkinProduct(item.slug) && item.price > 0
  );
  const discountActive =
    appliedCode === PUMPKIN_CODE &&
    isPumpkinPromotionActive() &&
    hasEligibleProduct;

  const previewItems = items.map((item) => ({
    ebookId: item.ebookId,
    title: item.title,
    originalGrosze: priceInGrosze(item.price),
    finalGrosze: discountedPriceInGrosze(
      item.price,
      item.slug,
      discountActive
    ),
  }));

  const originalGrosze = previewItems.reduce(
    (sum, item) => sum + item.originalGrosze, 0
  );
  const finalGrosze = previewItems.reduce(
    (sum, item) => sum + item.finalGrosze, 0
  );
  const discountAmount = (originalGrosze - finalGrosze) / 100;

  function validatePromo(code: string): string {
    if (code !== PUMPKIN_CODE) {
      return "Nieprawidłowy kod rabatowy.";
    }
    if (!isPumpkinPromotionActive()) {
      return "Promocja DYNIA już się zakończyła.";
    }
    if (!hasEligibleProduct) {
      return "Dodaj do koszyka jeden z czterech materiałów na Dzień Dyni objętych promocją.";
    }
    return "";
  }

  function applyPromo() {
    const code = normalizePromoCode(promoInput);
    const error = validatePromo(code);
    setPromoError(error);

    if (error) {
      setAppliedCode("");
      return;
    }

    setPromoInput(code);
    setAppliedCode(code);
  }

  function removePromo() {
    setPromoInput("");
    setAppliedCode("");
    setPromoError("");
  }

  async function onSubmit(data: CheckoutFormData) {
    if (loading) return;

    if (!isFree && promoInput.trim() && !appliedCode) {
      setPromoError("Kliknij „Zastosuj” albo usuń wpisany kod.");
      toast.error("Zastosuj kod rabatowy przed przejściem do płatności.");
      return;
    }

    if (!isFree && appliedCode) {
      const error = validatePromo(appliedCode);
      if (error) {
        setPromoError(error);
        setAppliedCode("");
        toast.error(error);
        return;
      }
    }

    setLoading(true);
    try {
      const payload = {
        ebookIds: items.map((item) => item.ebookId),
        email: data.email,
        firstName: data.firstName,
        lastName: data.lastName,
        promoCode: isFree ? "" : appliedCode,
        invoiceRequested: !isFree && !!data.invoiceRequested,
        invoiceData: !isFree && data.invoiceRequested
          ? {
              companyName: data.companyName,
              nip: data.nip,
              address: data.address,
              city: data.city,
              postalCode: data.postalCode,
              country: "PL",
            }
          : undefined,
      };

      if (isFree) {
        const res = await fetch("/api/checkout/free-order", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const json = await res.json();
        if (!res.ok) throw new Error(json.error || "Błąd serwera");
        router.push("/checkout/sukces");
        return;
      }

      const res = await fetch("/api/checkout/create-payment-intent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Błąd serwera");

      const result = paymentResponseSchema.safeParse(json);
      if (!result.success) {
        throw new Error(
          "Nie udało się odczytać podsumowania płatności. Odśwież stronę."
        );
      }
      setPaymentState(result.data);
    } catch (error) {
      toast.error("Błąd podczas składania zamówienia", {
        description: error instanceof Error ? error.message : "Spróbuj ponownie",
      });
    } finally {
      setLoading(false);
    }
  }

  if (paymentState) {
    return (
      <div className="grid gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>💳 Dane płatności</CardTitle>
            </CardHeader>
            <CardContent>
              <Elements
                stripe={stripePromise}
                options={{
                  clientSecret: paymentState.clientSecret,
                  locale: "pl",
                }}
              >
                <StripePaymentForm
                  orderNumber={paymentState.orderNumber}
                  totalAmount={paymentState.totalAmount}
                />
              </Elements>
            </CardContent>
          </Card>
        </div>
        <div>
          <Card style={{ background: "#FFFBF5", borderColor: "#FFE4A0" }}>
            <CardContent className="pt-6 space-y-4">
              <h2 className="text-lg font-semibold">Twoje zamówienie</h2>
              {paymentState.items.map((item) => (
                <div key={item.ebookId} className="flex justify-between gap-3 text-sm">
                  <span className="text-gray-700 line-clamp-2">{item.title}</span>
                  <div className="shrink-0 text-right">
                    {item.price < item.originalPrice && (
                      <div className="text-xs text-gray-400 line-through">
                        {item.originalPrice.toFixed(2)} zł
                      </div>
                    )}
                    <span className="font-medium">{item.price.toFixed(2)} zł</span>
                  </div>
                </div>
              ))}
              <Separator />
              {paymentState.discountAmount > 0 && (
                <div className="flex justify-between text-sm text-green-700">
                  <span>Rabat {paymentState.promoCode}:</span>
                  <span>−{paymentState.discountAmount.toFixed(2)} zł</span>
                </div>
              )}
              <div className="flex justify-between font-bold">
                <span>Łącznie:</span>
                <span
                  className="font-extrabold"
                  style={{ color: "#F5A623", fontFamily: "var(--font-baloo)" }}
                >
                  {paymentState.totalAmount.toFixed(2)} zł
                </span>
              </div>
              <p className="text-xs text-gray-500">
                Płatność obsługiwana przez Stripe (BLIK, karta, przelew bankowy)
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-4">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <p className="text-lg font-medium">
          {isFree ? "Wysyłamy Twoje materiały..." : "Przygotowywanie płatności..."}
        </p>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="text-center py-10">
        <p className="mb-4 text-gray-500">Twój koszyk jest pusty.</p>
        <Button asChild>
          <Link href="/katalog">Wróć do katalogu</Link>
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <div className="grid gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>👤 Dane kontaktowe</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="twoj@email.pl"
                  {...register("email")}
                />
                {errors.email && (
                  <p className="mt-1 text-sm text-red-500">{errors.email.message}</p>
                )}
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <Label htmlFor="firstName">Imię *</Label>
                  <Input id="firstName" {...register("firstName")} />
                  {errors.firstName && (
                    <p className="mt-1 text-sm text-red-500">{errors.firstName.message}</p>
                  )}
                </div>
                <div>
                  <Label htmlFor="lastName">Nazwisko *</Label>
                  <Input id="lastName" {...register("lastName")} />
                  {errors.lastName && (
                    <p className="mt-1 text-sm text-red-500">{errors.lastName.message}</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {!isFree && (
            <Card>
              <CardHeader>
                <CardTitle>Dane do faktury</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-2">
                  <input
                    id="invoiceRequested"
                    type="checkbox"
                    {...register("invoiceRequested")}
                    className="h-4 w-4"
                  />
                  <Label htmlFor="invoiceRequested">Chcę fakturę</Label>
                </div>
                {invoiceRequested && (
                  <div className="grid gap-4 sm:grid-cols-2">
                    {([
                      ["companyName", "Nazwa firmy lub placówki", "np. Żłobek Słoneczko"],
                      ["nip", "NIP", "10 cyfr bez spacji i myślników"],
                      ["address", "Ulica i numer budynku / lokalu", "np. Leśna 5/2"],
                      ["city", "Miejscowość", "np. Wrocław"],
                      ["postalCode", "Kod pocztowy", "00-000"],
                    ] as const).map(([name, label, placeholder]) => (
                      <div key={name}>
                        <Label htmlFor={name}>{label} *</Label>
                        <Input
                          id={name}
                          placeholder={placeholder}
                          {...register(name)}
                          aria-invalid={!!errors[name]}
                          aria-describedby={errors[name] ? `${name}-error` : undefined}
                        />
                        {errors[name] && (
                          <p id={`${name}-error`} className="mt-1 text-sm text-red-500">
                            {errors[name]?.message}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle>📋 Zgody</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-start gap-2">
                <input
                  type="checkbox"
                  id="termsAccepted"
                  {...register("termsAccepted")}
                  className="mt-0.5 h-4 w-4"
                />
                <Label htmlFor="termsAccepted" className="cursor-pointer text-sm leading-relaxed">
                  Akceptuję{" "}
                  <Link href="/regulamin" className="text-[#4BBFCA] underline" target="_blank">
                    regulamin
                  </Link>{" "}
                  i{" "}
                  <Link
                    href="/polityka-prywatnosci"
                    className="text-[#4BBFCA] underline"
                    target="_blank"
                  >
                    politykę prywatności
                  </Link>{" "}
                  *
                </Label>
              </div>
              {errors.termsAccepted && (
                <p className="text-sm text-red-500">{errors.termsAccepted.message}</p>
              )}

              <div className="flex items-start gap-2">
                <input
                  type="checkbox"
                  id="digitalDeliveryConsent"
                  {...register("digitalDeliveryConsent")}
                  className="mt-0.5 h-4 w-4"
                />
                <Label
                  htmlFor="digitalDeliveryConsent"
                  className="cursor-pointer text-sm leading-relaxed"
                >
                  Wyrażam zgodę na natychmiastowe dostarczenie treści cyfrowej
                  i potwierdzam utratę prawa do odstąpienia od umowy po
                  dostarczeniu pliku. *
                </Label>
              </div>
              {errors.digitalDeliveryConsent && (
                <p className="text-sm text-red-500">
                  {errors.digitalDeliveryConsent.message}
                </p>
              )}

              <div className="flex items-start gap-2">
                <input
                  type="checkbox"
                  id="marketingConsent"
                  {...register("marketingConsent")}
                  className="mt-0.5 h-4 w-4"
                />
                <Label htmlFor="marketingConsent" className="cursor-pointer text-sm leading-relaxed">
                  Wyrażam zgodę na otrzymywanie informacji marketingowych
                  drogą elektroniczną. (opcjonalne)
                </Label>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          <CartRecommendations />
          <Card style={{ background: "#FFFBF5", borderColor: "#FFE4A0" }}>
            <CardContent className="pt-6 space-y-4">
              <h2 className="text-lg font-semibold">Twoje zamówienie</h2>
              {previewItems.map((item) => (
                <div key={item.ebookId} className="flex justify-between gap-3 text-sm">
                  <span className="text-gray-700 line-clamp-2">{item.title}</span>
                  <div className="shrink-0 text-right">
                    {item.finalGrosze < item.originalGrosze && (
                      <div className="text-xs text-gray-400 line-through">
                        {(item.originalGrosze / 100).toFixed(2)} zł
                      </div>
                    )}
                    <span className="font-medium">
                      {(item.finalGrosze / 100).toFixed(2)} zł
                    </span>
                  </div>
                </div>
              ))}
              <Separator />

              {!isFree && (
                <div className="space-y-2">
                  <Label htmlFor="promoCode">Kod rabatowy</Label>
                  <div className="flex gap-2">
                    <Input
                      id="promoCode"
                      value={promoInput}
                      maxLength={50}
                      placeholder="Wpisz kod"
                      autoComplete="off"
                      aria-invalid={!!promoError}
                      aria-describedby="promo-status"
                      onChange={(event) => {
                        setPromoInput(event.target.value);
                        setAppliedCode("");
                        setPromoError("");
                      }}
                      onKeyDown={(event) => {
                        if (event.key === "Enter") {
                          event.preventDefault();
                          applyPromo();
                        }
                      }}
                    />
                    <Button type="button" variant="outline" onClick={applyPromo}>
                      Zastosuj
                    </Button>
                  </div>
                  <div id="promo-status" aria-live="polite">
                    {promoError && (
                      <p className="text-sm text-red-600">{promoError}</p>
                    )}
                    {discountActive && (
                      <p className="text-sm text-green-700">
                        Kod DYNIA zastosowany: 20% rabatu na materiały
                        dyniowe objęte promocją.
                      </p>
                    )}
                    {appliedCode && !discountActive && !promoError && (
                      <p className="text-sm text-red-600">
                        Kod nie jest już aktywny lub w koszyku nie ma
                        materiałów objętych promocją.
                      </p>
                    )}
                  </div>
                  {(promoInput || appliedCode) && (
                    <Button type="button" variant="ghost" size="sm" onClick={removePromo}>
                      Usuń kod
                    </Button>
                  )}
                </div>
              )}

              {discountAmount > 0 && (
                <div className="flex justify-between text-sm text-green-700">
                  <span>Rabat DYNIA:</span>
                  <span>−{discountAmount.toFixed(2)} zł</span>
                </div>
              )}
              <div className="flex justify-between font-bold">
                <span>Łącznie:</span>
                <span
                  className="font-extrabold"
                  style={{
                    color: isFree ? "#7BC44C" : "#F5A623",
                    fontFamily: "var(--font-baloo)",
                  }}
                >
                  {isFree ? "Bezpłatnie" : `${(finalGrosze / 100).toFixed(2)} zł`}
                </span>
              </div>
              {!isFree && (
                <p className="text-xs text-gray-500">
                  Płatność obsługiwana przez Stripe (BLIK, karta, przelew bankowy)
                </p>
              )}
              <Button
                type="submit"
                className="w-full rounded-full bg-[#F5A623] hover:bg-[#e09410]"
                size="lg"
                disabled={loading}
              >
                {isFree ? "Pobierz bezpłatnie →" : "Przejdź do płatności →"}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </form>
  );
}
    
        
            
         
            
