const rateLimitMap = new Map()

/**
 * Simple in-memory rate limiting
 * @param ip Client IP address
 * @param limit Max requests per window
 * @param window Time window in milliseconds (default 60s)
 * @returns boolean true if request is allowed, false if limited
 */
export function rateLimit(ip: string, limit = 20, window = 60000) {
  const now = Date.now()
  const windowStart = now - window
  
  const requests = rateLimitMap.get(ip) || []
  
  // Filter out old requests
  const recent = requests.filter((t: number) => t > windowStart)
  
  if (recent.length >= limit) {
    return false
  }
  
  recent.push(now)
  rateLimitMap.set(ip, recent)
  return true
}
