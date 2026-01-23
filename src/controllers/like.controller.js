import { asyncHandler } from "../utils/asyncHandler.js";
import { Video } from "../models/video.models.js";
import { Like } from "../models/likes.models.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { ApiError } from "../utils/api_error.js";
import mongoose from "mongoose";

const likeVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params;
    const userId = req.user._id;
    console.log(userId);
    const userId1 = userId.toHexString();
    console.log(userId1);

    if (!videoId) {
        throw new ApiError(400, "please enter valid videoId");
    }
    const video = await Video.findById(videoId);

    if (!video) {
        throw new ApiError(400, "video is not in database");
    }

    if (await Like.findOne({ video: videoId, likedBy: userId1 })) {
        throw new ApiError(400, "You have already liked this video");
    }

    const like = await Like.create({
        video: videoId,
        likedBy: userId1,
    });

    return res
        .status(200)
        .json(new ApiResponse(200, like, "Video liked successfully"));
});

const likeCount = asyncHandler(async (req, res) => {
    const { videoId } = req.params;

    if (!videoId) {
        throw new ApiError(400, "please enter valid videoId");
    }

    //without aggregation pipeline
    // const likess = await Like.find({ video: videoId });
    // const likeCount = likess.length;
    // console.log(likeCount);

    //aggregation pipeline to count likes for the video
    const likes = await Like.aggregate([
        {
            $match: { video: new mongoose.Types.ObjectId(videoId) },
        },
        {
            $count: "likeCount",
        },
    ]);

    console.log(likes);

    return res
        .status(200)
        .json(new ApiResponse(200, likes, "Like count fetched successfully"));
});

const dislikeVideo = asyncHandler(async (req, res) => {});

export { likeVideo, likeCount };
