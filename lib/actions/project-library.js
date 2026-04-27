"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import {
  LIBRARY_MAX_UPLOAD_BYTES,
  LIBRARY_MAX_UPLOAD_LABEL,
} from "@/lib/constants/library-upload";
import { PROJECT_ACTIVITY_EVENT_TYPES } from "@/lib/activity/project-activity-event-types";
import { recordProjectActivityEvent } from "@/lib/activity/record-project-activity-event";
import {
  notifyPortalLibraryFileApprovalChanged,
  notifyPortalLibraryFileComment,
  notifyPortalLibraryFileUploaded,
  notifyPortalLibraryLinkAdded,
} from "@/lib/notifications/trigger-portal-email";

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

function sanitizeOriginalFilename(name) {
  const base = typeof name === "string" ? name : "";
  const cleaned = base.replace(/[/\\]+/g, "_").replace(/[^\w.\-() \u00C0-\u024F]+/gi, "_").trim();
  const out = cleaned || "file";
  return out.length > 200 ? out.slice(0, 200) : out;
}

/**
 * Upload library file bytes to Storage and insert metadata in one step (server-only).
 * Browser-side Storage uploads often lack `auth.uid()` when the session lives in httpOnly cookies.
 *
 * FormData fields: projectId, file, displayName, description (optional), needsApproval ("1" | "0")
 */
export async function uploadLibraryFile(formData) {
  const supabase = await createClient();
  const {
    data: { user },
    error: authErr,
  } = await supabase.auth.getUser();
  if (authErr || !user) return { ok: false, error: "Not signed in" };

  const projectId = String(formData.get("projectId") ?? "").trim();
  const displayName = String(formData.get("displayName") ?? "").trim();
  const descriptionRaw = formData.get("description");
  const description =
    typeof descriptionRaw === "string" && descriptionRaw.trim() ? descriptionRaw.trim() : null;
  const needsApproval = formData.get("needsApproval") === "1";
  const file = formData.get("file");

  if (!projectId || !displayName) {
    return { ok: false, error: "Project and display name are required" };
  }

  const { data: projectRow, error: projectErr } = await supabase
    .from("projects")
    .select("id, freelancer_id")
    .eq("id", projectId)
    .maybeSingle();

  if (projectErr || !projectRow) {
    return { ok: false, error: "Project not found or you cannot access it" };
  }

  if (!file || typeof file !== "object" || !("arrayBuffer" in file)) {
    return { ok: false, error: "Choose a file to upload" };
  }

  const blob = /** @type {File | Blob} */ (file);
  const originalFilename =
    "name" in blob && typeof blob.name === "string" ? blob.name : "file";
  const mimeType = "type" in blob && typeof blob.type === "string" ? blob.type : null;
  const sizeBytes = "size" in blob && typeof blob.size === "number" ? blob.size : null;

  let bytes;
  try {
    bytes = Buffer.from(await blob.arrayBuffer());
  } catch {
    return { ok: false, error: "Could not read file" };
  }

  if (!bytes?.length) {
    return { ok: false, error: "File is empty" };
  }

  if (bytes.length > LIBRARY_MAX_UPLOAD_BYTES) {
    return {
      ok: false,
      error: `This file is too large. Maximum upload size is ${LIBRARY_MAX_UPLOAD_LABEL}.`,
    };
  }

  const safe = sanitizeOriginalFilename(originalFilename);
  const objectPath = `${projectId}/${crypto.randomUUID()}_${safe}`;

  const { error: upErr } = await supabase.storage.from(BUCKET).upload(objectPath, bytes, {
    contentType: mimeType || "application/octet-stream",
    upsert: false,
  });

  if (upErr) {
    return { ok: false, error: upErr.message || "Upload failed" };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, avatar_url")
    .eq("id", user.id)
    .maybeSingle();

  const createdByDisplayName =
    profile?.full_name?.trim() || user.email?.split("@")[0] || "Member";

  const { data: insertedFile, error: insErr } = await supabase
    .from("project_library_files")
    .insert({
      project_id: projectId,
      storage_object_path: objectPath,
      display_name: displayName,
      original_filename: sanitizeOriginalFilename(originalFilename),
      mime_type: mimeType,
      size_bytes: Number.isFinite(Number(sizeBytes)) ? Math.round(Number(sizeBytes)) : null,
      description,
      needs_approval: needsApproval,
      approval_status: needsApproval ? "pending" : null,
      created_by: user.id,
      created_by_display_name: createdByDisplayName,
      created_by_avatar_url: profile?.avatar_url || null,
    })
    .select("id")
    .single();

  if (insErr) {
    await supabase.storage.from(BUCKET).remove([objectPath]);
    return { ok: false, error: insErr.message || "Could not save file" };
  }

  await recordProjectActivityEvent(supabase, {
    projectId,
    eventType: PROJECT_ACTIVITY_EVENT_TYPES.LIBRARY_FILE_UPLOADED,
    actorId: user.id,
    actorDisplayName: createdByDisplayName,
    actorAvatarUrl: profile?.avatar_url ?? null,
    payload: {
      display_name: displayName,
      needs_approval: needsApproval,
      ...(insertedFile?.id ? { file_id: insertedFile.id } : {}),
    },
  });

  void notifyPortalLibraryFileUploaded({
    projectId,
    projectFreelancerId: projectRow.freelancer_id,
    actorUserId: user.id,
    actorName: createdByDisplayName,
    actorAvatarUrl: profile?.avatar_url ?? null,
    displayName,
  });

  revalidateLibrary(projectId);
  return { ok: true };
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
