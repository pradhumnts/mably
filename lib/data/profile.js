import { createClient } from "@/lib/supabase/server";
import { getAuthProviderAvatarUrl } from "@/lib/auth/user-avatar-url";
import { syncProfileAvatarFromAuth } from "@/lib/auth/sync-profile-avatar-from-auth";
import { mergeAllNotificationPreferences } from "@/lib/notifications/notification-preference-defaults";
import { getDisplayBrandColor } from "@/lib/branding/portal-brand-tokens";

const PROFILE_SELECT =
  "id, email, full_name, avatar_url, role, phone, title, location, calendar_link, notification_preferences, onboarding_completed_at, freelancer_survey_category, default_brand_color";

/**
 * Current user + profile row for freelancer shell (sidebar, etc.).
 * Returns null if there is no session.
 */
export async function getCurrentUserProfile() {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return null;
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select(PROFILE_SELECT)
    .eq("id", user.id)
    .maybeSingle();

  if (profileError) {
    console.error("profiles fetch error:", profileError.message);
  }

  let row = profile;

  if (!row) {
    const email = user.email ?? "";
    const fullName =
      (typeof user.user_metadata?.full_name === "string" &&
        user.user_metadata.full_name.trim()) ||
      email.split("@")[0] ||
      "User";

    const { data: inserted, error: insertError } = await supabase
      .from("profiles")
      .insert({
        id: user.id,
        email,
        full_name: fullName,
        avatar_url: getAuthProviderAvatarUrl(user),
        role: "freelancer",
      })
      .select(PROFILE_SELECT)
      .single();

    if (!insertError && inserted) {
      row = inserted;
    }
  }

  if (row) {
    await syncProfileAvatarFromAuth(supabase, user);
    const { data: refreshed } = await supabase
      .from("profiles")
      .select(PROFILE_SELECT)
      .eq("id", user.id)
      .maybeSingle();
    if (refreshed) row = refreshed;
  }

  const email = row?.email ?? user.email ?? "";
  const name =
    (row?.full_name && row.full_name.trim()) ||
    (typeof user.user_metadata?.full_name === "string" &&
      user.user_metadata.full_name.trim()) ||
    email.split("@")[0] ||
    "User";

  const avatar =
    (typeof row?.avatar_url === "string" && row.avatar_url.trim()) ||
    getAuthProviderAvatarUrl(user) ||
    null;

  return {
    id: user.id,
    email,
    name,
    avatar,
    role: row?.role ?? "freelancer",
    phone: row?.phone ?? "",
    title: row?.title ?? "",
    location: row?.location ?? "",
    calendarLink: row?.calendar_link ?? "",
    notificationPreferences: mergeAllNotificationPreferences(row?.notification_preferences),
    onboardingCompletedAt: row?.onboarding_completed_at ?? null,
    freelancerSurveyCategory: row?.freelancer_survey_category ?? null,
    defaultBrandColor: getDisplayBrandColor(row?.default_brand_color),
  };
}
