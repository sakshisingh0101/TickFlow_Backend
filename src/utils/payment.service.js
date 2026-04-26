import pool from "../db/postgres.js";
import { razorpay } from "./razorpay.js";
import { ApiError } from "./ApiError.js";

const processRefund = async (bookingId, client = null) => {
    const db = client || pool;

    const paymentResult = await db.query(
        `SELECT *
         FROM payments
         WHERE booking_id = $1
         AND status = 'success'
         ORDER BY created_at DESC
         LIMIT 1`,
        [bookingId]
    );

    if (paymentResult.rows.length === 0) {
        throw new ApiError(
            404,
            "Successful payment not found"
        );
    }

    const payment = paymentResult.rows[0];

    const refund =
        await razorpay.payments.refund(
            payment.provider_payment_id,
            {
                amount: Math.round(
                    Number(payment.amount) * 100
                )
            }
        );

    await db.query(
        `UPDATE payments
         SET status = 'refunded',
             refunded_at = NOW(),
             updated_at = NOW(),
             gateway_signature = $2
         WHERE id = $1`,
        [
            payment.id,
            refund.id
        ]
    );

    return refund;
};

export { processRefund };