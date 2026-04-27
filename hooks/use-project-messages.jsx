"use client";

import { createClient } from "@/lib/supabase/client";
import { sendProjectChatMessage } from "@/lib/actions/project-chat";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";

function mapRowFromDb(row) {
  return {
    id: row.id,
    content: row.body,
    authorId: row.author_id,
    createdAt: row.created_at,
    authorAvatarUrl: row.author_avatar_url,
    user: { name: row.author_display_name || "Member" },
  };
}

function mergeById(prev, incoming) {
  const byId = new Map();
  for (const m of prev) byId.set(m.id, m);
  for (const m of incoming) byId.set(m.id, m);
  return Array.from(byId.values()).sort((a, b) => String(a.createdAt).localeCompare(String(b.createdAt)));
}

/**
 * Persisted project chat + Supabase Realtime (postgres_changes on project_messages).
 * Falls back to periodic polling when Realtime is not subscribed (e.g. table not in publication).
 *
 * @param {{
 *   projectId: string;
 *   conversationId: string | null;
 *   currentUserId: string | null;
 *   initialMessages?: Array<{
 *     id: string;
 *     content: string;
 *     authorId: string;
 *     createdAt: string;
 *     user: { name: string };
 *     authorAvatarUrl?: string | null;
 *   }>;
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
            if (current.some((m) => m.id === mapped.id)) return current;
            let dropped = false;
            const filtered = current.filter((m) => {
              if (
                !dropped &&
                m.optimistic &&
                m.authorId === mapped.author_id &&
                m.content === mapped.body
              ) {
                dropped = true;
                return false;
              }
              return true;
            });
            return [...filtered, mapped];
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

  // If Postgres Realtime never subscribes, poll so chat still updates (publication / config issues).
  useEffect(() => {
    if (!conversationId || !currentUserId || isConnected) return;

    let intervalId;
    const startDelay = setTimeout(() => {
      if (realtimeOkRef.current) return;
      const tick = async () => {
        if (realtimeOkRef.current) return;
        const { data, error } = await supabase
          .from("project_messages")
          .select("id, author_id, author_display_name, author_avatar_url, body, created_at")
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

  return { messages, sendMessage, isConnected };
}
