import { createClient } from "@/lib/supabase/client";
import {
  prepareProjectChatVoiceNoteUpload,
  sendProjectChatVoiceMessage,
} from "@/lib/actions/project-chat";
import { uploadProjectLibraryBlobWithProgress } from "@/lib/client/upload-project-library-blob";

function extFromMime(mime) {
  const m = String(mime || "").toLowerCase();
  if (m.includes("mp4") || m.includes("aac") || m.includes("m4a")) return "m4a";
  return "webm";
}

/**
 * Upload a chat voice note and create the message row.
 *
 * @param {{
 *   projectId: string;
 *   conversationId: string;
 *   body?: string;
 *   blob: Blob;
 *   waveform: number[] | null;
 *   durationMs: number;
 *   mimeType?: string;
 *   onProgress?: (s: { phase: "preparing" | "uploading" | "saving"; percent: number }) => void;
 * }} params
 */
export async function postProjectChatVoiceMessage({
  projectId,
  conversationId,
  body = "",
  blob,
  waveform,
  durationMs,
  mimeType,
  onProgress,
}) {
  const supabase = createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session?.access_token) {
    return { ok: false, error: "Session expired. Refresh and sign in again." };
  }

  onProgress?.({ phase: "preparing", percent: 2 });

  const prep = await prepareProjectChatVoiceNoteUpload({
    projectId: String(projectId),
    sizeBytes: blob.size,
    mimeType: mimeType || blob.type || null,
    extension: extFromMime(blob.type || mimeType),
  });
  if (!prep.ok || !prep.objectPath) {
    return { ok: false, error: prep.error || "Could not prepare voice upload" };
  }

  onProgress?.({ phase: "uploading", percent: 0 });

  const up = await uploadProjectLibraryBlobWithProgress({
    blob,
    objectPath: prep.objectPath,
    accessToken: session.access_token,
    onProgress: (p) => onProgress?.({ phase: "uploading", percent: p.percent }),
  });
  if (!up.ok) {
    return { ok: false, error: up.error || "Voice upload failed" };
  }

  onProgress?.({ phase: "saving", percent: 98 });

  const post = await sendProjectChatVoiceMessage(String(projectId), String(conversationId), {
    body: typeof body === "string" ? body.trim() : "",
    voice: {
      storagePath: prep.objectPath,
      durationMs,
      mimeType: blob.type || prep.mimeType || null,
      sizeBytes: prep.sizeBytes || blob.size,
      waveform,
    },
  });

  if (!post.ok || !post.message) {
    await supabase.storage.from("project-library").remove([prep.objectPath]);
    return { ok: false, error: post.error || "Could not save voice message" };
  }

  onProgress?.({ phase: "saving", percent: 100 });

  return { ok: true, message: post.message };
}
