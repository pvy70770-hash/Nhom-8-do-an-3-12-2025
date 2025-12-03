// ===================== REDIS CONFIGURATION =====================
// Redis dùng để cache data, session storage, rate limiting, etc.

const redis = require('redis');

// Tạo Redis client
const redisClient = redis.createClient({
  host: process.env.REDIS_HOST || 'localhost',
  port: process.env.REDIS_PORT || 6379,
  password: process.env.REDIS_PASSWORD || undefined,
  retry_strategy: (options) => {
    if (options.error && options.error.code === 'ECONNREFUSED') {
      console.error('❌ Redis connection refused');
      return new Error('Redis server refused connection');
    }
    if (options.total_retry_time > 1000 * 60 * 60) {
      console.error('❌ Redis retry time exhausted');
      return new Error('Redis retry time exhausted');
    }
    if (options.attempt > 10) {
      console.error('❌ Redis max retry attempts reached');
      return undefined;
    }
    // Reconnect after
    return Math.min(options.attempt * 100, 3000);
  }
});

// Event listeners
redisClient.on('connect', () => {
  console.log('🔄 Connecting to Redis...');
});

redisClient.on('ready', () => {
  console.log('✅ Redis connected successfully');
});

redisClient.on('error', (err) => {
  console.error('❌ Redis error:', err.message);
});

redisClient.on('end', () => {
  console.log('🔌 Redis connection closed');
});

// Helper functions
const redisHelpers = {
  // Set cache with expiration (in seconds)
  setCache: async (key, value, expiration = 3600) => {
    try {
      const stringValue = typeof value === 'object' ? JSON.stringify(value) : value;
      await redisClient.setex(key, expiration, stringValue);
      console.log(`✅ Cached: ${key} (expires in ${expiration}s)`);
      return true;
    } catch (error) {
      console.error(`❌ Error caching ${key}:`, error.message);
      return false;
    }
  },

  // Get cache
  getCache: async (key) => {
    try {
      const data = await redisClient.get(key);
      if (!data) return null;
      
      // Try parse JSON, if fails return raw string
      try {
        return JSON.parse(data);
      } catch {
        return data;
      }
    } catch (error) {
      console.error(`❌ Error getting cache ${key}:`, error.message);
      return null;
    }
  },

  // Delete cache
  deleteCache: async (key) => {
    try {
      await redisClient.del(key);
      console.log(`🗑️ Deleted cache: ${key}`);
      return true;
    } catch (error) {
      console.error(`❌ Error deleting cache ${key}:`, error.message);
      return false;
    }
  },

  // Clear all cache
  clearAll: async () => {
    try {
      await redisClient.flushall();
      console.log('🧹 All cache cleared');
      return true;
    } catch (error) {
      console.error('❌ Error clearing cache:', error.message);
      return false;
    }
  },

  // Check if key exists
  exists: async (key) => {
    try {
      const result = await redisClient.exists(key);
      return result === 1;
    } catch (error) {
      console.error(`❌ Error checking existence of ${key}:`, error.message);
      return false;
    }
  }
};

module.exports = {
  redisClient,
  ...redisHelpers
};