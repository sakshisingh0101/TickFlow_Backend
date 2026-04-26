import { Router } from "express";

import { verifyJwtAccessToken } from "../middlewares/auth.middleware.js";

import { changePassword, getProfile, updateProfile } from "../controllers/user.controller.js";
import accessControl from "../middlewares/role.middleware.js";

const userRouter = Router();

userRouter.route("/getProfile").get(verifyJwtAccessToken,accessControl("user"),getProfile)
userRouter.route("/updateProfile").post(verifyJwtAccessToken , accessControl("user"),updateProfile)
userRouter.route("/changePassword").post(verifyJwtAccessToken,accessControl("user") , changePassword)

export default userRouter;