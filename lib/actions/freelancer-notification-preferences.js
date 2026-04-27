"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { mergeAllNotificationPreferences } from "@/lib/notifications/notification-preference-defaults";

/**
 * Persist freelancer dashboard toggles (Settings → Notifications) without overwriting portal prefs.
 *
 * @param {{
 *   clientOpenedPortal?: boolean;
 *   projectCreated?: boolean;
 *   paymentReceived?: boolean;
 *   invoiceOverdue?: boolean;
 * }} prefs
 */
export async function saveFreelancerDashboardNotificationPreferences(prefs) {
  const supabase = await createClient();
  const {
    data: { user },
    error: authErr,
  } = await supabase.auth.getUser();

  if (authErr || !user) {
    return { ok: false, error: "Not signed in" };
  }

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
    ...(typeof prefs.clientOpenedPortal === "boolean"
      ? { clientOpenedPortal: prefs.clientOpenedPortal }
      : {}),
    ...(typeof prefs.projectCreated === "boolean" ? { projectCreated: prefs.projectCreated } : {}),
    ...(typeof prefs.paymentReceived === "boolean" ? { paymentReceived: prefs.paymentReceived } : {}),
    ...(typeof prefs.invoiceOverdue === "boolean" ? { invoiceOverdue: prefs.invoiceOverdue } : {}),
  });

  const { error } = await supabase
    .from("profiles")
    .update({ notification_preferences: merged })
    .eq("id", user.id);

  if (error) {
    return { ok: false, error: error.message };
  }

  revalidatePath("/settings");
  return { ok: true };
}
