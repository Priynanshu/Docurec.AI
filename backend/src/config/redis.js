const Redis = require('ioredis');

let redisClient = null;

const connectRedis = () => {
  redisClient = new Redis({
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT) || 6379,
    password: process.env.REDIS_PASSWORD || undefined,
    retryStrategy: (times) => {
      if (times > 3) {
        console.warn('Redis connection failed, running without cache');
        return null;
      }
      return Math.min(times * 200, 1000);
    },
    lazyConnect: true,
  });

  redisClient.on('connect', () => console.log('Redis connected'));
  redisClient.on('error', (err) => console.warn(`Redis error: ${err.message}`));

  redisClient.connect().catch(() => {
    console.warn('Redis unavailable — caching disabled');
  });

  return redisClient;
};

const getRedis = () => redisClient;

const cacheGet = async (key) => {
  try {
    if (!redisClient || redisClient.status !== 'ready') return null;
    const data = await redisClient.get(key);
    return data ? JSON.parse(data) : null;
  } catch { return null; }
};

const cacheSet = async (key, value, ttlSeconds = 3600) => {
  try {
    if (!redisClient || redisClient.status !== 'ready') return;
    await redisClient.setex(key, ttlSeconds, JSON.stringify(value));
  } catch { }
};

const cacheDel = async (key) => {
  try {
    if (!redisClient || redisClient.status !== 'ready') return;
    await redisClient.del(key);
  } catch { }
};

const cacheDelPattern = async (pattern) => {
  try {
    if (!redisClient || redisClient.status !== 'ready') return;
    const keys = await redisClient.keys(pattern);
    if (keys.length > 0) await redisClient.del(...keys);
  } catch { }
};

module.exports = { connectRedis, getRedis, cacheGet, cacheSet, cacheDel, cacheDelPattern };
