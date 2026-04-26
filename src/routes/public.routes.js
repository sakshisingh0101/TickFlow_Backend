import { Router } from "express";

import { filterMovies, getAllMovies, getMovieById, getTrendingMovies, searchMovies } from "../controllers/movie.controllers.js";
import { getAllScreens, getScreenById, getScreensByTheatre } from "../controllers/screens.controllers.js";
import { getAvailableSeats, getSeatsByShow } from "../controllers/seats.controllers.js";
import { getAllShows, getShowById, getShowsByCity, getShowsByMovie, universalSearch } from "../controllers/show.controllers.js";
import { getAllTheatres, getTheatreById, getTheatresByCity } from "../controllers/theatre.controllers.js";

const publicRouter = Router();

publicRouter.route("/getAllMovies").get(getAllMovies)
publicRouter.route("/getMovieById/:movieId").get(getMovieById)
publicRouter.route("/getMovieByName").get(searchMovies);
publicRouter.route("/filterMovies").get(filterMovies);

publicRouter.route("/getAllScreens").get(getAllScreens)
publicRouter.route("/getScreenById/:screenId").get(getScreenById)
publicRouter.route("/getScreensByTheatre/:theatreId").get(getScreensByTheatre);

publicRouter.route("/getSeatsByShow/:showId").get(getSeatsByShow);
publicRouter.route("/getAllShows").get(getAllShows);
publicRouter.route("/getAvailableSeats/:showId").get(getAvailableSeats);


publicRouter.route("/getShowsByMovie/:movieId").get(getShowsByMovie)
publicRouter.route("/getShowsById/:showId").get(getShowById);
publicRouter.route("/getShowsByCity/:city").get(getShowsByCity);

publicRouter.route("/getAllTheatres").get(getAllTheatres)
publicRouter.route("/getTheatreById/:theatreId").get(getTheatreById)
publicRouter.route("/getTheatreByCity").get(getTheatresByCity);

publicRouter.route("/search").get(universalSearch);
publicRouter.route("/trendingMovies").get(getTrendingMovies);



export default publicRouter;