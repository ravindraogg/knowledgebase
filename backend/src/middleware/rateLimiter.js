const requestCounts = new Map();

const DEFAULT_LIMITS = {
  query: { window: 3600000, max: 100 },
  graph: { window: 3600000, max: 300 },
  ingestion: { window: 3600000, max: 20 },
  default: { window: 3600000, max: 200 },
};

export function rateLimiter(category) {
  return (req, res, next) => {
    const userId = req.user?.userId || req.ip;
    const limits = DEFAULT_LIMITS[category] || DEFAULT_LIMITS.default;
    const key = `${category}:${userId}`;
    const now = Date.now();

    const entry = requestCounts.get(key) || { count: 0, resetAt: now + limits.window };

    if (now > entry.resetAt) {
      entry.count = 0;
      entry.resetAt = now + limits.window;
    }

    entry.count++;

    if (entry.count > limits.max) {
      const retryAfter = Math.ceil((entry.resetAt - now) / 1000);
      res.set('Retry-After', String(retryAfter));
      return res.status(429).json({
        error: 'RateLimitExceeded',
        message: `Too many requests. Try again in ${retryAfter} seconds.`,
      });
    }

    requestCounts.set(key, entry);
    next();
  };
}
