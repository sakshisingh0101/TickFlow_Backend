import { Router } from "express";
import {upload} from "../middlewares/multer.middleware.js";
import { verifyJwtAccessToken } from "../middlewares/auth.middleware.js";

import accessControl from "../middlewares/role.middleware.js";
import { addMovie, deleteMovie, editMovie } from "../controllers/adminMovie.controllers.js";
import { addTheatre, deleteTheatre, updateTheatre } from "../controllers/adminTheatre.controllers.js";
import { addScreen, deleteScreen, updateScreen } from "../controllers/adminScreen.controllers.js";
import { getAdminStats, getOccupancyStats, getRevenueStats } from "../controllers/adminDashboard.controllers.js";
import { blockUser, cancelShow, getAllUsers, markShowCompleted, unblockUser } from "../controllers/adminManagement.controllers.js";
import { addShow, deleteShow, updateShow } from "../controllers/adminShows.controllers.js";
import { getDailyBookings, getFailedPayments, getRefundHistory } from "../controllers/adminReports.controllers.js";

const adminRouter = Router();

adminRouter.route("/addMovie").post(verifyJwtAccessToken,accessControl("admin") , upload.single("poster_url") , addMovie);
adminRouter.route("/editMovie/:movieId").post(verifyJwtAccessToken,accessControl("admin"),upload.single("poster_url") , editMovie);
adminRouter.route("/deleteMovie/:movieId").delete(verifyJwtAccessToken,accessControl("admin") , deleteMovie);

adminRouter.route("/addShow").post(verifyJwtAccessToken ,accessControl("admin") , addShow);
adminRouter.route("/updateShow/:showId").post(verifyJwtAccessToken , accessControl("admin") , updateShow);
adminRouter.route("/deleteShow/:showId").delete(verifyJwtAccessToken , accessControl("admin") , deleteShow);

adminRouter.route("/addTheatre").post(verifyJwtAccessToken , accessControl("admin") , addTheatre);
adminRouter.route("/updateTheatre/:theatreId").post(verifyJwtAccessToken , accessControl("admin") , updateTheatre);
adminRouter.route("/deleteTheatre/:theatreId").delete(verifyJwtAccessToken , accessControl("admin") , deleteTheatre);

adminRouter.route("/addScreen").post(verifyJwtAccessToken ,accessControl("admin") , addScreen);
adminRouter.route("/updateScreen/:screenId").post(verifyJwtAccessToken , accessControl("admin") , updateScreen);
adminRouter.route("/deleteScreen/:screenId").delete(verifyJwtAccessToken , accessControl("admin") ,deleteScreen);

adminRouter.route("/getAdminStats").get(verifyJwtAccessToken ,accessControl("admin") , getAdminStats);
adminRouter.route("/getRevenueStats").get(verifyJwtAccessToken , accessControl("admin") , getRevenueStats);
adminRouter.route("/getOccupancyStats").get(verifyJwtAccessToken , accessControl("admin") ,getOccupancyStats);

adminRouter.route("/getAllUsers").get(verifyJwtAccessToken,accessControl("admin"),getAllUsers)
adminRouter.route("/blockUser/:userId").patch(verifyJwtAccessToken,accessControl("admin"),blockUser)
adminRouter.route("/unblockUser/:userId").patch(verifyJwtAccessToken,accessControl("admin"),unblockUser)
adminRouter.route("/cancelShow/:showId").patch(verifyJwtAccessToken,accessControl("admin"),cancelShow)
adminRouter.route("/markShowCompleted/:showId").patch(verifyJwtAccessToken,accessControl("admin"),markShowCompleted)

adminRouter.route("/getDailyBookings").get(verifyJwtAccessToken,accessControl("admin"),getDailyBookings)
adminRouter.route("/getFailedPayments").get(verifyJwtAccessToken,accessControl("admin"),getFailedPayments)
adminRouter.route("/getRefundHistory").get(verifyJwtAccessToken,accessControl("admin"),getRefundHistory)

export default adminRouter

