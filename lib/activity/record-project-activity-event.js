import { revalidatePath } from "next/cache";
import { enqueueFreelancerInboxFromActivity } from "@/lib/notifications/trigger-freelancer-inbox";

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

  const { data: row, error } = await supabase
    .from("project_activity_events")
    .insert({
      project_id: projectId,
      event_type: eventType,
      actor_id: actorId,
      actor_display_name: input.actorDisplayName?.trim() || "Member",
      actor_avatar_url: input.actorAvatarUrl ?? null,
      payload: input.payload && typeof input.payload === "object" ? input.payload : {},
    })
    .select("id, created_at")
    .single();

  if (error) {
    console.error("project_activity_events insert", error.message);
    return { ok: false, error: error.message };
  }

  const { data: proj } = await supabase
    .from("projects")
    .select("freelancer_id, name")
    .eq("id", projectId)
    .maybeSingle();

  if (row?.id && proj?.freelancer_id) {
    enqueueFreelancerInboxFromActivity({
      freelancerId: proj.freelancer_id,
      projectId,
      projectName: proj.name,
      eventId: row.id,
      eventType,
      createdAt: row.created_at,
      actorId,
      actorName: input.actorDisplayName?.trim() || "Member",
      actorAvatarUrl: input.actorAvatarUrl ?? null,
      payload: input.payload,
    });
  }

  revalidatePath(`/project/${projectId}/activity`);
  return { ok: true, eventId: row?.id };
}
