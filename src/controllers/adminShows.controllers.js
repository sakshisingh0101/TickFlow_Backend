import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import pool from "../db/postgres.js";
import { ApiResponse } from "../utils/ApiResponse.js";
const addShow = asyncHandler(async (req, res) => {
    const {
        movie_id,
        screen_id,
        start_time,
        end_time,
        base_price
    } = req.body;

    if (
        !movie_id ||
        !screen_id ||
        !start_time ||
        !end_time ||
        !base_price
    ) {
        throw new ApiError(400, "All fields are required");
    }

    const movie = await pool.query(
        "SELECT * FROM movies WHERE id=$1",
        [movie_id]
    );

    if (movie.rows.length === 0) {
        throw new ApiError(404, "Movie not found");
    }

    const screen = await pool.query(
        "SELECT * FROM screens WHERE id=$1",
        [screen_id]
    );

    if (screen.rows.length === 0) {
        throw new ApiError(404, "Screen not found");
    }

    const { rows } = await pool.query(
        `INSERT INTO shows
        (movie_id, screen_id, start_time, end_time, base_price)
        VALUES ($1,$2,$3,$4,$5)
        RETURNING *`,
        [
            movie_id,
            screen_id,
            start_time,
            end_time,
            base_price
        ]
    );

    res.status(201).json(
        new ApiResponse(201, "Show added successfully", rows[0])
    );
});

const updateShow = asyncHandler(async (req, res) => {
    const { showId } = req.params;

    if (!showId || isNaN(Number(showId))) {
        throw new ApiError(400, "Invalid show ID");
    }

    const existing = await pool.query(
        "SELECT * FROM shows WHERE id=$1",
        [showId]
    );

    if (existing.rows.length === 0) {
        throw new ApiError(404, "Show not found");
    }

    const {
        start_time,
        end_time,
        status,
        base_price
    } = req.body;

    const old = existing.rows[0];

    const { rows } = await pool.query(
        `UPDATE shows
         SET start_time=$1,
             end_time=$2,
             status=$3,
             base_price=$4
         WHERE id=$5
         RETURNING *`,
        [
            start_time || old.start_time,
            end_time || old.end_time,
            status || old.status,
            base_price || old.base_price,
            showId
        ]
    );

    res.status(200).json(
        new ApiResponse(200, "Show updated successfully", rows[0])
    );
});

const deleteShow = asyncHandler(async (req, res) => {
    const { showId } = req.params;

    if (!showId || isNaN(Number(showId))) {
        throw new ApiError(400, "Invalid show ID");
    }

    const { rows } = await pool.query(
        "DELETE FROM shows WHERE id=$1 RETURNING *",
        [showId]
    );

    if (rows.length === 0) {
        throw new ApiError(404, "Show not found");
    }

    res.status(200).json(
        new ApiResponse(200, "Show deleted successfully", rows[0])
    );
});


export {addShow , updateShow,deleteShow }