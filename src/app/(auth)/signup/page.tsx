'use client'

import Link from 'next/link'
import { useState } from 'react'
import AuthCard, { FormMessage, FieldError } from '@/components/AuthCard'

type FieldErrors = Record<string, string[]>

export default function SignupPage() {
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({})
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [pending, setPending] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setPending(true)
    setError(null)
    setFieldErrors({})

    const data = Object.fromEntries(new FormData(e.currentTarget).entries())
    const res = await fetch('/api/auth/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    const json = (await res.json().catch(() => ({}))) as {
      ok?: boolean
      message?: string
      error?: string
      details?: FieldErrors
    }

    if (res.ok && json.ok) {
      setSuccess(json.message ?? 'Account created. Check your email to verify your address.')
    } else {
      setError(json.error ?? 'Could not create your account. Please try again.')
      setFieldErrors(json.details ?? {})
    }
    setPending(false)
  }

  return (
    <AuthCard
      title="Create your account"
      subtitle="Track your project requests, subscription, and premium resources in one place."
      footer={
        <>
          Already have an account?{' '}
          <Link href="/login" className="text-indigo-300 hover:text-indigo-200">Log in</Link>
        </>
      }
    >
      {success ? (
        <>
          <FormMessage kind="success" text={success} />
          <p className="mt-4 text-sm text-slate-400">
            In development, the verification link is printed in the server console. Open it to
            activate your account, then{' '}
            <Link href="/login" className="text-indigo-300 hover:text-indigo-200">log in</Link>.
          </p>
        </>
        ) : (
        <form onSubmit={handleSubmit} className="space-y-5" noValidate>
          {error && <FormMessage kind="error" text={error} />}

          <div>
            <label htmlFor="su-name" className="label">Full name</label>
            <input id="su-name" name="name" className="input" autoComplete="name" required maxLength={100} />
            <FieldError messages={fieldErrors.name} />
          </div>

          <div>
            <label htmlFor="su-email" className="label">Email</label>
            <input id="su-email" name="email" type="email" className="input" autoComplete="email" required maxLength={254} />
            <FieldError messages={fieldErrors.email} />
          </div>

          <div>
            <label htmlFor="su-password" className="label">Password</label>
            <input
              id="su-password"
              name="password"
              type="password"
              className="input"
              autoComplete="new-password"
              required
              minLength={10}
              maxLength={128}
            />
            <p className="mt-1.5 text-xs text-slate-500">At least 10 characters.</p>
            <FieldError messages={fieldErrors.password} />
          </div>

          <button type="submit" className="btn-primary w-full" disabled={pending}>
            {pending ? 'Creating account…' : 'Create account'}
          </button>

          <p className="text-xs text-slate-500">
            By creating an account you agree to be contacted about your project. We never sell your data.
          </p>
        </form>
      )}
    </AuthCard>
  )
}
