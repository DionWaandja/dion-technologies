import { badRequest, ok, unauthorized, serverError, tooManyRequests } from '@/lib/http'
import { rateLimit, clientIp, LIMITS } from '@/lib/rate-limit'
import { verifySameOrigin } from '@/lib/csrf'
import { currentUser } from '@/lib/session'
import { getStripe, getAppUrl, stripeConfigured } from '@/lib/stripe'

export const runtime = 'nodejs'

/**
 * Hands the user to the Stripe Customer Portal to manage their payment
 * method, invoices, and cancellation — no custom billing UI is built.
 */
export async function POST(req: Request) {
  try {
    if (!verifySameOrigin(req)) return badRequest('Invalid origin')

    const rl = rateLimit(`portal:${clientIp(req)}`, LIMITS.stripeAction)
    if (!rl.allowed) return tooManyRequests(rl.retryAfterSeconds)

    const user = await currentUser()
    if (!user) return unauthorized()

    const stripe = getStripe()
    if (!stripe || !stripeConfigured()) {
      return badRequest('Billing is not configured yet. Set STRIPE_SECRET_KEY to enable it.')
    }
    if (!user.stripeCustomerId) {
      return badRequest('No billing profile yet — subscribe to a plan first.')
    }

    const session = await stripe.billingPortal.sessions.create({
      customer: user.stripeCustomerId,
      return_url: `${getAppUrl()}/dashboard`,
    })

    return ok({ url: session.url })
  } catch (e) {
    return serverError(e, 'billing-portal')
  }
}

export async function GET() {
  return unauthorized()
}
