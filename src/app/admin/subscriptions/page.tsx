import type { Metadata } from 'next'
import SubscriptionsPanel from '@/components/admin/SubscriptionsPanel'

export const metadata: Metadata = { title: 'Admin — Subscriptions' }
export const dynamic = 'force-dynamic'

export default function AdminSubscriptionsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Subscriptions & revenue</h1>
        <p className="mt-1 text-sm text-slate-500">Live from Stripe.</p>
      </div>
      <SubscriptionsPanel />
    </div>
  )
}
