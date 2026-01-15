import { Router } from "express";
import { changeCurrentPassword, getCurrentUser, getUserChannelProfile, getWatchHistory, loginUser, logoutUser, refreshAccessToken, registerUser } from "../controllers/user.controller.js";
import { upload } from "../middlewares/multer.middleware.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();

router.route("/register").post(
    upload.fields([
        {
            name : "avatar",
            maxCount : 1
        },
        {
            name : "coverimage",
            maxCount : 1
        }
    ]),
    registerUser)


    router.route("/login").post(
        upload.fields([
            {name : "username" , name : "email" , name : "password"}
        ]),
        loginUser);


router.route("/logout").post(verifyJWT,logoutUser)


router.route("/refresh-token").post(refreshAccessToken);

router.route("/change-password").post(upload.none(),verifyJWT , changeCurrentPassword);

router.route("/channel").post(upload.none(),getUserChannelProfile)

router.route("/watch-history").post(upload.none(), verifyJWT , getWatchHistory)

router.route("/current-user").post(verifyJWT , getCurrentUser);


export default router