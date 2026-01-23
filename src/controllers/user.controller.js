import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/api_error.js";

import { User } from "../models/user.models.js";
import { Subscription } from "../models/subscription.models.js";
import { app } from "../app.js";

import { uploadOnCloudinary } from "../utils/cloudinary.js";

import { ApiResponse } from "../utils/ApiResponse.js";

import jwt from "jsonwebtoken";
import mongoose from "mongoose";

const generateAccessAndRefreshToken = async (userId) => {
    try {
        const user = await User.findById(userId);

        if (!user) {
            throw new ApiError(404, "User not found");
        }

        const accessToken = user.generateAccessToken();
        const refreshToken = user.generateRefreshToken();

        user.refreshToken = refreshToken;

        await user.save({ validateBeforeSave: false });

        return { accessToken, refreshToken };
    } catch (error) {
        throw new ApiError(500, error.message || "Token generation failed");
    }
};

const registerUser = asyncHandler(async (req, res) => {
    const { fullname, email, username, password } = req.body;

    if (!username || !email || !fullname || !password) {
        throw new ApiError(400, "All details are Mandatory");
    }

    //see if user already exist or not

    const emailLower = email.toLowerCase();
    const usernameLower = username.toLowerCase();

    const existingUser = await User.findOne({
        $or: [
            {
                email: emailLower,
            },
            {
                username: usernameLower,
            },
        ],
    });

    console.log("ExistingUser:", existingUser);

    if (existingUser) {
        throw new ApiError(400, "User already exist");
    }

    console.log(req.files);

    const avatarLocalPath = req.files?.avatar?.[0]?.path;
    const coverImageLocalPath = req.files?.coverImage?.[0]?.path;

    if (!avatarLocalPath) {
        throw new ApiError(400, "Avarat is required");
    }

    const avatar = await uploadOnCloudinary(avatarLocalPath);
    const coverImage = await uploadOnCloudinary(coverImageLocalPath);

    if (!avatar) {
        throw new ApiError(400, "Avarat is required");
    }

    console.log("here1");

    const user = await User.create({
        fullname,
        avatar: avatar?.url,
        email: emailLower,
        password,
        username: usernameLower,
        coverImage: coverImage?.url || "",
    });

    const createdUser = await User.findById(user._id).select(
        "-password -refreshToken "
    );

    console.log("cretaedUser:", createdUser);

    if (!createdUser) {
        throw new ApiError(500, "something went wrong while registing user");
    }

    return res
        .status(201)
        .json(
            new ApiResponse(200, createdUser, "user reegistred successfully")
        );
});

const loginUser = asyncHandler(async (req, res) => {
    console.log("BODY:", req.body);
    const { email, username, password } = req.body;

    console.log("USERNAME:", username);

    if (!(email || username)) {
        throw new ApiError(400, "Please enter username or email");
    }

    const usernameLower = username?.toLowerCase();
    const emailLower = email?.toLowerCase();

    const user = await User.findOne({
        $or: [{ email: emailLower }, { username: usernameLower }],
    });

    if (!user) {
        throw new ApiError(400, "User need to register first");
    }
    console.log("USER INSTANCE:", user);

    const isPasswordValid = await user.isPasswordCorrect(password);
    console.log("password:", password);
    console.log("password is valid? : ", isPasswordValid);
    if (!isPasswordValid) {
        throw new ApiError(401, "Invalid password");
    }
    console.log("done");

    const { refreshToken, accessToken } = await generateAccessAndRefreshToken(
        user._id
    );

    const loggedInUser = await User.findById(user._id).select(
        "-password -refreshToken"
    );

    const options = {
        httpOnly: true,
        secure: true,
        sameSite: "strict",
    };

    return res
        .status(200)
        .cookie("accessToken", accessToken, options)
        .cookie("refreshToken", refreshToken, options)
        .json(
            new ApiResponse(
                200,
                {
                    user: loggedInUser,
                    accessToken,
                    refreshToken,
                },
                "user logged in successfully"
            )
        );
});

const logoutUser = asyncHandler(async (req, res) => {
    console.log(req.user);
    await User.findByIdAndUpdate(
        req.user._id,
        {
            $set: {
                refreshToken: undefined,
            },
        },
        {
            new: true,
        }
    );

    const options = {
        httpOnly: true,
        secure: true,
    };

    return res
        .status(200)
        .clearCookie("accessToken", options)
        .clearCookie("refreshToken", options)
        .json(new ApiResponse(200, req.user, "User Logged Out"));
});

