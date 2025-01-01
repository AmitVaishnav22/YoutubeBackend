import mongoose from "mongoose";
import { asyncHandler } from "../utils/asyncHandler.js";
import { apiResponse } from "../utils/apiResponse.js";
import { apiError} from "../utils/apiError.js";
import { Like } from "../models/like.model.js";

const toggleVideoLike=asyncHandler(async(req,res)=>{
    const {videoId}=req.params
    if(!videoId){
        throw new apiError(400,"Please provide videoId")
    }
    const like=await Like.findOne({
        video:videoId,
        likedBy:req.user._id
    })
    if (like) {
        const likeToggle=await Like.findByIdAndDelete(like._id);
        if (!likeToggle) {
            throw new apiError(400,"Something went wrong while removing like")
        }
        return res.status(200).json(new apiResponse(200, null, "Like removed successfully"));
    }
    const newLike=await Like.create({
        video:videoId,
        likedBy:req.user._id
    })
    if (!newLike) {
        throw new apiError(400,"Something went wrong while adding like")
    }
    return res.status(200)
          .json(new apiResponse(200, newLike, "Like added successfully"));
})

const toggleCommentLike=asyncHandler(async(req,res)=>{
    const {commentId}=req.params
    if(!commentId){
        throw new apiError(400,"Please provide commentId")
    }
    const like=await Like.findOne({
        comment:commentId,
        likedBy:req.user._id
    })
    if(like){
        const likeToggle=await Like.findByIdAndDelete(like._id)
        if(!likeToggle){
            throw new apiError(400,"Something went wrong while removing like")
        }
        return res.status(200).json(new apiResponse(200,null,"Like removed successfully"))
    }
    const newLike=await Like.create({
        comment:commentId,
        likedBy:req.user._id
    })
    if(!newLike){
        throw new apiError(400,"Something went wrong while adding like")
    }
    return res.status(200)
              .json(new apiResponse(200,newLike,"Like added successfully"))
})

const getLikedVideos=asyncHandler(async(req,res)=>{
    const userLikedVideos=await Like.aggregate([{
        $match:{
            likedBy:new mongoose.Types.ObjectId(req.user._id),
            video:{$exists:true}
        }
    },
    {
        $project:{
            video:1
        }
    }
])
    if (!userLikedVideos || userLikedVideos.length===0) {
        throw new apiError(400,"No liked videos found")
    }
    return res.status(200)
              .json(new apiResponse(200,userLikedVideos,"Liked videos fetched successfully"))
})

const toggleCummunityPostLike=asyncHandler(async(req,res)=>{
    const {postId}=req.params
    if(!postId){
        throw new apiError(400,"Please provide postId")
    }
    const like=await Like.findOne({
        communityPost:postId,
        likedBy:req.user._id
    })
    if(like){
        const likeToggle=await Like.findByIdAndDelete(like._id)
        if(!likeToggle){
            throw new apiError(400,"Something went wrong while removing like")
        }
        return res.status(200).json(new apiResponse(200,null,"Like removed successfully"))
    }
    const newLike=await Like.create({
        communityPost:postId,
        likedBy:req.user._id
    })
    if(!newLike){
        throw new apiError(400,"Something went wrong while adding like")
    }
    return res.status(200)
              .json(new apiResponse(200,newLike,"Like added successfully"))
})

export {
    toggleVideoLike,
    toggleCommentLike,
    getLikedVideos,
    toggleCummunityPostLike
}      
