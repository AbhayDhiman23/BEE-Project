const jwt = require('jsonwebtoken');
const User = require('../models/User');

const auth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    console.log('=== AUTH MIDDLEWARE DEBUG ===');
    console.log('Token received:', token ? 'YES' : 'NO');
    console.log('Token length:', token?.length);
    console.log('JWT_SECRET exists:', !!process.env.JWT_SECRET);
    
    if (!token) {
      console.log('No token provided');
      return res.status(401).json({ error: 'No token, authorization denied' });
    }

    const secretKey = process.env.JWT_SECRET || 'fallback-secret-key';
    console.log('Using secret key:', secretKey);
    
    const decoded = jwt.verify(token, secretKey);
    console.log('Token decoded successfully:', decoded);
    
    const user = await User.findById(decoded.userId).select('-password');
    console.log('User found:', !!user);
    
    if (!user) {
      console.log('User not found in database');
      return res.status(401).json({ error: 'User not found' });
    }

    req.user = user;
    console.log('Auth successful for user:', user.username);
    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    console.error('Error type:', error.name);
    console.error('Error message:', error.message);
    res.status(401).json({ error: 'Token is not valid' });
  }
};

// Optional auth - doesn't fail if no token provided
const optionalAuth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (token) {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret-key');
      const user = await User.findById(decoded.userId).select('-password');
      req.user = user;
    }
    
    next();
  } catch (error) {
    // Continue without auth if token is invalid
    next();
  }
};

module.exports = { auth, optionalAuth };