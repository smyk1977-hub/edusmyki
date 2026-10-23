import { Resend } from "resend";
import type { Order, DownloadToken } from "@/types";
import { buildReviewUrl } from "./review-token";

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM = process.env.EMAIL_FROM || "zamowienia@edusmyki.pl";
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://edusmyki.pl";

export async function sendOrderConfirmationEmail(
  order: Order,
  downloadTokens: DownloadToken[]
): Promise<void> {
  const downloadLinks = downloadTokens.map((dt) => ({
    title: dt.ebook.title,
    url: `${APP_URL}/api/download/${dt.token}`,
    expiresAt: dt.expiresAt,
    maxDownloads: dt.maxDownloads,
    reviewUrl: buildReviewUrl(order.guestEmail!, dt.ebook.documentId, APP_URL),
  }));

  await resend.emails.send({
    from: FROM,
    to: order.guestEmail!,
    subject: `Twoje zamówienie #${order.orderNumber} - edusmyki.pl`,
    html: buildOrderEmailHtml(order, downloadLinks),
  });
}

function buildOrderEmailHtml(
  order: Order,
  links: Array<{ title: string; url: string; expiresAt: string; maxDownloads: number; reviewUrl: string }>
): string {
  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString("pl-PL", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });

  const linksHtml = links
    .map(
      (l) => `
    <div style="border:1px solid #e5e7eb;border-radius:8px;padding:16px;margin-bottom:12px;">
      <p style="font-weight:600;margin:0 0 8px;">${l.title}</p>
      <a href="${l.url}" style="background:#2563eb;color:#fff;padding:10px 20px;border-radius:6px;text-decoration:none;display:inline-block;">
        Pobierz PDF
      </a>
      <p style="color:#6b7280;font-size:12px;margin:8px 0 0;">
        Link ważny do ${formatDate(l.expiresAt)} · max ${l.maxDownloads} pobrań
      </p>
      <p style="margin:8px 0 0;">
        <a href="${l.reviewUrl}" style="color:#4BBFCA;font-size:12px;text-decoration:underline;">
          Oceń ten materiał ★
        </a>
      </p>
    </div>`
    )
    .join("");

  return `
    <div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:24px;">
      <h1 style="color:#1e40af;">edusmyki.pl</h1>
      <h2>Dziękujemy za zamówienie!</h2>
      <p>Cześć ${order.guestFirstName},</p>
      <p>Twoje zamówienie nr <strong>#${order.orderNumber}</strong> zostało opłacone.</p>
      <p>Poniżej znajdziesz linki do pobrania zakupionych ebooków:</p>
      ${linksHtml}
      <hr style="border:none;border-top:1px solid #e5e7eb;margin:24px 0;">
      <p style="color:#6b7280;font-size:12px;">
        Problemy z pobieraniem? Napisz do nas: kontakt@edusmyki.pl
      </p>
    </div>
  `;
}

export async function sendWelcomeEmail(email: string, firstName: string): Promise<void> {
  await resend.emails.send({
    from: FROM,
    to: email,
    subject: "Witaj w edusmyki.pl!",
    html: `
      <div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:24px;">
        <h1 style="color:#1e40af;">edusmyki.pl</h1>
        <h2>Witaj, ${firstName}!</h2>
        <p>Cieszmy się, że dołączyłeś/aś do naszej społeczności.</p>
        <p>Odkryj nasze <a href="${APP_URL}/katalog">ebooki dla przedszkoli i żłobków</a>.</p>
      </div>
    `,
  });
}

