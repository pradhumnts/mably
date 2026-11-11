import { createClient } from "@/lib/supabase/server";
import { getUserFromClaims } from "@/lib/auth/current-user";
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
  const user = await getUserFromClaims(supabase);
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

const PAGE_SIZE = 1000;

function positiveBytes(v) {
  const n = typeof v === "number" ? v : Number(v);
  return Number.isFinite(n) && n > 0 ? n : 0;
}

/**
 * Read every row of a query, paging past PostgREST's max rows per request.
 * @param {() => any} buildQuery
 * @returns {Promise<{ data: any[]; error: any }>}
 */
async function selectAllRows(buildQuery) {
  /** @type {any[]} */
  const all = [];
  for (let from = 0; ; from += PAGE_SIZE) {
    const { data, error } = await buildQuery().range(from, from + PAGE_SIZE - 1);
    if (error) return { data: all, error };
    all.push(...(data ?? []));
    if (!data || data.length < PAGE_SIZE) return { data: all, error: null };
  }
}

/**
 * Library file bytes including every stored revision. Older versions keep their
 * blobs until the file is deleted, so each one counts against the quota.
 * Falls back to the file row when its current blob has no version row.
 *
 * @param {import("@supabase/supabase-js").SupabaseClient} client
 * @param {string[]} projectIds
 * @returns {Promise<{ ok: true; bytes: number } | { ok: false; error: string }>}
 */
async function sumLibraryFileBytes(client, projectIds) {
  const { data: files, error: fErr } = await selectAllRows(() =>
    client
      .from("project_library_files")
      .select("id, size_bytes, storage_object_path")
      .in("project_id", projectIds)
      .order("id")
  );
  if (fErr) {
    console.error("[library-storage] sum files:", fErr.message);
    return { ok: false, error: "Could not verify library storage." };
  }

  const fileIds = files.map((f) => f.id).filter(Boolean);
  /** @type {Map<string, Set<string>>} */
  const versionPathsByFile = new Map();
  let total = 0;

  const chunk = 150;
  for (let i = 0; i < fileIds.length; i += chunk) {
    const slice = fileIds.slice(i, i + chunk);
    const { data: versions, error: vErr } = await selectAllRows(() =>
      client
        .from("project_library_file_versions")
        .select("id, file_id, size_bytes, storage_object_path")
        .in("file_id", slice)
        .order("id")
    );
    if (vErr) {
      console.error("[library-storage] sum file versions:", vErr.message);
      return { ok: false, error: "Could not verify library storage." };
    }
    for (const v of versions) {
      total += positiveBytes(v.size_bytes);
      const key = String(v.file_id);
      if (!versionPathsByFile.has(key)) versionPathsByFile.set(key, new Set());
      versionPathsByFile.get(key).add(String(v.storage_object_path ?? ""));
    }
  }

  for (const f of files) {
    const paths = versionPathsByFile.get(String(f.id));
    if (!paths || !paths.has(String(f.storage_object_path ?? ""))) {
      total += positiveBytes(f.size_bytes);
    }
  }

  return { ok: true, bytes: total };
}

/**
 * Sum library storage (all file revisions + voice notes) on projects owned by `billingUserId`.
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
    const filesRes = await sumLibraryFileBytes(client, slice);
    if (!filesRes.ok) return filesRes;
    total += filesRes.bytes;

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

    const { data: convRows, error: convErr } = await client
      .from("project_conversations")
      .select("id")
      .in("project_id", slice);

    if (convErr) {
      console.error("[library-storage] list conversations:", convErr.message);
      return { ok: false, error: "Could not verify library storage." };
    }

    const convIds = (convRows ?? []).map((c) => c.id).filter(Boolean);
    if (convIds.length) {
      const { data: chatVoiceRows, error: cvErr } = await client
        .from("project_messages")
        .select("voice_note_size_bytes")
        .in("conversation_id", convIds)
        .not("voice_note_storage_path", "is", null);

      if (cvErr) {
        const missingChatVoice =
          cvErr.code === "42703" ||
          String(cvErr.message || "")
            .toLowerCase()
            .includes("voice_note");
        if (!missingChatVoice) {
          console.error("[library-storage] sum chat voice notes:", cvErr.message);
          return { ok: false, error: "Could not verify library storage." };
        }
      } else {
        for (const row of chatVoiceRows ?? []) {
          const v = row?.voice_note_size_bytes;
          const n = typeof v === "number" ? v : Number(v);
          if (Number.isFinite(n) && n > 0) total += n;
        }
      }
    }
  }

  return { ok: true, bytes: total };
}
