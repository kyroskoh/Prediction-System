const JWTUtils = require('../utils/jwt');
const User = require('../models/User');
const Channel = require('../models/Channel');

// Basic authentication middleware
const authenticate = async (req, res, next) => {
  try {
    const token = JWTUtils.extractTokenFromHeader(req.headers.authorization);
    
    if (!token) {
      return res.status(401).json({ 
        error: 'Access denied. No token provided.' 
      });
    }

    const decoded = JWTUtils.verifyToken(token);
    const user = await User.findById(decoded.userId);
    
    if (!user || !user.isActive) {
      return res.status(401).json({ 
        error: 'Access denied. User not found or inactive.' 
      });
    }

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    req.user = user;
    next();
  } catch (error) {
    res.status(401).json({ 
      error: 'Invalid token.' 
    });
  }
};

// Optional authentication - doesn't fail if no token
const optionalAuth = async (req, res, next) => {
  try {
    const token = JWTUtils.extractTokenFromHeader(req.headers.authorization);
    
    if (token) {
      const decoded = JWTUtils.verifyToken(token);
      const user = await User.findById(decoded.userId);
      
      if (user && user.isActive) {
        req.user = user;
      }
    }
    
    next();
  } catch (error) {
    // Continue without authentication
    next();
  }
};

// Role-based authorization
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ 
        error: 'Access denied. Authentication required.' 
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ 
        error: 'Access denied. Insufficient permissions.' 
      });
    }

    next();
  };
};

// Channel-based authorization
const authorizeChannel = (permission = 'read') => {
  return async (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({ 
          error: 'Access denied. Authentication required.' 
        });
      }

      const channelName = req.params.channel;
      if (!channelName) {
        return res.status(400).json({ 
          error: 'Channel parameter is required.' 
        });
      }

      const channel = await Channel.findOne({ name: channelName.toLowerCase() });
      if (!channel) {
        return res.status(404).json({ 
          error: 'Channel not found.' 
        });
      }

      req.channel = channel;

      // Check permissions based on the required permission level
      switch (permission) {
        case 'owner':
          if (!channel.isOwner(req.user._id)) {
            return res.status(403).json({ 
              error: 'Access denied. Owner privileges required.' 
            });
          }
          break;

        case 'admin':
          if (!channel.isOwner(req.user._id) && !channel.isAdmin(req.user._id)) {
            return res.status(403).json({ 
              error: 'Access denied. Admin privileges required.' 
            });
          }
          break;

        case 'moderator':
          if (!channel.hasPermission(req.user._id)) {
            return res.status(403).json({ 
              error: 'Access denied. Moderator privileges required.' 
            });
          }
          break;

        case 'read':
        default:
          // Anyone can read if they have access to the channel
          break;
      }

      next();
    } catch (error) {
      res.status(500).json({ 
        error: 'Authorization check failed.' 
      });
    }
  };
};

// Legacy support for NightBot (username-based auth)
const legacyAuth = async (req, res, next) => {
  try {
    // For backward compatibility with existing NightBot commands
    const username = req.query.username || req.body.username;
    const channelName = req.params.channel;

    if (!username || !channelName) {
      return res.status(400).json({ 
        error: 'Username and channel are required for legacy auth.' 
      });
    }

    // Find or create user for legacy support
    let user = await User.findOne({ username: username.toLowerCase() });
    
    if (!user) {
      // Create a basic user for legacy support
      user = new User({
        username: username.toLowerCase(),
        email: `${username.toLowerCase()}@legacy.temp`,
        password: 'temp-password-' + Math.random().toString(36),
        role: 'user'
      });
      await user.save();
    }

    req.user = user;
    req.isLegacyAuth = true;
    next();
  } catch (error) {
    res.status(500).json({ 
      error: 'Legacy authentication failed.' 
    });
  }
};

module.exports = {
  authenticate,
  optionalAuth,
  authorize,
  authorizeChannel,
  legacyAuth
};