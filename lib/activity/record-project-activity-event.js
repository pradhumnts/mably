import { revalidatePath } from "next/cache";

/**
 * @param {import("@supabase/supabase-js").SupabaseClient} supabase
 * @param {{
 *   projectId: string;
 *   eventType: string;
 *   payload?: Record<string, unknown>;
 *   actorId: string;
 *   actorDisplayName: string;
 *   actorAvatarUrl?: string | null;
 * }} input
 */
export async function recordProjectActivityEvent(supabase, input) {
  const projectId = String(input.projectId ?? "").trim();
  if (!projectId) return { ok: false, error: "Missing project" };

  const eventType = String(input.eventType ?? "").trim();
  if (!eventType) return { ok: false, error: "Missing event type" };

  const actorId = String(input.actorId ?? "").trim();
  if (!actorId) return { ok: false, error: "Missing actor" };

  const { error } = await supabase.from("project_activity_events").insert({
    project_id: projectId,
    event_type: eventType,
    actor_id: actorId,
    actor_display_name: input.actorDisplayName?.trim() || "Member",
    actor_avatar_url: input.actorAvatarUrl ?? null,
    payload: input.payload && typeof input.payload === "object" ? input.payload : {},
  });

  if (error) {
    console.error("project_activity_events insert", error.message);
    return { ok: false, error: error.message };
  }

  revalidatePath(`/project/${projectId}/activity`);
  return { ok: true };
}
