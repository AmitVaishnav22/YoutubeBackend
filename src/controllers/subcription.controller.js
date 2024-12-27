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

export{
    toggleSubcription
}