"use server";

import { createClient } from "@/lib/supabase/server";
import { notifyPortalChatMessage } from "@/lib/notifications/trigger-portal-email";
import { enqueueFreelancerInboxChatMessage } from "@/lib/notifications/trigger-freelancer-inbox";
import { notifyPortalChatPushMessage } from "@/lib/notifications/trigger-portal-push";
import {
  isDemoProjectId,
  getDemoProjectChatBootstrap,
  getDemoBlockedResponse,
  resolveDemoFreelancerFromSupabase,
} from "@/lib/data/demo-project";
import { prepareLibraryVoiceNoteUpload } from "@/lib/actions/project-library";
import {
  CHAT_VOICE_NOTES_STORAGE_SUBPREFIX,
  MAX_VOICE_NOTE_MS,
} from "@/lib/library/voice-note-constants";
import { formatVoiceNoteDurationLabel } from "@/lib/library/voice-note-format";
import { normalizeVoiceWaveformPeaks } from "@/lib/library/normalize-voice-waveform";

const MESSAGE_PAGE = 150;

const MESSAGE_COLUMNS =
  "id, conversation_id, author_id, author_display_name, author_avatar_url, body, created_at, voice_note_storage_path, voice_note_duration_ms, voice_note_mime_type, voice_note_size_bytes, voice_note_waveform, voice_note_transcript";

function normalizeVoiceWaveformForDb(raw) {
  return normalizeVoiceWaveformPeaks(raw);
}

function assertChatVoiceObjectPath(projectId, path) {
  const pid = String(projectId || "").trim();
  const p = String(path || "").trim();
  if (!pid || !p) return false;
  const prefix = `${pid}/${CHAT_VOICE_NOTES_STORAGE_SUBPREFIX}/`;
  if (!p.startsWith(prefix)) return false;
  if (p.includes("..") || p.includes("\\")) return false;
  return true;
}

function mapMessageRow(row) {
  return {
    id: row.id,
    conversationId: row.conversation_id,
    authorId: row.author_id,
    authorDisplayName: row.author_display_name ?? "",
    authorAvatarUrl: row.author_avatar_url ?? null,
    body: row.body,
    createdAt: row.created_at,
    voiceNoteStoragePath: row.voice_note_storage_path ?? null,
    voiceNoteDurationMs: row.voice_note_duration_ms ?? null,
    voiceNoteMimeType: row.voice_note_mime_type ?? null,
    voiceNoteSizeBytes: row.voice_note_size_bytes ?? null,
    voiceNoteWaveform: normalizeVoiceWaveformPeaks(row.voice_note_waveform),
    voiceNoteTranscript: row.voice_note_transcript ?? null,
  };
}

/**
 * @param {ReturnType<typeof mapMessageRow>} m
 * @param {{ listened?: boolean }} [opts]
 */
function uiMessageFromMapped(m, opts = {}) {
  const hasVoice = Boolean(m.voiceNoteStoragePath);
  return {
    id: m.id,
    content: m.body ?? "",
    authorId: m.authorId,
    createdAt: m.createdAt,
    user: {
      name: m.authorDisplayName || "Member",
    },
    authorAvatarUrl: m.authorAvatarUrl,
    voiceNote: hasVoice
      ? {
          storagePath: m.voiceNoteStoragePath,
          durationMs: Number(m.voiceNoteDurationMs) || 0,
          waveform: Array.isArray(m.voiceNoteWaveform) ? m.voiceNoteWaveform : null,
          transcript: m.voiceNoteTranscript ?? null,
          listened: Boolean(opts.listened),
        }
      : null,
  };
}

function uiMessageFromRow(row, opts = {}) {
  return uiMessageFromMapped(mapMessageRow(row), opts);
}

/**
 * @param {import("@supabase/supabase-js").SupabaseClient} supabase
 * @param {string} userId
 * @param {object[]} rows
 */
