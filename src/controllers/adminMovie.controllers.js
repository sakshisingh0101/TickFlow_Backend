import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import pool from "../db/postgres.js";
import {ApiResponse} from "../utils/ApiResponse.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";

const addMovie = asyncHandler(async(req,res)=>{
    const {title ,genre , movie_language ,movie_description , duration , release_date } = req.body;

    if(!title?.trim() || !genre?.trim() || !movie_language?.trim() || !movie_description?.trim() || ! duration || !release_date)
    {
        throw new ApiError(400,"All fields are required");
    }
    if(isNaN(duration))
    {
        throw new ApiError(400,"Duration must be a number");
    }
    if(isNaN(Date.parse(release_date)))
    {
        throw new ApiError(400,"Invalid release date format");
    }

   
    if(!req.file)
    {
        throw new ApiError(400,"Poster is required");
    }
    const posterlocalpath = req.file?.path ;
    const poster_url = await uploadOnCloudinary(posterlocalpath);
    if(!poster_url){
    throw new ApiError(500,"Failed to uplaod poster");
    }

    const {rows} = await pool.query("INSERT INTO movies (title , genre , movie_language ,movie_description , duration , release_date , poster_url) VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *" , [title ,genre , movie_language ,movie_description , duration , release_date , poster_url?.url]);
    if(rows.length==0)
    {
        throw new ApiError(500,"Failed to add movie");
    }
    res.status(201).json(new ApiResponse(201,"Movie added successfully" , rows[0]));



})

const editMovie = asyncHandler(async(req , res)=>{
    const {movieId} = req.params;
    if(!movieId|| isNaN(Number(movieId)))
    {
        throw new ApiError(400,"Invalid movie ID");
    }
    //  id BIGSERIAL PRIMARY KEY,
    // title VARCHAR(255) NOT NULL,
    // genre VARCHAR(255) NOT NULL,
    // duration_minutes INT NOT NULL,
    // release_date DATE NOT NULL,
    // movie_language VARCHAR(255) NOT NULL,
    // movie_description TEXT,
    // poster_url TEXT,
    const {title,genre,duration_minutes, release_date , movie_language , movie_description} = req.body;
    const existingMoive = await pool.query("SELECT * FROM movies WHERE id = $1" , [movieId]);
    if(existingMoive.rows.length==0)
    {
        throw new ApiError(404,"Movie not found");
    }
    const updatedTitle = title?.trim() || existingMoive.rows[0].title;
    const updatedGenre = genre?.trim() || existingMoive.rows[0].genre;
   const updatedDuration =
duration_minutes && !isNaN(duration_minutes)
? duration_minutes
: existingMoive.rows[0].duration_minutes;
    const updatedReleaseDate =
release_date && !isNaN(Date.parse(release_date))
? release_date
: existingMoive.rows[0].release_date;
    const updatedLanguage = movie_language?.trim() || existingMoive.rows[0].movie_language;
    const updatedDescription = movie_description?.trim() || existingMoive.rows[0].movie_description;

    const postlocalurl = req.file?.path;
    let poster_url = existingMoive.rows[0].poster_url;
    if(postlocalurl)
    {
        const uplaodedPoster= await uploadOnCloudinary(postlocalurl);
        if(!uplaodedPoster)
        {
            throw new ApiError(500,"Failed to upload poster");
        }
        poster_url = uplaodedPoster.url;
    }
    const result = await pool.query(`UPDATE movies SET title = $1 , genre = $2 , duration_minutes = $3 , release_date = $4 , movie_language = $5 , movie_description = $6 , poster_url = $7 WHERE id = $8 RETURNING *` , [updatedTitle,updatedGenre,updatedDuration,updatedReleaseDate,updatedLanguage,updatedDescription,poster_url,movieId]);
    if(result.rows.length==0)
    {
        throw new ApiError(500,"Failed to update movie");
    }
    res.status(200).json(new ApiResponse(200,"Movie updated successfully" , result.rows[0]));

    
})
const deleteMovie = asyncHandler(async(req , res)=>{
    const {movieId}=req.params;
    if(!movieId || isNaN(Number(movieId)))    {
        throw new ApiError(400,"Invalid movie ID");
    }
    const existingMovie = await pool.query("SELECT * FROM movies WHERE id = $1" , [movieId]);
    if(existingMovie.rows.length==0)    {
        throw new ApiError(404,"Movie not found");
    }
    const showsResult = await pool.query("SELECT * FROM shows WHERE movie_id=$1 AND start_time > NOW()" , [movieId])
    const deleteResult = await pool.query("DELETE FROM movies WHERE id = $1 RETURNING *", [movieId]);
    if(deleteResult.rows.length==0)
    {
        throw new ApiError(500,"Failed to delete movie");
    }
    res.status(200).json(new ApiResponse(200,"Movie deleted successfully" , deleteResult.rows[0]));
})
export {addMovie, editMovie, deleteMovie};