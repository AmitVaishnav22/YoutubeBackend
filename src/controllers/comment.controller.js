import mongoose from "mongoose";
import { asyncHandler } from "../utils/asyncHandler.js";
import { apiResponse } from "../utils/apiResponse.js";
import { apiError} from "../utils/apiError.js";
import { Comment } from "../models/comment.model.js";
import { getCache,setCache,delCache } from "../redis/client.redis.js";


const addComment=asyncHandler(async(req,res)=>{
    const {videoId}=req.params
    const { content }=req.body
    if (!videoId || !content){
        throw new apiError(400,"please enter your comment to a video")
    }
    const comment=await Comment.create({
        content,
        video:videoId,
        owner:req.user._id
    })
    if(!comment){
        throw new apiError(400,"something went wrong while commenting")
    }
    await delCache(`videoComments:${videoId}`);
    return res.status(200)
              .json(new apiResponse(200,comment,"comment successfully added"))
})

const addCommentC=asyncHandler(async(req,res)=>{
    const {postId}=req.params
    const { content }=req.body
    if (!postId || !content){
        throw new apiError(400,"please enter your comment to a Post")
    }
    const comment=await Comment.create({
        content,
        communityPost:postId,
        owner:req.user._id
    })
    if(!comment){
        throw new apiError(400,"something went wrong while commenting")
    }
    await delCache(`postComments:${postId}`);

    return res.status(200)
              .json(new apiResponse(200,comment,"comment successfully added to communityPost"))
})





const updateComment=asyncHandler(async(req,res)=>{
    const {commentId}=req.params
    const { content }=req.body
    if (!commentId || !content){
        throw new apiError(400,"please enter your comment to a video")
    }
    const updatedComment=await Comment.findByIdAndUpdate(commentId,{
        content,
    },{new:true})
    if (!updatedComment){
        throw new apiError(400,"something went wrong while updating comment")
    }
    await delCache(`videoComments:*`);
    await delCache(`postComments:*`);
    return res.status(200)
              .json(new apiResponse(200,updatedComment,"comment updated successfully"))
})





const deleteComment=asyncHandler(async(req,res)=>{
    const {commentId}=req.params
    const comment= await Comment.findByIdAndDelete(commentId)
    if(!comment){
        throw new apiError(400,"something went wrong while deleting comment")
    }
    await delCache(`videoComments:*`);
    await delCache(`postComments:*`);
    return res.status(200)
              .json(new apiResponse(200,{},"comment deleted successfully"))
})

const getVideoComments=asyncHandler(async(req,res)=>{
    const {videoId}=req.params
    const {page=1,limit=10}=req.query 
    const skip = (parseInt(page) - 1) * parseInt(limit)
    const redisKey = `videoComments:${videoId}:${page}:${limit}`
    const cachedComments = await getCache(redisKey);
    if (cachedComments) {
        return res.status(200).json(new apiResponse(200, cachedComments, "Comments fetched successfully from Redis"));
    }
    const comments=await Comment.aggregate([{
        $match:{video:new mongoose.Types.ObjectId(videoId)}
    },
    {
        $lookup:{
            from: "users",
            localField: "owner",
            foreignField: "_id",
            as: "owner"
        }
    },{
        $unwind:"$owner"
    },
    {
        $project:{
            content:1,
            createdAt:1,
            owner:{
                _id:"$owner._id",
                username:"$owner.username",
                avatar:"$owner.avatar",
            }
        }
    },
    {$skip:skip},
    {$limit:parseInt(limit)}
])
    if(!comments.length){
        throw new apiError(400,"no comments found for this video")
    }
    await setCache(redisKey, comments, 3);
    return res.status(200)
              .json(new apiResponse(200,comments,"comments fetched successfully"))

})


const getCommunityCommentsC=asyncHandler(async(req,res)=>{
    const {postId}=req.params
    const {page=1,limit=10}=req.query 
    const skip = (parseInt(page) - 1) * parseInt(limit)

    const redisKey = `videoComments:${postId}:${page}:${limit}`
    const cachedComments = await getCache(redisKey);
    if (cachedComments) {
        return res.status(200).json(new apiResponse(200, cachedComments, "Comments fetched successfully from Redis"));
    }
    const comments=await Comment.aggregate([{
        $match:{communityPost:new mongoose.Types.ObjectId(postId)}
    },
    {
        $lookup:{
            from: "users",
            localField: "owner",
            foreignField: "_id",
            as: "owner"
        }
    },{
        $unwind:"$owner"
    },
    {
        $project:{
            content:1,
            createdAt:1,
            owner:{
                _id:"$owner._id",
                username:"$owner.username",
                avatar:"$owner.avatar",
            }
        }
    },
    {$skip:skip},
    {$limit:parseInt(limit)}
])
    if(!comments.length){
        throw new apiError(400,"no comments found for this post")
    }
    return res.status(200)
              .json(new apiResponse(200,comments,"comments fetched successfully"))

})


export {
    addComment,
    updateComment,
    deleteComment,
    getVideoComments,

    addCommentC,
    getCommunityCommentsC,
 
}                         