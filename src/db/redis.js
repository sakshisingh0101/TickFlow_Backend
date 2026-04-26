import { createClient } from "redis";
import dotenv from "dotenv"
dotenv.config();

const redisClient = createClient({
  url: process.env.UPSTASH_REDIS_URL
});

redisClient.on("error", (err) => {
  console.error("Redis Error:", err.message);
});

export const connectRedis = async () => {
  try {
    await redisClient.connect();
    console.log("Redis Connected");
  } catch (error) {
    console.error("Redis Connection Failed:", error.message);
    process.exit(1);
  }
};

export default redisClient;