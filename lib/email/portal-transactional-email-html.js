import { sanitizeNextPath } from "@/lib/auth/safe-next-path";
import { getSiteOrigin } from "@/lib/invites/project-portal-invite";
import { escapeHtml, FONT_STACK, initialLetter } from "@/lib/email/email-html-utils";

/**
 * Absolute URL for a path under the marketing site (e.g. `/project/uuid/activity`).
 * @param {string} path
 */
export function absoluteUrlForPath(path) {
  const origin = getSiteOrigin();
  const safe = sanitizeNextPath(path) ?? path;
  if (!origin) return safe;
  return `${origin}${safe.startsWith("/") ? safe : `/${safe}`}`;
}

/**
 * Mably transactional email shell (matches portal invite: logo, headline, actor row, CTA, footer).
 * @param {{
 *   logoUrl: string;
 *   headline: string;
 *   actorName: string;
 *   actorRoleLine: string;
 *   actorAvatarUrl: string | null;
 *   bodyParagraphs: string[];
 *   ctaLabel: string;
 *   ctaUrl: string;
 *   footerNote?: string;
 * }} p
 */
export function buildPortalTransactionalEmailHtml(p) {
  const logo = escapeHtml(p.logoUrl);
  const headline = escapeHtml(p.headline);
  const name = escapeHtml(p.actorName || "Someone");
  const roleLine = escapeHtml(p.actorRoleLine || "Member");
  const ctaUrl = escapeHtml(p.ctaUrl);
  const ctaLabel = escapeHtml(p.ctaLabel);
  const initial = escapeHtml(initialLetter(p.actorName || ""));

  const avatarCell =
    p.actorAvatarUrl &&
    (p.actorAvatarUrl.startsWith("https://") || p.actorAvatarUrl.startsWith("http://"))
      ? `<td style="width:72px;padding:0 24px 0 0;vertical-align:middle;">
          <img src="${escapeHtml(p.actorAvatarUrl)}" alt="" width="72" height="72" style="width:72px;height:72px;border-radius:50%;display:block;object-fit:cover;border:0;" />
        </td>`
      : `<td style="width:72px;padding:0 24px 0 0;vertical-align:middle;">
          <table role="presentation" cellpadding="0" cellspacing="0" style="width:72px;height:72px;border-collapse:collapse;">
            <tr>
              <td style="width:72px;height:72px;border-radius:50%;background-color:#000000;color:#ffffff;text-align:center;vertical-align:middle;font-size:28px;font-weight:700;font-family:${FONT_STACK};">${initial}</td>
            </tr>
          </table>
        </td>`;

  const paragraphs = (p.bodyParagraphs || [])
    .map(
      (text) =>
        `<tr><td style="padding:0 40px 16px 40px;"><p style="margin:0;font-size:16px;line-height:1.55;color:#000000;">${escapeHtml(text)}</p></td></tr>`
    )
    .join("");

  const footer =
    p.footerNote && p.footerNote.trim()
      ? `<tr><td style="padding:0 40px 24px 40px;"><p style="margin:0;font-size:14px;line-height:1.5;color:#666666;">${escapeHtml(p.footerNote)}</p></td></tr>`
      : "";

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${headline}</title>
</head>
<body style="margin:0;padding:0;font-family:${FONT_STACK};background-color:#ffffff;">
  <table role="presentation" style="width:100%;border-collapse:collapse;">
    <tr>
      <td style="padding:0;">
        <table role="presentation" style="width:100%;max-width:600px;margin:0 auto;border-collapse:collapse;">
          <tr>
            <td style="padding:40px 40px 24px 40px;">
              <img src="${logo}" alt="Mably" style="height:48px;display:block;border:0;" />
            </td>
          </tr>
          <tr>
            <td style="padding:0px 40px 16px 40px;">
              <h1 style="margin:0;font-size:26px;font-weight:700;color:#000000;line-height:1.3;">${headline}</h1>
            </td>
          </tr>
          <tr>
            <td style="padding:8px 40px 16px 40px;">
              <table role="presentation" style="width:100%;border-collapse:collapse;">
                <tr>
                  ${avatarCell}
                  <td style="padding:0;vertical-align:middle;">
                    <p style="margin:0 0 4px 0;font-size:20px;font-weight:700;color:#000000;line-height:1.3;">${name}</p>
                    <p style="margin:0;font-size:15px;font-weight:400;color:#000000;line-height:1.45;">${roleLine}</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          ${paragraphs}
          <tr>
            <td style="padding:0 40px 32px 40px;">
              <table role="presentation" style="width:100%;border-collapse:collapse;">
                <tr>
                  <td style="background-color:#F7F7F7;padding:32px 24px;text-align:center;border-radius:8px;">
                    <a href="${ctaUrl}" style="display:inline-block;background-color:#FF701A;color:#ffffff;text-decoration:none;padding:14px 28px;border-radius:8px;font-weight:600;font-size:16px;font-family:${FONT_STACK};">${ctaLabel}</a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding:0 40px 32px 40px;">
              <p style="margin:0;font-size:13px;line-height:1.5;color:#666666;word-break:break-all;">If the button doesn&apos;t work, copy and paste this link into your browser:<br /><span style="color:#000000;">${ctaUrl}</span></p>
            </td>
          </tr>
          <tr>
            <td style="padding:0 40px;">
              <div style="height:1px;background-color:#E5E5E5;"></div>
            </td>
          </tr>
          ${footer}
          <tr>
            <td style="padding:30px 40px 40px 40px;">
              <p style="margin:0;font-size:14px;color:#000000;">
                Questions?
                <a href="mailto:support@mably.io" style="color:#000000;font-weight:600;text-decoration:underline;">Contact support</a>.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}
