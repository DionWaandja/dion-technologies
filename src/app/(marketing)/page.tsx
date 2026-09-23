import Link from 'next/link'
import { PROCESS_STEPS, PROJECTS, SERVICES, SITE } from '@/lib/site'

const stats = [
  { value: '120+', label: 'sites shipped' },
  { value: '0.9s', label: 'median load time' },
  { value: '98%', label: 'client retention' },
] as const

export default function HomePage() {
  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="bg-grid absolute inset-0" aria-hidden="true" />
        <div className="bg-glow absolute inset-0" aria-hidden="true" />
        <div className="container-page relative py-24 sm:py-32">
          <span className="badge border-indigo-400/30 bg-indigo-400/10 text-indigo-200">
            <span className="h-1.5 w-1.5 rounded-full bg-indigo-400" />
            Taking on new projects for Q4
          </span>
          <h1 className="heading-xl mt-6 max-w-3xl">
            Websites engineered to <span className="bg-gradient-to-r from-indigo-400 to-violet-400 bg-clip-text text-transparent">grow your business</span>
          </h1>
          <p className="mt-6 max-w-2xl text-lg text-slate-400">
            {SITE.name} designs and builds fast, reliable websites and web applications —
            e-commerce, client portals, booking systems — with fixed timelines and no surprises.
          </p>
          <div className="mt-10 flex flex-wrap gap-3">
            <Link href="/contact" className="btn-primary">Start your project</Link>
            <Link href="/past-work" className="btn-ghost">See our work</Link>
          </div>
          <dl className="mt-16 grid max-w-2xl grid-cols-3 gap-6">
            {stats.map((s) => (
              <div key={s.label} className="glass p-5">
                <dt className="text-3xl font-bold text-white">{s.value}</dt>
                <dd className="mt-1 text-sm text-slate-400">{s.label}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      {/* Services preview */}
      <section className="section">
        <div className="container-page">
          <div className="flex items-end justify-between gap-6">
            <div>
              <h2 className="text-3xl font-bold text-white">What we build</h2>
              <p className="mt-2 text-slate-400">From first sketch to production deploy — and everything after.</p>
            </div>
            <Link href="/services" className="hidden shrink-0 text-sm font-medium text-indigo-300 hover:text-indigo-200 sm:block">
              All services →
            </Link>
          </div>
          <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {SERVICES.slice(0, 6).map((s) => (
              <article key={s.title} className="glass card-hover p-6">
                <h3 className="font-semibold text-white">{s.title}</h3>
                <p className="mt-2 text-sm text-slate-400">{s.description}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* Process teaser */}
      <section className="section pt-0">
        <div className="container-page grid items-center gap-10 lg:grid-cols-2">
          <div>
            <h2 className="text-3xl font-bold text-white">A process with no black boxes</h2>
            <p className="mt-4 text-slate-400">
              Fixed-scope proposals, weekly demos, and a launch checklist you can audit. You always
              know what is happening and what happens next.
            </p>
            <Link href="/process" className="btn-ghost mt-8">See how we work</Link>
          </div>
          <ol className="space-y-3">
            {PROCESS_STEPS.slice(0, 4).map((step) => (
              <li key={step.step} className="glass flex items-center gap-4 p-4">
                <span className="rounded-lg bg-indigo-500/20 px-3 py-1.5 text-sm font-bold text-indigo-300">{step.step}</span>
                <div>
                  <p className="font-medium text-white">{step.title}</p>
                  <p className="text-sm text-slate-500">{step.duration}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* Featured work */}
      <section className="section pt-0">
        <div className="container-page">
          <h2 className="text-3xl font-bold text-white">Recent work</h2>
          <div className="mt-10 grid gap-5 sm:grid-cols-2">
            {PROJECTS.slice(0, 2).map((p) => (
              <article key={p.name} className="glass card-hover overflow-hidden">
                <div className={`h-28 bg-gradient-to-br ${p.accent}`} aria-hidden="true" />
                <div className="p-6">
                  <p className="text-xs font-semibold uppercase tracking-wider text-indigo-300">{p.type}</p>
                  <h3 className="mt-1 font-semibold text-white">{p.name}</h3>
                  <p className="mt-2 text-sm text-slate-400">{p.blurb}</p>
                  <p className="mt-3 text-sm font-semibold text-emerald-300">{p.result}</p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="section pt-0">
        <div className="container-page">
          <div className="glass relative overflow-hidden p-10 text-center sm:p-14">
            <div className="bg-glow absolute inset-0" aria-hidden="true" />
            <h2 className="relative text-3xl font-bold text-white">Have a project in mind?</h2>
            <p className="relative mx-auto mt-3 max-w-xl text-slate-400">
              Tell us what you want built — we reply to every inquiry within one business day.
            </p>
            <Link href="/contact" className="btn-primary relative mt-8">Describe your project</Link>
          </div>
        </div>
      </section>
    </>
  )
}
