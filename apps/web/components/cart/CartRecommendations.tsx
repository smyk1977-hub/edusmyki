"use client";

import { useEffect, useId, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { BookOpen, Plus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useCartStore } from "@/lib/cart-store";
import type { CartItem } from "@/types";

export function CartRecommendations() {
  const { items, addItem } = useCartStore();
  const [candidates, setCandidates] = useState<CartItem[]>([]);
  const headingId = useId();

  useEffect(() => {
    const controller = new AbortController();
    async function load() {
      try {
        const response = await fetch("/api/cart-recommendations", {
          signal: controller.signal,
        });
        if (!response.ok) return;
        const result: { items: CartItem[] } = await response.json();
        if (!controller.signal.aborted && Array.isArray(result.items)) {
          setCandidates(result.items);
        }
      } catch {
        // Keep the normal cart and checkout usable when suggestions cannot load.
      }
    }
    void load();
    return () => controller.abort();
  }, []);

  const suggestions = candidates
    .filter((candidate) => !items.some((item) =>
      item.ebookId === candidate.ebookId || item.documentId === candidate.documentId
    ))
    .slice(0, 3);

  if (items.length === 0 || suggestions.length === 0) return null;

  return (
    <section aria-labelledby={headingId} className="rounded-xl border border-[#FFE4A0] bg-[#FFFBF5] p-4 space-y-4">
      <div>
        <h2 id={headingId} className="text-lg font-semibold">Dobierz jeszcze…</h2>
        <p className="mt-1 text-sm text-gray-600">Może przydadzą Ci się także te materiały?</p>
      </div>
      {suggestions.map((item) => (
        <div key={item.documentId} className="flex gap-3 rounded-lg bg-white p-3">
          <div className="relative h-20 w-14 shrink-0 overflow-hidden rounded bg-gray-100">
            {item.coverImage?.url ? (
              <Image src={item.coverImage.url} alt="" fill sizes="56px" className="object-contain" />
            ) : (
              <div className="flex h-full items-center justify-center">
                <BookOpen aria-hidden="true" className="h-6 w-6 text-gray-400" />
              </div>
            )}
          </div>
          <div className="min-w-0 flex-1 space-y-2">
            <Link href={`/katalog/${item.slug}`} className="block text-sm font-semibold hover:underline">
              {item.title}
            </Link>
            <div className="flex flex-wrap items-center gap-2 justify-between">
              <span className="font-bold">{item.price.toFixed(2)} zł</span>
              <Button
                type="button"
                size="sm"
                aria-label={`Dodaj do koszyka: ${item.title}`}
                onClick={() => {
                  addItem(item);
                  toast.success("Dodano do koszyka", { description: item.title });
                }}
              >
                <Plus aria-hidden="true" className="h-4 w-4" />
                Dodaj do koszyka
              </Button>
            </div>
          </div>
        </div>
      ))}
    </section>
  );
}
