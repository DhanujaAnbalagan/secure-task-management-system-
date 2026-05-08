const Task = require('../models/Task');
const { sendSuccess, sendError } = require('../utils/response');

// ─── @desc    Get tasks (admin: all tasks | user: own tasks)
// ─── @route   GET /api/v1/tasks
// ─── @access  Private
const getTasks = async (req, res, next) => {
  try {
    // Build query filter based on role
    const filter = req.user.role === 'admin' ? {} : { createdBy: req.user._id };

    // Optional query parameters for filtering & pagination
    const { status, page = 1, limit = 10 } = req.query;

    if (status) {
      const validStatuses = ['pending', 'in-progress', 'completed'];
      if (!validStatuses.includes(status)) {
        return sendError(res, 'Invalid status filter. Use pending, in-progress, or completed.', 400);
      }
      filter.status = status;
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [tasks, total] = await Promise.all([
      Task.find(filter)
        .populate('createdBy', 'name email role')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      Task.countDocuments(filter),
    ]);

    return sendSuccess(res, 'Tasks fetched successfully.', {
      tasks,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    next(error);
  }
};

// ─── @desc    Create a new task
// ─── @route   POST /api/v1/tasks
// ─── @access  Private
const createTask = async (req, res, next) => {
  try {
    const { title, description, status } = req.body;

    const task = await Task.create({
      title,
      description,
      status,
      createdBy: req.user._id,
    });

    // Populate creator info on response
    await task.populate('createdBy', 'name email role');

    return sendSuccess(res, 'Task created successfully.', { task }, 201);
  } catch (error) {
    next(error);
  }
};

// ─── @desc    Update a task by ID
// ─── @route   PUT /api/v1/tasks/:id
// ─── @access  Private (owner or admin)
const updateTask = async (req, res, next) => {
  try {
    const { id } = req.params;

    let task = await Task.findById(id);

    if (!task) {
      return sendError(res, 'Task not found.', 404);
    }

    // Authorization: only the owner or an admin can update
    if (task.createdBy.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return sendError(res, 'You are not authorized to update this task.', 403);
    }

    const { title, description, status } = req.body;

    // Only update fields that were actually provided
    if (title !== undefined) task.title = title;
    if (description !== undefined) task.description = description;
    if (status !== undefined) task.status = status;

    await task.save();
    await task.populate('createdBy', 'name email role');

    return sendSuccess(res, 'Task updated successfully.', { task });
  } catch (error) {
    next(error);
  }
};

// ─── @desc    Delete a task by ID
// ─── @route   DELETE /api/v1/tasks/:id
// ─── @access  Private (owner or admin)
const deleteTask = async (req, res, next) => {
  try {
    const { id } = req.params;

    const task = await Task.findById(id);

    if (!task) {
      return sendError(res, 'Task not found.', 404);
    }

    // Authorization: only the owner or an admin can delete
    if (task.createdBy.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return sendError(res, 'You are not authorized to delete this task.', 403);
    }

    await task.deleteOne();

    return sendSuccess(res, 'Task deleted successfully.');
  } catch (error) {
    next(error);
  }
};

module.exports = { getTasks, createTask, updateTask, deleteTask };
