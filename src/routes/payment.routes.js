import { Router } from "express";

import { verifyJwtAccessToken } from "../middlewares/auth.middleware.js";

import accessControl from "../middlewares/role.middleware.js";
import { createPaymentOrder, getPaymentStatus, refundPayment, verifyPayment } from "../controllers/payments.controllers.js";

const paymentRouter = Router();

paymentRouter.route("/createPaymentOrder/:bookingId").post(verifyJwtAccessToken,accessControl("user","admin") , createPaymentOrder)
paymentRouter.route("/verifyPayment").post(verifyJwtAccessToken,accessControl("user","admin"),verifyPayment)
paymentRouter.route("/getPaymentStatus/:bookingId").get(verifyJwtAccessToken,accessControl("user","admin"),getPaymentStatus);
paymentRouter.route("/refundPayment/:bookingId").patch(verifyJwtAccessToken,accessControl("user","admin"),refundPayment);

export default paymentRouter;