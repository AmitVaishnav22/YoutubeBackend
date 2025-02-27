import mongoose from "mongoose";
import { asyncHandler } from "../utils/asyncHandler.js";
import { apiResponse } from "../utils/apiResponse.js";
import { apiError} from "../utils/apiError.js";
import { Like } from "../models/like.model.js";
import { getCache ,setCache} from "../redis/client.redis.js";
const toggleVideoLike = asyncHandler(async (req, res) => {
    const { videoId } = req.params;
    if (!videoId) {
        throw new apiError(400, "Please provide videoId");
    }

//     const userId = req.user?._id?.toString();
//     const redisKey = `video_likes:${videoId}`;
//     const isLiked = await isMemberOfSet(redisKey, userId);
//     if (isLiked) {
//         await removeFromSet(redisKey, userId);
//     } else {
//         await addToSet(redisKey, userId);
//     }
//     const dbLikeCount = await Like.countDocuments({ video: videoId });
//     const redisLikeCount = await client.sCard(redisKey);
//     const totalLikeCount = dbLikeCount + redisLikeCount;

//     return res.status(200).json(new apiResponse(200, { likeCount: totalLikeCount }, isLiked ? "Like removed" : "Like added"));
// });
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
});

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
    const userId=req.user._id.toString()
   // console.log(userId)
    const redisKey=`likedVideos:${userId}`
    try {
        const cachedVideos=await getCache(redisKey)
        //console.log(cachedVideos)
        if (cachedVideos) {
            return res.status(200)
                      .json(new apiResponse(200,cachedVideos,"Liked videos fetched successfully from redis"))
        }
        const userLikedVideos=await Like.aggregate([{
            $match:{
                likedBy:new mongoose.Types.ObjectId(req.user._id),
                video:{$exists:true}
            }
        },
        {
            $lookup:{
                from:"videos",
                localField:"video",
                foreignField:"_id",
                as:"video"
            }
        },
        {
            $unwind:"$video"
        },
        {
            $project:{
                _id:1,
                video:"$video"
            }
        }])
        //console.log(userLikedVideos)
        if (!userLikedVideos || userLikedVideos.length === 0) {
            throw new apiError(400, "No liked videos found");
        }
        await setCache(redisKey, userLikedVideos, 3);
        return res.status(200)
                  .json(new apiResponse(200, userLikedVideos, "Liked videos fetched successfully"));
    } catch (error) {
        throw new apiError(500, "Something went wrong while fetching liked videos");
        
    }
})

const toggleCummunityPostLike=asyncHandler(async(req,res)=>{
    const {postId}=req.params
    //console.log(postId)
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
