"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getUserFromClaims } from "@/lib/auth/current-user";
import {
  ACTIVE_WORKSPACE_COOKIE,
  ACTIVE_WORKSPACE_MAX_AGE,
} from "@/lib/teams/active-workspace-cookie";

/**
 * Switch the active workspace for the signed-in user (must be a member).
 * @param {string} workspaceId
 */
export async function setActiveWorkspace(workspaceId) {
  const id = typeof workspaceId === "string" ? workspaceId.trim() : "";
  if (!id) return { ok: false, error: "Missing workspace" };

  const supabase = await createClient();
  const user = await getUserFromClaims(supabase);
  if (!user) return { ok: false, error: "Not signed in" };

  const { data: mem, error } = await supabase
    .from("workspace_members")
    .select("workspace_id, role")
    .eq("workspace_id", id)
    .eq("user_id", user.id)
    .maybeSingle();

  if (error || !mem) {
    return { ok: false, error: "You are not a member of that workspace" };
  }

  const jar = await cookies();
  jar.set(ACTIVE_WORKSPACE_COOKIE, id, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: ACTIVE_WORKSPACE_MAX_AGE,
  });

  revalidatePath("/", "layout");
  return { ok: true, workspaceId: id, role: mem.role };
}
