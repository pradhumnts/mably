import { getAppOrigin, getMarketingOrigin } from "@/lib/site-urls";

function parseHostList(raw, fallback) {
  const value = (raw || fallback).trim();
  return value
    .split(",")
    .map((host) => host.trim().toLowerCase())
    .filter(Boolean);
}

export function normalizeHost(host) {
  if (!host) return "";
  let normalized = host.split(":")[0].trim().toLowerCase();
  if (normalized.startsWith("[") && normalized.endsWith("]")) {
    normalized = normalized.slice(1, -1);
  }
  return normalized;
}

export function isLocalDevHost(host) {
  const normalized = normalizeHost(host);
  return (
    !normalized ||
    normalized === "localhost" ||
    normalized === "127.0.0.1" ||
    normalized === "::1" ||
    normalized.endsWith(".local")
  );
}

/** True during `npm run dev` — skip production host splits locally. */
export function isDevelopmentRuntime() {
  return process.env.NODE_ENV === "development";
}

export function shouldSkipHostRouting(request) {
  if (isDevelopmentRuntime()) return true;
  const host = request.headers.get("host") || "";
  return isLocalDevHost(host);
}

export function getMarketingHosts() {
  return parseHostList(
    process.env.MARKETING_HOSTS || process.env.NEXT_PUBLIC_MARKETING_HOSTS,
    "mably.io,www.mably.io"
  );
}

export function getAppHosts() {
  return parseHostList(
    process.env.APP_HOSTS || process.env.NEXT_PUBLIC_APP_HOSTS,
    "app.mably.io"
  );
}

export function isMarketingHost(host) {
  const normalized = normalizeHost(host);
  if (isLocalDevHost(normalized)) return false;
  return getMarketingHosts().includes(normalized);
}

export function isAppHost(host) {
  const normalized = normalizeHost(host);
  if (isLocalDevHost(normalized)) return true;
  return getAppHosts().includes(normalized);
}

const APP_ONLY_PREFIXES = [
  "/login",
  "/signup",
  "/dashboard",
  "/notifications",
  "/projects",
  "/clients",
  "/features",
  "/billing",
  "/settings",
  "/demo",
  "/project",
  "/portal",
  "/onboarding",
  "/waitlist",
  "/checkout",
  "/auth",
];

export function isAppOnlyPath(path) {
  return APP_ONLY_PREFIXES.some(
    (prefix) => path === prefix || path.startsWith(`${prefix}/`)
  );
}

const MARKETING_ONLY_PREFIXES = ["/legal", "/landing", "/whats-new", "/for"];

export function isMarketingOnlyPath(path) {
  return MARKETING_ONLY_PREFIXES.some(
    (prefix) => path === prefix || path.startsWith(`${prefix}/`)
  );
}

export function resolveAppOrigin(fallbackOrigin) {
  return getAppOrigin() || fallbackOrigin.replace(/\/$/, "");
}

export function resolveMarketingOrigin(fallbackOrigin) {
  return getMarketingOrigin() || fallbackOrigin.replace(/\/$/, "");
}
