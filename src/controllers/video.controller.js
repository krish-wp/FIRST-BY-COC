import { asyncHandler } from "../utils/asyncHandler.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiError } from "../utils/api_error.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { Video } from "../models/video.models.js";

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
        videfile: videofile.secure_url,
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

    if (!videoId) {
        throw new ApiError(400, "please enter videoId");
    }

    const video = await Video.findById(videoId);

    if (!video) {
        throw new ApiError(400, "Video Does not exist in database");
    }

    video.title = title;
    video.description = description;

    res.status(200).json(
        new ApiResponse(200, video, "video edited successfully")
    );
});

//change thumbnail, edit private/public, delete video, etc can be added later

export { uploadVideo, editVideo };
