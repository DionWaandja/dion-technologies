/**
 * Structured JSON logger with recursive redaction of sensitive fields.
 * Passwords, tokens and secrets must never appear in logs.
 */

const SENSITIVE_KEY_PATTERN =
  /^(password|passwordhash|confirmpassword|newpassword|currentpassword|token|tokenhash|secret|authorization|cookie|set-cookie|stripe_secret_key|smtp_password|credit.?card|card.?number|cvv|cvc|bank.?account|routing.?number)$/i

function redact(value: unknown, depth = 0): unknown {
  if (depth > 6 || value === null || value === undefined) return value
  if (Array.isArray(value)) return value.map((v) => redact(v, depth + 1))
  if (value instanceof Error) {
    return { name: value.name, message: value.message }
  }
  if (typeof value === 'object') {
    const out: Record<string, unknown> = {}
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      out[k] = SENSITIVE_KEY_PATTERN.test(k) ? '[REDACTED]' : redact(v, depth + 1)
    }
    return out
  }
  return value
}

function write(level: 'info' | 'warn' | 'error', msg: string, meta?: Record<string, unknown>) {
  const line = JSON.stringify({
    t: new Date().toISOString(),
    level,
    msg,
    ...(meta ? { meta: redact(meta) } : {}),
  })
  if (level === 'error') console.error(line)
  else if (level === 'warn') console.warn(line)
  else console.log(line)
}

export const log = {
  info: (msg: string, meta?: Record<string, unknown>) => write('info', msg, meta),
  warn: (msg: string, meta?: Record<string, unknown>) => write('warn', msg, meta),
  error: (msg: string, meta?: Record<string, unknown>) => write('error', msg, meta),
}

export function errorMessage(e: unknown): string {
  if (e instanceof Error) return e.message
  return String(e)
}
