/**
 * @typedef {{
 *   project_id: string;
 *   conversation_id: string;
 *   unread_count: number;
 *   last_message_id: string | null;
 *   last_message_body: string | null;
 *   last_message_author_id: string | null;
 *   last_message_author_name: string | null;
 *   last_message_created_at: string | null;
 *   last_message_has_voice: boolean;
 *   latest_unread_id: string | null;
 *   latest_unread_created_at: string | null;
 *   latest_unread_author_name: string | null;
 *   latest_unread_author_avatar: string | null;
 * }} ProjectChatSummary
 */

/**
 * Per-conversation latest message + unread state for the signed-in user, in one query.
 * Returns null when the RPC is unavailable (e.g. migration not applied yet) so callers
 * can fall back to per-conversation queries.
 *
 * @param {import("@supabase/supabase-js").SupabaseClient} supabase
 * @param {string[]} projectIds
 * @returns {Promise<ProjectChatSummary[] | null>}
 */
export async function fetchProjectChatSummaries(supabase, projectIds) {
  if (!projectIds.length) return [];

  const { data, error } = await supabase.rpc("project_chat_summaries", {
    p_project_ids: projectIds,
  });

  if (error) {
    const missing = error.code === "PGRST202" || error.code === "42883";
    if (!missing) {
      console.error("[chat] project_chat_summaries:", error.message);
    }
    return null;
  }

  return (data ?? []).map((row) => ({
    ...row,
    unread_count: Number(row.unread_count) || 0,
  }));
}
