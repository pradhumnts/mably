/**
 * Team invites (workspace members + project grants).
 * Default ON after Gate 0/1. Set TEAM_INVITES_ENABLED=false to disable.
 */

function parseFlag(v) {
  if (v == null || String(v).trim() === "") return null;
  const s = String(v).trim().toLowerCase();
  if (s === "0" || s === "false" || s === "no" || s === "off") return false;
  if (s === "1" || s === "true" || s === "yes" || s === "on") return true;
  return null;
}

/** Server-side gate for invite/accept/staff-grant mutations. Defaults to enabled. */
export function isTeamInvitesEnabled() {
  const explicit =
    parseFlag(process.env.TEAM_INVITES_ENABLED) ??
    parseFlag(process.env.NEXT_PUBLIC_TEAM_INVITES_ENABLED);
  return explicit !== false;
}

/** Client-visible mirror. Defaults to enabled. */
export function isTeamInvitesEnabledPublic() {
  const explicit = parseFlag(process.env.NEXT_PUBLIC_TEAM_INVITES_ENABLED);
  if (explicit !== null) return explicit;
  return true;
}
