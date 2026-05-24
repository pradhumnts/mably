import {
  format,
  addDays,
  startOfDay,
  isWithinInterval,
  parseISO,
  differenceInCalendarDays,
  min as minDate,
  max as maxDate,
} from "date-fns";
import { createClient } from "@/lib/supabase/server";
import { DEMO_PROJECT_ID, getDemoProjectListItem } from "@/lib/data/demo-project";

const DEFAULT_LOGO = "/images/dummy-project-logo.webp";
const ATTENTION_LIMIT = 6;
const TIMELINE_HORIZON_DAYS = 56;

const ATTENTION_PRIORITY = {
  unread_chat: 1,
  file_revision: 2,
  invoice_overdue: 3,
  portal_not_opened: 4,
  due_soon: 5,
};

/**
 * @param {string} [fullName]
 * @param {string} [email]
 */
export function greetingFirstName(fullName, email) {
  const n = (fullName || "").trim();
  if (n) return n.split(/\s+/)[0];
  const e = (email || "").trim();
  if (e.includes("@")) return e.split("@")[0];
  return "there";
}

function dayPeriod() {
  const h = new Date().getHours();
  if (h < 12) return "morning";
  if (h < 17) return "afternoon";
  return "evening";
}

export function greetingHeadline(firstName) {
  const period = dayPeriod();
  const label =
    period === "morning" ? "Morning" : period === "afternoon" ? "Afternoon" : "Evening";
  return `Good ${label} ${firstName}!`;
}

export function dashboardDateLabel(date = new Date()) {
  return format(date, "EEEE, do MMMM");
}

/**
 * @param {Record<string, unknown>} p
 * @param {Record<string, { full_name?: string; avatar_url?: string }>} clientMap
 */
function projectVisuals(p, clientMap) {
  const logo =
    p.logo_url && String(p.logo_url).startsWith("http") ? String(p.logo_url) : DEFAULT_LOGO;
  const client = clientMap[p.client_id];
  const snapshotName =
    typeof p.client_name_snapshot === "string" ? p.client_name_snapshot.trim() : "";
  const crmName =
    client?.full_name && String(client.full_name).trim() ? String(client.full_name).trim() : "";
  const clientName = snapshotName || crmName || "Client";
  const snapshotAvatar =
    typeof p.client_avatar_snapshot === "string" && p.client_avatar_snapshot.trim()
      ? p.client_avatar_snapshot.trim()
      : null;
  const crmAvatar =
    client?.avatar_url && String(client.avatar_url).trim()
      ? String(client.avatar_url).trim()
      : null;
  const clientAvatar = snapshotAvatar || crmAvatar || null;
  return { logo, clientName, clientAvatar };
}

/**
 * @param {Array<{ id: string; startMs: number; endMs: number }>} dated
 */
function computeOverlappingIds(dated) {
  const ids = new Set();
  for (let i = 0; i < dated.length; i += 1) {
    for (let j = i + 1; j < dated.length; j += 1) {
      const a = dated[i];
      const b = dated[j];
      if (a.startMs <= b.endMs && b.startMs <= a.endMs) {
        ids.add(a.id);
        ids.add(b.id);
      }
    }
  }
  return ids;
}

/**
 * @param {Array<Record<string, unknown>>} rows
 * @param {Record<string, { full_name?: string; avatar_url?: string }>} clientMap
 * @param {Date} today
 */
