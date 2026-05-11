"use server";

import { createClient } from "@/lib/supabase/server";
import { sendPortalInviteEmail } from "@/lib/actions/project-invite";
import { revalidateProjectSurfaces } from "@/lib/revalidate-project-surfaces";
import { notifyFreelancerProjectCreated } from "@/lib/notifications/freelancer-dashboard-notify";
import { getFreelancerSubscriptionForUser } from "@/lib/data/billing";
import { countActiveProjectsForCurrentUser } from "@/lib/data/projects";
import {
  hasPaidFreelancerSubscription,
  shouldBlockNewActiveProjectForStarter,
} from "@/lib/billing/project-limits";
import { isDemoProjectId, getDemoBlockedResponse } from "@/lib/data/demo-project";

function toDateString(value) {
  if (value == null || value === "") return null;
  if (value instanceof Date) {
    return value.toISOString().slice(0, 10);
  }
  if (typeof value === "string") {
    return value.slice(0, 10);
  }
  return null;
}

function normalizeMilestones(raw) {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((m) => ({
      name: typeof m?.name === "string" ? m.name.trim() : "",
      amount: typeof m?.amount === "string" || typeof m?.amount === "number" ? String(m.amount) : "",
      dueDate: m?.dueDate != null ? toDateString(m.dueDate) : null,
    }))
    .filter((m) => m.name || m.amount);
}

function normalizeQuestions(raw) {
  if (!Array.isArray(raw)) return [];
  return raw.map((q) => (typeof q === "string" ? q.trim() : "")).filter(Boolean);
}

function logoForDb(logo) {
  if (typeof logo !== "string" || !logo.trim()) return null;
  if (logo.startsWith("http://") || logo.startsWith("https://")) return logo;
  return null;
}

export async function uploadProjectLogoDataUrl(supabase, userId, projectId, dataUrl) {
  const trimmed = typeof dataUrl === "string" ? dataUrl.trim() : "";
  if (!trimmed.startsWith("data:image")) return null;

  const m = /^data:image\/(png|jpeg|jpg|gif|webp);base64,(.+)$/i.exec(trimmed);
  if (!m) return null;

  const mimeExt = m[1].toLowerCase();
  const ext =
    mimeExt === "png"
      ? "png"
      : mimeExt === "gif"
        ? "gif"
        : mimeExt === "webp"
          ? "webp"
          : "jpg";
  const contentType =
    ext === "jpg" ? "image/jpeg" : ext === "png" ? "image/png" : `image/${ext}`;

  let bytes;
  try {
    bytes = Buffer.from(m[2], "base64");
  } catch {
    return null;
  }
  if (!bytes?.length) return null;

  const path = `${userId}/${projectId}/logo.${ext}`;
  const { error: uploadErr } = await supabase.storage
    .from("project-logos")
    .upload(path, bytes, { contentType, upsert: true });

  if (uploadErr) return null;

  const { data: pub } = supabase.storage.from("project-logos").getPublicUrl(path);
  return pub?.publicUrl || null;
}

/**
 * Persist wizard payload as a project row.
 */
