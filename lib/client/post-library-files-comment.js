import { createClient } from "@/lib/supabase/client";
import {
  addLibraryFileComment,
  completeLibraryFileUpload,
  prepareLibraryFileUpload,
} from "@/lib/actions/project-library";
import { uploadProjectLibraryBlobWithProgress } from "@/lib/client/upload-project-library-blob";
import { MAX_DISCUSSION_COMMENT_FILES } from "@/lib/library/discussion-file-attachments";

/**
 * @typedef {{ fileName: string; fileId?: string; error?: string }} FileUploadOutcome
 */

/**
 * Upload one or more files to the library and attach them to a single discussion comment.
 *
 * @param {{
 *   projectId: string;
 *   fileId: string;
 *   body?: string;
 *   files: File[];
 *   needsApproval?: boolean;
 *   onProgress?: (s: {
 *     phase: "preparing" | "uploading" | "saving";
 *     percent: number;
 *     currentIndex: number;
 *     totalFiles: number;
 *     fileName: string;
 *   }) => void;
 * }} params
 */
export async function postLibraryFilesComment({
  projectId,
  fileId,
  body = "",
  files,
  needsApproval = false,
  onProgress,
}) {
  if (!files?.length) {
    return { ok: false, error: "Choose at least one file." };
  }
  if (files.length > MAX_DISCUSSION_COMMENT_FILES) {
    return {
      ok: false,
      error: `You can attach up to ${MAX_DISCUSSION_COMMENT_FILES} files per comment.`,
    };
  }

  const supabase = createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session?.access_token) {
    return { ok: false, error: "Session expired. Refresh and sign in again." };
  }

  const totalFiles = files.length;
  /** @type {FileUploadOutcome[]} */
  const succeeded = [];
  /** @type {FileUploadOutcome[]} */
  const failed = [];

  for (let index = 0; index < files.length; index++) {
    const file = files[index];
    const displayName = file.name?.trim() || "File";
    const fileProgress = (percent, phase) => {
      onProgress?.({
        phase,
        percent,
        currentIndex: index + 1,
        totalFiles,
        fileName: displayName,
      });
    };

    fileProgress(2, "preparing");

    const prep = await prepareLibraryFileUpload({
      projectId: String(projectId),
      displayName,
      originalFilename: file.name,
      mimeType: file.type || null,
      sizeBytes: file.size,
    });
    if (!prep.ok || !prep.objectPath) {
      failed.push({ fileName: displayName, error: prep.error || "Could not prepare upload" });
      continue;
    }

    fileProgress(0, "uploading");

    const up = await uploadProjectLibraryBlobWithProgress({
      blob: file,
      objectPath: prep.objectPath,
      accessToken: session.access_token,
      onProgress: (p) => fileProgress(p.percent, "uploading"),
    });
    if (!up.ok) {
      failed.push({ fileName: displayName, error: up.error || "Upload failed" });
      continue;
    }

    fileProgress(96, "saving");

    const completed = await completeLibraryFileUpload({
      projectId: String(projectId),
      objectPath: prep.objectPath,
      displayName,
      originalFilename: prep.normalizedOriginalFilename || file.name,
      mimeType: prep.mimeType || file.type || null,
      sizeBytes: prep.sizeBytes || file.size,
      needsApproval: totalFiles === 1 && Boolean(needsApproval),
      uploadOrigin: "discussion",
      originDiscussionFileId: String(fileId),
    });
    if (!completed.ok || !completed.fileId) {
      await supabase.storage.from("project-library").remove([prep.objectPath]);
      failed.push({
        fileName: displayName,
        error: completed.error || "Could not save file to library",
      });
      continue;
    }

    succeeded.push({ fileName: displayName, fileId: completed.fileId });
  }

  if (!succeeded.length) {
    return {
      ok: false,
      error: "No files could be uploaded. Check sizes and try again.",
      succeeded,
      failed,
    };
  }

  onProgress?.({
    phase: "saving",
    percent: 98,
    currentIndex: totalFiles,
    totalFiles,
    fileName: succeeded[succeeded.length - 1].fileName,
  });

  const post = await addLibraryFileComment(
    String(projectId),
    String(fileId),
    typeof body === "string" ? body.trim() : "",
    { attachedFileIds: succeeded.map((s) => String(s.fileId)) }
  );

  if (!post.ok || !post.comment) {
    return {
      ok: false,
      error: post.error || "Files uploaded but the comment could not be posted.",
      succeeded,
      failed,
    };
  }

  onProgress?.({
    phase: "saving",
    percent: 100,
    currentIndex: totalFiles,
    totalFiles,
    fileName: succeeded[succeeded.length - 1].fileName,
  });

  return {
    ok: true,
    comment: post.comment,
    succeeded,
    failed,
    libraryFileIds: succeeded.map((s) => s.fileId),
  };
}
