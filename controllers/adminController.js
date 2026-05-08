const User = require('../models/User');
const Task = require('../models/Task');
const { sendSuccess, sendError } = require('../utils/response');

// ─── @desc    Get all users with their task counts
// ─── @route   GET /api/v1/admin/users
// ─── @access  Private / Admin only
const getAllUsers = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, role } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Build filter
    const filter = {};
    if (role && ['user', 'admin'].includes(role)) {
      filter.role = role;
    }

    // Fetch users (paginated)
    const [users, total] = await Promise.all([
      User.find(filter)
        .select('-password')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      User.countDocuments(filter),
    ]);

    // Attach task counts per user using aggregation
    const taskCounts = await Task.aggregate([
      {
        $group: {
          _id: '$createdBy',
          total:     { $sum: 1 },
          pending:   { $sum: { $cond: [{ $eq: ['$status', 'pending'] },    1, 0] } },
          inProgress:{ $sum: { $cond: [{ $eq: ['$status', 'in-progress'] },1, 0] } },
          completed: { $sum: { $cond: [{ $eq: ['$status', 'completed'] },  1, 0] } },
        },
      },
    ]);

    // Map counts by userId for O(1) lookup
    const countMap = {};
    taskCounts.forEach((c) => {
      countMap[c._id.toString()] = {
        total:      c.total,
        pending:    c.pending,
        inProgress: c.inProgress,
        completed:  c.completed,
      };
    });

    // Merge users + task counts
    const enrichedUsers = users.map((u) => ({
      _id:       u._id,
      name:      u.name,
      email:     u.email,
      role:      u.role,
      createdAt: u.createdAt,
      tasks: countMap[u._id.toString()] || {
        total: 0, pending: 0, inProgress: 0, completed: 0,
      },
    }));

    return sendSuccess(res, 'Users fetched successfully.', {
      users: enrichedUsers,
      pagination: {
        total,
        page:  parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    next(error);
  }
};

// ─── @desc    Get platform-wide stats
// ─── @route   GET /api/v1/admin/stats
// ─── @access  Private / Admin only
const getStats = async (req, res, next) => {
  try {
    const [totalUsers, totalTasks, tasksByStatus] = await Promise.all([
      User.countDocuments(),
      Task.countDocuments(),
      Task.aggregate([
        { $group: { _id: '$status', count: { $sum: 1 } } },
      ]),
    ]);

    const statusMap = { pending: 0, 'in-progress': 0, completed: 0 };
    tasksByStatus.forEach((s) => { statusMap[s._id] = s.count; });

    return sendSuccess(res, 'Platform stats fetched successfully.', {
      stats: {
        totalUsers,
        totalTasks,
        tasksByStatus: statusMap,
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { getAllUsers, getStats };
