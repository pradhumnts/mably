/**
 * Human workspace label for UI + invite emails.
 * Avoids bare "Personal" which reads oddly in invite copy.
 *
 * @param {string | null | undefined} fullName
 * @param {string | null | undefined} email
 */
export function workspaceDisplayNameFromProfile(fullName, email) {
  const name = (fullName || "").trim();
  if (name) {
    const first = name.split(/\s+/)[0];
    return possessive(first) + " workspace";
  }
  const local = (email || "").trim().split("@")[0];
  if (local) return possessive(local) + " workspace";
  return "Workspace";
}

function possessive(word) {
  const w = String(word || "").trim() || "Team";
  return /s$/i.test(w) ? `${w}'` : `${w}'s`;
}
