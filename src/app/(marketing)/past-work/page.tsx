import type { Metadata } from 'next'
import Link from 'next/link'
import { PROJECTS } from '@/lib/site'

export const metadata: Metadata = {
  title: 'Past Work',
  description: 'Selected projects by Dion Technologies: e-commerce, portals, and marketing sites.',
}

export default function PastWorkPage() {
  return (
    <section className="section">
      <div className="container-page">
        <h1 className="heading-xl">Past work</h1>
        <p className="mt-4 max-w-2xl text-lg text-slate-400">
          A sample of recent builds. Client names shown with permission.
        </p>

        <div className="mt-12 grid gap-5 md:grid-cols-2">
          {PROJECTS.map((p) => (
            <article key={p.name} className="glass card-hover overflow-hidden">
              <div className={`h-36 bg-gradient-to-br ${p.accent}`} aria-hidden="true" />
              <div className="p-7">
                <p className="text-xs font-semibold uppercase tracking-wider text-indigo-300">{p.type}</p>
                <h2 className="mt-1 text-xl font-semibold text-white">{p.name}</h2>
                <p className="mt-3 text-slate-400">{p.blurb}</p>
                <p className="mt-4 inline-block rounded-lg bg-emerald-400/10 px-3 py-1 text-sm font-semibold text-emerald-300">
                  {p.result}
                </p>
              </div>
            </article>
          ))}
        </div>

        <div className="mt-14 text-center">
          <p className="text-slate-400">Want results like these?</p>
          <Link href="/contact" className="btn-primary mt-5">Tell us about your project</Link>
        </div>
      </div>
    </section>
  )
}
