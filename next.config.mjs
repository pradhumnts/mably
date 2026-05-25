import { withSentryConfig } from "@sentry/nextjs";

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Server Action body limit must live under `experimental.serverActions` (see Next.js docs).
  // Top-level `serverActions` is ignored — default 1 MB caused large library uploads to fail.
  experimental: {
    serverActions: {
      /** Must cover largest library file (Growth) plus multipart overhead. */
      bodySizeLimit: "2200mb",
    },
  },
  async headers() {
    return [
      {
        // Public embeds — must be loadable inside iframes on any origin
        // (Framer landing at mably.io, etc.). The rest of the app still
        // gets Next's default protections.
        source: "/embed/:path*",
        headers: [
          // Modern browsers honor frame-ancestors over X-Frame-Options.
          // Wildcard lets Framer (mably.io) and any future host iframe this.
          { key: "Content-Security-Policy", value: "frame-ancestors *;" },
          { key: "Access-Control-Allow-Origin", value: "*" },
        ],
      },
      {
        source: "/embed/early-offer.js",
        headers: [
          { key: "Access-Control-Allow-Origin", value: "*" },
          { key: "Cache-Control", value: "public, max-age=300, s-maxage=300" },
        ],
      },
    ];
  },
};

export default withSentryConfig(nextConfig, {
  silent: true,
  org: process.env.SENTRY_ORG || undefined,
  project: process.env.SENTRY_PROJECT || undefined,
  authToken: process.env.SENTRY_AUTH_TOKEN || undefined,
});
