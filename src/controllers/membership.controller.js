import mongoose from "mongoose";
import { apiError } from "../utils/apiError.js";
import { apiResponse } from "../utils/apiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import {Membership} from "../models/membership.model.js";
import {delCache,setCache,getCache} from "../redis/client.redis.js";

const createMembership = asyncHandler(async (req, res) => {
    const { channel, price, tier} = req.body;
    const user = req.user?._id;
    //console.log(user)
    if (!channel ||!price ||!tier) {
        throw new apiError(400, "Please provide all required fields");
    }
    if(channel.toString()===user.toString()){
        throw new apiError(400, "You can't purchase membership to your own channel");
    }
    const existingMembership = await Membership.findOne({
        channel,
        user
    });
    if (existingMembership) {
        throw new apiError(400, "You've already have membership to this channel");
    }
    const membership = await Membership.create({
        channel,
        user:user,
        price,
        tier,
        status:"active"
    });
    if (!membership) {
        throw new apiError(500, "Failed to create membership");
    }
    await delCache(`userMemberships:${user}`);
    return res.status(201).json(new apiResponse(201, membership, "Membership created successfully"));
})

const getMyMemberships = asyncHandler(async (req, res) => {
    //console.log(req.user?._id)
    const cachedMemberships = await getCache(`userMemberships:${req.user?._id}`);
    if (cachedMemberships) {
        return res.status(200)
                    .json(new apiResponse(200, cachedMemberships, "My Memberships from redis"));
    }
    const memberships=await Membership.aggregate([
        {
            $match:{
                user:new mongoose.Types.ObjectId(req.user?._id)
            }
        },
        {
            $lookup:{
                from:"users",
                localField:"channel",
                foreignField:"_id", 
                as:"channel"
            }
        },
        {
            $unwind:"$channel"
        },
        {
            $lookup:{
                from:"subscriptions",
                localField:"channel._id",
                foreignField:"channel",
                as:"subscribers"
            }
        },
        {
            $addFields:{
                channelsubcount:{$size:"$subscribers"}
            }
        },
        {
            $project:{
                channelname:"$channel.username",
                channelimage:"$channel.avatar",
                channelsubcount:1,
                price:1,
                tier:1,
                status:1
            }
        }
    ])
    if(!memberships || memberships.length==0){
        throw new apiError(404,"No memberships found")
    }
    await setCache(`userMemberships:${req.user?._id}`, memberships, 3600);
    return res.status(200)
              .json(new apiResponse(200,memberships,"My Memberships"))
})


export const cancelMembership = asyncHandler(async (req, res) => {
    const {membershipId} = req.params;
    const cancelMembership=await Membership.findByIdAndUpdate(membershipId,{
        status:"cancelled"
    })
    if(!cancelMembership){
        throw new apiError(404,"Membership not found")
    }
    await delCache(`userMemberships:${req.user?._id}`);
    return res.status(200)
              .json(new apiResponse(200,cancelMembership,"Membership cancelled successfully"))
})

const upgradeMembership= asyncHandler(async(req,res)=>{
    const {membershipId} = req.params;
    const {tier,price} = req.body;
    const membershipUpgrades = await Membership.findByIdAndUpdate(membershipId,{
        tier,
        price,
    })
    if(!membershipUpgrades){
        throw new apiError(404,"Membership not found")
    }
    await delCache(`userMemberships:${req.user?._id}`);
    return res.status(200)
              .json(new apiResponse(200,membershipUpgrades,"Membership upgraded successfully"))
})

export {
    createMembership,
    getMyMemberships,
    upgradeMembership
}