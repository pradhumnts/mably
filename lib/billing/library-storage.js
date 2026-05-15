import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export * from "@/lib/billing/library-storage-policy";

/**
 * Subscription row for `project.freelancer_id` (billing user). Uses service role when available
 * so client uploads can be checked against the owner's plan.
 *
 * @param {string} billingUserId
 * @returns {Promise<{ plan_key: string | null; status: string } | null>}
 */
export async function fetchFreelancerSubscriptionRowForBilling(billingUserId) {
  const admin = createAdminClient();
  if (admin) {
    const { data, error } = await admin
      .from("freelancer_subscriptions")
      .select("plan_key, status")
      .eq("user_id", billingUserId)
      .maybeSingle();
    if (error) {
      console.error("[library-storage] admin subscription read:", error.message);
      return null;
    }
    return data ?? { plan_key: null, status: "none" };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user || user.id !== billingUserId) return null;

  const { data, error } = await supabase
    .from("freelancer_subscriptions")
    .select("plan_key, status")
    .eq("user_id", user.id)
    .maybeSingle();

  if (error) {
    console.error("[library-storage] subscription read:", error.message);
    return null;
  }

  return data ?? { plan_key: null, status: "none" };
}

/**
 * Sum `size_bytes` for all library files on projects owned by `billingUserId`.
 *
 * @param {string} billingUserId
 * @param {string | null} actingUserId — current auth user; used when service role is missing
 * @returns {Promise<{ ok: true; bytes: number } | { ok: false; error: string }>}
 */
export async function sumFreelancerLibraryStorageBytes(billingUserId, actingUserId) {
  const admin = createAdminClient();
  const client = admin ?? (await createClient());

  if (!admin) {
    if (!actingUserId || actingUserId !== billingUserId) {
      return {
        ok: false,
        error:
          "Could not verify library storage for this upload. The project owner’s subscription could not be read.",
      };
    }
  }

  const { data: projects, error: pErr } = await client
    .from("projects")
    .select("id")
    .eq("freelancer_id", billingUserId);

  if (pErr) {
    console.error("[library-storage] list projects:", pErr.message);
    return { ok: false, error: "Could not verify library storage." };
  }

  const ids = (projects ?? []).map((p) => p.id).filter(Boolean);
  if (ids.length === 0) {
    return { ok: true, bytes: 0 };
  }

  let total = 0;
  const chunk = 200;
  for (let i = 0; i < ids.length; i += chunk) {
    const slice = ids.slice(i, i + chunk);
    const { data: rows, error: fErr } = await client
      .from("project_library_files")
      .select("size_bytes")
      .in("project_id", slice);

    if (fErr) {
      console.error("[library-storage] sum files:", fErr.message);
      return { ok: false, error: "Could not verify library storage." };
    }

    for (const row of rows ?? []) {
      const v = row?.size_bytes;
      const n = typeof v === "number" ? v : Number(v);
      if (Number.isFinite(n) && n > 0) total += n;
    }

    const { data: voiceRows, error: vErr } = await client
      .from("project_library_file_comments")
      .select("voice_note_size_bytes")
      .in("project_id", slice)
      .not("voice_note_storage_path", "is", null);

    if (vErr) {
      const missingVoiceCols =
        vErr.code === "42703" ||
        String(vErr.message || "")
          .toLowerCase()
          .includes("voice_note");
      if (missingVoiceCols) {
        console.warn("[library-storage] voice note columns unavailable:", vErr.message);
      } else {
        console.error("[library-storage] sum voice notes:", vErr.message);
        return { ok: false, error: "Could not verify library storage." };
      }
    } else {
      for (const row of voiceRows ?? []) {
        const v = row?.voice_note_size_bytes;
        const n = typeof v === "number" ? v : Number(v);
        if (Number.isFinite(n) && n > 0) total += n;
      }
    }
  }

  return { ok: true, bytes: total };
}
