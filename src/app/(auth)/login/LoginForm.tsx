'use client'

import Link from 'next/link'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { FormMessage } from '@/components/AuthCard'

export default function LoginForm({ callbackUrl }: { callbackUrl: string }) {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [pending, setPending] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setPending(true)
    setError(null)

    const data = Object.fromEntries(new FormData(e.currentTarget).entries())

    const res = await signIn('credentials', {
      ...data,
      redirect: false,
    })

    if (res?.error) {
      setError('Invalid email or password. Note: accounts must verify their email before logging in.')
      setPending(false)
      return
    }

    // Role-based landing: admins go to /admin, clients to /dashboard.
    const session = await fetch('/api/auth/session').then((r) => r.json())
    const dest =
      callbackUrl !== '/dashboard' && callbackUrl !== ''
        ? callbackUrl
        : session?.user?.role === 'ADMIN'
          ? '/admin'
          : '/dashboard'
    router.push(dest)
    router.refresh()
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5" noValidate>
      {error && <FormMessage kind="error" text={error} />}

      <div>
        <label htmlFor="login-email" className="label">Email</label>
        <input id="login-email" name="email" type="email" className="input" autoComplete="email" required />
      </div>

      <div>
        <div className="flex items-center justify-between">
          <label htmlFor="login-password" className="label">Password</label>
          <Link href="/forgot-password" className="text-xs text-indigo-300 hover:text-indigo-200">
            Forgot password?
          </Link>
        </div>
        <input id="login-password" name="password" type="password" className="input" autoComplete="current-password" required />
      </div>

      <button type="submit" className="btn-primary w-full" disabled={pending}>
        {pending ? 'Signing in…' : 'Log in'}
      </button>
    </form>
  )
}
