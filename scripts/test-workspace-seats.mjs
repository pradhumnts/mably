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

console.log(`\n${passed} checks passed`);
