import type { Metadata, Viewport } from 'next'
import { headers } from 'next/headers'
import './globals.css'

export const metadata: Metadata = {
  metadataBase: new URL(process.env.APP_URL || 'http://localhost:3000'),
  title: {
    default: 'Dion Technologies — Web development, done right',
    template: '%s — Dion Technologies',
  },
  description:
    'Dion Technologies designs and builds fast, reliable websites and web applications for growing businesses.',
}

export const viewport: Viewport = {
  themeColor: '#07070f',
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const nonceHeader = (await headers()).get('x-nonce')
  // Reading the per-request nonce opts every route into dynamic rendering so
  // documents are always rendered with the middleware's CSP nonce attached to
  // framework scripts (static prerendering would strip it and 'strict-dynamic'
  // would then block all client JS).

  return (
    <html lang="en" className="dark">
      <body className="min-h-screen">{children}</body>
    </html>
  )
}
