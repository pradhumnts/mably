"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

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

  const { error } = await supabase
    .from("profiles")
    .update({
      freelancer_survey_category: cat,
      onboarding_completed_at: new Date().toISOString(),
    })
    .eq("id", user.id);

  if (error) {
    return { ok: false, error: error.message };
  }

  revalidatePath("/onboarding");
  revalidatePath("/projects");
  revalidatePath("/settings");
  return { ok: true };
}
