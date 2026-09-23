import type { Metadata } from 'next'
import MessagesInbox from '@/components/admin/MessagesInbox'

export const metadata: Metadata = { title: 'Admin — Inbox' }
export const dynamic = 'force-dynamic'

export default function AdminInboxPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Inbox</h1>
        <p className="mt-1 text-sm text-slate-500">
          Project requests and contact submissions from the website.
        </p>
      </div>
      <MessagesInbox />
    </div>
  )
}
