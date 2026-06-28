import { NextResponse } from "next/server";
import {
  isAppOnlyPath,
  isLocalDevHost,
  isMarketingHost,
  isMarketingOnlyPath,
  normalizeHost,
  resolveAppOrigin,
  resolveMarketingOrigin,
} from "@/lib/site-hosts";

/**
 * Host-based routing for mably.io (marketing) vs app.mably.io (product).
 * Returns a Response to short-circuit middleware, or null to continue.
 */
export function applyHostRouting(request) {
  const host = request.headers.get("host") || "";
  const normalizedHost = normalizeHost(host);
  const path = request.nextUrl.pathname;

  // Local dev: serve /landing and /legal on localhost without cross-host redirects.
  if (isLocalDevHost(normalizedHost)) {
    return null;
  }

  if (normalizedHost.startsWith("www.")) {
    const apex = normalizedHost.slice(4);
    const url = request.nextUrl.clone();
    url.hostname = apex;
    return NextResponse.redirect(url, 308);
  }

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
  return isMarketingHost(host) && path.startsWith("/legal");
}
