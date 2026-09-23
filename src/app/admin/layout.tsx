import type { ReactNode } from 'react'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { currentUser } from '@/lib/session'
import LogoutButton from '@/components/LogoutButton'
import Logo from '@/components/Logo'

/**
 * Server-side role gate for the entire /admin area: a CLIENT account that
 * guesses the URL is bounced to /dashboard here (middleware blocks first with
 * the JWT; this re-checks the database).
 */
export default async function AdminLayout({ children }: { children: ReactNode }) {
  const user = await currentUser()
  if (!user) redirect('/login?callbackUrl=/admin')
  if (user.role !== 'ADMIN') redirect('/dashboard')

  const links = [
    { href: '/admin', label: 'Inbox' },
    { href: '/admin/subscriptions', label: 'Subscriptions' },
    { href: '/admin/payouts', label: 'Payouts' },
    { href: '/admin/audit-log', label: 'Audit log' },
  ]

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-40 border-b border-white/5 bg-[#07070f]/80 backdrop-blur-md">
        <div className="container-page flex h-16 items-center justify-between gap-6">
          <div className="flex items-center gap-6">
            <Link href="/admin" className="flex items-center gap-2.5">
              <Logo />
              <span className="bg-gradient-to-r from-fuchsia-300 to-indigo-300 bg-clip-text font-bold text-transparent">
                Dion Admin
              </span>
            </Link>
            <nav className="hidden items-center gap-1 md:flex">
              {links.map((l) => (
                <Link
                  key={l.href}
                  href={l.href}
                  className="rounded-lg px-3 py-2 text-sm text-slate-300 hover:bg-white/5 hover:text-white"
                >
                  {l.label}
                </Link>
              ))}
            </nav>
          </div>
          <div className="flex items-center gap-2">
            <span className="badge hidden border-fuchsia-400/30 bg-fuchsia-400/10 text-fuchsia-200 sm:inline-flex">
              {user.email}
            </span>
            <LogoutButton />
          </div>
        </div>
        {/* Mobile tabs */}
        <nav className="container-page flex gap-1 overflow-x-auto pb-2 md:hidden">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="whitespace-nowrap rounded-lg px-3 py-1.5 text-xs text-slate-300 hover:bg-white/5"
            >
              {l.label}
            </Link>
          ))}
        </nav>
      </header>
      <main className="container-page flex-1 py-10">{children}</main>
    </div>
  )
}
