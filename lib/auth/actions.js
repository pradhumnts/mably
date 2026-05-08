"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { sanitizeNextPath } from "@/lib/auth/safe-next-path";
import { applyPortalInviteClientRoleIfNeeded } from "@/lib/auth/portal-invite-role";
import { resolveAfterAuthRedirect } from "@/lib/auth/resolve-after-auth-redirect";

/**
 * Server Actions for Authentication
 * These will be used in your auth forms
 */

export async function signInWithEmail(email) {
  const supabase = await createClient()
  
  // Use email OTP (6-digit code) instead of magic link
  const { data, error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      shouldCreateUser: true,
      // Do NOT include emailRedirectTo - this forces magic links
    },
  })

  if (error) {
    return { error: error.message }
  }

  // In development, log additional info to help debug
  if (process.env.NODE_ENV === 'development') {
    console.log('OTP sent successfully to:', email)
    console.log('Data:', data)
  }

  return { success: true, message: 'Check your email for the 6-digit code!' }
}

export async function signInWithOAuth(provider, nextPath) {
  const supabase = await createClient()
  const safe = sanitizeNextPath(nextPath)
  const nextQs = safe ? `?next=${encodeURIComponent(safe)}` : ""
  const base = process.env.NEXT_PUBLIC_SITE_URL?.trim()?.replace(/\/$/, "") ?? ""
  
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: provider,
    options: {
      redirectTo: base ? `${base}/auth/callback${nextQs}` : undefined,
    },
  })

  if (error) {
    return { error: error.message }
  }

  if (!data.url) {
    return { error: "Could not start OAuth flow. Please try again." }
  }

  return { url: data.url }
}

/**
 * @param {string} email
 * @param {string} token
 * @param {string | null | undefined} nextPath — post-login path (sanitized)
 */
export async function verifyOtp(email, token, nextPath) {
  const supabase = await createClient()

  const { data, error } = await supabase.auth.verifyOtp({
    email,
    token,
    type: "email",
  })

  if (error) {
    return { error: error.message }
  }

  if (!data.session?.user) {
    return { error: "Verification failed" }
  }

  const user = data.session.user
  const safeNext = sanitizeNextPath(nextPath)

  await applyPortalInviteClientRoleIfNeeded(supabase, user, safeNext)

  const destination = await resolveAfterAuthRedirect(supabase, user, safeNext)
  redirect(destination)
}

export async function signOut() {
  const supabase = await createClient()
  
  const { error } = await supabase.auth.signOut()

  if (error) {
    return { error: error.message }
  }

  redirect('/')
}

