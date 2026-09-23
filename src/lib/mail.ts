import nodemailer from 'nodemailer'
import { log } from './logger'

/**
 * SMTP mailer. When SMTP_HOST is unset (local dev), emails are printed to the
 * server console instead of being sent — so verification and reset flows work
 * end-to-end without a provider.
 */

export const mailConfigured = Boolean(process.env.SMTP_HOST)

type Mail = { to: string; subject: string; text: string }

async function send({ to, subject, text }: Mail): Promise<void> {
  if (!mailConfigured) {
    log.info('DEV_MAIL (SMTP not configured — not sent)', { to, subject, text })
    return
  }

  const port = Number(process.env.SMTP_PORT) || 587
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port,
    secure: port === 465,
    auth:
      process.env.SMTP_USER && process.env.SMTP_PASSWORD
        ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASSWORD }
        : undefined,
  })

  await transporter.sendMail({ from: process.env.SMTP_FROM, to, subject, text })
}

export function verificationEmail(to: string, url: string): Promise<void> {
  return send({
    to,
    subject: 'Verify your email — Dion Technologies',
    text: [
      'Welcome to Dion Technologies!',
      '',
      'Confirm your email address to activate your account:',
      url,
      '',
      `This link expires in ${24} hours. If you did not sign up, you can ignore this email.`,
    ].join('\n'),
  })
}

export function passwordResetEmail(to: string, url: string): Promise<void> {
  return send({
    to,
    subject: 'Reset your password — Dion Technologies',
    text: [
      'We received a request to reset your password.',
      '',
      url,
      '',
      'This link expires in 60 minutes and can be used once.',
      'If you did not request this, no action is needed — your password is unchanged.',
    ].join('\n'),
  })
}
