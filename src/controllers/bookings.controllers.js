import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import pool from "../db/postgres.js";
import { processRefund } from "../utils/payment.service.js";

const createBooking = asyncHandler(async(req , res)=>{
    const userId = req.user.id;

    const { showId, seatIds } = req.body;

    if (!showId || isNaN(Number(showId))) {
        throw new ApiError(400, "Valid showId is required");
    }

    if (!Array.isArray(seatIds) || seatIds.length === 0) {
        throw new ApiError(400, "seatIds array is required");
    }

    const uniqueSeatIds = [...new Set(seatIds)];

    const client = await pool.connect();

    try {
        await client.query("BEGIN");

        await client.query(
            `UPDATE bookings
             SET status = 'expired'
             WHERE status = 'pending'
             AND expires_at < NOW()`
        );

        const showResult = await client.query(
            `SELECT *
             FROM shows
             WHERE id = $1
             AND status = 'scheduled'`,
            [showId]
        );

        if (showResult.rows.length === 0) {
            throw new ApiError(404, "Show not found");
        }

        const show = showResult.rows[0];

        const seatResult = await client.query(
            `SELECT *
             FROM seats
             WHERE id = ANY($1)
             AND screen_id = $2`,
            [
                uniqueSeatIds,
                show.screen_id
            ]
        );

        if (seatResult.rows.length !== uniqueSeatIds.length) {
            throw new ApiError(
                400,
                "Some seats are invalid for this screen"
            );
        }

        const bookedSeats = await client.query(
            `SELECT bs.seat_id
             FROM booking_seats bs
             JOIN bookings b
             ON b.id = bs.booking_id
             WHERE bs.show_id = $1
             AND bs.seat_id = ANY($2)
             AND b.status IN ('pending','confirmed')`,
            [showId, uniqueSeatIds]
        );

        if (bookedSeats.rows.length > 0) {
            throw new ApiError(
                409,
                "Some selected seats are already booked"
            );
        }

        let totalAmount = 0;

        for (const seat of seatResult.rows) {
            totalAmount +=
                Number(show.base_price) +
                Number(seat.base_price);
        }

        const bookingCode =
            "BK" +
            Date.now() +
            Math.floor(Math.random() * 1000);

        const bookingResult = await client.query(
            `INSERT INTO bookings
            (
                user_id,
                show_id,
                booking_code,
                status,
                total_amount,
                expires_at
            )
            VALUES
            (
                $1,$2,$3,'pending',$4,
                NOW() + INTERVAL '5 minutes'
            )
            RETURNING *`,
            [
                userId,
                showId,
                bookingCode,
                totalAmount
            ]
        );

        const booking = bookingResult.rows[0];

        for (const seat of seatResult.rows) {
            const finalPrice =
                Number(show.base_price) +
                Number(seat.base_price);

            await client.query(
                `INSERT INTO booking_seats
                (
                    booking_id,
                    seat_id,
                    show_id,
                    price
                )
                VALUES ($1,$2,$3,$4)`,
                [
                    booking.id,
                    seat.id,
                    showId,
                    finalPrice
                ]
            );
        }

        await client.query("COMMIT");

       return res.status(201).json(
            new ApiResponse(
            201,
            "Booking created successfully. Proceed to payment.",
            {
                bookingId: booking.id,
                totalAmount: booking.total_amount,
                expiresAt: booking.expires_at
            }
            )
    );
    } catch (error) {
        await client.query("ROLLBACK");
        if(error.code === "23505")
        {
           throw new ApiError(409,"Seat already booked");
        }
        throw error;
    } finally {
        client.release();
    }
})

// const confirmBooking = asyncHandler(async (req, res) => {
//     const userId = req.user.id;
//     const { bookingId } = req.params;

//     const { rows } = await pool.query(
//         `UPDATE bookings
//          SET status = 'confirmed'
//          WHERE id = $1
//          AND user_id = $2
//          AND status = 'pending'
//          AND expires_at > NOW()
//          RETURNING *`,
//         [bookingId, userId]
//     );

//     if (rows.length === 0) {
//         throw new ApiError(
//             400,
//             "Booking not found / expired / already processed"
//         );
//     }

//     return res.status(200).json(
//         new ApiResponse(
//             200,
//             "Booking confirmed successfully",
//             rows[0]
//         )
//     );
// });



