import { redirect } from "next/navigation";

/** Billing moved to Settings → Subscription; keep route for old links and Polar return URLs. */
export default function BillingPage() {
  redirect("/settings?tab=subscription");
}
