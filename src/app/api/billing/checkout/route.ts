import { db } from '@/lib/db'
import { badRequest, ok, unauthorized, serverError, tooManyRequests } from '@/lib/http'
import { rateLimit, clientIp, LIMITS } from '@/lib/rate-limit'
import { verifySameOrigin } from '@/lib/csrf'
import { currentUser } from '@/lib/session'
import { getStripe, getAppUrl, stripeConfigured } from '@/lib/stripe'
import { audit } from '@/lib/audit'

export const runtime = 'nodejs'

/**
 * Creates a Stripe Checkout session (hosted by Stripe — no card details ever
 * touch this server). Disabled with a clear message until keys are configured.
 */
export async function POST(req: Request) {
  try {
    if (!verifySameOrigin(req)) return badRequest('Invalid origin')

    const rl = rateLimit(`checkout:${clientIp(req)}`, LIMITS.stripeAction)
    if (!rl.allowed) return tooManyRequests(rl.retryAfterSeconds)

    const user = await currentUser()
    if (!user) return unauthorized()

    const stripe = getStripe()
    if (!stripe || !stripeConfigured()) {
      return badRequest(
        'Billing is not configured yet. Set STRIPE_SECRET_KEY and STRIPE_PRICE_ID to enable subscriptions.',
      )
    }
    const priceId = process.env.STRIPE_PRICE_ID
    if (!priceId) {
      return badRequest('Billing is not configured yet (missing STRIPE_PRICE_ID).')
    }

    if (!user.emailVerified) {
      return badRequest('Please verify your email address before subscribing.')
    }

    // Get-or-create the Stripe customer for this user.
    let customerId = user.stripeCustomerId
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        name: user.name ?? undefined,
        metadata: { userId: user.id },
      })
      customerId = customer.id
      await db.user.update({ where: { id: user.id }, data: { stripeCustomerId: customerId } })
    }

    const appUrl = getAppUrl()
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: 'subscription',
      line_items: [{ price: priceId, quantity: 1 }],
      allow_promotion_codes: true,
      subscription_data: { metadata: { userId: user.id } },
      success_url: `${appUrl}/dashboard?checkout=success`,
      cancel_url: `${appUrl}/pricing?checkout=cancelled`,
    })

    await audit({
      action: 'billing.checkout_started',
      req,
      actorId: user.id,
      actorEmail: user.email,
      targetType: 'user',
      targetId: user.id,
    })

    return ok({ url: session.url })
  } catch (e) {
    return serverError(e, 'billing-checkout')
  }
}
