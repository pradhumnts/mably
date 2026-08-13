"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { listProjectsForClientId, mapProjectRow } from "@/lib/data/projects";

function normalizeLinks(links) {
  if (!Array.isArray(links)) return [];
  const out = [];
  for (const item of links.slice(0, 30)) {
    const label = typeof item?.label === "string" ? item.label.trim() : "";
    const url = typeof item?.url === "string" ? item.url.trim() : "";
    if (label && url) out.push({ label, url });
  }
  return out;
}

function revalidateClients() {
  revalidatePath("/clients");
  revalidatePath("/projects/new");
}

function isPortalPersonId(id) {
  return typeof id === "string" && id.startsWith("portal:");
}

/**
 * @param {string[]} projectIds
 * @param {string} userId
 * @param {import("@supabase/supabase-js").SupabaseClient} supabase
 */
async function listOwnedProjectsByIds(supabase, userId, projectIds) {
  const ids = [...new Set((projectIds ?? []).filter(Boolean))];
  if (ids.length === 0) return [];

  const { data, error } = await supabase
    .from("projects")
    .select(
      "id, name, description, end_date, pricing_type, total_fee, milestones, logo_url, status, client_id, client_name_snapshot, client_avatar_snapshot"
    )
    .eq("freelancer_id", userId)
    .in("id", ids)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("listOwnedProjectsByIds:", error.message);
    return [];
  }

  return (data ?? []).map((p) => mapProjectRow(p)).filter(Boolean);
}

export async function createClientRecord(payload) {
  const supabase = await createClient();
  const {
    data: { user },
    error: authErr,
  } = await supabase.auth.getUser();

  if (authErr || !user) {
    return { ok: false, error: "Not signed in" };
  }

  const full_name = (payload.fullName ?? "").trim();
  const email = (payload.email ?? "").trim().toLowerCase();
  const phone = (payload.phone ?? "").trim() || null;
  const location = (payload.location ?? "").trim() || null;
  const links = normalizeLinks(payload.links);

  if (!full_name || !email) {
    return { ok: false, error: "Name and email are required" };
  }

  const { data, error } = await supabase
    .from("clients")
    .insert({
      freelancer_id: user.id,
      full_name,
      email,
      phone,
      location,
      avatar_url: null,
      links,
    })
    .select("id")
    .single();

  if (error) {
    if (error.code === "23505") {
      return { ok: false, error: "You already have a client with this email" };
    }
    return { ok: false, error: error.message };
  }

  revalidateClients();
  return { ok: true, id: data?.id };
}

export async function updateClient(payload) {
  const supabase = await createClient();
  const {
    data: { user },
    error: authErr,
  } = await supabase.auth.getUser();

  if (authErr || !user) {
    return { ok: false, error: "Not signed in" };
  }

  const id = payload.id;
  if (!id) {
    return { ok: false, error: "Missing client" };
  }

  const full_name = (payload.fullName ?? "").trim();
  const email = (payload.email ?? "").trim().toLowerCase();
  const phone = (payload.phone ?? "").trim() || null;
  const location = (payload.location ?? "").trim() || null;
  const links = normalizeLinks(payload.links);

  if (!full_name || !email) {
    return { ok: false, error: "Name and email are required" };
  }

  const { error } = await supabase
    .from("clients")
    .update({
      full_name,
      email,
      phone,
      location,
      links,
    })
    .eq("id", id)
    .eq("freelancer_id", user.id);

  if (error) {
    if (error.code === "23505") {
      return { ok: false, error: "You already have a client with this email" };
    }
    return { ok: false, error: error.message };
  }

  revalidateClients();
  return { ok: true };
}

/**
 * Projects linked to a client (for client details dialog). RLS-scoped.
 * @param {string} clientId
 * @param {{ portalProjectIds?: string[] }} [opts]
 */
export async function getProjectsForClient(clientId, opts = {}) {
  if (!clientId) {
    return { ok: false, error: "Missing client", projects: [] };
  }

  const portalProjectIds = Array.isArray(opts?.portalProjectIds)
    ? opts.portalProjectIds.filter(Boolean)
    : [];

  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return { ok: false, error: "Not signed in", projects: [] };
    }

    if (isPortalPersonId(clientId)) {
      const projects = await listOwnedProjectsByIds(supabase, user.id, portalProjectIds);
      return { ok: true, projects };
    }

    const linked = await listProjectsForClientId(clientId);
    const byId = new Map(linked.map((p) => [p.id, p]));
    const extras = await listOwnedProjectsByIds(supabase, user.id, portalProjectIds);
    for (const p of extras) {
      if (p?.id && !byId.has(p.id)) byId.set(p.id, p);
    }
    return { ok: true, projects: [...byId.values()] };
  } catch (e) {
    return { ok: false, error: e?.message ?? "Failed to load projects", projects: [] };
  }
}

export async function deleteClient(clientId) {
  const supabase = await createClient();
  const {
    data: { user },
    error: authErr,
  } = await supabase.auth.getUser();

  if (authErr || !user) {
    return { ok: false, error: "Not signed in" };
  }

  const { error } = await supabase
    .from("clients")
    .delete()
    .eq("id", clientId)
    .eq("freelancer_id", user.id);

  if (error) {
    if (error.code === "23503") {
      return {
        ok: false,
        error:
          "This client cannot be deleted while they are linked to one or more projects. Remove or reassign those projects first.",
      };
    }
    return { ok: false, error: error.message };
  }

  revalidateClients();
  return { ok: true };
}
