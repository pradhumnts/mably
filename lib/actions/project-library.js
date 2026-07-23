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
  notifyPortalLibraryFileUploaded,
  notifyPortalLibraryLinkAdded,
} from "@/lib/notifications/trigger-portal-email";
import { enqueueFreelancerInboxFileRevision } from "@/lib/notifications/trigger-freelancer-inbox";
import { performLibraryFileUpload } from "@/lib/library/perform-library-file-upload";
import {
  isDemoProjectId,
  getDemoLibraryFiles,
  getDemoLibraryLinks,
  getDemoLibraryFileComments,
  getDemoStorageUsageResponse,
  getDemoBlockedResponse,
  getDemoLibraryFilePreviewUrl,
  resolveDemoFreelancerFromSupabase,
} from "@/lib/data/demo-project";
import { isLibraryFilePreviewable } from "@/lib/library/file-preview";
import { inferFileKindFromMime } from "@/lib/library/infer-types";
import {
  CHAT_VOICE_NOTES_STORAGE_SUBPREFIX,
  MAX_VOICE_NOTE_BYTES,
  MAX_VOICE_NOTE_MS,
  VOICE_NOTES_STORAGE_PREFIX,
} from "@/lib/library/voice-note-constants";
import { formatVoiceNoteDurationLabel } from "@/lib/library/voice-note-format";
import { mapAttachedLibraryFile } from "@/lib/library/map-attached-file";

const BUCKET = "project-library";

function revalidateLibrary(projectId) {
  revalidatePath(`/project/${projectId}/library/files`);
  revalidatePath(`/project/${projectId}/library/links`);
}

function assertVoiceNoteObjectPath(projectId, path) {
  const pid = String(projectId || "").trim();
  const p = String(path || "").trim();
  if (!pid || !p) return false;
  const prefix = `${pid}/${VOICE_NOTES_STORAGE_PREFIX}/`;
  if (!p.startsWith(prefix)) return false;
  if (p.includes("..") || p.includes("\\")) return false;
  return true;
}