async function uiMessagesWithVoiceListened(supabase, userId, rows) {
  const mapped = (rows ?? []).map(mapMessageRow);
  const voiceIds = mapped.filter((m) => m.voiceNoteStoragePath).map((m) => m.id);
  let listened = new Set();
  if (voiceIds.length) {
    const { data: listenRows, error: lErr } = await supabase
      .from("project_message_voice_listens")
      .select("message_id")
      .eq("user_id", userId)
      .in("message_id", voiceIds);
    if (!lErr) {
      listened = new Set((listenRows ?? []).map((r) => r.message_id));
    }
  }
  return mapped.map((m) =>
    uiMessageFromMapped(m, {
      listened: m.voiceNoteStoragePath ? listened.has(m.id) : false,
    })
  );
}

async function fetchAuthorProfile(supabase, userId) {
  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, email, avatar_url")
    .eq("id", userId)
    .maybeSingle();

  const authorDisplayName =
    (profile?.full_name && profile.full_name.trim()) ||
    (profile?.email && profile.email.split("@")[0]) ||
    "Member";

  return {
    authorDisplayName,
    authorAvatarUrl: profile?.avatar_url ?? null,
  };
}

/**
 * @param {string} projectId
 */
export async function getProjectChatBootstrap(projectId) {
  const pid = typeof projectId === "string" ? projectId.trim() : "";
  if (!pid) {
    return { ok: false, error: "Missing project" };
  }

  if (isDemoProjectId(pid)) {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    const fl = await resolveDemoFreelancerFromSupabase(supabase, user);
    return getDemoProjectChatBootstrap(fl);
  }

  const supabase = await createClient();
  const {
    data: { user },
    error: authErr,
  } = await supabase.auth.getUser();

  if (authErr || !user) {
    return { ok: false, error: "Not signed in" };
  }

  const { data: project, error: pErr } = await supabase
    .from("projects")
    .select(
      "id, freelancer_id, name, logo_url, client_name_snapshot, client_email_snapshot, client_avatar_snapshot, freelancer_display_name, freelancer_avatar_url"
    )
    .eq("id", pid)
    .maybeSingle();

  if (pErr || !project) {
    return { ok: false, error: pErr?.message || "Project not found" };
  }

  const { data: conv, error: cErr } = await supabase
    .from("project_conversations")
    .select("id")
    .eq("project_id", pid)
    .maybeSingle();

  if (cErr || !conv) {
    return { ok: false, error: cErr?.message || "Chat is not available for this project yet." };
  }

  const isFreelancer = project.freelancer_id === user.id;
  const memberRole = isFreelancer ? "freelancer" : "client";

  const { error: memErr } = await supabase.from("project_conversation_members").upsert(
    {
      conversation_id: conv.id,
      user_id: user.id,
      role: memberRole,
    },
    { onConflict: "conversation_id,user_id" }
  );

  if (memErr) {
    return { ok: false, error: memErr.message };
  }

  let msgRows;
  let mErr;
  ({ data: msgRows, error: mErr } = await supabase
    .from("project_messages")
    .select(MESSAGE_COLUMNS)
    .eq("conversation_id", conv.id)
    .order("created_at", { ascending: false })
    .limit(MESSAGE_PAGE));

  if (mErr) {
    const missingVoice =
      mErr.code === "42703" ||
      String(mErr.message || "")
        .toLowerCase()
        .includes("voice_note");
    if (missingVoice) {
      ({ data: msgRows, error: mErr } = await supabase
        .from("project_messages")
        .select(
          "id, conversation_id, author_id, author_display_name, author_avatar_url, body, created_at"
        )
        .eq("conversation_id", conv.id)
        .order("created_at", { ascending: false })
        .limit(MESSAGE_PAGE));
    }
  }

  if (mErr) {
    return { ok: false, error: mErr.message };
  }

  const chronological = await uiMessagesWithVoiceListened(
    supabase,
    user.id,
    (msgRows ?? []).slice().reverse()
  );

  const { data: readRow } = await supabase
    .from("project_conversation_reads")
    .select("last_read_at")
    .eq("conversation_id", conv.id)
    .eq("user_id", user.id)
    .maybeSingle();

  const since = readRow?.last_read_at ?? "1970-01-01T00:00:00.000Z";

  const { count: unreadCount, error: uErr } = await supabase
    .from("project_messages")
    .select("id", { count: "exact", head: true })
    .eq("conversation_id", conv.id)
    .neq("author_id", user.id)
    .gt("created_at", since);

  if (uErr) {
    return { ok: false, error: uErr.message };
  }

  return {
    ok: true,
    conversationId: conv.id,
    currentUserId: user.id,
    messages: chronological,
    unreadCount: unreadCount ?? 0,
    header: {
      projectName: project.name ?? "Project",
      projectLogo: project.logo_url ?? null,
      clientName: project.client_name_snapshot?.trim() || "Client",
      clientAvatar: project.client_avatar_snapshot ?? null,
      freelancerName: project.freelancer_display_name?.trim() || "Freelancer",
      freelancerAvatar: project.freelancer_avatar_url ?? null,
    },
  };
}

