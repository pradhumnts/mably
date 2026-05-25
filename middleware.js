import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'
import { sanitizeNextPath } from '@/lib/auth/safe-next-path'
import { fetchProfileOnboardingRow } from '@/lib/auth/resolve-after-auth-redirect'
import { resolveClientLandingPath } from '@/lib/auth/resolve-client-landing'

export async function middleware(request) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const path = request.nextUrl.pathname

  // Public embed routes (loaded inside iframes on marketing sites). Never
  // require auth, never redirect — they ship the same UI components but with
  // no app shell or session.
  if (path.startsWith('/embed/') || path === '/embed') {
    return supabaseResponse
  }

  const isAuthPage = path === '/' || path.startsWith('/login') || path.startsWith('/signup')
  const isProtectedPage = path.startsWith('/dashboard') ||
                         path.startsWith('/notifications') ||
                         path.startsWith('/projects') ||
                         path.startsWith('/clients') ||
                         path.startsWith('/features') ||
                         path.startsWith('/billing') ||
                         path.startsWith('/settings') ||
                         path.startsWith('/demo') ||
                         path.startsWith('/project') ||
                         path.startsWith('/portal') ||
                         path.startsWith('/onboarding')

  // Not signed in but trying to read a protected surface → push to login w/ next
  if (!user) {
    if (isProtectedPage) {
      const url = request.nextUrl.clone()
      url.pathname = '/'
      const intended = `${path}${request.nextUrl.search}`
      const params = new URLSearchParams()
      params.set('next', intended)
      if (path.startsWith('/project')) params.set('intent', 'portal')
      url.search = params.toString()
      return NextResponse.redirect(url)
    }
    return supabaseResponse
  }

  // Single profile lookup feeds every downstream decision
  const prof = await fetchProfileOnboardingRow(supabase, user.id)
  const role = prof?.role ?? 'freelancer'
  const isClient = role === 'client'

  // Logged in + on an auth page → bounce to the right home
  if (isAuthPage) {
    const next = sanitizeNextPath(request.nextUrl.searchParams.get('next'))
    if (next) {
      return NextResponse.redirect(new URL(next, request.nextUrl.origin))
    }
    if (isClient) {
      const dest = await resolveClientLandingPath(supabase)
      return NextResponse.redirect(new URL(dest, request.nextUrl.origin))
    }
    const url = request.nextUrl.clone()
    url.pathname = '/projects'
    url.search = ''
    return NextResponse.redirect(url)
  }

  // Clients are confined to portal surfaces — no freelancer pages, ever.
  if (isClient) {
    const allowedForClient =
      path.startsWith('/project/') ||
      path === '/portal' ||
      path.startsWith('/portal/') ||
      path.startsWith('/auth')
    if (!allowedForClient) {
      const dest = await resolveClientLandingPath(supabase)
      return NextResponse.redirect(new URL(dest, request.nextUrl.origin))
    }
    return supabaseResponse
  }

  // Freelancer onboarding gate
  const onboardingExempt =
    path.startsWith('/onboarding') ||
    path.startsWith('/waitlist') ||
    path.startsWith('/auth') ||
    path.startsWith('/portal') ||
    path.startsWith('/project/')
  if (!onboardingExempt && !prof?.onboarding_completed_at) {
    const url = request.nextUrl.clone()
    url.pathname = '/onboarding'
    url.search = ''
    return NextResponse.redirect(url)
  }

  // Freelancers don't belong on /portal (chooser is client-only)
  if (path === '/portal' || path.startsWith('/portal/')) {
    const url = request.nextUrl.clone()
    url.pathname = '/projects'
    url.search = ''
    return NextResponse.redirect(url)
  }

  if (path === '/dashboard' || path.startsWith('/dashboard/')) {
    const url = request.nextUrl.clone()
    url.pathname = '/projects'
    url.search = ''
    return NextResponse.redirect(url)
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static, _next/image (Next internals)
     * - favicon.ico, icon.svg
     * - api/ routes
     * - any path ending in a common static asset extension served from /public
     *   (images, video, audio, fonts, web manifests, etc.)
     *
     * Critically, this exclusion list MUST cover everything in /public — when a
     * static asset slips through the matcher, middleware runs auth/role checks
     * and can return a 307 redirect for the asset URL (breaking videos, fonts,
     * etc.). Browsers also issue byte-range requests for <video>, so each chunk
     * would otherwise pay for two DB roundtrips.
     */
    '/((?!_next/static|_next/image|favicon.ico|icon.svg|api/|.*\\.(?:svg|png|jpg|jpeg|gif|webp|avif|ico|webm|mp4|mov|ogg|ogv|m4v|mp3|wav|woff|woff2|ttf|otf|eot|css|js|map|json|txt|xml|webmanifest|pdf)$).*)',
  ],
}
