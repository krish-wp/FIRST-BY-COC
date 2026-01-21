import { Router } from "express";

import { upload } from "../middlewares/multer.middleware.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import {
    deleteVideo,
    editVideo,
    listAllVideos,
    togglePrivacy,
    uploadVideo,
    watchVideo,
} from "../controllers/video.controller.js";

const router = Router();

router.route("/upload-video").post(
    upload.fields([
        {
            name: "videofile",
            maxCount: 1,
        },
        {
            name: "thumbnail",
            maxCount: 1,
        },
    ]),
    verifyJWT,
    uploadVideo
);

router.route("/edit-video/:videoId").post(
    upload.fields([
        {
            name: "newThumbnail",
            maxCount: 1,
        },
    ]),
    verifyJWT,
    editVideo
);

router
    .route("/delete-video/:videoId")
    .delete(upload.none(), verifyJWT, deleteVideo);

router
    .route("/:videoId/togglePrivacy")
    .put(verifyJWT, upload.none(), togglePrivacy);

router.route("/all-videos").get(verifyJWT, listAllVideos);

router.route("/watch-video/:videoId").get(verifyJWT, watchVideo);

export default router;
