import { readFile } from "fs/promises";
import path from "path";
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  getDemoLibraryFilePreviewUrl,
  isDemoProjectId,
  resolveDemoFreelancerFromSupabase,
  getDemoLibraryFiles,
} from "@/lib/data/demo-project";
import { isLibraryFilePreviewable } from "@/lib/library/file-preview";
import { inferFileKindFromMime } from "@/lib/library/infer-types";

const BUCKET = "project-library";

/**
 * Same-origin PDF stream for preview (mobile pdf.js + desktop iframe).
 */
export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const projectId = searchParams.get("projectId")?.trim() ?? "";
  const fileId = searchParams.get("fileId")?.trim() ?? "";
  const versionId = searchParams.get("versionId")?.trim() ?? "";

  if (!projectId || !fileId) {
    return NextResponse.json({ error: "Missing id" }, { status: 400 });
  }

  const supabase = await createClient();
  const {
    data: { user },
    error: authErr,
  } = await supabase.auth.getUser();

  if (authErr || !user) {
    return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  }

  if (isDemoProjectId(projectId)) {
    const fl = await resolveDemoFreelancerFromSupabase(supabase, user);
    const demoFiles = getDemoLibraryFiles(fl);
    const demoRow = demoFiles.find((f) => String(f.id) === fileId);
    const previewPath = getDemoLibraryFilePreviewUrl(fileId);

    if (
      previewPath &&
      demoRow &&
      isLibraryFilePreviewable(
        inferFileKindFromMime(demoRow.mime_type, demoRow.original_filename || demoRow.display_name),
        demoRow.mime_type
      )
    ) {
      if (previewPath.startsWith("/")) {
        try {
          const absolute = path.join(process.cwd(), "public", previewPath.replace(/^\//, ""));
          const bytes = await readFile(absolute);
          return pdfResponse(bytes);
        } catch {
          return NextResponse.json({ error: "Demo file not found" }, { status: 404 });
        }
      }
      return NextResponse.redirect(previewPath);
    }

    return NextResponse.json({ error: "File not found" }, { status: 404 });
  }

  let storagePath = null;
  let mimeType = null;
  let nameHint = null;

  if (versionId) {
    const { data: versionRow, error: versionErr } = await supabase
      .from("project_library_file_versions")
      .select("storage_object_path, mime_type, original_filename, file_id")
      .eq("id", versionId)
      .maybeSingle();

    if (versionErr || !versionRow || String(versionRow.file_id) !== fileId) {
      return NextResponse.json({ error: versionErr?.message || "Version not found" }, { status: 404 });
    }

    storagePath = versionRow.storage_object_path;
    mimeType = versionRow.mime_type;
    nameHint = versionRow.original_filename;
  } else {
    const { data: row, error: fetchErr } = await supabase
      .from("project_library_files")
      .select("storage_object_path, mime_type, original_filename, display_name")
      .eq("id", fileId)
      .eq("project_id", projectId)
      .maybeSingle();

    if (fetchErr || !row?.storage_object_path) {
      return NextResponse.json({ error: fetchErr?.message || "File not found" }, { status: 404 });
    }

    storagePath = row.storage_object_path;
    mimeType = row.mime_type;
    nameHint = row.original_filename || row.display_name;
  }

  const kind = inferFileKindFromMime(mimeType, nameHint);
  if (!isLibraryFilePreviewable(kind, mimeType) || kind !== "pdf") {
    return NextResponse.json({ error: "Preview not available for this file" }, { status: 400 });
  }

  const { data: blob, error: dlErr } = await supabase.storage
    .from(BUCKET)
    .download(storagePath);

  if (dlErr || !blob) {
    return NextResponse.json({ error: dlErr?.message || "Could not load file" }, { status: 500 });
  }

  const bytes = Buffer.from(await blob.arrayBuffer());
  return pdfResponse(bytes);
}

/** @param {Buffer} bytes */
function pdfResponse(bytes) {
  return new NextResponse(bytes, {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": "inline",
      "Cache-Control": "private, no-store",
    },
  });
}
