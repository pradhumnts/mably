"use server";

import { createClient } from "@/lib/supabase/server";
import { mapActivityEventRowToTimelineItem } from "@/lib/activity/map-project-activity-to-timeline";
import {
  getDemoPortalHomeBriefing,
  isDemoProjectId,
  resolveDemoFreelancerFromSupabase,
} from "@/lib/data/demo-project";

/**
 * Portal home briefing for client or freelancer: attention + latest activity.
 * @param {string} projectId
 */
export async function getPortalHomeBriefing(projectId) {
  const supabase = await createClient();
  const {
    data: { user },
    error: authErr,
  } = await supabase.auth.getUser();

  if (authErr || !user) {
    return {
      ok: false,
      error: "Not signed in",
      isFreelancer: false,
      attention: [],
      latest: null,
    };
  }

  const pid = typeof projectId === "string" ? projectId.trim() : "";
  if (!pid) {
    return {
      ok: false,
      error: "Missing project",
      isFreelancer: false,
      attention: [],
      latest: null,
    };
  }

  if (isDemoProjectId(pid)) {
    const freelancer = await resolveDemoFreelancerFromSupabase(supabase, user);
    return getDemoPortalHomeBriefing(freelancer);
  }

  const { data: project, error: pErr } = await supabase
    .from("projects")
    .select("id, freelancer_id")
    .eq("id", pid)
    .maybeSingle();

  if (pErr || !project) {
    return {
      ok: false,
      error: pErr?.message || "Project not found",
      isFreelancer: false,
      attention: [],
      latest: null,
    };
  }

  const isFreelancer = project.freelancer_id === user.id;

  const [actionsRes, filesRes, invoicesRes, eventsRes] = await Promise.all([
    supabase
      .from("project_actions")
      .select("id, title, due_date, status, owner, visibility")
      .eq("project_id", pid)
      .eq("status", "open")
      .order("due_date", { ascending: true })
      .limit(12),
    supabase
      .from("project_library_files")
      .select("id, display_name, approval_status, needs_approval")
      .eq("project_id", pid)
      .eq("needs_approval", true)
      .in("approval_status", ["pending", "revision_requested"])
      .order("updated_at", { ascending: false })
      .limit(8),
    supabase
      .from("project_invoices")
      .select("id, amount, due_date, status")
      .eq("project_id", pid)
      .eq("status", "unpaid")
      .order("due_date", { ascending: true })
      .limit(3),
    supabase
      .from("project_activity_events")
      .select(
        "id, event_type, actor_display_name, actor_avatar_url, payload, created_at"
      )
      .eq("project_id", pid)
      .order("created_at", { ascending: false })
      .limit(1),
  ]);

  /** @type {Array<{ id: string; type: string; title: string; subtitle: string; href: string }>} */
  const attention = [];

  const openActions = actionsRes.data ?? [];
  const files = filesRes.data ?? [];
  const invoices = invoicesRes.data ?? [];

  if (isFreelancer) {
    for (const row of openActions) {
      if (row.owner === "client" && row.visibility === "shared") {
        attention.push({
          id: `waiting-${row.id}`,
          type: "action",
          title: String(row.title || "Action").trim() || "Action",
          subtitle: row.due_date
            ? `Waiting on client · Due ${formatShortDate(row.due_date)}`
            : "Waiting on client",
          href: `/project/${pid}/actions`,
        });
      } else if (row.owner === "freelancer") {
        attention.push({
          id: `mine-${row.id}`,
          type: "action",
          title: String(row.title || "Action").trim() || "Action",
          subtitle: dueSubtitle(row.due_date, "For you"),
          href: `/project/${pid}/actions`,
        });
      }
    }

    for (const row of files) {
      const name = String(row.display_name || "File").trim() || "File";
      if (row.approval_status === "revision_requested") {
        attention.push({
          id: `rev-${row.id}`,
          type: "approval",
          title: `Revision requested · ${name}`,
          subtitle: "Client asked for changes",
          href: `/project/${pid}/library/files?discussion=${encodeURIComponent(String(row.id))}`,
        });
      } else if (row.approval_status === "pending") {
        attention.push({
          id: `pend-${row.id}`,
          type: "approval",
          title: name,
          subtitle: "Awaiting client approval",
          href: `/project/${pid}/library/files?discussion=${encodeURIComponent(String(row.id))}`,
        });
      }
    }

    for (const row of invoices) {
      const amountLabel = formatAmount(row.amount);
      attention.push({
        id: `invoice-${row.id}`,
        type: "invoice",
        title: `Unpaid invoice · ${amountLabel}`,
        subtitle: row.due_date
          ? `Due ${formatShortDate(row.due_date)}`
          : "Payment pending",
        href: `/project/${pid}/payments`,
      });
    }
  } else {
    for (const row of openActions) {
      if (row.owner !== "client" || row.visibility !== "shared") continue;
      attention.push({
        id: `action-${row.id}`,
        type: "action",
        title: String(row.title || "Action").trim() || "Action",
        subtitle: dueSubtitle(row.due_date, "Needs your response"),
        href: `/project/${pid}/actions`,
      });
    }

    for (const row of files) {
      if (row.approval_status !== "pending") continue;
      const name = String(row.display_name || "File").trim() || "File";
      attention.push({
        id: `file-${row.id}`,
        type: "approval",
        title: `Review ${name}`,
        subtitle: "Waiting for your approval",
        href: `/project/${pid}/library/files?discussion=${encodeURIComponent(String(row.id))}`,
      });
    }

    for (const row of invoices) {
      const amountLabel = formatAmount(row.amount);
      attention.push({
        id: `invoice-${row.id}`,
        type: "invoice",
        title: `Pay invoice · ${amountLabel}`,
        subtitle: row.due_date
          ? `Due ${formatShortDate(row.due_date)}`
          : "Payment pending",
        href: `/project/${pid}/payments`,
      });
    }
  }

  let latest = null;
  const eventRow = eventsRes.data?.[0];
  if (eventRow) {
    const mapped = mapActivityEventRowToTimelineItem(eventRow, pid);
    const titleParts = [mapped.user?.name, mapped.action, mapped.fileLink].filter(
      Boolean
    );
    latest = {
      id: String(eventRow.id),
      label: titleParts.join(" ").replace(/\s+/g, " ").trim() || "New update",
      when: mapped.timestamp || "",
      href: mapped.destinationHref || `/project/${pid}/activity`,
    };
  }

  return {
    ok: true,
    isFreelancer,
    attention: attention.slice(0, 12),
    latest,
  };
}

