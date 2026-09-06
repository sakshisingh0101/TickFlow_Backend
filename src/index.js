import dotenv from "dotenv";
dotenv.config();

import {app}from "./app.js";
import { connectPostgres } from "./db/postgres.js";
import { connectRedis } from "./db/redis.js";

const PORT = process.env.PORT || 8000;

const startServer = async () => {
  try {
    await connectPostgres();
    await connectRedis();

    const server = app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });

    server.on("error", (error) => {
      console.error("HTTP Server Error:", error.message);
      process.exit(1);
    });

  } catch (error) {
    console.error("Server startup failed:", error.message);
    process.exit(1);
  }
};

process.on("unhandledRejection", (reason) => {
  console.error("Unhandled Rejection:", reason);
});

process.on("uncaughtException", (error) => {
  console.error("Uncaught Exception:", error);
});

startServer();