function buildActiveTimeline(rows, clientMap, today) {
  const active = rows.filter((p) => p.status === "active");
  const dated = [];
  const undated = [];

  for (const p of active) {
    const { logo, clientName, clientAvatar } = projectVisuals(p, clientMap);
    let start = null;
    let end = null;
    try {
      if (p.start_date) start = startOfDay(parseISO(String(p.start_date)));
      if (p.end_date) end = startOfDay(parseISO(String(p.end_date)));
    } catch {
      /* ignore */
    }

    const base = {
      id: p.id,
      name: (p.name || "Project").trim(),
      logo,
      clientName,
      clientAvatar,
      href: `/project/${p.id}/dashboard`,
      settingsHref: `/project/${p.id}/settings`,
    };

    if (!end && !start) {
      undated.push(base);
      continue;
    }

    const effectiveStart = start ?? today;
    const effectiveEnd = end ?? addDays(effectiveStart, 21);
    dated.push({
      ...base,
      startMs: effectiveStart.getTime(),
      endMs: effectiveEnd.getTime(),
      startLabel: start ? format(start, "d MMM") : "Started",
      endLabel: end ? format(end, "d MMM yyyy") : "—",
      daysRemaining: end ? differenceInCalendarDays(end, today) : null,
    });
  }

  if (!dated.length && !undated.length) {
    return {
      hasActive: false,
      activeCount: 0,
      rangeStartLabel: format(today, "d MMM"),
      rangeEndLabel: format(addDays(today, TIMELINE_HORIZON_DAYS), "d MMM yyyy"),
      todayPercent: 0,
      projects: [],
      undated: [],
      overlapSummary: null,
    };
  }

  const rangeStart = minDate([
    today,
    ...dated.map((d) => new Date(d.startMs)),
  ]);
  const rangeEnd = maxDate([
    addDays(today, TIMELINE_HORIZON_DAYS),
    ...dated.map((d) => new Date(d.endMs)),
  ]);
  const totalMs = Math.max(rangeEnd.getTime() - rangeStart.getTime(), 1);
  const todayPercent = Math.min(
    100,
    Math.max(0, ((today.getTime() - rangeStart.getTime()) / totalMs) * 100)
  );

  const overlappingIds = computeOverlappingIds(dated);
  const overlapCount = overlappingIds.size;

  let overlapSummary = null;
  if (overlapCount >= 2) {
    overlapSummary = `${overlapCount} active projects have overlapping timelines — plan capacity around shared deadlines.`;
  }

  const projects = dated
    .sort((a, b) => a.endMs - b.endMs)
    .map((d) => {
      const left = ((d.startMs - rangeStart.getTime()) / totalMs) * 100;
      const width = ((d.endMs - d.startMs) / totalMs) * 100;
      return {
        ...d,
        barLeft: Math.max(0, Math.min(100, left)),
        barWidth: Math.max(4, Math.min(100 - left, width)),
        isOverlapping: overlappingIds.has(d.id),
      };
    });

  return {
    hasActive: active.length > 0,
    rangeStartLabel: format(rangeStart, "d MMM"),
    rangeEndLabel: format(rangeEnd, "d MMM yyyy"),
    todayPercent,
    projects,
    undated,
    overlapSummary,
    activeCount: active.length,
  };
}

/**
 * @param {import("@supabase/supabase-js").SupabaseClient} supabase
 * @param {string} userId
 * @param {string[]} projectIds
 */
async function fetchUnreadChatByProject(supabase, userId, projectIds) {
  if (!projectIds.length) return [];

  const { data: convs } = await supabase
    .from("project_conversations")
    .select("id, project_id")
    .in("project_id", projectIds);

  if (!convs?.length) return [];

  const counts = await Promise.all(
    convs.map(async (conv) => {
      const { data: readRow } = await supabase
        .from("project_conversation_reads")
        .select("last_read_at")
        .eq("conversation_id", conv.id)
        .eq("user_id", userId)
        .maybeSingle();

      const since = readRow?.last_read_at ?? "1970-01-01T00:00:00.000Z";

      const { count, error: cErr } = await supabase
        .from("project_messages")
        .select("id", { count: "exact", head: true })
        .eq("conversation_id", conv.id)
        .neq("author_id", userId)
        .gt("created_at", since);

      if (cErr || !count) return null;
      return { projectId: conv.project_id, count };
    })
  );

  return counts.filter(Boolean);
}

/**
 * @param {Record<string, unknown>} p
 * @param {Record<string, { full_name?: string; avatar_url?: string }>} clientMap
 */
function enrichAttention(item, p, clientMap) {
  const v = projectVisuals(p, clientMap);
  return {
    ...item,
    projectLogo: v.logo,
    clientName: v.clientName,
    clientAvatar: v.clientAvatar,
  };
}

/**
 * Synthetic dashboard for freelancers with zero real projects — mirrors the
 * explorable demo portal without a DB row.
 * @param {Date} today
 */
