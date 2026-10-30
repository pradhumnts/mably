import { format } from "date-fns";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth/current-user";
import { getDemoProjectListItem } from "@/lib/data/demo-project";
import {
  applyStaffOwnedFilter,
  resolveStaffDataScope,
} from "@/lib/data/workspace-scope";

const DEFAULT_LOGO = "/images/dummy-project-logo.webp";

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
  const [supabase, user] = await Promise.all([createClient(), getCurrentUser()]);

  if (!user) {
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

  const mapped = rows
    .map((p) => mapProjectRow({ ...p, clients: clientMap[p.client_id] ?? null }))
    .filter(Boolean);

  // First-time freelancers see a fully-explorable demo project instead of an
  // empty state, so they can feel the product before paying to create one.
  if (mapped.length === 0) {
    return [getDemoProjectListItem()];
  }

  return mapped;
}

/**
 * Projects for one CRM client (same row shape as {@link listProjectsForCurrentUser}).
 * Returns [] if the client is missing or not owned by the current user.
 */
export async function listProjectsForClientId(clientId) {
  const [supabase, user] = await Promise.all([createClient(), getCurrentUser()]);

  if (!user || !clientId) {
    return [];
  }

  const scope = await resolveStaffDataScope(supabase, user);

  let clientQuery = supabase
    .from("clients")
    .select("id, full_name, avatar_url")
    .eq("id", clientId);
  clientQuery = applyStaffOwnedFilter(clientQuery, scope);
  const { data: clientRow, error: clientErr } = await clientQuery.maybeSingle();

  if (clientErr || !clientRow) {
    return [];
  }

  let projectsQuery = supabase
    .from("projects")
    .select(
      "id, name, description, end_date, pricing_type, total_fee, milestones, logo_url, status, client_id, client_name_snapshot, client_avatar_snapshot"
    )
    .eq("client_id", clientId);
  projectsQuery = applyStaffOwnedFilter(projectsQuery, scope).order("created_at", {
    ascending: false,
  });
  const { data: projects, error: projErr } = await projectsQuery;

  if (projErr) {
    console.error("listProjectsForClientId:", projErr.message);
    return [];
  }

  const clientMap = { [clientId]: clientRow };
  return (projects ?? [])
    .map((p) => mapProjectRow({ ...p, clients: clientMap[p.client_id] ?? null }))
    .filter(Boolean);
}

/**
 * Counts `projects` rows with `status = 'active'` for the signed-in freelancer.
 */
export async function countActiveProjectsForCurrentUser() {
  const [supabase, user] = await Promise.all([createClient(), getCurrentUser()]);

  if (!user) {
    return 0;
  }

  const scope = await resolveStaffDataScope(supabase, user);
  let countQuery = supabase
    .from("projects")
    .select("id", { count: "exact", head: true })
    .eq("status", "active");
  countQuery = applyStaffOwnedFilter(countQuery, scope);
  const { count, error } = await countQuery;

  if (error) {
    console.error("[projects] count active:", error.message);
    return 0;
  }

  return typeof count === "number" ? count : 0;
}

