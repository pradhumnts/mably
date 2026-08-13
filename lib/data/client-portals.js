import { createClient } from "@/lib/supabase/server";

const DEFAULT_PROJECT_LOGO = "/images/dummy-project-logo.webp";

function statusLabel(status) {
  if (status === "on_hold") return "On hold";
  if (status === "draft") return "Draft";
  if (status === "completed") return "Completed";
  return "Active";
}

function statusTone(status) {
  if (status === "active") return "active";
  if (status === "completed") return "completed";
  return "muted";
}

/**
 * Portals the signed-in user can access (RLS scopes the select).
 * Designed for the `/portal` chooser shown to client-role users.
 *
 * @returns {Promise<Array<{
 *   id: string;
 *   name: string;
 *   logo: string;
 *   status: string;
 *   statusTone: "active" | "completed" | "muted";
 *   freelancerName: string;
 *   freelancerAvatar: string | null;
 *   brandColor: string | null;
 * }>>}
 */
export async function listAccessibleClientPortals() {
  const supabase = await createClient();
  const {
    data: { user },
    error: authErr,
  } = await supabase.auth.getUser();
  if (authErr || !user) return [];

  const { data, error } = await supabase
    .from("projects")
    .select(
      "id, name, logo_url, status, brand_color, freelancer_display_name, freelancer_avatar_url, invite_email, created_at"
    )
    .order("created_at", { ascending: false });
  if (error) {
    console.error("listAccessibleClientPortals:", error.message);
    return [];
  }

  return (data ?? []).map((row) => {
    const logo =
      row.logo_url && String(row.logo_url).startsWith("http")
        ? row.logo_url
        : DEFAULT_PROJECT_LOGO;
    const freelancerName =
      (row.freelancer_display_name && String(row.freelancer_display_name).trim()) ||
      "Freelancer";
    return {
      id: row.id,
      name: row.name?.trim() || "Untitled project",
      logo,
      status: statusLabel(row.status),
      statusTone: statusTone(row.status),
      freelancerName,
      freelancerAvatar: row.freelancer_avatar_url || null,
      brandColor: row.brand_color || null,
    };
  });
}

/**
 * Convenience for the chooser header — name + email of the current viewer.
 */
export async function getCurrentPortalViewer() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, avatar_url, email")
    .eq("id", user.id)
    .maybeSingle();

  return {
    name:
      profile?.full_name?.trim() ||
      user.email?.split("@")[0] ||
      "there",
    email: profile?.email || user.email || "",
    avatar: profile?.avatar_url || null,
  };
}
