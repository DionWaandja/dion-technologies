import Link from 'next/link'

/** Centered card shell shared by all auth pages. */
export default function AuthCard({
  title,
  subtitle,
  children,
  footer,
}: {
  title: string
  subtitle?: string
  children: React.ReactNode
  footer?: React.ReactNode
}) {
  return (
    <div className="relative flex min-h-[80vh] items-center justify-center px-5 py-16">
      <div className="bg-grid absolute inset-0" aria-hidden="true" />
      <div className="bg-glow absolute inset-0" aria-hidden="true" />
      <div className="relative w-full max-w-md">
        <div className="glass p-8">
          <h1 className="text-2xl font-bold text-white">{title}</h1>
          {subtitle && <p className="mt-2 text-sm text-slate-400">{subtitle}</p>}
          <div className="mt-7">{children}</div>
        </div>
        {footer && <div className="mt-5 text-center text-sm text-slate-500">{footer}</div>}
        <p className="mt-8 text-center text-xs text-slate-600">
          <Link href="/" className="hover:text-slate-400">← Back to diontechnologies.com</Link>
        </p>
      </div>
    </div>
  )
}

export function FormMessage({ kind, text }: { kind: 'error' | 'success' | 'info'; text: string }) {
  const styles = {
    error: 'border-rose-400/30 bg-rose-400/10 text-rose-200',
    success: 'border-emerald-400/30 bg-emerald-400/10 text-emerald-200',
    info: 'border-indigo-400/30 bg-indigo-400/10 text-indigo-200',
  }[kind]
  return (
    <div className={`rounded-xl border px-4 py-3 text-sm ${styles}`} role="alert">
      {text}
    </div>
  )
}

export function FieldError({ messages }: { messages?: string[] }) {
  if (!messages?.length) return null
  return <p className="mt-1.5 text-xs text-rose-300">{messages[0]}</p>
}
