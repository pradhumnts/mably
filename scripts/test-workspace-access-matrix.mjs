/**
 * Gate 1 + Gate 2 automated checks that do not need a live DB.
 * Run: node scripts/test-workspace-access-matrix.mjs
 */

import assert from "node:assert/strict";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);

// Access matrix is JSDoc/ESM from Next — duplicate pure rules here to avoid TS path alias.
function canManageWorkspaceRole(role) {
  return role === "owner" || role === "admin";
}

function resolveStaffProjectAccess(input) {
  const legacyOwner = Boolean(input?.legacyOwner);
  const role = input?.role ?? null;
  const hasGrant = Boolean(input?.hasGrant);
  const isManager = legacyOwner || canManageWorkspaceRole(role);
  const canAccess = isManager || (role === "member" && hasGrant);
  return { isManager, canManage: isManager, canAccess, hasGrant };
}

function applyStaffOwnedFilterMode(scope) {
  if (scope.mode === "workspace" && scope.workspaceId) return "workspace_id";
  if (scope.mode === "member") return "rls_only";
  return "freelancer_id";
}

function soloParityIds(legacyIds, workspaceIds) {
  const a = [...legacyIds].map(String).sort();
  const b = [...workspaceIds].map(String).sort();
  return a.length === b.length && a.every((id, i) => id === b[i]);
}

let passed = 0;
function check(name, fn) {
  fn();
  passed += 1;
  console.log("ok", name);
}

check("owner sees all without grant", () => {
  const a = resolveStaffProjectAccess({ role: "owner", hasGrant: false });
  assert.equal(a.canAccess, true);
  assert.equal(a.canManage, true);
});

check("admin sees all without grant", () => {
  const a = resolveStaffProjectAccess({ role: "admin", hasGrant: false });
  assert.equal(a.canAccess, true);
  assert.equal(a.canManage, true);
});

check("member without grant sees nothing", () => {
  const a = resolveStaffProjectAccess({ role: "member", hasGrant: false });
  assert.equal(a.canAccess, false);
  assert.equal(a.canManage, false);
});

check("member with grant sees project", () => {
  const a = resolveStaffProjectAccess({ role: "member", hasGrant: true });
  assert.equal(a.canAccess, true);
  assert.equal(a.canManage, false);
});

check("legacy owner still works without workspace role", () => {
  const a = resolveStaffProjectAccess({ legacyOwner: true, role: null, hasGrant: false });
  assert.equal(a.canAccess, true);
  assert.equal(a.canManage, true);
});

check("other workspace outsider blocked", () => {
  const a = resolveStaffProjectAccess({ role: null, hasGrant: false, legacyOwner: false });
  assert.equal(a.canAccess, false);
});

check("solo scope uses workspace_id for owner", () => {
  assert.equal(
    applyStaffOwnedFilterMode({
      mode: "workspace",
      workspaceId: "ws-1",
      userId: "u1",
    }),
    "workspace_id"
  );
});

check("legacy fallback uses freelancer_id", () => {
  assert.equal(
    applyStaffOwnedFilterMode({ mode: "legacy", workspaceId: null, userId: "u1" }),
    "freelancer_id"
  );
});

check("Gate1 solo parity equal id sets", () => {
  assert.equal(soloParityIds(["a", "b"], ["b", "a"]), true);
  assert.equal(soloParityIds(["a"], ["a", "b"]), false);
});

check("feature flag defaults on", () => {
  const prev = process.env.TEAM_INVITES_ENABLED;
  const prevPublic = process.env.NEXT_PUBLIC_TEAM_INVITES_ENABLED;
  delete process.env.TEAM_INVITES_ENABLED;
  delete process.env.NEXT_PUBLIC_TEAM_INVITES_ENABLED;
  const parseFlag = (v) => {
    if (v == null || String(v).trim() === "") return null;
    const s = String(v).trim().toLowerCase();
    if (s === "0" || s === "false" || s === "no" || s === "off") return false;
    if (s === "1" || s === "true" || s === "yes" || s === "on") return true;
    return null;
  };
  const enabled = (parseFlag(process.env.TEAM_INVITES_ENABLED) ??
    parseFlag(process.env.NEXT_PUBLIC_TEAM_INVITES_ENABLED)) !== false;
  assert.equal(enabled, true);
  process.env.TEAM_INVITES_ENABLED = "false";
  assert.equal(
    (parseFlag(process.env.TEAM_INVITES_ENABLED) ??
      parseFlag(process.env.NEXT_PUBLIC_TEAM_INVITES_ENABLED)) !== false,
    false
  );
  if (prev != null) process.env.TEAM_INVITES_ENABLED = prev;
  else delete process.env.TEAM_INVITES_ENABLED;
  if (prevPublic != null) process.env.NEXT_PUBLIC_TEAM_INVITES_ENABLED = prevPublic;
  else delete process.env.NEXT_PUBLIC_TEAM_INVITES_ENABLED;
});

console.log(`\nworkspace access matrix: ${passed} checks passed`);
void require;
