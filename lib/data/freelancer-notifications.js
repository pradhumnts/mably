import {
  format,
  addDays,
  startOfDay,
  isWithinInterval,
  parseISO,
  differenceInCalendarDays,
} from "date-fns";
import { createClient } from "@/lib/supabase/server";
import { mergeAllNotificationPreferences } from "@/lib/notifications/notification-preference-defaults";
import { stableNotificationDedupeKey } from "@/lib/notifications/stable-notification-id";
import {
  isNotificationAllowedByPreferences,
} from "@/lib/notifications/freelancer-notification-meta";
import { PROJECT_ACTIVITY_EVENT_TYPES } from "@/lib/activity/project-activity-event-types";

const DEFAULT_LOGO = "/images/dummy-project-logo.webp";
const NOTIFICATION_LIMIT = 50;
const RECENT_ACTIVITY_DAYS = 30;
const RECENT_PAYMENT_DAYS = 14;
const RECENT_PORTAL_OPEN_DAYS = 30;

const NOTIFICATION_PRIORITY = {
  unread_chat: 1,
  file_revision: 2,
  invoice_overdue: 3,
  portal_not_opened: 4,
  due_soon: 5,
  activity_approval: 6,
  activity_comment: 7,
  activity_file_upload: 8,
  activity_invoice_sent: 9,
  payment_received: 10,
  client_opened_portal: 11,
  project_created: 12,
};

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
 * @param {Record<string, unknown>} item
 * @param {Record<string, unknown>} p
 * @param {Record<string, { full_name?: string; avatar_url?: string }>} clientMap
 */
function enrichNotification(item, p, clientMap) {
  const v = projectVisuals(p, clientMap);
  return {
    ...item,
    projectLogo: v.logo,
    clientName: v.clientName,
    clientAvatar: v.clientAvatar,
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

      const { data: latestMsg } = await supabase
        .from("project_messages")
        .select("id, created_at")
        .eq("conversation_id", conv.id)
        .neq("author_id", userId)
        .gt("created_at", since)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (!latestMsg?.id) return null;

      return {
        projectId: conv.project_id,
        count,
        sourceId: String(latestMsg.id),
        createdAt: latestMsg.created_at ?? new Date().toISOString(),
      };
    })
  );

  return counts.filter(Boolean);
}

/**
 * @param {unknown} payload
 */
function payloadObj(payload) {
  return payload && typeof payload === "object" ? /** @type {Record<string, unknown>} */ (payload) : {};
}

/**
 * @param {import("@supabase/supabase-js").SupabaseClient} supabase
 * @param {string} userId
 */
/**
 * Build actionable notifications from live project data (no inbox read filter).
 * Used for hybrid backfill + fallback comparison.
 * @param {string} userId
 */
