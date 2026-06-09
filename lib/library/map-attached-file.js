import { inferFileKindFromMime } from "@/lib/library/infer-types";

/** @param {null | undefined | { id?: string; display_name?: string; mime_type?: string | null; original_filename?: string | null }} row */
export function mapAttachedLibraryFile(row) {
  if (!row?.id) return null;
  const name = row.display_name || row.original_filename || "File";
  return {
    id: String(row.id),
    display_name: name,
    mime_type: row.mime_type ?? null,
    original_filename: row.original_filename ?? null,
    type: inferFileKindFromMime(row.mime_type, row.original_filename || name),
  };
}
