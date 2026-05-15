import { createClient } from "@/lib/supabase/server";
import { sanitizeNextPath } from "@/lib/auth/safe-next-path";
import { applyPortalInviteClientRoleIfNeeded } from "@/lib/auth/portal-invite-role";
import { resolveAfterAuthRedirect } from "@/lib/auth/resolve-after-auth-redirect";
import { syncProfileAvatarFromAuth } from "@/lib/auth/sync-profile-avatar-from-auth";
import { NextResponse } from "next/server";

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const rawNext = searchParams.get("next");
  const safeNext = sanitizeNextPath(rawNext);

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        await applyPortalInviteClientRoleIfNeeded(supabase, user, safeNext);
        await syncProfileAvatarFromAuth(supabase, user);
        const destination = await resolveAfterAuthRedirect(supabase, user, safeNext);
        return NextResponse.redirect(new URL(destination, request.url));
      }
    }
  }

  return NextResponse.redirect(new URL("/", request.url));
}


