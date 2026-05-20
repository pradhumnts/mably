import { escapeHtml, FONT_STACK } from "@/lib/email/email-html-utils";
import { FOUNDER_WELCOME_COPY, FOUNDER_WELCOME_TEAM } from "@/lib/founder/founder-welcome";

/** Avatars shown in the “Chat with team” dialog header (founder + team). */
export const MABLY_TEAM_AVATARS = [
  {
    name: FOUNDER_WELCOME_COPY.founder.name,
    imageSrc: FOUNDER_WELCOME_COPY.founder.imageSrc,
  },
  ...FOUNDER_WELCOME_TEAM,
];

/**
 * @param {{
 *   message: string;
 *   senderName: string;
 *   senderEmail: string;
 *   senderRole?: string | null;
 *   pagePath?: string | null;
 *   projectId?: string | null;
 * }} params
 */
export function buildTeamContactEmailHtml({
  message,
  senderName,
  senderEmail,
  senderRole,
  pagePath,
  projectId,
}) {
  const site = process.env.NEXT_PUBLIC_SITE_URL?.trim()?.replace(/\/$/, "") || "";
  const pageUrl = pagePath && site ? `${site}${pagePath.startsWith("/") ? pagePath : `/${pagePath}`}` : null;

  const metaRows = [
    ["From", `${escapeHtml(senderName)} &lt;${escapeHtml(senderEmail)}&gt;`],
    senderRole ? ["Role", escapeHtml(senderRole)] : null,
    pagePath ? ["Page", escapeHtml(pagePath)] : null,
    pageUrl
      ? [
          "Link",
          `<a href="${escapeHtml(pageUrl)}" style="color:#2563eb;">${escapeHtml(pageUrl)}</a>`,
        ]
      : null,
    projectId ? ["Project ID", escapeHtml(projectId)] : null,
  ].filter(Boolean);

  const metaTable = metaRows
    .map(
      ([label, value]) => `
        <tr>
          <td style="padding:6px 12px 6px 0;font-size:13px;color:#64748b;vertical-align:top;white-space:nowrap;">${escapeHtml(label)}</td>
          <td style="padding:6px 0;font-size:13px;color:#0f172a;vertical-align:top;">${value}</td>
        </tr>`
    )
    .join("");

  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin:0;padding:24px;background:#f8fafc;font-family:${FONT_STACK};">
  <div style="max-width:560px;margin:0 auto;background:#ffffff;border-radius:12px;border:1px solid #e2e8f0;padding:24px;">
    <p style="margin:0 0 8px;font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:0.05em;color:#64748b;">Mably — team inbox</p>
    <h1 style="margin:0 0 20px;font-size:20px;font-weight:600;color:#0f172a;">New message from app</h1>
    <table style="width:100%;border-collapse:collapse;margin-bottom:20px;">${metaTable}</table>
    <p style="margin:0 0 8px;font-size:13px;font-weight:600;color:#334155;">Message</p>
    <div style="margin:0;padding:16px;background:#f1f5f9;border-radius:8px;font-size:14px;line-height:1.6;color:#0f172a;white-space:pre-wrap;">${escapeHtml(message)}</div>
  </div>
</body>
</html>`;
}
