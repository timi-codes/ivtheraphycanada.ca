import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/auth-helpers-nextjs'
import { v4 as uuidv4 } from 'uuid'

const SESSION_COOKIE = 'iv_session'
const SESSION_TTL = 60 * 60 * 24 * 30 // 30 days

export async function middleware(req: NextRequest) {
  const res = NextResponse.next()
  const { pathname } = req.nextUrl

  // ── Auth guard for /dashboard ──────────────────────────────────────────────
  if (pathname.startsWith('/dashboard')) {
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) { return req.cookies.get(name)?.value },
          set() {},
          remove() {},
        },
      }
    )
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      const loginUrl = req.nextUrl.clone()
      loginUrl.pathname = '/login'
      loginUrl.searchParams.set('redirect', pathname)
      return NextResponse.redirect(loginUrl)
    }
  }

  // ── Analytics session cookie ───────────────────────────────────────────────
  // Skip API routes, static files
  if (
    !pathname.startsWith('/api/') &&
    !pathname.startsWith('/_next/') &&
    !pathname.includes('.')
  ) {
    const existing = req.cookies.get(SESSION_COOKIE)?.value
    if (!existing) {
      res.cookies.set(SESSION_COOKIE, uuidv4(), {
        httpOnly: false, // readable by client-side tracker
        sameSite: 'lax',
        maxAge: SESSION_TTL,
        path: '/',
      })
    }
  }

  return res
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
