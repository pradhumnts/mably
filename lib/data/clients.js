import { format } from "date-fns";
import { CRM_SAMPLE_CLIENT_FIXTURES } from "@/lib/crm/sample-clients";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

function formatLastActive(iso) {
  if (!iso) return "—";
  try {
    return format(new Date(iso), "h:mm a, MMM d, yyyy");
  } catch {
    return "—";
  }
}

function normalizeEmail(value) {
  return (value ?? "").trim().toLowerCase();
}

function portalPersonId(email) {
  return `portal:${normalizeEmail(email)}`;
}

function displayNameFromEmail(email) {
  const local = normalizeEmail(email).split("@")[0];
  return local || "Client";
}

/**
 * Merge CRM contacts with project primary clients + additional portal people.
 * Keeps the list payload lean (ids only) so Client Component hydration stays stable.
 * @param {import("@supabase/supabase-js").SupabaseClient} supabase
 * @param {string} userId
 * @param {ReturnType<typeof mapClientRow>[]} crmClients
 */
async function mergePortalPeopleIntoClientList(supabase, userId, crmClients) {
  const { data: projectRows, error: projErr } = await supabase
    .from("projects")
    .select(
      "id, client_id, invite_email, client_name_snapshot, client_avatar_snapshot, client_email_snapshot"
    )
    .eq("freelancer_id", userId);

  if (projErr) {
    console.error("clients portal projects lookup:", projErr.message);
    return crmClients.map((c) => ({
      ...c,
      accessRole: null,
      isPortalOnly: false,
      portalProjectIds: [],
      portalStatus: null,
    }));
  }

  const projects = projectRows ?? [];
  const projectById = new Map(projects.map((p) => [p.id, p]));
  const projectIds = projects.map((p) => p.id).filter(Boolean);

  const crmById = new Map(crmClients.map((c) => [c.id, c]));
  const crmByEmail = new Map();
  for (const c of crmClients) {
    const key = normalizeEmail(c.email);
    if (key) crmByEmail.set(key, c);
  }

  /** @type {Map<string, {
   *   email: string;
   *   name: string | null;
   *   avatar: string | null;
   *   isPrimary: boolean;
   *   isAdditional: boolean;
   *   portalStatus: "joined" | "invited" | null;
   *   projectIds: Set<string>;
   *   crmId: string | null;
   * }>} */
  const byEmail = new Map();

  /** @type {Map<string, { isPrimary: boolean; isAdditional: boolean; portalStatus: "joined" | "invited" | null; projectIds: Set<string> }>} */
  const byCrmId = new Map();

  const ensureEmail = (email) => {
    const key = normalizeEmail(email);
    if (!key) return null;
    let row = byEmail.get(key);
    if (!row) {
      row = {
        email: key,
        name: null,
        avatar: null,
        isPrimary: false,
        isAdditional: false,
        portalStatus: null,
        projectIds: new Set(),
        crmId: crmByEmail.get(key)?.id ?? null,
      };
      byEmail.set(key, row);
    }
    return row;
  };

  const ensureCrm = (clientId) => {
    if (!clientId || !crmById.has(clientId)) return null;
    let row = byCrmId.get(clientId);
    if (!row) {
      row = {
        isPrimary: false,
        isAdditional: false,
        portalStatus: null,
        projectIds: new Set(),
      };
      byCrmId.set(clientId, row);
    }
    return row;
  };

  const bumpStatus = (row, next) => {
    if (!row || !next) return;
    if (row.portalStatus === "joined") return;
    if (next === "joined" || !row.portalStatus) row.portalStatus = next;
  };

  const markPrimary = (email, projectId, extras = {}) => {
    const emailRow = ensureEmail(email);
    if (emailRow) {
      emailRow.isPrimary = true;
      emailRow.projectIds.add(projectId);
      if (extras.name && !emailRow.name) emailRow.name = extras.name;
      if (extras.avatar && !emailRow.avatar) emailRow.avatar = extras.avatar;
      bumpStatus(emailRow, extras.status || "invited");
      if (emailRow.crmId) {
        const crmRow = ensureCrm(emailRow.crmId);
        if (crmRow) {
          crmRow.isPrimary = true;
          crmRow.projectIds.add(projectId);
          bumpStatus(crmRow, extras.status || "invited");
        }
      }
    }
  };

  for (const p of projects) {
    const snapName =
      typeof p.client_name_snapshot === "string" ? p.client_name_snapshot.trim() : "";
    const snapAvatar =
      typeof p.client_avatar_snapshot === "string" ? p.client_avatar_snapshot.trim() : "";
    const primaryEmail =
      normalizeEmail(p.invite_email) || normalizeEmail(p.client_email_snapshot);

    if (p.client_id && crmById.has(p.client_id)) {
      const crmRow = ensureCrm(p.client_id);
      if (crmRow) {
        crmRow.isPrimary = true;
        crmRow.projectIds.add(p.id);
        bumpStatus(crmRow, "invited");
      }
      const crm = crmById.get(p.client_id);
      const crmEmail = normalizeEmail(crm?.email);
      if (crmEmail) {
        markPrimary(crmEmail, p.id, {
          name: snapName || crm.name || null,
          avatar: snapAvatar || crm.avatar || null,
          status: "invited",
        });
      }
    }

    if (primaryEmail) {
      markPrimary(primaryEmail, p.id, {
        name: snapName || null,
        avatar: snapAvatar || null,
        status: "invited",
      });
    }
  }

  if (projectIds.length > 0) {
    const [{ data: inviteRows, error: invErr }, { data: memberRows, error: memErr }] =
      await Promise.all([
        supabase
          .from("project_invites")
          .select("id, project_id, email, status")
          .in("project_id", projectIds)
          .in("status", ["pending", "accepted"]),
        supabase
          .from("project_members")
          .select("id, project_id, user_id, role")
          .in("project_id", projectIds)
          .eq("role", "client"),
      ]);

    if (invErr) console.error("clients portal invites lookup:", invErr.message);
    if (memErr) console.error("clients portal members lookup:", memErr.message);

    const primaryEmailForProject = (project) => {
      const fromInvite =
        normalizeEmail(project?.invite_email) ||
        normalizeEmail(project?.client_email_snapshot);
      if (fromInvite) return fromInvite;
      const crm = project?.client_id ? crmById.get(project.client_id) : null;
      return normalizeEmail(crm?.email);
    };

    for (const inv of inviteRows ?? []) {
      const email = normalizeEmail(inv.email);
      const project = projectById.get(inv.project_id);
      if (!email || !project) continue;
      const primaryEmail = primaryEmailForProject(project);
      const row = ensureEmail(email);
      if (!row) continue;
      row.projectIds.add(project.id);
      if (primaryEmail && email === primaryEmail) {
        row.isPrimary = true;
      } else {
        row.isAdditional = true;
      }
      bumpStatus(row, inv.status === "accepted" ? "joined" : "invited");
      if (row.crmId) {
        const crmRow = ensureCrm(row.crmId);
        if (crmRow) {
          crmRow.projectIds.add(project.id);
          if (row.isPrimary) crmRow.isPrimary = true;
          if (row.isAdditional) crmRow.isAdditional = true;
          bumpStatus(crmRow, inv.status === "accepted" ? "joined" : "invited");
        }
      }
    }

    const members = memberRows ?? [];
    const userIds = [...new Set(members.map((m) => m.user_id).filter(Boolean))];
    /** @type {Record<string, { full_name: string | null; email: string | null; avatar_url: string | null }>} */
    let profilesById = {};
    if (userIds.length > 0) {
      const reader = createAdminClient() || supabase;
      const { data: profiles, error: profErr } = await reader
        .from("profiles")
        .select("id, full_name, email, avatar_url")
        .in("id", userIds);
      if (profErr) {
        console.error("clients portal member profiles:", profErr.message);
      }
      for (const p of profiles ?? []) {
        profilesById[p.id] = p;
      }
    }

    for (const m of members) {
      const project = projectById.get(m.project_id);
      const prof = profilesById[m.user_id] || {};
      const email = normalizeEmail(prof.email);
      if (!email || !project) continue;
      const primaryEmail = primaryEmailForProject(project);
      const row = ensureEmail(email);
      if (!row) continue;
      row.projectIds.add(project.id);
      if (primaryEmail && email === primaryEmail) {
        row.isPrimary = true;
      } else {
        row.isAdditional = true;
      }
      const fullName = typeof prof.full_name === "string" ? prof.full_name.trim() : "";
      if (fullName) row.name = fullName;
      if (prof.avatar_url) row.avatar = prof.avatar_url;
      bumpStatus(row, "joined");
      if (row.crmId) {
        const crmRow = ensureCrm(row.crmId);
        if (crmRow) {
          crmRow.projectIds.add(project.id);
          if (row.isPrimary) crmRow.isPrimary = true;
          if (row.isAdditional) crmRow.isAdditional = true;
          bumpStatus(crmRow, "joined");
        }
      }
    }
  }

  const idsOf = (idSet) => [...(idSet ?? [])];

  const mappedCrm = crmClients.map((c) => {
    const key = normalizeEmail(c.email);
    const byId = byCrmId.get(c.id);
    const byMail = key ? byEmail.get(key) : null;
    const isPrimary = Boolean(byId?.isPrimary || byMail?.isPrimary);
    const isAdditional = Boolean(byId?.isAdditional || byMail?.isAdditional);
    const accessRole = isPrimary ? "primary" : isAdditional ? "additional" : null;
    const projectIdsMerged = new Set([
      ...(byId?.projectIds ?? []),
      ...(byMail?.projectIds ?? []),
    ]);
    const portalStatus =
      byId?.portalStatus === "joined" || byMail?.portalStatus === "joined"
        ? "joined"
        : byId?.portalStatus || byMail?.portalStatus || null;

    return {
      ...c,
      accessRole,
      isPortalOnly: false,
      portalProjectIds: idsOf(projectIdsMerged),
      portalStatus,
    };
  });

  const portalOnly = [];
  for (const [email, portal] of byEmail) {
    if (crmByEmail.has(email)) continue;
    const accessRole = portal.isPrimary
      ? "primary"
      : portal.isAdditional
        ? "additional"
        : null;
    if (!accessRole) continue;

    portalOnly.push({
      id: portalPersonId(email),
      name: portal.name || displayNameFromEmail(email),
      email,
      phone: "",
      location: "",
      lastActive: "—",
      updatedAt: null,
      avatar: portal.avatar || null,
      links: [],
      isSample: false,
      accessRole,
      isPortalOnly: true,
      portalProjectIds: idsOf(portal.projectIds),
      portalStatus: portal.portalStatus,
    });
  }

  const rank = (row) => {
    if (row.isSample) return 4;
    if (row.accessRole === "primary") return 0;
    if (row.accessRole === "additional") return 1;
    return 2;
  };

  return [...mappedCrm, ...portalOnly].sort((a, b) => {
    const ra = rank(a);
    const rb = rank(b);
    if (ra !== rb) return ra - rb;
    return (a.name || "").localeCompare(b.name || "", undefined, { sensitivity: "base" });
  });
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
 * When `includePortalPeople` is true (default), also merges primary clients and
 * additional portal stakeholders from owned projects (same labels as Settings → People).
 * @param {{ seedSamples?: boolean, includeSamples?: boolean, includePortalPeople?: boolean }} [options]
 *   - seedSamples: insert starter CRM contacts when the list is empty (default true)
 *   - includeSamples: return sample contacts in the list (default true)
 *   - includePortalPeople: include primary / additional portal people (default true)
 */
export async function listClientsForCurrentUser(options = {}) {
  const {
    seedSamples = true,
    includeSamples = true,
    includePortalPeople = true,
  } = options;
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

  const crmMapped = rows
    .map((row) =>
      mapClientRow(row, { portalAvatarUrl: portalAvatarByClientId.get(row.id) ?? null })
    )
    .filter(Boolean);

  if (!includePortalPeople) {
    return crmMapped.map((c) => ({
      ...c,
      accessRole: null,
      isPortalOnly: false,
      portalProjectIds: [],
      portalStatus: null,
    }));
  }

  return mergePortalPeopleIntoClientList(supabase, user.id, crmMapped);
}
