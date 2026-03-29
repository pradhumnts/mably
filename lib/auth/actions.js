"use server";

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

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

export async function signUpWithEmail(email) {
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

export async function signInWithOAuth(provider) {
  const supabase = await createClient()
  
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: provider,
    options: {
      redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback`,
    },
  })

  if (error) {
    return { error: error.message }
  }

  if (data.url) {
    redirect(data.url) // Redirect to OAuth provider
  }
}

export async function verifyOtp(email, token) {
  const supabase = await createClient()
  
  const { data, error } = await supabase.auth.verifyOtp({
    email,
    token,
    type: 'email',
  })

  if (error) {
    return { error: error.message }
  }

  if (data.session) {
    redirect('/projects')
  }

  return { error: 'Verification failed' }
}

export async function signOut() {
  const supabase = await createClient()
  
  const { error } = await supabase.auth.signOut()

  if (error) {
    return { error: error.message }
  }

  redirect('/')
}

