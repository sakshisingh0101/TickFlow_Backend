import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import pool from "../db/postgres.js";
import bcrypt from "bcrypt";



const getProfile = asyncHandler(async (req, res) => {
    const userId = req.user.id;

    const { rows } = await pool.query(
        `SELECT 
            id,
            username,
            email,
            role,
            is_verified,
            created_at,
            updated_at
         FROM users
         WHERE id = $1`,
        [userId]
    );

    if (rows.length === 0) {
        throw new ApiError(404, "User not found");
    }

    return res.status(200).json(
        new ApiResponse(
            200,
            "Profile fetched successfully",
            rows[0]
        )
    );
});



const updateProfile = asyncHandler(async (req, res) => {
    const userId = req.user.id;

    const { username, email } = req.body;

    const existingUser = await pool.query(
        "SELECT * FROM users WHERE id = $1",
        [userId]
    );

    if (existingUser.rows.length === 0) {
        throw new ApiError(404, "User not found");
    }

    const currentUser = existingUser.rows[0];

    const updatedUsername =
        username?.trim() || currentUser.username;

    const updatedEmail =
        email?.trim()?.toLowerCase() || currentUser.email;

    if (!updatedEmail.includes("@")) {
        throw new ApiError(400, "Invalid email");
    }

    if (updatedEmail !== currentUser.email) {
        const emailCheck = await pool.query(
            "SELECT id FROM users WHERE email = $1 AND id != $2",
            [updatedEmail, userId]
        );

        if (emailCheck.rows.length > 0) {
            throw new ApiError(409, "Email already in use");
        }
    }

    const { rows } = await pool.query(
        `UPDATE users
         SET username = $1,
             email = $2,
             updated_at = NOW()
         WHERE id = $3
         RETURNING 
            id,
            username,
            email,
            role,
            is_verified,
            created_at,
            updated_at`,
        [
            updatedUsername,
            updatedEmail,
            userId
        ]
    );

    return res.status(200).json(
        new ApiResponse(
            200,
            "Profile updated successfully",
            rows[0]
        )
    );
});



const changePassword = asyncHandler(async (req, res) => {
    const userId = req.user.id;

    const {
        oldPassword,
        newPassword,
        confirmPassword
    } = req.body;

    if (
        !oldPassword?.trim() ||
        !newPassword?.trim() ||
        !confirmPassword?.trim()
    ) {
        throw new ApiError(
            400,
            "All password fields are required"
        );
    }

    if (newPassword.length < 6) {
        throw new ApiError(
            400,
            "New password must be at least 6 characters"
        );
    }

    if (newPassword !== confirmPassword) {
        throw new ApiError(
            400,
            "Passwords do not match"
        );
    }

    const userResult = await pool.query(
        "SELECT * FROM users WHERE id = $1",
        [userId]
    );

    if (userResult.rows.length === 0) {
        throw new ApiError(404, "User not found");
    }

    const user = userResult.rows[0];

    const isCorrect = await bcrypt.compare(
        oldPassword,
        user.password_hash
    );

    if (!isCorrect) {
        throw new ApiError(
            401,
            "Old password is incorrect"
        );
    }

    const hashedPassword = await bcrypt.hash(
        newPassword,
        10
    );

    const changedUser = await pool.query(
        `UPDATE users
         SET password_hash = $1,
             updated_at = NOW()
         WHERE id = $2 
         RETURNING *`,
        [hashedPassword, userId]
    );

    return res.status(200).json(
        new ApiResponse(
            200,
            "Password changed successfully",
            changedUser.rows[0]
        )
    );
});

export {
    getProfile,
    updateProfile,
    changePassword
};