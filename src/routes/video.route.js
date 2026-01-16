import { Router } from "express";

import { upload } from "../middlewares/multer.middleware.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { editVideo, uploadVideo } from "../controllers/video.controller.js";

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

router.route("/edit-video/:videoId").post(upload.none(), verifyJWT, editVideo);

export default router;
