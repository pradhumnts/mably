"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { PROJECT_ACTIVITY_EVENT_TYPES } from "@/lib/activity/project-activity-event-types";
import { recordProjectActivityEvent } from "@/lib/activity/record-project-activity-event";
import {
  getDemoProjectActions,
  isDemoProjectId,
  getDemoBlockedResponse,
} from "@/lib/data/demo-project";

function revalidateActions(projectId) {
  revalidatePath(`/project/${projectId}/actions`);
  revalidatePath(`/project/${projectId}/dashboard`);
}

/**
 * @param {import("@supabase/supabase-js").SupabaseClient} supabase
 * @param {{ id: string; email?: string | null }} user
 * @param {{
 *   projectId: string;
 *   eventType: string;
 *   actionId: string;
 *   title: string;
 * }} args
 */
async function recordSharedActionActivity(supabase, user, args) {
  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, avatar_url")
    .eq("id", user.id)
    .maybeSingle();

  const actorDisplayName =
    profile?.full_name?.trim() || user.email?.split("@")[0] || "Member";

  await recordProjectActivityEvent(supabase, {
    projectId: args.projectId,
    eventType: args.eventType,
    actorId: user.id,
    actorDisplayName,
    actorAvatarUrl: profile?.avatar_url ?? null,
    payload: {
      action_id: args.actionId,
      title: args.title,
    },
  });
}

/**
 * @param {unknown} value
 * @returns {string | null}
 */
function toDateString(value) {
  if (value == null || value === "") return null;
  if (value instanceof Date) {
    if (Number.isNaN(value.getTime())) return null;
    return value.toISOString().slice(0, 10);
  }
  if (typeof value === "string") {
    const t = value.trim().slice(0, 10);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(t)) return null;
    return t;
  }
  return null;
}

/**
 * @param {Record<string, unknown>} row
 */
function mapRow(row) {
  return {
    id: String(row.id),
    projectId: String(row.project_id),
    title: String(row.title ?? "").trim(),
    notes: typeof row.notes === "string" ? row.notes : "",
    owner: row.owner === "client" ? "client" : "freelancer",
    visibility: row.visibility === "shared" ? "shared" : "private",
    dueDate: row.due_date ? String(row.due_date).slice(0, 10) : null,
    status: row.status === "done" ? "done" : "open",
    completedAt: row.completed_at ? String(row.completed_at) : null,
    createdAt: row.created_at ? String(row.created_at) : null,
  };
}

/**
 * @param {import("@supabase/supabase-js").SupabaseClient} supabase
 * @param {string} projectId
 * @param {string} userId
 */
async function loadProjectAccess(supabase, projectId, userId) {
  const { data: project, error } = await supabase
    .from("projects")
    .select("id, freelancer_id")
    .eq("id", projectId)
    .maybeSingle();

  if (error || !project) {
    return { ok: false, error: error?.message || "Project not found" };
  }

  const isFreelancer = project.freelancer_id === userId;
  return { ok: true, isFreelancer };
}

/**
 * @param {string} projectId
 */
export async function listProjectActions(projectId) {
  const supabase = await createClient();
  const {
    data: { user },
    error: authErr,
  } = await supabase.auth.getUser();

  if (authErr || !user) {
    return { ok: false, error: "Not signed in", rows: [], isFreelancer: false };
  }

  const pid = typeof projectId === "string" ? projectId.trim() : "";
  if (!pid) {
    return { ok: false, error: "Missing project", rows: [], isFreelancer: false };
  }

  if (isDemoProjectId(pid)) {
    return { ok: true, rows: getDemoProjectActions(), isFreelancer: true };
  }

  const access = await loadProjectAccess(supabase, pid, user.id);
  if (!access.ok) {
    return { ok: false, error: access.error, rows: [], isFreelancer: false };
  }

  const { data, error } = await supabase
    .from("project_actions")
    .select(
      "id, project_id, title, notes, owner, visibility, due_date, status, completed_at, created_at"
    )
    .eq("project_id", pid)
    .order("created_at", { ascending: false });

  if (error) {
    return {
      ok: false,
      error: error.message,
      rows: [],
      isFreelancer: access.isFreelancer,
    };
  }

  return {
    ok: true,
    rows: (data ?? []).map(mapRow),
    isFreelancer: access.isFreelancer,
  };
}

