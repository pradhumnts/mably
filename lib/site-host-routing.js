import { NextResponse } from "next/server";
import {
  isAppOnlyPath,
  isMarketingHost,
  isMarketingOnlyPath,
  resolveAppOrigin,
  resolveMarketingOrigin,
  shouldSkipHostRouting,
} from "@/lib/site-hosts";

/**
 * Host-based routing for mably.io (marketing) vs app.mably.io (product).
 * Returns a Response to short-circuit middleware, or null to continue.
 */
export function applyHostRouting(request) {
  const host = request.headers.get("host") || "";
  const path = request.nextUrl.pathname;

  // Local dev: serve /landing and /legal in-process (no mably.io / app.mably.io redirects).
  if (shouldSkipHostRouting(request)) {
    return null;
  }

  // Do not redirect www → apex here — Vercel's domain canonicalization handles that.
  // A middleware redirect fights Vercel and causes ERR_TOO_MANY_REDIRECTS.

  if (isMarketingHost(host)) {
    if (isAppOnlyPath(path)) {
      const appOrigin = resolveAppOrigin(request.nextUrl.origin);
      const dest = new URL(`${path}${request.nextUrl.search}`, appOrigin);
      return NextResponse.redirect(dest, 308);
    }

    if (path === "/landing" || path === "/landing/") {
      const url = request.nextUrl.clone();
      url.pathname = "/";
      return NextResponse.redirect(url, 308);
    }

    if (path === "/") {
      const url = request.nextUrl.clone();
      url.pathname = "/landing";
      return NextResponse.rewrite(url);
    }

    return null;
  }

  if (isMarketingOnlyPath(path)) {
    const marketingOrigin = resolveMarketingOrigin(request.nextUrl.origin);
    const dest = new URL(`${path}${request.nextUrl.search}`, marketingOrigin);
    return NextResponse.redirect(dest, 308);
  }

  return null;
}

/** Skip auth middleware on public marketing surfaces. */
export function isPublicMarketingRequest(host, path) {
  if (!isMarketingHost(host)) return false;
  return (
    path.startsWith("/legal") ||
    path === "/whats-new" ||
    path.startsWith("/whats-new/") ||
    path === "/for" ||
    path.startsWith("/for/")
  );
}