/** @deprecated use getPortalHomeBriefing */
export async function getClientPortalBriefing(projectId) {
  return getPortalHomeBriefing(projectId);
}

/**
 * @param {unknown} amount
 */
function formatAmount(amount) {
  const n = Number(amount);
  if (!Number.isFinite(n)) return "Invoice";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(n);
}

/**
 * @param {string | null | undefined} due
 * @param {string} fallback
 */
function dueSubtitle(due, fallback) {
  if (!due) return fallback;
  const tone = dueTone(due);
  const label = formatShortDate(due);
  if (tone === "overdue") return `Overdue · ${label}`;
  if (tone === "today") return `Due today`;
  return `Due ${label}`;
}

/**
 * @param {string} iso
 */
function dueTone(iso) {
  const raw = String(iso || "").slice(0, 10);
  const [y, m, d] = raw.split("-").map(Number);
  if (!y || !m || !d) return "upcoming";
  const due = new Date(y, m - 1, d);
  const today = new Date();
  const startDue = new Date(due.getFullYear(), due.getMonth(), due.getDate());
  const startToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  if (startDue.getTime() < startToday.getTime()) return "overdue";
  if (startDue.getTime() === startToday.getTime()) return "today";
  return "upcoming";
}

/**
 * @param {string} iso
 */
function formatShortDate(iso) {
  const raw = String(iso || "").slice(0, 10);
  const [y, m, d] = raw.split("-").map(Number);
  if (!y || !m || !d) return raw;
  return new Date(y, m - 1, d).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}