export async function sendMagicLinkEmail(
  email: string,
  magicUrl: string
): Promise<void> {
  await resend.emails.send({
    from: FROM,
    to: email,
    subject: "Zaloguj się do EduSmyki",
    html: `
      <div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:24px;">
        <h1 style="color:#F5A623;margin:0 0 4px;">edusmyki.pl</h1>
        <h2 style="margin:0 0 16px;">Link do logowania</h2>
        <p>Kliknij poniższy przycisk, aby zalogować się do swojego konta.</p>
        <p style="margin:24px 0;">
          <a href="${magicUrl}"
             style="background:#F5A623;color:#fff;padding:12px 28px;border-radius:24px;
                    text-decoration:none;font-weight:600;display:inline-block;">
            Zaloguj się
          </a>
        </p>
        <p style="color:#6b7280;font-size:12px;">
          Link ważny 15 minut, jednorazowy.<br>
          Jeśli to nie Ty prosiłeś/aś o link, zignoruj tę wiadomość.
        </p>
      </div>
    `,
  });
}

export async function sendAdminReviewNotification(data: {
  adminEmail: string;
  ebookTitle: string;
  authorName: string;
  rating: number;
}): Promise<void> {
  const strapiAdminUrl =
    process.env.NEXT_PUBLIC_STRAPI_URL || "http://localhost:1337";
  const stars = "★".repeat(data.rating) + "☆".repeat(5 - data.rating);

  await resend.emails.send({
    from: FROM,
    to: data.adminEmail,
    subject: `Nowa opinia do moderacji — ${data.ebookTitle}`,
    html: `
      <div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:24px;">
        <h1 style="color:#F5A623;margin:0 0 4px;">edusmyki.pl</h1>
        <h2 style="margin:0 0 16px;">Nowa opinia czeka na moderację</h2>
        <p><strong>Ebook:</strong> ${data.ebookTitle}</p>
        <p><strong>Autor:</strong> ${data.authorName}</p>
        <p><strong>Ocena:</strong> ${stars} (${data.rating}/5)</p>
        <p style="margin:24px 0;">
          <a href="${strapiAdminUrl}/admin/content-manager/collection-types/api::review.review"
             style="background:#F5A623;color:#fff;padding:12px 28px;border-radius:24px;
                    text-decoration:none;font-weight:600;display:inline-block;">
            Otwórz panel Strapi
          </a>
        </p>
        <p style="color:#6b7280;font-size:12px;">
          Zatwierdź lub odrzuć opinię w panelu Strapi (Opinie → Opublikuj).
        </p>
      </div>
    `,
  });
}
export async function sendInvoiceRequestEmail(
  order: Order
): Promise<void> {
  if (!order.invoiceRequested) return;

  const invoice = order.invoiceData;
  const amount = Number(order.totalAmount).toFixed(2);

  const products = order.items
    .map((item) => `- ${item.ebookTitle}: ${Number(item.price).toFixed(2)} zł`)
    .join("\n");

  const { error } = await resend.emails.send({
    from: FROM,
    to: "kontakt@edusmyki.pl",
    subject: `Klient prosi o fakturę — ${order.orderNumber}`,
    text: [
      "Klient opłacił zamówienie i zaznaczył „Chcę fakturę”.",
      "",
      `Numer zamówienia: ${order.orderNumber}`,
      `Kwota: ${amount} zł`,
      `E-mail klienta: ${order.guestEmail || "Brak"}`,
      "",
      "Zakupione produkty:",
      products,
      "",
      "Dane do faktury:",
      `Nazwa: ${invoice?.companyName || "Brak danych"}`,
      `NIP: ${invoice?.nip || "Brak danych"}`,
      `Adres: ${invoice?.address || "Brak danych"}`,
      `Kod pocztowy: ${invoice?.postalCode || "Brak danych"}`,
      `Miejscowość: ${invoice?.city || "Brak danych"}`,
      `Kraj: ${invoice?.country || "PL"}`,
      "",
      "Wystaw fakturę w wFirma i wyślij ją klientowi.",
      "Ta wiadomość jest powiadomieniem, nie fakturą.",
    ].join("\n"),
    }, {
    idempotencyKey: `invoice-request/${order.documentId}`,
  });

  if (error) {
    throw new Error("Nie udało się wysłać powiadomienia o fakturze.");
  }
}
