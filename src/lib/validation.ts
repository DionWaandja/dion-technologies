import { z } from 'zod'
import type { Role } from '@prisma/client'

/** Zod schemas for every untrusted input. Validation happens server-side only. */

export const nameSchema = z
  .string()
  .trim()
  .min(1, 'Name is required')
  .max(100, 'Name is too long')

export const emailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .min(3)
  .max(254)
  .email('Enter a valid email address')

/** Blocks control characters, requires 10+ chars, max 128 (bcrypt-safe limit is 72 bytes). */
export const passwordSchema = z
  .string()
  .min(10, 'Password must be at least 10 characters')
  .max(128, 'Password must be at most 128 characters')
  .refine((v) => /^[\x21-\x7E\xA0-\uFFFF]+$/.test(v), {
    message: 'Password contains forbidden control characters',
  })

export const companySchema = z.string().trim().max(150).optional().or(z.literal(''))

export const signupSchema = z.object({
  name: nameSchema,
  email: emailSchema,
  password: passwordSchema,
})

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1).max(128),
})

export const forgotPasswordSchema = z.object({ email: emailSchema })

export const resetPasswordSchema = z.object({
  token: z.string().min(32).max(128),
  password: passwordSchema,
})

export const BUDGET_RANGES = [
  'Under $2,000',
  '$2,000 – $5,000',
  '$5,000 – $10,000',
  '$10,000 – $25,000',
  '$25,000+',
  'Not sure yet',
] as const

export const contactSchema = z.object({
  name: nameSchema,
  email: emailSchema,
  company: companySchema,
  description: z
    .string()
    .trim()
    .min(30, 'Please describe your project in at least 30 characters')
    .max(5000, 'Description is too long (max 5000 characters)'),
  budgetRange: z.enum(BUDGET_RANGES, { message: 'Select a budget range' }),
})

export const adminMessageUpdateSchema = z.object({
  status: z.enum(['NEW', 'READ', 'ARCHIVED', 'HANDLED']),
  notes: z.string().trim().max(4000).optional(),
})

export type ContactInput = z.infer<typeof contactSchema>
export type SignupInput = z.infer<typeof signupSchema>
export type Role_ = Role
