import Link from 'next/link'
import { SITE } from '@/lib/site'
import Logo from './Logo'

const serviceLinks = [
  ['Custom Web Development', '/services'],
  ['E-commerce', '/services'],
  ['Databases & Backends', '/services'],
  ['Care Plans', '/pricing'],
] as const

export default function Footer() {
  return (
    <footer className="border-t border-white/5 bg-[#05050b]">
      <div className="container-page grid gap-10 py-12 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <div className="flex items-center gap-2">
            <Logo />
            <span className="font-bold text-white">{SITE.name}</span>
          </div>
          <p className="mt-3 max-w-xs text-sm text-slate-500">
            {SITE.tagline}. Designing and building for ambitious teams since 2019.
          </p>
        </div>

        <div>
          <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400">Services</h3>
          <ul className="mt-3 space-y-2 text-sm">
            {serviceLinks.map(([label, href]) => (
              <li key={label}>
                <Link href={href} className="text-slate-500 transition hover:text-slate-200">
                  {label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400">Company</h3>
          <ul className="mt-3 space-y-2 text-sm">
            <li><Link href="/process" className="text-slate-500 hover:text-slate-200">Our process</Link></li>
            <li><Link href="/past-work" className="text-slate-500 hover:text-slate-200">Past work</Link></li>
            <li><Link href="/pricing" className="text-slate-500 hover:text-slate-200">Pricing</Link></li>
            <li><Link href="/contact" className="text-slate-500 hover:text-slate-200">Contact</Link></li>
          </ul>
        </div>

        <div>
          <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400">Get in touch</h3>
          <ul className="mt-3 space-y-2 text-sm text-slate-500">
            <li>{SITE.email}</li>
            <li className="pt-2">
              <Link href="/signup" className="text-indigo-300 hover:text-indigo-200">
                Create a client account →
              </Link>
            </li>
          </ul>
        </div>
      </div>
      <div className="border-t border-white/5 py-6">
        <p className="container-page text-xs text-slate-600">
          © {SITE.name}. All rights reserved.
        </p>
      </div>
    </footer>
  )
}
