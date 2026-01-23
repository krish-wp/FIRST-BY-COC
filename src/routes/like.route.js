import { Router } from "express";

import { upload } from "../middlewares/multer.middleware.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { likeCount, likeVideo } from "../controllers/like.controller.js";
const router = Router();

router.route("/:videoId").put(verifyJWT, likeVideo);
router.route("/:videoId/like-count").get(verifyJWT, likeCount);
export default router;
