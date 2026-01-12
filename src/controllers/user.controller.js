
import { asyncHandler } from "../utils/asyncHandler.js"
import { ApiError } from "../utils/api_error.js";



import { User } from "../models/user.models.js";
import { app } from "../app.js";

import { uploadOnCloudinary } from "../utils/cloudinary.js";

import { ApiResponse } from "../utils/ApiResponse.js";




const registerUser = asyncHandler(async (req,res) => {

    const {fullname , email , username , password} = req.body

    

    if(!username || !email || !fullname || !password)
    {
        throw new ApiError(400,"All details are Mandatory")
    }


    //see if user already exist or not

    const emailLower = email.toLowerCase();
    const usernameLower = username.toLowerCase();

    const existingUser = await User.findOne({
        $or : [
            {
                email : emailLower
            },
            {
                username : usernameLower
            }
        ]
    });
    
    console.log("ExistingUser:" , existingUser);
    

    if(existingUser){
        throw new ApiError(400,"User already exist");
    }

    console.log(req.files)

    const avatarLocalPath = req.files?.avatar?.[0]?.path;
    const coverImageLocalPath = req.files?.coverImage?.[0]?.path;


    if(!avatarLocalPath)
    {
        throw new ApiError(400, "Avarat is required");
    }

    const avatar =  await uploadOnCloudinary(avatarLocalPath);
    const coverImage = await uploadOnCloudinary(coverImageLocalPath);


    if(!avatar)
    {
        throw new ApiError(400, "Avarat is required");
    }

     console.log("here1");

    const user = await User.create({
        fullname,
        avatar : avatar?.url,
        email,
        password,
        username : usernameLower,
        coverImage : coverImage?.url || ""

    })

    const createdUser  = await User.findById(user._id).select(
        "-password -refreshToken "
    )

    console.log("cretaedUser:" , createdUser);

    if(!createdUser)
    {
        throw new ApiError(500 , "something went wrong while registing user");
    }

    return res.status(201).json(
        new ApiResponse(200,createdUser,"user reegistred successfully")
    )

})



export {registerUser}