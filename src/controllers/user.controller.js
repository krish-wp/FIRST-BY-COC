
import { asyncHandler } from "../utils/asyncHandler.js"
import { ApiError } from "../utils/api_error.js";



import { User } from "../models/user.models.js";
import { app } from "../app.js";

import { uploadOnCloudinary } from "../utils/cloudinary.js";

import { ApiResponse } from "../utils/ApiResponse.js";


const generateAccessAndRefreshToken = async(userId) =>
{
    try {

        const user = User.findOne(userId);

        const accessToken = user.generateAccessToken();
        const refreshToken = user.generateRefreshToken();

        user.refreshToken = refreshToken;

        await user.save({validateBeforeSave : false});

        return {accessToken , refreshToken};

    } catch (error) {
        throw new ApiError(400,"Something went wrong while generating tokens")
    }
}

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
        email : emailLower,
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

const loginUser = asyncHandler(async (req,res) => {
    console.log("BODY:",req.body);
    const {email ,  username , password} = req.body;

    console.log("USERNAME:",username);
    

    if(!email || !username)
    {
        throw new ApiError(400, "Please enter username or email")
    }

    const usernameLower = username.toLowerCase();
    const emailLower = email.toLowerCase();

    const user = await User.findOne(
        {
            $or : 
            [{email : emailLower},{username : usernameLower}] });

    if(!user){
        throw new ApiError(400, "User need to register first")
    }
    console.log("USER INSTANCE:",user);

    const isPasswordValid = await user.isPasswordCorrect(password);
    console.log("password:" , password);

    console.log("password is valid? : " , isPasswordValid);

    if (!isPasswordValid) {
        throw new ApiError(401, "Invalid password");
        }


        console.log("done")


    const {refreshToken , accessToken} = await generateAccessAndRefreshToken(user._id);

    const loggedInUser = await User.findById(user._id);

    select("-password -refreshToken")
    
        const options = {
            httpOnly : true,
            secure : true
        }

        return res
        .status(200)
        .cookie("accessToken" , accessToken,options)
        .cookie("refreshToken" , refreshToken , options);

        new ApiResponse(
            200,
            {
                user : loggedInUser, accessToken,refreshToken
            },
            "user logged in successfully"
        )

})



const logoutUser = asyncHandler(async (req, res) => {
    await User.findByIdAndUpdate(req.user._id,
        {
        $set : {
            refreshToken : undefined
                }
        },
        {   
        new : true
        }
    )

    const options = {
        httpOnly : true,
        secure : true
    }

    return res
    .status(200)
    .clearCookie("accessToken" , options)
    .clearCookie("refreshToken" , options)
    .json(new ApiResponse(200 , user , "User Logged Out"))
})

export {
    registerUser,
    loginUser,
    logoutUser
}