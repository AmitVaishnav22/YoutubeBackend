import {asyncHandler} from "../utils/asyncHandler.js"
import {apiError} from "../utils/apiError.js"
import {User} from "../models/user.model.js"
import {uploadOnCloudinary} from "../utils/cloudinary.js"
import {apiResponse} from "../utils/apiResponse.js"

const registerUser = asyncHandler(async (req,res)=>{
    const {username,fullname,email,password}=req.body
    if(
        [fullname,email,username,password].some((field)=>field?.trim()==="")
    ){
        throw new apiError(400,"Invalid user credentials")
    }

    const existedUser= await User.findOne({
        $or:[{username},{email}]
    })

    if (existedUser){
        throw new apiError(409,"User with email/username already exits")
    }
    const avatarLocalPath=req.files?.avatar[0]?.path
    //const coverImageLocalPath=req.files?.coverImage[0]?.path
    let coverImageLocalPath;
    if (req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length>0){
        coverImageLocalPath=req.files.coverImage[0].path
    }
    if(!avatarLocalPath){
        throw new apiError(400,"Avatar file is required")
    }

    const avatar = await uploadOnCloudinary(avatarLocalPath)
    const coverImage = await uploadOnCloudinary(coverImageLocalPath)
    
    if(!avatar){
        throw new apiError(400,"Avatar file is required")
    }

    const user=await User.create({
        fullname,
        avatar:avatar.url,
        coverImage:coverImage?.url || "",
        email,
        password,
        username: username.toLowerCase()
    })

    const createdUser = await User.findById(user._id).select(
        "-password -refreshToken"
    )
    if(!createdUser){
        throw new apiError(500,"Something went wrong will registering user")
    }

    return res.status(201).json(
        new apiResponse(200,createdUser,"User registerd successfully")
    )
})

export {
    registerUser,
}