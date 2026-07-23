"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { uploadProfileAvatar } from "@/lib/actions/profile";
import { revalidateProjectSurfaces } from "@/lib/revalidate-project-surfaces";
import { mergeAllNotificationPreferences } from "@/lib/notifications/notification-preference-defaults";
import {
  isDemoProjectId,
  getDemoPortalProjectSettings,
  getDemoBlockedResponse,
  resolveDemoFreelancerFromSupabase,
} from "@/lib/data/demo-project";

/**
 * Mirror the signed-in user's profile into `projects.client_*_snapshot` for every portal
 * project where they act as the client (so sidebar, chat, etc. stay in sync).
 */
async function syncClientSnapshotsToProjectsAndRevalidate(supabase, projectIdHint) {
  const { data, error } = await supabase.rpc("sync_portal_client_identity_snapshots");
  if (error) {
    return { ok: false, error: error.message };
  }
  const fromRpc = Array.isArray(data) ? data.filter(Boolean) : [];
  const ids = new Set(fromRpc.map((id) => String(id)));
  const hint = typeof projectIdHint === "string" ? projectIdHint.trim() : "";
  if (hint) ids.add(hint);
  for (const id of ids) {
    revalidateProjectSurfaces(id);
  }
  revalidatePath("/settings");
  return { ok: true };
}

function statusForUi(dbStatus) {
  const s = typeof dbStatus === "string" ? dbStatus : "active";
  if (s === "on_hold") return "on-hold";
  return s;
}

/**
 * @param {string} projectId
 */
export async function getPortalProjectSettings(projectId) {
  const pid = typeof projectId === "string" ? projectId.trim() : "";
  if (!pid) {
    return { ok: false, error: "Missing project" };
  }

  if (isDemoProjectId(pid)) {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    const fl = await resolveDemoFreelancerFromSupabase(supabase, user);
    let profile = null;
    if (user) {
      const { data } = await supabase
        .from("profiles")
        .select("phone")
        .eq("id", user.id)
        .maybeSingle();
      profile = data;
    }
    return getDemoPortalProjectSettings(fl, profile);
  }

  const supabase = await createClient();
  const {
    data: { user },
    error: authErr,
  } = await supabase.auth.getUser();

  if (authErr || !user) {
    return { ok: false, error: "Not signed in" };
  }

  const { data: project, error: pErr } = await supabase
    .from("projects")
    .select(
      "id, name, description, start_date, end_date, status, logo_url, brand_color, freelancer_id, client_name_snapshot"
    )
    .eq("id", pid)
    .maybeSingle();

  if (pErr || !project) {
    return { ok: false, error: pErr?.message || "Project not found" };
  }

  const isFreelancer = project.freelancer_id === user.id;

  const { data: profile, error: profErr } = await supabase
    .from("profiles")
    .select("full_name, email, phone, avatar_url, notification_preferences")
    .eq("id", user.id)
    .maybeSingle();

  if (profErr) {
    return { ok: false, error: profErr.message };
  }

  return {
    ok: true,
    role: isFreelancer ? "freelancer" : "client",
    project: {
      id: project.id,
      name: project.name ?? "",
      description: project.description ?? "",
      startDate: project.start_date ?? null,
      endDate: project.end_date ?? null,
      status: statusForUi(project.status),
      logoUrl: project.logo_url ?? null,
      brandColor: project.brand_color ?? null,
      clientNameSnapshot: project.client_name_snapshot ?? "",
    },
    profile: {
      fullName: profile?.full_name ?? "",
      email: profile?.email ?? user.email ?? "",
      phone: profile?.phone ?? "",
      avatarUrl: profile?.avatar_url ?? null,
    },
    notifications: mergeAllNotificationPreferences(profile?.notification_preferences),
  };
}

/**
 * @param {string} projectId
 * @param {object} prefs — same shape as DEFAULT_NOTIFICATIONS
 */
export async function savePortalNotificationPreferences(projectId, prefs) {
  const supabase = await createClient();
  const {
    data: { user },
    error: authErr,
  } = await supabase.auth.getUser();

  if (authErr || !user) {
    return { ok: false, error: "Not signed in" };
  }

  if (isDemoProjectId(typeof projectId === "string" ? projectId.trim() : "")) {
    return getDemoBlockedResponse();
  }

  const { data: existingRow, error: readErr } = await supabase
    .from("profiles")
    .select("notification_preferences")
    .eq("id", user.id)
    .maybeSingle();

  if (readErr) {
    return { ok: false, error: readErr.message };
  }

  const previous = mergeAllNotificationPreferences(existingRow?.notification_preferences);
  const merged = mergeAllNotificationPreferences({
    ...previous,
    ...prefs,
    activityNotifications: {
      ...previous.activityNotifications,
      ...(typeof prefs.activityNotifications === "object" && prefs.activityNotifications
        ? prefs.activityNotifications
        : {}),
    },
  });

  const { error } = await supabase
    .from("profiles")
    .update({ notification_preferences: merged })
    .eq("id", user.id);

  if (error) {
    return { ok: false, error: error.message };
  }

  const pid = typeof projectId === "string" ? projectId.trim() : "";
  if (pid) {
    revalidatePath(`/project/${pid}/settings`);
  }
  revalidatePath("/settings");
  return { ok: true };
}

/**
 * @param {string} projectId
 * @param {{ fullName?: string; phone?: string }} fields
 */
export async function savePortalClientContact(projectId, fields) {
  const supabase = await createClient();
  const {
    data: { user },
    error: authErr,
  } = await supabase.auth.getUser();

  if (authErr || !user) {
    return { ok: false, error: "Not signed in" };
  }

  if (isDemoProjectId(typeof projectId === "string" ? projectId.trim() : "")) {
    return getDemoBlockedResponse();
  }

  const full_name = typeof fields.fullName === "string" ? fields.fullName.trim() || null : null;
  const phone = typeof fields.phone === "string" ? fields.phone.trim() || null : null;

  const { error } = await supabase
    .from("profiles")
    .update({ full_name, phone, email: user.email ?? null })
    .eq("id", user.id);

  if (error) {
    return { ok: false, error: error.message };
  }

  const pid = typeof projectId === "string" ? projectId.trim() : "";
  const sync = await syncClientSnapshotsToProjectsAndRevalidate(supabase, pid || undefined);
  if (!sync.ok) {
    console.error("sync_portal_client_identity_snapshots failed:", sync.error);
  }
  if (pid) {
    revalidatePath(`/project/${pid}/settings`);
  }
  return { ok: true };
}

/**
 * @param {string} projectId
 * @param {FormData} formData
 */
export async function uploadPortalClientAvatar(projectId, formData) {
  const supabase = await createClient();
  const pidEarly = typeof projectId === "string" ? projectId.trim() : "";
  if (isDemoProjectId(pidEarly)) {
    return getDemoBlockedResponse({ publicUrl: null });
  }
  const res = await uploadProfileAvatar(formData);
  const pid = pidEarly;
  if (res.ok && pid) {
    const sync = await syncClientSnapshotsToProjectsAndRevalidate(supabase, pid);
    if (!sync.ok) {
      console.error("sync_portal_client_identity_snapshots failed:", sync.error);
    }
    revalidatePath(`/project/${pid}/settings`);
  }
  return res;
}
