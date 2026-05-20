"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { syncFreelancerIdentityToProjectSnapshots } from "@/lib/sync-freelancer-portal-snapshots";
import {
  normalizeHexColor,
  normalizePortalBrandColorForStorage,
} from "@/lib/branding/portal-brand-tokens";

function revalidateProfileSurfaces() {
  revalidatePath("/settings");
  revalidatePath("/settings", "layout");
  revalidatePath("/projects", "layout");
  revalidatePath("/projects/new");
}

/**
 * Persist profile fields shown on Settings → Profile (excluding sign-in email).
 */
export async function updateProfile(fields) {
  const supabase = await createClient();
  const {
    data: { user },
    error: authErr,
  } = await supabase.auth.getUser();

  if (authErr || !user) {
    return { ok: false, error: "Not signed in" };
  }

  const full_name = (fields.fullName ?? "").trim() || null;
  const phone = (fields.phone ?? "").trim() || null;
  const title = (fields.title ?? "").trim() || null;
  const location = (fields.location ?? "").trim() || null;

  const { error } = await supabase
    .from("profiles")
    .update({
      full_name,
      phone,
      title,
      location,
      email: user.email ?? null,
    })
    .eq("id", user.id);

  if (error) {
    return { ok: false, error: error.message };
  }

  await syncFreelancerIdentityToProjectSnapshots(supabase, user);
  revalidateProfileSurfaces();
  return { ok: true };
}

/**
 * Settings → Calendar: persist booking URL on the user's profile row.
 */
export async function updateCalendarLink(fields) {
  const supabase = await createClient();
  const {
    data: { user },
    error: authErr,
  } = await supabase.auth.getUser();

  if (authErr || !user) {
    return { ok: false, error: "Not signed in" };
  }

  const raw = (fields.calendarLink ?? "").trim();
  let calendar_link = null;

  if (raw) {
    try {
      const parsed = new URL(raw);
      if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
        return { ok: false, error: "Calendar link must start with http:// or https://" };
      }
      calendar_link = parsed.href;
    } catch {
      return {
        ok: false,
        error: "Use a full URL starting with https:// (e.g. your Calendly or Cal.com link)",
      };
    }
  }

  const { error } = await supabase
    .from("profiles")
    .update({ calendar_link })
    .eq("id", user.id);

  if (error) {
    return { ok: false, error: error.message };
  }

  await syncFreelancerIdentityToProjectSnapshots(supabase, user);
  revalidateProfileSurfaces();
  return { ok: true };
}

/**
 * Settings → Branding: default accent for new client portals.
 */
export async function updateFreelancerDefaultBrandColor(fields) {
  const supabase = await createClient();
  const {
    data: { user },
    error: authErr,
  } = await supabase.auth.getUser();

  if (authErr || !user) {
    return { ok: false, error: "Not signed in" };
  }

  const raw =
    fields.brandColor === null
      ? ""
      : typeof fields.brandColor === "string"
        ? fields.brandColor.trim()
        : "";

  if (!raw) {
    const { error } = await supabase
      .from("profiles")
      .update({ default_brand_color: null })
      .eq("id", user.id);

    if (error) {
      return { ok: false, error: error.message };
    }

    revalidateProfileSurfaces();
    return { ok: true };
  }

  const normalized = normalizeHexColor(raw);
  if (!normalized) {
    return { ok: false, error: "Enter a valid brand color (e.g. #f97316)" };
  }

  const default_brand_color = normalizePortalBrandColorForStorage(normalized);

  const { error } = await supabase
    .from("profiles")
    .update({ default_brand_color })
    .eq("id", user.id);

  if (error) {
    return { ok: false, error: error.message };
  }

  revalidateProfileSurfaces();
  return { ok: true };
}

/**
 * Upload a profile image to Storage and set profiles.avatar_url.
 * Expects FormData with key "file" (image, max 5MB).
 */
export async function uploadProfileAvatar(formData) {
  const supabase = await createClient();
  const {
    data: { user },
    error: authErr,
  } = await supabase.auth.getUser();

  if (authErr || !user) {
    return { ok: false, error: "Not signed in" };
  }

  const file = formData.get("file");
  if (!file || typeof file === "string" || file.size === 0) {
    return { ok: false, error: "No file selected" };
  }

  if (file.size > 5 * 1024 * 1024) {
    return { ok: false, error: "Image must be 5MB or smaller" };
  }

  const nameMatch = /\.(jpe?g|png|gif|webp)$/i.exec(file.name);
  const extRaw = nameMatch ? nameMatch[1].toLowerCase() : file.type?.split("/")[1] || "jpg";
  const ext = extRaw === "jpeg" ? "jpg" : extRaw;
  const objectPath = `${user.id}/avatar.${ext}`;

  const bytes = await file.arrayBuffer();
  const { error: upErr } = await supabase.storage.from("avatars").upload(objectPath, bytes, {
    contentType: file.type || "image/jpeg",
    upsert: true,
  });

  if (upErr) {
    return { ok: false, error: upErr.message };
  }

  const { data: pub } = supabase.storage.from("avatars").getPublicUrl(objectPath);
  const publicUrl = pub.publicUrl;

  const { error: dbErr } = await supabase
    .from("profiles")
    .update({ avatar_url: publicUrl })
    .eq("id", user.id);

  if (dbErr) {
    return { ok: false, error: dbErr.message };
  }

  await syncFreelancerIdentityToProjectSnapshots(supabase, user);
  revalidateProfileSurfaces();
  return { ok: true, publicUrl };
}
