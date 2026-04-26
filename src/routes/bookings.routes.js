import { Router } from "express";

import { verifyJwtAccessToken } from "../middlewares/auth.middleware.js";

import accessControl from "../middlewares/role.middleware.js";
import { cancelBooking, createBooking, expirePendingBookings, getAllBookings, getBookingById, getMyBookings } from "../controllers/bookings.controllers.js";

const bookingRouter = Router();

bookingRouter.route("/createBooking").post(verifyJwtAccessToken,accessControl("user"),createBooking);
bookingRouter.route("/cancelBooking/:bookingId").patch(verifyJwtAccessToken,accessControl("user"),cancelBooking)
bookingRouter.route("/getMyBookings").get(verifyJwtAccessToken,accessControl("user"),getMyBookings)
bookingRouter.route("/getBookingsById/:bookingId").get(verifyJwtAccessToken,accessControl("user"),getBookingById);
bookingRouter.route("/getAllBookings").get(verifyJwtAccessToken,accessControl("admin"),getAllBookings)
bookingRouter.route("/expirePendingBookings").patch(verifyJwtAccessToken,accessControl("admin"),expirePendingBookings);

export default bookingRouter;