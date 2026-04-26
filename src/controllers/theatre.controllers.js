import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import pool from "../db/postgres.js";

const getAllTheatres = asyncHandler(async (req, res) => {
    const { rows } = await pool.query(
        `SELECT *
         FROM theatres
         ORDER BY theatre_name ASC`
    );

    return res.status(200).json(
        new ApiResponse(
            200,
            "Theatres fetched successfully",
            rows
        )
    );
});

const getTheatreById = asyncHandler(async (req, res) => {
    const { theatreId } = req.params;

    const { rows } = await pool.query(
        `SELECT *
         FROM theatres
         WHERE id = $1`,
        [theatreId]
    );

    if (rows.length === 0) {
        throw new ApiError(
            404,
            "Theatre not found"
        );
    }

    return res.status(200).json(
        new ApiResponse(
            200,
            "Theatre fetched successfully",
            rows[0]
        )
    );
});

const getTheatresByCity = asyncHandler(async (req, res) => {
    const { city } = req.query;

    const { rows } = await pool.query(
        `SELECT *
         FROM theatres
         WHERE LOWER(city)=LOWER($1)
         ORDER BY theatre_name ASC`,
        [city]
    );

    return res.status(200).json(
        new ApiResponse(
            200,
            "Theatres fetched successfully",
            rows
        )
    );
});

export {
    getAllTheatres,
    getTheatreById,
    getTheatresByCity
};