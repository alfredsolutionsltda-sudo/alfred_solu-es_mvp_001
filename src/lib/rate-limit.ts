import { Ratelimit } from "@upstash/ratelimit"
import { redis } from "./redis"

// Create a new ratelimiter, that allows 20 requests per 60 seconds
const ratelimit = new Ratelimit({
  redis: redis,
  limiter: Ratelimit.slidingWindow(20, "60 s"),
  analytics: true,
  prefix: "@upstash/ratelimit",
})

/**
 * Global rate limiting using Upstash Redis
 * @param ip Client IP address or unique identifier
 * @returns boolean true if request is allowed, false if limited
 */
export async function rateLimit(ip: string) {
  const { success } = await ratelimit.limit(ip)
  return success
}
