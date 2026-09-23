import { ok, serverError, tooManyRequests, badRequest } from '@/lib/http'
import { guardAdmin } from '@/lib/session'
import { rateLimit, LIMITS } from '@/lib/rate-limit'
import { verifySameOrigin } from '@/lib/csrf'
import { getStripe, getAppUrl, stripeConfigured } from '@/lib/stripe'
import { getSetting, setSetting, SETTING_KEYS } from '@/lib/settings'
import { audit } from '@/lib/audit'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/**
 * Stripe Connect Express: the admin manages their own bank account and views
 * payouts in Stripe's dashboard — bank details never touch this database.
 * GET  → connection status (+ an Express dashboard login link when connected)
 * POST → create the Express account (first run) and an onboarding link
 */

async function connectStatus(stripeOk: boolean) {
  const accountId = await getSetting(SETTING_KEYS.stripeConnectAccountId)
  if (!stripeOk || !accountId) {
    return { configured: stripeOk, connected: false, accountId: null }
  }
  const stripe = getStripe()
  if (!stripe) return { configured: false, connected: false, accountId: null }
  const account = await stripe.accounts.retrieve(accountId)
  return {
    configured: true,
    connected: true,
    accountId,
    chargesEnabled: account.charges_enabled,
    payoutsEnabled: account.payouts_enabled,
    detailsSubmitted: account.details_submitted,
  }
}

export async function GET() {
  try {
    const guard = await guardAdmin()
    if ('error' in guard) return guard.error

    const stripe = getStripe()
    const status = await connectStatus(stripeConfigured())

    let dashboardUrl: string | null = null
    if (stripe && status.connected && status.accountId) {
      const link = await stripe.accounts.createLoginLink(status.accountId)
      dashboardUrl = link.url
    }

    return ok({ ...status, dashboardUrl })
  } catch (e) {
    return serverError(e, 'connect-status')
  }
}

export async function POST(req: Request) {
  try {
    if (!verifySameOrigin(req)) return badRequest('Invalid origin')

    const guard = await guardAdmin()
    if ('error' in guard) return guard.error

    const rl = rateLimit(`connect:${guard.user.id}`, LIMITS.stripeAction)
    if (!rl.allowed) return tooManyRequests(rl.retryAfterSeconds)

    const stripe = getStripe()
    if (!stripe || !stripeConfigured()) {
      return badRequest('Stripe is not configured yet. Set STRIPE_SECRET_KEY first.')
    }

    let accountId = await getSetting(SETTING_KEYS.stripeConnectAccountId)
    if (!accountId) {
      const account = await stripe.accounts.create({
        type: 'express',
        country: process.env.STRIPE_CONNECT_COUNTRY || 'US',
        email: guard.user.email,
        metadata: { purpose: 'dion-platform-payouts', adminUserId: guard.user.id },
      })
      accountId = account.id
      await setSetting(SETTING_KEYS.stripeConnectAccountId, accountId)
      await audit({
        action: 'connect.account_created',
        req,
        actorId: guard.user.id,
        actorEmail: guard.user.email,
        targetType: 'stripe_account',
        targetId: accountId,
      })
    }

    const appUrl = getAppUrl()
    const link = await stripe.accountLinks.create({
      account: accountId,
      type: 'account_onboarding',
      refresh_url: `${appUrl}/admin/payouts?connect=refresh`,
      return_url: `${appUrl}/admin/payouts?connect=return`,
    })

    await audit({
      action: 'connect.onboarding_link_created',
      req,
      actorId: guard.user.id,
      actorEmail: guard.user.email,
      targetType: 'stripe_account',
      targetId: accountId,
    })

    return ok({ url: link.url })
  } catch (e) {
    return serverError(e, 'connect-onboarding')
  }
}