export async function createProject(form) {
  const supabase = await createClient();
  const {
    data: { user },
    error: authErr,
  } = await supabase.auth.getUser();

  if (authErr || !user) {
    return { ok: false, error: "Not signed in" };
  }

  const subscription = await getFreelancerSubscriptionForUser();
  const activeProjectCount = await countActiveProjectsForCurrentUser();

  if (!hasPaidFreelancerSubscription(subscription)) {
    return {
      ok: false,
      code: "NO_ACTIVE_SUBSCRIPTION",
      error:
        "Subscribe to Mably to create a project. Open Settings → Subscription to choose Starter or Growth.",
    };
  }

  if (shouldBlockNewActiveProjectForStarter(subscription, activeProjectCount)) {
    return {
      ok: false,
      code: "STARTER_ACTIVE_PROJECT_LIMIT",
      error:
        "Your Starter plan includes one active project. Upgrade to Growth in Settings → Subscription to add more.",
    };
  }

  const clientId = typeof form.clientId === "string" ? form.clientId.trim() : "";
  const name = typeof form.projectName === "string" ? form.projectName.trim() : "";
  if (!clientId || !name) {
    return { ok: false, error: "Project name and client are required" };
  }

  const pricingType = form.projectType === "milestone" ? "milestone" : "one_time";
  const milestones = pricingType === "milestone" ? normalizeMilestones(form.milestones) : [];
  const totalFeeRaw =
    pricingType === "one_time" && form.totalFee != null && form.totalFee !== ""
      ? parseFloat(String(form.totalFee))
      : null;
  const totalFee =
    pricingType === "one_time" && Number.isFinite(totalFeeRaw) ? totalFeeRaw : null;

  const { data: clientRow, error: clientErr } = await supabase
    .from("clients")
    .select("full_name, email, avatar_url")
    .eq("id", clientId)
    .eq("freelancer_id", user.id)
    .maybeSingle();

  if (clientErr || !clientRow) {
    return { ok: false, error: clientErr?.message || "Client not found" };
  }

  const { data: profileRow } = await supabase
    .from("profiles")
    .select("full_name, avatar_url, calendar_link")
    .eq("id", user.id)
    .maybeSingle();

  const freelancerDisplay =
    profileRow?.full_name?.trim() ||
    (typeof user.email === "string" ? user.email.split("@")[0] : null) ||
    "Freelancer";

  const initialLogo = logoForDb(form.projectLogo);

  const { data, error } = await supabase
    .from("projects")
    .insert({
      freelancer_id: user.id,
      client_id: clientId,
      name,
      description: typeof form.projectScope === "string" ? form.projectScope.trim() || null : null,
      start_date: toDateString(form.startDate),
      end_date: toDateString(form.dueDate),
      pricing_type: pricingType,
      total_fee: totalFee,
      milestones,
      brand_color:
        typeof form.brandColor === "string" && form.brandColor.trim()
          ? form.brandColor.trim()
          : null,
      logo_url: initialLogo,
      client_name_snapshot: clientRow.full_name?.trim() || null,
      client_email_snapshot: clientRow.email?.trim() || null,
      client_avatar_snapshot: clientRow.avatar_url ?? null,
      freelancer_display_name: freelancerDisplay,
      freelancer_avatar_url: profileRow?.avatar_url ?? null,
      freelancer_calendar_link: profileRow?.calendar_link?.trim() || null,
      welcome_message:
        typeof form.welcomeMessage === "string" ? form.welcomeMessage.trim() || null : null,
      kickoff_questions: (() => {
        if (false) {
          // TODO: flip to true when step-4 client questions UI ships again
          return normalizeQuestions(form.questions);
        }
        return [];
      })(),
      invite_email: typeof form.clientEmail === "string" ? form.clientEmail.trim() || null : null,
      invite_message:
        typeof form.inviteMessage === "string" ? form.inviteMessage.trim() || null : null,
      status: "active",
    })
    .select("id")
    .single();

  if (error) {
    return { ok: false, error: error.message };
  }

  const projectId = data?.id;
  if (!projectId) {
    return { ok: false, error: "Project was not created" };
  }

  if (
    typeof form.projectLogo === "string" &&
    form.projectLogo.trim().startsWith("data:image")
  ) {
    const publicUrl = await uploadProjectLogoDataUrl(
      supabase,
      user.id,
      projectId,
      form.projectLogo
    );
    if (publicUrl) {
      await supabase.from("projects").update({ logo_url: publicUrl }).eq("id", projectId);
    }
  }

  const { error: memberErr } = await supabase.from("project_members").insert({
    project_id: projectId,
    user_id: user.id,
    role: "owner",
  });

  if (memberErr) {
    return { ok: false, error: memberErr.message };
  }

  revalidateProjectSurfaces(projectId);

  void notifyFreelancerProjectCreated({ projectId, projectName: name });

  const inviteTo = typeof form.clientEmail === "string" ? form.clientEmail.trim() : "";
  if (inviteTo) {
    try {
      await sendPortalInviteEmail({ projectId, toEmail: inviteTo });
    } catch (e) {
      console.error("sendPortalInviteEmail:", e);
    }
  }

  return { ok: true, id: projectId };
}

/**
 * Updates invite fields on an existing project and resends the portal invite email.
 * Used when the create wizard closes step 5 and reopens it — avoids duplicate project rows.
 */
