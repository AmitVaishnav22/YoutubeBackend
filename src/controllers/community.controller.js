import mongoose from "mongoose";
import { apiError } from "../utils/apiError.js";
import { apiResponse } from "../utils/apiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { Community } from "../models/community.model.js";
import { uploadOnCloudinary,deleteOnCloudinary } from "../utils/cloudinary.js";


export const createCommunityPost = asyncHandler(async (req, res) => {
    const { content } = req.body;
    const image = req.files?.image?.[0]?.path; 
    let imagePath = "";

    if (image) {
        try {
            const uploadedImage = await uploadOnCloudinary(image);
            imagePath = uploadedImage?.url || "";
        } catch (error) {
            throw new apiError(500, "Failed to upload image");
        }
    }

    const post = await Community.create({
        content:content,
        image: imagePath,
        owner: req.user._id,
    });

    if (!post) {
        throw new apiError(500, "Failed to create post");
    }

    return res.status(201).json(new apiResponse(201, post, "Post created successfully"));
});

const updateCommunityPost = asyncHandler(async (req, res) => {
    const { postId } = req.params;
    const { content } = req.body;
    const image = req.files?.image?.[0]?.path;

    const existingPost = await Community.findById(postId);
    if (!existingPost) {
        throw new apiError(404, "Post Not Found");
    }

    if (existingPost.owner.toString() !== req.user._id.toString()) {
        throw new apiError(403, "You are not authorized to update this post");
    }

    let imagePath;
    if (image) {
        try {
            imagePath = await uploadOnCloudinary(image);
        } catch (error) {
            throw new apiError(500, "Image upload failed");
        }
    }

    const previousFilePath = existingPost?.image;
    if (previousFilePath && imagePath) {
        await deleteOnCloudinary(previousFilePath);
    }

    if (!content && !imagePath) {
        throw new apiError(400, "No updates provided");
    }

    const updatedContent = await Community.findByIdAndUpdate(
        postId,
        {
            content: content || existingPost.content, 
            image: imagePath?.url || previousFilePath || imagePath?.url || "", 
        },
        { new: true }
    );

    if (!updatedContent) {
        throw new apiError(400, "Failed to update post");
    }

    return res.status(200).json(new apiResponse(200, updatedContent, "Post Updated Successfully"));
});


const deleteCommunityPost = asyncHandler(async (req, res) => {
    const {postId}=req.params
    const deletedPost=await Community.findByIdAndDelete(postId)
    if(!deletedPost){
        throw new apiError(404,"Post Not Found")
    }
    return res.status(200)
              .json(new apiResponse(200,{},"Post Deleted Successfully"))
})

const getUserPosts=asyncHandler(async(req,res)=>{
    const post=await Community.aggregate([
        {
            $match:{
                owner:new mongoose.Types.ObjectId(req.user._id)
            }
        },
        {
            $lookup:{
                from:"likes",
                localField:"_id",
                foreignField:"post",
                as:"likes"
            }
        },
        {
            $lookup:{
                from:"comments",
                localField:"_id",
                foreignField:"post",
                as:"comments"
            }
        },
        {
            $project:{
                _id:1,
                content:1,
                image:1,
                createdAt:1,
                likes:{$size:"$likes"},
                comments:{$size:"$comments"}
            }
        }
    ])
    if(!post || post.length==0){
        throw new apiError(404,"No Post Found")
    }
    return res.status(200)
              .json(new apiResponse(200,post,"Posts successfully fetched"))
})

export {
    updateCommunityPost,
    deleteCommunityPost,
    getUserPosts
}