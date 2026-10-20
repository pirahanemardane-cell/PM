/**
 * قفل موقت پس از تلاش ناموفق ورود
 * ۵ شکست در ۱۵ دقیقه → قفل ۱۵ دقیقه (per identifier)
 */
import { Redis } from "@upstash/redis";

const MAX_FAILS = 5;
const WINDOW_SEC = 15 * 60;
const LOCK_SEC = 15 * 60;

let redis: Redis | null = null;
try {
  if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
    redis = Redis.fromEnv();
  }
} catch {
  redis = null;
}

type Mem = { fails: number; resetAt: number; lockedUntil: number };
const mem = new Map<string, Mem>();

function now() {
  return Math.floor(Date.now() / 1000);
}

export async function getLoginLockStatus(key: string): Promise<{
  locked: boolean;
  retryAfterSec?: number;
  fails?: number;
}> {
  const k = "pm:lock:" + key;
  if (redis) {
    try {
      const lockedUntil = await redis.get<number>(k + ":until");
      if (lockedUntil && lockedUntil > now()) {
        return { locked: true, retryAfterSec: lockedUntil - now() };
      }
      const fails = (await redis.get<number>(k + ":fails")) || 0;
      return { locked: false, fails };
    } catch {
      /* fall through */
    }
  }
  const m = mem.get(key);
  const t = now();
  if (!m) return { locked: false, fails: 0 };
  if (m.lockedUntil > t) return { locked: true, retryAfterSec: m.lockedUntil - t };
  if (m.resetAt <= t) return { locked: false, fails: 0 };
  return { locked: false, fails: m.fails };
}

export async function recordLoginFailure(key: string): Promise<{
  locked: boolean;
  retryAfterSec?: number;
  fails: number;
}> {
  const k = "pm:lock:" + key;
  if (redis) {
    try {
      const failsKey = k + ":fails";
      const untilKey = k + ":until";
      const fails = (await redis.incr(failsKey)) as number;
      if (fails === 1) await redis.expire(failsKey, WINDOW_SEC);
      if (fails >= MAX_FAILS) {
        const until = now() + LOCK_SEC;
        await redis.set(untilKey, until, { ex: LOCK_SEC });
        await redis.del(failsKey);
        return { locked: true, retryAfterSec: LOCK_SEC, fails };
      }
      return { locked: false, fails };
    } catch {
      /* fall through */
    }
  }
  const t = now();
  let m = mem.get(key);
  if (!m || m.resetAt <= t) {
    m = { fails: 0, resetAt: t + WINDOW_SEC, lockedUntil: 0 };
  }
  if (m.lockedUntil > t) {
    return { locked: true, retryAfterSec: m.lockedUntil - t, fails: m.fails };
  }
  m.fails += 1;
  if (m.fails >= MAX_FAILS) {
    m.lockedUntil = t + LOCK_SEC;
    m.fails = 0;
    mem.set(key, m);
    return { locked: true, retryAfterSec: LOCK_SEC, fails: MAX_FAILS };
  }
  mem.set(key, m);
  return { locked: false, fails: m.fails };
}

export async function clearLoginFailures(key: string): Promise<void> {
  const k = "pm:lock:" + key;
  if (redis) {
    try {
      await redis.del(k + ":fails");
      await redis.del(k + ":until");
    } catch {
      /* ignore */
    }
  }
  mem.delete(key);
}
