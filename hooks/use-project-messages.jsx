"use client";

import { createClient } from "@/lib/supabase/client";
import { sendProjectChatMessage } from "@/lib/actions/project-chat";
import { postProjectChatVoiceMessage } from "@/lib/client/post-project-chat-voice-message";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { normalizeVoiceWaveformPeaks } from "@/lib/library/normalize-voice-waveform";

const MESSAGE_SELECT =
  "id, author_id, author_display_name, author_avatar_url, body, created_at, voice_note_storage_path, voice_note_duration_ms, voice_note_mime_type, voice_note_size_bytes, voice_note_waveform, voice_note_transcript";

function mapRowFromDb(row) {
  const hasVoice = Boolean(row.voice_note_storage_path);
  return {
    id: row.id,
    content: row.body ?? "",
    authorId: row.author_id,
    createdAt: row.created_at,
    authorAvatarUrl: row.author_avatar_url,
    user: { name: row.author_display_name || "Member" },
    voiceNote: hasVoice
      ? {
          storagePath: row.voice_note_storage_path,
          durationMs: Number(row.voice_note_duration_ms) || 0,
          waveform: normalizeVoiceWaveformPeaks(row.voice_note_waveform),
          transcript: row.voice_note_transcript ?? null,
          listened: false,
        }
      : null,
  };
}

function mergeVoiceFields(prevMsg, nextMsg) {
  if (!prevMsg?.voiceNote && !nextMsg?.voiceNote) return nextMsg;
  if (!nextMsg?.voiceNote && prevMsg?.voiceNote) {
    return { ...nextMsg, voiceNote: prevMsg.voiceNote };
  }
  if (!prevMsg?.voiceNote || !nextMsg?.voiceNote) return nextMsg;

  const nextWf = normalizeVoiceWaveformPeaks(nextMsg.voiceNote.waveform);
  const prevWf = normalizeVoiceWaveformPeaks(prevMsg.voiceNote.waveform);

  return {
    ...nextMsg,
    voiceNote: {
      ...nextMsg.voiceNote,
      waveform: nextWf ?? prevWf ?? null,
      listened: nextMsg.voiceNote.listened ?? prevMsg.voiceNote.listened,
    },
  };
}

function mergeById(prev, incoming) {
  const byId = new Map();
  for (const m of prev) byId.set(m.id, m);
  for (const m of incoming) {
    const existing = byId.get(m.id);
    byId.set(m.id, existing ? mergeVoiceFields(existing, m) : m);
  }
  return Array.from(byId.values()).sort((a, b) => String(a.createdAt).localeCompare(String(b.createdAt)));
}

function enrichVoiceMessage(message, recordedWaveform) {
  if (!message?.voiceNote) return message;
  const fromServer = normalizeVoiceWaveformPeaks(message.voiceNote.waveform);
  const fromClient = normalizeVoiceWaveformPeaks(recordedWaveform);
  return {
    ...message,
    voiceNote: {
      ...message.voiceNote,
      waveform: fromServer ?? fromClient ?? null,
    },
  };
}

/**
 * @param {object} a
 * @param {object} b
 */
function matchesOptimisticMessage(a, b) {
  if (!a.optimistic || a.authorId !== b.authorId) return false;
  if (a.voiceNote?.storagePath === "pending" && b.voiceNote?.storagePath) {
    return true;
  }
  return a.content === b.content && !a.voiceNote && !b.voiceNote;
}

/**
 * Persisted project chat + Supabase Realtime (postgres_changes on project_messages).
 * Falls back to periodic polling when Realtime is not subscribed (e.g. table not in publication).
 *
 * @param {{
 *   projectId: string;
 *   conversationId: string | null;
 *   currentUserId: string | null;
 *   initialMessages?: Array<object>;
 *   onRemoteMessage?: () => void;
 *   senderDisplayName?: string;
 *   selfAvatarUrl?: string | null;
 * }} opts
 */