function buildDemoDashboardPreview(today) {
  const demo = getDemoProjectListItem();
  const demoRow = {
    id: demo.id,
    name: demo.name,
    status: "active",
    start_date: format(addDays(today, -28), "yyyy-MM-dd"),
    end_date: format(addDays(today, 14), "yyyy-MM-dd"),
    logo_url: demo.logo,
    client_name_snapshot: demo.clientName,
    client_avatar_snapshot: demo.clientAvatar,
    client_id: null,
  };

  const timeline = buildActiveTimeline([demoRow], {}, today);
  const visuals = projectVisuals(demoRow, {});

  const attentionCandidates = [
    {
      type: "unread_chat",
      priority: ATTENTION_PRIORITY.unread_chat,
      projectId: demo.id,
      projectName: demo.name,
      title: "3 new messages",
      href: `/project/${DEMO_PROJECT_ID}/dashboard`,
      projectLogo: visuals.logo,
      clientName: visuals.clientName,
      clientAvatar: visuals.clientAvatar,
    },
    {
      type: "file_revision",
      priority: ATTENTION_PRIORITY.file_revision,
      projectId: demo.id,
      projectName: demo.name,
      title: "Revision requested on Typography.pdf",
      href: `/project/${DEMO_PROJECT_ID}/library/files?discussion=demo-file-5`,
      projectLogo: visuals.logo,
      clientName: visuals.clientName,
      clientAvatar: visuals.clientAvatar,
    },
    {
      type: "portal_not_opened",
      priority: ATTENTION_PRIORITY.portal_not_opened,
      projectId: demo.id,
      projectName: demo.name,
      title: "Client hasn't visited the portal",
      href: `/project/${DEMO_PROJECT_ID}/dashboard`,
      projectLogo: visuals.logo,
      clientName: visuals.clientName,
      clientAvatar: visuals.clientAvatar,
    },
    {
      type: "due_soon",
      priority: ATTENTION_PRIORITY.due_soon,
      projectId: demo.id,
      projectName: demo.name,
      title: `Deadline this week · ${format(addDays(today, 14), "EEE d MMM")}`,
      href: `/project/${DEMO_PROJECT_ID}/activity`,
      projectLogo: visuals.logo,
      clientName: visuals.clientName,
      clientAvatar: visuals.clientAvatar,
    },
  ];

  const attention = attentionCandidates.map((item, i) => ({
    id: `demo-${item.type}-${i}`,
    isDemo: true,
    ...item,
  }));

  if (timeline.projects?.length) {
    timeline.projects = timeline.projects.map((p) => ({
      ...p,
      name: p.name.includes("(sample)") ? p.name : `${p.name} (sample)`,
      isDemo: true,
    }));
  }

  return {
    summary: { activeProjects: 1, newMessages: 3, dueThisWeek: 1 },
    attention,
    timeline,
    isDemoPreview: true,
    demoProjectHref: `/project/${DEMO_PROJECT_ID}/dashboard`,
  };
}

