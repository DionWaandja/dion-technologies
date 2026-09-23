import { db } from './db'

/**
 * Tiny key/value settings store for non-sensitive platform configuration
 * such as the Stripe Connect Express account id. Never store bank account
 * numbers or payouts data here — Stripe Connect Express owns those.
 */
export async function getSetting(key: string): Promise<string | null> {
  const row = await db.setting.findUnique({ where: { key } })
  return row?.value ?? null
}

export async function setSetting(key: string, value: string): Promise<void> {
  await db.setting.upsert({ where: { key }, create: { key, value }, update: { value } })
}

export const SETTING_KEYS = {
  stripeConnectAccountId: 'stripeConnectAccountId',
} as const
