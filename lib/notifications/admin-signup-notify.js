import { Resend } from "resend";
import { escapeHtml, FONT_STACK, initialLetter } from "@/lib/email/email-html-utils";
import { defaultMablyEmailLogoUrl } from "@/lib/email/send-portal-invite-resend";

const SURVEY_CATEGORY_LABELS = {
  development_tech: "Development & Tech",
  design_creative: "Design & Creative",
  writing_content: "Writing & Content",
  marketing_growth: "Marketing & Growth",
  media_production: "Media Production",
};

function humanizeSurveyCategory(category) {
  if (!category) return null;
  return SURVEY_CATEGORY_LABELS[category] || category;
}

function formatDateTime(value) {
  if (!value) return null;
  try {
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return null;
    const fmt = d.toLocaleString("en-US", {
      timeZone: "UTC",
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
    return `${fmt} UTC`;
  } catch {
    return null;
  }
}

function parseRecipients(raw) {
  if (!raw) return [];
  return raw
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

function supabaseDashboardUserUrl(userId) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  if (!supabaseUrl || !userId) return null;
  const match = supabaseUrl.match(/https?:\/\/([^.]+)\./);
  const ref = match?.[1];
  if (!ref) return null;
  return `https://supabase.com/dashboard/project/${ref}/auth/users?filter=${encodeURIComponent(userId)}`;
}

/**
 * Send a notification email to the team when a new freelancer finishes onboarding.
 *
 * Configuration (env):
 * - RESEND_API_KEY (required, already used by other Mably emails)
 * - RESEND_FROM (required, e.g. "Mably <hello@mably.io>") — also used as fallback FROM
 * - ADMIN_SIGNUP_NOTIFY_FROM (optional) — overrides FROM for admin signup emails only
 * - ADMIN_SIGNUP_NOTIFY_TO (optional, comma-separated) — defaults to "hello@mably.io".
 *   Set to empty string to disable these notifications entirely.
 *
 * @param {{
 *   userId: string;
 *   email: string | null;
 *   fullName: string | null;
 *   avatarUrl: string | null;
 *   role: string | null;
 *   surveyCategory: string | null;
 *   createdAt: string | null;
 *   onboardedAt: string | null;
 * }} payload
 * @returns {Promise<{ ok: true; messageId: string } | { ok: false; error: string }>}
 */
export async function notifyAdminOfNewFreelancer(payload) {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  if (!apiKey) return { ok: false, error: "RESEND_API_KEY is not set" };

  const from =
    process.env.ADMIN_SIGNUP_NOTIFY_FROM?.trim() ||
    process.env.RESEND_FROM?.trim();
  if (!from) return { ok: false, error: "RESEND_FROM is not set" };

  const toRaw = process.env.ADMIN_SIGNUP_NOTIFY_TO;
  // Default to hello@mably.io if env var is unset; empty string disables.
  const toList =
    typeof toRaw === "string"
      ? parseRecipients(toRaw)
      : ["hello@mably.io"];
  if (toList.length === 0) {
    return { ok: false, error: "Admin signup notifications disabled" };
  }

  const displayName =
    (payload.fullName && payload.fullName.trim()) ||
    (payload.email ? payload.email.split("@")[0] : "Unknown");
  const roleLabel = payload.role === "client" ? "client" : "freelancer";

  const subject = `New ${roleLabel} on Mably — ${displayName}`;
  const html = buildAdminSignupNotifyHtml({
    ...payload,
    fullName: displayName,
    roleLabel,
  });

  const resend = new Resend(apiKey);
  const { data, error } = await resend.emails.send({
    from,
    to: toList,
    subject,
    html,
  });

  if (error) {
    return { ok: false, error: error.message || "Resend send failed" };
  }

  return { ok: true, messageId: data?.id ?? "" };
}

function buildAdminSignupNotifyHtml(p) {
  const name = escapeHtml(p.fullName);
  const email = escapeHtml(p.email || "—");
  const roleLabel = escapeHtml(p.roleLabel);
  const specialtyText = humanizeSurveyCategory(p.surveyCategory);
  const specialty = specialtyText ? escapeHtml(specialtyText) : null;
  const signedUpAt = formatDateTime(p.createdAt);
  const onboardedAt = formatDateTime(p.onboardedAt);
  const userId = escapeHtml(p.userId || "—");
  const initial = escapeHtml(initialLetter(p.fullName));
  const logo = escapeHtml(defaultMablyEmailLogoUrl());
  const dashboardUrl = supabaseDashboardUserUrl(p.userId);

  const isHttpAvatar =
    p.avatarUrl &&
    (p.avatarUrl.startsWith("https://") || p.avatarUrl.startsWith("http://"));

  const avatarCell = isHttpAvatar
    ? `<td style="width:64px;padding:0 20px 0 0;vertical-align:middle;">
        <img src="${escapeHtml(p.avatarUrl)}" alt="" width="64" height="64" style="width:64px;height:64px;border-radius:50%;display:block;object-fit:cover;border:0;" />
      </td>`
    : `<td style="width:64px;padding:0 20px 0 0;vertical-align:middle;">
        <table role="presentation" cellpadding="0" cellspacing="0" style="width:64px;height:64px;border-collapse:collapse;">
          <tr>
            <td style="width:64px;height:64px;border-radius:50%;background-color:#000000;color:#ffffff;text-align:center;vertical-align:middle;font-size:24px;font-weight:700;font-family:${FONT_STACK};">${initial}</td>
          </tr>
        </table>
      </td>`;

  const detailRows = [
    { label: "Email", value: email },
    { label: "Role", value: roleLabel.charAt(0).toUpperCase() + roleLabel.slice(1) },
    specialty ? { label: "Specialty", value: specialty } : null,
    signedUpAt ? { label: "Signed up", value: escapeHtml(signedUpAt) } : null,
    onboardedAt ? { label: "Completed onboarding", value: escapeHtml(onboardedAt) } : null,
    { label: "User ID", value: `<span style="font-family:ui-monospace,SFMono-Regular,Menlo,Monaco,Consolas,monospace;font-size:12px;color:#555555;">${userId}</span>` },
  ]
    .filter(Boolean)
    .map(
      (row) => `
            <tr>
              <td style="padding:10px 0;border-bottom:1px solid #EFEFEF;width:170px;vertical-align:top;font-size:13px;color:#666666;">${row.label}</td>
              <td style="padding:10px 0;border-bottom:1px solid #EFEFEF;font-size:14px;color:#000000;word-break:break-all;">${row.value}</td>
            </tr>`,
    )
    .join("");

  const ctaBlock = dashboardUrl
    ? `<tr>
        <td style="padding:8px 40px 32px 40px;">
          <a href="${escapeHtml(dashboardUrl)}" style="display:inline-block;background-color:#000000;color:#ffffff;text-decoration:none;padding:12px 22px;border-radius:8px;font-weight:600;font-size:14px;font-family:${FONT_STACK};">View in Supabase</a>
        </td>
      </tr>`
    : "";

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>New ${roleLabel} on Mably — ${name}</title>
</head>
<body style="margin:0;padding:0;font-family:${FONT_STACK};background-color:#F7F7F7;">
  <table role="presentation" style="width:100%;border-collapse:collapse;background-color:#F7F7F7;">
    <tr>
      <td style="padding:32px 16px;">
        <table role="presentation" style="width:100%;max-width:560px;margin:0 auto;border-collapse:collapse;background-color:#ffffff;border-radius:12px;overflow:hidden;">
          <tr>
            <td style="padding:32px 40px 8px 40px;">
              <img src="${logo}" alt="Mably" style="height:36px;display:block;border:0;" />
            </td>
          </tr>
          <tr>
            <td style="padding:8px 40px 4px 40px;">
              <p style="margin:0;font-size:12px;font-weight:600;letter-spacing:0.06em;color:#FF701A;text-transform:uppercase;">New signup</p>
            </td>
          </tr>
          <tr>
            <td style="padding:0 40px 20px 40px;">
              <h1 style="margin:0;font-size:22px;font-weight:700;color:#000000;line-height:1.3;">A new ${roleLabel} just joined Mably</h1>
            </td>
          </tr>
          <tr>
            <td style="padding:0 40px 16px 40px;">
              <table role="presentation" style="width:100%;border-collapse:collapse;">
                <tr>
                  ${avatarCell}
                  <td style="padding:0;vertical-align:middle;">
                    <p style="margin:0 0 4px 0;font-size:18px;font-weight:700;color:#000000;line-height:1.3;">${name}</p>
                    <p style="margin:0;font-size:14px;font-weight:400;color:#666666;line-height:1.45;">${email}</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding:0 40px 16px 40px;">
              <table role="presentation" style="width:100%;border-collapse:collapse;">
                ${detailRows}
              </table>
            </td>
          </tr>
          ${ctaBlock}
          <tr>
            <td style="padding:0 40px 32px 40px;">
              <p style="margin:0;font-size:12px;color:#888888;line-height:1.5;">You're getting this because you're listed in <code style="font-family:ui-monospace,SFMono-Regular,Menlo,Monaco,Consolas,monospace;">ADMIN_SIGNUP_NOTIFY_TO</code>. Set that env var to a different value (comma-separated for multiple) or to an empty string to stop these.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}
