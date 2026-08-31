/**
 * Paths reachable on small screens during the phased mobile rollout.
 * Freelancer app: main shell, CRM, feature lab, and project workspace.
 * Public: auth, onboarding, checkout, marketing entry points.
 */

const MOBILE_ALWAYS_PREFIXES = [
  "/login",
  "/signup",
  "/onboarding",
  "/checkout",
  "/waitlist",
  "/portal",
  "/landing",
  "/legal",
  "/whats-new",
  "/for",
  "/embed",
  "/blog",
  "/pricing",
];

/** Freelancer routes under (main) and /project workspace */
const MOBILE_FREELANCER_PREFIXES = [
  "/dashboard",
  "/notifications",
  "/messages",
  "/projects",
  "/settings",
  "/clients",
  "/features",
  "/project",
  "/billing",
];

/**
 * @param {string} [pathname]
 */
export function isPathAllowedOnMobile(pathname) {
  if (!pathname || typeof pathname !== "string") return false;
  if (pathname === "/") return true;

  for (const prefix of MOBILE_ALWAYS_PREFIXES) {
    if (pathname === prefix || pathname.startsWith(`${prefix}/`)) {
      return true;
    }
  }

  for (const prefix of MOBILE_FREELANCER_PREFIXES) {
    if (pathname === prefix || pathname.startsWith(`${prefix}/`)) {
      return true;
    }
  }

  return false;
}
