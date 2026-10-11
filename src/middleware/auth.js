import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import Student from '../models/Student.js';

/**
 * Protect routes - Verify JWT token
 */
export const protect = async (req, res, next) => {
  try {
    let token;

    // Check for token in Authorization header
    if (req.headers.authorization?.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    // Check for token in cookies
    if (!token && req.cookies?.token) {
      token = req.cookies.token;
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized to access this route',
      });
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.id).select('-password');

      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'User not found',
        });
      }

      if (!user.isActive) {
        return res.status(401).json({
          success: false,
          message: 'Account is deactivated',
        });
      }

      // Set user in request
      req.user = user;

      // If user is student, fetch and attach student data
      if (user.role === 'student') {
        const student = await Student.findOne({ user: user._id });

        if (student) {
          req.user.studentData = student;
          req.user.studentId = student.studentId;
          req.user.studentObjectId = student._id;
        }
      }

      next();
    } catch (error) {
      if (error.name === 'JsonWebTokenError') {
        return res.status(401).json({
          success: false,
          message: 'Invalid token',
        });
      }
      if (error.name === 'TokenExpiredError') {
        return res.status(401).json({
          success: false,
          message: 'Token expired',
        });
      }
      throw error;
    }
  } catch (error) {
    console.error('Auth middleware error:', error);
    res.status(500).json({
      success: false,
      message: 'Authentication error',
    });
  }
};

/**
 * Role-based authorization
 */
export const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized',
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `User role ${req.user.role} is not authorized to access this route`,
        requiredRoles: roles,
      });
    }
    next();
  };
};

/**
 * Permission-based authorization
 */
export const hasPermission = (permission) => {
  return (req, res, next) => {
    if (!req.user.permissions?.includes(permission)) {
      return res.status(403).json({
        success: false,
        message: `You don't have permission to perform this action`,
        requiredPermission: permission,
      });
    }
    next();
  };
};