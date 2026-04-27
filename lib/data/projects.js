import { format } from "date-fns";
import { createClient } from "@/lib/supabase/server";

const DEFAULT_LOGO = "/images/webflow-logo.jpeg";

function sumMilestoneAmounts(milestones) {
  if (!Array.isArray(milestones)) return 0;
  return milestones.reduce((acc, m) => {
    const n = parseFloat(m?.amount);
    return acc + (Number.isFinite(n) ? n : 0);
  }, 0);
}

function statusLabel(status) {
  if (status === "on_hold") return "On Hold";
  if (status === "draft") return "Draft";
  if (status === "completed") return "Completed";
  return "Active";
}

/**
 * Row shape for {@link ProjectCard} + list views.
 */
export function mapProjectRow(row) {
  if (!row) return null;

  const pricingType = row.pricing_type === "milestone" ? "milestone" : "one_time";
  const budget =
    pricingType === "milestone"
      ? sumMilestoneAmounts(row.milestones)
      : Number(row.total_fee ?? 0);

  const end = row.end_date ? new Date(`${row.end_date}T12:00:00`) : null;
  const dueDate = end && !Number.isNaN(end.getTime()) ? format(end, "d MMM") : "—";

  const logo =
    row.logo_url && String(row.logo_url).startsWith("http")
      ? row.logo_url
      : DEFAULT_LOGO;

  let client = row.clients;
  if (Array.isArray(client)) {
    client = client[0];
  }

  const snapshotName = typeof row.client_name_snapshot === "string" ? row.client_name_snapshot.trim() : "";
  const snapshotAvatar =
    typeof row.client_avatar_snapshot === "string" && row.client_avatar_snapshot.trim()
      ? row.client_avatar_snapshot.trim()
      : null;

  const crmClient = client && typeof client === "object" ? client : null;
  const crmName = crmClient?.full_name && String(crmClient.full_name).trim() ? String(crmClient.full_name).trim() : "";
  const crmAvatar =
    crmClient?.avatar_url && String(crmClient.avatar_url).trim() ? String(crmClient.avatar_url).trim() : null;

  // Portal / invite display is denormalized on the project; prefer it over the CRM `clients` row when set.
  const clientName = snapshotName || crmName || "Client";
  const clientAvatar = snapshotAvatar || crmAvatar || null;

  return {
    id: row.id,
    name: row.name ?? "",
    description: row.description?.trim() ? row.description : "No description yet",
    budget,
    status: statusLabel(row.status),
    dueDate,
    logo,
    clientAvatar,
    clientName,
  };
}

/**
 * Projects for the signed-in freelancer with linked client row.
 */
export async function listProjectsForCurrentUser() {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return [];
  }

  const { data: projects, error: projErr } = await supabase
    .from("projects")
    .select(
      "id, name, description, end_date, pricing_type, total_fee, milestones, logo_url, status, client_id, client_name_snapshot, client_avatar_snapshot"
    )
    .order("created_at", { ascending: false });

  if (projErr) {
    console.error("projects list error:", projErr.message);
    return [];
  }

  const rows = projects ?? [];
  const clientIds = [...new Set(rows.map((p) => p.client_id).filter(Boolean))];

  let clientMap = {};
  if (clientIds.length > 0) {
    const { data: clientsRows, error: cErr } = await supabase
      .from("clients")
      .select("id, full_name, avatar_url")
      .in("id", clientIds);

    if (cErr) {
      console.error("projects clients fetch:", cErr.message);
    } else {
      clientMap = Object.fromEntries((clientsRows ?? []).map((c) => [c.id, c]));
    }
  }

  return rows
    .map((p) => mapProjectRow({ ...p, clients: clientMap[p.client_id] ?? null }))
    .filter(Boolean);
}

/**
 * Projects for one CRM client (same row shape as {@link listProjectsForCurrentUser}).
 * Returns [] if the client is missing or not owned by the current user.
 */
export async function listProjectsForClientId(clientId) {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user || !clientId) {
    return [];
  }

  const { data: clientRow, error: clientErr } = await supabase
    .from("clients")
    .select("id, full_name, avatar_url")
    .eq("id", clientId)
    .eq("freelancer_id", user.id)
    .maybeSingle();

  if (clientErr || !clientRow) {
    return [];
  }

  const { data: projects, error: projErr } = await supabase
    .from("projects")
    .select(
      "id, name, description, end_date, pricing_type, total_fee, milestones, logo_url, status, client_id, client_name_snapshot, client_avatar_snapshot"
    )
    .eq("freelancer_id", user.id)
    .eq("client_id", clientId)
    .order("created_at", { ascending: false });

  if (projErr) {
    console.error("listProjectsForClientId:", projErr.message);
    return [];
  }

  const clientMap = { [clientId]: clientRow };
  return (projects ?? [])
    .map((p) => mapProjectRow({ ...p, clients: clientMap[p.client_id] ?? null }))
    .filter(Boolean);
}
