import { NextResponse } from "next/server";
import { getEbooks, STRAPI_MEDIA_URL } from "@/lib/strapi";
import type { CartItem } from "@/types";

export async function GET() {
  try {
    const { data } = await getEbooks({ featured: true, pageSize: 24 });
    // Only public product fields belong in this response, never PDF download URLs.
    const items: CartItem[] = data
      .filter((ebook) => Number.isFinite(Number(ebook.price)) && Number(ebook.price) > 0)
      .map((ebook) => ({
        ebookId: ebook.id,
        documentId: ebook.documentId,
        title: ebook.title,
        slug: ebook.slug,
        price: Number(ebook.price),
        shortDescription: ebook.shortDescription,
        coverImage: ebook.coverImage?.url
          ? {
              id: ebook.coverImage.id,
              name: ebook.coverImage.name,
              url: new URL(ebook.coverImage.url, STRAPI_MEDIA_URL).toString(),
            }
          : undefined,
      }));

    return NextResponse.json({ items });
  } catch {
    // Recommendations are optional; their failure must not interrupt checkout.
    return NextResponse.json({ items: [] }, { status: 503 });
  }
}
