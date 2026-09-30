import { timingSafeEqual } from "node:crypto";
import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";

/**
 * Called by Mably HQ after a post is published, updated, unpublished or deleted, so
 * mably.io/blog shows the change now instead of within the 5-minute refresh window.
 * Auth: `Authorization: Bearer <BLOG_REVALIDATE_SECRET>` (same value set in Mably HQ).
 */
export async function POST(request) {
  const secret = process.env.BLOG_REVALIDATE_SECRET;
  if (!secret) {
    return NextResponse.json({ error: "Not configured" }, { status: 503 });
  }

  const header = request.headers.get("authorization") ?? "";
  const given = Buffer.from(header.replace(/^Bearer\s+/i, ""));
  const expected = Buffer.from(secret);
  if (given.length !== expected.length || !timingSafeEqual(given, expected)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let slugs = [];
  try {
    const body = await request.json();
    if (Array.isArray(body?.slugs)) slugs = body.slugs;
  } catch {
    // No body: just refresh the index and sitemap.
  }

  revalidatePath("/blog");
  revalidatePath("/sitemap.xml");
  for (const slug of slugs.slice(0, 20)) {
    if (typeof slug === "string" && /^[a-z0-9-]{1,120}$/.test(slug)) {
      revalidatePath(`/blog/${slug}`);
    }
  }

  return NextResponse.json({ ok: true });
}
