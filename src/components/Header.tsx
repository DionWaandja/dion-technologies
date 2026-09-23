import Link from 'next/link'
import { NAV_LINKS, SITE } from '@/lib/site'
import { currentUser } from '@/lib/session'
import LogoutButton from './LogoutButton'
import Logo from './Logo'

/**
 * Server component header. Logo renders the blue wordmark; nav adapts to the
 * signed-in role (admins get links back to /admin).
 */
export default async function Header() {
  const user = await currentUser()
  const isAdmin = user?.role === 'ADMIN'
  const linkBase = isAdmin ? '/admin' : '/dashboard'

  return (
    <header className="sticky top-0 z-40 border-b border-white/5 bg-[#07070f]/80 backdrop-blur-md">
      <div className="container-page flex h-16 items-center justify-between gap-6">
        <Link href="/" className="flex items-center gap-2.5" aria-label={SITE.name}>
          <Logo />
        </Link>

        <nav className="hidden items-center gap-1 md:flex" aria-label="Main navigation">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="rounded-lg px-3 py-2 text-sm text-slate-300 transition hover:bg-white/5 hover:text-white"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-2 md:flex">
          {user ? (
            <>
              <Link href={linkBase} className="btn-ghost">
                {isAdmin ? 'Admin' : 'Dashboard'}
              </Link>
              <LogoutButton />
            </>
          ) : (
            <>
              <Link href="/login" className="btn-ghost">
                Log in
              </Link>
              <Link href="/signup" className="btn-primary">
                Get started
              </Link>
            </>
          )}
        </div>

        {/* Mobile nav */}
        <div className="md:hidden">
          <details className="group relative">
            <summary className="btn-ghost cursor-pointer list-none px-3 py-2">Menu</summary>
            <div className="absolute right-0 z-50 mt-2 w-52 rounded-xl border border-white/10 bg-[#0b0b16] p-2 shadow-2xl">
              {NAV_LINKS.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="block rounded-lg px-3 py-2 text-sm text-slate-300 hover:bg-white/5 hover:text-white"
                >
                  {link.label}
                </Link>
              ))}
              <hr className="my-2 border-white/10" />
              {user ? (
                <>
                  <Link href={linkBase} className="block rounded-lg px-3 py-2 text-sm text-slate-300 hover:bg-white/5">
                    {isAdmin ? 'Admin' : 'Dashboard'}
                  </Link>
                  <div className="px-2 pt-1">
                    <LogoutButton />
                  </div>
                </>
              ) : (
                <>
                  <Link href="/login" className="block rounded-lg px-3 py-2 text-sm text-slate-300 hover:bg-white/5">
                    Log in
                  </Link>
                  <Link href="/signup" className="block rounded-lg px-3 py-2 text-sm text-indigo-300 hover:bg-white/5">
                    Get started
                  </Link>
                </>
              )}
            </div>
            <div className="fixed inset-0 z-40 hidden group-open:block" aria-hidden="true" />
          </details>
        </div>
      </div>
    </header>
  )
}
