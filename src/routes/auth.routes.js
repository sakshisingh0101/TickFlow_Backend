import { Router } from "express";

import { verifyJwtRefreshToken } from "../middlewares/auth.middleware.js";
import { loginUser, logOutUser, refreshAccessTokens, registerUser, verifyEmail } from "../controllers/auth.controllers.js";

const authRouter = Router();

authRouter.route("/register").post(registerUser);
authRouter.route("/verifyEmail").post(verifyEmail);
authRouter.route("/login").post(loginUser);
authRouter.route("/logout").get(verifyJwtRefreshToken,logOutUser);
authRouter.route("/refreshToken").get(verifyJwtRefreshToken,refreshAccessTokens)


export default authRouter;