/**
 * @param {string} projectId
 * @param {{
 *   title: string;
 *   owner?: "freelancer" | "client";
 *   dueDate?: Date | string | null;
 *   notes?: string | null;
 * }} input
 */
export async function createProjectAction(projectId, input) {
  const supabase = await createClient();
  const {
    data: { user },
    error: authErr,
  } = await supabase.auth.getUser();

  if (authErr || !user) {
    return { ok: false, error: "Not signed in" };
  }

  const pid = typeof projectId === "string" ? projectId.trim() : "";
  if (!pid) return { ok: false, error: "Missing project" };

  if (isDemoProjectId(pid)) {
    return getDemoBlockedResponse();
  }

  const access = await loadProjectAccess(supabase, pid, user.id);
  if (!access.ok) return { ok: false, error: access.error };
  if (!access.isFreelancer) {
    return { ok: false, error: "Only the project owner can add actions" };
  }

  const title = typeof input?.title === "string" ? input.title.trim() : "";
  if (!title) return { ok: false, error: "Title is required" };
  if (title.length > 200) return { ok: false, error: "Title is too long" };

  const owner = input?.owner === "client" ? "client" : "freelancer";
  const visibility = owner === "client" ? "shared" : "private";
  const dueDate = toDateString(input?.dueDate ?? null);
  const notes =
    typeof input?.notes === "string" ? input.notes.trim().slice(0, 8000) : "";

  const { data, error } = await supabase
    .from("project_actions")
    .insert({
      project_id: pid,
      title,
      notes: notes || null,
      owner,
      visibility,
      due_date: dueDate,
      status: "open",
      created_by: user.id,
    })
    .select(
      "id, project_id, title, notes, owner, visibility, due_date, status, completed_at, created_at"
    )
    .single();

  if (error) {
    return { ok: false, error: error.message };
  }

  if (visibility === "shared" && data?.id) {
    await recordSharedActionActivity(supabase, user, {
      projectId: pid,
      eventType: PROJECT_ACTIVITY_EVENT_TYPES.ACTION_CREATED,
      actionId: String(data.id),
      title,
    });
  }

  revalidateActions(pid);
  return { ok: true, row: mapRow(data) };
}

/**
 * @param {string} projectId
 * @param {string} actionId
 * @param {{ status: "open" | "done" }} input
 */
export async function setProjectActionStatus(projectId, actionId, input) {
  const supabase = await createClient();
  const {
    data: { user },
    error: authErr,
  } = await supabase.auth.getUser();

  if (authErr || !user) {
    return { ok: false, error: "Not signed in" };
  }

  const pid = typeof projectId === "string" ? projectId.trim() : "";
  const aid = typeof actionId === "string" ? actionId.trim() : "";
  if (!pid || !aid) return { ok: false, error: "Missing action" };

  if (isDemoProjectId(pid)) {
    return getDemoBlockedResponse();
  }

  const access = await loadProjectAccess(supabase, pid, user.id);
  if (!access.ok) return { ok: false, error: access.error };

  const nextStatus = input?.status === "done" ? "done" : "open";

  const { data: existing, error: loadErr } = await supabase
    .from("project_actions")
    .select("id, title, owner, visibility, status")
    .eq("id", aid)
    .eq("project_id", pid)
    .maybeSingle();

  if (loadErr || !existing) {
    return { ok: false, error: loadErr?.message || "Action not found" };
  }

  if (!access.isFreelancer) {
    if (existing.visibility !== "shared" || existing.owner !== "client") {
      return { ok: false, error: "You can only update actions assigned to you" };
    }
  }

  const prevStatus = existing.status === "done" ? "done" : "open";
  const patch =
    nextStatus === "done"
      ? {
          status: "done",
          completed_at: new Date().toISOString(),
          completed_by: user.id,
        }
      : {
          status: "open",
          completed_at: null,
          completed_by: null,
        };

  const { data, error } = await supabase
    .from("project_actions")
    .update(patch)
    .eq("id", aid)
    .eq("project_id", pid)
    .select(
      "id, project_id, title, notes, owner, visibility, due_date, status, completed_at, created_at"
    )
    .single();

  if (error) {
    return { ok: false, error: error.message };
  }

  if (
    existing.visibility === "shared" &&
    prevStatus === "open" &&
    nextStatus === "done" &&
    data?.id
  ) {
    await recordSharedActionActivity(supabase, user, {
      projectId: pid,
      eventType: PROJECT_ACTIVITY_EVENT_TYPES.ACTION_COMPLETED,
      actionId: String(data.id),
      title: String(data.title || existing.title || "Action").trim() || "Action",
    });
  }

  revalidateActions(pid);
  return { ok: true, row: mapRow(data) };
}

