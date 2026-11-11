/**
 * Seat billing pure-rule checks (no live Polar / DB).
 * Run: node scripts/test-workspace-seats.mjs
 */

import assert from "node:assert/strict";

/** Mirrors lib/billing/workspace-seats.js#desiredSeatsFromMemberCount */
function desiredSeatsFromMemberCount(memberCount) {
  const n = Number(memberCount);
  if (!Number.isFinite(n) || n < 1) return 1;
  return Math.floor(n);
}

/** Mirrors lib/billing/sync-subscription-from-polar.js#seatsFromPolarSubscription */
function seatsFromPolarSubscription(data) {
  if (!data || typeof data !== "object") return 1;
  const raw = data.seats ?? data.units ?? data.seat_count ?? data.seatCount ?? null;
  const n = Number(raw);
  if (!Number.isFinite(n) || n < 1) return 1;
  return Math.floor(n);
}

function unpaidOwnerBlocked(subscription) {
  const paid = new Set(["active", "trialing", "past_due"]);
  return !(subscription && paid.has(String(subscription.status ?? "").toLowerCase()));
}

function acceptShouldRollback(polarOk) {
  return !polarOk;
}

let passed = 0;
function check(name, fn) {
  fn();
  passed += 1;
  console.log("ok", name);
}

check("solo owner → 1 seat", () => {
  assert.equal(desiredSeatsFromMemberCount(1), 1);
});

check("3 members → 3 seats", () => {
  assert.equal(desiredSeatsFromMemberCount(3), 3);
});

check("zero / invalid → floor at 1", () => {
  assert.equal(desiredSeatsFromMemberCount(0), 1);
  assert.equal(desiredSeatsFromMemberCount(-2), 1);
  assert.equal(desiredSeatsFromMemberCount(null), 1);
});

check("Polar seats / units mirrored", () => {
  assert.equal(seatsFromPolarSubscription({ seats: 4 }), 4);
  assert.equal(seatsFromPolarSubscription({ units: 2 }), 2);
  assert.equal(seatsFromPolarSubscription({}), 1);
});

check("unpaid owner blocked from invite", () => {
  assert.equal(unpaidOwnerBlocked(null), true);
  assert.equal(unpaidOwnerBlocked({ status: "canceled" }), true);
  assert.equal(unpaidOwnerBlocked({ status: "active" }), false);
});

check("accept rolls back when Polar fails", () => {
  assert.equal(acceptShouldRollback(false), true);
  assert.equal(acceptShouldRollback(true), false);
});

/** Mirrors lib/billing/workspace-seats.js#isPolarSubscriptionSeatBased */
function isPolarSubscriptionSeatBased(polarSub) {
  if (!polarSub || typeof polarSub !== "object") return false;
  if (polarSub.seats != null && Number.isFinite(Number(polarSub.seats))) return true;
  const price = polarSub.price && typeof polarSub.price === "object" ? polarSub.price : null;
  const amountType = String(price?.amount_type ?? price?.amountType ?? "").toLowerCase();
  if (amountType === "seat_based" || amountType === "seats") return true;
  const product = polarSub.product && typeof polarSub.product === "object" ? polarSub.product : null;
  const prices = Array.isArray(product?.prices) ? product.prices : [];
  return prices.some((p) => {
    const t = String(p?.amount_type ?? p?.amountType ?? "").toLowerCase();
    return t === "seat_based" || t === "seats";
  });
}

/** Mirrors classifyPolarSeatSyncFailure payment / not-seat / inactive branches */
function classifyCode(args) {
  if (args.preflightCode) return args.preflightCode;
  const blob = String(args.blob || "").toLowerCase();
  if (blob.includes("paymentfailed") || blob.includes("payment method")) return "payment_failed";
  if (blob.includes("not seat") || blob.includes("seat-based")) return "not_seat_based";
  if (blob.includes("insufficient_scope")) return "insufficient_scope";
  if (blob.includes("canceled") || blob.includes("cancelled")) return "subscription_inactive";
  return "polar_error";
}

check("fixed-price Polar sub is not seat-based", () => {
  assert.equal(
    isPolarSubscriptionSeatBased({
      seats: null,
      status: "canceled",
      price: { amount_type: "fixed" },
      product: { name: "Mably Growth Pack", prices: [{ amount_type: "fixed" }] },
    }),
    false
  );
});

check("numeric seats marks seat-based", () => {
  assert.equal(isPolarSubscriptionSeatBased({ seats: 1 }), true);
});

check("classify payment vs not-seat vs canceled", () => {
  assert.equal(classifyCode({ blob: "PaymentFailed: card declined" }), "payment_failed");
  assert.equal(classifyCode({ blob: "Subscription is not seat-based" }), "not_seat_based");
  assert.equal(classifyCode({ blob: "insufficient_scope" }), "insufficient_scope");
  assert.equal(classifyCode({ preflightCode: "subscription_inactive" }), "subscription_inactive");
});

console.log(`\n${passed} checks passed`);
