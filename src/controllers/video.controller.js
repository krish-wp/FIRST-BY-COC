import { asyncHandler } from "../utils/asyncHandler.js";
import {
    uploadOnCloudinary,
    deleteFromCloudinary,
} from "../utils/cloudinary.js";
import { ApiError } from "../utils/api_error.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { Video } from "../models/video.models.js";
import { User } from "../models/user.models.js";
import { sync } from "touch";
import mongoose from "mongoose";

const uploadVideo = asyncHandler(async (req, res) => {
    const { title, description } = req.body;

    if (!title || !description) {
        throw new ApiError(400, "Title and Description are required");
    }
    const owner = req.user._id;

    console.log("req.files:", req.files);

    const videofileLocalPath = (await req.files?.videofile?.[0]?.path) || null;
    const thumbnailLocalPath = (await req.files?.thumbnail?.[0]?.path) || null;

    console.log("videofileLocalPath:", videofileLocalPath);
    console.log("thumbnailLocalPath:", thumbnailLocalPath);

    if (!videofileLocalPath || !thumbnailLocalPath) {
        throw new Error("Video file or Thumbnail is missing");
    }

    const videofile = await uploadOnCloudinary(videofileLocalPath);
    const thumbnail = await uploadOnCloudinary(thumbnailLocalPath);

    if (!videofile || !thumbnail) {
        throw new Error("Video or Thumbnail upload failed");
    }

    const duration = videofile.duration || 0;

    const video = await Video.create({
        videofile: videofile.secure_url,
        thumbnail: thumbnail.secure_url,
        title,
        description,
        duration,
        owner,
    });

    // Here you would typically save the video information to the database
    // For demonstration, we'll just return the received data
    res.status(201).json(
        new ApiResponse(201, { video }, "Video uploaded successfully")
    );
});

const editVideo = asyncHandler(async (req, res) => {
    //getvideo id
    //find video
    //get title and description from req.body
    //update title and description
    //send response

    const { videoId } = req.params;
    const { title, description } = req.body;
    const { newThumbnail } = req.files;

    if (!videoId) {
        throw new ApiError(400, "please enter videoId");
    }

    const video = await Video.findById(videoId);

    if (!video) {
        throw new ApiError(400, "Video Does not exist in database");
    }

    if (title !== null) {
        video.title = title;
    }

    if (description !== null) {
        video.description = description;
    }

    if (newThumbnail !== null) {
        await deleteFromCloudinary(video.thumbnail);

        const newThumbnailLocalPath =
            (await req.files?.newThumbnail?.[0]?.path) || null;

        if (!newThumbnailLocalPath) {
            throw new ApiError(400, "thumbnail does not exist");
        }

        const newThumbnailLink = await uploadOnCloudinary(
            newThumbnailLocalPath
        );

        if (!newThumbnailLink) {
            throw new ApiError(400, "thumbnail did not uploaded on cloudinary");
        }

        video.thumbnail = newThumbnailLink.secure_url;
    }

    await video.save();

    res.status(200).json(
        new ApiResponse(200, video, "video edited successfully")
    );
});

const deleteVideo = asyncHandler(async (req, res) => {
    const { videoId } = (await req.params) || null;

    console.log(videoId);

    if (!videoId) {
        throw new ApiError(400, "Please Enter Your Video ID");
    }

    const video = await Video.findById(videoId);

    if (!video) {
        throw new ApiError(400, "Video does not exist in our database");
    }

    await video.deleteOne();

    return res
        .status(200)
        .json(new ApiResponse(200, {}, "video deleted successfully"));
});

const togglePrivacy = asyncHandler(async (req, res) => {
    const { toggle } = req.body;
    const { videoId } = req.params;

    const video = await Video.findById(videoId);

    if (!video) {
        throw new ApiError(400, " video does not exist");
    }

    video.isPublished = toggle;
    await video.save();

    return res
        .status(200)
        .json(
            new ApiResponse(200, video, "video privacy changes successsfully")
        );
});

const listAllVideos = asyncHandler(async (req, res) => {
    const videos = await Video.find().select("videofile");

    return res
        .status(200)
        .json(new ApiResponse(200, videos, "Videos fetched successfully"));
});

// const watchVideo = asyncHandler(async (req, res) => {
//     const { videoId } = req.params;

//     const video = await Video.findById(videoId);
//     if (!video) {
//         throw new ApiError(400, "Video Does not exist in database");
//     }

//     const userId = req.user._id;
//     const user = await User.findById(userId);
//     const watchHistory = user.watchHistory;

//     const historyEntry = await watchHistory
//         .filter((item) => item.video?.toString() === videoId)
//         .at(-1);

//     const lastWatchedAt = await historyEntry?.watchedAt;

//     if (!lastWatchedAt) {
//         video.views = video.views + 1;
//     } else {
//         if (Date.now() - lastWatchedAt.getTime() >= 10 * 60 * 1000) {
//             video.views = video.views + 1;
//         }
//     }

//     await User.findByIdAndUpdate(userId, {
//         $addToSet: {
//             watchHistory: {
//                 video: videoId,
//                 watchedAt: new Date(),
//             },
//         },
//     });

//     await video.save();

//     return res
//         .status(200)
//         .json(new ApiResponse(200, video, "Video Watched Successfully"));
// });

//using aggregation pipeline

const watchVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params;

    const video = await Video.findById(videoId);

    if (!video) {
        throw new ApiError(400, "Video Does not exist in database");
    }

    // const userId = req.user._id;
    // const user = await User.findById(userId);
    // const watchHistory = user.watchHistory;

    // const historyEntry = await watchHistory
    //     .filter((item) => item.video?.toString() === videoId)
    //     .at(-1);

    const result = await User.aggregate([
        {
            $match: { _id: req.user._id },
        },
        {
            $unwind: "$watchHistory",
        },
        {
            $match: {
                "watchHistory.video": new mongoose.Types.ObjectId(videoId),
            },
        },
        {
            $sort: { "watchHistory.watchedAt": -1 },
        },
        {
            $limit: 1,
        },
        {
            $project: {
                _id: 0,
                watchedAt: "$watchHistory.watchedAt",
            },
        },
    ]);

    const lastWatchedAt = result[0]?.watchedAt || null;

    console.log(lastWatchedAt);

    if (!lastWatchedAt) {
        video.views = video.views + 1;
    } else {
        if (Date.now() - lastWatchedAt.getTime() >= 10 * 60 * 1000) {
            video.views = video.views + 1;
        }
    }

    await User.findByIdAndUpdate(req.user._id, {
        $addToSet: {
            watchHistory: {
                video: videoId,
                watchedAt: new Date(),
            },
        },
    });

    await video.save();

    return res
        .status(200)
        .json(new ApiResponse(200, video, "Video Watched Successfully"));
});

//change thumbnail, edit private/public, delete video, etc can be added later

export {
    uploadVideo,
    editVideo,
    deleteVideo,
    togglePrivacy,
    listAllVideos,
    watchVideo,
};
