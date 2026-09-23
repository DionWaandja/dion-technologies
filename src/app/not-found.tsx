import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center px-5">
      <div className="glass max-w-md p-10 text-center">
        <p className="text-6xl font-black text-white/10">404</p>
        <h1 className="mt-4 text-xl font-bold text-white">Page not found</h1>
        <p className="mt-2 text-sm text-slate-400">
          The page you are looking for does not exist or has moved.
        </p>
        <Link href="/" className="btn-primary mt-6">Back to home</Link>
      </div>
    </div>
  )
}
