import { postLibraryFilesComment } from "@/lib/client/post-library-files-comment";

/**
 * Upload a single file to the library and attach it to a file discussion comment.
 *
 * @param {{
 *   projectId: string;
 *   fileId: string;
 *   body?: string;
 *   file: File;
 *   needsApproval?: boolean;
 *   onProgress?: (s: { phase: "preparing" | "uploading" | "saving"; percent: number }) => void;
 * }} params
 */
export async function postLibraryFileComment(params) {
  const { file, onProgress, ...rest } = params;
  const result = await postLibraryFilesComment({
    ...rest,
    files: [file],
    onProgress: onProgress
      ? (s) =>
          onProgress({
            phase: s.phase,
            percent: s.percent,
          })
      : undefined,
  });

  if (!result.ok) return result;

  return {
    ok: true,
    comment: result.comment,
    libraryFileId: result.libraryFileIds?.[0] ?? null,
    succeeded: result.succeeded,
    failed: result.failed,
  };
}