/**
 * Freelancer universal inbox — one row per project conversation with preview + unread.
 * @returns {Promise<{ ok: true, conversations: object[] } | { ok: false, error: string }>}
 */
export async function listMyProjectConversations() {
  const supabase = await createClient();
  const {
    data: { user },
    error: authErr,
  } = await supabase.auth.getUser();

  if (authErr || !user) {
    return { ok: false, error: "Not signed in" };
  }

  const { data: projects, error: pErr } = await supabase
    .from("projects")
    .select(
      "id, name, logo_url, client_name_snapshot, client_avatar_snapshot, updated_at"
    )
    .eq("freelancer_id", user.id)
    .order("updated_at", { ascending: false });

  if (pErr) {
    return { ok: false, error: pErr.message };
  }

  const projectRows = (projects ?? []).filter((p) => !isDemoProjectId(p.id));
  if (!projectRows.length) {
    return { ok: true, conversations: [] };
  }

  const projectIds = projectRows.map((p) => p.id);
  const projectById = new Map(projectRows.map((p) => [p.id, p]));

  const { data: convs, error: cErr } = await supabase
    .from("project_conversations")
    .select("id, project_id")
    .in("project_id", projectIds);

  if (cErr) {
    return { ok: false, error: cErr.message };
  }

  if (!convs?.length) {
    return { ok: true, conversations: [] };
  }

  const conversationIds = convs.map((c) => c.id);

  const { data: readRows } = await supabase
    .from("project_conversation_reads")
    .select("conversation_id, last_read_at")
    .eq("user_id", user.id)
    .in("conversation_id", conversationIds);

  const readByConv = new Map(
    (readRows ?? []).map((r) => [r.conversation_id, r.last_read_at])
  );

  const enriched = await Promise.all(
    convs.map(async (conv) => {
      const project = projectById.get(conv.project_id);
      if (!project) return null;

      const since = readByConv.get(conv.id) ?? "1970-01-01T00:00:00.000Z";

      const [{ data: lastMsg }, { count: unreadCount }] = await Promise.all([
        supabase
          .from("project_messages")
          .select(
            "id, body, author_id, created_at, voice_note_storage_path, author_display_name"
          )
          .eq("conversation_id", conv.id)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle(),
        supabase
          .from("project_messages")
          .select("id", { count: "exact", head: true })
          .eq("conversation_id", conv.id)
          .neq("author_id", user.id)
          .gt("created_at", since),
      ]);

      const isOwn = lastMsg?.author_id === user.id;
      let preview = "";
      if (lastMsg?.voice_note_storage_path) {
        preview = isOwn ? "You: Voice note" : "Voice note";
      } else if (lastMsg?.body?.trim()) {
        const text = lastMsg.body.trim().replace(/\s+/g, " ");
        preview = isOwn ? `You: ${text}` : text;
      } else {
        preview = "No messages yet";
      }

      return {
        conversationId: conv.id,
        projectId: project.id,
        projectName: project.name?.trim() || "Project",
        projectLogo: project.logo_url ?? null,
        clientName: project.client_name_snapshot?.trim() || "Client",
        clientAvatar: project.client_avatar_snapshot ?? null,
        preview: preview.length > 120 ? `${preview.slice(0, 117)}…` : preview,
        lastMessageAt: lastMsg?.created_at ?? project.updated_at ?? null,
        unreadCount: unreadCount ?? 0,
      };
    })
  );

  const conversations = enriched
    .filter(Boolean)
    .sort((a, b) => {
      const ta = a.lastMessageAt ? new Date(a.lastMessageAt).getTime() : 0;
      const tb = b.lastMessageAt ? new Date(b.lastMessageAt).getTime() : 0;
      return tb - ta;
    });

  return { ok: true, conversations };
}

