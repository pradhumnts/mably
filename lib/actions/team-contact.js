"use server";

import { Resend } from "resend";
import { createClient } from "@/lib/supabase/server";
import { buildTeamContactEmailHtml } from "@/lib/email/team-contact-email";

const TEAM_INBOX = "hello@mably.io";
const MAX_MESSAGE_LENGTH = 5000;

/**
 * @param {{ message: string; pagePath?: string; projectId?: string }} input
 */
export async function submitTeamContactMessage(input) {
  const supabase = await createClient();
  const {
    data: { user },
    error: authErr,
  } = await supabase.auth.getUser();

  if (authErr || !user) {
    return { ok: false, error: "Please sign in to send a message." };
  }

  const message = String(input?.message ?? "").trim();
  const pagePath = String(input?.pagePath ?? "").trim() || null;
  const projectId = String(input?.projectId ?? "").trim() || null;

  if (!message) {
    return { ok: false, error: "Please enter a message." };
  }

  if (message.length > MAX_MESSAGE_LENGTH) {
    return {
      ok: false,
      error: `Message is too long (max ${MAX_MESSAGE_LENGTH} characters).`,
    };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, email, role")
    .eq("id", user.id)
    .maybeSingle();

  const senderEmail =
    (profile?.email || user.email || "").trim() || "unknown@mably.io";
  const senderName =
    (profile?.full_name || "").trim() ||
    senderEmail.split("@")[0] ||
    "Mably user";
  const senderRole = profile?.role ?? null;

  const apiKey = process.env.RESEND_API_KEY?.trim();
  if (!apiKey) {
    return { ok: false, error: "Email is not configured. Please try again later." };
  }

  const from = process.env.RESEND_FROM?.trim();
  if (!from) {
    return { ok: false, error: "Email is not configured. Please try again later." };
  }

  const to =
    process.env.TEAM_CONTACT_TO?.trim() ||
    process.env.ADMIN_SIGNUP_NOTIFY_TO?.trim() ||
    TEAM_INBOX;

  const subject = `[Mably] Message from ${senderName}`;
  const html = buildTeamContactEmailHtml({
    message,
    senderName,
    senderEmail,
    senderRole,
    pagePath,
    projectId,
  });

  const resend = new Resend(apiKey);
  const { data, error } = await resend.emails.send({
    from,
    to: [to],
    replyTo: senderEmail,
    subject,
    html,
  });

  if (error) {
    return { ok: false, error: error.message || "Could not send your message." };
  }

  return { ok: true, messageId: data?.id ?? "" };
}