/**
 * @param {string} projectId
 * @param {string} actionId
 * @param {{
 *   title: string;
 *   owner?: "freelancer" | "client";
 *   dueDate?: Date | string | null;
 *   notes?: string | null;
 * }} input
 */
export async function updateProjectAction(projectId, actionId, input) {
  const supabase = await createClient();
  const {
    data: { user },
    error: authErr,
  } = await supabase.auth.getUser();

  if (authErr || !user) {
    return { ok: false, error: "Not signed in" };
  }

  const pid = typeof projectId === "string" ? projectId.trim() : "";
  const aid = typeof actionId === "string" ? actionId.trim() : "";
  if (!pid || !aid) return { ok: false, error: "Missing action" };

  if (isDemoProjectId(pid)) {
    return getDemoBlockedResponse();
  }

  const access = await loadProjectAccess(supabase, pid, user.id);
  if (!access.ok) return { ok: false, error: access.error };
  if (!access.isFreelancer) {
    return { ok: false, error: "Only the project owner can edit actions" };
  }

  const title = typeof input?.title === "string" ? input.title.trim() : "";
  if (!title) return { ok: false, error: "Title is required" };
  if (title.length > 200) return { ok: false, error: "Title is too long" };

  const owner = input?.owner === "client" ? "client" : "freelancer";
  const visibility = owner === "client" ? "shared" : "private";
  const dueDate = toDateString(input?.dueDate ?? null);
  const notes =
    typeof input?.notes === "string" ? input.notes.trim().slice(0, 8000) : "";

  const { data: existing, error: loadErr } = await supabase
    .from("project_actions")
    .select("id, visibility")
    .eq("id", aid)
    .eq("project_id", pid)
    .maybeSingle();

  if (loadErr || !existing) {
    return { ok: false, error: loadErr?.message || "Action not found" };
  }

  const wasShared = existing.visibility === "shared";

  const { data, error } = await supabase
    .from("project_actions")
    .update({
      title,
      notes: notes || null,
      owner,
      visibility,
      due_date: dueDate,
    })
    .eq("id", aid)
    .eq("project_id", pid)
    .select(
      "id, project_id, title, notes, owner, visibility, due_date, status, completed_at, created_at"
    )
    .single();

  if (error) {
    return { ok: false, error: error.message };
  }

  if (!wasShared && visibility === "shared" && data?.id) {
    await recordSharedActionActivity(supabase, user, {
      projectId: pid,
      eventType: PROJECT_ACTIVITY_EVENT_TYPES.ACTION_CREATED,
      actionId: String(data.id),
      title,
    });
  }

  revalidateActions(pid);
  return { ok: true, row: mapRow(data) };
}

/**
 * @param {string} projectId
 * @param {string} actionId
 */
export async function deleteProjectAction(projectId, actionId) {
  const supabase = await createClient();
  const {
    data: { user },
    error: authErr,
  } = await supabase.auth.getUser();

  if (authErr || !user) {
    return { ok: false, error: "Not signed in" };
  }

  const pid = typeof projectId === "string" ? projectId.trim() : "";
  const aid = typeof actionId === "string" ? actionId.trim() : "";
  if (!pid || !aid) return { ok: false, error: "Missing action" };

  if (isDemoProjectId(pid)) {
    return getDemoBlockedResponse();
  }

  const access = await loadProjectAccess(supabase, pid, user.id);
  if (!access.ok) return { ok: false, error: access.error };
  if (!access.isFreelancer) {
    return { ok: false, error: "Only the project owner can delete actions" };
  }

  const { error } = await supabase
    .from("project_actions")
    .delete()
    .eq("id", aid)
    .eq("project_id", pid);

  if (error) {
    return { ok: false, error: error.message };
  }

  revalidateActions(pid);
  return { ok: true };
}
