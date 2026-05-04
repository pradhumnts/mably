import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { performLibraryFileUpload } from "@/lib/library/perform-library-file-upload";

export const runtime = "nodejs";

/** Large Growth-tier library files (multipart body). Platform hosts may still impose lower caps. */
export const maxDuration = 300;

export async function POST(request) {
  try {
    const supabase = await createClient();
    const formData = await request.formData();
    const result = await performLibraryFileUpload(supabase, formData);
    return NextResponse.json(result, { status: result.ok ? 200 : 400 });
  } catch (e) {
    console.error("[project-library/upload]", e);
    return NextResponse.json(
      { ok: false, error: "Something went wrong while uploading. Please try again." },
      { status: 500 }
    );
  }
}
