import type { Metadata } from 'next'
import Link from 'next/link'
import AuthCard from '@/components/AuthCard'
import LoginForm from './LoginForm'

export const metadata: Metadata = { title: 'Log in' }

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ callbackUrl?: string }>
}) {
  const { callbackUrl } = await searchParams
  // Only allow same-site relative paths as post-login destinations.
  const safeCallback = callbackUrl && callbackUrl.startsWith('/') && !callbackUrl.startsWith('//') ? callbackUrl : '/dashboard'

  return (
    <AuthCard
      title="Welcome back"
      subtitle="Log in to manage your projects and subscription."
      footer={
        <>
          New here? <Link href="/signup" className="text-indigo-300 hover:text-indigo-200">Create an account</Link>
        </>
      }
    >
      <LoginForm callbackUrl={safeCallback} />
    </AuthCard>
  )
}
