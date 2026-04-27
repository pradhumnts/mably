/**
 * Smoke-test Resend from your machine (loads .env.local).
 * Usage: npm install && node --env-file=.env.local scripts/test-resend.mjs you@example.com
 *
 * With `RESEND_FROM=... <onboarding@resend.dev>`, Resend only delivers to your
 * Resend account login email until you verify a domain and use from@that.domain.
 */
import { Resend } from "resend";

const to = process.argv[2];
const apiKey = process.env.RESEND_API_KEY?.trim();
const from = process.env.RESEND_FROM?.trim();

if (!to) {
  console.error("Usage: node --env-file=.env.local scripts/test-resend.mjs <recipient@email.com>");
  process.exit(1);
}
if (!apiKey || !from) {
  console.error("Missing RESEND_API_KEY or RESEND_FROM in environment.");
  process.exit(1);
}

const resend = new Resend(apiKey);
const { data, error } = await resend.emails.send({
  from,
  to: [to],
  subject: "Mably — Resend test",
  html: "<p>If you see this, Resend is configured correctly.</p>",
});

if (error) {
  console.error("Resend error:", error);
  process.exit(1);
}

console.log("Sent. Message id:", data?.id ?? "(none)");
