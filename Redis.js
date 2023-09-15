const { createClient } = require('redis');
require('dotenv').config();

// Validate environment variables
if (!process.env.REDIS_PASSWORD || !process.env.REDIS_HOST || !process.env.REDIS_PORT) {
  throw new Error('Please provide all required Redis environment variables.');
}

const client = createClient({
  password: process.env.REDIS_PASSWORD,
  socket: {
    host: process.env.REDIS_HOST,
    port: process.env.REDIS_PORT,
  },
});

// Handle Redis client errors
client.on('error', (err) => {
  console.error('Redis client error:', err);
});

module.exports = client;
