const rateLimit = require('express-rate-limit');

// ── Auth Rate Limiter ──────────────────────────────────────────────────────
// Protects login/register from brute-force & credential stuffing.
// skipSuccessfulRequests: true means only FAILED attempts count toward the limit.
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15-minute window
  max: 20,                   // 20 failed attempts per window per IP
  standardHeaders: true,     // Return `RateLimit-*` headers
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many failed auth attempts from this IP. Please try again after 15 minutes.',
  },
  skipSuccessfulRequests: true, // Only count FAILED (4xx/5xx) attempts
});

// ── General API Rate Limiter ───────────────────────────────────────────────
// Relaxed: prevents scraping / DDoS on all other routes
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200,                  // 200 requests per window
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many requests. Please slow down and try again later.',
  },
});

module.exports = { authLimiter, generalLimiter };