/**
 * @param {string} projectId
 * @param {string} conversationId
 */
export async function markProjectChatRead(projectId, conversationId) {
  const pid = typeof projectId === "string" ? projectId.trim() : "";
  const cid = typeof conversationId === "string" ? conversationId.trim() : "";
  if (!pid || !cid) {
    return { ok: false, error: "Missing chat" };
  }

  if (isDemoProjectId(pid)) {
    return { ok: true };
  }

  const supabase = await createClient();
  const {
    data: { user },
    error: authErr,
  } = await supabase.auth.getUser();

  if (authErr || !user) {
    return { ok: false, error: "Not signed in" };
  }

  const { data: conv, error: convErr } = await supabase
    .from("project_conversations")
    .select("id, project_id")
    .eq("id", cid)
    .maybeSingle();

  if (convErr || !conv || conv.project_id !== pid) {
    return { ok: false, error: "Invalid conversation" };
  }

  const { error } = await supabase.from("project_conversation_reads").upsert(
    {
      conversation_id: cid,
      user_id: user.id,
      last_read_at: new Date().toISOString(),
    },
    { onConflict: "conversation_id,user_id" }
  );

  if (error) {
    return { ok: false, error: error.message };
  }

  return { ok: true };
}

/**
 * Mark all messages in a project's chat read (freelancer notification dismiss).
 * @param {string} projectId
 */
export async function markProjectChatReadByProjectId(projectId) {
  const supabase = await createClient();
  const pid = typeof projectId === "string" ? projectId.trim() : "";
  if (!pid) return { ok: false, error: "Missing project" };

  if (isDemoProjectId(pid)) {
    return { ok: true };
  }

  const { data: conv, error: convErr } = await supabase
    .from("project_conversations")
    .select("id")
    .eq("project_id", pid)
    .maybeSingle();

  if (convErr) {
    return { ok: false, error: convErr.message };
  }
  if (!conv?.id) {
    return { ok: true };
  }

  return markProjectChatRead(pid, conv.id);
}

/**
 * Reserve storage for a chat voice note (same library quota as file voice notes).
 *
 * @param {{
 *   projectId: string;
 *   sizeBytes: number;
 *   mimeType?: string | null;
 *   extension?: string | null;
 * }} payload
 */
export async function prepareProjectChatVoiceNoteUpload(payload) {
  return prepareLibraryVoiceNoteUpload({
    ...payload,
    storageSubprefix: CHAT_VOICE_NOTES_STORAGE_SUBPREFIX,
  });
}

/**
 * @param {string} projectId
 * @param {string} messageId
 */
