import { ApiError } from "../utils/api_error.js";
import { asyncHandler } from "../utils/asyncHandler.js";

import jwt from "jsonwebtoken";

import { User } from "../models/user.models.js";

export const verifyJWT = asyncHandler(async (req, res, next) => {
    try {
        const token =
            req.cookies?.accessToken ||
            req.header("Authorization")?.replace("Beared ", "");

        console.log(token);

        if (!token) {
            throw new ApiError(404, "Unothorised User");
        }

        const decodeToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);

        const user = await User.findById(decodeToken?._id).select(
            "-refreshToken"
        );

        if (!user) {
            throw new ApiError("401", "Invalid access token");
        }

        req.user = user;
        next();
    } catch (error) {
        throw new ApiError(401, error?.message || "invalid access token");
    }
});
