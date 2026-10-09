// Outbound requests to user-supplied URLs may only reach public HTTPS endpoints (prevents SSRF).
export function assertPublicHttpsUrl(raw: string): URL {
  let u: URL
  try { u = new URL(raw) } catch { throw new Error('Invalid URL') }
  if (u.protocol !== 'https:') throw new Error('URL must use https://')
  const h = u.hostname.toLowerCase().replace(/^\[|\]$/g, '')
  const privateHost =
    h === 'localhost' || h.endsWith('.localhost') || h.endsWith('.internal') || h.endsWith('.local') ||
    /^(127\.|10\.|0\.|169\.254\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.|100\.(6[4-9]|[7-9]\d|1[01]\d|12[0-7])\.)/.test(h) ||
    h === '::1' || h.startsWith('fc') || h.startsWith('fd') || h.startsWith('fe80') || /^\d+$/.test(h)
  if (privateHost) throw new Error('Private or internal addresses are not allowed')
  return u
}
