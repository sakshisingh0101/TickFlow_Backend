import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import pool  from "../db/postgres.js";

const getShowsByMovie = asyncHandler(async (req, res) => {
    const { movieId } = req.params;

    if (!movieId || isNaN(Number(movieId))) {
        throw new ApiError(400, "Invalid movie ID");
    }

    const { rows } = await pool.query(
        `SELECT 
            s.id AS show_id,
            s.start_time,
            s.end_time,
            s.base_price,
            s.status,

            m.id AS movie_id,
            m.title,
            m.genre,
            m.poster_url,
            m.movie_language,
            m.duration_minutes,

            sc.id AS screen_id,
            sc.screen_name,

            t.id AS theatre_id,
            t.theatre_name,
            t.city,
            t.address

         FROM shows s
         JOIN movies m ON s.movie_id = m.id
         JOIN screens sc ON s.screen_id = sc.id
         JOIN theatres t ON sc.theatre_id = t.id
         WHERE s.movie_id = $1
         ORDER BY s.start_time ASC`,
        [movieId]
    );

    return res.status(200).json(
        new ApiResponse(200, "Shows fetched successfully", rows)
    );
});

const getShowById = asyncHandler(async (req, res) => {
    const { showId } = req.params;

    if (!showId || isNaN(Number(showId))) {
        throw new ApiError(400, "Invalid show ID");
    }

    const { rows } = await pool.query(
        `SELECT
            s.id AS show_id,
            s.start_time,
            s.end_time,
            s.base_price,
            s.status,

            m.id AS movie_id,
            m.title,
            m.genre,
            m.poster_url,
            m.movie_language,
            m.duration_minutes,

            sc.id AS screen_id,
            sc.screen_name,
            sc.total_rows,
            sc.total_columns,

            t.id AS theatre_id,
            t.theatre_name,
            t.city,
            t.address

         FROM shows s
         JOIN movies m ON s.movie_id = m.id
         JOIN screens sc ON s.screen_id = sc.id
         JOIN theatres t ON sc.theatre_id = t.id
         WHERE s.id = $1`,
        [showId]
    );

    if (rows.length === 0) {
        throw new ApiError(404, "Show not found");
    }

    return res.status(200).json(
        new ApiResponse(200, "Show fetched successfully", rows[0])
    );
});
const getShowsByCity = asyncHandler(async (req, res) => {
    const { city } = req.params;
    const { date } = req.query;

    if (!city?.trim()) {
        throw new ApiError(400, "City is required");
    }

    let query = `
        SELECT
            sh.id,
            sh.start_time,
            sh.end_time,
            sh.base_price,
            sh.status,

            m.id AS movie_id,
            m.title,
            m.genre,
            m.poster_url,
            m.movie_language,
            m.duration_minutes,

            t.id AS theatre_id,
            t.theatre_name,
            t.city,
            t.address,

            sc.id AS screen_id,
            sc.screen_name

        FROM shows sh
        JOIN movies m ON m.id = sh.movie_id
        JOIN screens sc ON sc.id = sh.screen_id
        JOIN theatres t ON t.id = sc.theatre_id
        WHERE LOWER(t.city) = LOWER($1)
        AND sh.status = 'scheduled'
    `;

    const values = [city];

    if (date) {
        query += ` AND DATE(sh.start_time) = $2`;
        values.push(date);
    }

    query += ` ORDER BY sh.start_time ASC`;

    const { rows } = await pool.query(query, values);

    return res.status(200).json(
        new ApiResponse(
            200,
            "Shows fetched successfully",
            rows
        )
    );
});


const universalSearch = asyncHandler(async (req,res)=>{

   const { query } = req.query;

   if(!query || query.trim()===""){
      throw new ApiError(400,"Search query required");
   }

   const searchValue = `%${query.trim()}%`;

   const { rows } = await pool.query(`SELECT
    sh.id AS show_id,
    sh.start_time,
    sh.end_time,
    sh.base_price,
    sh.status,

    m.id AS movie_id,
    m.title,
    m.genre,
    m.poster_url,
    m.movie_language,
    m.duration_minutes,

    t.id AS theatre_id,
    t.theatre_name,
    t.city,
    t.address,

    sc.id AS screen_id,
    sc.screen_name

FROM shows sh
JOIN movies m ON m.id = sh.movie_id
JOIN screens sc ON sc.id = sh.screen_id
JOIN theatres t ON t.id = sc.theatre_id

WHERE
(
    LOWER(m.title) LIKE LOWER($1)
    OR LOWER(t.city) LIKE LOWER($1)
    OR LOWER(t.theatre_name) LIKE LOWER($1)
)

AND sh.status = 'scheduled'

ORDER BY sh.start_time ASC`,[searchValue]);

   res.status(200).json(
      new ApiResponse(200,"Search results fetched",rows)
   );
});


const getAllShows = asyncHandler(async(req , res )=>{
    const {rows} = await pool.query(`SELECT * FROM shows `)
    res.status(200)
    .json(new ApiResponse(200,"Fetched All shows successfully" , rows));
})

export { getShowsByMovie, getShowById  , getShowsByCity , universalSearch , getAllShows};