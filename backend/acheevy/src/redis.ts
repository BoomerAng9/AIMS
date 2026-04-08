/**
 * Redis Client — Session persistence for ACHEEVY
 *
 * Connects to Redis for durable session storage.
 * Falls back to in-memory Maps if Redis is unavailable.
 */

import Redis from 'ioredis';

// REDIS_URL must be provided in production via env. Local fallback uses
// the docker-network hostname WITHOUT an embedded password — the password
// (if any) must come from REDIS_PASSWORD or be baked into REDIS_URL by the
// operator. Hardcoded secret-shaped strings have been removed per audit.
const REDIS_URL =
  process.env.REDIS_URL ||
  (process.env.REDIS_PASSWORD
    ? `redis://:${encodeURIComponent(process.env.REDIS_PASSWORD)}@redis:6379`
    : 'redis://redis:6379');

let redis: Redis | null = null;
let redisReady = false;

function getRedis(): Redis | null {
  if (redis) return redis;

  try {
    redis = new Redis(REDIS_URL, {
      maxRetriesPerRequest: 3,
      retryStrategy(times) {
        if (times > 5) return null; // stop retrying after 5 attempts
        return Math.min(times * 500, 3000);
      },
      lazyConnect: true,
    });

    redis.on('connect', () => {
      redisReady = true;
      console.log('[ACHEEVY/Redis] Connected');
    });

    redis.on('error', (err) => {
      redisReady = false;
      console.warn('[ACHEEVY/Redis] Error:', err.message);
    });

    redis.on('close', () => {
      redisReady = false;
    });

    redis.connect().catch(() => {
      console.warn('[ACHEEVY/Redis] Initial connection failed — using in-memory fallback');
    });

    return redis;
  } catch {
    console.warn('[ACHEEVY/Redis] Failed to create client — using in-memory fallback');
    return null;
  }
}

// In-memory fallback
const memoryStore = new Map<string, string>();

/**
 * Get a value from Redis (or memory fallback).
 */
export async function redisGet(key: string): Promise<string | null> {
  const client = getRedis();
  if (client && redisReady) {
    try {
      return await client.get(key);
    } catch {
      return memoryStore.get(key) ?? null;
    }
  }
  return memoryStore.get(key) ?? null;
}

/**
 * Set a value in Redis with TTL (or memory fallback).
 */
export async function redisSet(key: string, value: string, ttlSeconds: number): Promise<void> {
  memoryStore.set(key, value); // always keep in-memory copy

  const client = getRedis();
  if (client && redisReady) {
    try {
      await client.set(key, value, 'EX', ttlSeconds);
    } catch {
      // already saved in memory
    }
  }
}

/**
 * Delete a key from Redis and memory.
 */
export async function redisDel(key: string): Promise<void> {
  memoryStore.delete(key);

  const client = getRedis();
  if (client && redisReady) {
    try {
      await client.del(key);
    } catch {
      // already deleted from memory
    }
  }
}

/**
 * Check if Redis is connected.
 */
export function isRedisReady(): boolean {
  return redisReady;
}
