const User = require('../models/User');
const { generateToken } = require('../utils/generateToken');
const { sendSuccess, sendError } = require('../utils/response');

// ─── @desc    Register a new user
// ─── @route   POST /api/v1/auth/register
// ─── @access  Public
const register = async (req, res, next) => {
  try {
    const { name, email, password, role } = req.body;

    // Check if email is already registered
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return sendError(res, 'An account with this email already exists.', 409);
    }

    // Create user (password hashed via pre-save hook in model)
    const user = await User.create({ name, email, password, role });

    const token = generateToken(user._id);

    return sendSuccess(
      res,
      'Account registered successfully.',
      {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
        },
        token,
      },
      201
    );
  } catch (error) {
    next(error);
  }
};

// ─── @desc    Authenticate user & return token
// ─── @route   POST /api/v1/auth/login
// ─── @access  Public
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Explicitly select password (it's excluded by default via `select: false`)
    const user = await User.findOne({ email }).select('+password');

    if (!user) {
      return sendError(res, 'Invalid email or password.', 401);
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return sendError(res, 'Invalid email or password.', 401);
    }

    const token = generateToken(user._id);

    return sendSuccess(res, 'Logged in successfully.', {
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
      token,
    });
  } catch (error) {
    next(error);
  }
};

// ─── @desc    Get current authenticated user profile
// ─── @route   GET /api/v1/auth/me
// ─── @access  Private
const getMe = async (req, res, next) => {
  try {
    // req.user is attached by the protect middleware
    return sendSuccess(res, 'Profile fetched successfully.', {
      user: {
        id: req.user._id,
        name: req.user.name,
        email: req.user.email,
        role: req.user.role,
        createdAt: req.user.createdAt,
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { register, login, getMe };
