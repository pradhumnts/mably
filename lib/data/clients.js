import { format } from "date-fns";
import { CRM_SAMPLE_CLIENT_FIXTURES } from "@/lib/crm/sample-clients";
import { createClient } from "@/lib/supabase/server";

function formatLastActive(iso) {
  if (!iso) return "—";
  try {
    return format(new Date(iso), "h:mm a, MMM d, yyyy");
  } catch {
    return "—";
  }
}

/** Prefer newest non-empty `client_avatar_snapshot` per CRM client (portal / chat source). */
function latestPortalAvatarByClientId(projectRows) {
  const best = new Map();
  for (const row of projectRows ?? []) {
    const cid = row?.client_id;
    if (!cid) continue;
    const url =
      typeof row.client_avatar_snapshot === "string" ? row.client_avatar_snapshot.trim() : "";
    if (!url) continue;
    const t = row.updated_at ? new Date(row.updated_at).getTime() : 0;
    const prev = best.get(cid);
    if (!prev || t >= prev.t) best.set(cid, { url, t });
  }
  const out = new Map();
  for (const [cid, { url }] of best) out.set(cid, url);
  return out;
}

/**
 * @param {object} row - clients table row
 * @param {{ portalAvatarUrl?: string | null }} [opts] - denormalized portal avatar (matches project list + chat)
 */
export function mapClientRow(row, opts = {}) {
  if (!row) return null;
  const links = Array.isArray(row.links)
    ? row.links.filter((l) => l && typeof l.url === "string" && typeof l.label === "string")
    : [];

  const portal =
    typeof opts.portalAvatarUrl === "string" && opts.portalAvatarUrl.trim()
      ? opts.portalAvatarUrl.trim()
      : null;
  const crm =
    typeof row.avatar_url === "string" && row.avatar_url.trim() ? row.avatar_url.trim() : null;

  return {
    id: row.id,
    name: row.full_name ?? "",
    email: row.email ?? "",
    phone: row.phone ?? "",
    location: row.location ?? "",
    lastActive: formatLastActive(row.updated_at),
    updatedAt: row.updated_at ?? null,
    avatar: portal || crm || null,
    links,
    isSample: Boolean(row.is_sample),
  };
}

/**
 * Insert starter sample clients once for new freelancers (real DB rows — deletable).
 * Skips if the user already has clients or samples were seeded before.
 */
async function ensureCrmSampleClients(supabase, userId) {
  const { count, error: countErr } = await supabase
    .from("clients")
    .select("id", { count: "exact", head: true })
    .eq("freelancer_id", userId);

  if (countErr) {
    console.error("crm sample clients count:", countErr.message);
    return;
  }
  if ((count ?? 0) > 0) return;

  const { data: profile, error: profileErr } = await supabase
    .from("profiles")
    .select("crm_sample_clients_seeded")
    .eq("id", userId)
    .maybeSingle();

  if (profileErr) {
    console.error("crm sample clients profile:", profileErr.message);
    return;
  }
  if (profile?.crm_sample_clients_seeded) return;

  const now = Date.now();
  const rows = CRM_SAMPLE_CLIENT_FIXTURES.map((fixture) => ({
    freelancer_id: userId,
    full_name: fixture.full_name,
    email: fixture.email,
    phone: fixture.phone,
    location: fixture.location,
    avatar_url: fixture.avatar_url,
    links: fixture.links,
    is_sample: true,
    updated_at: new Date(now - fixture.daysAgoUpdated * 86_400_000).toISOString(),
  }));

  const { error: insertErr } = await supabase.from("clients").insert(rows);
  if (insertErr) {
    console.error("crm sample clients insert:", insertErr.message);
    return;
  }

  const { error: flagErr } = await supabase
    .from("profiles")
    .update({ crm_sample_clients_seeded: true })
    .eq("id", userId);

  if (flagErr) {
    console.error("crm sample clients seeded flag:", flagErr.message);
  }
}

/**
 * All clients for the current user (freelancer_id = session user), newest first.
 * @param {{ seedSamples?: boolean, includeSamples?: boolean }} [options]
 *   - seedSamples: insert starter CRM contacts when the list is empty (default true)
 *   - includeSamples: return sample contacts in the list (default true)
 */
export async function listClientsForCurrentUser(options = {}) {
  const { seedSamples = true, includeSamples = true } = options;
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return [];
  }

  if (seedSamples) {
    await ensureCrmSampleClients(supabase, user.id);
  }

  const { data, error } = await supabase
    .from("clients")
    .select(
      "id, freelancer_id, full_name, email, phone, location, avatar_url, links, created_at, updated_at, is_sample"
    )
    .eq("freelancer_id", user.id)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("clients list error:", error.message);
    return [];
  }

  const rows = includeSamples ? (data ?? []) : (data ?? []).filter((row) => !row.is_sample);
  const clientIds = rows.map((r) => r.id).filter(Boolean);
  let portalAvatarByClientId = new Map();
  if (clientIds.length > 0) {
    const { data: projRows, error: projErr } = await supabase
      .from("projects")
      .select("client_id, client_avatar_snapshot, updated_at")
      .eq("freelancer_id", user.id)
      .in("client_id", clientIds);

    if (projErr) {
      console.error("clients portal avatar lookup:", projErr.message);
    } else {
      portalAvatarByClientId = latestPortalAvatarByClientId(projRows);
    }
  }

  return rows.map((row) =>
    mapClientRow(row, { portalAvatarUrl: portalAvatarByClientId.get(row.id) ?? null })
  );
}
