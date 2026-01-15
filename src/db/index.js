import mongoose from "mongoose";
import { DB_name } from "../constants.js";

import dotenv from "dotenv";
dotenv.config();

const connectDB = async () => {
    try {
        const connectionInstance = await mongoose.connect(
            `${process.env.MONGODB_URL}/${DB_name}`
        );
        console.log(
            ` DB connected !!! DB Host : ${connectionInstance.connection.host}`
        );
        console.log("Connected DB:", connectionInstance.connection.name);
    } catch (error) {
        console.error("MONGODB connection error", error);
        process.exit(1);
    }
};

export default connectDB;