function normalizeVoiceWaveformForDb(raw) {
  if (raw == null) return null;
  let arr = raw;
  if (typeof raw === "string") {
    try {
      arr = JSON.parse(raw);
    } catch {
      return null;
    }
  }
  if (!Array.isArray(arr)) return null;
  const out = arr.slice(0, 128).map((x) => {
    const n = Number(x);
    return Number.isFinite(n) ? Math.max(0, Math.min(1, n)) : 0;
  });
  return out.length >= 8 ? out : null;
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

function sanitizeLibraryDisplayName(name) {
  const trimmed = typeof name === "string" ? name.replace(/[\r\n]+/g, " ").trim() : "";
  if (!trimmed) return "";
  return trimmed.length > 200 ? trimmed.slice(0, 200) : trimmed;
}

/**
 * @param {import("@supabase/supabase-js").SupabaseClient} supabase
 * @param {{
 *   fileId: string;
 *   versionNumber: number;
 *   objectPath: string;
 *   originalFilename: string;
 *   mimeType: string | null;
 *   sizeBytes: number;
 *   versionNote?: string | null;
 *   createdBy: string;
 *   createdByDisplayName: string;
 *   createdByAvatarUrl: string | null;
 * }} p
 */
async function insertLibraryFileVersionRow(supabase, p) {
  const { data, error } = await supabase
    .from("project_library_file_versions")
    .insert({
      file_id: p.fileId,
      version_number: p.versionNumber,
      storage_object_path: p.objectPath,
      original_filename: p.originalFilename,
      mime_type: p.mimeType,
      size_bytes: Math.round(p.sizeBytes),
      version_note: p.versionNote || null,
      created_by: p.createdBy,
      created_by_display_name: p.createdByDisplayName,
      created_by_avatar_url: p.createdByAvatarUrl,
    })
    .select("id, version_number")
    .single();

  if (error) {
    const missing =
      error.code === "42P01" ||
      String(error.message || "").toLowerCase().includes("file_versions");
    if (missing) return { ok: true, versionId: null, skipped: true };
    return { ok: false, error: error.message || "Could not save file version" };
  }

  return { ok: true, versionId: data?.id ? String(data.id) : null, versionNumber: data?.version_number };
}

/** @param {unknown} extras */
function normalizeCommentExtras(extras) {
  if (!extras || typeof extras !== "object") {
    return { voice: null, attachedFileIds: [], attachedVersionIds: [] };
  }
  const o = /** @type {Record<string, unknown>} */ (extras);
  if (typeof o.storagePath === "string" && o.storagePath.trim()) {
    return { voice: o, attachedFileIds: [], attachedVersionIds: [] };
  }
  const voice = o.voice && typeof o.voice === "object" ? o.voice : null;
  const ids = [];
  const idSet = new Set();
  if (Array.isArray(o.attachedFileIds)) {
    for (const raw of o.attachedFileIds) {
      if (typeof raw === "string" && raw.trim() && !idSet.has(raw.trim())) {
        idSet.add(raw.trim());
        ids.push(raw.trim());
      }
    }
  }
  if (typeof o.attachedFileId === "string" && o.attachedFileId.trim() && !idSet.has(o.attachedFileId.trim())) {
    ids.push(o.attachedFileId.trim());
  }
  const versionIds = [];
  if (Array.isArray(o.attachedVersionIds)) {
    for (let i = 0; i < ids.length; i++) {
      const raw = o.attachedVersionIds[i];
      versionIds.push(typeof raw === "string" && raw.trim() ? raw.trim() : null);
    }
  }
  return { voice, attachedFileIds: ids, attachedVersionIds: versionIds };
}

/**
 * @param {import("@supabase/supabase-js").SupabaseClient} supabase
 * @param {string} projectId
 * @param {string} discussionFileId
 * @param {string[]} attachedFileIds
 */
async function assertDiscussionAttachedLibraryFiles(
  supabase,
  projectId,
  discussionFileId,
  attachedFileIds
) {
  const unique = [...new Set(attachedFileIds.filter(Boolean))];
  if (!unique.length) {
    return { ok: false, error: "No attached files." };
  }

  const { data: rows, error } = await supabase
    .from("project_library_files")
    .select("id, display_name, upload_origin, origin_discussion_file_id")
    .eq("project_id", projectId)
    .in("id", unique);

  if (error) {
    return { ok: false, error: "Could not verify attached files." };
  }
  if ((rows ?? []).length !== unique.length) {
    return { ok: false, error: "One or more attached files were not found." };
  }

  const displayNames = [];
  for (const row of rows ?? []) {
    if (String(row.id) === discussionFileId) {
      displayNames.push(row.display_name || "File");
      continue;
    }
    if (
      row.upload_origin !== "discussion" ||
      String(row.origin_discussion_file_id) !== discussionFileId
    ) {
      return { ok: false, error: "Invalid attached file for this discussion." };
    }
    displayNames.push(row.display_name || "File");
  }

  const byId = new Map((rows ?? []).map((r) => [String(r.id), r.display_name || "File"]));
  const orderedNames = unique.map((id) => byId.get(id) || "File");
  return { ok: true, displayNames: orderedNames };
}

/**
 * @param {import("@supabase/supabase-js").SupabaseClient} supabase
 * @param {string} projectId
 * @param {Array<{ id: string; attached_file_id?: string | null }>} rows
 */
async function mapCommentsWithAttachedFiles(supabase, projectId, rows) {
  if (!rows.length) return [];

  const commentIds = rows.map((r) => r.id).filter(Boolean);

  const { data: junctionRows, error: junctionErr } = await supabase
    .from("project_library_file_comment_attachments")
    .select("comment_id, file_id, version_id, sort_order")
    .in("comment_id", commentIds)
    .order("sort_order", { ascending: true });

  const missingJunction =
    junctionErr &&
    (junctionErr.code === "42P01" ||
      String(junctionErr.message || "").toLowerCase().includes("comment_attachments"));

  /** @type {Map<string, Array<{ fileId: string; versionId: string | null }>>} */
  const attachmentsByComment = new Map();

  if (!missingJunction && junctionRows?.length) {
    for (const link of junctionRows) {
      const cid = String(link.comment_id);
      const list = attachmentsByComment.get(cid) ?? [];
      list.push({
        fileId: String(link.file_id),
        versionId: link.version_id ? String(link.version_id) : null,
      });
      attachmentsByComment.set(cid, list);
    }
  }

  for (const row of rows) {
    if (attachmentsByComment.has(String(row.id))) continue;
    if (row.attached_file_id) {
      attachmentsByComment.set(String(row.id), [
        { fileId: String(row.attached_file_id), versionId: null },
      ]);
    }
  }

  const allFileIds = [
    ...new Set([...attachmentsByComment.values()].flat().map((a) => a.fileId)),
  ];
  if (!allFileIds.length) {
    return rows.map((r) => ({ ...r, attached_files: [], attached_file: null }));
  }

  const { data: files, error: filesErr } = await supabase
    .from("project_library_files")
    .select("id, display_name, mime_type, original_filename, current_version_number")
    .eq("project_id", projectId)
    .in("id", allFileIds);

  if (filesErr) {
    console.warn("[library] attached file lookup:", filesErr.message);
    return rows.map((r) => ({ ...r, attached_files: [], attached_file: null }));
  }

  const allVersionIds = [
    ...new Set(
      [...attachmentsByComment.values()]
        .flat()
        .map((a) => a.versionId)
        .filter(Boolean)
    ),
  ];
  /** @type {Map<string, number>} */
  const versionNumberById = new Map();
  if (allVersionIds.length) {
    const { data: versionRows } = await supabase
      .from("project_library_file_versions")
      .select("id, version_number")
      .in("id", allVersionIds);
    for (const v of versionRows ?? []) {
      versionNumberById.set(String(v.id), Number(v.version_number));
    }
  }

  const byId = new Map((files ?? []).map((f) => [String(f.id), f]));
  return rows.map((r) => {
    const attached_files = (attachmentsByComment.get(String(r.id)) ?? [])
      .map(({ fileId, versionId }) => {
        const fileRow = byId.get(fileId);
        if (!fileRow) return null;
        const mapped = mapAttachedLibraryFile(fileRow);
        if (!mapped) return null;
        const version_number = versionId
          ? versionNumberById.get(versionId) ?? null
          : fileRow.current_version_number ?? null;
        return {
          ...mapped,
          version_id: versionId,
          version_number: version_number ?? null,
        };
      })
      .filter(Boolean);
    return {
      ...r,
      attached_files,
      attached_file: attached_files[0] ?? null,
    };
  });
}

/**
 * Upload library file (server action). The upload dialog uses `POST /api/project-library/upload`
 * for byte-level progress; this remains for programmatic use.
 *
 * FormData fields: projectId, file, displayName, description (optional), needsApproval ("1" | "0")
 */
export async function uploadLibraryFile(formData) {
  const supabase = await createClient();
  try {
    const rawProjectId = String(formData?.get?.("projectId") || "").trim();
    if (isDemoProjectId(rawProjectId)) {
      return getDemoBlockedResponse();
    }
  } catch {
    // formData may not be available in some test contexts; fall through to real upload.
  }
  return performLibraryFileUpload(supabase, formData);
}

/**
 * Validate project access + subscription/storage caps before direct browser upload.
 * Returns a storage object path for client-side upload to Supabase Storage.
 *
 * @param {{
 *   projectId: string;
 *   displayName: string;
 *   originalFilename?: string | null;
 *   mimeType?: string | null;
 *   sizeBytes: number;
 * }} payload
 */
export async function prepareLibraryFileUpload(payload) {
  const supabase = await createClient();
  const {
    data: { user },
    error: authErr,
  } = await supabase.auth.getUser();
  if (authErr || !user) return { ok: false, error: "Not signed in" };

  const projectId = String(payload?.projectId ?? "").trim();
  const displayName = String(payload?.displayName ?? "").trim();
  const rawOriginal = String(payload?.originalFilename ?? "").trim();
  const mimeType = String(payload?.mimeType ?? "").trim() || null;
  const sizeBytes = Number(payload?.sizeBytes);

  if (!projectId || !displayName) {
    return { ok: false, error: "Project and display name are required" };
  }
  if (!Number.isFinite(sizeBytes) || sizeBytes <= 0) {
    return { ok: false, error: "Invalid file size" };
  }

  if (isDemoProjectId(projectId)) {
    return getDemoBlockedResponse();
  }

  const { data: projectRow, error: projectErr } = await supabase
    .from("projects")
    .select("id, freelancer_id")
    .eq("id", projectId)
    .maybeSingle();
  if (projectErr || !projectRow) {
    return { ok: false, error: "Project not found or you cannot access it" };
  }

  const billingUserId = projectRow.freelancer_id;
  const subscriptionRow = await fetchFreelancerSubscriptionRowForBilling(billingUserId);
  if (!subscriptionRow) {
    return {
      ok: false,
      error:
        "Could not verify your subscription for library uploads. If you are a client, ask the freelancer to try again or contact support.",
    };
  }

  const caps = getLibraryStorageCaps(subscriptionRow);
  if (sizeBytes > caps.maxFileBytes) {
    return {
      ok: false,
      error: `This file is too large. Your plan allows up to ${caps.maxFileLabel} per file.`,
    };
  }

  const usedRes = await sumFreelancerLibraryStorageBytes(billingUserId, user.id);
  if (!usedRes.ok) {
    return { ok: false, error: usedRes.error };
  }
  if (usedRes.bytes + sizeBytes > caps.totalBytes) {
    const usedGb = (usedRes.bytes / 1024 ** 3).toFixed(1);
    const capGb = (caps.totalBytes / 1024 ** 3).toFixed(0);
    return {
      ok: false,
      error: `Library storage is full for this account (${usedGb} / ${capGb} GB used across all projects). Remove files or upgrade your plan to continue.`,
    };
  }

  const safeOriginal = sanitizeOriginalFilename(rawOriginal || "file");
  const objectPath = `${projectId}/${crypto.randomUUID()}_${safeOriginal}`;

  return {
    ok: true,
    objectPath,
    normalizedOriginalFilename: safeOriginal,
    mimeType,
    sizeBytes: Math.round(sizeBytes),
  };
}

/**
 * Reserve a storage path for a library file voice note (direct client upload to Supabase Storage).
 * Counts against the same freelancer library quota as files.
 *
 * @param {{
 *   projectId: string;
 *   sizeBytes: number;
 *   mimeType?: string | null;
 *   extension?: string | null;
 * }} payload
 */
export async function prepareLibraryVoiceNoteUpload(payload) {
  const supabase = await createClient();
  const {
    data: { user },
    error: authErr,
  } = await supabase.auth.getUser();
  if (authErr || !user) return { ok: false, error: "Not signed in" };

  const projectId = String(payload?.projectId ?? "").trim();
  const sizeBytes = Number(payload?.sizeBytes);
  const mimeType = String(payload?.mimeType ?? "").trim() || "audio/webm";
  const extRaw = String(payload?.extension ?? "").trim().replace(/^\./, "");
  const ext =
    extRaw && /^[a-z0-9]+$/i.test(extRaw)
      ? extRaw.toLowerCase()
      : mimeType.includes("mp4") || mimeType.includes("aac")
        ? "m4a"
        : "webm";

  if (!projectId) {
    return { ok: false, error: "Project is required" };
  }
  if (!Number.isFinite(sizeBytes) || sizeBytes <= 0) {
    return { ok: false, error: "Invalid recording size" };
  }
  if (sizeBytes > MAX_VOICE_NOTE_BYTES) {
    return { ok: false, error: "Recording is too large. Try a shorter voice note." };
  }

  if (isDemoProjectId(projectId)) {
    return getDemoBlockedResponse();
  }

  const { data: projectRow, error: projectErr } = await supabase
    .from("projects")
    .select("id, freelancer_id")
    .eq("id", projectId)
    .maybeSingle();
  if (projectErr || !projectRow) {
    return { ok: false, error: "Project not found or you cannot access it" };
  }

  const billingUserId = projectRow.freelancer_id;
  const subscriptionRow = await fetchFreelancerSubscriptionRowForBilling(billingUserId);
  if (!subscriptionRow) {
    return {
      ok: false,
      error:
        "Could not verify your subscription for uploads. If you are a client, ask the freelancer to try again or contact support.",
    };
  }

  const caps = getLibraryStorageCaps(subscriptionRow);
  const usedRes = await sumFreelancerLibraryStorageBytes(billingUserId, user.id);
  if (!usedRes.ok) {
    return { ok: false, error: usedRes.error };
  }
  if (usedRes.bytes + sizeBytes > caps.totalBytes) {
    const usedGb = (usedRes.bytes / 1024 ** 3).toFixed(1);
    const capGb = (caps.totalBytes / 1024 ** 3).toFixed(0);
    return {
      ok: false,
      error: `Library storage is full for this account (${usedGb} / ${capGb} GB used across all projects). Remove files or shorten the recording.`,
    };
  }

  const storageSub =
    String(payload?.storageSubprefix ?? "").trim() === CHAT_VOICE_NOTES_STORAGE_SUBPREFIX
      ? `${CHAT_VOICE_NOTES_STORAGE_SUBPREFIX}/`
      : `${VOICE_NOTES_STORAGE_PREFIX}/`;
  const objectPath = `${projectId}/${storageSub}${crypto.randomUUID()}.${ext}`;

  return {
    ok: true,
    objectPath,
    mimeType,
    sizeBytes: Math.round(sizeBytes),
  };
}

/**
 * @param {string} projectId
 * @param {string} fileId
 * @param {string} commentId
 */
export async function getLibraryCommentVoiceSignedUrl(projectId, fileId, commentId) {
  const supabase = await createClient();
  const {
    data: { user },
    error: authErr,
  } = await supabase.auth.getUser();
  if (authErr || !user) return { ok: false, error: "Not signed in" };

  const pid = String(projectId || "").trim();
  const fid = String(fileId || "").trim();
  const cid = String(commentId || "").trim();
  if (!pid || !fid || !cid) return { ok: false, error: "Missing id" };

  if (isDemoProjectId(pid)) {
    return { ok: false, error: "Voice notes are not available in the demo project." };
  }

  const { data: row, error } = await supabase
    .from("project_library_file_comments")
    .select("voice_note_storage_path, file_id, project_id")
    .eq("id", cid)
    .eq("file_id", fid)
    .eq("project_id", pid)
    .maybeSingle();

  if (error || !row?.voice_note_storage_path) {
    return { ok: false, error: "Voice note not found" };
  }

  const { data: signed, error: signErr } = await supabase.storage
    .from(BUCKET)
    .createSignedUrl(row.voice_note_storage_path, 3600);

  if (signErr || !signed?.signedUrl) {
    return { ok: false, error: signErr?.message || "Could not create playback link" };
  }

  return { ok: true, url: signed.signedUrl };
}

/**
 * Mark a voice note as fully listened (separate from thread read receipts).
 *
 * @param {string} projectId
 * @param {string} fileId
 * @param {string} commentId
 */
export async function markLibraryCommentVoiceListened(projectId, fileId, commentId) {
  const supabase = await createClient();
  const {
    data: { user },
    error: authErr,
  } = await supabase.auth.getUser();
  if (authErr || !user) return { ok: false, error: "Not signed in" };

  const pid = String(projectId || "").trim();
  const fid = String(fileId || "").trim();
  const cid = String(commentId || "").trim();
  if (!pid || !fid || !cid) return { ok: false, error: "Missing id" };

  if (isDemoProjectId(pid)) {
    return { ok: true };
  }

  const { data: comment, error: cErr } = await supabase
    .from("project_library_file_comments")
    .select("id, voice_note_storage_path")
    .eq("id", cid)
    .eq("file_id", fid)
    .eq("project_id", pid)
    .maybeSingle();

  if (cErr || !comment?.voice_note_storage_path) {
    return { ok: false, error: "Voice note not found" };
  }

  const { error } = await supabase.from("project_library_file_comment_voice_listens").insert({
    comment_id: cid,
    user_id: user.id,
  });

  if (error) {
    if (error.code === "23505") {
      return { ok: true };
    }
    const missing =
      error.code === "42P01" ||
      String(error.message || "").toLowerCase().includes("voice_listen");
    if (missing) {
      console.warn("[library] voice listens table unavailable:", error.message);
      return { ok: true };
    }
    return { ok: false, error: error.message };
  }
  return { ok: true };
}

const COMMENT_SELECT_VOICE =
  "id, body, author_id, author_display_name, author_avatar_url, created_at, voice_note_storage_path, voice_note_duration_ms, voice_note_mime_type, voice_note_size_bytes, voice_note_waveform, voice_note_transcript, attached_file_id";

/**
 * Remove a voice note from storage and clear or delete the comment row.
 *
 * @param {string} projectId
 * @param {string} fileId
 * @param {string} commentId
 */
export async function deleteLibraryCommentVoiceNote(projectId, fileId, commentId) {
  const supabase = await createClient();
  const {
    data: { user },
    error: authErr,
  } = await supabase.auth.getUser();
  if (authErr || !user) return { ok: false, error: "Not signed in" };

  const pid = String(projectId || "").trim();
  const fid = String(fileId || "").trim();
  const cid = String(commentId || "").trim();
  if (!pid || !fid || !cid) return { ok: false, error: "Missing id" };

  if (isDemoProjectId(pid)) {
    return getDemoBlockedResponse();
  }

  const { data: row, error: fetchErr } = await supabase
    .from("project_library_file_comments")
    .select("id, body, voice_note_storage_path")
    .eq("id", cid)
    .eq("file_id", fid)
    .eq("project_id", pid)
    .maybeSingle();

  if (fetchErr || !row?.voice_note_storage_path) {
    return { ok: false, error: fetchErr?.message || "Voice note not found" };
  }

  const storagePath = String(row.voice_note_storage_path).trim();
  if (!assertVoiceNoteObjectPath(pid, storagePath)) {
    return { ok: false, error: "Invalid voice recording path" };
  }

  const { error: rmErr } = await supabase.storage.from(BUCKET).remove([storagePath]);
  if (rmErr) {
    return { ok: false, error: rmErr.message || "Could not remove recording from storage" };
  }

  const hasText = typeof row.body === "string" && row.body.trim().length > 0;

  if (hasText) {
    const { data: updated, error: upErr } = await supabase
      .from("project_library_file_comments")
      .update({
        voice_note_storage_path: null,
        voice_note_duration_ms: null,
        voice_note_mime_type: null,
        voice_note_size_bytes: null,
        voice_note_waveform: null,
        voice_note_transcript: null,
      })
      .eq("id", cid)
      .eq("project_id", pid)
      .select(COMMENT_SELECT_VOICE)
      .single();

    if (upErr) {
      return { ok: false, error: upErr.message || "Could not update comment" };
    }

    revalidateLibrary(pid);
    return {
      ok: true,
      deletedEntireComment: false,
      comment: { ...updated, voice_note_listened: false },
    };
  }

  const { error: delErr } = await supabase
    .from("project_library_file_comments")
    .delete()
    .eq("id", cid)
    .eq("project_id", pid);

  if (delErr) {
    return { ok: false, error: delErr.message || "Could not delete comment" };
  }

  revalidateLibrary(pid);
  return { ok: true, deletedEntireComment: true };
}

/**
 * @param {import("@supabase/supabase-js").SupabaseClient} supabase
 * @param {import("@supabase/supabase-js").User} user
 * @param {{
 *   projectId: string;
 *   fileId: string;
 *   fileDisplayName: string;
 *   freelancerId: string | null | undefined;
 *   authorDisplayName: string;
 *   authorAvatarUrl: string | null;
 *   bodyText: string;
 *   voice: {
 *     storagePath: string;
 *     durationMs: number;
 *     mimeType: string | null;
 *     sizeBytes: number;
 *     waveform: unknown;
 *   } | null;
 *   attachedFileIds?: string[];
 *   attachedVersionIds?: Array<string | null>;
 * }} p
 * @returns {Promise<{ ok: true; comment: object } | { ok: false; error: string }>}
 */
async function insertLibraryFileCommentAndNotify(supabase, user, p) {
  const bodyInsert = typeof p.bodyText === "string" ? p.bodyText.trim() : "";
  const hasVoice = Boolean(p.voice?.storagePath);
  const attachedFileIds = Array.isArray(p.attachedFileIds)
    ? [...new Set(p.attachedFileIds.map((id) => String(id).trim()).filter(Boolean))]
    : [];
  const hasAttachments = attachedFileIds.length > 0;
  const primaryAttachedFileId = hasAttachments ? attachedFileIds[0] : null;

  if (!bodyInsert && !hasVoice && !hasAttachments) {
    return { ok: false, error: "Nothing to post" };
  }

  let attachedDisplayNames = [];
  if (hasAttachments) {
    const check = await assertDiscussionAttachedLibraryFiles(
      supabase,
      p.projectId,
      p.fileId,
      attachedFileIds
    );
    if (!check.ok) {
      return { ok: false, error: check.error || "Invalid attached file" };
    }
    attachedDisplayNames = check.displayNames ?? [];
  }

  let voiceSize = 0;
  if (hasVoice) {
    const path = String(p.voice.storagePath || "").trim();
    if (!assertVoiceNoteObjectPath(p.projectId, path)) {
      return { ok: false, error: "Invalid voice recording path" };
    }
    const durationMs = Number(p.voice.durationMs);
    if (!Number.isFinite(durationMs) || durationMs <= 0 || durationMs > MAX_VOICE_NOTE_MS) {
      return { ok: false, error: "Recording must be between 1 second and 3 minutes." };
    }
    const { data: blob, error: dlErr } = await supabase.storage.from(BUCKET).download(path);
    if (dlErr || !blob) {
      return {
        ok: false,
        error: dlErr?.message || "Recording not found in storage. Try uploading again.",
      };
    }
    const ab = await blob.arrayBuffer();
    voiceSize = ab.byteLength;
    if (voiceSize <= 0) {
      return { ok: false, error: "Recording file is empty." };
    }
    if (voiceSize > MAX_VOICE_NOTE_BYTES) {
      return { ok: false, error: "Recording file is too large." };
    }
  }

  const insertRow = {
    project_id: p.projectId,
    file_id: p.fileId,
    author_id: user.id,
    author_display_name: p.authorDisplayName,
    author_avatar_url: p.authorAvatarUrl,
    body: bodyInsert || null,
    ...(hasVoice
      ? {
          voice_note_storage_path: String(p.voice.storagePath).trim(),
          voice_note_duration_ms: Math.round(Number(p.voice.durationMs)),
          voice_note_mime_type: p.voice.mimeType
            ? String(p.voice.mimeType).trim().slice(0, 120)
            : null,
          voice_note_size_bytes: Math.round(Number(p.voice.sizeBytes)) || voiceSize,
          voice_note_waveform: normalizeVoiceWaveformForDb(p.voice.waveform),
        }
      : {}),
    ...(primaryAttachedFileId ? { attached_file_id: primaryAttachedFileId } : {}),
  };

  const { data: inserted, error } = await supabase
    .from("project_library_file_comments")
    .insert(insertRow)
    .select(COMMENT_SELECT_VOICE)
    .single();

  if (error) {
    return { ok: false, error: error.message || "Could not post comment" };
  }

  if (hasAttachments) {
    const versionIds = Array.isArray(p.attachedVersionIds) ? p.attachedVersionIds : [];
    const junctionRows = attachedFileIds.map((fileId, index) => ({
      comment_id: inserted.id,
      file_id: fileId,
      ...(versionIds[index] ? { version_id: versionIds[index] } : {}),
      sort_order: index,
    }));
    const { error: junctionErr } = await supabase
      .from("project_library_file_comment_attachments")
      .insert(junctionRows);
    if (junctionErr) {
      const missingJunction =
        junctionErr.code === "42P01" ||
        String(junctionErr.message || "").toLowerCase().includes("comment_attachments");
      if (!missingJunction) {
        await supabase.from("project_library_file_comments").delete().eq("id", inserted.id);
        return { ok: false, error: junctionErr.message || "Could not link attached files" };
      }
    }
  }

  const attachmentSummary =
    attachedDisplayNames.length === 1
      ? attachedDisplayNames[0]
      : attachedDisplayNames.length > 1
        ? `${attachedDisplayNames.length} files`
        : "File";

  const activityBody =
    bodyInsert ||
    (hasVoice ? "[Voice note]" : hasAttachments ? `[Files: ${attachmentSummary}]` : "");
  await recordProjectActivityEvent(supabase, {
    projectId: p.projectId,
    eventType: PROJECT_ACTIVITY_EVENT_TYPES.LIBRARY_FILE_COMMENT,
    actorId: user.id,
    actorDisplayName: p.authorDisplayName,
    actorAvatarUrl: p.authorAvatarUrl ?? null,
    payload: {
      file_id: p.fileId,
      file_display_name: p.fileDisplayName,
      body: activityBody,
      ...(hasVoice
        ? {
            comment_id: inserted.id,
            voice_note_duration_ms: inserted.voice_note_duration_ms,
            voice_note_waveform: inserted.voice_note_waveform ?? null,
          }
        : {}),
      ...(hasAttachments
        ? {
            attached_file_ids: attachedFileIds,
            attached_file_display_name: attachmentSummary,
          }
        : {}),
    },
  });

  if (p.freelancerId) {
    const isVoice = hasVoice;
    const durationLabel = hasVoice
      ? formatVoiceNoteDurationLabel(Number(inserted.voice_note_duration_ms))
      : "";
    void notifyPortalLibraryFileComment({
      projectId: p.projectId,
      projectFreelancerId: p.freelancerId,
      actorUserId: user.id,
      actorName: p.authorDisplayName,
      actorAvatarUrl: p.authorAvatarUrl ?? null,
      fileDisplayName: p.fileDisplayName,
      preview:
        bodyInsert ||
        (isVoice
          ? `Voice note (${durationLabel})`
          : hasAttachments
            ? `Shared ${attachmentSummary}`
            : ""),
      isVoice,
      durationLabel,
      voiceCaption: bodyInsert && isVoice ? bodyInsert : "",
    });
  }

  const [withAttachment] = await mapCommentsWithAttachedFiles(supabase, p.projectId, [inserted]);
  return {
    ok: true,
    comment: { ...withAttachment, voice_note_listened: false },
  };
}

/**
 * Persist DB metadata + side effects after client uploads bytes directly to Supabase Storage.
 *
 * @param {{
 *   projectId: string;
 *   objectPath: string;
 *   displayName: string;
 *   description?: string | null;
 *   needsApproval?: boolean;
 *   originalFilename?: string | null;
 *   mimeType?: string | null;
 *   sizeBytes: number;
 *   uploadOrigin?: "library" | "discussion";
 *   originDiscussionFileId?: string | null;
 * }} payload
 */
export async function completeLibraryFileUpload(payload) {
  const supabase = await createClient();
  const {
    data: { user },
    error: authErr,
  } = await supabase.auth.getUser();
  if (authErr || !user) return { ok: false, error: "Not signed in" };

  const projectId = String(payload?.projectId ?? "").trim();
  const objectPath = String(payload?.objectPath ?? "").trim();
  const displayName = String(payload?.displayName ?? "").trim();

  if (isDemoProjectId(projectId)) {
    return getDemoBlockedResponse();
  }

  const descriptionRaw = payload?.description;
  const description =
    typeof descriptionRaw === "string" && descriptionRaw.trim() ? descriptionRaw.trim() : null;
  const needsApproval = Boolean(payload?.needsApproval);
  const originalFilename = sanitizeOriginalFilename(String(payload?.originalFilename ?? "").trim() || "file");
  const mimeType = String(payload?.mimeType ?? "").trim() || null;
  const sizeBytes = Number(payload?.sizeBytes);
  const uploadOrigin = payload?.uploadOrigin === "discussion" ? "discussion" : "library";
  const originDiscussionFileId =
    typeof payload?.originDiscussionFileId === "string"
      ? payload.originDiscussionFileId.trim()
      : "";

  if (!projectId || !objectPath || !displayName) {
    return { ok: false, error: "Project, file path, and display name are required" };
  }
  if (!Number.isFinite(sizeBytes) || sizeBytes <= 0) {
    return { ok: false, error: "Invalid file size" };
  }
  if (uploadOrigin === "discussion" && !originDiscussionFileId) {
    return { ok: false, error: "Discussion file is required for this upload." };
  }
  if (!objectPath.startsWith(`${projectId}/`)) {
    return { ok: false, error: "Invalid file path" };
  }
  if (objectPath.includes(`/${VOICE_NOTES_STORAGE_PREFIX}/`)) {
    return { ok: false, error: "Invalid file path" };
  }

  const { data: projectRow, error: projectErr } = await supabase
    .from("projects")
    .select("id, freelancer_id")
    .eq("id", projectId)
    .maybeSingle();
  if (projectErr || !projectRow) {
    return { ok: false, error: "Project not found or you cannot access it" };
  }

  if (uploadOrigin === "discussion") {
    const { data: discussionFile, error: discussionErr } = await supabase
      .from("project_library_files")
      .select("id")
      .eq("id", originDiscussionFileId)
      .eq("project_id", projectId)
      .maybeSingle();
    if (discussionErr || !discussionFile) {
      return { ok: false, error: "Discussion file not found or you cannot access it" };
    }
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
      original_filename: originalFilename,
      mime_type: mimeType,
      size_bytes: Math.round(sizeBytes),
      description,
      needs_approval: needsApproval,
      approval_status: needsApproval ? "pending" : null,
      upload_origin: uploadOrigin,
      origin_discussion_file_id:
        uploadOrigin === "discussion" ? originDiscussionFileId : null,
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

  const fileId = insertedFile?.id ? String(insertedFile.id) : null;
  if (fileId) {
    await insertLibraryFileVersionRow(supabase, {
      fileId,
      versionNumber: 1,
      objectPath,
      originalFilename,
      mimeType,
      sizeBytes,
      versionNote: null,
      createdBy: user.id,
      createdByDisplayName,
      createdByAvatarUrl: profile?.avatar_url || null,
    });
  }

  if (fileId && description && uploadOrigin !== "discussion") {
    await seedLibraryFileUploadDiscussionComment(supabase, user, {
      projectId,
      fileId,
      fileDisplayName: displayName,
      freelancerId: projectRow.freelancer_id,
      authorDisplayName: createdByDisplayName,
      authorAvatarUrl: profile?.avatar_url ?? null,
      description,
    });
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
      ...(uploadOrigin === "discussion"
        ? {
            upload_origin: uploadOrigin,
            origin_discussion_file_id: originDiscussionFileId,
          }
        : {}),
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
  return { ok: true, fileId };
}

/**
 * Post the upload message as the first file-discussion comment (library uploads only).
 *
 * @param {import("@supabase/supabase-js").SupabaseClient} supabase
 * @param {import("@supabase/supabase-js").User} user
 * @param {{
 *   projectId: string;
 *   fileId: string;
 *   fileDisplayName: string;
 *   freelancerId?: string | null;
 *   authorDisplayName: string;
 *   authorAvatarUrl?: string | null;
 *   description: string;
 * }} params
 */
export async function seedLibraryFileUploadDiscussionComment(supabase, user, params) {
  const description =
    typeof params.description === "string" ? params.description.trim() : "";
  if (!description || !params.fileId) return { ok: true, skipped: true };

  const commentRes = await insertLibraryFileCommentAndNotify(supabase, user, {
    projectId: params.projectId,
    fileId: params.fileId,
    fileDisplayName: params.fileDisplayName,
    freelancerId: params.freelancerId,
    authorDisplayName: params.authorDisplayName,
    authorAvatarUrl: params.authorAvatarUrl ?? null,
    bodyText: description,
  });
  if (!commentRes.ok) {
    console.warn("[library] upload discussion comment:", commentRes.error);
    return { ok: false, error: commentRes.error };
  }
  return { ok: true, comment: commentRes.comment };
}

/**
 * Save a new version on an existing library file (updates current blob + version stack).
 *
 * @param {{
 *   projectId: string;
 *   fileId: string;
 *   objectPath: string;
 *   originalFilename?: string | null;
 *   mimeType?: string | null;
 *   sizeBytes: number;
 *   needsApproval?: boolean;
 *   versionNote?: string | null;
 * }} payload
 */
export async function completeLibraryFileNewVersion(payload) {
  const supabase = await createClient();
  const {
    data: { user },
    error: authErr,
  } = await supabase.auth.getUser();
  if (authErr || !user) return { ok: false, error: "Not signed in" };

  const projectId = String(payload?.projectId ?? "").trim();
  const fileId = String(payload?.fileId ?? "").trim();
  const objectPath = String(payload?.objectPath ?? "").trim();
  const originalFilename = sanitizeOriginalFilename(
    String(payload?.originalFilename ?? "").trim() || "file"
  );
  const mimeType = String(payload?.mimeType ?? "").trim() || null;
  const sizeBytes = Number(payload?.sizeBytes);
  const needsApproval = Boolean(payload?.needsApproval);
  const versionNote =
    typeof payload?.versionNote === "string" && payload.versionNote.trim()
      ? payload.versionNote.trim()
      : null;

  if (isDemoProjectId(projectId)) {
    return getDemoBlockedResponse();
  }
  if (!projectId || !fileId || !objectPath) {
    return { ok: false, error: "Project, file, and path are required" };
  }
  if (!Number.isFinite(sizeBytes) || sizeBytes <= 0) {
    return { ok: false, error: "Invalid file size" };
  }
  if (!objectPath.startsWith(`${projectId}/`)) {
    return { ok: false, error: "Invalid file path" };
  }

  const { data: fileRow, error: fileErr } = await supabase
    .from("project_library_files")
    .select(
      "id, display_name, needs_approval, approval_status, version_count, current_version_number"
    )
    .eq("id", fileId)
    .eq("project_id", projectId)
    .maybeSingle();

  if (fileErr || !fileRow) {
    return { ok: false, error: "File not found or you cannot access it" };
  }

  const nextVersion = Math.max(Number(fileRow.current_version_number) || 1, Number(fileRow.version_count) || 1) + 1;

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, avatar_url")
    .eq("id", user.id)
    .maybeSingle();
  const createdByDisplayName =
    profile?.full_name?.trim() || user.email?.split("@")[0] || "Member";

  const versionInsert = await insertLibraryFileVersionRow(supabase, {
    fileId,
    versionNumber: nextVersion,
    objectPath,
    originalFilename,
    mimeType,
    sizeBytes,
    versionNote,
    createdBy: user.id,
    createdByDisplayName,
    createdByAvatarUrl: profile?.avatar_url || null,
  });
  if (!versionInsert.ok) {
    await supabase.storage.from(BUCKET).remove([objectPath]);
    return { ok: false, error: versionInsert.error || "Could not save file version" };
  }

  const wantsApproval = needsApproval || Boolean(fileRow.needs_approval);
  const { error: upErr } = await supabase
    .from("project_library_files")
    .update({
      storage_object_path: objectPath,
      original_filename: originalFilename,
      mime_type: mimeType,
      size_bytes: Math.round(sizeBytes),
      version_count: nextVersion,
      current_version_number: nextVersion,
      updated_at: new Date().toISOString(),
      ...(wantsApproval
        ? { needs_approval: true, approval_status: "pending" }
        : {}),
    })
    .eq("id", fileId)
    .eq("project_id", projectId);

  if (upErr) {
    await supabase.storage.from(BUCKET).remove([objectPath]);
    if (versionInsert.versionId) {
      await supabase.from("project_library_file_versions").delete().eq("id", versionInsert.versionId);
    }
    return { ok: false, error: upErr.message || "Could not update file" };
  }

  const { data: projectRow } = await supabase
    .from("projects")
    .select("freelancer_id")
    .eq("id", projectId)
    .maybeSingle();

  await recordProjectActivityEvent(supabase, {
    projectId,
    eventType: PROJECT_ACTIVITY_EVENT_TYPES.LIBRARY_FILE_UPLOADED,
    actorId: user.id,
    actorDisplayName: createdByDisplayName,
    actorAvatarUrl: profile?.avatar_url ?? null,
    payload: {
      file_id: fileId,
      display_name: fileRow.display_name,
      version_number: nextVersion,
      is_new_version: true,
      needs_approval: wantsApproval,
    },
  });

  void notifyPortalLibraryFileUploaded({
    projectId,
    projectFreelancerId: projectRow?.freelancer_id,
    actorUserId: user.id,
    actorName: createdByDisplayName,
    actorAvatarUrl: profile?.avatar_url ?? null,
    displayName: fileRow.display_name,
  });

  revalidateLibrary(projectId);
  return {
    ok: true,
    fileId,
    versionId: versionInsert.versionId,
    versionNumber: nextVersion,
  };
}

/**
 * @param {string} projectId
 * @param {string} fileId
 */
export async function listLibraryFileVersions(projectId, fileId) {
  const pid = typeof projectId === "string" ? projectId.trim() : "";
  const fid = typeof fileId === "string" ? fileId.trim() : "";
  if (!pid || !fid) return { ok: false, error: "Missing id", items: [] };

  if (isDemoProjectId(pid)) {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    const fl = await resolveDemoFreelancerFromSupabase(supabase, user);
    const demo = getDemoLibraryFiles(fl).find((f) => String(f.id) === fid);
    if (!demo) return { ok: false, error: "File not found", items: [] };
    const count = demo.version_count ?? demo.current_version_number ?? 1;
    const items = [];
    for (let n = count; n >= 1; n--) {
      items.push({
        id: `demo-version-${fid}-${n}`,
        file_id: fid,
        version_number: n,
        original_filename: demo.original_filename,
        mime_type: demo.mime_type,
        size_bytes: demo.size_bytes,
        version_note: n === count && count > 1 ? "Latest revision" : null,
        created_by_display_name: demo.created_by_display_name,
        created_at: demo.updated_at || demo.created_at,
        is_current: n === count,
      });
    }
    return { ok: true, items };
  }

  const supabase = await createClient();
  const {
    data: { user },
    error: authErr,
  } = await supabase.auth.getUser();
  if (authErr || !user) return { ok: false, error: "Not signed in", items: [] };

  const { data: fileRow, error: fileErr } = await supabase
    .from("project_library_files")
    .select("id, current_version_number")
    .eq("id", fid)
    .eq("project_id", pid)
    .maybeSingle();
  if (fileErr || !fileRow) {
    return { ok: false, error: "File not found", items: [] };
  }

  const { data, error } = await supabase
    .from("project_library_file_versions")
    .select(
      "id, file_id, version_number, original_filename, mime_type, size_bytes, version_note, created_by_display_name, created_at"
    )
    .eq("file_id", fid)
    .order("version_number", { ascending: false });

  if (error) {
    const missing =
      error.code === "42P01" ||
      String(error.message || "").toLowerCase().includes("file_versions");
    if (missing) {
      return {
        ok: true,
        items: [
          {
            id: fid,
            file_id: fid,
            version_number: fileRow.current_version_number || 1,
            is_current: true,
          },
        ],
      };
    }
    return { ok: false, error: error.message, items: [] };
  }

  const current = Number(fileRow.current_version_number) || 1;
  return {
    ok: true,
    items: (data ?? []).map((row) => ({
      ...row,
      is_current: Number(row.version_number) === current,
    })),
  };
}

/**
 * @param {string} projectId
 */
export async function listLibraryFiles(projectId) {
  const pid = typeof projectId === "string" ? projectId.trim() : "";
  if (!pid) return { ok: false, error: "Missing project", items: [] };

  if (isDemoProjectId(pid)) {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    const fl = await resolveDemoFreelancerFromSupabase(supabase, user);
    return { ok: true, items: getDemoLibraryFiles(fl) };
  }

  const supabase = await createClient();
  const {
    data: { user },
    error: authErr,
  } = await supabase.auth.getUser();
  if (authErr || !user) return { ok: false, error: "Not signed in", items: [] };

  const fileSelectWithOrigin =
    "id, display_name, original_filename, mime_type, size_bytes, description, needs_approval, approval_status, upload_origin, origin_discussion_file_id, created_by_display_name, created_by_avatar_url, created_at, version_count, current_version_number, updated_at";
  const fileSelectLegacy =
    "id, display_name, original_filename, mime_type, size_bytes, description, needs_approval, approval_status, created_by_display_name, created_by_avatar_url, created_at, version_count, current_version_number, updated_at";

  let rows;
  const { data, error } = await supabase
    .from("project_library_files")
    .select(fileSelectWithOrigin)
    .eq("project_id", pid)
    .order("created_at", { ascending: false });

  if (error) {
    const missingOrigin =
      error.code === "42703" ||
      String(error.message || "").toLowerCase().includes("upload_origin") ||
      String(error.message || "").toLowerCase().includes("origin_discussion");
    if (!missingOrigin) {
      return { ok: false, error: error.message, items: [] };
    }
    const { data: legacy, error: legacyErr } = await supabase
      .from("project_library_files")
      .select(fileSelectLegacy)
      .eq("project_id", pid)
      .order("created_at", { ascending: false });
    if (legacyErr) return { ok: false, error: legacyErr.message, items: [] };
    rows = (legacy ?? []).map((row) => ({
      ...row,
      upload_origin: "library",
      origin_discussion_file_id: null,
      version_count: row.version_count ?? 1,
      current_version_number: row.current_version_number ?? 1,
      updated_at: row.updated_at ?? row.created_at,
    }));
  } else {
    rows = data ?? [];
  }
  const fileIds = rows.map((row) => row.id).filter(Boolean);
  if (fileIds.length === 0) {
    return { ok: true, items: [] };
  }

  const { data: readRows, error: readErr } = await supabase
    .from("project_library_file_comment_reads")
    .select("file_id, last_read_at")
    .eq("user_id", user.id)
    .in("file_id", fileIds);

  if (readErr) {
    // Read-state is additive UI metadata. If the migration has not been applied
    // yet, keep the library usable and simply show no unread badges.
    const missingReadTable =
      readErr.code === "42P01" ||
      String(readErr.message || "").toLowerCase().includes("project_library_file_comment_reads");
    if (missingReadTable) {
      console.warn("[library] comment reads unavailable:", readErr.message);
      return {
        ok: true,
        items: rows.map((row) => ({ ...row, unread_comment_count: 0 })),
      };
    }
    return { ok: false, error: readErr.message, items: [] };
  }

  const readMap = new Map(
    (readRows ?? []).map((row) => [
      row.file_id,
      row.last_read_at || "1970-01-01T00:00:00.000Z",
    ])
  );

  const { data: commentRows, error: commentsErr } = await supabase
    .from("project_library_file_comments")
    .select("file_id, author_id, created_at")
    .eq("project_id", pid)
    .in("file_id", fileIds);

  if (commentsErr) {
    return { ok: false, error: commentsErr.message, items: [] };
  }

  const unreadMap = new Map();
  for (const comment of commentRows ?? []) {
    if (!comment?.file_id || comment.author_id === user.id) continue;
    const since = readMap.get(comment.file_id) || "1970-01-01T00:00:00.000Z";
    if (String(comment.created_at) > String(since)) {
      unreadMap.set(comment.file_id, (unreadMap.get(comment.file_id) || 0) + 1);
    }
  }

  return {
    ok: true,
    items: rows.map((row) => ({
      ...row,
      unread_comment_count: unreadMap.get(row.id) || 0,
    })),
  };
}

/**
 * @param {string} projectId
 */
export async function listLibraryLinks(projectId) {
  const pid = typeof projectId === "string" ? projectId.trim() : "";
  if (!pid) return { ok: false, error: "Missing project", items: [] };

  if (isDemoProjectId(pid)) {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    const fl = await resolveDemoFreelancerFromSupabase(supabase, user);
    return { ok: true, items: getDemoLibraryLinks(fl) };
  }

  const supabase = await createClient();
  const {
    data: { user },
    error: authErr,
  } = await supabase.auth.getUser();
  if (authErr || !user) return { ok: false, error: "Not signed in", items: [] };

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

  if (isDemoProjectId(pid)) {
    return getDemoBlockedResponse();
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

  if (isDemoProjectId(pid)) {
    return getDemoBlockedResponse();
  }

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

  if (isDemoProjectId(pid)) {
    return getDemoBlockedResponse();
  }

  const { data: versionRows, error: versionsErr } = await supabase
    .from("project_library_file_versions")
    .select("storage_object_path")
    .eq("file_id", fid);

  const paths = new Set();
  if (!versionsErr && versionRows?.length) {
    for (const v of versionRows) {
      if (v.storage_object_path) paths.add(v.storage_object_path);
    }
  }

  if (!paths.size) {
    const { data: row, error: fetchErr } = await supabase
      .from("project_library_files")
      .select("storage_object_path")
      .eq("id", fid)
      .eq("project_id", pid)
      .maybeSingle();
    if (fetchErr || !row?.storage_object_path) {
      return { ok: false, error: fetchErr?.message || "File not found" };
    }
    paths.add(row.storage_object_path);
  }

  const { error: rmErr } = await supabase.storage.from(BUCKET).remove([...paths]);
  if (rmErr) return { ok: false, error: rmErr.message || "Could not remove file from storage" };

  const { error: delErr } = await supabase.from("project_library_files").delete().eq("id", fid).eq("project_id", pid);
  if (delErr) return { ok: false, error: delErr.message || "Could not delete file record" };

  revalidateLibrary(pid);
  return { ok: true };
}

/**
 * @param {string} projectId
 * @param {string} fileId
 * @param {string} [versionId]
 */
export async function getLibraryFileDownloadUrl(projectId, fileId, versionId) {
  const pid = typeof projectId === "string" ? projectId.trim() : "";
  const fid = typeof fileId === "string" ? fileId.trim() : "";
  if (!pid || !fid) return { ok: false, error: "Missing id" };

  if (isDemoProjectId(pid)) {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    const fl = await resolveDemoFreelancerFromSupabase(supabase, user);
    const demoFiles = getDemoLibraryFiles(fl);
    const demoRow = demoFiles.find((f) => String(f.id) === fid);
    const previewUrl = getDemoLibraryFilePreviewUrl(fid);
    if (
      previewUrl &&
      demoRow &&
      isLibraryFilePreviewable(
        inferFileKindFromMime(demoRow.mime_type, demoRow.original_filename || demoRow.display_name),
        demoRow.mime_type
      )
    ) {
      return { ok: true, url: previewUrl };
    }
    return {
      ok: false,
      error:
        "Downloads are disabled for the demo project. Create your first real project to share files with your client.",
    };
  }

  const supabase = await createClient();
  const {
    data: { user },
    error: authErr,
  } = await supabase.auth.getUser();
  if (authErr || !user) return { ok: false, error: "Not signed in" };

  let storagePath = null;
  const vid = typeof versionId === "string" ? versionId.trim() : "";

  if (vid) {
    const { data: versionRow, error: versionErr } = await supabase
      .from("project_library_file_versions")
      .select("storage_object_path, file_id")
      .eq("id", vid)
      .maybeSingle();
    if (versionErr || !versionRow || String(versionRow.file_id) !== fid) {
      return { ok: false, error: versionErr?.message || "Version not found" };
    }
    storagePath = versionRow.storage_object_path;
  } else {
    const { data: row, error: fetchErr } = await supabase
      .from("project_library_files")
      .select("storage_object_path")
      .eq("id", fid)
      .eq("project_id", pid)
      .maybeSingle();
    if (fetchErr || !row?.storage_object_path) {
      return { ok: false, error: fetchErr?.message || "File not found" };
    }
    storagePath = row.storage_object_path;
  }

  const { data, error } = await supabase.storage
    .from(BUCKET)
    .createSignedUrl(storagePath, 3600);

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
  const pid = typeof projectId === "string" ? projectId.trim() : "";
  const fid = typeof fileId === "string" ? fileId.trim() : "";
  if (!pid || !fid) return { ok: false, error: "Missing id", items: [] };

  if (isDemoProjectId(pid)) {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    const fl = await resolveDemoFreelancerFromSupabase(supabase, user);
    return {
      ok: true,
      items: getDemoLibraryFileComments(fid, fl),
    };
  }

  const supabase = await createClient();
  const {
    data: { user },
    error: authErr,
  } = await supabase.auth.getUser();
  if (authErr || !user) return { ok: false, error: "Not signed in", items: [] };

  const { data, error } = await supabase
    .from("project_library_file_comments")
    .select(COMMENT_SELECT_VOICE)
    .eq("project_id", pid)
    .eq("file_id", fid)
    .order("created_at", { ascending: true });

  if (error) {
    const missingVoice =
      error.code === "42703" ||
      String(error.message || "").toLowerCase().includes("voice_note");
    if (missingVoice) {
      const { data: fallback, error: err2 } = await supabase
        .from("project_library_file_comments")
        .select("id, body, author_id, author_display_name, author_avatar_url, created_at")
        .eq("project_id", pid)
        .eq("file_id", fid)
        .order("created_at", { ascending: true });
      if (err2) return { ok: false, error: err2.message, items: [] };
      return {
        ok: true,
        items: (fallback ?? []).map((row) => ({
          ...row,
          voice_note_listened: false,
        })),
      };
    }
    return { ok: false, error: error.message, items: [] };
  }

  const rows = data ?? [];
  const voiceIds = rows.filter((r) => r.voice_note_storage_path).map((r) => r.id);
  let listened = new Set();
  if (voiceIds.length) {
    const { data: listenRows, error: lErr } = await supabase
      .from("project_library_file_comment_voice_listens")
      .select("comment_id")
      .eq("user_id", user.id)
      .in("comment_id", voiceIds);
    if (!lErr && listenRows?.length) {
      listened = new Set(listenRows.map((x) => x.comment_id));
    }
  }

  const withAttachments = await mapCommentsWithAttachedFiles(supabase, pid, rows);

  return {
    ok: true,
    items: withAttachments.map((r) => ({
      ...r,
      voice_note_listened: r.voice_note_storage_path ? listened.has(r.id) : false,
    })),
  };
}

/**
 * @param {string} projectId
 * @param {string} fileId
 */
export async function markLibraryFileCommentsRead(projectId, fileId) {
  const pid = typeof projectId === "string" ? projectId.trim() : "";
  const fid = typeof fileId === "string" ? fileId.trim() : "";
  if (!pid || !fid) return { ok: false, error: "Missing id" };

  if (isDemoProjectId(pid)) {
    return { ok: true };
  }

  const supabase = await createClient();
  const {
    data: { user },
    error: authErr,
  } = await supabase.auth.getUser();
  if (authErr || !user) return { ok: false, error: "Not signed in" };

  const { data: fileRow, error: fileErr } = await supabase
    .from("project_library_files")
    .select("id, project_id")
    .eq("id", fid)
    .eq("project_id", pid)
    .maybeSingle();

  if (fileErr || !fileRow) {
    return { ok: false, error: "File not found or you cannot access it" };
  }

  const { error } = await supabase.from("project_library_file_comment_reads").upsert(
    {
      file_id: fid,
      user_id: user.id,
      last_read_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    { onConflict: "file_id,user_id" }
  );

  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

/**
 * @param {string} projectId
 * @param {string} fileId
 * @param {string} body
 * @param {{
 *   storagePath?: string;
 *   durationMs?: number;
 *   mimeType?: string | null;
 *   sizeBytes?: number;
 *   waveform?: unknown;
 *   voice?: {
 *     storagePath: string;
 *     durationMs: number;
 *     mimeType?: string | null;
 *     sizeBytes: number;
 *     waveform?: unknown;
 *   };
 *   attachedFileId?: string;
 *   attachedFileIds?: string[];
 * } | null} [extras]
 */
export async function addLibraryFileComment(projectId, fileId, body, extras = null) {
  const supabase = await createClient();
  const {
    data: { user },
    error: authErr,
  } = await supabase.auth.getUser();
  if (authErr || !user) return { ok: false, error: "Not signed in" };

  const pid = typeof projectId === "string" ? projectId.trim() : "";
  const fid = typeof fileId === "string" ? fileId.trim() : "";
  const text = typeof body === "string" ? body.trim() : "";
  const normalized = normalizeCommentExtras(extras);
  const voiceRaw = normalized.voice;
  const voice =
    voiceRaw && typeof voiceRaw === "object" && voiceRaw.storagePath ? voiceRaw : null;
  const attachedFileIds = normalized.attachedFileIds;
  const attachedVersionIds = normalized.attachedVersionIds;

  if (!pid || !fid) {
    return { ok: false, error: "Missing id" };
  }
  if (!text && !voice?.storagePath && !attachedFileIds.length) {
    return { ok: false, error: "Write a message, add a file, or record a voice note." };
  }

  if (isDemoProjectId(pid)) {
    return getDemoBlockedResponse();
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

  const { data: proj } = await supabase
    .from("projects")
    .select("freelancer_id")
    .eq("id", pid)
    .maybeSingle();

  const ins = await insertLibraryFileCommentAndNotify(supabase, user, {
    projectId: pid,
    fileId: fid,
    fileDisplayName: fileRow.display_name,
    freelancerId: proj?.freelancer_id,
    authorDisplayName,
    authorAvatarUrl: profile?.avatar_url ?? null,
    bodyText: text,
    voice: voice?.storagePath
      ? {
          storagePath: String(voice.storagePath).trim(),
          durationMs: Number(voice.durationMs),
          mimeType: voice.mimeType != null ? String(voice.mimeType) : null,
          sizeBytes: Number(voice.sizeBytes) || 0,
          waveform: voice.waveform,
        }
      : null,
    attachedFileIds,
    attachedVersionIds,
  });

  if (!ins.ok) {
    return { ok: false, error: ins.error };
  }
  return { ok: true, comment: ins.comment };
}

/**
 * @param {string} projectId
 * @param {string} fileId
 * @param {string} displayName
 */
export async function renameLibraryFile(projectId, fileId, displayName) {
  const supabase = await createClient();
  const {
    data: { user },
    error: authErr,
  } = await supabase.auth.getUser();
  if (authErr || !user) return { ok: false, error: "Not signed in" };

  const pid = typeof projectId === "string" ? projectId.trim() : "";
  const fid = typeof fileId === "string" ? fileId.trim() : "";
  const nextName = sanitizeLibraryDisplayName(displayName);

  if (isDemoProjectId(pid)) {
    return getDemoBlockedResponse();
  }
  if (!pid || !fid) {
    return { ok: false, error: "Missing id" };
  }
  if (!nextName) {
    return { ok: false, error: "File name is required" };
  }

  const { data: existing, error: fetchErr } = await supabase
    .from("project_library_files")
    .select("id, display_name")
    .eq("id", fid)
    .eq("project_id", pid)
    .maybeSingle();

  if (fetchErr || !existing) {
    return { ok: false, error: fetchErr?.message || "File not found" };
  }
  if (existing.display_name === nextName) {
    return { ok: true, displayName: nextName };
  }

  const { data: updated, error } = await supabase
    .from("project_library_files")
    .update({ display_name: nextName })
    .eq("id", fid)
    .eq("project_id", pid)
    .select("id, display_name")
    .maybeSingle();

  if (error || !updated) {
    return { ok: false, error: error?.message || "Could not rename file" };
  }

  revalidateLibrary(pid);
  return { ok: true, displayName: updated.display_name || nextName };
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
  if (isDemoProjectId(pid)) {
    return getDemoBlockedResponse();
  }
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
    if (status === "revision_requested") {
      const { data: projNameRow } = await supabase
        .from("projects")
        .select("name")
        .eq("id", pid)
        .maybeSingle();
      enqueueFreelancerInboxFileRevision({
        freelancerId: projApproval.freelancer_id,
        projectId: pid,
        fileId: fid,
        fileName: fileMeta.display_name,
        actorName: actorDisplayName,
        actorAvatarUrl: profile?.avatar_url ?? null,
        projectName: projNameRow?.name,
        updatedAt: new Date().toISOString(),
      });
    }
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
  const pid = typeof projectId === "string" ? projectId.trim() : "";
  if (!pid) return { ok: false, error: "Missing project" };

  if (isDemoProjectId(pid)) {
    return getDemoStorageUsageResponse();
  }

  const supabase = await createClient();
  const {
    data: { user },
    error: authErr,
  } = await supabase.auth.getUser();
  if (authErr || !user) return { ok: false, error: "Not signed in" };

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