export async function getProjectChatVoiceSignedUrl(projectId, messageId) {
  const supabase = await createClient();
  const {
    data: { user },
    error: authErr,
  } = await supabase.auth.getUser();
  if (authErr || !user) return { ok: false, error: "Not signed in" };

  const pid = String(projectId || "").trim();
  const mid = String(messageId || "").trim();
  if (!pid || !mid) return { ok: false, error: "Missing id" };

  if (isDemoProjectId(pid)) {
    return { ok: false, error: "Voice notes are not available in the demo project." };
  }

  const { data: row, error } = await supabase
    .from("project_messages")
    .select("voice_note_storage_path, conversation_id")
    .eq("id", mid)
    .maybeSingle();

  if (error || !row?.voice_note_storage_path) {
    return { ok: false, error: "Voice note not found" };
  }

  const { data: conv } = await supabase
    .from("project_conversations")
    .select("project_id")
    .eq("id", row.conversation_id)
    .maybeSingle();

  if (!conv || conv.project_id !== pid) {
    return { ok: false, error: "Voice note not found" };
  }

  const { data: signed, error: signErr } = await supabase.storage
    .from("project-library")
    .createSignedUrl(row.voice_note_storage_path, 3600);

  if (signErr || !signed?.signedUrl) {
    return { ok: false, error: signErr?.message || "Could not create playback link" };
  }

  return { ok: true, url: signed.signedUrl };
}

/**
 * @param {string} projectId
 * @param {string} messageId
 */
export async function markProjectChatVoiceListened(projectId, messageId) {
  const supabase = await createClient();
  const {
    data: { user },
    error: authErr,
  } = await supabase.auth.getUser();
  if (authErr || !user) return { ok: false, error: "Not signed in" };

  const pid = String(projectId || "").trim();
  const mid = String(messageId || "").trim();
  if (!pid || !mid) return { ok: false, error: "Missing id" };

  if (isDemoProjectId(pid)) {
    return { ok: true };
  }

  const { data: msg, error: mErr } = await supabase
    .from("project_messages")
    .select("id, voice_note_storage_path, conversation_id")
    .eq("id", mid)
    .maybeSingle();

  if (mErr || !msg?.voice_note_storage_path) {
    return { ok: false, error: "Voice note not found" };
  }

  const { data: conv } = await supabase
    .from("project_conversations")
    .select("project_id")
    .eq("id", msg.conversation_id)
    .maybeSingle();

  if (!conv || conv.project_id !== pid) {
    return { ok: false, error: "Voice note not found" };
  }

  const { error } = await supabase.from("project_message_voice_listens").upsert(
    {
      message_id: mid,
      user_id: user.id,
    },
    { onConflict: "message_id,user_id" }
  );

  if (error) {
    return { ok: false, error: error.message };
  }

  return { ok: true };
}

/**
 * Remove a chat voice note from storage; delete the message or keep text only.
 *
 * @param {string} projectId
 * @param {string} messageId
 */
export async function deleteProjectChatVoiceMessage(projectId, messageId) {
  const supabase = await createClient();
  const {
    data: { user },
    error: authErr,
  } = await supabase.auth.getUser();
  if (authErr || !user) return { ok: false, error: "Not signed in" };

  const pid = String(projectId || "").trim();
  const mid = String(messageId || "").trim();
  if (!pid || !mid) return { ok: false, error: "Missing id" };

  if (isDemoProjectId(pid)) {
    return getDemoBlockedResponse();
  }

  const { data: row, error: fetchErr } = await supabase
    .from("project_messages")
    .select("id, body, voice_note_storage_path, conversation_id")
    .eq("id", mid)
    .maybeSingle();

  if (fetchErr || !row?.voice_note_storage_path) {
    return { ok: false, error: fetchErr?.message || "Voice message not found" };
  }

  const { data: conv } = await supabase
    .from("project_conversations")
    .select("project_id")
    .eq("id", row.conversation_id)
    .maybeSingle();

  if (!conv || conv.project_id !== pid) {
    return { ok: false, error: "Voice message not found" };
  }

  const storagePath = String(row.voice_note_storage_path).trim();
  if (!assertChatVoiceObjectPath(pid, storagePath)) {
    return { ok: false, error: "Invalid voice recording path" };
  }

  const { error: rmErr } = await supabase.storage.from("project-library").remove([storagePath]);
  if (rmErr) {
    return { ok: false, error: rmErr.message || "Could not remove recording from storage" };
  }

  const hasText = typeof row.body === "string" && row.body.trim().length > 0;

  if (hasText) {
    const { data: updated, error: upErr } = await supabase
      .from("project_messages")
      .update({
        voice_note_storage_path: null,
        voice_note_duration_ms: null,
        voice_note_mime_type: null,
        voice_note_size_bytes: null,
        voice_note_waveform: null,
        voice_note_transcript: null,
      })
      .eq("id", mid)
      .select(MESSAGE_COLUMNS)
      .single();

    if (upErr) {
      return { ok: false, error: upErr.message || "Could not update message" };
    }

    return {
      ok: true,
      deletedEntireMessage: false,
      messageId: mid,
      message: updated ? uiMessageFromRow(updated, { listened: false }) : null,
    };
  }

  const { error: delErr } = await supabase.from("project_messages").delete().eq("id", mid);

  if (delErr) {
    return { ok: false, error: delErr.message || "Could not delete message" };
  }

  return { ok: true, deletedEntireMessage: true, messageId: mid };
}

