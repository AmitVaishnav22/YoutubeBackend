import {asyncHandler} from "../utils/asyncHandler.js"
import {apiError} from "../utils/apiError.js"
import {apiResponse} from "../utils/apiResponse.js"
import {Video} from "../models/video.model.js"
import { uploadOnCloudinary,deleteOnCloudinary } from "../utils/cloudinary.js"
import { User } from "../models/user.model.js"
import mongoose from "mongoose"


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

const getVideoById=asyncHandler(async(req,res)=>{
    const {videoId}=req.params
    const video=await Video.findById(videoId)
    if(!video){
        throw new apiError(404,"Video Not Found")
    }
    return res.status(200)
              .json(new apiResponse(200,video,"Video Found Successfully"))

})

const updateVideo=asyncHandler(async(req,res)=>{
    const {videoId}=req.params
    const {title,description}=req.body
    const thumbnail=req.files?.thumbnail[0]?.path
    const video=await Video.findById(videoId)
    if(!video){
        throw new apiError(404,"Video Not Found")
    }
    if(req.user._id.toString()!==video.owner.toString()){
        throw new apiError(403,"You are not allowed to update this video")
    }
    if (!title && !description) {
        throw new apiError(400, "Title and Description are required");
    }
    if(thumbnail){
        const thumbnailPath=await uploadOnCloudinary(thumbnail)
        if(!thumbnailPath){
            throw new apiError(500,"Fail to upload Thumbnail")
        }
        await deleteOnCloudinary(video.thumbnail)
        video.thumbnail=thumbnailPath.url
        await video.save()
    }
    const updatedVideoDetails=await Video.findByIdAndUpdate(
        videoId,
        {
            title,
            description,
        },
        {
            new:true
        }
    )
    if(!updatedVideoDetails){
        throw new apiError(500,"Fail to Update Video")
    }
    return res.status(200)
              .json(new apiResponse(200,updatedVideoDetails,"VideoDetails Updated Successfully"))
})

const deleteVideo=asyncHandler(async(req,res)=>{
    const {videoId}=req.params
    const video=await Video.findById(videoId)
    if(!video){
        throw new apiError(404,"Video Not Found")
    }
    if(req.user._id.toString()!==video.owner.toString()){
        throw new apiError(403,"You are not allowed to delete this video")
    }
    await deleteOnCloudinary(video.videoFile)
    await deleteOnCloudinary(video.thumbnail)
    await Video.findByIdAndDelete(videoId)
    return res.status(200)
            .json(new apiResponse(200,{},"Video Deleted Successfully"))
})

const togglePublishStatus=asyncHandler(async(req,res)=>{
    const {videoId}=req.params
    const video=await Video.findById(videoId)
    if(!video){
        throw new apiError(404,"Video Not Found")
    }
    if(req.user._id.toString()!==video.owner.toString()){
        throw new apiError(403,"You are not allowed to update this video")
    }
    video.isPublished=!video.isPublished
    await video.save()
    return res.status(200)
            .json(new apiResponse(200,video.isPublished,"Video Publish Status Updated Successfully"))
})


const getAllVideos=asyncHandler(async(req,res)=>{
    const {page=1,limit=10,query,sortBy,sortType,userId}=req.query
    const sortOrder=sortType==="asc"?1:-1
    let aggregatePipeline=[]
    if(query){
        aggregatePipeline.push({
            $match:{
                title:{
                    $regex:query,
                    $options:"i"
                }
            }
        })
    }
    if(userId){
        aggregatePipeline.push({
            $match:{
                owner:new mongoose.Types.ObjectId(userId)
            }
        })
    }
    //owner details
    aggregatePipeline.push({
        $lookup:{
            from:"users",
            localField:"owner",
            foreignField:"_id",
            as:"owner"
        }
    })
    aggregatePipeline.push({
        $unwind:"$owner"
    })
    aggregatePipeline.push({
        $lookup:{
            from:"likes",
            localField:"_id",
            foreignField:"video",
            as:"likes"
        }
    })
    aggregatePipeline.push({
        $lookup:{
            from:"comments",
            localField:"_id",
            foreignField:"video",
            as:"comments"
        }
    })
    aggregatePipeline.push({
        $project:{
            videoFile:1,
            thumbnail:1,
            title:1,
            description:1,
            duration:1,
            views:1,
            isPublished:1,
            owner:{
                _id:"$owner._id",
                username:"$owner.username",
                email:"$owner.email",
                avatar:"$owner.avatar"
            },
            likes:{
                $size:"$likes"
            },
            comments:{
                $size:"$comments"
            },
            createdAt:1,
            updatedAt:1
        }
    })
    aggregatePipeline.push({
        $sort:{
            [sortBy]:sortOrder
        }
    })
    const options={
        page:parseInt(page),
        limit:parseInt(limit),
        customLabels:{
            totalDocs:"totalVideos",
            docs:"videos"
        }
    }

    try {
        const allVideos=await Video.aggregatePaginate(Video.aggregate(aggregatePipeline),options)
        if (!allVideos) {
            throw new apiError(404, "Videos Not Found");
        }
        return res.status(200)
                  .json(new apiResponse(200,
                    {
                        videos:allVideos.videos,
                        totalVideos:allVideos.totalVideos,
                        page:allVideos.page,
                        totalPages:allVideos.totalPages,
                        limit:allVideos.limit
                    }
                    ,"Videos Fetched Successfully"))
    } catch (error) {
        console.log(error)
    }
})
export {
    publishVideo,
    getVideoById,
    updateVideo,
    deleteVideo,
    togglePublishStatus,
    getAllVideos
}