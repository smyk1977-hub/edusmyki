"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";

type Choice = { analytics: boolean; marketing: boolean; expires: number };
type Tracker = ((...args: unknown[]) => void) & {
  queue?: unknown[][]; loaded?: boolean; version?: string;
  push?: Tracker; callMethod?: (...args: unknown[]) => void;
};
type TrackingWindow = Window & {
  fbq?: Tracker; _fbq?: Tracker; dataLayer?: unknown[];
  gtag?: (...args: unknown[]) => void;
};
const KEY = "edusmyki-cookie-consent-v1";
const PIXEL = "1121100643837701";
const GA = process.env.NEXT_PUBLIC_GA_ID;
const MAX_AGE = 180 * 24 * 60 * 60 * 1000;
let pixelStarted = false;
let analyticsStarted = false;

export function readChoice(): Choice | null {
  try {
    const value = JSON.parse(localStorage.getItem(KEY) || "null");
    return value && typeof value.analytics === "boolean" &&
      typeof value.marketing === "boolean" && typeof value.expires === "number" &&
      value.expires > Date.now() ? value : null;
  } catch { return null; }
}

function addScript(id: string, src: string) {
  if (document.getElementById(id)) return;
  const script = document.createElement("script");
  script.id = id;
  script.async = true;
  script.src = src;
  document.head.appendChild(script);
}

function clearTrackingCookies() {
  // Keep login and shopping-cart cookies intact.
  for (const item of document.cookie.split(";")) {
    const name = item.trim().split("=")[0];
    if (!/^(_ga($|_)|_gid$|_gat($|_)|_fbp$|_fbc$)/.test(name)) continue;
    const domains = ["", location.hostname, "." + location.hostname];
    const labels = location.hostname.split(".");
    for (let i = 1; i < labels.length - 1; i++) domains.push("." + labels.slice(i).join("."));
    for (const domain of domains) {
      document.cookie = `${name}=; Max-Age=0; Path=/;${domain ? ` Domain=${domain};` : ""}`;
    }
  }
}

export function stopTracking() {
  const w = window as TrackingWindow;
  w.fbq?.("consent", "revoke");
  if (GA) (window as unknown as Record<string, unknown>)[`ga-disable-${GA}`] = true;
  w.gtag?.("consent", "update", {
    analytics_storage: "denied", ad_storage: "denied",
    ad_user_data: "denied", ad_personalization: "denied",
  });
  clearTrackingCookies();
}

export function trackPage(choice: Choice, pathname: string) {
  // Never load tracking on account, review-token, API or checkout-result pages.
  if (/^\/(konto|opinia|api)(\/|$)/.test(pathname) || /sukces|success|thank|dziekuj/.test(pathname)) return;
  const w = window as TrackingWindow;
  if (choice.marketing) {
    if (!pixelStarted) {
      if (!w.fbq) {
        const fbq: Tracker = (...args) => {
          if (fbq.callMethod) fbq.callMethod(...args);
          else fbq.queue!.push(args);
        };
        fbq.queue = [];
        fbq.push = fbq;
        fbq.loaded = true;
        fbq.version = "2.0";
        w.fbq = fbq;
        w._fbq = fbq;
      }
      w.fbq("consent", "grant");
      w.fbq("set", "autoConfig", false, PIXEL);
      w.fbq("init", PIXEL);
      addScript("edusmyki-meta-pixel", "https://connect.facebook.net/en_US/fbevents.js");
      pixelStarted = true;
    }
    w.fbq?.("consent", "grant");
    w.fbq?.("track", "PageView");
  }
  if (choice.analytics && GA) {
    if (!analyticsStarted) {
      w.dataLayer = w.dataLayer || [];
      w.gtag = function () { w.dataLayer!.push(arguments); };
      w.gtag("consent", "default", {
        analytics_storage: "granted", ad_storage: "denied",
        ad_user_data: "denied", ad_personalization: "denied",
      });
      w.gtag("js", new Date());
      w.gtag("config", GA, { send_page_view: false, allow_google_signals: false,
        allow_ad_personalization_signals: false });
      addScript("edusmyki-google-analytics", `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(GA)}`);
      analyticsStarted = true;
    }
    (window as unknown as Record<string, unknown>)[`ga-disable-${GA}`] = false;
    w.gtag?.("consent", "update", { analytics_storage: "granted" });
    w.gtag?.("event", "page_view", {
      page_location: location.origin + pathname,
      page_title: document.title,
    });
  }
}