/**
 * @param {string} projectId
 * @param {string} conversationId
 * @param {{
 *   body?: string;
 *   voice: {
 *     storagePath: string;
 *     durationMs: number;
 *     mimeType?: string | null;
 *     sizeBytes: number;
 *     waveform?: number[] | null;
 *   };
 * }} payload
 */
export async function sendProjectChatVoiceMessage(projectId, conversationId, payload) {
  const supabase = await createClient();
  const {
    data: { user },
    error: authErr,
  } = await supabase.auth.getUser();

  if (authErr || !user) {
    return { ok: false, error: "Not signed in" };
  }

  const pid = typeof projectId === "string" ? projectId.trim() : "";
  const cid = typeof conversationId === "string" ? conversationId.trim() : "";
  const text = typeof payload?.body === "string" ? payload.body.trim() : "";
  const voice = payload?.voice;

  if (!pid || !cid || !voice?.storagePath) {
    return { ok: false, error: "Voice message is invalid" };
  }
  if (text.length > 5000) {
    return { ok: false, error: "Message is too long" };
  }

  const durationMs = Math.round(Number(voice.durationMs));
  if (!Number.isFinite(durationMs) || durationMs <= 0 || durationMs > MAX_VOICE_NOTE_MS) {
    return { ok: false, error: "Recording length is invalid" };
  }

  if (!assertChatVoiceObjectPath(pid, voice.storagePath)) {
    return { ok: false, error: "Invalid voice recording path" };
  }

  if (isDemoProjectId(pid)) {
    return getDemoBlockedResponse({ message: null });
  }

  const { data: conv, error: cErr } = await supabase
    .from("project_conversations")
    .select("id, project_id")
    .eq("id", cid)
    .maybeSingle();

  if (cErr || !conv || conv.project_id !== pid) {
    return { ok: false, error: "Invalid conversation" };
  }

  const { authorDisplayName, authorAvatarUrl } = await fetchAuthorProfile(supabase, user.id);

  const insertRow = {
    conversation_id: cid,
    author_id: user.id,
    author_display_name: authorDisplayName,
    author_avatar_url: authorAvatarUrl,
    body: text || null,
    voice_note_storage_path: String(voice.storagePath).trim(),
    voice_note_duration_ms: durationMs,
    voice_note_mime_type: voice.mimeType ? String(voice.mimeType).trim().slice(0, 120) : null,
    voice_note_size_bytes: Math.round(Number(voice.sizeBytes)) || null,
    voice_note_waveform: normalizeVoiceWaveformForDb(voice.waveform),
  };

  const { data: inserted, error } = await supabase
    .from("project_messages")
    .insert(insertRow)
    .select(MESSAGE_COLUMNS)
    .maybeSingle();

  if (error) {
    return { ok: false, error: error.message };
  }

  const { data: projChat } = await supabase
    .from("projects")
    .select("freelancer_id, name")
    .eq("id", pid)
    .maybeSingle();

  if (inserted && projChat?.freelancer_id) {
    const preview = text || `Voice message (${formatVoiceNoteDurationLabel(durationMs)})`;
    void notifyPortalChatMessage({
      projectId: pid,
      projectFreelancerId: projChat.freelancer_id,
      actorUserId: user.id,
      actorName: authorDisplayName,
      actorAvatarUrl: authorAvatarUrl,
      preview,
    });
    enqueueFreelancerInboxChatMessage({
      projectId: pid,
      freelancerId: projChat.freelancer_id,
      messageId: inserted.id,
      actorUserId: user.id,
      actorName: authorDisplayName,
      actorAvatarUrl: authorAvatarUrl,
      preview,
      createdAt: inserted.created_at,
      projectName: projChat.name,
    });
    notifyPortalChatPushMessage({
      projectId: pid,
      projectFreelancerId: projChat.freelancer_id,
      actorUserId: user.id,
      actorName: authorDisplayName,
      preview,
      isVoice: true,
      voiceDurationMs: durationMs,
    });
  }

  return { ok: true, message: inserted ? uiMessageFromRow(inserted, { listened: false }) : null };
}

