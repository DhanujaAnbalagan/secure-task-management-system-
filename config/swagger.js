const swaggerJsdoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Task Management API',
      version: '1.0.0',
      description:
        'A production-grade REST API for task management with JWT authentication, ' +
        'role-based access control (admin/user), CRUD operations, pagination, ' +
        'rate limiting, and request logging.',
      contact: {
        name: 'Task Management API',
      },
    },
    servers: [
      {
        url: 'http://localhost:5000',
        description: 'Development Server',
      },
    ],
    components: {
      securitySchemes: {
        BearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Enter your JWT token (obtained from /api/v1/auth/login)',
        },
      },
      schemas: {
        // ── User ──────────────────────────────────────────
        User: {
          type: 'object',
          properties: {
            _id:       { type: 'string', example: '664f1a2b3c4d5e6f7a8b9c0d' },
            name:      { type: 'string', example: 'John Doe' },
            email:     { type: 'string', format: 'email', example: 'john@example.com' },
            role:      { type: 'string', enum: ['user', 'admin'], example: 'user' },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
          },
        },
        // ── Task ──────────────────────────────────────────
        Task: {
          type: 'object',
          properties: {
            _id:         { type: 'string', example: '664f1a2b3c4d5e6f7a8b9c0e' },
            title:       { type: 'string', example: 'Complete internship assignment' },
            description: { type: 'string', example: 'Finish the REST API task manager' },
            status: {
              type: 'string',
              enum: ['pending', 'in-progress', 'completed'],
              example: 'pending',
            },
            createdBy: { $ref: '#/components/schemas/User' },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
          },
        },
        // ── Pagination ────────────────────────────────────
        Pagination: {
          type: 'object',
          properties: {
            total: { type: 'integer', example: 42 },
            page:  { type: 'integer', example: 1 },
            limit: { type: 'integer', example: 10 },
            pages: { type: 'integer', example: 5 },
          },
        },
        // ── Success / Error responses ─────────────────────
        SuccessResponse: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: true },
            message: { type: 'string', example: 'Operation successful.' },
            data:    { type: 'object' },
          },
        },
        ErrorResponse: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: false },
            message: { type: 'string', example: 'Something went wrong.' },
          },
        },
        ValidationErrorResponse: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: false },
            message: { type: 'string', example: 'Validation failed' },
            errors: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  field:   { type: 'string', example: 'email' },
                  message: { type: 'string', example: 'Please provide a valid email address' },
                },
              },
            },
          },
        },
      },
    },
    // Global security — can be overridden per-route
    security: [{ BearerAuth: [] }],
    tags: [
      { name: 'Auth',  description: 'Authentication — register, login, profile' },
      { name: 'Tasks', description: 'Task CRUD — create, read, update, delete' },
      { name: 'Admin', description: 'Admin-only — user management & stats' },
    ],
  },
  // Scan these files for JSDoc @swagger comments
  apis: [
    './routes/authRoutes.js',
    './routes/taskRoutes.js',
    './routes/adminRoutes.js',
  ],
};

const swaggerSpec = swaggerJsdoc(options);

module.exports = swaggerSpec;
