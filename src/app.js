import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";

const app = express();
app.get("/", (req, res) => {
    res.send("Server is working");
});

app.use(
    cors({
        origin: process.env.CORS_ORIGIN,
        Credential: true,
    })
);

app.use(express.json({ limit: "16kb" }));
app.use(express.urlencoded({ extended: true, limit: "16kb" }));
app.use(express.static("public"));

app.use(cookieParser());

//routes import

import userRouter from "./routes/user.route.js";

//routes declration
app.use("/api/v1/users", userRouter);

app.use((req, res, next) => {
    console.log("Headers:", req.headers);
    console.log("Body:", req.body);
    next();
});

export { app };
