import { revalidatePath } from "next/cache";
import {
  fetchFreelancerSubscriptionRowForBilling,
  getLibraryStorageCaps,
  sumFreelancerLibraryStorageBytes,
} from "@/lib/billing/library-storage";
import { PROJECT_ACTIVITY_EVENT_TYPES } from "@/lib/activity/project-activity-event-types";
import { recordProjectActivityEvent } from "@/lib/activity/record-project-activity-event";
import { notifyPortalLibraryFileUploaded } from "@/lib/notifications/trigger-portal-email";

const BUCKET = "project-library";

function revalidateLibrary(projectId) {
  revalidatePath(`/project/${projectId}/library/files`);
  revalidatePath(`/project/${projectId}/library/links`);
}

function sanitizeOriginalFilename(name) {
  const base = typeof name === "string" ? name : "";
  const cleaned = base.replace(/[/\\]+/g, "_").replace(/[^\w.\-() \u00C0-\u024F]+/gi, "_").trim();
  const out = cleaned || "file";
  return out.length > 200 ? out.slice(0, 200) : out;
}

/**
 * Shared library file upload (storage + DB + side effects). Used by the server action and the
 * multipart API route (for client upload progress via XHR).
 *
 * @param {import("@supabase/supabase-js").SupabaseClient} supabase
 * @param {FormData} formData
 * @returns {Promise<{ ok: true } | { ok: false; error: string }>}
 */
export async function performLibraryFileUpload(supabase, formData) {
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

  let bytes;
  try {
    bytes = Buffer.from(await blob.arrayBuffer());
  } catch {
    return { ok: false, error: "Could not read file" };
  }

  if (!bytes?.length) {
    return { ok: false, error: "File is empty" };
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
  if (bytes.length > caps.maxFileBytes) {
    return {
      ok: false,
      error: `This file is too large. Your plan allows up to ${caps.maxFileLabel} per file.`,
    };
  }

  const usedRes = await sumFreelancerLibraryStorageBytes(billingUserId, user.id);
  if (!usedRes.ok) {
    return { ok: false, error: usedRes.error };
  }

  if (usedRes.bytes + bytes.length > caps.totalBytes) {
    const usedGb = (usedRes.bytes / 1024 ** 3).toFixed(1);
    const capGb = (caps.totalBytes / 1024 ** 3).toFixed(0);
    return {
      ok: false,
      error: `Library storage is full for this account (${usedGb} / ${capGb} GB used across all projects). Remove files or upgrade your plan to continue.`,
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
      size_bytes: bytes.length,
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

  const fileId = insertedFile?.id ? String(insertedFile.id) : null;

  if (fileId && description) {
    const { seedLibraryFileUploadDiscussionComment } = await import(
      "@/lib/actions/project-library"
    );
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