export async function getFreelancerDashboardBundle() {
  const supabase = await createClient();
  const {
    data: { user },
    error: authErr,
  } = await supabase.auth.getUser();

  if (authErr || !user) {
    return null;
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, email")
    .eq("id", user.id)
    .maybeSingle();

  const firstName = greetingFirstName(profile?.full_name, profile?.email ?? user.email);
  const today = startOfDay(new Date());
  const weekEnd = addDays(today, 7);
  const todayIso = format(today, "yyyy-MM-dd");

  const demoPreview = buildDemoDashboardPreview(today);

  const emptyBundle = {
    firstName,
    headline: greetingHeadline(firstName),
    dateLabel: dashboardDateLabel(),
    summary: demoPreview.summary,
    attention: demoPreview.attention,
    timeline: demoPreview.timeline,
    hasRealProjects: false,
    isDemoPreview: true,
    demoProjectHref: demoPreview.demoProjectHref,
  };

  const { data: projectRows, error: projErr } = await supabase
    .from("projects")
    .select(
      "id, name, description, start_date, end_date, pricing_type, total_fee, milestones, logo_url, status, client_id, client_name_snapshot, client_avatar_snapshot, invite_email, updated_at, created_at"
    )
    .eq("freelancer_id", user.id)
    .order("updated_at", { ascending: false });

  if (projErr) {
    console.error("[dashboard] projects:", projErr.message);
    return emptyBundle;
  }

  const rows = projectRows ?? [];

  if (rows.length === 0) {
    return emptyBundle;
  }

  const projectIds = rows.map((p) => p.id);
  const projectById = Object.fromEntries(rows.map((p) => [p.id, p]));

  const clientIds = [...new Set(rows.map((p) => p.client_id).filter(Boolean))];
  let clientMap = {};
  if (clientIds.length > 0) {
    const { data: clientsRows } = await supabase
      .from("clients")
      .select("id, full_name, avatar_url")
      .in("id", clientIds);
    clientMap = Object.fromEntries((clientsRows ?? []).map((c) => [c.id, c]));
  }

  const timeline = buildActiveTimeline(rows, clientMap, today);

  const activeProjects = rows.filter((p) => p.status === "active").length;
  const dueThisWeek = rows.filter((p) => {
    if (p.status !== "active" || !p.end_date) return false;
    try {
      const end = startOfDay(parseISO(String(p.end_date)));
      return isWithinInterval(end, { start: today, end: weekEnd });
    } catch {
      return false;
    }
  }).length;

  let unpaidInvoices = 0;
  let totalNewMessages = 0;
  const attentionCandidates = [];

  if (projectIds.length > 0) {
    const [unreadByProject, filesRes, invoicesRes, opensRes] = await Promise.all([
      fetchUnreadChatByProject(supabase, user.id, projectIds),
      supabase
        .from("project_library_files")
        .select("id, project_id, display_name, approval_status")
        .in("project_id", projectIds)
        .eq("approval_status", "revision_requested")
        .limit(20),
      supabase
        .from("project_invoices")
        .select("id, project_id, amount, due_date, status")
        .in("project_id", projectIds)
        .eq("status", "unpaid"),
      supabase
        .from("project_client_portal_first_opens")
        .select("project_id")
        .in("project_id", projectIds),
    ]);

    for (const u of unreadByProject) {
      const p = projectById[u.projectId];
      if (!p) continue;
      const n = u.count;
      totalNewMessages += n;
      attentionCandidates.push(
        enrichAttention(
          {
            priority: ATTENTION_PRIORITY.unread_chat,
            type: "unread_chat",
            projectId: p.id,
            projectName: p.name || "Project",
            title: n === 1 ? "1 new message" : `${n} new messages`,
            href: `/project/${p.id}/dashboard?openChat=1`,
          },
          p,
          clientMap
        )
      );
    }

    for (const f of filesRes.data ?? []) {
      const p = projectById[f.project_id];
      if (!p) continue;
      attentionCandidates.push(
        enrichAttention(
          {
            priority: ATTENTION_PRIORITY.file_revision,
            type: "file_revision",
            projectId: p.id,
            projectName: p.name || "Project",
            title: `Revision requested · ${(f.display_name || "File").trim()}`,
            href: `/project/${p.id}/library/files`,
          },
          p,
          clientMap
        )
      );
    }

    const openedSet = new Set((opensRes.data ?? []).map((o) => o.project_id));

    for (const inv of invoicesRes.data ?? []) {
      unpaidInvoices += 1;
      const p = projectById[inv.project_id];
      if (!p) continue;
      const due = String(inv.due_date || "");
      if (due && due < todayIso) {
        attentionCandidates.push(
          enrichAttention(
            {
              priority: ATTENTION_PRIORITY.invoice_overdue,
              type: "invoice_overdue",
              projectId: p.id,
              projectName: p.name || "Project",
              title: due
                ? `Invoice overdue · due ${format(parseISO(due), "d MMM yyyy")}`
                : "Invoice overdue",
              href: `/project/${p.id}/payments`,
            },
            p,
            clientMap
          )
        );
      }
    }

    for (const p of rows) {
      const invite = (p.invite_email || "").trim();
      if (p.status !== "active" || !invite || openedSet.has(p.id)) continue;
      attentionCandidates.push(
        enrichAttention(
          {
            priority: ATTENTION_PRIORITY.portal_not_opened,
            type: "portal_not_opened",
            projectId: p.id,
            projectName: p.name || "Project",
            title: "Client hasn't visited the portal",
            href: `/project/${p.id}/settings`,
          },
          p,
          clientMap
        )
      );
    }

    for (const p of rows) {
      if (p.status !== "active" || !p.end_date) continue;
      try {
        const end = startOfDay(parseISO(String(p.end_date)));
        if (!isWithinInterval(end, { start: today, end: weekEnd })) continue;
        if (
          attentionCandidates.some((a) => a.projectId === p.id && a.type === "due_soon")
        ) {
          continue;
        }
        attentionCandidates.push(
          enrichAttention(
            {
              priority: ATTENTION_PRIORITY.due_soon,
              type: "due_soon",
              projectId: p.id,
              projectName: p.name || "Project",
              title: `Deadline this week · ${format(end, "EEE d MMM")}`,
              href: `/project/${p.id}/activity`,
            },
            p,
            clientMap
          )
        );
      } catch {
        /* ignore */
      }
    }
  }

  attentionCandidates.sort((a, b) => a.priority - b.priority);
  const attention = attentionCandidates.slice(0, ATTENTION_LIMIT).map((item, i) => ({
    id: `${item.type}-${item.projectId}-${i}`,
    ...item,
  }));

  return {
    firstName,
    headline: greetingHeadline(firstName),
    dateLabel: dashboardDateLabel(),
    summary: {
      activeProjects,
      newMessages: totalNewMessages,
      dueThisWeek,
    },
    attention,
    timeline,
    hasRealProjects: true,
    isDemoPreview: false,
    demoProjectHref: null,
  };
}
