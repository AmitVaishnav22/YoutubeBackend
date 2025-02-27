import mongoose from "mongoose"
import {asyncHandler} from "../utils/asyncHandler.js"
import { apiResponse } from "../utils/apiResponse.js"
import { apiError} from "../utils/apiError.js"
import {Video} from "../models/video.model.js"
import {getCache,setCache} from "../redis/client.redis.js"



const getChannelStats=asyncHandler(async(req,res)=>{

    // channel joined/created can be taken care at frontend (getting timestamps of the user)
    const userId = req.user._id.toString();
    const redisKey = `channelStats:${userId}`;
    const cachedStats = await getCache(redisKey);
    if (cachedStats) {
        return res.status(200).json(new apiResponse(200, cachedStats, "Channel Stats fetched from Redis"));
    }
    const channelStats=await Video.aggregate([{
        $match:{
            owner:new mongoose.Types.ObjectId(req.user._id)
        }
    },{
        $lookup:{
            from:"likes",
            localField:"_id",
            foreignField:"video",
            as:"likes"
        }
    },{
        $lookup:{
            from:"subscriptions",
            localField:"owner",
            foreignField:"channel",
            as:"subscribers"
        }
    },    
    {
        $group:{
            _id:null,
            totalVideos:{$sum:1},
            totalViews:{$sum:"$views"},
            totalLikes:{$sum:{$size:"$likes"}},
            totalSubscribers:{$sum:{$size:"$subscribers"}}
        }
    },{
        $project:{
            _id:0,
            totalVideos:1,
            totalViews:1,
            totalLikes:1,
            totalSubscribers:1
        }
    }])

    if(!channelStats || channelStats.length==0){
        throw new apiError(404,"Channel Stats not found")
    }
    await setCache(redisKey, channelStats[0], 3600);
    //console.log(channelStats)
    return res.status(200)
              .json(new apiResponse(200,channelStats[0],"Channel Stats successfully fetched"))
})


const getChannelVideos=asyncHandler(async(req,res)=>{
    // pagination is taken care at frontend
    const userId = req.user._id.toString();
    const redisKey = `channelVideos:${userId}`;
    const cachedVideos = await getCache(redisKey);
    if (cachedVideos) {
        return res.status(200).json(new apiResponse(200, cachedVideos, "Channel Videos fetched from Redis"));
    }
    const channelVideos=await Video.aggregate([
        {
            $match:{
                owner:new mongoose.Types.ObjectId(req.user._id)
            }
        },
        {
            $lookup:{
                from:"likes",
                localField:"_id",
                foreignField:"video",
                as:"likes"
            }
        },{
            $lookup:{
                from:"comments",
                localField:"_id", 
                foreignField:"video",
                as:"comments"
            }
        },
        {
            $project:{
                _id:1,
                title:1,
                description:1,
                videoFile:1,
                thumbnail:1,
                createdAt:1,
                duration:1,
                views:1,
                isPublished:1,
                likes:{$size:"$likes"},
                comments:{$size:"$comments"}
            }
        }
    ])
    if(!channelVideos || channelVideos.length==0){
        throw new apiError(404,"Channel Videos not found")
    }
    await setCache(redisKey, channelVideos, 3600);
    //console.log(channelVideos)
    return res.status(200)
              .json(new apiResponse(200,channelVideos,"Channel Videos successfully fetched"))
})

export {
    getChannelStats,
    getChannelVideos
}