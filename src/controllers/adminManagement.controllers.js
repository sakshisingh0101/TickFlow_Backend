// admin.management.controller.js

import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import pool from "../db/postgres.js";

const getAllUsers = asyncHandler(async (req, res) => {
    const { rows } = await pool.query(
        `SELECT
            id,
            username,
            email,
            role,
            is_verified,
            created_at
         FROM users
         ORDER BY created_at DESC`
    );

    return res.status(200).json(
        new ApiResponse(
            200,
            "Users fetched",
            rows
        )
    );
});

const blockUser = asyncHandler(async (req, res) => {
    const { userId } = req.params;

    const { rows } = await pool.query(
        `UPDATE users
         SET role='blocked'
         WHERE id=$1
         RETURNING *`,
        [userId]
    );

    if (rows.length === 0) {
        throw new ApiError(
            404,
            "User not found"
        );
    }

    return res.status(200).json(
        new ApiResponse(
            200,
            "User blocked",
            rows[0]
        )
    );
});

const unblockUser = asyncHandler(async (req, res) => {
    const { userId } = req.params;

    const { rows } = await pool.query(
        `UPDATE users
         SET role='user'
         WHERE id=$1
         RETURNING *`,
        [userId]
    );

    if (rows.length === 0) {
        throw new ApiError(
            404,
            "User not found"
        );
    }

    return res.status(200).json(
        new ApiResponse(
            200,
            "User unblocked",
            rows[0]
        )
    );
});

const cancelShow = asyncHandler(async (req, res) => {
    const { showId } = req.params;

    const { rows } = await pool.query(
        `UPDATE shows
         SET status='cancelled'
         WHERE id=$1
         RETURNING *`,
        [showId]
    );

    if (rows.length === 0) {
        throw new ApiError(
            404,
            "Show not found"
        );
    }

    return res.status(200).json(
        new ApiResponse(
            200,
            "Show cancelled",
            rows[0]
        )
    );
});

const markShowCompleted =
    asyncHandler(
        async (req, res) => {
            const { showId } =
                req.params;

            const { rows } =
                await pool.query(
                    `UPDATE shows
                 SET status='completed'
                 WHERE id=$1
                 RETURNING *`,
                    [showId]
                );

            if (
                rows.length === 0
            ) {
                throw new ApiError(
                    404,
                    "Show not found"
                );
            }

            return res
                .status(200)
                .json(
                    new ApiResponse(
                        200,
                        "Show completed",
                        rows[0]
                    )
                );
        }
    );

export {
    getAllUsers,
    blockUser,
    unblockUser,
    cancelShow,
    markShowCompleted
};