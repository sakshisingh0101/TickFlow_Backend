import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import pool from "../db/postgres.js";
import redisClient from "../db/redis.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import sendEmail from "../utils/sendEmail.js";

const generateTokens = (user, sessionId) => {
  const accessToken = jwt.sign(
    {
      id: user.id,
      email: user.email,
      role: user.role
    },
    process.env.ACCESS_TOKEN_SECRET,
    { expiresIn: "10d" }
  );

  const refreshToken = jwt.sign(
    {
      id: user.id,
      sessionId: sessionId
    },
    process.env.REFRESH_TOKEN_SECRET,
    { expiresIn: "10d" }
  );

  return { accessToken, refreshToken };
};
const registerUser = asyncHandler(async (req, res) => {
    const { userName, email, password } = req.body;

    if (!userName?.trim() || !email?.trim() || !password?.trim()) {
        throw new ApiError(400, "All fields are required");
    }

    const normalizedEmail = email.trim().toLowerCase();

    if (!normalizedEmail.includes("@")) {
        throw new ApiError(400, "Please enter a valid email");
    }

    if (password.length < 6) {
        throw new ApiError(400, "Password must be at least 6 characters");
    }

    const { rows } = await pool.query(
        "SELECT id, is_verified FROM users WHERE email = $1",
        [normalizedEmail]
    );

    const hashedPassword = await bcrypt.hash(password, 10);

    let createdUser;

    if (rows.length > 0) {
        if (rows[0].is_verified) {
            throw new ApiError(409, "User with email already exists");
        }

        const result = await pool.query(
            `UPDATE users
             SET username = $1, password_hash = $2
             WHERE email = $3
             RETURNING id, username, email`,
            [userName.trim(), hashedPassword, normalizedEmail]
        );

        if (result.rows.length === 0) {
            throw new ApiError(500, "Failed to update user");
        }

        createdUser = result.rows;
    } else {
        const result = await pool.query(
            `INSERT INTO users (username, email, password_hash, is_verified, role)
             VALUES ($1, $2, $3, false, 'user')
             RETURNING id, username, email`,
            [userName.trim(), normalizedEmail, hashedPassword]
        );

        if (result.rows.length === 0) {
            throw new ApiError(500, "Failed to create user");
        }

        createdUser = result.rows;
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    try {
        await redisClient.set(`otp:${normalizedEmail}`, otp, {
            EX: 300
        });
    } catch (error) {
        throw new ApiError(500, "Failed to generate OTP");
    }
    const sendingEmail = await sendEmail(normalizedEmail , "Verify Your Email" , 
      `<div style="font-family:Arial;padding:20px">
        <h2>Email Verification</h2>
        <p>Your OTP is:</p>
        <h1>${otp}</h1>
        <p>This OTP expires in 5 minutes.</p>
      </div>
      `)
    if(!sendingEmail?.messageId)
    {
      throw new ApiError(500,"Failed to send OTP email");
    }
    console.log(`OTP for ${normalizedEmail}: ${otp}`);

    return res.status(200).json(
        new ApiResponse(
            200,
            "OTP sent successfully. Please verify your email.",
            createdUser[0]
        )
    );
});



const verifyEmail = asyncHandler(async (req, res) => {
  const { email, otp } = req.body || {};

   if (!email?.trim() || !otp?.trim()) {
      throw new ApiError(400,"Email and OTP are required");
   }
  const normalizedEmail = email.trim().toLowerCase();

  let savedOtp;

  try {
    savedOtp = await redisClient.get(`otp:${normalizedEmail}`);
  } catch (error) {
    throw new ApiError(500, "Failed to verify OTP");
  }

  if (!savedOtp) {
    throw new ApiError(400, "OTP expired or not found");
  }

  if (savedOtp !== otp.trim()) {
    throw new ApiError(400, "Invalid OTP");
  }

  const result = await pool.query(
    `UPDATE users
     SET is_verified = true
     WHERE email = $1 and is_verified = false
     RETURNING id, username, email, role, is_verified`,
    [normalizedEmail]
  );

  if (result.rows.length === 0) {
    throw new ApiError(404, "User not found");
  }

  try {
    const  redisResult=await redisClient.del(`otp:${normalizedEmail}`);
    console.log("Redis delete result:", redisResult);
  } catch (error) {
    console.error("Failed to delete OTP:", error);
  }
const user = result.rows[0];
const userAgent = req.headers["user-agent"] || "Unknown";

  const option =
  process.env.NODE_ENV === "production"
    ? {
        httpOnly: true,
        secure: true,
        sameSite: "None",
      }
    : {
        httpOnly: true,
        secure: false,
        sameSite: "Lax",
      };
 const session = await pool.query(
`INSERT INTO refresh_tokens(user_id, device_info, expires_at)
 VALUES($1,$2,NOW()+INTERVAL '10 days')
 RETURNING id`,
[user.id, userAgent]
)

const sessionId = session.rows[0].id;

const {accessToken, refreshToken} = generateTokens(user, sessionId);

const tokenResult = await pool.query(
`UPDATE refresh_tokens
 SET token_hash=$1
 WHERE id=$2 RETURNING *`,
[await bcrypt.hash(refreshToken,10), sessionId]
)
   if(tokenResult.rows.length==0)
   {
    throw new ApiError(500,"Failed to store refresh Token");
   }

  return res.status(200)
  .cookie("accessToken",accessToken,option)
  .cookie("refreshToken",refreshToken,option)
  .json(
    new ApiResponse(
      200,
      "Email verified successfully",
      result.rows[0]
    )
  );
});

const loginUser = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email?.trim() || !password?.trim()) {
    throw new ApiError(400, "Both email and password are required");
  }

  const normalizedEmail = email.trim().toLowerCase();

  if (!normalizedEmail.includes("@")) {
    throw new ApiError(400, "Please enter valid email");
  }

  const { rows } = await pool.query(
    "SELECT * FROM users WHERE email = $1",
    [normalizedEmail]
  );

  if (rows.length === 0) {
    throw new ApiError(404, "User not found");
  }

  const existingUser = rows[0];

  const isPasswordCorrect = await bcrypt.compare(
    password,
    existingUser.password_hash
  );

  if (!isPasswordCorrect) {
    throw new ApiError(401, "Invalid password");
  }

  if (!existingUser.is_verified) {
    throw new ApiError(403, "Please verify email first");
  }

  const sessionResult = await pool.query(
    `INSERT INTO refresh_tokens
    (user_id, device_info, expires_at)
    VALUES ($1,$2,NOW() + INTERVAL '10 days')
    RETURNING id`,
    [
      existingUser.id,
      req.headers["user-agent"] || "unknown"
    ]
  );

  if (sessionResult.rows.length === 0) {
    throw new ApiError(500, "Failed to create session");
  }

  const sessionId = sessionResult.rows[0].id;

  const { accessToken, refreshToken } =
    generateTokens(existingUser, sessionId);

  const tokenResult = await pool.query(
    `UPDATE refresh_tokens
     SET token_hash = $1
     WHERE id = $2
     RETURNING *`,
    [
      await bcrypt.hash(refreshToken, 10),
      sessionId
    ]
  );

  if(tokenResult.rows.length ===0)
  {
    throw new ApiError(500,"Failed to store refresh token");
  }
  const option =
    process.env.NODE_ENV === "production"
      ? {
          httpOnly: true,
          secure: true,
          sameSite: "None"
        }
      : {
          httpOnly: true,
          secure: false,
          sameSite: "Lax"
        };

  return res
    .status(200)
    .cookie("accessToken", accessToken, option)
    .cookie("refreshToken", refreshToken, option)
    .json(
      new ApiResponse(
        200,
        "Login successful",
        {
          id: existingUser.id,
          username: existingUser.username,
          email: existingUser.email,
          role: existingUser.role
        }
      )
    );
});

