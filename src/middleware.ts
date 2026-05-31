import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

const PUBLIC_PATHS = [
  '/login',
  '/forgot-password',
  '/reset-password',
  '/accept-invite',
  '/portal/login',
  '/portal/register',
  '/api/quickbooks/callback',
  '/api/comms/webhooks',
]

const OWNER_ONLY_PATHS = [
  '/dashboard/payroll',
  '/dashboard/staff',
  '/dashboard/reports',
  '/dashboard/integrations',
  '/dashboard/audit-logs',
]

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return request.cookies.getAll() },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()
  const path = request.nextUrl.pathname

  // Allow public paths
  if (PUBLIC_PATHS.some(p => path.startsWith(p))) {
    return supabaseResponse
  }

  // Redirect unauthenticated users
  if (!user) {
    const isPortal = path.startsWith('/portal')
    const loginUrl = new URL(isPortal ? '/portal/login' : '/login', request.url)
    loginUrl.searchParams.set('next', path)
    return NextResponse.redirect(loginUrl)
  }

  // Redirect root to dashboard
  if (path === '/') {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  // Fetch role for route guards
  const { data: profile } = await supabase
    .from('profiles')
    .select('role, is_active')
    .eq('id', user.id)
    .single()

  if (!profile || !profile.is_active) {
    await supabase.auth.signOut()
    return NextResponse.redirect(new URL('/login?error=account_inactive', request.url))
  }

  const role = profile.role

  // Clients can only access portal
  if (role === 'client' && !path.startsWith('/portal')) {
    return NextResponse.redirect(new URL('/portal/dashboard', request.url))
  }

  // Staff cannot access portal routes
  if (role !== 'client' && path.startsWith('/portal')) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  // Owner-only route enforcement
  if (OWNER_ONLY_PATHS.some(p => path.startsWith(p)) && role !== 'owner') {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
