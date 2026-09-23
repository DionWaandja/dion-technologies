import type { Metadata } from 'next'
import Link from 'next/link'
import { SERVICES } from '@/lib/site'

export const metadata: Metadata = {
  title: 'Services',
  description: 'Web development services: custom builds, e-commerce, backends, performance and care plans.',
}

export default function ServicesPage() {
  return (
    <section className="section">
      <div className="container-page">
        <h1 className="heading-xl">Services</h1>
        <p className="mt-4 max-w-2xl text-lg text-slate-400">
          Everything your website needs to earn customers — built properly, maintained honestly.
        </p>

        <div className="mt-12 grid gap-5 md:grid-cols-2">
          {SERVICES.map((s, i) => (
            <article key={s.title} className="glass card-hover p-7">
              <span className="text-xs font-bold text-indigo-400">{String(i + 1).padStart(2, '0')}</span>
              <h2 className="mt-2 text-xl font-semibold text-white">{s.title}</h2>
              <p className="mt-3 text-slate-400">{s.description}</p>
              <ul className="mt-5 space-y-2">
                {s.points.map((pt) => (
                  <li key={pt} className="flex items-center gap-2 text-sm text-slate-300">
                    <svg className="h-4 w-4 text-emerald-400" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                      <path fillRule="evenodd" d="M16.7 5.3a1 1 0 0 1 0 1.4l-7.5 7.5a1 1 0 0 1-1.4 0l-3.5-3.5a1 1 0 1 1 1.4-1.4l2.8 2.8 6.8-6.8a1 1 0 0 1 1.4 0z" clipRule="evenodd" />
                    </svg>
                    {pt}
                  </li>
                ))}
              </ul>
            </article>
          ))}
        </div>

        <div className="mt-14 text-center">
          <p className="text-slate-400">Not sure which service fits? Describe your project and we will map it out.</p>
          <Link href="/contact" className="btn-primary mt-5">Get a free quote</Link>
        </div>
      </div>
    </section>
  )
}
