"use client";

import { useEffect, useRef } from "react";
import { identifyUser } from "@/lib/analytics/client";

/**
 * Identifies the signed-in user in PostHog once per distinct id + key props change.
 *
 * @param {{
 *   userId?: string | null;
 *   email?: string | null;
 *   name?: string | null;
 *   role?: string | null;
 *   plan?: string | null;
 *   subscriptionStatus?: string | null;
 *   hasSubscription?: boolean | null;
 *   extra?: Record<string, unknown>;
 * }} props
 */
export function PostHogIdentify({
  userId,
  email,
  name,
  role,
  plan,
  subscriptionStatus,
  hasSubscription,
  extra,
}) {
  const lastKeyRef = useRef("");

  useEffect(() => {
    const id = typeof userId === "string" ? userId.trim() : "";
    if (!id) return;

    const props = {
      email: email || undefined,
      name: name || undefined,
      role: role || undefined,
      plan: plan || "free",
      subscription_status: subscriptionStatus || "none",
      has_subscription: Boolean(hasSubscription),
      ...(extra && typeof extra === "object" ? extra : {}),
    };

    const key = JSON.stringify({ id, props });
    if (key === lastKeyRef.current) return;
    lastKeyRef.current = key;

    identifyUser(id, props);
  }, [
    userId,
    email,
    name,
    role,
    plan,
    subscriptionStatus,
    hasSubscription,
    extra,
  ]);

  return null;
}
