import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";

const app = express();
app.get("/", (req, res) => {
    res.send("Server is working");
});

const allowedOrigins = [process.env.CORS_ORIGIN, "http://localhost:5173"];
app.use(
    cors({
        origin: (origin, cb) => {
            if (!origin || allowedOrigins.includes(origin))
                return cb(null, true);
            return cb(new Error("Not allowed by CORS"));
        },
        credentials: true,
    })
);

app.use(express.json({ limit: "16kb" }));
app.use(express.urlencoded({ extended: true, limit: "16kb" }));
app.use(express.static("public"));

app.use(cookieParser());

//routes import

import userRouter from "./routes/user.route.js";
import videoRouter from "./routes/video.route.js";
import likeRouter from "./routes/like.route.js";
import commentRouter from "./routes/comment.route.js";
import tweetRouter from "./routes/tweet.route.js";
import playlistRouter from "./routes/playlist.route.js";

//routes declration
app.use("/api/v1/user", userRouter);
app.use("/api/v1/video", videoRouter);
app.use("/api/v1/like", likeRouter);
app.use("/api/v1/comment", commentRouter);
app.use("/api/v1/playlist", playlistRouter);
app.use("/api/v1/tweet", tweetRouter);

app.use((req, res, next) => {
    console.log("Headers:", req.headers);
    console.log("Body:", req.body);
    next();
});

export { app };