export async function updateProjectInviteAndResend({
  projectId,
  clientEmail,
  inviteMessage,
}) {
  const supabase = await createClient();
  const {
    data: { user },
    error: authErr,
  } = await supabase.auth.getUser();

  if (authErr || !user) {
    return { ok: false, error: "Not signed in" };
  }

  const pid = typeof projectId === "string" ? projectId.trim() : "";
  if (!pid) {
    return { ok: false, error: "Missing project" };
  }

  const inviteEmail = typeof clientEmail === "string" ? clientEmail.trim() : "";
  if (!inviteEmail) {
    return { ok: false, error: "Client email is required" };
  }

  const message =
    typeof inviteMessage === "string" ? inviteMessage.trim() || null : null;

  const { error } = await supabase
    .from("projects")
    .update({
      invite_email: inviteEmail,
      invite_message: message,
    })
    .eq("id", pid)
    .eq("freelancer_id", user.id);

  if (error) {
    return { ok: false, error: error.message };
  }

  const inv = await sendPortalInviteEmail({ projectId: pid, toEmail: inviteEmail });
  if (!inv.ok) {
    return { ok: false, error: inv.error || "Could not send invite email", id: pid };
  }

  revalidateProjectSurfaces(pid);
  return { ok: true, id: pid };
}

const PORTAL_STATUS_TO_DB = {
  active: "active",
  "on-hold": "on_hold",
  completed: "completed",
  draft: "draft",
};

/**
 * Freelancer-only: update core project fields from the client portal settings page.
 *
 * @param {string} projectId
 * @param {{
 *   name?: string;
 *   description?: string | null;
 *   startDate?: Date | string | null;
 *   dueDate?: Date | string | null;
 *   status?: string;
 *   logoDataUrl?: string | null;
 * }} fields
 */
export async function updatePortalProjectSettings(projectId, fields) {
  const supabase = await createClient();
  const {
    data: { user },
    error: authErr,
  } = await supabase.auth.getUser();

  if (authErr || !user) {
    return { ok: false, error: "Not signed in" };
  }

  const pid = typeof projectId === "string" ? projectId.trim() : "";
  if (!pid) {
    return { ok: false, error: "Missing project" };
  }

  if (isDemoProjectId(pid)) {
    return getDemoBlockedResponse();
  }

  const name = typeof fields.name === "string" ? fields.name.trim() : "";
  if (!name) {
    return { ok: false, error: "Project name is required" };
  }

  const statusRaw = typeof fields.status === "string" ? fields.status.trim() : "active";
  const status = PORTAL_STATUS_TO_DB[statusRaw] || statusRaw;
  if (!["draft", "active", "on_hold", "completed"].includes(status)) {
    return { ok: false, error: "Invalid status" };
  }

  const description =
    typeof fields.description === "string" ? fields.description.trim() || null : null;

  const { error } = await supabase
    .from("projects")
    .update({
      name,
      description,
      start_date: toDateString(fields.startDate ?? null),
      end_date: toDateString(fields.dueDate ?? null),
      status,
    })
    .eq("id", pid)
    .eq("freelancer_id", user.id);

  if (error) {
    return { ok: false, error: error.message };
  }

  const logo = fields.logoDataUrl;
  if (typeof logo === "string" && logo.trim().startsWith("data:image")) {
    const publicUrl = await uploadProjectLogoDataUrl(supabase, user.id, pid, logo);
    if (publicUrl) {
      await supabase.from("projects").update({ logo_url: publicUrl }).eq("id", pid);
    }
  }

  revalidateProjectSurfaces(pid);
  return { ok: true };
}

export async function deleteProject(projectId) {
  const supabase = await createClient();
  const {
    data: { user },
    error: authErr,
  } = await supabase.auth.getUser();

  if (authErr || !user) {
    return { ok: false, error: "Not signed in" };
  }

  const { error } = await supabase
    .from("projects")
    .delete()
    .eq("id", projectId)
    .eq("freelancer_id", user.id);

  if (error) {
    return { ok: false, error: error.message };
  }

  revalidateProjectSurfaces(projectId);
  return { ok: true };
}
