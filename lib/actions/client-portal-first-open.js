"use server";

import { createClient } from "@/lib/supabase/server";
import { notifyFreelancerClientOpenedPortal } from "@/lib/notifications/freelancer-dashboard-notify";

async function projectDisplayName(supabase, projectId) {
  const { data } = await supabase
    .from("projects")
    .select("name")
    .eq("id", projectId)
    .maybeSingle();
  return (data?.name ?? "").trim() || "Project";
}

/**
 * Idempotent: first time this signed-in client hits the portal shell, may email the freelancer.
 */
export async function recordClientPortalFirstOpen(projectId) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    const pid = typeof projectId === "string" ? projectId.trim() : "";
    if (!pid) return;

    const { data: isFirst, error } = await supabase.rpc("register_client_portal_first_open", {
      p_project_id: pid,
    });

    if (error) {
      if (process.env.NODE_ENV === "development") {
        console.warn("[notifications] register_client_portal_first_open:", error.message);
      }
      return;
    }

    if (!isFirst) return;

    const { data: prof } = await supabase
      .from("profiles")
      .select("full_name, avatar_url")
      .eq("id", user.id)
      .maybeSingle();

    const clientName =
      (prof?.full_name && String(prof.full_name).trim()) ||
      (user.email ?? "").split("@")[0] ||
      "Your client";

    const projectName = await projectDisplayName(supabase, pid);

    await notifyFreelancerClientOpenedPortal({
      projectId: pid,
      projectName,
      clientUserId: user.id,
      clientName,
      clientAvatarUrl: prof?.avatar_url ?? null,
    });
  } catch (e) {
    console.error("[notifications] recordClientPortalFirstOpen:", e);
  }
}