const cancelBooking = asyncHandler(async (req, res) => {
    const userId = req.user.id;
    const { bookingId } = req.params;

    const client = await pool.connect();

    try {
        await client.query("BEGIN");

        const bookingResult = await client.query(
            `SELECT *
             FROM bookings
             WHERE id = $1
             AND user_id = $2
             FOR UPDATE`,
            [bookingId, userId]
        );

        if (bookingResult.rows.length === 0) {
            throw new ApiError(404, "Booking not found");
        }

        const booking = bookingResult.rows[0];

        if (
            booking.status !== "pending" &&
            booking.status !== "confirmed"
        ) {
            throw new ApiError(
                400,
                "Booking cannot be cancelled"
            );
        }

        let refundDone = false;

        const paidResult = await client.query(
            `SELECT id
             FROM payments
             WHERE booking_id = $1
             AND status = 'success'
             LIMIT 1`,
            [bookingId]
        );

        if (paidResult.rows.length > 0) {
            await processRefund(
                bookingId,
                client
            );
            refundDone = true;
        }

        const updateResult = await client.query(
            `UPDATE bookings
             SET status = 'cancelled'
             WHERE id = $1
             RETURNING *`,
            [bookingId]
        );

        await client.query("COMMIT");

        return res.status(200).json(
            new ApiResponse(
                200,
                refundDone
                    ? "Booking cancelled and refunded"
                    : "Booking cancelled successfully",
                updateResult.rows[0]
            )
        );
    } catch (error) {
        await client.query("ROLLBACK");
        throw error;
    } finally {
        client.release();
    }
});
const getMyBookings = asyncHandler(async (req, res) => {
    const userId = req.user.id;

    const { rows } = await pool.query(
        `SELECT
            b.id,
            b.booking_code,
            b.status,
            b.total_amount,
            b.created_at,
            m.title AS movie_title,
            s.start_time
         FROM bookings b
         JOIN shows s ON s.id=b.show_id
         JOIN movies m ON m.id=s.movie_id
         WHERE b.user_id=$1
         ORDER BY b.created_at DESC`,
        [userId]
    );

    return res.status(200).json(
        new ApiResponse(
            200,
            "Bookings fetched",
            rows
        )
    );
});

const getBookingById = asyncHandler(async (req, res) => {
    const userId = req.user.id;
    const { bookingId } = req.params;

    const bookingResult = await pool.query(
        `SELECT *
         FROM bookings
         WHERE id=$1
         AND user_id=$2`,
        [bookingId, userId]
    );

    if (bookingResult.rows.length === 0) {
        throw new ApiError(404, "Booking not found");
    }

    const seats = await pool.query(
        `SELECT
            s.row_label,
            s.seat_no,
            bs.price
         FROM booking_seats bs
         JOIN seats s
         ON s.id=bs.seat_id
         WHERE bs.booking_id=$1`,
        [bookingId]
    );

    const payment = await pool.query(
        `SELECT *
         FROM payments
         WHERE booking_id=$1
         ORDER BY created_at DESC
         LIMIT 1`,
        [bookingId]
    );

    return res.status(200).json(
        new ApiResponse(
            200,
            "Booking fetched",
            {
                booking:
                    bookingResult.rows[0],
                seats: seats.rows,
                payment:
                    payment.rows[0] || null
            }
        )
    );
});

const getAllBookings = asyncHandler(async (req, res) => {
    const { rows } = await pool.query(`
        SELECT *
        FROM bookings
        ORDER BY created_at DESC
    `);

    return res.status(200).json(
        new ApiResponse(
            200,
            "All bookings fetched",
            rows
        )
    );
});

const expirePendingBookings = asyncHandler(async (req, res) => {
    const { rows } = await pool.query(`
        UPDATE bookings
        SET status='expired'
        WHERE status='pending'
        AND expires_at < NOW()
        RETURNING *
    `);

    await pool.query(`
        UPDATE payments
        SET status='failed',
            failure_reason='Booking expired',
            updated_at=NOW()
        WHERE status='initiated'
        AND booking_id IN (
            SELECT id
            FROM bookings
            WHERE status='expired'
        )
    `);

    return res.status(200).json(
        new ApiResponse(
            200,
            "Expired bookings updated",
            rows
        )
    );
});

export {createBooking , cancelBooking , getMyBookings , getBookingById , getAllBookings , expirePendingBookings }