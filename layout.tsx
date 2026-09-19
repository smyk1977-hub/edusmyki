import type { Metadata } from "next";
import { Baloo_2, DM_Sans } from "next/font/google";
import CookieConsent from "@/components/privacy/CookieConsent";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";

const baloo2 = Baloo_2({
  subsets: ["latin", "latin-ext"],
  variable: "--font-baloo",
  weight: ["400", "600", "700", "800"],
});

const dmSans = DM_Sans({
  subsets: ["latin", "latin-ext"],
  variable: "--font-dm",
  weight: ["400", "500", "600"],
});

export const metadata: Metadata = {
  title: {
    default: "edusmyki.pl – Ebooki dla przedszkoli i żłobków",
    template: "%s | edusmyki.pl",
  },
  description:
    "Profesjonalne ebooki z instrukcjami prowadzenia przedszkoli i żłobków. Pobierz gotowe procedury, regulaminy i poradniki.",
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_APP_URL || "https://edusmyki.pl"
  ),
  icons: {
    icon: "/logo_noback.png",
    apple: "/logo_noback.png",
  },
  openGraph: {
    siteName: "edusmyki.pl",
    locale: "pl_PL",
    type: "website",
    images: [{ url: "/logo.png", width: 512, height: 512, alt: "edusmyki.pl" }],
  },
  twitter: {
    card: "summary_large_image",
    images: ["/logo.png"],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pl" className={`${baloo2.variable} ${dmSans.variable}`}>
      <body>
        {children}
        <Toaster />
        <CookieConsent />
      </body>
    </html>
  );
}
