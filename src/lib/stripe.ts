import Stripe from 'stripe'
import { log } from './logger'

let cached: Stripe | null | undefined

/**
 * Returns a Stripe client, or null when STRIPE_SECRET_KEY is unset.
 * The whole app treats null as "billing disabled": routes respond with a
 * clear, non-crashing message instead of throwing.
 */
export function getStripe(): Stripe | null {
  if (cached !== undefined) return cached
  const key = process.env.STRIPE_SECRET_KEY
  if (!key) {
    log.warn('STRIPE_SECRET_KEY is not set — Stripe features are disabled')
    cached = null
    return cached
  }
  // apiVersion intentionally omitted: the SDK pins the version it was built for.
  cached = new Stripe(key, { typescript: true })
  return cached
}

export function stripeConfigured(): boolean {
  return Boolean(process.env.STRIPE_SECRET_KEY)
}

export function getAppUrl(): string {
  return (process.env.APP_URL || 'http://localhost:3000').replace(/\/+$/, '')
}
