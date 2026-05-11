"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { PROJECT_ACTIVITY_EVENT_TYPES } from "@/lib/activity/project-activity-event-types";
import { recordProjectActivityEvent } from "@/lib/activity/record-project-activity-event";
import {
  notifyPortalInvoiceCreated,
  notifyPortalInvoiceStatusChanged,
} from "@/lib/notifications/trigger-portal-email";
import {
  isDemoProjectId,
  getDemoProjectInvoices,
  getDemoBlockedResponse,
} from "@/lib/data/demo-project";

function revalidatePayments(projectId) {
  revalidatePath(`/project/${projectId}/payments`);
}

function normalizeExternalUrl(raw) {
  const t = typeof raw === "string" ? raw.trim() : "";
  if (!t) return "";
  if (/^https?:\/\//i.test(t)) return t;
  return `https://${t}`;
}

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

function mapRow(row) {
  return {
    id: row.id,
    amount: row.amount != null ? Number(row.amount) : 0,
    invoiceDate: row.invoice_date,
    dueDate: row.due_date,
    invoiceLink: row.invoice_link,
    notes: row.notes ?? "",
    status: row.status,
    createdAt: row.created_at,
  };
}

/**
 * @param {string} projectId
 */
export async function listProjectInvoices(projectId) {
  const supabase = await createClient();
  const {
    data: { user },
    error: authErr,
  } = await supabase.auth.getUser();

  if (authErr || !user) {
    return { ok: false, error: "Not signed in", rows: [] };
  }

  const pid = typeof projectId === "string" ? projectId.trim() : "";
  if (!pid) {
    return { ok: false, error: "Missing project", rows: [] };
  }

  if (isDemoProjectId(pid)) {
    return { ok: true, rows: getDemoProjectInvoices() };
  }

  const { data, error } = await supabase
    .from("project_invoices")
    .select("id, amount, invoice_date, due_date, invoice_link, notes, status, created_at")
    .eq("project_id", pid)
    .order("created_at", { ascending: false });

  if (error) {
    return { ok: false, error: error.message, rows: [] };
  }

  return { ok: true, rows: (data ?? []).map(mapRow) };
}

/**
 * @param {string} projectId
 * @param {{
 *   amount: number;
 *   invoiceDate: Date | string;
 *   dueDate: Date | string;
 *   invoiceLink: string;
 *   notes?: string | null;
 * }} input
 */
export async function createProjectInvoice(projectId, input) {
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
    return getDemoBlockedResponse({ row: null });
  }

  const amount = typeof input.amount === "number" ? input.amount : Number(input.amount);
  if (!Number.isFinite(amount) || amount <= 0) {
    return { ok: false, error: "Enter a valid amount greater than zero" };
  }

  const invoiceLink = normalizeExternalUrl(input.invoiceLink);
  if (!invoiceLink || !/^https?:\/\//i.test(invoiceLink)) {
    return { ok: false, error: "Invoice link must start with http:// or https://" };
  }

  const invoiceDate = toDateString(input.invoiceDate ?? null);
  const dueDate = toDateString(input.dueDate ?? null);
  if (!invoiceDate || !dueDate) {
    return { ok: false, error: "Invoice date and due date are required" };
  }

  const notesRaw = input.notes;
  const notes =
    typeof notesRaw === "string" && notesRaw.trim() ? notesRaw.trim().slice(0, 4000) : null;

  const { data: projectRow, error: projectErr } = await supabase
    .from("projects")
    .select("id, freelancer_id")
    .eq("id", pid)
    .maybeSingle();

  if (projectErr || !projectRow) {
    return { ok: false, error: "Project not found" };
  }
  if (projectRow.freelancer_id !== user.id) {
    return { ok: false, error: "Only the project freelancer can add invoices" };
  }

  const { data: inserted, error } = await supabase
    .from("project_invoices")
    .insert({
      project_id: pid,
      amount,
      invoice_date: invoiceDate,
      due_date: dueDate,
      invoice_link: invoiceLink,
      notes,
      status: "unpaid",
      created_by: user.id,
    })
    .select("id, amount, invoice_date, due_date, invoice_link, notes, status, created_at")
    .maybeSingle();

  if (error) {
    return { ok: false, error: error.message };
  }

  if (inserted?.id) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("full_name, avatar_url")
      .eq("id", user.id)
      .maybeSingle();

    const actorDisplayName =
      profile?.full_name?.trim() || user.email?.split("@")[0] || "Member";

    await recordProjectActivityEvent(supabase, {
      projectId: pid,
      eventType: PROJECT_ACTIVITY_EVENT_TYPES.INVOICE_CREATED,
      actorId: user.id,
      actorDisplayName,
      actorAvatarUrl: profile?.avatar_url ?? null,
      payload: {
        invoice_id: inserted.id,
        amount,
        invoice_link: invoiceLink,
      },
    });

    const amountLabel = new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);

    void notifyPortalInvoiceCreated({
      projectId: pid,
      projectFreelancerId: projectRow.freelancer_id,
      actorUserId: user.id,
      actorName: actorDisplayName,
      actorAvatarUrl: profile?.avatar_url ?? null,
      amountLabel,
    });
  }

  revalidatePayments(pid);
  return { ok: true, row: inserted ? mapRow(inserted) : null };
}

