import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import pool from "../db/postgres.js";

const getDailyBookings =
    asyncHandler(
        async (req, res) => {
            const { rows } =
                await pool.query(
                    `SELECT
                    DATE(created_at) AS day,
                    COUNT(*) AS total
                 FROM bookings
                 GROUP BY day
                 ORDER BY day DESC`
                );

            return res
                .status(200)
                .json(
                    new ApiResponse(
                        200,
                        "Daily bookings fetched",
                        rows
                    )
                );
        }
    );

const getFailedPayments =
    asyncHandler(
        async (req, res) => {
            const { rows } =
                await pool.query(
                    `SELECT *
                 FROM payments
                 WHERE status='failed'
                 ORDER BY created_at DESC`
                );

            return res
                .status(200)
                .json(
                    new ApiResponse(
                        200,
                        "Failed payments fetched",
                        rows
                    )
                );
        }
    );

const getRefundHistory =
    asyncHandler(
        async (req, res) => {
            const { rows } =
                await pool.query(
                    `SELECT *
                 FROM payments
                 WHERE status='refunded'
                 ORDER BY updated_at DESC`
                );

            return res
                .status(200)
                .json(
                    new ApiResponse(
                        200,
                        "Refund history fetched",
                        rows
                    )
                );
        }
    );

export {
    getDailyBookings,
    getFailedPayments,
    getRefundHistory
};