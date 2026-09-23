import { forbidden, ok, serverError, unauthorized } from '@/lib/http'
import { currentUser } from '@/lib/session'
import { hasActiveSubscription } from '@/lib/subscription'
import { PREMIUM_PERKS } from '@/lib/site'
import { audit } from '@/lib/audit'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/**
 * Paywalled content. The subscription check happens here, server-side, on
 * every request — hiding UI client-side is never sufficient.
 */
export async function GET() {
  try {
    const user = await currentUser()
    if (!user) return unauthorized()

    if (!hasActiveSubscription(user)) {
      return forbidden('An active subscription is required to view this content.')
    }

    await audit({
      action: 'premium.content_viewed',
      actorId: user.id,
      actorEmail: user.email,
      targetType: 'premium',
      targetId: 'resource-library',
    })

    // In production this is where gated files/downloads/queries would be served.
    return ok({
      unlocked: true,
      perks: PREMIUM_PERKS,
      resources: [
        { title: 'Launch Readiness Checklist (2026 edition)', type: 'PDF', size: '412 KB' },
        { title: 'SEO Setup Playbook for Local Businesses', type: 'PDF', size: '1.2 MB' },
        { title: 'Conversion Copy Frameworks', type: 'DOCX', size: '88 KB' },
        { title: 'Analytics & Event Tracking Starter', type: 'ZIP', size: '230 KB' },
      ],
    })
  } catch (e) {
    return serverError(e, 'premium-content')
  }
}
