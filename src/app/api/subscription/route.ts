import { ok, unauthorized, serverError } from '@/lib/http'
import { currentUser } from '@/lib/session'
import { hasActiveSubscription, SUBSCRIPTION_LABELS } from '@/lib/subscription'
import { stripeConfigured } from '@/lib/stripe'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/** Current user's subscription status for dashboard display. */
export async function GET() {
  try {
    const user = await currentUser()
    if (!user) return unauthorized()

    return ok({
      stripeConfigured: stripeConfigured(),
      subscriptionStatus: user.subscriptionStatus,
      label: SUBSCRIPTION_LABELS[user.subscriptionStatus],
      currentPeriodEnd: user.currentPeriodEnd?.toISOString() ?? null,
      hasActive: hasActiveSubscription(user),
    })
  } catch (e) {
    return serverError(e, 'subscription-status')
  }
}
