"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { listProjectsForClientId } from "@/lib/data/projects";

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
 */
export async function getProjectsForClient(clientId) {
  if (!clientId) {
    return { ok: false, error: "Missing client", projects: [] };
  }
  try {
    const projects = await listProjectsForClientId(clientId);
    return { ok: true, projects };
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
