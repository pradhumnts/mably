import { Resend } from "resend";

/**
 * @param {{ to: string; subject: string; html: string }} params
 * @returns {Promise<{ ok: true; messageId: string } | { ok: false; error: string }>}
 */
export async function sendPortalTransactionalEmail({ to, subject, html }) {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  if (!apiKey) {
    return { ok: false, error: "RESEND_API_KEY is not set" };
  }

  const from = process.env.RESEND_FROM?.trim();
  if (!from) {
    return {
      ok: false,
      error: "RESEND_FROM is not set (e.g. Mably <onboarding@resend.dev>)",
    };
  }

  const resend = new Resend(apiKey);
  const { data, error } = await resend.emails.send({
    from,
    to: [to],
    subject,
    html,
  });

  if (error) {
    return { ok: false, error: error.message || "Resend send failed" };
  }

  return { ok: true, messageId: data?.id ?? "" };
}
