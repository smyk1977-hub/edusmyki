import { Suspense } from "react";
import { getEbooks, getCategories } from "@/lib/strapi";
import { getCategorySubtreeIds } from "@/lib/category-utils";
import { EbookGrid } from "@/components/catalog/EbookGrid";
import { CategorySidebar } from "@/components/catalog/CategorySidebar";
import { CategoryMobilePanel } from "@/components/catalog/CategoryMobilePanel";
import { SortSelect } from "@/components/catalog/SortSelect";
import { SearchBar } from "@/components/catalog/SearchBar";
import { PageHeader } from "@/components/layout/PageHeader";

interface KatalogPageProps {
  searchParams: Promise<{
    strona?: string;
    kategoria?: string;
    szukaj?: string;
    sortowanie?: string;
  }>;
}

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || "https://edusmyki.pl";

export async function generateMetadata({ searchParams }: KatalogPageProps) {
  const params = await searchParams;
  const canonical = params.kategoria
    ? `${BASE_URL}/katalog?kategoria=${params.kategoria}`
    : `${BASE_URL}/katalog`;

  return {
    title: "Katalog ebooków",
    description:
      "Przeglądaj nasze ebooki z instrukcjami dla przedszkoli i żłobków.",
    alternates: { canonical },
  };
}

export default async function KatalogPage({ searchParams }: KatalogPageProps) {
  const params = await searchParams;
  const page = Number(params.strona ?? 1);
  const categorySlug = params.kategoria;
  const search = params.szukaj;
  const sort = params.sortowanie;

  let categories: Awaited<ReturnType<typeof getCategories>>;
  let ebooksRes: Awaited<ReturnType<typeof getEbooks>>;

  if (categorySlug) {
    categories = await getCategories();
    const categoryIds = getCategorySubtreeIds(categories, categorySlug);
    if (categoryIds.length === 0) {
      ebooksRes = {
        data: [],
        meta: { pagination: { page: 1, pageSize: 12, pageCount: 0, total: 0 } },
      };
    } else {
      ebooksRes = await getEbooks({ page, pageSize: 12, categoryIds, search, sort });
    }
  } else {
    [categories, ebooksRes] = await Promise.all([
      getCategories(),
      getEbooks({ page, pageSize: 12, search, sort }),
    ]);
  }

  return (
    <div>
      <PageHeader
        pill="📚 Katalog"
        title="Katalog materiałów"
       description="50+ materiałów i dokumentów dla żłobków i przedszkoli"
      />

      <div className="container mx-auto px-4 py-10">
        {/* Mobile: collapsible category panel */}
        <div className="sm:hidden mb-4">
          <Suspense fallback={null}>
            <CategoryMobilePanel categories={categories} selected={categorySlug} />
          </Suspense>
        </div>

        {/* Toolbar: search + sort */}
        <div className="mb-6 flex flex-col gap-3 sm:flex-row">
          <SearchBar defaultValue={search} />
          <Suspense fallback={null}>
            <SortSelect value={sort} />
          </Suspense>
        </div>

        {/* Desktop: sidebar + grid */}
        <div className="flex gap-8">
          <aside className="hidden sm:block w-52 shrink-0">
            <Suspense fallback={null}>
              <CategorySidebar categories={categories} selected={categorySlug} />
            </Suspense>
          </aside>
          <main className="flex-1 min-w-0">
            <Suspense fallback={<div className="py-10 text-center">Ładowanie...</div>}>
              <EbookGrid
                ebooks={ebooksRes.data}
                pagination={ebooksRes.meta.pagination}
              />
            </Suspense>
          </main>
        </div>
      </div>
    </div>
  );
}
