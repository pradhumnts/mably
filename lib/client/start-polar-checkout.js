import { checkoutErrorMessageFromPayload } from "@/lib/billing/format-polar-api-error";
import { trackEvent } from "@/lib/analytics/client";

/**
 * Start Polar hosted checkout (redirects away on success).
 * @param {{ plan: "starter" | "growth"; founding?: boolean }} opts
 */
export async function startPolarCheckout({ plan, founding = false }) {
  const normalizedPlan = plan === "growth" ? "growth" : "starter";
  trackEvent("checkout_started", {
    plan: normalizedPlan,
    founding: Boolean(founding),
  });

  const res = await fetch("/api/billing/polar-checkout", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      plan: normalizedPlan,
      founding,
    }),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    trackEvent("checkout_failed", {
      plan: normalizedPlan,
      founding: Boolean(founding),
      error: checkoutErrorMessageFromPayload(json, "Could not start checkout"),
    });
    throw new Error(checkoutErrorMessageFromPayload(json, "Could not start checkout"));
  }
  if (!json.url) {
    trackEvent("checkout_failed", {
      plan: normalizedPlan,
      founding: Boolean(founding),
      error: "No checkout URL returned",
    });
    throw new Error("No checkout URL returned");
  }
  window.location.href = json.url;
}
