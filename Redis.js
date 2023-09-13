const {Redis}=require('ioredis')

require("dotenv").config();
    const client = new Redis({
        password: process.env.REDIS_PASSWORD,
        socket: {
          host: process.env.REDIS_HOST,
          port: process.env.REDIS_PORT,
        },
      });

module.exports=client 