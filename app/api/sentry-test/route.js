import { NextResponse } from "next/server";
import * as Sentry from "@sentry/nextjs";

export const runtime = "nodejs";

/**
 * Temporary Sentry smoke test endpoint.
 * - GET /api/sentry-test -> captures a test message (returns eventId)
 * - GET /api/sentry-test?throw=1 -> throws an unhandled error (for exception pipeline test)
 */
export async function GET(request) {
  const url = new URL(request.url);
  const shouldThrow = url.searchParams.get("throw") === "1";

  if (shouldThrow) {
    throw new Error("Sentry test exception from /api/sentry-test");
  }

  const eventId = Sentry.captureMessage("Sentry test message from /api/sentry-test", {
    level: "error",
    tags: {
      source: "manual-smoke-test",
      route: "/api/sentry-test",
    },
  });

  await Sentry.flush(2000);

  return NextResponse.json({
    ok: true,
    sentryEventId: eventId,
  });
}