export function useProjectMessages({
  projectId,
  conversationId,
  currentUserId,
  initialMessages = [],
  onRemoteMessage,
  senderDisplayName = "You",
  selfAvatarUrl = null,
}) {
  const supabase = useMemo(() => createClient(), []);
  const [messages, setMessages] = useState(initialMessages);
  const [isConnected, setIsConnected] = useState(false);
  const realtimeOkRef = useRef(false);

  useEffect(() => {
    setMessages(initialMessages);
  }, [conversationId, initialMessages]);

  useEffect(() => {
    realtimeOkRef.current = false;
    if (!conversationId || !currentUserId) {
      setIsConnected(false);
      return;
    }

    const filter = `conversation_id=eq.${conversationId}`;

    const channel = supabase
      .channel(`project-messages:${conversationId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "project_messages",
          filter,
        },
        (payload) => {
          const row = payload.new;
          const mapped = mapRowFromDb(row);
          if (row.author_id !== currentUserId) {
            onRemoteMessage?.();
          }
          setMessages((current) => {
            if (current.some((m) => m.id === mapped.id)) {
              return current.map((m) =>
                m.id === mapped.id ? mergeVoiceFields(m, mapped) : m
              );
            }
            const optimistic = current.find((m) => matchesOptimisticMessage(m, mapped));
            const merged = optimistic ? mergeVoiceFields(optimistic, mapped) : mapped;
            const filtered = current.filter((m) => !matchesOptimisticMessage(m, mapped));
            return [...filtered, merged];
          });
        }
      )
      .subscribe((status) => {
        const ok = status === "SUBSCRIBED";
        realtimeOkRef.current = ok;
        setIsConnected(ok);
      });

    return () => {
      realtimeOkRef.current = false;
      void supabase.removeChannel(channel);
    };
  }, [conversationId, currentUserId, supabase, onRemoteMessage]);

  useEffect(() => {
    if (!conversationId || !currentUserId || isConnected) return;

    let intervalId;
    const startDelay = setTimeout(() => {
      if (realtimeOkRef.current) return;
      const tick = async () => {
        if (realtimeOkRef.current) return;
        const { data, error } = await supabase
          .from("project_messages")
          .select(MESSAGE_SELECT)
          .eq("conversation_id", conversationId)
          .order("created_at", { ascending: true })
          .limit(200);
        if (error || !data) return;
        const incoming = data.map(mapRowFromDb);
        setMessages((prev) => mergeById(prev, incoming));
      };
      void tick();
      intervalId = setInterval(() => void tick(), 10000);
    }, 6000);

    return () => {
      clearTimeout(startDelay);
      if (intervalId) clearInterval(intervalId);
    };
  }, [conversationId, currentUserId, isConnected, supabase]);

  const sendMessage = useCallback(
    async (content) => {
      const text = typeof content === "string" ? content.trim() : "";
      if (!conversationId || !projectId || !currentUserId || !text) return false;

      const tempId = `local:${crypto.randomUUID()}`;
      const optimistic = {
        id: tempId,
        content: text,
        authorId: currentUserId,
        createdAt: new Date().toISOString(),
        user: { name: (senderDisplayName || "You").trim() || "You" },
        authorAvatarUrl: selfAvatarUrl || null,
        optimistic: true,
      };

      setMessages((c) => [...c, optimistic]);

      const res = await sendProjectChatMessage(String(projectId), String(conversationId), text);
      if (!res.ok) {
        setMessages((c) => c.filter((m) => m.id !== tempId));
        toast.error(res.error || "Could not send message");
        return false;
      }

      setMessages((current) => {
        const without = current.filter((m) => m.id !== tempId);
        if (res.message && !without.some((m) => m.id === res.message.id)) {
          return [...without, res.message];
        }
        return without;
      });
      return true;
    },
    [conversationId, projectId, currentUserId, senderDisplayName, selfAvatarUrl]
  );

  const sendVoiceMessage = useCallback(
    async ({ blob, waveform, durationMs, body = "", mimeType }) => {
      if (!conversationId || !projectId || !currentUserId || !blob) return false;

      const tempId = `local:${crypto.randomUUID()}`;
      const text = typeof body === "string" ? body.trim() : "";
      const optimistic = {
        id: tempId,
        content: text,
        authorId: currentUserId,
        createdAt: new Date().toISOString(),
        user: { name: (senderDisplayName || "You").trim() || "You" },
        authorAvatarUrl: selfAvatarUrl || null,
        voiceNote: {
          storagePath: "pending",
          durationMs,
          waveform,
          listened: false,
        },
        voiceNoteLocalBlob: blob,
        voiceUploadState: { phase: "preparing", percent: 0 },
        optimistic: true,
      };

      setMessages((c) => [...c, optimistic]);

      const res = await postProjectChatVoiceMessage({
        projectId: String(projectId),
        conversationId: String(conversationId),
        body: text,
        blob,
        waveform,
        durationMs,
        mimeType: mimeType || blob.type,
        onProgress: (s) => {
          setMessages((current) =>
            current.map((m) =>
              m.id === tempId ? { ...m, voiceUploadState: s } : m
            )
          );
        },
      });

      if (!res.ok || !res.message) {
        setMessages((c) => c.filter((m) => m.id !== tempId));
        toast.error(res.error || "Could not send voice message");
        return false;
      }

      setMessages((current) => {
        const without = current.filter((m) => m.id !== tempId);
        const saved = enrichVoiceMessage(res.message, waveform);
        if (!without.some((m) => m.id === saved.id)) {
          return [...without, saved];
        }
        return without.map((m) => (m.id === saved.id ? mergeVoiceFields(m, saved) : m));
      });
      return true;
    },
    [conversationId, projectId, currentUserId, senderDisplayName, selfAvatarUrl]
  );

  const removeMessage = useCallback((messageId) => {
    const id = String(messageId || "");
    if (!id) return;
    setMessages((current) => current.filter((m) => m.id !== id));
  }, []);

  const replaceMessage = useCallback((messageId, nextMessage) => {
    const id = String(messageId || "");
    if (!id || !nextMessage) return;
    setMessages((current) =>
      current.map((m) => (m.id === id ? { ...nextMessage, optimistic: false } : m))
    );
  }, []);

  return {
    messages,
    sendMessage,
    sendVoiceMessage,
    removeMessage,
    replaceMessage,
    isConnected,
  };
}
