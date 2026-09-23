import { db } from '@/lib/db'
import { ok, serverError } from '@/lib/http'
import { guardAdmin } from '@/lib/session'
import { getStripe, stripeConfigured } from '@/lib/stripe'
import type Stripe from 'stripe'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/**
 * Subscriptions & revenue, pulled live from the Stripe API — there is no
 * custom billing ledger in this database. MRR is normalized to monthly
 * (annual prices divided by 12).
 */
export async function GET() {
  try {
    const guard = await guardAdmin()
    if ('error' in guard) return guard.error

    const stripe = getStripe()
    if (!stripe || !stripeConfigured()) {
      return ok({
        configured: false,
        summary: { active: 0, trialing: 0, pastDue: 0, canceled: 0, mrr: 0 },
        subscribers: [],
        note: 'Set STRIPE_SECRET_KEY to pull live subscriber and revenue data.',
      })
    }

    // Single page (up to 100) is plenty for an admin overview; paginate if you grow past it.
    const subs = await stripe.subscriptions.list({ status: 'all', limit: 100 })

    let mrr = 0
    const counts = { active: 0, trialing: 0, pastDue: 0, canceled: 0 }
    const subscribers: Array<{
      id: string
      email: string | null
      name: string | null
      status: string
      amountMonthly: number
      currency: string
      currentPeriodEnd: string | null
    }> = []

    for (const sub of subs.data) {
      const price: Stripe.Price | undefined = sub.items.data[0]?.price
      const unitAmount = price?.unit_amount ?? 0
      const quantity = sub.items.data[0]?.quantity ?? 1

      let amountMonthly = (unitAmount * quantity) / 100
      if (price?.recurring?.interval === 'year') amountMonthly /= 12
      if (price?.recurring?.interval === 'week') amountMonthly *= 4.33

      if (sub.status === 'active' || sub.status === 'trialing') mrr += amountMonthly
      if (sub.status === 'active') counts.active += 1
      if (sub.status === 'trialing') counts.trialing += 1
      if (sub.status === 'past_due' || sub.status === 'unpaid') counts.pastDue += 1
      if (sub.status === 'canceled') counts.canceled += 1

      // Join against local users for display metadata.
      const customerId = typeof sub.customer === 'string' ? sub.customer : sub.customer?.id
      const user = customerId
        ? await db.user.findUnique({
            where: { stripeCustomerId: customerId },
            select: { email: true, name: true },
          })
        : null

      subscribers.push({
        id: sub.id,
        email: user?.email ?? null,
        name: user?.name ?? null,
        status: sub.status,
        amountMonthly,
        currency: (price?.currency ?? 'usd').toUpperCase(),
        currentPeriodEnd: periodEndOf(sub)?.toISOString() ?? null,
      })
    }

    return ok({
      configured: true,
      summary: {
        active: counts.active,
        trialing: counts.trialing,
        pastDue: counts.pastDue,
        canceled: counts.canceled,
        mrr: Math.round(mrr * 100) / 100,
      },
      subscribers,
    })
  } catch (e) {
    return serverError(e, 'admin-subscriptions')
  }
}

/** Stripe moved current_period_end to the item level in newer API versions. */
function periodEndOf(sub: Stripe.Subscription): Date | null {
  const topLevel = (sub as unknown as { current_period_end?: number | null }).current_period_end
  const itemLevel = sub.items?.data?.[0]?.current_period_end
  const seconds = topLevel ?? itemLevel
  return typeof seconds === 'number' ? new Date(seconds * 1000) : null
}
