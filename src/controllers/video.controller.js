import {asyncHandler} from "../utils/asyncHandler.js"
import {apiError} from "../utils/apiError.js"
import {apiResponse} from "../utils/apiResponse.js"
import {Video} from "../models/video.model.js"
import { uploadOnCloudinary,deleteOnCloudinary } from "../utils/cloudinary.js"


const publishVideo=asyncHandler(async (req,res)=>{
    const {title,description}=req.body
    const videoFile=req.files?.videoFile[0]?.path
    const thumbnail=req.files?.thumbnail[0]?.path
    // console.log(videoFile)
    // console.log(title)
    const owner=req.user._id
    if(!videoFile && !thumbnail && !title && !description){
        throw new apiError(400,"Video and Thumbnail are Required")
    }
    const videoFilePath=await uploadOnCloudinary(videoFile)
    if(!videoFilePath){
        throw new apiError(500,"Fail to upload Video")
    }
    const thumbnailPath=await uploadOnCloudinary(thumbnail)
    if(!thumbnailPath){
        throw new apiError(500,"Fail to upload Thumbnail")
    }
    const video = await Video.create({
        videoFile:videoFilePath.url,
        thumbnail:thumbnailPath.url,
        title,
        description,
        duration:videoFilePath.duration,
        owner
    })
    if (!video) {
        throw new apiError(500, "Fail to Publish Video")
    }
    return res.status(200)
              .json(new apiResponse(200,video,"Video Published Successfully"))
    
})


export {
    publishVideo
}