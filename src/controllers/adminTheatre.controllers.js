import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import pool from "../db/postgres.js";
import {ApiResponse} from "../utils/ApiResponse.js";


//   id BIGSERIAL PRIMARY KEY,
//     theatre_name VARCHAR(255) NOT NULL,
//     city VARCHAR(255) NOT NULL,
//     address TEXT NOT NULL,
//     created_at TIMESTAMP DEFAULT NOW(),
//     updated_at TIMESTAMP DEFAULT NOW()
const addTheatre  = asyncHandler(async(req , res)=>{
    const {theatre_name , city , address} = req.body ;
    if(!theatre_name?.trim() || !city?.trim() || !address?.trim())
    {
        throw new ApiError(400,"All fields are required");
    }
    const {rows} = await pool.query("INSERT INTO theatres (theatre_name , city , address) VALUES ($1,$2,$3) RETURNING *)",[theatre_name,city,address]);

    if(rows.length==0)
    {
        throw new ApiError(500,"Failed to add theatre");
    }
    res.status(201).json(new ApiResponse(201 , "Theatre added successfully" , rows[0]));
})
const updateTheatre=asyncHandler(async(req,res)=>{
   const {theatreId} = req.params;
    if(!theatreId || isNaN(Number(theatreId)))
    {
        throw new ApiError(400,"Invalid theatre ID");
    }
    const {theatre_name , city , address} = req.body ;
    const existingTheatre = await pool.query("SELECT * FROM theatres WHERE id = $1" , [theatreId]);
    if(existingTheatre.rows.length==0){
        throw new ApiError(404 , "Theatre not found");
    }
    const updatedTheatreName = theatre_name?.trim() || existingTheatre.rows[0].theatre_name;
    const updatedCity = city?.trim() || existingTheatre.rows[0].city;
    const updatedAddress = address?.trim() || existingTheatre.rows[0].address;
    const {rows} = await pool.query("UPDATE theatres SET theatre_name=$1 , city=$2 , address=$3 , updated_at=NOW() WHERE id = $4 RETURNING *" , [updatedTheatreName,updatedCity,updatedAddress,theatreId]);
    if(rows.length==0)
    {
        throw new ApiError(500,"Failed to update theatre");
    }
    res.status(200).json(new ApiResponse(200,"Theatre updated successfully" , rows[0]));

})
const deleteTheatre = asyncHandler(async(req , res)=>{
  const {theatreId} = req.params;
    if(!theatreId || isNaN(Number(theatreId)))
    {
        throw new ApiError(400,"Invalid theatre ID");
    }
    const existingTheatre = await pool.query("SELECT * FROM theatres WHERE id = $1" , [theatreId]);
    if(existingTheatre.rows.length==0){
        throw new ApiError(404 , "Theatre not found");
    }
    const deleteResult = await pool.query("DELETE FROM theatres WHERE id = $1 RETURNING *" , [theatreId]);
    if(deleteResult.rows.length==0)
    {
        throw new ApiError(500,"Failed to delete theatre");
    }
    res.status(200).json(new ApiResponse(200,"Theatre deleted successfully" , deleteResult.rows[0]));
})
export {addTheatre , updateTheatre , deleteTheatre}