/**
 * @param {string} projectId
 * @param {string} conversationId
 * @param {string} body
 */
export async function sendProjectChatMessage(projectId, conversationId, body) {
  const supabase = await createClient();
  const {
    data: { user },
    error: authErr,
  } = await supabase.auth.getUser();

  if (authErr || !user) {
    return { ok: false, error: "Not signed in" };
  }

  const pid = typeof projectId === "string" ? projectId.trim() : "";
  const cid = typeof conversationId === "string" ? conversationId.trim() : "";
  const text = typeof body === "string" ? body.trim() : "";
  if (!pid || !cid || !text) {
    return { ok: false, error: "Message cannot be empty" };
  }
  if (text.length > 5000) {
    return { ok: false, error: "Message is too long" };
  }

  if (isDemoProjectId(pid)) {
    return getDemoBlockedResponse({ message: null });
  }

  const { data: conv, error: cErr } = await supabase
    .from("project_conversations")
    .select("id, project_id")
    .eq("id", cid)
    .maybeSingle();

  if (cErr || !conv || conv.project_id !== pid) {
    return { ok: false, error: "Invalid conversation" };
  }

  const { authorDisplayName, authorAvatarUrl } = await fetchAuthorProfile(supabase, user.id);

  const { data: inserted, error } = await supabase
    .from("project_messages")
    .insert({
      conversation_id: cid,
      author_id: user.id,
      author_display_name: authorDisplayName,
      author_avatar_url: authorAvatarUrl,
      body: text,
    })
    .select(MESSAGE_COLUMNS)
    .maybeSingle();

  if (error) {
    return { ok: false, error: error.message };
  }

  const { data: projChat } = await supabase
    .from("projects")
    .select("freelancer_id, name")
    .eq("id", pid)
    .maybeSingle();

  if (inserted && projChat?.freelancer_id) {
    void notifyPortalChatMessage({
      projectId: pid,
      projectFreelancerId: projChat.freelancer_id,
      actorUserId: user.id,
      actorName: authorDisplayName,
      actorAvatarUrl: authorAvatarUrl,
      preview: text,
    });
    enqueueFreelancerInboxChatMessage({
      projectId: pid,
      freelancerId: projChat.freelancer_id,
      messageId: inserted.id,
      actorUserId: user.id,
      actorName: authorDisplayName,
      actorAvatarUrl: authorAvatarUrl,
      preview: text,
      createdAt: inserted.created_at,
      projectName: projChat.name,
    });
    notifyPortalChatPushMessage({
      projectId: pid,
      projectFreelancerId: projChat.freelancer_id,
      actorUserId: user.id,
      actorName: authorDisplayName,
      preview: text,
    });
  }

  return { ok: true, message: inserted ? uiMessageFromRow(inserted) : null };
}