export async function buildDerivedFreelancerNotifications(userId) {
  const supabase = await createClient();

  const { data: profile } = await supabase
    .from("profiles")
    .select("notification_preferences")
    .eq("id", userId)
    .maybeSingle();

  const prefs = mergeAllNotificationPreferences(profile?.notification_preferences);

  const { data: projectRows, error: projErr } = await supabase
    .from("projects")
    .select(
      "id, name, description, start_date, end_date, logo_url, status, client_id, client_name_snapshot, client_avatar_snapshot, invite_email, created_at, updated_at"
    )
    .eq("freelancer_id", userId)
    .order("updated_at", { ascending: false });

  if (projErr) {
    console.error("[notifications] projects:", projErr.message);
    return [];
  }

  const rows = projectRows ?? [];
  if (!rows.length) return [];

  const projectIds = rows.map((p) => p.id);
  const projectById = Object.fromEntries(rows.map((p) => [p.id, p]));
  const today = startOfDay(new Date());
  const weekEnd = addDays(today, 7);
  const todayIso = format(today, "yyyy-MM-dd");
  const activitySince = addDays(today, -RECENT_ACTIVITY_DAYS).toISOString();
  const paymentSince = addDays(today, -RECENT_PAYMENT_DAYS).toISOString();
  const portalOpenSince = addDays(today, -RECENT_PORTAL_OPEN_DAYS).toISOString();

  const clientIds = [...new Set(rows.map((p) => p.client_id).filter(Boolean))];
  let clientMap = {};
  if (clientIds.length > 0) {
    const { data: clientsRows } = await supabase
      .from("clients")
      .select("id, full_name, avatar_url")
      .in("id", clientIds);
    clientMap = Object.fromEntries((clientsRows ?? []).map((c) => [c.id, c]));
  }

  /** @type {Array<Record<string, unknown>>} */
  const candidates = [];

  const [
    unreadByProject,
    filesRes,
    invoicesRes,
    opensRes,
    paidRes,
    activityRes,
  ] = await Promise.all([
    fetchUnreadChatByProject(supabase, userId, projectIds),
    supabase
      .from("project_library_files")
      .select("id, project_id, display_name, approval_status, updated_at")
      .in("project_id", projectIds)
      .eq("approval_status", "revision_requested")
      .limit(30),
    supabase
      .from("project_invoices")
      .select("id, project_id, amount, due_date, status, updated_at, created_at")
      .in("project_id", projectIds),
    supabase
      .from("project_client_portal_first_opens")
      .select("project_id, opened_at")
      .in("project_id", projectIds)
      .gte("opened_at", portalOpenSince),
    supabase
      .from("project_invoices")
      .select("id, project_id, amount, updated_at, created_at")
      .in("project_id", projectIds)
      .eq("status", "paid")
      .gte("updated_at", paymentSince)
      .order("updated_at", { ascending: false })
      .limit(20),
    supabase
      .from("project_activity_events")
      .select(
        "id, project_id, event_type, actor_display_name, actor_avatar_url, payload, created_at"
      )
      .in("project_id", projectIds)
      .gte("created_at", activitySince)
      .order("created_at", { ascending: false })
      .limit(40),
  ]);

  for (const u of unreadByProject) {
    const p = projectById[u.projectId];
    if (!p) continue;
    const n = u.count;
    candidates.push(
      enrichNotification(
        {
          type: "unread_chat",
          priority: NOTIFICATION_PRIORITY.unread_chat,
          projectId: p.id,
          projectName: p.name || "Project",
          title: n === 1 ? "1 new message" : `${n} new messages`,
          body: `${n === 1 ? "A new message is" : "New messages are"} waiting in chat`,
          href: `/project/${p.id}/dashboard?openChat=1`,
          sourceId: String(u.sourceId),
          createdAt: String(u.createdAt),
          actorName: p.client_name_snapshot || clientMap[p.client_id]?.full_name || "Client",
          actorAvatar: projectVisuals(p, clientMap).clientAvatar,
          actions: [
            { label: "Open chat", href: `/project/${p.id}/dashboard?openChat=1`, variant: "primary" },
          ],
        },
        p,
        clientMap
      )
    );
  }

  for (const f of filesRes.data ?? []) {
    const p = projectById[f.project_id];
    if (!p) continue;
    const fileName = (f.display_name || "File").trim();
    candidates.push(
      enrichNotification(
        {
          type: "file_revision",
          priority: NOTIFICATION_PRIORITY.file_revision,
          projectId: p.id,
          projectName: p.name || "Project",
          title: `Revision requested · ${fileName}`,
          body: `Your client asked for changes on ${fileName}`,
          href: `/project/${p.id}/library/files${f.id ? `?discussion=${f.id}` : ""}`,
          sourceId: String(f.id),
          createdAt: f.updated_at || new Date().toISOString(),
          actorName: projectVisuals(p, clientMap).clientName,
          actorAvatar: projectVisuals(p, clientMap).clientAvatar,
          actions: [
            { label: "Review file", href: `/project/${p.id}/library/files`, variant: "primary" },
          ],
        },
        p,
        clientMap
      )
    );
  }

  const openedSet = new Set((opensRes.data ?? []).map((o) => o.project_id));

  for (const inv of invoicesRes.data ?? []) {
    const p = projectById[inv.project_id];
    if (!p) continue;
    const due = String(inv.due_date || "");
    if (inv.status === "unpaid" && due && due < todayIso) {
      candidates.push(
        enrichNotification(
          {
            type: "invoice_overdue",
            priority: NOTIFICATION_PRIORITY.invoice_overdue,
            projectId: p.id,
            projectName: p.name || "Project",
            title: due
              ? `Invoice overdue · due ${format(parseISO(due), "d MMM yyyy")}`
              : "Invoice overdue",
            body: `Follow up on payment for ${p.name || "this project"}`,
            href: `/project/${p.id}/payments`,
            sourceId: String(inv.id),
            createdAt: inv.updated_at || inv.created_at || new Date().toISOString(),
            actorName: projectVisuals(p, clientMap).clientName,
            actorAvatar: projectVisuals(p, clientMap).clientAvatar,
            actions: [
              { label: "View payments", href: `/project/${p.id}/payments`, variant: "primary" },
            ],
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
    candidates.push(
      enrichNotification(
        {
          type: "portal_not_opened",
          priority: NOTIFICATION_PRIORITY.portal_not_opened,
          projectId: p.id,
          projectName: p.name || "Project",
          title: "Client hasn't visited the portal",
          body: `Invite sent to ${invite} — they haven't opened the portal yet`,
          href: `/project/${p.id}/settings`,
          sourceId: String(p.updated_at || p.created_at || "invite"),
          createdAt: p.updated_at || p.created_at || new Date().toISOString(),
          actorName: projectVisuals(p, clientMap).clientName,
          actorAvatar: projectVisuals(p, clientMap).clientAvatar,
          actions: [
            { label: "Project settings", href: `/project/${p.id}/settings`, variant: "primary" },
            { label: "Open portal", href: `/project/${p.id}/dashboard`, variant: "outline" },
          ],
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
      if (candidates.some((c) => c.projectId === p.id && c.type === "due_soon")) continue;
      candidates.push(
        enrichNotification(
          {
            type: "due_soon",
            priority: NOTIFICATION_PRIORITY.due_soon,
            projectId: p.id,
            projectName: p.name || "Project",
            title: `Deadline this week · ${format(end, "EEE d MMM")}`,
            body: `${p.name || "Project"} is due ${format(end, "EEEE, d MMMM")}`,
            href: `/project/${p.id}/activity`,
            sourceId: String(p.end_date),
            createdAt: p.end_date,
            actorName: projectVisuals(p, clientMap).clientName,
            actorAvatar: projectVisuals(p, clientMap).clientAvatar,
            actions: [
              { label: "View activity", href: `/project/${p.id}/activity`, variant: "primary" },
            ],
          },
          p,
          clientMap
        )
      );
    } catch {
      /* ignore */
    }
  }

  for (const open of opensRes.data ?? []) {
    const p = projectById[open.project_id];
    if (!p) continue;
    candidates.push(
      enrichNotification(
        {
          type: "client_opened_portal",
          priority: NOTIFICATION_PRIORITY.client_opened_portal,
          projectId: p.id,
          projectName: p.name || "Project",
          title: "Client opened the portal",
          body: `${projectVisuals(p, clientMap).clientName} visited ${p.name || "the project"} for the first time`,
          href: `/project/${p.id}/dashboard`,
          sourceId: String(open.opened_at),
          createdAt: open.opened_at,
          actorName: projectVisuals(p, clientMap).clientName,
          actorAvatar: projectVisuals(p, clientMap).clientAvatar,
          actions: [
            { label: "Open project", href: `/project/${p.id}/dashboard`, variant: "primary" },
          ],
        },
        p,
        clientMap
      )
    );
  }

  for (const inv of paidRes.data ?? []) {
    const p = projectById[inv.project_id];
    if (!p) continue;
    const amount = Number(inv.amount);
    const amountLabel = Number.isFinite(amount) ? `$${amount.toLocaleString()}` : "Payment";
    candidates.push(
      enrichNotification(
        {
          type: "payment_received",
          priority: NOTIFICATION_PRIORITY.payment_received,
          projectId: p.id,
          projectName: p.name || "Project",
          title: `Payment received · ${amountLabel}`,
          body: `Invoice marked paid for ${p.name || "this project"}`,
            href: `/project/${p.id}/payments`,
          sourceId: String(inv.id),
          createdAt: inv.updated_at || inv.created_at,
          actorName: projectVisuals(p, clientMap).clientName,
          actorAvatar: projectVisuals(p, clientMap).clientAvatar,
          actions: [
            { label: "View payments", href: `/project/${p.id}/payments`, variant: "primary" },
          ],
        },
        p,
        clientMap
      )
    );
  }

  const projectCreatedCutoff = addDays(today, -7);
  for (const p of rows) {
    try {
      const created = parseISO(String(p.created_at));
      if (created < projectCreatedCutoff) continue;
      candidates.push(
        enrichNotification(
          {
            type: "project_created",
            priority: NOTIFICATION_PRIORITY.project_created,
            projectId: p.id,
            projectName: p.name || "Project",
            title: "New project created",
            body: `You set up ${p.name || "a new project"}`,
            href: `/project/${p.id}/dashboard`,
            sourceId: String(p.created_at),
            createdAt: p.created_at,
            actorName: null,
            actorAvatar: null,
            actions: [
              { label: "Open project", href: `/project/${p.id}/dashboard`, variant: "primary" },
            ],
          },
          p,
          clientMap
        )
      );
    } catch {
      /* ignore */
    }
  }

  for (const ev of activityRes.data ?? []) {
    const p = projectById[ev.project_id];
    if (!p) continue;
    const pl = payloadObj(ev.payload);
    const fileName = String(pl.file_display_name || pl.display_name || "a file").trim();
    const fileId = pl.file_id ? String(pl.file_id) : "";
    const discussionHref = fileId
      ? `/project/${p.id}/library/files?discussion=${fileId}`
      : `/project/${p.id}/library/files`;

    let type = null;
    let title = "";
    let body = "";
    let href = `/project/${p.id}/activity`;
    let actions = [{ label: "View activity", href: `/project/${p.id}/activity`, variant: "primary" }];

    if (ev.event_type === PROJECT_ACTIVITY_EVENT_TYPES.LIBRARY_FILE_COMMENT) {
      type = "activity_comment";
      title = `New comment on ${fileName}`;
      body = String(pl.body || "").trim().slice(0, 120) || `Activity on ${fileName}`;
      href = discussionHref;
      actions = [{ label: "Open thread", href: discussionHref, variant: "primary" }];
    } else if (ev.event_type === PROJECT_ACTIVITY_EVENT_TYPES.LIBRARY_FILE_UPLOADED) {
      type = "activity_file_upload";
      title = `File uploaded · ${fileName}`;
      body = `${ev.actor_display_name || "Someone"} uploaded ${fileName}`;
      href = discussionHref;
      actions = [{ label: "Open library", href: discussionHref, variant: "primary" }];
    } else if (ev.event_type === PROJECT_ACTIVITY_EVENT_TYPES.INVOICE_CREATED) {
      type = "activity_invoice_sent";
      const amt = pl.amount ? String(pl.amount) : "";
      title = amt ? `Invoice sent · ${amt}` : "Invoice sent";
      body = `New invoice for ${p.name || "this project"}`;
      href = `/project/${p.id}/payments`;
      actions = [{ label: "View payments", href: `/project/${p.id}/payments`, variant: "primary" }];
    } else if (ev.event_type === PROJECT_ACTIVITY_EVENT_TYPES.LIBRARY_FILE_APPROVAL_CHANGED) {
      const status = String(pl.approval_status || "");
      if (status !== "revision_requested") continue;
      if (
        fileId &&
        candidates.some(
          (c) =>
            c.type === "file_revision" &&
            c.projectId === p.id &&
            String(c.sourceId) === fileId
        )
      ) {
        continue;
      }
      type = "activity_approval";
      title = `Approval update · ${fileName}`;
      body = `Revision requested on ${fileName}`;
      href = discussionHref;
      actions = [{ label: "Review file", href: discussionHref, variant: "primary" }];
    } else {
      continue;
    }

    candidates.push(
      enrichNotification(
        {
          type,
          priority: NOTIFICATION_PRIORITY[type] ?? 20,
          projectId: p.id,
          projectName: p.name || "Project",
          title,
          body,
          href,
          sourceId: String(ev.id),
          createdAt: ev.created_at,
          actorName: ev.actor_display_name || projectVisuals(p, clientMap).clientName,
          actorAvatar: ev.actor_avatar_url || projectVisuals(p, clientMap).clientAvatar,
          actions,
        },
        p,
        clientMap
      )
    );
  }

  const filtered = candidates.filter((c) =>
    isNotificationAllowedByPreferences(String(c.type), prefs)
  );

  filtered.sort((a, b) => {
    const pa = a.priority ?? 99;
    const pb = b.priority ?? 99;
    if (pa !== pb) return pa - pb;
    return new Date(String(b.createdAt)).getTime() - new Date(String(a.createdAt)).getTime();
  });

  const withStableIds = filtered.map((item) => ({
    ...item,
    id: stableNotificationDedupeKey(item),
    sourceId: item.sourceId ?? undefined,
  }));

  const seen = new Set();
  const deduped = [];
  for (const item of withStableIds) {
    if (seen.has(item.id)) continue;
    seen.add(item.id);
    deduped.push(item);
    if (deduped.length >= NOTIFICATION_LIMIT) break;
  }

  return deduped;
}
