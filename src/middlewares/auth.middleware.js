import jwt from "jsonwebtoken";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import pool from "../db/postgres.js";
import bcrypt from "bcrypt";
import dotenv from "dotenv";
dotenv.config();
export const verifyJwtAccessToken = asyncHandler(async (req, res, next) => {
    try {  
       
        let token = req.cookies?.accessToken;

       
        if (!token) {
            const tokenHeader = req.headers.authorization;
            if (!tokenHeader || !tokenHeader.startsWith("Bearer ")) {
                throw new ApiError(401, "Authorization token is missing");
            }
            token = tokenHeader.replace("Bearer ", "").trim();
        }

        
        const decodedInfo = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);

       
        const user = await pool.query("SELECT * FROM users WHERE id = $1",[decodedInfo.id]);
        if (!user || user.rows.length === 0) {
            throw new ApiError(401, "User not found");
        }
     
        req.user = user.rows[0];
        next();
    } catch (error) {
        throw new ApiError(401, error?.message || "Invalid Access Token");
    }
});
export const verifyJwtRefreshToken = asyncHandler(async (req, res, next) => {
  const token = req.cookies?.refreshToken;

  if (!token) {
    throw new ApiError(401, "Refresh token is missing");
  }

  let decodedInfo;

  try {
    decodedInfo = jwt.verify(
      token,
      process.env.REFRESH_TOKEN_SECRET
    );
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      throw new ApiError(401, "Refresh token expired. Please login again.");
    }

    throw new ApiError(401, "Invalid refresh token");
  }

  const userResult = await pool.query(
    `SELECT id, username, email, role
     FROM users
     WHERE id = $1`,
    [decodedInfo.id]
  );

  if (userResult.rows.length === 0) {
    throw new ApiError(401, "User not found");
  }

  const sessionResult = await pool.query(
    `SELECT *
     FROM refresh_tokens
     WHERE id = $1
     AND user_id = $2
     AND revoked_at IS NULL
     AND expires_at > NOW()`,
    [decodedInfo.sessionId, decodedInfo.id]
  );

  if (sessionResult.rows.length === 0) {
    throw new ApiError(401, "Session expired or revoked");
  }

  const isMatch = await bcrypt.compare(
    token,
    sessionResult.rows[0].token_hash
  );

  if (!isMatch) {
    throw new ApiError(401, "Refresh token mismatch");
  }

  req.user = userResult.rows[0];
  req.sessionId = decodedInfo.sessionId;
  req.refreshToken = token;

  next();
});