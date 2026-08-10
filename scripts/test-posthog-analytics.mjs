/**
 * Verifies the PostHog analytics race fix:
 * - Old gate (`__loaded` only) silently drops capture/identify before init
 * - New `ensurePostHog()` inits synchronously so first track/identify works
 *
 * Run: node scripts/test-posthog-analytics.mjs
 */

import assert from "node:assert/strict";

function createMockPosthog() {
  const calls = { init: [], capture: [], identify: [] };
  const ph = {
    __loaded: false,
    init(key, opts) {
      calls.init.push({ key, opts });
      this.__loaded = true;
    },
    capture(event, props) {
      calls.capture.push({ event, props });
    },
    identify(id, props) {
      calls.identify.push({ id, props });
    },
    reset() {},
    setPersonProperties() {},
  };
  return { ph, calls };
}

/** Old broken helper pattern */
function makeOldHelpers(ph) {
  const clientReady = () =>
    typeof globalThis.window !== "undefined" && Boolean(ph?.__loaded);

  return {
    trackEvent(event, properties = {}) {
      if (!clientReady() || !event) return;
      ph.capture(String(event), properties);
    },
    identifyUser(userId, properties = {}) {
      if (!clientReady() || !userId) return;
      ph.identify(String(userId), properties);
    },
  };
}

/** New fixed helper pattern (mirrors lib/analytics/client.js) */
function makeNewHelpers(ph, { key = "phc_test", host = "https://us.i.posthog.com" } = {}) {
  let initAttempted = false;

  function ensurePostHog() {
    if (typeof globalThis.window === "undefined") return false;
    if (!key) return false;
    if (ph.__loaded) return true;
    if (initAttempted) return Boolean(ph.__loaded);
    initAttempted = true;
    ph.init(key, { api_host: host });
    return Boolean(ph.__loaded);
  }

  return {
    ensurePostHog,
    trackEvent(event, properties = {}) {
      if (!ensurePostHog() || !event) return;
      ph.capture(String(event), properties);
    },
    identifyUser(userId, properties = {}) {
      if (!ensurePostHog() || !userId) return;
      ph.identify(String(userId), properties);
    },
  };
}

function testOldPatternDropsEventsBeforeInit() {
  const { ph, calls } = createMockPosthog();
  globalThis.window = {};
  const old = makeOldHelpers(ph);

  assert.equal(ph.__loaded, false);
  old.trackEvent("project_created", { project_id: "p1" });
  old.identifyUser("user-1", { email: "a@b.com" });

  assert.equal(calls.capture.length, 0, "old trackEvent must no-op when __loaded=false");
  assert.equal(calls.identify.length, 0, "old identifyUser must no-op when __loaded=false");
  console.log("✓ old pattern drops events before init (reproduces the bug)");
}

function testNewPatternInitsAndSends() {
  const { ph, calls } = createMockPosthog();
  globalThis.window = {};
  const neu = makeNewHelpers(ph);

  assert.equal(ph.__loaded, false);
  neu.trackEvent("project_created", { project_id: "p1" });
  neu.identifyUser("user-1", { email: "a@b.com", plan: "growth" });
  neu.trackEvent("client_invited", { project_id: "p1" });

  assert.equal(calls.init.length, 1, "ensurePostHog should init once");
  assert.equal(ph.__loaded, true);
  assert.equal(calls.capture.length, 2);
  assert.equal(calls.capture[0].event, "project_created");
  assert.equal(calls.capture[1].event, "client_invited");
  assert.equal(calls.identify.length, 1);
  assert.equal(calls.identify[0].id, "user-1");
  console.log("✓ new pattern inits sync and sends capture/identify on first call");
}

function testNewPatternNoopWithoutWindow() {
  const { ph, calls } = createMockPosthog();
  delete globalThis.window;
  const neu = makeNewHelpers(ph);

  neu.trackEvent("project_created");
  assert.equal(calls.init.length, 0);
  assert.equal(calls.capture.length, 0);
  console.log("✓ new pattern no-ops on server (no window)");
}

function testNewPatternNoopWithoutKey() {
  const { ph, calls } = createMockPosthog();
  globalThis.window = {};
  const neu = makeNewHelpers(ph, { key: "" });

  neu.trackEvent("project_created");
  assert.equal(calls.init.length, 0);
  assert.equal(calls.capture.length, 0);
  console.log("✓ new pattern no-ops when POSTHOG key missing");
}

function testIdempotentInit() {
  const { ph, calls } = createMockPosthog();
  globalThis.window = {};
  const neu = makeNewHelpers(ph);

  neu.ensurePostHog();
  neu.ensurePostHog();
  neu.trackEvent("subscription_synced");
  assert.equal(calls.init.length, 1);
  assert.equal(calls.capture.length, 1);
  console.log("✓ ensurePostHog is idempotent");
}

testOldPatternDropsEventsBeforeInit();
testNewPatternInitsAndSends();
testNewPatternNoopWithoutWindow();
testNewPatternNoopWithoutKey();
testIdempotentInit();

console.log("\nAll PostHog analytics race tests passed.");
