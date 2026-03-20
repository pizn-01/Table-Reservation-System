import { Request, Response, NextFunction } from 'express';

/**
 * In-memory rate limiter using a sliding window approach.
 * For production, replace with Redis-backed rate limiting.
 */

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const store = new Map<string, RateLimitEntry>();

// Clean up expired entries periodically (every 5 minutes)
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of store.entries()) {
    if (entry.resetAt <= now) {
      store.delete(key);
    }
  }
}, 5 * 60 * 1000);

export interface RateLimitOptions {
  windowMs: number;       // Time window in ms
  maxRequests: number;    // Max requests per window
  keyGenerator?: (req: Request) => string;
  message?: string;
}

/**
 * Creates a rate limiting middleware.
 */
export const rateLimit = (options: RateLimitOptions) => {
  const {
    windowMs,
    maxRequests,
    keyGenerator = (req) => req.ip || 'unknown',
    message = 'Too many requests. Please try again later.',
  } = options;

  return (req: Request, res: Response, next: NextFunction): void => {
    const key = `rl:${keyGenerator(req)}`;
    const now = Date.now();

    let entry = store.get(key);

    if (!entry || entry.resetAt <= now) {
      // New window
      entry = { count: 1, resetAt: now + windowMs };
      store.set(key, entry);
    } else {
      entry.count++;
    }

    // Set rate limit headers
    res.setHeader('X-RateLimit-Limit', maxRequests);
    res.setHeader('X-RateLimit-Remaining', Math.max(0, maxRequests - entry.count));
    res.setHeader('X-RateLimit-Reset', Math.ceil(entry.resetAt / 1000));

    if (entry.count > maxRequests) {
      res.status(429).json({
        success: false,
        error: message,
        retryAfter: Math.ceil((entry.resetAt - now) / 1000),
      });
      return;
    }

    next();
  };
};

// ─── Prebuilt rate limiters ────────────────────────────

/** General API rate limit: 100 requests per 15 minutes */
export const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  maxRequests: 100,
});

/** Auth rate limit: 1000 attempts per 15 minutes (brute-force protection reduced for testing) */
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  maxRequests: 1000,
  message: 'Too many login attempts. Please try again in 15 minutes.',
});

/** Public API rate limit: 60 requests per minute per IP */
export const publicApiLimiter = rateLimit({
  windowMs: 60 * 1000,
  maxRequests: 60,
});

/** Strict limiter for sensitive operations: 5 per hour */
export const strictLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  maxRequests: 5,
  message: 'Rate limit exceeded for this operation. Please try again later.',
});
