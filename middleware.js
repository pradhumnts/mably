import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'
import { sanitizeNextPath } from '@/lib/auth/safe-next-path'
import { fetchProfileOnboardingRow } from '@/lib/auth/resolve-after-auth-redirect'

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

  const isAuthPage = request.nextUrl.pathname === '/' ||
                     request.nextUrl.pathname.startsWith('/login') ||
                     request.nextUrl.pathname.startsWith('/signup')
  const isProtectedPage = request.nextUrl.pathname.startsWith('/projects') ||
                         request.nextUrl.pathname.startsWith('/clients') ||
                         request.nextUrl.pathname.startsWith('/features') ||
                         request.nextUrl.pathname.startsWith('/billing') ||
                         request.nextUrl.pathname.startsWith('/settings') ||
                         request.nextUrl.pathname.startsWith('/demo') ||
                         request.nextUrl.pathname.startsWith('/project') ||
                         request.nextUrl.pathname.startsWith('/onboarding')

  const path = request.nextUrl.pathname
  const onboardingExempt =
    path.startsWith('/onboarding') ||
    path.startsWith('/waitlist') ||
    path.startsWith('/auth')

  if (user && !onboardingExempt) {
    const prof = await fetchProfileOnboardingRow(supabase, user.id)
    const role = prof?.role ?? 'freelancer'
    if (role !== 'client' && !prof?.onboarding_completed_at) {
      const url = request.nextUrl.clone()
      url.pathname = '/onboarding'
      url.search = ''
      return NextResponse.redirect(url)
    }
  }

  // If user is logged in and tries to access auth pages, honor ?next= then default /projects
  if (user && isAuthPage) {
    const next = sanitizeNextPath(request.nextUrl.searchParams.get('next'))
    if (next) {
      return NextResponse.redirect(new URL(next, request.nextUrl.origin))
    }
    const url = request.nextUrl.clone()
    url.pathname = '/projects'
    url.search = ''
    return NextResponse.redirect(url)
  }

  // Clients cannot use freelancer-only surfaces (same login, different app shell)
  if (user) {
    if (path.startsWith('/clients') || path.startsWith('/projects/new')) {
      const { data: prof } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .maybeSingle()
      if (prof?.role === 'client') {
        const url = request.nextUrl.clone()
        url.pathname = '/projects'
        url.search = ''
        return NextResponse.redirect(url)
      }
    }
  }

  // If user is not logged in and tries to access protected pages, redirect to login with ?next=
  if (!user && isProtectedPage) {
    const url = request.nextUrl.clone()
    url.pathname = '/'
    const intended = `${request.nextUrl.pathname}${request.nextUrl.search}`
    const params = new URLSearchParams()
    params.set('next', intended)
    if (request.nextUrl.pathname.startsWith('/project')) {
      params.set('intent', 'portal')
    }
    url.search = params.toString()
    return NextResponse.redirect(url)
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     * - api routes
     */
    '/((?!_next/static|_next/image|favicon.ico|icon.svg|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$|api/).*)',
  ],
}

