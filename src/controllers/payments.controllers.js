import crypto from "crypto";
import { razorpay } from "../utils/razorpay.js";
import pool from "../db/postgres.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";



const createPaymentOrder = asyncHandler(async (req, res) => {
    const userId = req.user.id;
    const { bookingId } = req.params;

    if (!bookingId || isNaN(Number(bookingId))) {
        throw new ApiError(400, "Valid bookingId is required");
    }

    const bookingResult = await pool.query(
        `SELECT *
         FROM bookings
         WHERE id = $1
         AND user_id = $2
         AND status = 'pending'
         AND expires_at > NOW()`,
        [bookingId, userId]
    );

    if (bookingResult.rows.length === 0) {
        throw new ApiError(404, "Booking not found or expired");
    }

    const booking = bookingResult.rows[0];

    const amountInPaise = Math.round(Number(booking.total_amount) * 100);

    const order = await razorpay.orders.create({
        amount: amountInPaise,
        currency: "INR",
        receipt: `booking_${booking.id}`
    });

    const paymentResult = await pool.query(
        `INSERT INTO payments
        (
            booking_id,
            provider,
            gateway_order_id,
            amount,
            currency,
            status
        )
        VALUES
        ($1,'razorpay',$2,$3,'INR','initiated')
        RETURNING *`,
        [
            booking.id,
            order.id,
            booking.total_amount
        ]
    );

    return res.status(201).json(
        new ApiResponse(
            201,
            "Payment order created successfully",
            {
                bookingId: booking.id,
                razorpayOrderId: order.id,
                amount: order.amount,
                currency: order.currency,
                key: process.env.RAZORPAY_KEY_ID,
                payment: paymentResult.rows[0]
            }
        )
    );
});

const verifyPayment = asyncHandler(async (req, res) => {
    const userId = req.user.id;

    const {
        bookingId,
        razorpay_order_id,
        razorpay_payment_id,
        razorpay_signature
    } = req.body;

    if (
        !bookingId ||
        !razorpay_order_id ||
        !razorpay_payment_id ||
        !razorpay_signature
    ) {
        throw new ApiError(400, "All payment fields are required");
    }

    const bookingResult = await pool.query(
        `SELECT *
         FROM bookings
         WHERE id = $1
         AND user_id = $2
         AND status = 'pending'
         AND expires_at > NOW()`,
        [bookingId, userId]
    );

    if (bookingResult.rows.length === 0) {
        throw new ApiError(400, "Booking invalid or expired");
    }

    const generatedSignature = crypto
        .createHmac(
            "sha256",
            process.env.RAZORPAY_KEY_SECRET
        )
        .update(
            razorpay_order_id +
            "|" +
            razorpay_payment_id
        )
        .digest("hex");

    if (generatedSignature !== razorpay_signature) {
        await pool.query(
            `UPDATE payments
             SET status = 'failed',
                 failure_reason = 'Signature mismatch',
                 updated_at = NOW()
             WHERE gateway_order_id = $1`,
            [razorpay_order_id]
        );

        throw new ApiError(400, "Invalid payment signature");
    }

    const client = await pool.connect();

    try {
        await client.query("BEGIN");

        await client.query(
            `UPDATE payments
             SET provider_payment_id = $1,
                 gateway_signature = $2,
                 status = 'success',
                 paid_at = NOW(),
                 updated_at = NOW()
             WHERE gateway_order_id = $3`,
            [
                razorpay_payment_id,
                razorpay_signature,
                razorpay_order_id
            ]
        );

        const bookingUpdate = await client.query(
            `UPDATE bookings
             SET status = 'confirmed'
             WHERE id = $1
             RETURNING *`,
            [bookingId]
        );

        await client.query("COMMIT");

        return res.status(200).json(
            new ApiResponse(
                200,
                "Payment verified successfully",
                bookingUpdate.rows[0]
            )
        );
    } catch (error) {
        await client.query("ROLLBACK");
        throw error;
    } finally {
        client.release();
    }
});

const getPaymentStatus = asyncHandler(async (req, res) => {
    const userId = req.user.id;
    const { bookingId } = req.params;

    const result = await pool.query(
        `SELECT p.*
         FROM payments p
         JOIN bookings b
         ON b.id = p.booking_id
         WHERE p.booking_id = $1
         AND b.user_id = $2
         ORDER BY p.created_at DESC
         LIMIT 1`,
        [bookingId, userId]
    );

    if (result.rows.length === 0) {
        throw new ApiError(404, "Payment not found");
    }

    return res.status(200).json(
        new ApiResponse(
            200,
            "Payment status fetched successfully",
            result.rows[0]
        )
    );
});

const refundPayment = asyncHandler(async (req, res) => {
    const { bookingId } = req.params;

    const client = await pool.connect();

    try {
        await client.query("BEGIN");

        const refund = await processRefund(
            bookingId,
            client
        );

        await client.query(
            `UPDATE bookings
             SET status = 'cancelled'
             WHERE id = $1`,
            [bookingId]
        );

        await client.query("COMMIT");

        return res.status(200).json(
            new ApiResponse(
                200,
                "Refund processed successfully",
                refund
            )
        );
    } catch (error) {
        await client.query("ROLLBACK");
        throw error;
    } finally {
        client.release();
    }
});
const webhookHandler = asyncHandler(async (req, res) => {
    return res.status(200).json(
        new ApiResponse(
            200,
            "Webhook received"
        )
    );
});

export {
    createPaymentOrder,
    verifyPayment,
    getPaymentStatus,
    refundPayment,
    webhookHandler
};