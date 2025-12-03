// ===================== JWT CONFIGURATION =====================
// JWT dùng để xác thực và authorization

const jwt = require('jsonwebtoken');

// JWT Config
const JWT_CONFIG = {
  secret: process.env.JWT_SECRET || 'your-super-secret-key-change-this-in-production',
  accessTokenExpiry: process.env.JWT_ACCESS_EXPIRY || '7d',
  refreshTokenExpiry: process.env.JWT_REFRESH_EXPIRY || '30d',
  
  // JWT Options
  options: {
    issuer: process.env.JWT_ISSUER || 'job-portal-api',
    audience: process.env.JWT_AUDIENCE || 'job-portal-users'
  }
};

// Validate JWT secret
if (JWT_CONFIG.secret === 'your-super-secret-key-change-this-in-production' && process.env.NODE_ENV === 'production') {
  console.warn('⚠️ WARNING: Using default JWT secret in production! Please set JWT_SECRET in .env');
}

/**
 * Generate Access Token
 * @param {Object} payload - User data to encode
 * @returns {String} JWT token
 */
const generateAccessToken = (payload) => {
  try {
    const token = jwt.sign(
      payload,
      JWT_CONFIG.secret,
      {
        expiresIn: JWT_CONFIG.accessTokenExpiry,
        issuer: JWT_CONFIG.options.issuer,
        audience: JWT_CONFIG.options.audience
      }
    );
    return token;
  } catch (error) {
    console.error('❌ Error generating access token:', error.message);
    throw new Error('Token generation failed');
  }
};

/**
 * Generate Refresh Token
 * @param {Object} payload - User data to encode
 * @returns {String} JWT refresh token
 */
const generateRefreshToken = (payload) => {
  try {
    const token = jwt.sign(
      payload,
      JWT_CONFIG.secret,
      {
        expiresIn: JWT_CONFIG.refreshTokenExpiry,
        issuer: JWT_CONFIG.options.issuer,
        audience: JWT_CONFIG.options.audience
      }
    );
    return token;
  } catch (error) {
    console.error('❌ Error generating refresh token:', error.message);
    throw new Error('Refresh token generation failed');
  }
};

/**
 * Verify Token
 * @param {String} token - JWT token to verify
 * @returns {Object} Decoded payload
 */
const verifyToken = (token) => {
  try {
    const decoded = jwt.verify(
      token,
      JWT_CONFIG.secret,
      {
        issuer: JWT_CONFIG.options.issuer,
        audience: JWT_CONFIG.options.audience
      }
    );
    return decoded;
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      throw new Error('Token expired');
    } else if (error.name === 'JsonWebTokenError') {
      throw new Error('Invalid token');
    } else {
      throw new Error('Token verification failed');
    }
  }
};

/**
 * Decode Token (without verification)
 * @param {String} token - JWT token to decode
 * @returns {Object} Decoded payload
 */
const decodeToken = (token) => {
  try {
    return jwt.decode(token);
  } catch (error) {
    console.error('❌ Error decoding token:', error.message);
    return null;
  }
};

/**
 * Extract Token from Authorization Header
 * @param {String} authHeader - Authorization header (Bearer token)
 * @returns {String|null} Extracted token or null
 */
const extractToken = (authHeader) => {
  if (!authHeader) return null;
  
  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    return null;
  }
  
  return parts[1];
};

/**
 * Generate Token Pair (Access + Refresh)
 * @param {Object} payload - User data
 * @returns {Object} { accessToken, refreshToken }
 */
const generateTokenPair = (payload) => {
  return {
    accessToken: generateAccessToken(payload),
    refreshToken: generateRefreshToken(payload)
  };
};

module.exports = {
  JWT_CONFIG,
  generateAccessToken,
  generateRefreshToken,
  verifyToken,
  decodeToken,
  extractToken,
  generateTokenPair
};