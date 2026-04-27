"use server";

import { createClient } from "@/lib/supabase/server";
import { notifyPortalChatMessage } from "@/lib/notifications/trigger-portal-email";

const MESSAGE_PAGE = 150;

function mapMessageRow(row) {
  return {
    id: row.id,
    conversationId: row.conversation_id,
    authorId: row.author_id,
    authorDisplayName: row.author_display_name ?? "",
    authorAvatarUrl: row.author_avatar_url ?? null,
    body: row.body,
    createdAt: row.created_at,
  };
}

function uiMessageFromRow(row) {
  const m = mapMessageRow(row);
  return {
    id: m.id,
    content: m.body,
    authorId: m.authorId,
    createdAt: m.createdAt,
    user: {
      name: m.authorDisplayName || "Member",
    },
    authorAvatarUrl: m.authorAvatarUrl,
  };
}

/**
 * @param {string} projectId
 */
export async function getProjectChatBootstrap(projectId) {
  const supabase = await createClient();
  const {
    data: { user },
    error: authErr,
  } = await supabase.auth.getUser();

  if (authErr || !user) {
    return { ok: false, error: "Not signed in" };
  }

  const pid = typeof projectId === "string" ? projectId.trim() : "";
  if (!pid) {
    return { ok: false, error: "Missing project" };
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

  const { data: msgRows, error: mErr } = await supabase
    .from("project_messages")
    .select("id, conversation_id, author_id, author_display_name, author_avatar_url, body, created_at")
    .eq("conversation_id", conv.id)
    .order("created_at", { ascending: false })
    .limit(MESSAGE_PAGE);

  if (mErr) {
    return { ok: false, error: mErr.message };
  }

  const chronological = (msgRows ?? []).slice().reverse().map(uiMessageFromRow);

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
 * @param {string} projectId
 * @param {string} conversationId
 */
export async function markProjectChatRead(projectId, conversationId) {
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
  if (!pid || !cid) {
    return { ok: false, error: "Missing chat" };
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

  const { data: conv, error: cErr } = await supabase
    .from("project_conversations")
    .select("id, project_id")
    .eq("id", cid)
    .maybeSingle();

  if (cErr || !conv || conv.project_id !== pid) {
    return { ok: false, error: "Invalid conversation" };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, email, avatar_url")
    .eq("id", user.id)
    .maybeSingle();

  const authorDisplayName =
    (profile?.full_name && profile.full_name.trim()) ||
    (profile?.email && profile.email.split("@")[0]) ||
    "Member";

  const { data: inserted, error } = await supabase
    .from("project_messages")
    .insert({
      conversation_id: cid,
      author_id: user.id,
      author_display_name: authorDisplayName,
      author_avatar_url: profile?.avatar_url ?? null,
      body: text,
    })
    .select("id, conversation_id, author_id, author_display_name, author_avatar_url, body, created_at")
    .maybeSingle();

  if (error) {
    return { ok: false, error: error.message };
  }

  const { data: projChat } = await supabase
    .from("projects")
    .select("freelancer_id")
    .eq("id", pid)
    .maybeSingle();

  if (inserted && projChat?.freelancer_id) {
    void notifyPortalChatMessage({
      projectId: pid,
      projectFreelancerId: projChat.freelancer_id,
      actorUserId: user.id,
      actorName: authorDisplayName,
      actorAvatarUrl: profile?.avatar_url ?? null,
      preview: text,
    });
  }

  return { ok: true, message: inserted ? uiMessageFromRow(inserted) : null };
}
