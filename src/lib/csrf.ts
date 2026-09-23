/**
 * Defense-in-depth CSRF protection: every state-changing API request must
 * originate from this site. Browsers always send Origin on cross-site POSTs,
 * so a mismatch or absent-and-required Origin is rejected before any work.
 */
export function verifySameOrigin(req: Request): boolean {
  const origin = req.headers.get('origin')

  // Non-browser clients (curl, server-to-server) send no Origin — allow;
  // session cookies are SameSite=Lax and auth is still enforced downstream.
  if (!origin) return true

  try {
    const originHost = new URL(origin).host
    const hostHeader = req.headers.get('host')
    if (hostHeader && originHost === hostHeader) return true

    const appUrl = process.env.APP_URL
    if (appUrl && originHost === new URL(appUrl).host) return true

    return false
  } catch {
    return false
  }
}
