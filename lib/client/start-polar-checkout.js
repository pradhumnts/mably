import { checkoutErrorMessageFromPayload } from "@/lib/billing/format-polar-api-error";

/**
 * Start Polar hosted checkout (redirects away on success).
 * @param {{ plan: "starter" | "growth"; founding?: boolean }} opts
 */
export async function startPolarCheckout({ plan, founding = false }) {
  const res = await fetch("/api/billing/polar-checkout", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      plan: plan === "growth" ? "growth" : "starter",
      founding,
    }),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(checkoutErrorMessageFromPayload(json, "Could not start checkout"));
  }
  if (!json.url) {
    throw new Error("No checkout URL returned");
  }
  window.location.href = json.url;
}
