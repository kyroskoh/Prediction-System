const jwt = require('jsonwebtoken');
const config = require('../config');

class JWTUtils {
  // Generate access token
  static generateAccessToken(payload) {
    return jwt.sign(payload, config.JWT_SECRET, {
      expiresIn: config.JWT_EXPIRES_IN,
      issuer: 'prediction-system',
      audience: 'prediction-api'
    });
  }

  // Generate refresh token
  static generateRefreshToken(payload) {
    return jwt.sign(payload, config.JWT_SECRET, {
      expiresIn: config.JWT_REFRESH_EXPIRES_IN,
      issuer: 'prediction-system',
      audience: 'prediction-api'
    });
  }

  // Verify token
  static verifyToken(token) {
    try {
      return jwt.verify(token, config.JWT_SECRET, {
        issuer: 'prediction-system',
        audience: 'prediction-api'
      });
    } catch (error) {
      throw new Error('Invalid or expired token');
    }
  }

  // Generate both access and refresh tokens
  static generateTokenPair(user) {
    const payload = {
      userId: user._id,
      username: user.username,
      role: user.role
    };

    return {
      accessToken: this.generateAccessToken(payload),
      refreshToken: this.generateRefreshToken(payload)
    };
  }

  // Extract token from Bearer header
  static extractTokenFromHeader(authHeader) {
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return null;
    }
    return authHeader.substring(7);
  }

  // Decode token without verification (for debugging)
  static decodeToken(token) {
    return jwt.decode(token);
  }
}

module.exports = JWTUtils;