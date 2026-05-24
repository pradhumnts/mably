"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { mergeAllNotificationPreferences } from "@/lib/notifications/notification-preference-defaults";

/**
 * Record promotional / offer email opt-in (onboarding, portal tour, or Settings).
 *
 * @param {{ marketingEmails: boolean }} fields
 */
export async function saveMarketingEmailPreference(fields) {
  const supabase = await createClient();
  const {
    data: { user },
    error: authErr,
  } = await supabase.auth.getUser();

  if (authErr || !user) {
    return { ok: false, error: "Not signed in" };
  }

  const { data: profile, error: profileErr } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  if (profileErr) {
    return { ok: false, error: profileErr.message };
  }

  if (profile?.role === "client") {
    return { ok: false, error: "Promotional emails are only available for freelancer accounts" };
  }

  const marketingEmails = fields.marketingEmails === true;

  const { data: row, error: readErr } = await supabase
    .from("profiles")
    .select("notification_preferences")
    .eq("id", user.id)
    .maybeSingle();

  if (readErr) {
    return { ok: false, error: readErr.message };
  }

  const previous = mergeAllNotificationPreferences(row?.notification_preferences);
  const merged = mergeAllNotificationPreferences({
    ...previous,
    marketingEmails,
    marketingEmailConsentAt: new Date().toISOString(),
  });

  const { error } = await supabase
    .from("profiles")
    .update({ notification_preferences: merged })
    .eq("id", user.id);

  if (error) {
    return { ok: false, error: error.message };
  }

  revalidatePath("/settings");
  revalidatePath("/onboarding");
  revalidatePath("/project", "layout");
  return { ok: true };
}
