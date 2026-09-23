import type { Metadata } from 'next'
import Link from 'next/link'
import { PROCESS_STEPS } from '@/lib/site'

export const metadata: Metadata = {
  title: 'Our Process',
  description: 'How Dion Technologies takes a website from first call to launch and beyond.',
}

export default function ProcessPage() {
  return (
    <section className="section">
      <div className="container-page">
        <h1 className="heading-xl">How we work</h1>
        <p className="mt-4 max-w-2xl text-lg text-slate-400">
          Six steps, fixed scope, weekly demos. No hourly billing, no surprise invoices.
        </p>

        <ol className="mt-14 space-y-5">
          {PROCESS_STEPS.map((step) => (
            <li key={step.step} className="glass grid gap-4 p-7 sm:grid-cols-[auto_1fr_auto] sm:items-center">
              <span className="text-3xl font-black text-white/15">{step.step}</span>
              <div>
                <h2 className="text-lg font-semibold text-white">{step.title}</h2>
                <p className="mt-1.5 max-w-2xl text-slate-400">{step.description}</p>
              </div>
              <span className="badge border-white/10 bg-white/5 text-slate-300">{step.duration}</span>
            </li>
          ))}
        </ol>

        <div className="mt-14 text-center">
          <Link href="/contact" className="btn-primary">Start at step one</Link>
        </div>
      </div>
    </section>
  )
}
