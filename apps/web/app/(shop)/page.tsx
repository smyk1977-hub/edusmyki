import Link from "next/link";
import { getEbooks, getCategories, getFeaturedReviews, getHomepage } from "@/lib/strapi";
import { EbookCard } from "@/components/catalog/EbookCard";
import { Button } from "@/components/ui/button";
import { HeroDecorations } from "@/components/HeroDecorations";
import { StarRating } from "@/components/reviews/StarRating";
import {
  ArrowRight, BookOpen, Download,
  CheckCircle2, Clock, Users, FileText,
  GraduationCap, Heart, Zap, Trophy,
} from "lucide-react";
import type { Ebook, Category, Review, Homepage } from "@/types";

export default async function HomePage() {
  const [ebooksRes, categories, featuredReviews, hp] = await Promise.all([
    getEbooks({ featured: true, pageSize: 3 }).catch(() => ({
      data: [] as Ebook[],
      meta: { pagination: { total: 0, page: 1, pageSize: 3, pageCount: 0 } },
    })),
    getCategories().catch(() => [] as Category[]),
    getFeaturedReviews(3).catch(() => [] as Review[]),
    getHomepage().catch(() => null),
  ]);

  const h: Homepage = {
    heroBadge: hp?.heroBadge ?? "mądrze, prosto i z sercem",
    heroTitleBefore: hp?.heroTitleBefore ?? "Materiały dla",
    heroTitleHighlight: hp?.heroTitleHighlight ?? "żłobków i przedszkoli",
    heroTitleAfter: hp?.heroTitleAfter ?? "– dokumentacja, scenariusze i pomoce dydaktyczne",
    heroSubtitle: hp?.heroSubtitle ?? "Gotowe materiały dla dyrektorów, nauczycieli i opiekunów dzieci",
    heroDescription: hp?.heroDescription ?? "Tworzymy praktyczne materiały dla żłobków i przedszkoli: procedury, regulaminy, scenariusze zajęć oraz dokumentację dla opiekunów i nauczycieli. Pobierz gotowe materiały, wydrukuj i wykorzystaj od razu w swojej placówce.",
    heroCta1: hp?.heroCta1 ?? "Przeglądaj katalog",
    heroCta2: hp?.heroCta2 ?? "Jak to działa?",
    trustBar: hp?.trustBar?.length ? hp.trustBar : [
      { id: 1, text: "500+ dyrektorów i właścicieli" },
      { id: 2, text: "Zgodne z przepisami" },
      { id: 3, text: "Dostęp w kilka sekund" },
    ],
    stats: hp?.stats?.length ? hp.stats : [
      { id: 1, value: "500+", label: "dyrektorów i właścicieli" },
      { id: 2, value: "50+",  label: "dostępnych ebooków" },
      { id: 3, value: "30",   label: "dni dostępu po zakupie" },
      { id: 4, value: "100%", label: "zgodność z przepisami" },
    ],
    howItWorksBadge: hp?.howItWorksBadge ?? "Prosty proces",
    howItWorksTitle: hp?.howItWorksTitle ?? "Jak to działa?",
    howItWorksSteps: hp?.howItWorksSteps?.length ? hp.howItWorksSteps : [
      { id: 1, title: "Wybierz materiały", desc: "Przeglądaj katalog i znajdź dokumenty dopasowane do Twojej placówki — procedury, regulaminy, scenariusze zajęć." },
      { id: 2, title: "Zapłać bezpiecznie", desc: "BLIK, przelew lub karta przez Stripe. Bez zakładania konta." },
      { id: 3, title: "Pobierz i wdróż", desc: "Link do PDF trafia na e-mail w kilka sekund. Uzupełnij dane placówki i gotowe." },
    ],
    featuredBadge: hp?.featuredBadge ?? "⭐ Bestsellery",
    featuredTitle: hp?.featuredTitle ?? "Polecane ebooki",
    featuredLinkText: hp?.featuredLinkText ?? "Zobacz wszystkie",
    categoriesTitle: hp?.categoriesTitle ?? "Kategorie",
    categoriesSubtitle: hp?.categoriesSubtitle ?? "Znajdź dokumenty dla swojego żłobka",
    whyUsBadge: hp?.whyUsBadge ?? "Dlaczego my?",
    whyUsTitle: hp?.whyUsTitle ?? "Materiały do żłobka i przedszkola – gotowe rozwiązania",
    whyUsCards: hp?.whyUsCards?.length ? hp.whyUsCards : [
      { id: 1, title: "Materiały dla żłobków", desc: "Procedury, regulaminy i dokumentacja dostosowana do specyfiki żłobka — gotowe do uzupełnienia i druku.", tag: "Żłobki" },
      { id: 2, title: "Materiały dla przedszkoli", desc: "Scenariusze zajęć, pomoce dydaktyczne i dokumentacja dla nauczycieli wychowania przedszkolnego.", tag: "Przedszkola" },
      { id: 3, title: "Dokumentacja placówki", desc: "Gotowe wzory dokumentów dla żłobków i przedszkoli — procedury, regulaminy i formularze w jednym miejscu.", tag: "Dokumentacja" },
      { id: 4, title: "Dla każdej roli", desc: "Scenariusze zajęć dla najmłodszych, dokumentacja dla opiekunek oraz gotowe procedury dla dyrektorów placówek.", tag: "Dla zespołu" },
      { id: 5, title: "Codzienna praca", desc: "Nasze materiały pomagają w codziennej pracy, oszczędzają czas i pozwalają skupić się na tym, co ważne — dzieciach.", tag: "Praktyczne" },
      { id: 6, title: "Gotowe do wdrożenia", desc: "Materiały w PDF do pobrania i druku — możesz wdrożyć je od razu w swojej placówce bez dodatkowego przygotowania.", tag: "PDF" },
    ],
    testimonialsBadge: hp?.testimonialsBadge ?? "❤️ Opinie",
    testimonialsTitle: hp?.testimonialsTitle ?? "Co mówią dyrektorzy i właściciele placówek?",
    ctaTitle: hp?.ctaTitle ?? "Nasze materiały wspierają pracę żłobków i przedszkoli",
    ctaSubtitle: hp?.ctaSubtitle ?? "Scenariusze zajęć, dokumentacja dla opiekunek i gotowe procedury dla dyrektorów — przygotowane w PDF do pobrania i druku.",
    ctaButton: hp?.ctaButton ?? "Przeglądaj katalog",
    seoText1: hp?.seoText1 ?? "gotowe procedury, regulaminy, scenariusze zajęć i dokumentacja w formacie PDF. Pobierz, wydrukuj i wdróż od razu w swojej placówce.",
    seoText2: hp?.seoText2 ?? "Nasze materiały wspierają dyrektorów, właścicieli i opiekunów w codziennej pracy — zgodne z aktualnymi przepisami, tworzone przez praktyków.",
  };

  const featuredEbooks = ebooksRes.data;

  return (
    <>
      {/* ─── HERO ─── */}
      <section
        className="relative min-h-[calc(100vh-80px)] overflow-hidden"
        style={{
          backgroundColor: "#FDF5EC",
          backgroundImage:
            "linear-gradient(to bottom, #FFF8F0 0%, #FFF3E0 56%, #F0D9BD 56%, #E5C49D 100%)",
        }}
      >
        <HeroDecorations />
        <div className="container mx-auto flex min-h-[calc(100vh-80px)] flex-col items-center gap-12 px-4 py-16 md:flex-row md:gap-8 md:py-0">

          {/* ── Left: text content ── */}
          <div className="relative z-10 flex flex-1 flex-col items-start justify-center">
            <div className="animate-slide-up mb-4">
              <span
                className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-sm font-semibold text-white shadow-sm"
                style={{ backgroundColor: "#7BC44C" }}
              >
                <Zap className="h-3.5 w-3.5" />
                {h.heroBadge}
              </span>
            </div>

            <h1
              className="animate-slide-up mb-5 text-4xl font-bold leading-tight tracking-tight text-gray-900 md:text-5xl lg:text-6xl"
              style={{ animationDelay: "0.1s" }}
            >
              {h.heroTitleBefore}{" "}
              <span className="relative inline-block whitespace-nowrap" style={{ color: "#F5A623" }}>
                {h.heroTitleHighlight}
                <svg className="absolute -bottom-1 left-0 w-full" height="5" viewBox="0 0 300 5" fill="none">
                  <path d="M0 2.5 Q75 0 150 2.5 Q225 5 300 2.5" stroke="#F5A623" strokeWidth="2.5" strokeLinecap="round" fill="none" opacity="0.6"/>
                </svg>
              </span>
              {" "}{h.heroTitleAfter}
            </h1>

            <p
              className="animate-slide-up mb-2 max-w-lg text-xl font-semibold text-gray-700 leading-snug"
              style={{ animationDelay: "0.15s" }}
            >
              {h.heroSubtitle}
            </p>

            <p
              className="animate-slide-up mb-8 max-w-lg text-base text-gray-600 leading-relaxed"
              style={{ animationDelay: "0.2s" }}
            >
              {h.heroDescription}
            </p>

            <div
              className="animate-slide-up flex flex-col gap-3 sm:flex-row"
              style={{ animationDelay: "0.3s" }}
            >
              <Button
                asChild
                size="lg"
                className="h-14 rounded-full px-8 text-base font-semibold text-white shadow-xl transition-all hover:scale-105"
                style={{ backgroundColor: "#F5A623", boxShadow: "0 8px 30px rgba(245,166,35,0.35)" }}
              >
                <Link href="/katalog">
                  {h.heroCta1}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button
                asChild
                size="lg"
                variant="outline"
                className="h-14 rounded-full px-8 text-base font-semibold border-2 transition-all hover:scale-105"
                style={{ borderColor: "#4BBFCA", color: "#4BBFCA" }}
              >
                <Link href="#jak-to-dziala">{h.heroCta2}</Link>
              </Button>
            </div>

            {/* Trust bar */}
            <div
              className="animate-fade-in mt-10 flex flex-wrap gap-5 text-sm text-gray-500"
              style={{ animationDelay: "0.5s" }}
            >
              {h.trustBar.map(({ id, text }) => (
                <span key={id} className="flex items-center gap-1.5 font-medium">
                  <CheckCircle2 className="h-4 w-4" style={{ color: "#7BC44C" }} />
                  {text}
                </span>
              ))}
            </div>
          </div>

        </div>

        {/* bottom wave */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 60" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M0 60 L0 30 Q360 0 720 30 Q1080 60 1440 30 L1440 60 Z" fill="white"/>
          </svg>
        </div>
      </section>

      {/* ─── STATS ─── */}
      <section
        id="statystyki"
        className="py-16"
        style={{ background: "linear-gradient(135deg, #F5A623 0%, #F7C06B 50%, #4BBFCA 100%)" }}
      >
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 gap-6 md:grid-cols-4">
            {h.stats.map(({ id, value, label }, i) => {
              const icons = [Users, BookOpen, Clock, Trophy];
              const Icon = icons[i % icons.length];
              return (
                <div key={id} className="flex flex-col items-center gap-2 text-center text-white">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-sm mb-1">
                    <Icon className="h-6 w-6 text-white" />
                  </div>
                  <p className="text-4xl font-bold drop-shadow-sm">{value}</p>
                  <p className="text-sm text-white/80 leading-snug">{label}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ─── HOW IT WORKS ─── */}
      <section id="jak-to-dziala" className="py-24 bg-white">
        <div className="container mx-auto px-4">
          <div className="mb-16 text-center">
            <span
              className="mb-3 inline-block rounded-full px-4 py-1 text-sm font-semibold text-white"
              style={{ backgroundColor: "#4BBFCA" }}
            >
              {h.howItWorksBadge}
            </span>
            <h2 className="text-4xl font-bold text-gray-900">{h.howItWorksTitle}</h2>
          </div>

          <div className="grid gap-8 md:grid-cols-3">
            {h.howItWorksSteps.map(({ id, title, desc }, i) => {
              const stepStyles = [
                { icon: BookOpen, bg: "linear-gradient(135deg, #FFF3DC, #FFE4A0)", color: "#F5A623", border: "#FFD875" },
                { icon: FileText, bg: "linear-gradient(135deg, #E2F7FA, #B2EBF2)", color: "#4BBFCA", border: "#81D4DA" },
                { icon: Download, bg: "linear-gradient(135deg, #EDF9E8, #C8F0BC)", color: "#7BC44C", border: "#A5D99B" },
              ];
              const { icon: Icon, bg, color, border } = stepStyles[i % stepStyles.length];
              const step = String(i + 1).padStart(2, "0");
              return (
                <div key={id} className="relative rounded-3xl p-8 shadow-sm transition-all hover:-translate-y-1 hover:shadow-lg" style={{ background: bg, border: `1.5px solid ${border}` }}>
                  <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl text-white shadow-md" style={{ backgroundColor: color }}>
                    <Icon className="h-7 w-7" />
                  </div>
                  <span className="absolute right-6 top-6 text-5xl font-black opacity-15" style={{ color }}>{step}</span>
                  <h3 className="mb-2 text-xl font-bold text-gray-900">{title}</h3>
                  <p className="text-gray-600 leading-relaxed">{desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ─── FEATURED EBOOKS ─── */}
      {featuredEbooks.length > 0 && (
        <section className="py-24" style={{ background: "linear-gradient(180deg, #FFF8F0 0%, #FFFFFF 100%)" }}>
          <div className="container mx-auto px-4">
            <div className="mb-12 flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
              <div>
                <span
                  className="mb-3 inline-block rounded-full px-4 py-1 text-sm font-semibold text-white"
                  style={{ backgroundColor: "#F5A623" }}
                >
                  {h.featuredBadge}
                </span>
                <h2 className="text-4xl font-bold text-gray-900">{h.featuredTitle}</h2>
              </div>
              <Link
                href="/katalog"
                className="group flex items-center gap-1 rounded-full border-2 px-5 py-2 text-sm font-semibold transition-all hover:text-white"
                style={{ borderColor: "#F5A623", color: "#F5A623" }}
              >
                {h.featuredLinkText}
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Link>
            </div>

            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
              {featuredEbooks.map((ebook) => (
                <EbookCard key={ebook.id} ebook={ebook} />
              ))}
            </div>
          </div>
        </section>
      )}

    

      {/* ─── WHY US ─── */}
      <section className="py-24 bg-white">
        <div className="container mx-auto px-4">
          <div className="mb-16 text-center">
            <span
              className="mb-3 inline-block rounded-full px-4 py-1 text-sm font-semibold text-white"
              style={{ backgroundColor: "#7BC44C" }}
            >
              {h.whyUsBadge}
            </span>
            <h2 className="text-4xl font-bold text-gray-900">{h.whyUsTitle}</h2>
          </div>

          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {h.whyUsCards.map(({ id, title, desc, tag }, i) => {
              const cardStyles = [
                { icon: BookOpen,      color: "#F5A623", bg: "#FFF3DC" },
                { icon: GraduationCap, color: "#4BBFCA", bg: "#E2F7FA" },
                { icon: FileText,      color: "#7BC44C", bg: "#EDF9E8" },
                { icon: Users,         color: "#F5A623", bg: "#FFF3DC" },
                { icon: Heart,         color: "#4BBFCA", bg: "#E2F7FA" },
                { icon: Download,      color: "#7BC44C", bg: "#EDF9E8" },
              ];
              const { icon: Icon, color, bg } = cardStyles[i % cardStyles.length];
              return (
                <div key={id} className="flex flex-col gap-4 rounded-3xl p-7 transition-all hover:-translate-y-1 hover:shadow-md" style={{ backgroundColor: bg }}>
                  <div className="flex items-start justify-between">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl text-white shadow-sm" style={{ backgroundColor: color }}>
                      <Icon className="h-6 w-6" />
                    </div>
                    <span className="rounded-full px-3 py-1 text-xs font-semibold text-white" style={{ backgroundColor: color }}>{tag}</span>
                  </div>
                  <div>
                    <h3 className="mb-1.5 text-lg font-bold text-gray-900">{title}</h3>
                    <p className="text-sm text-gray-600 leading-relaxed">{desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ─── TESTIMONIALS ─── */}
      {featuredReviews.length > 0 && (
        <section className="py-24" style={{ background: "linear-gradient(160deg, #FFF3DC 0%, #E2F7FA 100%)" }}>
          <div className="container mx-auto px-4">
            <div className="mb-16 text-center">
              <span
                className="mb-3 inline-block rounded-full px-4 py-1 text-sm font-semibold text-white"
                style={{ backgroundColor: "#F5A623" }}
              >
                {h.testimonialsBadge}
              </span>
              <h2 className="text-4xl font-bold text-gray-900">{h.testimonialsTitle}</h2>
            </div>

            <div className="grid gap-6 md:grid-cols-3">
              {featuredReviews.map((review, i) => {
                const colors = ["#F5A623", "#4BBFCA", "#7BC44C"];
                const color = colors[i % colors.length];
                return (
                  <div
                    key={review.id}
                    className="rounded-3xl bg-white p-8 shadow-sm transition-all hover:-translate-y-1 hover:shadow-lg"
                    style={{ borderTop: `4px solid ${color}` }}
                  >
                    <StarRating value={review.rating} size="sm" />
                    <p className="mb-6 mt-4 text-gray-600 leading-relaxed italic">
                      &ldquo;{review.content}&rdquo;
                    </p>
                    <div className="flex items-center gap-3">
                      <div
                        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white"
                        style={{ backgroundColor: color }}
                      >
                        {review.authorName[0].toUpperCase()}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-gray-900">
                          {review.authorName}
                        </p>
                        {review.authorRole && (
                          <p className="text-xs text-gray-400">{review.authorRole}</p>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* ─── CTA ─── */}
      <section
        className="relative overflow-hidden py-28"
        style={{ background: "linear-gradient(135deg, #F5A623 0%, #F9B84B 40%, #4BBFCA 100%)" }}
      >
        {/* decorative circles */}
        <div className="pointer-events-none absolute -top-16 -right-16 h-64 w-64 rounded-full bg-white/10" />
        <div className="pointer-events-none absolute -bottom-20 -left-20 h-80 w-80 rounded-full bg-white/10" />
        <div className="pointer-events-none absolute top-1/2 left-1/2 h-96 w-96 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white/5" />

        <div className="relative z-10 container mx-auto px-4 text-center">
          <div className="animate-float mb-6 inline-flex h-16 w-16 items-center justify-center rounded-full bg-white/20 backdrop-blur-sm">
            <GraduationCap className="h-8 w-8 text-white" />
          </div>
          <h2 className="mx-auto mb-4 max-w-2xl text-4xl font-bold text-white leading-tight md:text-5xl">
            {h.ctaTitle}
          </h2>
          <p className="mb-10 text-lg text-white/80">
            {h.ctaSubtitle}
          </p>
          <Button
            asChild
            size="lg"
            className="h-14 rounded-full px-10 text-base font-bold text-gray-900 shadow-2xl transition-all hover:scale-105"
            style={{ backgroundColor: "white", boxShadow: "0 10px 40px rgba(0,0,0,0.2)" }}
          >
            <Link href="/katalog">
              {h.ctaButton}
              <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
          </Button>
        </div>
      </section>

      {/* ─── SEO TEXT ─── */}
      <section className="py-12 bg-white border-t" style={{ borderColor: "#F0E8DC" }}>
        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-3xl text-center text-sm text-gray-400 leading-relaxed space-y-2">
            <p>
              <strong className="text-gray-500">Materiały dla żłobków i przedszkoli</strong> — {h.seoText1}
            </p>
            <p>{h.seoText2}</p>
          </div>
        </div>
      </section>
    </>
  );
}