const logOutUser = asyncHandler(async(req,res)=>{
   const user = req.user;
   const sessionId = req.sessionId;
   const result = await pool.query("SELECT * FROM refresh_tokens  WHERE id = $1 AND user_id = $2 " , [sessionId, user.id]);
    if(result.rows.length==0)    {
        throw new ApiError(404,"Session not found");
    }
    const revoke =  await pool.query(
     `UPDATE refresh_tokens
      SET revoked_at = NOW()
      WHERE id = $1 
    RETURNING *`,
      [sessionId]
   );

   res
   .clearCookie("accessToken")
   .clearCookie("refreshToken")
   .status(200)
   .json(new ApiResponse(200,"Logged out successfully",revoke.rows[0]));

})

const refreshAccessTokens = asyncHandler(async (req, res) => {
  const user_id = req.user.id;
  const sessionId = req.sessionId;

  const result = await pool.query(
    `UPDATE refresh_tokens
     SET revoked_at = NOW()
     WHERE id = $1
     AND user_id = $2
     AND revoked_at IS NULL
     AND expires_at > NOW()
     RETURNING *`,
    [sessionId, user_id]
  );

  if (result.rows.length === 0) {
    throw new ApiError(
      401,
      "Refresh token expired, revoked, or invalid. Please login again."
    );
  }

  const newrowassign = await pool.query(
    `INSERT INTO refresh_tokens
     (user_id, device_info, expires_at)
     VALUES ($1,$2,NOW() + INTERVAL '10 days')
     RETURNING *`,
    [
      user_id,
      req.headers["user-agent"] || "unknown"
    ]
  );

  if (newrowassign.rows.length === 0) {
    throw new ApiError(500, "Failed to create new session");
  }

  const newSessionId = newrowassign.rows[0].id;

  const { accessToken, refreshToken } =
    generateTokens(req.user, newSessionId);

  const tokenResult = await pool.query(
    `UPDATE refresh_tokens
     SET token_hash = $1
     WHERE id = $2
     RETURNING *`,
    [
      await bcrypt.hash(refreshToken, 10),
      newSessionId
    ]
  );

  if (tokenResult.rows.length === 0) {
    throw new ApiError(500, "Failed to store refresh token");
  }

  const option =
    process.env.NODE_ENV === "production"
      ? {
          httpOnly: true,
          secure: true,
          sameSite: "None"
        }
      : {
          httpOnly: true,
          secure: false,
          sameSite: "Lax"
        };

  return res
    .status(200)
    .cookie("accessToken", accessToken, option)
    .cookie("refreshToken", refreshToken, option)
    .json(
      new ApiResponse(
        200,
        "Tokens refreshed successfully",
        { id: user_id }
      )
    );
});

export { registerUser,verifyEmail  , loginUser, logOutUser , refreshAccessTokens};