const refreshAccessToken = asyncHandler(async (req, res) => {
    try {
        const { refreshToken } = await (req.cookies || req.body);

        console.log(req.body);

        if (!refreshToken) {
            throw new ApiError(401, "Refresh token not found");
        }

        const decodedToken = await jwt.verify(
            refreshToken,
            process.env.REFRESH_TOKEN_SECRET
        );

        const user = await User.findById(decodedToken?._id);

        if (!user || user.refreshToken !== refreshToken) {
            throw new ApiError(401, "Invalid refresh token");
        }

        const newAccessToken = user.generateAccessToken();

        const options = {
            httpOnly: true,
            secure: true,
        };

        return res
            .status(200)
            .cookie("accessToken", newAccessToken, options)
            .json(
                new ApiResponse(
                    200,
                    { accessToken: newAccessToken },
                    "Access token refreshed successfully"
                )
            );
    } catch (error) {
        throw new ApiError(
            401,
            error?.message || "Could not refresh access token"
        );
    }
});

const changeCurrentPassword = asyncHandler(async (req, res) => {
    const { oldPassword, newPassword, confirmPassword } = req.body;

    const user = await User.findById(req.user?._id);
    const isPasswordCorrect = await user.isPasswordCorrect(oldPassword);

    if (!isPasswordCorrect) {
        throw new ApiError(400, "Incorrect Password");
    }

    if (!(newPassword === confirmPassword)) {
        throw new ApiError(400, "Confirm Password is not correct ");
    }
    user.password = newPassword;

    await user.save({ validateBeforeSave: false });

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                await User.findById(user._id).select("-password"),
                "Password Changes Successfully"
            )
        );
});

const getCurrentUser = asyncHandler(async (req, res) => {
    const user = await User.findById(req.user._id).select(
        "-password -watchHistory -_id"
    );

    return res.status(200).json(new ApiResponse(200, user, "User founded"));
});

const getUserChannelProfile = asyncHandler(async (req, res) => {
    const { username } = req.params;

    if (!username) {
        throw new ApiError(200, "username is missing");
    }

    const channel = await User.aggregate([
        {
            $match: {
                username: username?.toLowerCase(),
            },
        },
        {
            $lookup: {
                from: "subscriptions",
                localField: "_id",
                foreignField: "channel",
                as: "subscribers",
            },
        },
        {
            $lookup: {
                from: "subscriptions",
                localField: "_id",
                foreignField: "subscriber",
                as: "subscribedTo",
            },
        },
        {
            $addFields: {
                subscribersCount: {
                    $size: "$subscribers",
                },
                subscriberdToCount: {
                    $size: "$subscribedTo",
                },
                isSubscribed: {
                    $cond: {
                        if: {
                            $in: [req.user?._id, "$subscribers.?subscriber"],
                        },
                        then: true,
                        else: false,
                    },
                },
            },
        },
        {
            $project: {
                fullname: 1,
                username: 1,
                subscribersCount: 1,
                subscriberdToCount: 1,
                isSubscribed: 1,
                avatar: 1,
                coverImage: 1,
                email: 1,
            },
        },
    ]);

    if (!channel?.length) {
        throw new ApiError(400, "Channel does not exist");
    }

    console.log(channel);

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                channel[0],
                "User channel fetched successfully"
            )
        );
});

const getWatchHistory = asyncHandler(async (req, res) => {
    const user = await User.aggregate([
        {
            $match: {
                _id: req.user._id,
            },
        },
        {
            $lookup: {
                from: "videos",
                localField: "watchHistory.video",
                foreignField: "_id",
                as: "watchHistory",
                pipeline: [
                    {
                        $lookup: {
                            from: "users",
                            localField: "owner",
                            foreignField: "_id",
                            as: "owner",
                            pipeline: [
                                {
                                    $project: {
                                        username: 1,
                                        avatar: 1,
                                        fullname: 1,
                                    },
                                },
                            ],
                        },
                    },
                    {
                        $addFields: {
                            owner: {
                                $first: "$owner",
                            },
                        },
                    },
                ],
            },
        },
    ]);

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                user[0].watchHistory,
                "watchHistory got fetched successfully"
            )
        );
});

// const getWatchHistory = asyncHandler(async (req, res) => {
//     const user = await User.findById(req.user._id);

//     const watchHistory = user.watchHistory;

//     return res
//         .status(200)
//         .json(new ApiResponse(200, watchHistory, "successfull"));
// });

export {
    registerUser,
    loginUser,
    logoutUser,
    refreshAccessToken,
    changeCurrentPassword,
    getCurrentUser,
    getUserChannelProfile,
    getWatchHistory,
};
