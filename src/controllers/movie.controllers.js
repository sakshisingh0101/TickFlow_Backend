import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import pool from "../db/postgres.js";





const getAllMovies = asyncHandler(async(req , res )=>{
    const {rows} = await pool.query("SELECT * FROM movies");
    
    res.status(200).json(new ApiResponse(200,"Movies retrieved successfully" , rows));
})


const getMovieById = asyncHandler(async(req , res )=>{
    const {movieId} = req.params;
   if (!movieId || isNaN(Number(movieId)))
    {
        throw new ApiError(400,"Invalid movie ID");
    }
    const {rows} = await pool.query("SELECT * FROM movies WHERE id = $1" , [movieId]);
    if(rows.length==0)
    {
        throw new ApiError(404,"Movie not found");
    }
    res.status(200).json(new ApiResponse(200,"Movie retrieved successfully" , rows[0]));

})

const searchMovies = asyncHandler(async(req,res)=>{
    const {movie_name} = req.query;
    if(movie_name==undefined || movie_name?.trim()==="")
    {
        throw new ApiError(400,"Movie name is required for searching");
    }
    const {rows} = await pool.query("SELECT * FROM movies WHERE LOWER(title) LIKE LOWER($1)" , [`%${movie_name.toLowerCase()}%`]);
    if(rows.length==0)
    {
        throw new ApiError(404,"No movies found");
    }
    res.status(200).json(new ApiResponse(200,"Movies retrieved successfully" , rows));
})
const filterMovies = asyncHandler(async (req, res) => {
    const {
        genre,
        language,
        search
    } = req.query;

    let query = `
        SELECT *
        FROM movies
        WHERE 1=1
    `;

    const values = [];
    let index = 1;

    if (genre) {
        query += ` AND LOWER(genre) = LOWER($${index})`;
        values.push(genre);
        index++;
    }

    if (language) {
        query += ` AND LOWER(movie_language) = LOWER($${index})`;
        values.push(language);
        index++;
    }

    if (search) {
        query += ` AND LOWER(title) LIKE LOWER($${index})`;
        values.push(`%${search}%`);
        index++;
    }

    query += ` ORDER BY release_date DESC`;

    const { rows } = await pool.query(query, values);

    return res.status(200).json(
        new ApiResponse(
            200,
            "Movies fetched successfully",
            rows
        )
    );
});


const getTrendingMovies = asyncHandler(async (req, res) => {
    const { rows } = await pool.query(`
        SELECT
            m.id,
            m.title,
            m.genre,
            m.poster_url,
            m.movie_language,
            m.release_date,
            COUNT(sh.id) AS total_shows
        FROM movies m
        JOIN shows sh ON sh.movie_id = m.id
        WHERE sh.status = 'scheduled'
       
        GROUP BY m.id
        ORDER BY total_shows DESC, m.release_date DESC
        LIMIT 10
    `);

    return res.status(200).json(
        new ApiResponse(
            200,
            "Trending movies fetched successfully",
            rows
        )
    );
});


export {getAllMovies , getMovieById , searchMovies , filterMovies , getTrendingMovies}
