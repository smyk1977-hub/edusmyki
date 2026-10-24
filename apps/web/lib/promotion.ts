export const PUMPKIN_CODE = "DYNIA";

const EXPIRES_AT = Date.parse("2026-11-01T00:00:00+01:00");

const PUMPKIN_SLUGS = new Set([
  "dyniowe-zabawy-malych-raczek-18-zabaw-bonus",
  "dekoracja-na-dzien-dyni-28-plakatow-a4",
  "dynia-ma-gosci-teatrzyk-z-otwieranymi-okienkami",
  "ale-dynia-dzien-dyni-dla-dzieci-1-3-lata",
]);

export function normalizePromoCode(code: string): string {
  return code.trim().toUpperCase();
}

export function isPumpkinPromotionActive(now = Date.now()): boolean {
  return now < EXPIRES_AT;
}

export function isPumpkinProduct(slug: string): boolean {
  return PUMPKIN_SLUGS.has(slug);
}

export function priceInGrosze(price: number): number {
  if (!Number.isFinite(price) || price < 0) {
    throw new Error("Nieprawidłowa cena produktu");
  }

  return Math.round(price * 100);
}

export function discountedPriceInGrosze(
  price: number,
  slug: string,
  applyDiscount: boolean
): number {
  const original = priceInGrosze(price);

  return applyDiscount && isPumpkinProduct(slug)
    ? original - Math.round(original * 20 / 100)
    : original;
}