export default function CookieConsent() {
  const pathname = usePathname();
  const [choice, setChoice] = useState<Choice | null>(null);
  const [ready, setReady] = useState(false);
  const [open, setOpen] = useState(false);
  const [analytics, setAnalytics] = useState(false);
  const [marketing, setMarketing] = useState(false);
  const lastPage = useRef<{ path: string; analytics: boolean; marketing: boolean } | null>(null);
  const settingsButton = useRef<HTMLButtonElement>(null);
  const heading = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    const saved = readChoice();
    setChoice(saved);
    setAnalytics(saved?.analytics ?? false);
    setMarketing(saved?.marketing ?? false);
    setOpen(!saved);
    setReady(true);
    const sync = (event: StorageEvent) => {
      if (event.key === KEY || event.key === null) { stopTracking(); location.reload(); }
    };
    window.addEventListener("storage", sync);
    return () => window.removeEventListener("storage", sync);
  }, []);

  useEffect(() => {
    if (!choice || !pathname) return;
    const remaining = choice.expires - Date.now();
    if (remaining <= 0) { stopTracking(); location.reload(); return; }
    // Recheck daily rather than overflowing the browser timer's 32-bit limit.
    const timer = window.setInterval(() => {
      if (Date.now() >= choice.expires) { stopTracking(); location.reload(); }
    }, Math.min(remaining, 24 * 60 * 60 * 1000));
    const previous = lastPage.current;
    const moved = previous?.path !== pathname;
    trackPage({ ...choice,
      analytics: choice.analytics && (moved || !previous?.analytics),
      marketing: choice.marketing && (moved || !previous?.marketing),
    }, pathname);
    lastPage.current = { path: pathname, analytics: choice.analytics, marketing: choice.marketing };
    return () => window.clearInterval(timer);
  }, [choice, pathname]);

  function save(allowAnalytics: boolean, allowMarketing: boolean) {
    const next = { analytics: allowAnalytics, marketing: allowMarketing, expires: Date.now() + MAX_AGE };
    let persisted = true;
    try { localStorage.setItem(KEY, JSON.stringify(next)); } catch { persisted = false; }
    if ((choice?.analytics && !allowAnalytics) || (choice?.marketing && !allowMarketing)) {
      stopTracking();
      if (persisted) {
        location.reload(); // Unload previously approved third-party scripts.
        return;
      }
    }
    setChoice(next);
    setAnalytics(allowAnalytics);
    setMarketing(allowMarketing);
    setOpen(false);
    settingsButton.current?.focus();
  }

  if (!ready) return null;
  const buttonClass = "rounded-lg border border-gray-400 bg-white px-4 py-2 text-sm font-semibold text-gray-900 hover:bg-gray-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-700";
  return <>
    <button ref={settingsButton} type="button"
      className="fixed bottom-3 left-3 z-40 rounded-full border border-gray-300 bg-white px-3 py-2 text-xs text-gray-800 shadow-md"
      onClick={() => { setOpen(true); requestAnimationFrame(() => heading.current?.focus()); }}>
      Ustawienia cookies
    </button>
    {open && <section aria-labelledby="cookie-heading"
      className="fixed inset-x-3 bottom-3 z-50 mx-auto max-h-[85vh] max-w-2xl overflow-y-auto rounded-2xl border border-gray-300 bg-white p-5 text-gray-900 shadow-2xl sm:p-6">
      <h2 id="cookie-heading" ref={heading} tabIndex={-1} className="text-xl font-semibold">Twój wybór cookies</h2>
      <p className="mt-2 text-sm leading-relaxed">Niezbędne pliki służą do obsługi konta i koszyka. Za Twoją zgodą użyjemy też Google Analytics do statystyk oraz Piksela Meta do pomiaru reklam. Możesz odmówić i nadal korzystać ze sklepu.</p>
      <div className="my-4 space-y-3">
        <label className="flex items-start gap-3 text-sm"><input type="checkbox" checked={analytics} onChange={e => setAnalytics(e.target.checked)} className="mt-1 h-4 w-4" />
          <span><strong>Statystyki — Google Analytics</strong><br />Pomagają nam zrozumieć, jak odwiedzający korzystają ze sklepu.</span></label>
        <label className="flex items-start gap-3 text-sm"><input type="checkbox" checked={marketing} onChange={e => setMarketing(e.target.checked)} className="mt-1 h-4 w-4" />
          <span><strong>Marketing — Meta</strong><br />Informacje o odwiedzinach są przekazywane Meta, aby mierzyć skuteczność reklam.</span></label>
      </div>
      <p className="mb-4 text-sm">Decyzję możesz zmienić przez „Ustawienia cookies”. <a className="underline" href="/polityka-prywatnosci">Polityka prywatności</a>.</p>
      <div className="flex flex-wrap gap-2">
        <button type="button" className={buttonClass} onClick={() => save(false, false)}>Tylko niezbędne</button>
        <button type="button" className={buttonClass} onClick={() => save(analytics, marketing)}>Zapisz wybór</button>
        <button type="button" className={buttonClass} onClick={() => save(true, true)}>Akceptuję wszystkie</button>
        {choice && <button type="button" className={buttonClass} onClick={() => { setAnalytics(choice.analytics); setMarketing(choice.marketing); setOpen(false); settingsButton.current?.focus(); }}>Zamknij</button>}
      </div>
    </section>}
  </>;
}
