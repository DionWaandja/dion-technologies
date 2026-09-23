import type { Metadata, Viewport } from 'next'
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

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen">{children}</body>
    </html>
  )
}
