import type { Metadata } from 'next'
import ContactForm from '@/components/ContactForm'

export const metadata: Metadata = {
  title: 'Contact',
  description: 'Tell Dion Technologies about the website you want built. We reply within one business day.',
}

export default function ContactPage() {
  return (
    <section className="section">
      <div className="container-page grid gap-12 lg:grid-cols-[1fr_1.4fr]">
        <div>
          <h1 className="heading-xl">Tell us what you want built</h1>
          <p className="mt-4 text-slate-400">
            Describe your project and we will come back with a fixed-scope proposal — timeline and
            price included. No obligation, no sales theater.
          </p>
          <ul className="mt-8 space-y-4 text-sm">
            <li className="glass flex gap-3 p-4">
              <span className="text-lg" aria-hidden="true">📬</span>
              <div>
                <p className="font-medium text-white">One-business-day replies</p>
                <p className="mt-0.5 text-slate-500">Every inquiry gets a real answer from an engineer.</p>
              </div>
            </li>
            <li className="glass flex gap-3 p-4">
              <span className="text-lg" aria-hidden="true">💰</span>
              <div>
                <p className="font-medium text-white">Fixed-scope pricing</p>
                <p className="mt-0.5 text-slate-500">You approve the number before any work starts.</p>
              </div>
            </li>
            <li className="glass flex gap-3 p-4">
              <span className="text-lg" aria-hidden="true">🚀</span>
              <div>
                <p className="font-medium text-white">Launch in weeks, not quarters</p>
                <p className="mt-0.5 text-slate-500">Typical builds go live in 4–5 weeks.</p>
              </div>
            </li>
          </ul>
        </div>

        <div className="glass p-7 sm:p-9">
          <ContactForm />
        </div>
      </div>
    </section>
  )
}
