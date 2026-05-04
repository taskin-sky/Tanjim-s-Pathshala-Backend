import jwt from 'jsonwebtoken';
import Owner from '../models/Owner.js';
import Student from '../models/Student.js';

// Protect Owner routes (supports both cookies and headers)
export const protectOwner = async (req, res, next) => {
  let token;

  // 1. Check cookie first
  if (req.cookies && req.cookies['owner-token']) {
    token = req.cookies['owner-token'];
  }

  // 2. Check Authorization header as fallback
  if (
    !token &&
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Not authorized, no token',
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Check if it's owner
    req.user = await Owner.findById(decoded.id).select('-password');

    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized, owner not found',
      });
    }

    req.userRole = 'owner';
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Not authorized, token failed',
    });
  }
};

// Protect Student routes (supports both cookies and headers)
export const protectStudent = async (req, res, next) => {
  let token;

  // 1. Check cookie first
  if (req.cookies && req.cookies['student-token']) {
    token = req.cookies['student-token'];
  }

  // 2. Check Authorization header as fallback
  if (
    !token &&
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Not authorized, no token',
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Check if it's student
    req.user = await Student.findById(decoded.id).select('-passkey');

    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized, student not found',
      });
    }

    // Check if student is active
    if (!req.user.isActive) {
      return res.status(403).json({
        success: false,
        message: 'Account is deactivated. Please contact owner.',
      });
    }

    req.userRole = 'student';
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Not authorized, token failed',
    });
  }
};

// Both owner and student can access (supports both cookies and headers)
export const protectBoth = async (req, res, next) => {
  let token;

  // 1. Check cookies first
  if (req.cookies && req.cookies['owner-token']) {
    token = req.cookies['owner-token'];
  }
  if (!token && req.cookies && req.cookies['student-token']) {
    token = req.cookies['student-token'];
  }

  // 2. Check Authorization header as fallback
  if (
    !token &&
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Not authorized, no token',
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Try to find as owner first
    let user = await Owner.findById(decoded.id).select('-password');
    let role = 'owner';

    // If not owner, try as student
    if (!user) {
      user = await Student.findById(decoded.id).select('-passkey');
      role = 'student';

      // Check if student is active
      if (user && !user.isActive) {
        return res.status(403).json({
          success: false,
          message: 'Account is deactivated',
        });
      }
    }

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized',
      });
    }

    req.user = user;
    req.userRole = role;
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Not authorized, token failed',
    });
  }
};