/**
 * @param {string} projectId
 * @param {string} invoiceId
 * @param {'unpaid' | 'paid' | 'canceled'} status
 */
export async function updateProjectInvoiceStatus(projectId, invoiceId, status) {
  const supabase = await createClient();
  const {
    data: { user },
    error: authErr,
  } = await supabase.auth.getUser();

  if (authErr || !user) {
    return { ok: false, error: "Not signed in" };
  }

  const pid = typeof projectId === "string" ? projectId.trim() : "";
  const iid = typeof invoiceId === "string" ? invoiceId.trim() : "";
  if (!pid || !iid) {
    return { ok: false, error: "Missing invoice" };
  }

  if (isDemoProjectId(pid)) {
    return getDemoBlockedResponse();
  }

  if (!["unpaid", "paid", "canceled"].includes(status)) {
    return { ok: false, error: "Invalid status" };
  }

  const { data: inv, error: fetchErr } = await supabase
    .from("project_invoices")
    .select("id, status, amount")
    .eq("id", iid)
    .eq("project_id", pid)
    .maybeSingle();

  if (fetchErr || !inv) {
    return { ok: false, error: fetchErr?.message || "Invoice not found" };
  }

  if (inv.status === status) {
    revalidatePayments(pid);
    return { ok: true };
  }

  const { error } = await supabase
    .from("project_invoices")
    .update({ status })
    .eq("id", iid)
    .eq("project_id", pid);

  if (error) {
    return { ok: false, error: error.message };
  }

  const { data: projectRow } = await supabase
    .from("projects")
    .select("freelancer_id")
    .eq("id", pid)
    .maybeSingle();

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, avatar_url")
    .eq("id", user.id)
    .maybeSingle();

  const actorDisplayName =
    profile?.full_name?.trim() || user.email?.split("@")[0] || "Member";

  const amount = inv.amount != null ? Number(inv.amount) : 0;
  const amountLabel = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Number.isFinite(amount) ? amount : 0);

  if (projectRow?.freelancer_id) {
    void notifyPortalInvoiceStatusChanged({
      projectId: pid,
      projectFreelancerId: projectRow.freelancer_id,
      actorUserId: user.id,
      actorName: actorDisplayName,
      actorAvatarUrl: profile?.avatar_url ?? null,
      status,
      amountLabel,
      invoiceId: inv.id,
    });
  }

  revalidatePayments(pid);
  return { ok: true };
}

/**
 * @param {string} projectId
 * @param {string} invoiceId
 */
export async function deleteProjectInvoice(projectId, invoiceId) {
  const supabase = await createClient();
  const {
    data: { user },
    error: authErr,
  } = await supabase.auth.getUser();

  if (authErr || !user) {
    return { ok: false, error: "Not signed in" };
  }

  const pid = typeof projectId === "string" ? projectId.trim() : "";
  const iid = typeof invoiceId === "string" ? invoiceId.trim() : "";
  if (!pid || !iid) {
    return { ok: false, error: "Missing invoice" };
  }

  if (isDemoProjectId(pid)) {
    return getDemoBlockedResponse();
  }

  const { error } = await supabase.from("project_invoices").delete().eq("id", iid).eq("project_id", pid);

  if (error) {
    return { ok: false, error: error.message };
  }

  revalidatePayments(pid);
  return { ok: true };
}
