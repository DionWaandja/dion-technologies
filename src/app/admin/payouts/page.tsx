import type { Metadata } from 'next'
import ConnectPanel from '@/components/admin/ConnectPanel'

export const metadata: Metadata = { title: 'Admin — Payouts' }
export const dynamic = 'force-dynamic'

export default function AdminPayoutsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Payouts</h1>
        <p className="mt-1 text-sm text-slate-500">
          Your bank account and payout schedule are managed in Stripe Connect Express.
        </p>
      </div>
      <ConnectPanel />
    </div>
  )
}
