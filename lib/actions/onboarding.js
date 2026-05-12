"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { notifyAdminOfNewFreelancer } from "@/lib/notifications/admin-signup-notify";

const SURVEY_CATEGORIES = new Set([
  "development_tech",
  "design_creative",
  "writing_content",
  "marketing_growth",
  "media_production",
]);

/**
 * Mark freelancer onboarding done and store survey category (step 3).
 */
export async function completeFreelancerOnboarding(category) {
  const supabase = await createClient();
  const {
    data: { user },
    error: authErr,
  } = await supabase.auth.getUser();

  if (authErr || !user) {
    return { ok: false, error: "Not signed in" };
  }

  const cat = typeof category === "string" ? category.trim() : "";
  if (!SURVEY_CATEGORIES.has(cat)) {
    return { ok: false, error: "Please choose a category" };
  }

  const { data: prof, error: readErr } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  if (readErr || prof?.role === "client") {
    return { ok: false, error: "Onboarding is not available for this account" };
  }

  const onboardedAt = new Date().toISOString();
  const { error } = await supabase
    .from("profiles")
    .update({
      freelancer_survey_category: cat,
      onboarding_completed_at: onboardedAt,
    })
    .eq("id", user.id);

  if (error) {
    return { ok: false, error: error.message };
  }

  revalidatePath("/onboarding");
  revalidatePath("/projects");
  revalidatePath("/settings");

  // Notify the team that a new freelancer just finished onboarding.
  // Best-effort — never block the response if Resend is unavailable.
  try {
    const { data: latest } = await supabase
      .from("profiles")
      .select("email, full_name, avatar_url, role, created_at")
      .eq("id", user.id)
      .maybeSingle();

    await notifyAdminOfNewFreelancer({
      userId: user.id,
      email: latest?.email || user.email || null,
      fullName: latest?.full_name || null,
      avatarUrl: latest?.avatar_url || null,
      role: latest?.role || "freelancer",
      surveyCategory: cat,
      createdAt: user.created_at || latest?.created_at || null,
      onboardedAt,
    });
  } catch (notifyErr) {
    console.warn(
      "[admin-signup-notify] failed:",
      notifyErr?.message || notifyErr,
    );
  }

  return { ok: true };
}
