import { Redis } from '@upstash/redis'

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
})

export async function cacheGet<T>(key: string): Promise<T | null> {
  try {
    const data = await redis.get<T>(key)
    return data
  } catch {
    return null
  }
}

export async function cacheSet(
  key: string,
  value: unknown,
  ttlSeconds: number = 60
): Promise<void> {
  try {
    await redis.setex(key, ttlSeconds, JSON.stringify(value))
  } catch {
    // Falha silenciosa — cache é opcional
  }
}

export async function cacheDelete(
  ...keys: string[]
): Promise<void> {
  try {
    await redis.del(...keys)
  } catch {
    // Falha silenciosa
  }
}

export async function cacheDeletePattern(
  userId: string
): Promise<void> {
  try {
    // Remove todo o cache de um usuário específico
    const keys = await redis.keys(`alfred:${userId}:*`)
    if (keys.length > 0) {
      await redis.del(...keys)
    }
  } catch {
    // Falha silenciosa
  }
}
