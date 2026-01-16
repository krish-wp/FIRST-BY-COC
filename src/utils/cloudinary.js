import { v2 as cloudinary } from "cloudinary";
import fs from "fs";

// Configuration
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET, // Click 'View API Keys' above to copy your API secret
});

const uploadOnCloudinary = async (localfilepath) => {
    try {
        if (!localfilepath) return null;

        const respose = await cloudinary.uploader.upload(localfilepath, {
            resource_type: "auto",
        });

        console.log("file has been uploaded on cloudinary", respose.url);
        fs.unlinkSync(localfilepath);
        return respose;
    } catch (error) {
        fs.unlinkSync(localfilepath); // remove locally saved temp file if found error while uploading
        console.error("ERROR WHILE UPLOADINF FILE", error);
    }
};

export { uploadOnCloudinary };
