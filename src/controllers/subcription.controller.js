import { asyncHandler } from "../utils/asyncHandler.js";
import { apiError } from "../utils/apiError.js";
import { apiResponse } from "../utils/apiResponse.js";
import { Subscription } from "../models/subcription.model.js";
import { User } from "../models/user.model.js";
import mongoose,{isValidObjectId} from "mongoose";

const toggleSubcription=asyncHandler(async(req,res)=>{

    // take channelId from url and take if the channel exits in DB and take currentUser from 
    // middleware and check if the current user is already subscribed to the channel or not
    // and then do it accordingly

    const { channelId } = req.params

    if(!isValidObjectId(channelId)){
        throw new apiError(400,"Invalid channelId")
    }
    try {

        const getSubscription=await Subscription.findOne({
            subscriber:req.user._id,
            channel:channelId
        })
        if(getSubscription){
            const deleteSubcription=await Subscription.findByIdAndDelete(getSubscription._id)
            if (deleteSubcription){
                return res.status(200)
                          .json(new apiResponse(200,deleteSubcription,"Unsubcribed successfully"))
            }
        }
        
            const newSubcription=await Subscription.create({
                subscriber:req.user._id,
                channel:channelId
            })
            if(newSubcription){
                return res.status(200)
                          .json(new apiResponse(200,newSubcription,"Subcribed successfully"))
            }
        
    } catch (error) {
        console.log(error)
    }

})


const getUserChannelSubscriptions=asyncHandler(async(req,res)=>{
    //To create a proper controller for returning the list of subscribers of a channel using your existing
    //subscriptionSchema, you need to query the database for all subscriptions where the channel field matches the provided channelId
    const {channelId}=req.params
    if(!isValidObjectId(channelId)){
        throw new apiError(400,"Invalid channelId")
    }
    try {
        const subcribers=await Subscription.aggregate([
            {
                $match:{
                    channel : new mongoose.Types.ObjectId(channelId)
                }
            },
            {
                $lookup:{
                    from:"users",
                    localField:"subscriber",
                    foreignField:"_id",
                    as:"subscribers"
                }
            },
            {
                $unwind:"$subscribers"
            },
            {
                $project:{
                    _id:1,
                    "subscribers._id":1,
                    "subscribers.email":1,
                    "subscribers.username":1,
                    "subscribers.avatar":1
                }
            }
        ])
        if (!subcribers || subcribers.length===0){
            throw new apiError(404,"No subcribers found")
        }
        console.log(subcribers)
        return res.status(200)
                  .json(new apiResponse(200,subcribers,"Subcribers found"))
    } catch (error) {
        console.log(error)
    }
})

const getSubscribedChannels=asyncHandler(async(req,res)=>{
    //To create a proper controller for returning the list of channels that a user is subscribed to using your existing
    //subscriptionSchema, you need to query the database for all subscriptions where the subscriber field matches the current user's _id
    const {channelId}=req.params
    if(!isValidObjectId(channelId)){
        throw new apiError(400,"Invalid channelId")
    }
    try {
        const subscribedChannels=await Subscription.aggregate([
            {
                $match:{
                    subscriber : new mongoose.Types.ObjectId(channelId)
                }
            },
            {
                $lookup:{
                    from:"users",
                    localField:"channel",
                    foreignField:"_id",
                    as:"channels"
                }
            },
            {
                $unwind:"$channels"
            },
            {
                $project:{
                    _id:1,
                    "channels._id":1,
                    "channels.email":1,
                    "channels.username":1,
                    "channels.avatar":1
                }
            }
        ])
        if (!subscribedChannels || subscribedChannels.length===0){
            throw new apiError(404,"No subscribed channels found")
        }
        console.log(subscribedChannels)
        return res.status(200)
                  .json(new apiResponse(200,subscribedChannels,"Subscribed channels found"))
    } catch (error) {
        console.log(error)
    }
})
export{
    toggleSubcription,
    getUserChannelSubscriptions,
    getSubscribedChannels
}