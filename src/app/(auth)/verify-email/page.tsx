'use client'

import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { Suspense, useEffect, useRef, useState } from 'react'
import AuthCard, { FormMessage } from '@/components/AuthCard'

type Phase = 'working' | 'success' | 'error' | 'missing'

function VerifyInner() {
  const params = useSearchParams()
  const token = params.get('token')
  const [phase, setPhase] = useState<Phase>(token ? 'working' : 'missing')
  const [message, setMessage] = useState('')
  const ranOnce = useRef(false)

  useEffect(() => {
    if (!token || ranOnce.current) return
    ranOnce.current = true

    fetch('/api/auth/verify-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token }),
    })
      .then(async (res) => {
        const json = (await res.json().catch(() => ({}))) as { ok?: boolean; message?: string; error?: string }
        if (res.ok && json.ok) {
          setPhase('success')
          setMessage(json.message ?? 'Email verified.')
        } else {
          setPhase('error')
          setMessage(json.error ?? 'Verification failed.')
        }
      })
      .catch(() => {
        setPhase('error')
        setMessage('Network error. Please try again.')
      })
  }, [token])

  async function resend(e: React.MouseEvent<HTMLButtonElement>) {
    e.preventDefault()
    const email = window.prompt('Enter the email you signed up with:')
    if (!email) return
    const res = await fetch('/api/auth/resend-verification', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    })
    const json = (await res.json().catch(() => ({}))) as { message?: string; error?: string }
    setMessage(json.message ?? json.error ?? 'Check your inbox.')
    setPhase('missing')
  }

  return (
    <AuthCard title="Email verification">
      {phase === 'working' && <FormMessage kind="info" text="Verifying your email…" />}
      {phase === 'success' && (
        <>
          <FormMessage kind="success" text={message} />
          <Link href="/login" className="btn-primary mt-5 w-full">Log in</Link>
        </>
      )}
      {phase === 'error' && (
        <>
          <FormMessage kind="error" text={message} />
          <button type="button" onClick={resend} className="btn-ghost mt-5 w-full">
            Send a new verification link
          </button>
        </>
      )}
      {phase === 'missing' && (
        <>
          <FormMessage kind="info" text={message || 'This link is missing its token.'} />
          <button type="button" onClick={resend} className="btn-ghost mt-5 w-full">
            Send a verification link
          </button>
        </>
      )}
    </AuthCard>
  )
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={null}>
      <VerifyInner />
    </Suspense>
  )
}
