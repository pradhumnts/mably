"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

function mapStatusToUi(db) {
  const m = {
    pending: "Pending",
    approved: "Approved",
    in_progress: "In Progress",
    done: "Done",
  };
  return m[db] ?? db;
}

function mapRow(row, myVoteIds) {
  return {
    id: row.id,
    title: row.title,
    description: row.description ?? "",
    status: mapStatusToUi(row.status),
    statusDb: row.status,
    votes: row.vote_count ?? 0,
    createdBy: (row.created_by_name ?? "").trim() || "Member",
    createdByAvatarUrl: row.created_by_avatar_url || null,
    createdAt: row.created_at,
    createdById: row.created_by,
    userHasVoted: myVoteIds.includes(row.id),
  };
}

/**
 * Data for /features (freelancer-only). Clients get forbidden.
 */
export async function getFeatureRequestsPageData() {
  const supabase = await createClient();
  const {
    data: { user },
    error: authErr,
  } = await supabase.auth.getUser();

  if (authErr || !user) {
    return { ok: false, error: "unauthorized", requests: [], myVoteIds: [] };
  }

  const { data: profile, error: profErr } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  if (profErr || profile?.role !== "freelancer") {
    return { ok: false, error: "forbidden", requests: [], myVoteIds: [] };
  }

  const { data: rows, error } = await supabase
    .from("feature_requests")
    .select(
      "id, title, description, status, vote_count, created_at, created_by, created_by_name, created_by_avatar_url"
    )
    .order("created_at", { ascending: false });

  if (error) {
    return { ok: false, error: error.message, requests: [], myVoteIds: [] };
  }

  const { data: voteRows } = await supabase
    .from("feature_request_votes")
    .select("feature_request_id")
    .eq("user_id", user.id);

  const myVoteIds = (voteRows ?? []).map((v) => v.feature_request_id);
  const requests = (rows ?? []).map((r) => mapRow(r, myVoteIds));

  return { ok: true, requests, myVoteIds };
}

export async function createFeatureRequest({ title, description, contactEmail }) {
  const supabase = await createClient();
  const {
    data: { user },
    error: authErr,
  } = await supabase.auth.getUser();

  if (authErr || !user) {
    return { ok: false, error: "Not signed in" };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  if (profile?.role !== "freelancer") {
    return { ok: false, error: "Only freelancer accounts can submit ideas here." };
  }

  const t = (title ?? "").trim();
  if (!t || t.length > 200) {
    return { ok: false, error: "Title must be between 1 and 200 characters." };
  }

  const desc = (description ?? "").trim();
  if (desc.length > 8000) {
    return { ok: false, error: "Description is too long." };
  }

  let contact_email = (contactEmail ?? "").trim() || null;
  if (contact_email && contact_email.length > 320) {
    return { ok: false, error: "Email is too long." };
  }

  const { error } = await supabase.from("feature_requests").insert({
    title: t,
    description: desc || null,
    contact_email,
    created_by: user.id,
  });

  if (error) {
    return { ok: false, error: error.message };
  }

  revalidatePath("/features");
  return { ok: true };
}

export async function voteFeatureRequest(featureRequestId) {
  const supabase = await createClient();
  const {
    data: { user },
    error: authErr,
  } = await supabase.auth.getUser();

  if (authErr || !user) {
    return { ok: false, error: "not_signed_in" };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  if (profile?.role !== "freelancer") {
    return { ok: false, error: "forbidden" };
  }

  const { error } = await supabase.from("feature_request_votes").insert({
    feature_request_id: featureRequestId,
    user_id: user.id,
  });

  if (error) {
    if (error.code === "23505") {
      return { ok: false, error: "already_voted" };
    }
    return { ok: false, error: error.message };
  }

  const { data: row } = await supabase
    .from("feature_requests")
    .select("vote_count")
    .eq("id", featureRequestId)
    .maybeSingle();

  revalidatePath("/features");
  return { ok: true, voteCount: row?.vote_count ?? 0 };
}

export async function listFeatureRequestComments(featureRequestId) {
  const supabase = await createClient();
  const {
    data: { user },
    error: authErr,
  } = await supabase.auth.getUser();

  if (authErr || !user) {
    return { ok: false, error: "unauthorized", comments: [] };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  if (profile?.role !== "freelancer") {
    return { ok: false, error: "forbidden", comments: [] };
  }

  const { data, error } = await supabase
    .from("feature_request_comments")
    .select("id, body, created_at, user_id, author_display_name, author_avatar_url")
    .eq("feature_request_id", featureRequestId)
    .order("created_at", { ascending: true });

  if (error) {
    return { ok: false, error: error.message, comments: [] };
  }

  const comments = (data ?? []).map((c) => ({
    id: c.id,
    body: c.body,
    createdAt: c.created_at,
    authorName: (c.author_display_name ?? "").trim() || "Member",
    authorAvatarUrl: c.author_avatar_url || null,
    isMine: c.user_id === user.id,
  }));

  return { ok: true, comments };
}

export async function addFeatureRequestComment(featureRequestId, body) {
  const supabase = await createClient();
  const {
    data: { user },
    error: authErr,
  } = await supabase.auth.getUser();

  if (authErr || !user) {
    return { ok: false, error: "Not signed in" };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  if (profile?.role !== "freelancer") {
    return { ok: false, error: "Only freelancer accounts can comment." };
  }

  const text = (body ?? "").trim();
  if (!text) {
    return { ok: false, error: "Comment cannot be empty." };
  }
  if (text.length > 8000) {
    return { ok: false, error: "Comment is too long." };
  }

  const { error } = await supabase.from("feature_request_comments").insert({
    feature_request_id: featureRequestId,
    user_id: user.id,
    body: text,
  });

  if (error) {
    return { ok: false, error: error.message };
  }

  revalidatePath("/features");
  return { ok: true };
}
