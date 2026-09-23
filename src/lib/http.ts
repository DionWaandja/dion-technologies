import { NextResponse } from 'next/server'
import { log } from './logger'

export function ok<T>(data: T, init?: ResponseInit) {
  return NextResponse.json(data, init)
}

export function badRequest(message: string, details?: unknown) {
  return NextResponse.json({ error: message, ...(details ? { details } : {}) }, { status: 400 })
}

export function unauthorized(message = 'Authentication required') {
  return NextResponse.json({ error: message }, { status: 401 })
}

export function forbidden(message = 'You do not have access to this resource') {
  return NextResponse.json({ error: message }, { status: 403 })
}

export function notFound(message = 'Not found') {
  return NextResponse.json({ error: message }, { status: 404 })
}

export function conflict(message: string) {
  return NextResponse.json({ error: message }, { status: 409 })
}

export function tooManyRequests(retryAfterSeconds: number) {
  return NextResponse.json(
    { error: `Too many attempts. Try again in ${retryAfterSeconds}s.` },
    { status: 429, headers: { 'Retry-After': String(retryAfterSeconds) } },
  )
}

export function serverError(e: unknown, context?: string) {
  log.error('request_failed', { context, error: e })
  return NextResponse.json({ error: 'Something went wrong. Please try again.' }, { status: 500 })
}
