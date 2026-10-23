import type { Ebook, Category, Order, DownloadToken, MagicToken, Review, Settings, Homepage, StrapiResponse } from "@/types";

// STRAPI_URL: internal Railway URL for server-side API calls (fast, private network)
// STRAPI_MEDIA_URL: public URL for image/media URLs embedded in HTML (must be externally accessible)
const STRAPI_URL = process.env.STRAPI_URL || process.env.NEXT_PUBLIC_STRAPI_URL || "http://localhost:1337";
export const STRAPI_MEDIA_URL = process.env.NEXT_PUBLIC_STRAPI_URL || process.env.STRAPI_URL || "http://localhost:1337";
const STRAPI_API_TOKEN = process.env.STRAPI_API_TOKEN;

async function strapiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${STRAPI_URL}/api${endpoint}`;

  const headers: HeadersInit = {
    "Content-Type": "application/json",
    ...(STRAPI_API_TOKEN && { Authorization: `Bearer ${STRAPI_API_TOKEN}` }),
    ...options.headers,
  };

  const { next: nextOpts, cache, ...restOptions } = options as RequestInit & {
    next?: { revalidate?: number; tags?: string[] };
  };
  let res: Response;
  try {
    res = await fetch(url, {
      ...restOptions,
      headers,
      ...(cache ? { cache } : { next: { revalidate: 60, ...nextOpts } }),
    });
  } catch (err) {
    console.error(`[strapi] network error — ${url}:`, err);
    throw err;
  }

  if (!res.ok) {
    const error = await res.text();
    console.error(`[strapi] ${res.status} — ${url}:`, error);
    throw new Error(`Strapi API error ${res.status}: ${error}`);
  }

  return res.json();
}

// ── Ebooks ──────────────────────────────────────────────────────────────────

const SORT_MAP: Record<string, string> = {
  "najnowsze": "createdAt:desc",
  "cena-rosnaco": "price:asc",
  "cena-malejaco": "price:desc",
  "alfabetycznie": "title:asc",
};

export async function getEbooks(params?: {
  page?: number;
  pageSize?: number;
  categorySlug?: string;
  categoryIds?: number[];
  search?: string;
  featured?: boolean;
  sort?: string;
}): Promise<StrapiResponse<Ebook[]>> {
  const qs = new URLSearchParams({
    "populate[coverImage]": "true",
    "populate[categories]": "true",
    "pagination[page]": String(params?.page ?? 1),
    "pagination[pageSize]": String(params?.pageSize ?? 12),
    "sort": SORT_MAP[params?.sort ?? ""] ?? "createdAt:desc",
  });

  if (params?.categoryIds && params.categoryIds.length > 0) {
    params.categoryIds.forEach((id, i) => {
      qs.set(`filters[categories][id][$in][${i}]`, String(id));
    });
  } else if (params?.categorySlug) {
    qs.set("filters[categories][slug][$eq]", params.categorySlug);
  }

  if (params?.search) {
    qs.set("filters[$or][0][title][$containsi]", params.search);
    qs.set("filters[$or][1][shortDescription][$containsi]", params.search);
  }

  if (params?.featured) {
    qs.set("filters[isFeatured][$eq]", "true");
  }

  return strapiRequest<StrapiResponse<Ebook[]>>(`/ebooks?${qs}`);
}

export async function getEbookBySlug(slug: string): Promise<Ebook | null> {
  const qs = new URLSearchParams({
    "filters[slug][$eq]": slug,
    "populate[coverImage]": "true",
    "populate[categories]": "true",
  });

  const res = await strapiRequest<StrapiResponse<Ebook[]>>(`/ebooks?${qs}`);
  return res.data[0] ?? null;
}

export async function getEbooksByIds(ids: number[]): Promise<Ebook[]> {
  if (ids.length === 0) return [];

  const qs = new URLSearchParams({
    "populate[coverImage]": "true",
  });
  ids.forEach((id, i) => {
    qs.set(`filters[id][$in][${i}]`, String(id));
  });

  const res = await strapiRequest<StrapiResponse<Ebook[]>>(`/ebooks?${qs}`);
  return res.data;
}

export async function getEbookByDocumentId(documentId: string): Promise<Ebook | null> {
  try {
    const res = await strapiRequest<{ data: Ebook }>(
      `/ebooks/${documentId}?populate[coverImage]=true&populate[categories]=true`
    );
    return res.data;
  } catch {
    return null;
  }
}

// ── Categories ───────────────────────────────────────────────────────────────

export async function getCategories(): Promise<Category[]> {
  const res = await strapiRequest<StrapiResponse<Category[]>>(
    "/categories?sort=name:asc&populate[parent]=true&pagination[pageSize]=100"
  );
  return res.data;
}

// ── Orders ───────────────────────────────────────────────────────────────────

export async function createOrder(data: {
  orderNumber: string;
  status: "pending" | "paid";
  items: Array<{ ebook: number; ebookTitle: string; price: number }>;
  totalAmount: number;
  guestEmail: string;
  guestFirstName: string;
  guestLastName: string;
  invoiceRequested: boolean;
  invoiceData?: {
    companyName: string;
    nip: string;
    address: string;
    city: string;
    postalCode: string;
    country: string;
  };
  paymentIntentId?: string;
}): Promise<Order> {
  const res = await strapiRequest<{ data: Order }>("/orders", {
    method: "POST",
    body: JSON.stringify({ data }),
    next: { revalidate: 0 },
  });
  return res.data;
}

export async function updateOrderStatus(
  documentId: string,
  status: "paid" | "cancelled" | "refunded"
): Promise<Order> {
  const res = await strapiRequest<{ data: Order }>(`/orders/${documentId}`, {
    method: "PUT",
    body: JSON.stringify({
      data: {
        status,
        ...(status === "paid" && { paidAt: new Date().toISOString() }),
      },
    }),
    next: { revalidate: 0 },
  });
  return res.data;
}

export async function getOrderByPaymentIntentId(paymentIntentId: string): Promise<Order | null> {
  const qs = new URLSearchParams({
    "filters[paymentIntentId][$eq]": paymentIntentId,
    "populate[items][populate][ebook]": "true",
    "populate[invoiceData]": "true",
  });

  const res = await strapiRequest<StrapiResponse<Order[]>>(
    `/orders?${qs}`,
    { cache: "no-store" }
  );
  return res.data[0] ?? null;
}

// ── Download Tokens ───────────────────────────────────────────────────────────

export async function createDownloadToken(data: {
  token: string;
  order: number;
  ebook: number;
  email: string;
  expiresAt: string;
  maxDownloads: number;
}): Promise<DownloadToken> {
  const res = await strapiRequest<{ data: DownloadToken }>("/download-tokens", {
    method: "POST",
    body: JSON.stringify({ data }),
    next: { revalidate: 0 },
  });
  return res.data;
}

export async function getDownloadToken(token: string): Promise<DownloadToken | null> {
  const qs = new URLSearchParams({
    "filters[token][$eq]": token,
    "populate[ebook][populate][pdfFile]": "true",
    "populate[order]": "true",
  });

  const res = await strapiRequest<StrapiResponse<DownloadToken[]>>(
    `/download-tokens?${qs}`,
    { cache: "no-store" }
  );
  return res.data[0] ?? null;
}

export async function incrementDownloadCount(
  documentId: string,
  currentCount: number,
  ipAddress: string
): Promise<void> {
  await strapiRequest(`/download-tokens/${documentId}`, {
    method: "PUT",
    body: JSON.stringify({
      data: {
        downloadCount: currentCount + 1,
        lastDownloadedAt: new Date().toISOString(),
        ipAddress,
      },
    }),
    cache: "no-store",
  });
}

export async function getDownloadTokensByEmail(email: string): Promise<DownloadToken[]> {
  const qs = new URLSearchParams({
    "filters[email][$eq]": email,
    "populate[ebook][populate][coverImage]": "true",
    "sort": "createdAt:desc",
  });

  const res = await strapiRequest<StrapiResponse<DownloadToken[]>>(
    `/download-tokens?${qs}`
  );
  return res.data;
}

// ── Magic Tokens (auth) ──────────────────────────────────────────────────────

export async function createMagicToken(
  email: string,
  token: string,
  expiresAt: string
): Promise<void> {
  await strapiRequest("/magic-tokens", {
    method: "POST",
    body: JSON.stringify({ data: { token, email, expiresAt, used: false } }),
    next: { revalidate: 0 },
  });
}

export async function findMagicTokenByToken(
  token: string
): Promise<MagicToken | null> {
  const qs = new URLSearchParams({
    "filters[token][$eq]": token,
  });
  const res = await strapiRequest<StrapiResponse<MagicToken[]>>(
    `/magic-tokens?${qs}`,
    { next: { revalidate: 0 } }
  );
  return res.data[0] ?? null;
}

export async function markMagicTokenUsed(documentId: string): Promise<void> {
  await strapiRequest(`/magic-tokens/${documentId}`, {
    method: "PUT",
    body: JSON.stringify({ data: { used: true } }),
    next: { revalidate: 0 },
  });
}

// ── Orders by email ───────────────────────────────────────────────────────────

export async function getOrdersByEmail(email: string): Promise<Order[]> {
  const qs = new URLSearchParams({
    "filters[guestEmail][$eq]": email,
    "filters[status][$eq]": "paid",
    "populate[items]": "true",
    "sort": "createdAt:desc",
  });
  const res = await strapiRequest<StrapiResponse<Order[]>>(
    `/orders?${qs}`,
    { next: { revalidate: 0 } }
  );
  return res.data;
}

// ── Reviews ───────────────────────────────────────────────────────────────────

export async function getReviewsByEbook(ebookDocumentId: string): Promise<Review[]> {
  const qs = new URLSearchParams({
    "filters[ebook][documentId][$eq]": ebookDocumentId,
    "sort": "createdAt:desc",
    "pagination[pageSize]": "20",
  });
  const res = await strapiRequest<StrapiResponse<Review[]>>(`/reviews?${qs}`);
  return res.data;
}

export async function getFeaturedReviews(limit = 3): Promise<Review[]> {
  const qs = new URLSearchParams({
    "filters[featuredOnHomepage][$eq]": "true",
    "sort": "createdAt:desc",
    "pagination[pageSize]": String(limit),
  });
  const res = await strapiRequest<StrapiResponse<Review[]>>(`/reviews?${qs}`);
  return res.data;
}

export async function getReviewByEmailAndEbook(
  email: string,
  ebookDocumentId: string
): Promise<Review | null> {
  const baseParams = new URLSearchParams({
    "filters[email][$eq]": email,
    "filters[ebook][documentId][$eq]": ebookDocumentId,
    "pagination[pageSize]": "1",
  });

  const published = await strapiRequest<StrapiResponse<Review[]>>(
    `/reviews?${baseParams}`,
    { cache: "no-store" }
  ).catch(() => ({ data: [] as Review[] }));
  if (published.data.length > 0) return published.data[0];

  const draftParams = new URLSearchParams(baseParams);
  draftParams.set("status", "draft");
  const draft = await strapiRequest<StrapiResponse<Review[]>>(
    `/reviews?${draftParams}`,
    { cache: "no-store" }
  ).catch(() => ({ data: [] as Review[] }));
  return draft.data[0] ?? null;
}

export async function createReview(data: {
  rating: number;
  content: string;
  authorName: string;
  authorRole?: string;
  email: string;
  ebookId: number;
}): Promise<Review> {
  const body: Record<string, unknown> = {
    rating: data.rating,
    content: data.content,
    authorName: data.authorName,
    email: data.email,
    ebook: data.ebookId,
  };
  if (data.authorRole) body.authorRole = data.authorRole;

  const res = await strapiRequest<{ data: Review }>("/reviews", {
    method: "POST",
    body: JSON.stringify({ data: body }),
    cache: "no-store",
  });
  return res.data;
}

// ── Settings ──────────────────────────────────────────────────────────────────

export async function getSettings(): Promise<Settings | null> {
  try {
    const res = await strapiRequest<{ data: Settings }>("/setting");
    return res.data;
  } catch {
    return null;
  }
}

// ── Homepage ──────────────────────────────────────────────────────────────────

export async function getHomepage(): Promise<Homepage | null> {
  try {
    const res = await strapiRequest<{ data: Homepage }>(
      "/homepage?populate[trustBar]=true&populate[stats]=true&populate[howItWorksSteps]=true&populate[whyUsCards]=true"
    );
    return res.data;
  } catch {
    return null;
  }
}

export { STRAPI_URL };
