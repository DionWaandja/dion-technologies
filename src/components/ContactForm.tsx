'use client'

import { BUDGET_RANGES } from '@/lib/validation'

/**
 * Contact form used on /contact (and reusable elsewhere). Posts to the
 * validated, rate-limited /api/contact endpoint; submissions land in the
 * database and the admin inbox.
 */
export default function ContactForm({ compact = false }: { compact?: boolean }) {
  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const form = e.currentTarget
    const data = Object.fromEntries(new FormData(form).entries())

    const res = await fetch('/api/contact', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    const json = (await res.json().catch(() => ({}))) as {
      ok?: boolean
      message?: string
      error?: string
      details?: Record<string, string[]>
    }

    const box = form.querySelector<HTMLElement>('[data-form-message]')
    if (!box) return

    if (res.ok && json.ok) {
      box.className =
        'mt-4 rounded-xl border border-emerald-400/30 bg-emerald-400/10 px-4 py-3 text-sm text-emerald-200'
      box.textContent = json.message ?? 'Thanks — we will be in touch shortly.'
      form.reset()
    } else {
      const first = json.details ? Object.values(json.details).flat()[0] : undefined
      box.className =
        'mt-4 rounded-xl border border-rose-400/30 bg-rose-400/10 px-4 py-3 text-sm text-rose-200'
      box.textContent = first ?? json.error ?? 'Something went wrong. Please try again.'
    }
  }

  return (
    <form onSubmit={handleSubmit} className={compact ? 'space-y-4' : 'space-y-5'} noValidate>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="cf-name" className="label">Name *</label>
          <input id="cf-name" name="name" className="input" placeholder="Jordan Smith" required maxLength={100} />
        </div>
        <div>
          <label htmlFor="cf-email" className="label">Email *</label>
          <input id="cf-email" name="email" type="email" className="input" placeholder="jordan@company.com" required maxLength={254} />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="cf-company" className="label">Company</label>
          <input id="cf-company" name="company" className="input" placeholder="Acme Inc." maxLength={150} />
        </div>
        <div>
          <label htmlFor="cf-budget" className="label">Budget range *</label>
          <select id="cf-budget" name="budgetRange" className="input" required defaultValue="">
            <option value="" disabled>Select a range</option>
            {BUDGET_RANGES.map((r) => (
              <option key={r} value={r}>{r}</option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label htmlFor="cf-description" className="label">Tell us about the website you want built *</label>
        <textarea
          id="cf-description"
          name="description"
          rows={5}
          className="input resize-y"
          placeholder="What does your business do, what should the site accomplish, any pages or features you know you need…"
          required
          minLength={30}
          maxLength={5000}
        />
      </div>

      <button type="submit" className="btn-primary w-full sm:w-auto">Send project request</button>
      <div data-form-message role="status" aria-live="polite" />
    </form>
  )
}
