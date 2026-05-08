const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('./config/swagger');

const authRoutes  = require('./routes/authRoutes');
const taskRoutes  = require('./routes/taskRoutes');
const adminRoutes = require('./routes/adminRoutes');
const errorHandler = require('./middleware/errorHandler');
const { generalLimiter } = require('./middleware/rateLimiter');
const { sendError } = require('./utils/response');

const createApp = () => {
  const app = express();

  // ── Global Middleware ──────────────────────────────────────────────────────
  app.use(cors());
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // ── Request Logging (Feature 4) ────────────────────────────────────────────
  // morgan 'dev' format: METHOD /path STATUS response-time ms
  if (process.env.NODE_ENV === 'development') {
    app.use(morgan('dev'));
  } else {
    // Concise Apache-style log in production
    app.use(morgan('combined'));
  }

  // ── General Rate Limiting (Feature 5 — broad protection) ──────────────────
  app.use('/api', generalLimiter);

  // ── Swagger API Docs (Feature 1) ───────────────────────────────────────────
  app.use(
    '/api-docs',
    swaggerUi.serve,
    swaggerUi.setup(swaggerSpec, {
      customSiteTitle: 'Task Management API Docs',
      customCss: `
        .swagger-ui .topbar { background-color: #1a1a2e; }
        .swagger-ui .topbar .download-url-wrapper { display: none; }
      `,
      swaggerOptions: {
        persistAuthorization: true,        // Keep token between page refreshes
        displayRequestDuration: true,      // Show request timing
        docExpansion: 'list',
        filter: true,
      },
    })
  );

  // Expose raw OpenAPI JSON spec
  app.get('/api-docs.json', (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.send(swaggerSpec);
  });

  // ── Health Check ───────────────────────────────────────────────────────────
  app.get('/health', (req, res) => {
    res.status(200).json({
      success: true,
      message: 'Task Management API is running',
      environment: process.env.NODE_ENV,
      timestamp: new Date().toISOString(),
      docs: '/api-docs',
    });
  });

  // ── API Routes ─────────────────────────────────────────────────────────────
  app.use('/api/v1/auth',  authRoutes);
  app.use('/api/v1/tasks', taskRoutes);
  app.use('/api/v1/admin', adminRoutes);   // Feature 2: Admin routes

  // ── 404 Handler ────────────────────────────────────────────────────────────
  app.use((req, res) => {
    return sendError(res, `Route not found: ${req.method} ${req.originalUrl}`, 404);
  });

  // ── Global Error Handler (must be last) ────────────────────────────────────
  app.use(errorHandler);

  return app;
};

module.exports = createApp;
