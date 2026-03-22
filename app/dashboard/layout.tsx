import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createServerClient } from '@/lib/supabase-server'
import { Logo } from '@/components/ui/Logo'
import { HideGlobalNav } from '@/components/ui/HideGlobalNav'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createServerClient()
  const { data: { session } } = await supabase.auth.getSession()

  if (!session) {
    redirect('/login?redirect=/dashboard')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <HideGlobalNav />
      {/* Nav */}
      <nav className="bg-white border-b border-gray-200 px-4 py-3">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-6">
            <Logo size="sm" />
            <div className="hidden md:flex gap-4 text-sm">
              <Link href="/dashboard" className="text-gray-600 hover:text-[#1E1E2C] font-medium">Overview</Link>
              <Link href="/dashboard/leads" className="text-gray-600 hover:text-[#1E1E2C]">Leads</Link>
              <Link href="/dashboard/profile" className="text-gray-600 hover:text-[#1E1E2C]">Profile</Link>
              <Link href="/dashboard/billing" className="text-gray-600 hover:text-[#1E1E2C]">Billing</Link>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-500">{session.user.email}</span>
            <form action="/api/auth/signout" method="post">
              <button type="submit" className="text-sm text-gray-500 hover:text-red-600">Sign out</button>
            </form>
          </div>
        </div>
      </nav>

      {/* Mobile nav */}
      <div className="md:hidden bg-white border-b border-gray-100 px-4 py-2 flex gap-4 text-sm overflow-x-auto">
        <Link href="/dashboard" className="text-gray-600 hover:text-[#1E1E2C] whitespace-nowrap font-medium">Overview</Link>
        <Link href="/dashboard/leads" className="text-gray-600 hover:text-[#1E1E2C] whitespace-nowrap">Leads</Link>
        <Link href="/dashboard/profile" className="text-gray-600 hover:text-[#1E1E2C] whitespace-nowrap">Profile</Link>
        <Link href="/dashboard/billing" className="text-gray-600 hover:text-[#1E1E2C] whitespace-nowrap">Billing</Link>
      </div>

      <main className="max-w-5xl mx-auto px-4 py-8">{children}</main>
    </div>
  )
}
