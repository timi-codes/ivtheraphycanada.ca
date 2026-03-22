import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/auth-helpers-nextjs'

export async function GET(req: NextRequest) {
  const ADMIN_EMAILS = (process.env.ADMIN_EMAILS ?? '').split(',').map(e => e.trim()).filter(Boolean)
  const { searchParams, origin } = new URL(req.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/dashboard'

  if (!code) {
    return NextResponse.redirect(`${origin}/login?error=auth_failed`)
  }

  // Build the redirect response first so we can attach cookies to it
  const redirectRes = NextResponse.redirect(`${origin}${next}`)

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return req.cookies.get(name)?.value
        },
        set(name: string, value: string, options: Record<string, unknown>) {
          redirectRes.cookies.set(name, value, options as Parameters<typeof redirectRes.cookies.set>[2])
        },
        remove(name: string, options: Record<string, unknown>) {
          redirectRes.cookies.set(name, '', options as Parameters<typeof redirectRes.cookies.set>[2])
        },
      },
    }
  )

  const { data, error } = await supabase.auth.exchangeCodeForSession(code)

  if (error || !data.session) {
    return NextResponse.redirect(`${origin}/login?error=auth_failed`)
  }

  const email = data.session.user.email ?? ''
  const destination = ADMIN_EMAILS.includes(email) ? '/admin' : next

  // If destination differs from what we pre-built, create a new response and copy cookies
  if (destination !== next) {
    const adminRes = NextResponse.redirect(`${origin}${destination}`)
    redirectRes.cookies.getAll().forEach(c => adminRes.cookies.set(c.name, c.value))
    return adminRes
  }

  return redirectRes
}
