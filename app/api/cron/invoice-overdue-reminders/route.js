import { NextResponse } from "next/server";
import { sendOverdueInvoiceReminders } from "@/lib/jobs/send-overdue-invoice-reminders";

export const dynamic = "force-dynamic";

/**
 * Daily (or on-demand) job: email freelancers about unpaid invoices past due date.
 * Secure with `Authorization: Bearer <CRON_SECRET>` (same pattern as Vercel Cron).
 */
export async function GET(request) {
  const secret = process.env.CRON_SECRET?.trim();
  if (!secret) {
    return NextResponse.json(
      { ok: false, error: "CRON_SECRET is not configured" },
      { status: 503 }
    );
  }

  const auth = request.headers.get("authorization") ?? "";
  if (auth !== `Bearer ${secret}`) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }

  const result = await sendOverdueInvoiceReminders();
  if (!result.ok) {
    return NextResponse.json(result, { status: 503 });
  }

  return NextResponse.json(result);
}
