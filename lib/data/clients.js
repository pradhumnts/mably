import { format } from "date-fns";
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
    avatar: portal || crm || null,
    links,
  };
}

/**
 * All clients for the current user (freelancer_id = session user), newest first.
 */
export async function listClientsForCurrentUser() {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return [];
  }

  const { data, error } = await supabase
    .from("clients")
    .select(
      "id, freelancer_id, full_name, email, phone, location, avatar_url, links, created_at, updated_at"
    )
    .eq("freelancer_id", user.id)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("clients list error:", error.message);
    return [];
  }

  const rows = data ?? [];
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
