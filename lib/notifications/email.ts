import { Resend } from "resend";
import type { Locale } from "@/types";

let resend: Resend | null = null;

function getResend(): Resend {
  if (!resend) {
    resend = new Resend(process.env.RESEND_API_KEY);
  }
  return resend;
}

type SendEmailParams = {
  to: string;
  subject: string;
  html: string;
  locale?: Locale;
};

export async function sendEmail({
  to,
  subject,
  html,
}: SendEmailParams): Promise<void> {
  if (!process.env.RESEND_API_KEY) {
    console.warn("[email] RESEND_API_KEY not set, skipping:", subject, to);
    return;
  }

  const from =
    process.env.RESEND_FROM_EMAIL ?? "Firefly <noreply@firefly.app>";

  await getResend().emails.send({ from, to, subject, html });
}

export async function sendEventApprovedEmail(
  to: string,
  eventTitle: string,
  locale: Locale = "en"
): Promise<void> {
  const subject =
    locale === "ro"
      ? `Evenimentul tău "${eventTitle}" a fost aprobat`
      : `Your event "${eventTitle}" has been approved`;

  const html =
    locale === "ro"
      ? `<p>Evenimentul <strong>${eventTitle}</strong> a fost aprobat și este acum publicat pe Firefly.</p>`
      : `<p>Your event <strong>${eventTitle}</strong> has been approved and is now live on Firefly.</p>`;

  await sendEmail({ to, subject, html, locale });
}

export async function sendEventRejectedEmail(
  to: string,
  eventTitle: string,
  reason: string,
  locale: Locale = "en"
): Promise<void> {
  const subject =
    locale === "ro"
      ? `Evenimentul tău "${eventTitle}" a fost respins`
      : `Your event "${eventTitle}" was rejected`;

  const html =
    locale === "ro"
      ? `<p>Evenimentul <strong>${eventTitle}</strong> a fost respins.</p><p>Motiv: ${reason}</p>`
      : `<p>Your event <strong>${eventTitle}</strong> was rejected.</p><p>Reason: ${reason}</p>`;

  await sendEmail({ to, subject, html, locale });
}

export async function sendEventReminderEmail(
  to: string,
  eventTitle: string,
  startsAt: string,
  locale: Locale = "en"
): Promise<void> {
  const subject =
    locale === "ro"
      ? `Reminder: ${eventTitle} începe curând`
      : `Reminder: ${eventTitle} is coming up`;

  const html =
    locale === "ro"
      ? `<p>Nu uita! <strong>${eventTitle}</strong> începe la ${startsAt}.</p>`
      : `<p>Don't forget! <strong>${eventTitle}</strong> starts at ${startsAt}.</p>`;

  await sendEmail({ to, subject, html, locale });
}
