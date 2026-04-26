import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import pool from "../db/postgres.js";
import { ApiResponse } from "../utils/ApiResponse.js";


// const getSeatsByShow = asyncHandler(async (req, res) => {
//     const { showId } = req.params;

//     if (!showId || isNaN(Number(showId))) {
//         throw new ApiError(400, "Invalid show ID");
//     }

//     const { rows } = await pool.query(
//         `SELECT 
//             se.id,
//             se.row_label,
//             se.seat_no,
//             se.seat_type,
//             se.base_price,
//             CASE 
//                 WHEN bs.id IS NOT NULL THEN true
//                 ELSE false
//             END AS is_booked
//          FROM seats se
//          LEFT JOIN booking_seats bs 
//             ON se.id = bs.seat_id AND bs.show_id = $1
//          WHERE se.screen_id = (
//             SELECT screen_id FROM shows WHERE id = $1
//          )
//          ORDER BY se.row_label, se.seat_no`,
//         [showId]
//     );

//     return res.status(200).json(
//         new ApiResponse(200, "Seats fetched successfully", rows)
//     );
// });
const getSeatsByShow = asyncHandler(async (req, res) => {
    const { showId } = req.params;

    if (!showId || isNaN(Number(showId))) {
        throw new ApiError(400, "Invalid show ID");
    }

    const { rows } = await pool.query(
        `
        SELECT 
            se.id,
            se.row_label,
            se.seat_no,
            se.seat_type,
            se.base_price,

            CASE
                WHEN b.id IS NOT NULL THEN true
                ELSE false
            END AS is_booked

        FROM seats se

        LEFT JOIN booking_seats bs
            ON se.id = bs.seat_id
            AND bs.show_id = $1

        LEFT JOIN bookings b
            ON b.id = bs.booking_id
            AND (
                b.status = 'confirmed'
                OR (
                    b.status = 'pending'
                    AND b.expires_at > NOW()
                )
            )

        WHERE se.screen_id = (
            SELECT screen_id
            FROM shows
            WHERE id = $1
        )

        ORDER BY se.row_label, se.seat_no
        `,
        [showId]
    );

    return res.status(200).json(
        new ApiResponse(200, "Seats fetched successfully", rows)
    );
});
const getAvailableSeats = asyncHandler(async (req, res) => {
    const { showId } = req.params;

    if (!showId || isNaN(Number(showId))) {
        throw new ApiError(400, "Valid showId required");
    }

    const showResult = await pool.query(
        `SELECT * FROM shows WHERE id = $1`,
        [showId]
    );

    if (showResult.rows.length === 0) {
        throw new ApiError(404, "Show not found");
    }

    const show = showResult.rows[0];

    const seatResult = await pool.query(
        `SELECT
            id,
            row_label,
            seat_no,
            seat_type,
            base_price
         FROM seats
         WHERE screen_id = $1
         ORDER BY row_label, seat_no`,
        [show.screen_id]
    );

    const bookedResult = await pool.query(
        `SELECT bs.seat_id
         FROM booking_seats bs
         JOIN bookings b
         ON b.id = bs.booking_id
         WHERE bs.show_id = $1
         AND b.status IN ('pending','confirmed')`,
        [showId]
    );

    const bookedSet = new Set(
        bookedResult.rows.map(row => Number(row.seat_id))
    );

    const finalSeats = seatResult.rows.map(seat => ({
        ...seat,
        available: !bookedSet.has(Number(seat.id)),
        final_price:
            Number(seat.base_price) +
            Number(show.base_price)
    }));

    return res.status(200).json(
        new ApiResponse(
            200,
            "Seats fetched successfully",
            finalSeats
        )
    );
});
export { getSeatsByShow , getAvailableSeats };