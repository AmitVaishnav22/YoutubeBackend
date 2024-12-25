import {asyncHandler} from "../utils/asyncHandler.js"
import {apiError} from "../utils/apiError.js"
import {User} from "../models/user.model.js"
import {deleteOnCloudinary, uploadOnCloudinary} from "../utils/cloudinary.js"
import {apiResponse} from "../utils/apiResponse.js"
import jwt from "jsonwebtoken"
 

const generateAccessAndRefreshTokens=async(userId)=>{
    try {
        const user=await User.findById(userId)
        const accessToken=user.generateAccessToken()
        const refreshToken=user.generateRefreshToken()
        user.refreshToken=refreshToken //adding value to db(refreshToken)
        await user.save({validateBeforeSave:false})
        return {accessToken,refreshToken}
    } catch (error) {
        throw new apiError(500,"something went wrong while generating refesh and access token")
    }
}


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

const loginUser = asyncHandler(async(req,res)=>{
    const {email,username,password}=req.body

    //console.log(email)

    if (!username &&  !email){
        throw new apiError(400,"username or email is required")
    }
    const user= await User.findOne({
        $or:[{username},{email}]
    })
    if (!user){
        throw new apiError(404,"user doesnot exist")
    }

    const isPasswordValid=await user.isPasswordCorrect(password)
    if (!isPasswordValid){
        throw new apiError(404,"user password incorrect")
    }
    const {accessToken,refreshToken}=await generateAccessAndRefreshTokens(user._id)

    const loggedInUser=await User.findById(user._id).select("-password -refreshToken") //something expensive , can just update in current user
    const options={
        httpOnly:true,
        secure:true
    }

    return res.status(200)
           .cookie("accessToken",accessToken,options)
           .cookie("refreshToken",refreshToken,options)
           .json(
            new apiResponse(200,{
                user:loggedInUser,accessToken,refreshToken
            },
            "user logged in successfully"
        )
    )
})

const logoutUser=asyncHandler(async(req,res)=>{
    User.findByIdAndUpdate(req.user._id,{
        $set:{
            refreshToken:undefined
        }
    },{new:true})

    const options={
        httpOnly:true,
        secure:true
    }

    return res.status(200)
              .clearCookie("accessToken",options)
              .clearCookie("refreshToken",options)
              .json(new apiResponse(200,{},"User logged out"))
})

const refreshAccessToken=asyncHandler(async(req,res)=>{
    const incomingRefreshToken=req.cookies.refreshToken || req.body.refreshToken

    if(!incomingRefreshToken){
        throw new apiError(401,"refreshToken not found")
    }

    const decodedToken=jwt.verify(incomingRefreshToken,process.env.REFRESH_TOKEN)
    const user=await User.findById(decodedToken?._id)
    if(!user){
        throw new apiError(401,"invalid refreshToken")
    }
    if(incomingRefreshToken!==user?.refreshToken){
        throw new apiError(401,"refreshToken expired or used")
    }

    const options={
        httpOnly:true,
        secure:true
    }
    const {accessToken,refreshToken}=await generateAccessAndRefreshTokens(user._id)
    // console.log(accessToken)
    // console.log(refreshToken)
    return res
           .status(200)
           .cookie("accessToken",accessToken,options)
           .cookie("refreshToken",refreshToken,options)
           .json(
            new apiResponse(
                200,
                {accessToken,refreshToken},
                "accessToken refreshed"
            )
           )
})

const changeCurrentPassword=asyncHandler(async(req,res)=>{
    const {oldPassword,newPassword}=req.body
    const user=await User.findById(req.user?._id)
    const isPasswordCorrect=user.isPasswordCorrect(oldPassword)
    if(!isPasswordCorrect){
        throw new apiError(400,"old password is incorrect")
    }
    user.password=newPassword
    await user.save({validateBeforeSave:false})
    return res.status(200)
            .json(new apiResponse(200,{},"password changed successfully"))
})

const getCurrentUser=asyncHandler(async(req,res)=>{
    return res.status(200)
              .json(new apiResponse(200,req.user,"Current user fetched successfully"))
})

const updateAccountDetails=asyncHandler(async(req,res)=>{
    const {fullname,email}=req.body

    if (!fullname && !email){
        throw new apiError(400,"nothing to update")
    }

    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set:{
                fullname,
                email
            }
        },
        {new:true}
    ).select("-password -refreshToken")

    return res.status(200)
               .json(new apiResponse(200,{user},"accountdetails updated successfully"))
})

const updateUserAvatar=asyncHandler(async(req,res)=>{
    const avatarLocalPath=req.file?.path
    if(!avatarLocalPath){
        throw new apiError(400,"avatarFile is missing")
    }
    const avatar=await uploadOnCloudinary(avatarLocalPath)
    if (!avatar.url){
        throw new apiError(400,"error while uploading avatar")
    }

    const previousfilePath=req.user?.avatar
    if(previousfilePath){
        await deleteOnCloudinary(previousfilePath)
        //console.log("deleted previous file")
    }
    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set:{
                avatar:avatar.url
            }
        },
        {new:true}
    ).select("-password -refreshToken")
    
    

    return res.status(200)
              .json(new apiResponse(200,user,"avatar successfully uploaded"))
})

const updateUserCoverImage=asyncHandler(async(req,res)=>{
    const coverImageLocalPath=req.file?.path
    if(!coverImageLocalPath){
        throw new apiError(400,"coverImage file is missing")
    }
    const coverImage=await uploadOnCloudinary(coverImageLocalPath)
    if (!coverImage.url){
        throw new apiError(400,"error while uploading avatar")
    }
    const previousfilePath=req.user?.coverImage
    if(previousfilePath){
        await deleteOnCloudinary(previousfilePath)
    }

    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set:{
                coverImage:coverImage.url
            }
        },
        {new:true}
    ).select("-password -refreshToken")

    return res.status(200)
              .json(new apiResponse(200,user,"coverImage successfully uploaded"))
})






export {
    registerUser,
    loginUser,
    logoutUser,
    refreshAccessToken,
    changeCurrentPassword,
    getCurrentUser,
    updateAccountDetails,
    updateUserAvatar,
    updateUserCoverImage
}