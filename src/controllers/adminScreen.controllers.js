import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import pool from "../db/postgres.js";
import { ApiResponse } from "../utils/ApiResponse.js";

const addScreen = asyncHandler(async (req, res) => {
    const { theatre_id, screen_name, total_rows, total_columns } = req.body;

    if (
        !theatre_id ||
        !screen_name?.trim() ||
        !total_rows ||
        !total_columns
    ) {
        throw new ApiError(400, "All fields are required");
    }

    const theatre = await pool.query(
        "SELECT * FROM theatres WHERE id = $1",
        [theatre_id]
    );

    if (theatre.rows.length === 0) {
        throw new ApiError(404, "Theatre not found");
    }

    const { rows } = await pool.query(
        `INSERT INTO screens
        (theatre_id, screen_name, total_rows, total_columns)
        VALUES ($1,$2,$3,$4)
        RETURNING *`,
        [theatre_id, screen_name, total_rows, total_columns]
    );

    res.status(201).json(
        new ApiResponse(201, "Screen added successfully", rows[0])
    );
});

const updateScreen = asyncHandler(async (req, res) => {
    const { screenId } = req.params;

    if (!screenId || isNaN(Number(screenId))) {
        throw new ApiError(400, "Invalid screen ID");
    }

    const existing = await pool.query(
        "SELECT * FROM screens WHERE id = $1",
        [screenId]
    );

    if (existing.rows.length === 0) {
        throw new ApiError(404, "Screen not found");
    }

    const {
        screen_name,
        total_rows,
        total_columns
    } = req.body;

    const old = existing.rows[0];

    const updatedName =
        screen_name?.trim() || old.screen_name;

    const updatedRows =
        total_rows || old.total_rows;

    const updatedColumns =
        total_columns || old.total_columns;

    const { rows } = await pool.query(
        `UPDATE screens
         SET screen_name=$1,
             total_rows=$2,
             total_columns=$3
         WHERE id=$4
         RETURNING *`,
        [
            updatedName,
            updatedRows,
            updatedColumns,
            screenId
        ]
    );

    res.status(200).json(
        new ApiResponse(200, "Screen updated successfully", rows[0])
    );
});

const deleteScreen = asyncHandler(async (req, res) => {
    const { screenId } = req.params;

    if (!screenId || isNaN(Number(screenId))) {
        throw new ApiError(400, "Invalid screen ID");
    }

    const { rows } = await pool.query(
        "DELETE FROM screens WHERE id=$1 RETURNING *",
        [screenId]
    );

    if (rows.length === 0) {
        throw new ApiError(404, "Screen not found");
    }

    res.status(200).json(
        new ApiResponse(200, "Screen deleted successfully", rows[0])
    );
});
export {addScreen,updateScreen,deleteScreen}