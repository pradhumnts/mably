"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import {
  fetchFreelancerSubscriptionRowForBilling,
  getLibraryStorageCaps,
  sumFreelancerLibraryStorageBytes,
} from "@/lib/billing/library-storage";
import { PROJECT_ACTIVITY_EVENT_TYPES } from "@/lib/activity/project-activity-event-types";
import { recordProjectActivityEvent } from "@/lib/activity/record-project-activity-event";
import {
  notifyPortalLibraryFileApprovalChanged,
  notifyPortalLibraryFileComment,
  notifyPortalLibraryLinkAdded,
} from "@/lib/notifications/trigger-portal-email";
import { performLibraryFileUpload } from "@/lib/library/perform-library-file-upload";

const BUCKET = "project-library";

function revalidateLibrary(projectId) {
  revalidatePath(`/project/${projectId}/library/files`);
  revalidatePath(`/project/${projectId}/library/links`);
}

function normalizeExternalUrl(raw) {
  const t = typeof raw === "string" ? raw.trim() : "";
  if (!t) return "";
  if (/^https?:\/\//i.test(t)) return t;
  return `https://${t}`;
}

/**
 * Upload library file (server action). The upload dialog uses `POST /api/project-library/upload`
 * for byte-level progress; this remains for programmatic use.
 *
 * FormData fields: projectId, file, displayName, description (optional), needsApproval ("1" | "0")
 */
export async function uploadLibraryFile(formData) {
  const supabase = await createClient();
  return performLibraryFileUpload(supabase, formData);
}

/**
 * @param {string} projectId
 */
export async function listLibraryFiles(projectId) {
  const supabase = await createClient();
  const {
    data: { user },
    error: authErr,
  } = await supabase.auth.getUser();
  if (authErr || !user) return { ok: false, error: "Not signed in", items: [] };

  const pid = typeof projectId === "string" ? projectId.trim() : "";
  if (!pid) return { ok: false, error: "Missing project", items: [] };

  const { data, error } = await supabase
    .from("project_library_files")
    .select(
      "id, display_name, original_filename, mime_type, size_bytes, description, needs_approval, approval_status, created_by_display_name, created_by_avatar_url, created_at"
    )
    .eq("project_id", pid)
    .order("created_at", { ascending: false });

  if (error) return { ok: false, error: error.message, items: [] };
  return { ok: true, items: data ?? [] };
}

/**
 * @param {string} projectId
 */
export async function listLibraryLinks(projectId) {
  const supabase = await createClient();
  const {
    data: { user },
    error: authErr,
  } = await supabase.auth.getUser();
  if (authErr || !user) return { ok: false, error: "Not signed in", items: [] };

  const pid = typeof projectId === "string" ? projectId.trim() : "";
  if (!pid) return { ok: false, error: "Missing project", items: [] };

  const { data, error } = await supabase
    .from("project_library_links")
    .select(
      "id, title, url, description, needs_approval, created_by_display_name, created_by_avatar_url, created_at"
    )
    .eq("project_id", pid)
    .order("created_at", { ascending: false });

  if (error) return { ok: false, error: error.message, items: [] };
  return { ok: true, items: data ?? [] };
}

/**
 * @param {string} projectId
 * @param {{ title: string; url: string; description?: string; needsApproval?: boolean }} form
 */
export async function addLibraryLink(projectId, form) {
  const supabase = await createClient();
  const {
    data: { user },
    error: authErr,
  } = await supabase.auth.getUser();
  if (authErr || !user) return { ok: false, error: "Not signed in" };

  const pid = typeof projectId === "string" ? projectId.trim() : "";
  const title = typeof form?.title === "string" ? form.title.trim() : "";
  const url = normalizeExternalUrl(form?.url || "");
  if (!pid || !title || !url) {
    return { ok: false, error: "Title and a valid URL are required" };
  }

  const { data: projectRow, error: projectErr } = await supabase
    .from("projects")
    .select("freelancer_id")
    .eq("id", pid)
    .maybeSingle();

  if (projectErr || !projectRow) {
    return { ok: false, error: "Project not found or you cannot access it" };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, avatar_url")
    .eq("id", user.id)
    .maybeSingle();

  const createdByDisplayName =
    profile?.full_name?.trim() || user.email?.split("@")[0] || "Member";

  const { data: insertedLink, error } = await supabase
    .from("project_library_links")
    .insert({
      project_id: pid,
      title,
      url,
      description: typeof form.description === "string" ? form.description.trim() || null : null,
      needs_approval: false,
      created_by: user.id,
      created_by_display_name: createdByDisplayName,
      created_by_avatar_url: profile?.avatar_url || null,
    })
    .select("id")
    .single();

  if (error) return { ok: false, error: error.message || "Could not add link" };

  await recordProjectActivityEvent(supabase, {
    projectId: pid,
    eventType: PROJECT_ACTIVITY_EVENT_TYPES.LIBRARY_LINK_CREATED,
    actorId: user.id,
    actorDisplayName: createdByDisplayName,
    actorAvatarUrl: profile?.avatar_url ?? null,
    payload: {
      title,
      ...(insertedLink?.id ? { link_id: insertedLink.id } : {}),
      url,
    },
  });

  void notifyPortalLibraryLinkAdded({
    projectId: pid,
    projectFreelancerId: projectRow.freelancer_id,
    actorUserId: user.id,
    actorName: createdByDisplayName,
    actorAvatarUrl: profile?.avatar_url ?? null,
    title,
  });

  revalidateLibrary(pid);
  return { ok: true };
}

/**
 * @param {string} projectId
 * @param {string} linkId
 */
export async function deleteLibraryLink(projectId, linkId) {
  const supabase = await createClient();
  const {
    data: { user },
    error: authErr,
  } = await supabase.auth.getUser();
  if (authErr || !user) return { ok: false, error: "Not signed in" };

  const pid = typeof projectId === "string" ? projectId.trim() : "";
  const lid = typeof linkId === "string" ? linkId.trim() : "";
  if (!pid || !lid) return { ok: false, error: "Missing id" };

  const { error } = await supabase.from("project_library_links").delete().eq("id", lid).eq("project_id", pid);
  if (error) return { ok: false, error: error.message || "Could not delete link" };
  revalidateLibrary(pid);
  return { ok: true };
}

/**
 * @param {string} projectId
 * @param {string} fileId
 */
export async function deleteLibraryFile(projectId, fileId) {
  const supabase = await createClient();
  const {
    data: { user },
    error: authErr,
  } = await supabase.auth.getUser();
  if (authErr || !user) return { ok: false, error: "Not signed in" };

  const pid = typeof projectId === "string" ? projectId.trim() : "";
  const fid = typeof fileId === "string" ? fileId.trim() : "";
  if (!pid || !fid) return { ok: false, error: "Missing id" };

  const { data: row, error: fetchErr } = await supabase
    .from("project_library_files")
    .select("storage_object_path")
    .eq("id", fid)
    .eq("project_id", pid)
    .maybeSingle();

  if (fetchErr || !row?.storage_object_path) {
    return { ok: false, error: fetchErr?.message || "File not found" };
  }

  const { error: rmErr } = await supabase.storage.from(BUCKET).remove([row.storage_object_path]);
  if (rmErr) return { ok: false, error: rmErr.message || "Could not remove file from storage" };

  const { error: delErr } = await supabase.from("project_library_files").delete().eq("id", fid).eq("project_id", pid);
  if (delErr) return { ok: false, error: delErr.message || "Could not delete file record" };

  revalidateLibrary(pid);
  return { ok: true };
}

/**
 * @param {string} projectId
 * @param {string} fileId
 */
export async function getLibraryFileDownloadUrl(projectId, fileId) {
  const supabase = await createClient();
  const {
    data: { user },
    error: authErr,
  } = await supabase.auth.getUser();
  if (authErr || !user) return { ok: false, error: "Not signed in" };

  const pid = typeof projectId === "string" ? projectId.trim() : "";
  const fid = typeof fileId === "string" ? fileId.trim() : "";
  if (!pid || !fid) return { ok: false, error: "Missing id" };

  const { data: row, error: fetchErr } = await supabase
    .from("project_library_files")
    .select("storage_object_path")
    .eq("id", fid)
    .eq("project_id", pid)
    .maybeSingle();

  if (fetchErr || !row?.storage_object_path) {
    return { ok: false, error: fetchErr?.message || "File not found" };
  }

  const { data, error } = await supabase.storage
    .from(BUCKET)
    .createSignedUrl(row.storage_object_path, 3600);

  if (error || !data?.signedUrl) {
    return { ok: false, error: error?.message || "Could not create download link" };
  }
  return { ok: true, url: data.signedUrl };
}

/**
 * @param {string} projectId
 * @param {string} fileId
 */
export async function listLibraryFileComments(projectId, fileId) {
  const supabase = await createClient();
  const {
    data: { user },
    error: authErr,
  } = await supabase.auth.getUser();
  if (authErr || !user) return { ok: false, error: "Not signed in", items: [] };

  const pid = typeof projectId === "string" ? projectId.trim() : "";
  const fid = typeof fileId === "string" ? fileId.trim() : "";
  if (!pid || !fid) return { ok: false, error: "Missing id", items: [] };

  const { data, error } = await supabase
    .from("project_library_file_comments")
    .select(
      "id, body, author_id, author_display_name, author_avatar_url, created_at"
    )
    .eq("project_id", pid)
    .eq("file_id", fid)
    .order("created_at", { ascending: true });

  if (error) return { ok: false, error: error.message, items: [] };
  return { ok: true, items: data ?? [] };
}

/**
 * @param {string} projectId
 * @param {string} fileId
 * @param {string} body
 */
export async function addLibraryFileComment(projectId, fileId, body) {
  const supabase = await createClient();
  const {
    data: { user },
    error: authErr,
  } = await supabase.auth.getUser();
  if (authErr || !user) return { ok: false, error: "Not signed in" };

  const pid = typeof projectId === "string" ? projectId.trim() : "";
  const fid = typeof fileId === "string" ? fileId.trim() : "";
  const text = typeof body === "string" ? body.trim() : "";
  if (!pid || !fid || !text) {
    return { ok: false, error: "Comment text is required" };
  }

  const { data: fileRow, error: fileErr } = await supabase
    .from("project_library_files")
    .select("id, display_name")
    .eq("id", fid)
    .eq("project_id", pid)
    .maybeSingle();

  if (fileErr || !fileRow) {
    return { ok: false, error: "File not found or you cannot access it" };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, avatar_url")
    .eq("id", user.id)
    .maybeSingle();

  const authorDisplayName =
    profile?.full_name?.trim() || user.email?.split("@")[0] || "Member";

  const { data: inserted, error } = await supabase
    .from("project_library_file_comments")
    .insert({
      project_id: pid,
      file_id: fid,
      author_id: user.id,
      author_display_name: authorDisplayName,
      author_avatar_url: profile?.avatar_url || null,
      body: text,
    })
    .select("id, body, author_id, author_display_name, author_avatar_url, created_at")
    .single();

  if (error) return { ok: false, error: error.message || "Could not post comment" };

  await recordProjectActivityEvent(supabase, {
    projectId: pid,
    eventType: PROJECT_ACTIVITY_EVENT_TYPES.LIBRARY_FILE_COMMENT,
    actorId: user.id,
    actorDisplayName: authorDisplayName,
    actorAvatarUrl: profile?.avatar_url ?? null,
    payload: {
      file_id: fid,
      file_display_name: fileRow.display_name,
      body: text,
    },
  });

  const { data: proj } = await supabase
    .from("projects")
    .select("freelancer_id")
    .eq("id", pid)
    .maybeSingle();

  if (proj?.freelancer_id) {
    void notifyPortalLibraryFileComment({
      projectId: pid,
      projectFreelancerId: proj.freelancer_id,
      actorUserId: user.id,
      actorName: authorDisplayName,
      actorAvatarUrl: profile?.avatar_url ?? null,
      fileDisplayName: fileRow.display_name,
      preview: text,
    });
  }

  // Do not revalidate library routes here — it remounts the portal page and closes the discussion dialog.
  return { ok: true, comment: inserted };
}

/**
 * @param {string} projectId
 * @param {string} fileId
 * @param {"pending" | "approved" | "revision_requested"} status
 */
export async function setLibraryFileApprovalStatus(projectId, fileId, status) {
  const supabase = await createClient();
  const {
    data: { user },
    error: authErr,
  } = await supabase.auth.getUser();
  if (authErr || !user) return { ok: false, error: "Not signed in" };

  const pid = typeof projectId === "string" ? projectId.trim() : "";
  const fid = typeof fileId === "string" ? fileId.trim() : "";
  const allowed = ["pending", "approved", "revision_requested"];
  if (!pid || !fid || !allowed.includes(status)) {
    return { ok: false, error: "Invalid request" };
  }

  const { data: fileMeta, error: metaErr } = await supabase
    .from("project_library_files")
    .select("display_name")
    .eq("id", fid)
    .eq("project_id", pid)
    .maybeSingle();

  if (metaErr || !fileMeta) {
    return { ok: false, error: metaErr?.message || "File not found" };
  }

  const { error } = await supabase.rpc("set_library_file_approval_status", {
    p_file_id: fid,
    p_status: status,
  });

  if (error) return { ok: false, error: error.message || "Could not update status" };

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, avatar_url")
    .eq("id", user.id)
    .maybeSingle();

  const actorDisplayName =
    profile?.full_name?.trim() || user.email?.split("@")[0] || "Member";

  await recordProjectActivityEvent(supabase, {
    projectId: pid,
    eventType: PROJECT_ACTIVITY_EVENT_TYPES.LIBRARY_FILE_APPROVAL_CHANGED,
    actorId: user.id,
    actorDisplayName,
    actorAvatarUrl: profile?.avatar_url ?? null,
    payload: {
      file_id: fid,
      file_display_name: fileMeta.display_name,
      approval_status: status,
    },
  });

  const { data: projApproval } = await supabase
    .from("projects")
    .select("freelancer_id")
    .eq("id", pid)
    .maybeSingle();

  const statusLabel =
    status === "approved"
      ? "Approved"
      : status === "revision_requested"
        ? "Revision requested"
        : "Pending review";

  if (projApproval?.freelancer_id) {
    void notifyPortalLibraryFileApprovalChanged({
      projectId: pid,
      projectFreelancerId: projApproval.freelancer_id,
      actorUserId: user.id,
      actorName: actorDisplayName,
      actorAvatarUrl: profile?.avatar_url ?? null,
      fileDisplayName: fileMeta.display_name,
      statusLabel,
    });
  }

  revalidateLibrary(pid);
  return { ok: true };
}

/**
 * Total library file bytes for the project owner's account (all projects), with plan caps.
 * Non-owners receive `{ ok: true, hidden: true }` so the client can skip the usage UI.
 *
 * @param {string} projectId
 */
export async function getLibraryStorageUsageForProject(projectId) {
  const supabase = await createClient();
  const {
    data: { user },
    error: authErr,
  } = await supabase.auth.getUser();
  if (authErr || !user) return { ok: false, error: "Not signed in" };

  const pid = typeof projectId === "string" ? projectId.trim() : "";
  if (!pid) return { ok: false, error: "Missing project" };

  const { data: projectRow, error: projectErr } = await supabase
    .from("projects")
    .select("freelancer_id")
    .eq("id", pid)
    .maybeSingle();

  if (projectErr || !projectRow?.freelancer_id) {
    return { ok: false, error: "Project not found or you cannot access it" };
  }

  const subscriptionRow = await fetchFreelancerSubscriptionRowForBilling(projectRow.freelancer_id);
  if (!subscriptionRow) {
    return { ok: false, error: "Could not load subscription for library storage." };
  }

  const caps = getLibraryStorageCaps(subscriptionRow);

  if (projectRow.freelancer_id !== user.id) {
    return {
      ok: true,
      hidden: true,
      usedBytes: 0,
      totalBytes: caps.totalBytes,
      maxFileBytes: caps.maxFileBytes,
      maxFileLabel: caps.maxFileLabel,
      planKey: caps.planKey,
      paid: caps.paid,
      percentUsed: 0,
    };
  }

  const usedRes = await sumFreelancerLibraryStorageBytes(projectRow.freelancer_id, user.id);
  if (!usedRes.ok) {
    return { ok: false, error: usedRes.error };
  }

  const pct =
    caps.totalBytes > 0 ? Math.min(100, Math.round((usedRes.bytes / caps.totalBytes) * 1000) / 10) : 0;

  return {
    ok: true,
    hidden: false,
    usedBytes: usedRes.bytes,
    totalBytes: caps.totalBytes,
    maxFileBytes: caps.maxFileBytes,
    maxFileLabel: caps.maxFileLabel,
    planKey: caps.planKey,
    paid: caps.paid,
    percentUsed: pct,
  };
}
