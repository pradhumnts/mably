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

  const { data: row, error: fetchErr } = await supabase
    .from("project_library_files")
    .select("storage_object_path, mime_type, original_filename, display_name")
    .eq("id", fileId)
    .eq("project_id", projectId)
    .maybeSingle();

  if (fetchErr || !row?.storage_object_path) {
    return NextResponse.json({ error: fetchErr?.message || "File not found" }, { status: 404 });
  }

  const kind = inferFileKindFromMime(row.mime_type, row.original_filename || row.display_name);
  if (!isLibraryFilePreviewable(kind, row.mime_type) || kind !== "pdf") {
    return NextResponse.json({ error: "Preview not available for this file" }, { status: 400 });
  }

  const { data: blob, error: dlErr } = await supabase.storage
    .from(BUCKET)
    .download(row.storage_object_path);

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
