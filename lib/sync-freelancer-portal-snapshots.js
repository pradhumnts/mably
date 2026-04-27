import { revalidateProjectSurfaces } from "@/lib/revalidate-project-surfaces";

/**
 * Copy the signed-in freelancer's profile into all owned `projects` rows so
 * portal clients (who cannot SELECT the freelancer's profile via RLS) see
 * current name, avatar, and calendar link on dashboard / chat headers.
 *
 * @param {import("@supabase/supabase-js").SupabaseClient} supabase
 * @param {{ id: string; email?: string | null }} user
 */
export async function syncFreelancerIdentityToProjectSnapshots(supabase, user) {
  if (!user?.id) {
    return { ok: false, error: "Missing user" };
  }

  const { data: profileRow, error: profErr } = await supabase
    .from("profiles")
    .select("full_name, avatar_url, calendar_link")
    .eq("id", user.id)
    .maybeSingle();

  if (profErr) {
    console.error("sync freelancer portal snapshots (profile read):", profErr.message);
    return { ok: false, error: profErr.message };
  }

  const freelancerDisplay =
    profileRow?.full_name?.trim() ||
    (typeof user.email === "string" ? user.email.split("@")[0] : null) ||
    "Freelancer";

  const { data: rows, error: upErr } = await supabase
    .from("projects")
    .update({
      freelancer_display_name: freelancerDisplay,
      freelancer_avatar_url: profileRow?.avatar_url ?? null,
      freelancer_calendar_link: profileRow?.calendar_link?.trim() || null,
    })
    .eq("freelancer_id", user.id)
    .select("id");

  if (upErr) {
    console.error("sync freelancer portal snapshots (projects update):", upErr.message);
    return { ok: false, error: upErr.message };
  }

  for (const row of rows ?? []) {
    if (row?.id) {
      revalidateProjectSurfaces(row.id);
    }
  }

  return { ok: true };
}
