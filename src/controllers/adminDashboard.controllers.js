
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import pool from "../db/postgres.js";

const getAdminStats = asyncHandler(async (req, res) => {
    const users = await pool.query(
        `SELECT COUNT(*) FROM users`
    );

    const bookings = await pool.query(
        `SELECT COUNT(*) FROM bookings`
    );

    const movies = await pool.query(
        `SELECT COUNT(*) FROM movies`
    );

    const shows = await pool.query(
        `SELECT COUNT(*) FROM shows`
    );

    return res.status(200).json(
        new ApiResponse(
            200,
            "Admin stats fetched",
            {
                totalUsers:
                    Number(
                        users.rows[0].count
                    ),
                totalBookings:
                    Number(
                        bookings.rows[0]
                            .count
                    ),
                totalMovies:
                    Number(
                        movies.rows[0].count
                    ),
                totalShows:
                    Number(
                        shows.rows[0].count
                    )
            }
        )
    );
});

const getRevenueStats = asyncHandler(async (req, res) => {
    const revenue = await pool.query(
        `SELECT
            COALESCE(
                SUM(amount),0
            ) AS total
         FROM payments
         WHERE status='success'`
    );

    const refunds = await pool.query(
        `SELECT
            COUNT(*) AS total
         FROM payments
         WHERE status='refunded'`
    );

    return res.status(200).json(
        new ApiResponse(
            200,
            "Revenue stats fetched",
            {
                totalRevenue:
                    revenue.rows[0]
                        .total,
                totalRefunds:
                    Number(
                        refunds.rows[0]
                            .total
                    )
            }
        )
    );
});

const getOccupancyStats = asyncHandler(async (req, res) => {
    const booked = await pool.query(
        `SELECT COUNT(*) FROM booking_seats`
    );

    const seats = await pool.query(
        `SELECT COUNT(*) FROM seats`
    );

    const bookedCount =
        Number(
            booked.rows[0].count
        );

    const totalSeats =
        Number(
            seats.rows[0].count
        );

    const occupancy =
        totalSeats === 0
            ? 0
            : (
                (bookedCount /
                    totalSeats) *
                100
            ).toFixed(2);

    return res.status(200).json(
        new ApiResponse(
            200,
            "Occupancy stats fetched",
            {
                bookedSeats:
                    bookedCount,
                totalSeats:
                    totalSeats,
                occupancyPercent:
                    occupancy
            }
        )
    );
});

export {
    getAdminStats,
    getRevenueStats,
    getOccupancyStats
};