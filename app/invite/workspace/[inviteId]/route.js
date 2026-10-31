import { NextResponse } from "next/server";
import { acceptWorkspaceInviteAction } from "@/lib/actions/workspace-team";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function projectsRedirect(request, params) {
  const url = new URL("/projects", request.url);
  for (const [key, value] of Object.entries(params)) {
    if (value != null && value !== "") url.searchParams.set(key, String(value));
  }
  return NextResponse.redirect(url);
}

/**
 * Accept a workspace invite server-side (sets active-workspace cookie, then redirects).
 * Login `next=/invite/workspace/:id` stays path-only — no nested query params to drop.
 */
export async function GET(request, { params }) {
  const { inviteId: rawId } = await params;
  const inviteId = typeof rawId === "string" ? rawId.trim() : "";
  if (!inviteId || !UUID_RE.test(inviteId)) {
    return projectsRedirect(request, { inviteError: "Invalid invite link" });
  }

  const result = await acceptWorkspaceInviteAction(inviteId);
  if (!result.ok) {
    return projectsRedirect(request, {
      inviteError: result.error || "Could not accept invite",
    });
  }

  return projectsRedirect(request, { inviteAccepted: "1" });
}
