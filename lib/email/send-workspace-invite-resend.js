import { Resend } from "resend";
import { escapeHtml, FONT_STACK, initialLetter } from "@/lib/email/email-html-utils";
import { defaultMablyEmailLogoUrl } from "@/lib/email/send-portal-invite-resend";

/**
 * @param {{
 *   to: string;
 *   acceptUrl: string;
 *   inviterName: string;
 *   inviterRoleLine: string;
 *   inviterAvatarUrl: string | null;
 *   workspaceName: string;
 *   role: 'admin' | 'member';
 *   projectNames?: string[];
 * }} params
 */
export async function sendWorkspaceInviteViaResend(params) {
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

  const inviterName = params.inviterName?.trim() || "A teammate";
  const subject = `${inviterName} invited you to collaborate on Mably`;
  const html = buildWorkspaceInviteHtml({
    ...params,
    inviterName,
    logoUrl: defaultMablyEmailLogoUrl(),
  });

  const resend = new Resend(apiKey);
  const { data, error } = await resend.emails.send({
    from,
    to: [params.to],
    subject,
    html,
  });

  if (error) {
    return { ok: false, error: error.message || "Resend send failed" };
  }

  return { ok: true, messageId: data?.id ?? "", subject };
}

/**
 * @param {{
 *   acceptUrl: string;
 *   inviterName: string;
 *   inviterRoleLine: string;
 *   inviterAvatarUrl: string | null;
 *   workspaceName: string;
 *   role: 'admin' | 'member';
 *   projectNames?: string[];
 *   logoUrl: string;
 * }} p
 */
export function buildWorkspaceInviteHtml(p) {
  const name = escapeHtml(p.inviterName || "A teammate");
  const roleLine = escapeHtml(p.inviterRoleLine || "Freelancer");
  const workspace = escapeHtml(p.workspaceName || "their workspace");
  const url = escapeHtml(p.acceptUrl);
  const logo = escapeHtml(p.logoUrl);
  const initial = escapeHtml(initialLetter(p.inviterName || ""));
  const roleLabel = p.role === "admin" ? "an admin" : "a member";
  const projects = Array.isArray(p.projectNames)
    ? p.projectNames.map((n) => String(n || "").trim()).filter(Boolean)
    : [];

  const avatarCell =
    p.inviterAvatarUrl &&
    (p.inviterAvatarUrl.startsWith("https://") || p.inviterAvatarUrl.startsWith("http://"))
      ? `<td style="width:72px;padding:0 24px 0 0;vertical-align:middle;">
          <img src="${escapeHtml(p.inviterAvatarUrl)}" alt="" width="72" height="72" style="width:72px;height:72px;border-radius:50%;display:block;object-fit:cover;border:0;" />
        </td>`
      : `<td style="width:72px;padding:0 24px 0 0;vertical-align:middle;">
          <table role="presentation" cellpadding="0" cellspacing="0" style="width:72px;height:72px;border-collapse:collapse;">
            <tr>
              <td style="width:72px;height:72px;border-radius:50%;background-color:#000000;color:#ffffff;text-align:center;vertical-align:middle;font-size:28px;font-weight:700;font-family:${FONT_STACK};">${initial}</td>
            </tr>
          </table>
        </td>`;

  const accessLine =
    p.role === "admin"
      ? `<p style="margin:0;font-size:16px;line-height:1.5;color:#000000;">As ${roleLabel}, you&apos;ll be able to see all clients and projects in <strong>${workspace}</strong>.</p>`
      : projects.length > 0
        ? `<p style="margin:0;font-size:16px;line-height:1.5;color:#000000;">As ${roleLabel}, you&apos;ll be able to open: <strong>${projects
            .map((n) => escapeHtml(n))
            .join(", ")}</strong>.</p>`
        : `<p style="margin:0;font-size:16px;line-height:1.5;color:#000000;">As ${roleLabel}, you&apos;ll join <strong>${workspace}</strong> on Mably.</p>`;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${escapeHtml(`${p.inviterName || "Teammate"} invited you to Mably`)}</title>
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
              <h1 style="margin:0;font-size:28px;font-weight:700;color:#000000;line-height:1.3;">You&apos;re invited to collaborate</h1>
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
          <tr>
            <td style="padding:0 40px 16px 40px;">
              <p style="margin:0;font-size:16px;line-height:1.5;color:#000000;"><strong>${name}</strong> invited you to join <strong>${workspace}</strong> on Mably.</p>
            </td>
          </tr>
          <tr>
            <td style="padding:0 40px 24px 40px;">
              ${accessLine}
            </td>
          </tr>
          <tr>
            <td style="padding:0 40px 24px 40px;">
              <p style="margin:0;font-size:16px;line-height:1.5;color:#000000;">Use the same email this message was sent to. Sign in to Mably, then accept the invite from Settings → Members.</p>
            </td>
          </tr>
          <tr>
            <td style="padding:0 40px 40px 40px;">
              <table role="presentation" style="width:100%;border-collapse:collapse;">
                <tr>
                  <td style="background-color:#F7F7F7;padding:32px 24px;text-align:center;border-radius:8px;">
                    <a href="${url}" style="display:inline-block;background-color:#FF701A;color:#ffffff;text-decoration:none;padding:14px 28px;border-radius:8px;font-weight:600;font-size:16px;font-family:${FONT_STACK};">Accept invite</a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding:0 40px 32px 40px;">
              <p style="margin:0;font-size:13px;line-height:1.5;color:#666666;word-break:break-all;">If the button doesn&apos;t work, copy and paste this link into your browser:<br /><span style="color:#000000;">${url}</span></p>
            </td>
          </tr>
          <tr>
            <td style="padding:0 40px;">
              <div style="height:1px;background-color:#E5E5E5;"></div>
            </td>
          </tr>
          <tr>
            <td style="padding:30px 40px 40px 40px;">
              <p style="margin:0;font-size:14px;color:#000000;">
                Didn&apos;t expect this invite?
                <a href="mailto:support@mably.io" style="color:#000000;font-weight:600;text-decoration:underline;">Let us know</a>.
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
