import { NextResponse } from 'next/server'
import type Stripe from 'stripe'
import { getStripe } from '@/lib/stripe'
import { db } from '@/lib/db'
import type { SubscriptionStatus } from '@prisma/client'
import { log } from '@/lib/logger'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/**
 * Stripe webhook receiver.
 *
 * Security model:
 *  - Raw body is read with req.text() (required for signature verification)
 *  - Every event is verified against STRIPE_WEBHOOK_SECRET before any trust
 *  - Unconfigured mode responds 503 so Stripe retries once keys exist
 *
 * Events handled: checkout.session.completed, customer.subscription.created /
 * updated / deleted, invoice.payment_failed — syncing status into Postgres so
 * paywall checks never need to call Stripe on page load.
 */

function mapStatus(sub: Stripe.Subscription): SubscriptionStatus {
  switch (sub.status) {
    case 'active':
      return 'ACTIVE'
    case 'trialing':
      return 'TRIALING'
    case 'past_due':
    case 'unpaid':
      return 'PAST_DUE'
    case 'canceled':
    case 'paused':
      return 'CANCELED'
    default:
      // incomplete / incomplete_expired — never had access
      return 'NONE'
  }
}

/** Stripe moved current_period_end to the item level in newer API versions. */
function periodEnd(sub: Stripe.Subscription): Date | null {
  const topLevel = (sub as unknown as { current_period_end?: number | null }).current_period_end
  const itemLevel = sub.items?.data?.[0]?.current_period_end
  const seconds = topLevel ?? itemLevel
  return typeof seconds === 'number' ? new Date(seconds * 1000) : null
}

async function syncSubscriptionFromStripe(subscriptionId: string): Promise<void> {
  const stripe = getStripe()
  if (!stripe) return
  const sub = await stripe.subscriptions.retrieve(subscriptionId)
  await applySubscription(sub)
}

async function applySubscription(sub: Stripe.Subscription): Promise<void> {
  const customerId = typeof sub.customer === 'string' ? sub.customer : sub.customer?.id
  if (!customerId) return

  const user = await db.user.findUnique({ where: { stripeCustomerId: customerId } })
  if (!user) {
    log.warn('webhook_subscription_no_user', { customerId, subscriptionId: sub.id })
    return
  }

  await db.user.update({
    where: { id: user.id },
    data: {
      stripeSubscriptionId: sub.id,
      subscriptionStatus: mapStatus(sub),
      currentPeriodEnd: periodEnd(sub),
    },
  })
  log.info('subscription_synced', {
    userId: user.id,
    subscriptionId: sub.id,
    status: sub.status,
  })
}

export async function POST(req: Request) {
  const stripe = getStripe()
  const secret = process.env.STRIPE_WEBHOOK_SECRET
  if (!stripe || !secret) {
    return NextResponse.json({ error: 'Stripe is not configured' }, { status: 503 })
  }

  const signature = req.headers.get('stripe-signature')
  if (!signature) {
    return NextResponse.json({ error: 'Missing stripe-signature header' }, { status: 400 })
  }

  const payload = await req.text()
  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(payload, signature, secret)
  } catch {
    // Signature verification failed — reject before trusting anything.
    return NextResponse.json({ error: 'Invalid webhook signature' }, { status: 400 })
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object
        if (session.mode === 'subscription' && typeof session.subscription === 'string') {
          await syncSubscriptionFromStripe(session.subscription)
        }
        break
      }
      case 'customer.subscription.created':
      case 'customer.subscription.updated':
      case 'customer.subscription.deleted': {
        await applySubscription(event.data.object)
        break
      }
      case 'invoice.payment_failed': {
        const invoice = event.data.object
        const customerId = typeof invoice.customer === 'string' ? invoice.customer : null
        if (customerId) {
          await db.user.updateMany({
            where: { stripeCustomerId: customerId },
            data: { subscriptionStatus: 'PAST_DUE' },
          })
        }
        break
      }
      default:
        // Unhandled event types are acknowledged so Stripe stops retrying.
        break
    }
  } catch (e) {
    log.error('webhook_handler_failed', { eventType: event.type, error: e })
    // 500 makes Stripe retry with backoff.
    return NextResponse.json({ error: 'Webhook handler failed' }, { status: 500 })
  }

  return NextResponse.json({ received: true })
}
