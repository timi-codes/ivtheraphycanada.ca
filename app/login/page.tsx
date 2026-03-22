'use client'

export const dynamic = 'force-dynamic'

import { useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { Logo } from '@/components/ui/Logo'
import { supabase } from '@/lib/supabase'

function LoginForm() {
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState<'idle' | 'loading' | 'sent' | 'error'>('idle')
  const [error, setError] = useState('')
  const searchParams = useSearchParams()
  const redirect = searchParams.get('redirect') ?? '/dashboard'

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setStatus('loading')
    setError('')
    try {
      const callbackUrl = new URL('/auth/callback', window.location.origin)
      if (redirect !== '/dashboard') callbackUrl.searchParams.set('next', redirect)

      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: { emailRedirectTo: callbackUrl.toString() },
      })
      if (error) throw error
      setStatus('sent')
    } catch (err) {
      setStatus('error')
      setError(err instanceof Error ? err.message : 'Something went wrong.')
    }
  }

  if (status === 'sent') {
    return (
      <div className="text-center py-4">
        <div className="text-5xl mb-4">📬</div>
        <h2 className="text-lg font-bold text-gray-900">Check your inbox</h2>
        <p className="text-sm text-gray-500 mt-2 leading-relaxed">
          We sent a magic link to <span className="font-medium text-gray-800">{email}</span>.<br />
          Click it to sign in — no password needed.
        </p>
        <p className="text-xs text-gray-400 mt-4">Didn&apos;t get it? Check your spam folder.</p>
        <button
          onClick={() => setStatus('idle')}
          className="mt-4 text-xs text-gray-400 hover:text-gray-600 underline"
        >
          Try a different email
        </button>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">Email address</label>
        <input
          type="email"
          required
          value={email}
          onChange={e => setEmail(e.target.value)}
          placeholder="you@example.com"
          className="w-full h-11 px-4 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-[#1E1E2C] focus:ring-2 focus:ring-[#1E1E2C]/10 transition"
        />
      </div>
      {error && <p className="text-red-600 text-sm">{error}</p>}
      <button
        type="submit"
        disabled={status === 'loading'}
        className="w-full h-11 rounded-xl bg-[#1E1E2C] text-white text-sm font-semibold hover:bg-[#141420] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {status === 'loading' ? 'Sending…' : 'Send Magic Link'}
      </button>
    </form>
  )
}

export default function LoginPage() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8 flex flex-col items-center gap-2">
        </div>
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-8">
          <h1 className="text-xl font-bold text-gray-900 mb-1 text-center">Sign in</h1>
          <p className="text-sm text-gray-400 text-center mb-6">We&apos;ll email you a link — no password needed.</p>
          <Suspense>
            <LoginForm />
          </Suspense>
        </div>
      </div>
    </main>
  )
}
