"use server";

import { createClient } from "@/lib/supabase/server";
import { mapActivityEventRowToTimelineItem } from "@/lib/activity/map-project-activity-to-timeline";

function toShortDueLabel(iso) {
  if (!iso || typeof iso !== "string") return "—";
  const [y, m, d] = iso.slice(0, 10).split("-").map(Number);
  if (!y || !m || !d) return "—";
  return new Date(y, m - 1, d).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

function formatTimelineRange(startIso, endIso) {
  const a = toShortDueLabel(startIso);
  const b = toShortDueLabel(endIso);
  if (a === "—" && b === "—") return "—";
  if (a === "—") return b;
  if (b === "—") return a;
  return `${a} — ${b}`;
}

function formatTotalFee(amount) {
  if (amount == null || amount === "") return "—";
  const n = typeof amount === "number" ? amount : Number(amount);
  if (!Number.isFinite(n)) return "—";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(n);
}

function mapMilestonesForSidebar(raw) {
  if (!Array.isArray(raw)) return [];
  return raw.map((m, i) => {
    const name = typeof m?.name === "string" ? m.name.trim() : "";
    const amount = m?.amount != null && m.amount !== "" ? String(m.amount) : "";
    const due = m?.dueDate != null && String(m.dueDate).trim() ? toShortDueLabel(String(m.dueDate)) : "";
    return {
      id: `m-${i}`,
      title: name || `Milestone ${i + 1}`,
      amount: amount.startsWith("$") ? amount : amount ? `$${amount}` : "—",
      delivery: due ? `Due ${due}` : "",
      completed: false,
    };
  });
}

function humanizeStatus(status) {
  const s = typeof status === "string" ? status.trim().toLowerCase() : "";
  if (!s) return "In progress";
  if (s === "active") return "In progress";
  return s.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

/**
 * @param {string} projectId
 */
export async function getProjectActivityPageData(projectId) {
  const supabase = await createClient();
  const {
    data: { user },
    error: authErr,
  } = await supabase.auth.getUser();

  if (authErr || !user) {
    return { ok: false, error: "Not signed in", project: null, activities: [] };
  }

  const pid = typeof projectId === "string" ? projectId.trim() : "";
  if (!pid) {
    return { ok: false, error: "Missing project", project: null, activities: [] };
  }

  const { data: projectRow, error: projectErr } = await supabase
    .from("projects")
    .select(
      "name, description, status, start_date, end_date, pricing_type, milestones, total_fee"
    )
    .eq("id", pid)
    .maybeSingle();

  if (projectErr || !projectRow) {
    return { ok: false, error: projectErr?.message || "Project not found", project: null, activities: [] };
  }

  const { data: events, error: eventsErr } = await supabase
    .from("project_activity_events")
    .select(
      "id, event_type, actor_display_name, actor_avatar_url, payload, created_at"
    )
    .eq("project_id", pid)
    .order("created_at", { ascending: false })
    .limit(200);

  if (eventsErr) {
    return { ok: false, error: eventsErr.message, project: null, activities: [] };
  }

  const pricingType = projectRow.pricing_type === "milestone" ? "milestone" : "one-time";
  const milestones = mapMilestonesForSidebar(projectRow.milestones);

  const project = {
    title: projectRow.name?.trim() || "Project",
    description: projectRow.description?.trim() || "",
    status: humanizeStatus(projectRow.status),
    dueDate: toShortDueLabel(projectRow.end_date),
    pricingType,
    sidebar: {
      status: humanizeStatus(projectRow.status),
      dueDate: toShortDueLabel(projectRow.end_date),
      milestones: pricingType === "milestone" ? milestones : undefined,
      timeline: formatTimelineRange(projectRow.start_date, projectRow.end_date),
      totalFee: formatTotalFee(projectRow.total_fee),
    },
  };

  const activities = (events ?? []).map((row) => mapActivityEventRowToTimelineItem(row, pid));

  return { ok: true, error: null, project, activities };
}
