import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import pool from "../db/postgres.js";

const getAllScreens = asyncHandler(async (req, res) => {
    const { rows } = await pool.query(
        `SELECT *
         FROM screens
         ORDER BY id ASC`
    );

    return res.status(200).json(
        new ApiResponse(
            200,
            "Screens fetched successfully",
            rows
        )
    );
});

const getScreenById = asyncHandler(async (req, res) => {
    const { screenId } = req.params;

    const { rows } = await pool.query(
        `SELECT *
         FROM screens
         WHERE id = $1`,
        [screenId]
    );

    if (rows.length === 0) {
        throw new ApiError(
            404,
            "Screen not found"
        );
    }

    return res.status(200).json(
        new ApiResponse(
            200,
            "Screen fetched successfully",
            rows[0]
        )
    );
});

const getScreensByTheatre = asyncHandler(async (req, res) => {
    const { theatreId } = req.params;

    const { rows } = await pool.query(
        `SELECT *
         FROM screens
         WHERE theatre_id = $1
         ORDER BY id ASC`,
        [theatreId]
    );

    return res.status(200).json(
        new ApiResponse(
            200,
            "Screens fetched successfully",
            rows
        )
    );
});

export {
    getAllScreens,
    getScreenById,
    getScreensByTheatre
};