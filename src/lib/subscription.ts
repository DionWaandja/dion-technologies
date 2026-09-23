import type { SubscriptionStatus } from '@prisma/client'

const STATUS_ACTIVE: ReadonlySet<SubscriptionStatus> = new Set(['ACTIVE', 'TRIALING'])

/**
 * Single source of truth for paywall decisions, mirroring the webhook sync in
 * src/app/api/stripe/webhook/route.ts. currentPeriodEnd is a belt-and-braces
 * check against missed customer.subscription.deleted events.
 */
export function hasActiveSubscription(user: {
  subscriptionStatus: SubscriptionStatus
  currentPeriodEnd: Date | null
}): boolean {
  if (!STATUS_ACTIVE.has(user.subscriptionStatus)) return false
  if (user.currentPeriodEnd && user.currentPeriodEnd.getTime() < Date.now()) return false
  return true
}

export const SUBSCRIPTION_LABELS: Record<SubscriptionStatus, string> = {
  NONE: 'No subscription',
  ACTIVE: 'Active',
  TRIALING: 'Trial',
  PAST_DUE: 'Past due',
  CANCELED: 'Canceled',
}
