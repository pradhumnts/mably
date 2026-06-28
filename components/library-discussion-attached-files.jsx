"use client";

import { LibraryCommentAttachedFile } from "@/components/library-comment-attached-file";

/**
 * Stacked file rows for discussion comments (single or multiple attachments).
 *
 * @param {{
 *   attachedFiles: Array<{
 *     id: string;
 *     display_name: string;
 *     type: string;
 *     mime_type?: string | null;
 *     version_id?: string | null;
 *     version_number?: number | null;
 *   }>;
 *   onPreview?: (file: {
 *     fileId: string;
 *     name: string;
 *     type: string;
 *     mimeType: string | null;
 *     versionId?: string | null;
 *     versionNumber?: number | null;
 *   }) => void;
 *   onDownload: (file: { id: string; display_name: string }) => void;
 * }} props
 */
export function LibraryDiscussionAttachedFiles({
  attachedFiles,
  onPreview,
  onDownload,
}) {
  if (!attachedFiles.length) return null;

  return (
    <div className="space-y-1.5">
      {attachedFiles.map((file, index) => (
        <LibraryCommentAttachedFile
          key={`${file.id}-${index}`}
          attachedFile={file}
          onPreview={
            onPreview && file.id !== "pending"
              ? () =>
                  onPreview({
                    fileId: String(file.id),
                    name: file.display_name,
                    type: file.type,
                    mimeType: file.mime_type ?? null,
                    versionId: file.version_id ? String(file.version_id) : null,
                    versionNumber: file.version_number ?? null,
                  })
              : undefined
          }
          onDownload={() => onDownload(file)}
        />
      ))}
    </div>
  );
}
