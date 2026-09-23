import type { ReactNode } from 'react'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { currentUser } from '@/lib/session'
import LogoutButton from '@/components/LogoutButton'
import Logo from '@/components/Logo'

/** All /dashboard routes require a verified session (also enforced in middleware). */
export default async function DashboardLayout({ children }: { children: ReactNode }) {
  const user = await currentUser()
  if (!user) redirect('/login?callbackUrl=/dashboard')

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-40 border-b border-white/5 bg-[#07070f]/80 backdrop-blur-md">
        <div className="container-page flex h-16 items-center justify-between gap-6">
          <div className="flex items-center gap-6">
            <Link href="/" className="flex items-center gap-2.5">
              <Logo />
              <span className="bg-gradient-to-r from-indigo-300 to-violet-300 bg-clip-text font-bold text-transparent">
                Dion Technologies
              </span>
            </Link>
            <nav className="hidden items-center gap-1 sm:flex">
              <Link href="/dashboard" className="rounded-lg px-3 py-2 text-sm text-slate-300 hover:bg-white/5 hover:text-white">
                Overview
              </Link>
              <Link href="/premium" className="rounded-lg px-3 py-2 text-sm text-slate-300 hover:bg-white/5 hover:text-white">
                Premium
              </Link>
              <Link href="/pricing" className="rounded-lg px-3 py-2 text-sm text-slate-300 hover:bg-white/5 hover:text-white">
                Plans
              </Link>
            </nav>
          </div>
          <div className="flex items-center gap-2">
            <span className="hidden text-sm text-slate-500 md:inline">
              {user.name ?? user.email}
            </span>
            <LogoutButton />
          </div>
        </div>
      </header>
      <main className="container-page flex-1 py-10">{children}</main>
    </div>
  )
}
