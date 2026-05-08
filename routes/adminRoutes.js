const express = require('express');
const router = express.Router();

const { getAllUsers, getStats } = require('../controllers/adminController');
const { protect, authorize } = require('../middleware/auth');

// All admin routes require authentication AND admin role
router.use(protect, authorize('admin'));

/**
 * @swagger
 * /api/v1/admin/users:
 *   get:
 *     summary: Get all users with task counts
 *     description: Returns a paginated list of all registered users along with their task statistics. Accessible by admin only.
 *     tags: [Admin]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Results per page
 *       - in: query
 *         name: role
 *         schema:
 *           type: string
 *           enum: [user, admin]
 *         description: Filter users by role
 *     responses:
 *       200:
 *         description: List of users with their task counts
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: object
 *                       properties:
 *                         users:
 *                           type: array
 *                           items:
 *                             allOf:
 *                               - $ref: '#/components/schemas/User'
 *                               - type: object
 *                                 properties:
 *                                   tasks:
 *                                     type: object
 *                                     properties:
 *                                       total:      { type: integer }
 *                                       pending:    { type: integer }
 *                                       inProgress: { type: integer }
 *                                       completed:  { type: integer }
 *                         pagination:
 *                           $ref: '#/components/schemas/Pagination'
 *       401:
 *         description: Unauthorized — no or invalid token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       403:
 *         description: Forbidden — admin role required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get('/users', getAllUsers);

/**
 * @swagger
 * /api/v1/admin/stats:
 *   get:
 *     summary: Get platform-wide statistics
 *     description: Returns total user count, total task count, and breakdown of tasks by status. Admin only.
 *     tags: [Admin]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Platform stats
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: object
 *                       properties:
 *                         stats:
 *                           type: object
 *                           properties:
 *                             totalUsers: { type: integer, example: 24 }
 *                             totalTasks: { type: integer, example: 156 }
 *                             tasksByStatus:
 *                               type: object
 *                               properties:
 *                                 pending:     { type: integer, example: 40 }
 *                                 in-progress: { type: integer, example: 36 }
 *                                 completed:   { type: integer, example: 80 }
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       403:
 *         description: Forbidden — admin role required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get('/stats', getStats);

module.exports = router;
