import { createAdminClient } from "@/lib/supabase/admin";
import { notifyFreelancerInvoiceOverdueForCron } from "@/lib/notifications/freelancer-dashboard-notify";
import { enqueueFreelancerInboxInvoiceOverdue } from "@/lib/notifications/trigger-freelancer-inbox";

/**
 * Sends at most one overdue email per unpaid invoice (see `freelancer_overdue_notified_at`).
 * Requires `SUPABASE_SERVICE_ROLE_KEY` and Resend env vars.
 *
 * @returns {Promise<{ ok: boolean; error?: string; scanned?: number; processed?: number; errors?: number }>}
 */
export async function sendOverdueInvoiceReminders() {
  const admin = createAdminClient();
  if (!admin) {
    return {
      ok: false,
      error: "SUPABASE_SERVICE_ROLE_KEY is not set",
      scanned: 0,
      processed: 0,
      errors: 0,
    };
  }

  const today = new Date().toISOString().slice(0, 10);

  const { data: rows, error } = await admin
    .from("project_invoices")
    .select(
      `
      id,
      project_id,
      amount,
      due_date,
      projects!inner (
        name,
        freelancer_id
      )
    `
    )
    .eq("status", "unpaid")
    .is("freelancer_overdue_notified_at", null)
    .lt("due_date", today);

  if (error) {
    return { ok: false, error: error.message, scanned: 0, processed: 0, errors: 0 };
  }

  let processed = 0;
  let errors = 0;

  for (const row of rows ?? []) {
    const rawProj = row.projects;
    const proj = /** @type {{ name?: string; freelancer_id?: string } | null} */ (
      Array.isArray(rawProj) ? rawProj[0] ?? null : rawProj ?? null
    );
    const freelancerId = proj?.freelancer_id;
    if (!freelancerId) continue;

    const { data: profile } = await admin
      .from("profiles")
      .select("email, notification_preferences")
      .eq("id", freelancerId)
      .maybeSingle();

    const to = (profile?.email ?? "").trim();
    if (!to) continue;

    const amountLabel = new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(Number(row.amount));

    const dueDateLabel =
      typeof row.due_date === "string" ? row.due_date : String(row.due_date ?? "");

    enqueueFreelancerInboxInvoiceOverdue({
      freelancerId,
      projectId: row.project_id,
      invoiceId: row.id,
      projectName: proj?.name ?? "Project",
      dueDateLabel,
      notificationPreferences: profile?.notification_preferences,
    });

    const result = await notifyFreelancerInvoiceOverdueForCron({
      to,
      projectId: row.project_id,
      projectName: proj?.name ?? "Project",
      invoiceId: row.id,
      amountLabel,
      dueDateLabel,
      notificationPreferences: profile?.notification_preferences,
    });

    if (result.ok && result.skipped) {
      continue;
    }
    if (!result.ok) {
      errors += 1;
      continue;
    }

    const { error: upErr } = await admin
      .from("project_invoices")
      .update({ freelancer_overdue_notified_at: new Date().toISOString() })
      .eq("id", row.id);

    if (upErr) {
      errors += 1;
    } else {
      processed += 1;
    }
  }

  return {
    ok: true,
    scanned: (rows ?? []).length,
    processed,
    errors,
  };
}
