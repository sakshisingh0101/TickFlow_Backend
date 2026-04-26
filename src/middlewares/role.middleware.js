import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const accessControl =(...roles)=> asyncHandler(async(req , res , next)=>{
    if (!req.user) {
      throw new ApiError(401, "Unauthorized");
    }

    if (!roles.includes(req.user.role)) {
      throw new ApiError(403, "Forbidden or access denied");
    }

    next();
})
export default accessControl;