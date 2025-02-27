import mongoose from "mongoose";
import { apiError } from "../utils/apiError.js";
import { apiResponse } from "../utils/apiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { Community } from "../models/community.model.js";
import { uploadOnCloudinary,deleteOnCloudinary } from "../utils/cloudinary.js";
import { delCache ,getCache,setCache} from "../redis/client.redis.js";


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

    await delCache(`userPosts:${req.user._id}`);

    return res.status(201).json(new apiResponse(201, post, "Post created successfully"));
});

const updateCommunityPostContent = asyncHandler(async (req, res) => {
    const { content } = req.body;
    const updatedContent=await Community.findByIdAndUpdate(req.params.postId, { content }, { new: true });
    if(!updatedContent){
        throw new apiError(404,"Post Not Found")
    }
    await delCache(`userPosts:${req.user._id}`);
    return res.status(200)
              .json(new apiResponse(200,updatedContent,"Post Updated Successfully"))
});

const updateCommunityPostImage = asyncHandler(async (req, res) => {
    const { postId } = req.params;
    const image = req.file?.path;
    const post = await Community.findById(postId);
    if (post.image) {
        try {
            const publicId = post.image.split('/').pop().split('.')[0]; // Extract Cloudinary public ID
            await deleteOnCloudinary(publicId);
        } catch (error) {
            throw new apiError(500, "Failed to delete previous image");
        }
    }

    const imagePath=await uploadOnCloudinary(image);
    //console.log(imagePath);
    const updatedPost=await Community.findByIdAndUpdate(postId,{image:imagePath?.url},{new:true})
    if(!updatedPost){
        throw new apiError(404,"Post Not Found")
    }
    await delCache(`userPosts:${req.user._id}`);
    return res.status(200).json(new apiResponse(200, updatedPost, "Post Updated Successfully"));
})

const deleteCommunityPost = asyncHandler(async (req, res) => {
    const {postId}=req.params
    const deletedPost=await Community.findByIdAndDelete(postId)
    if(!deletedPost){
        throw new apiError(404,"Post Not Found")
    }
    await delCache(`userPosts:${req.user._id}`);
    return res.status(200)
              .json(new apiResponse(200,{},"Post Deleted Successfully"))
})

const getUserPosts=asyncHandler(async(req,res)=>{
    const userId = req.user._id.toString();
    const redisKey = `userPosts:${userId}`;
    const cachedPosts = await getCache(redisKey);
    if (cachedPosts) {
        return res.status(200)
                  .json(new apiResponse(200, cachedPosts, "Posts fetched successfully from redis"));
    }
    const posts=await Community.aggregate([
        {
            $match:{
                owner:new mongoose.Types.ObjectId(req.user._id)
            }
        },
        {
            $lookup:{
                from:"likes", 
                localField:"_id",
                foreignField:"communityPost",
                as:"likes"
            }
        },
        {
            $lookup:{
                from:"comments",
                localField:"_id",
                foreignField:"communityPost",
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
    if(!posts || posts.length==0){
        throw new apiError(404,"No Post Found")
    }
    await setCache(redisKey, posts, 3600);
    return res.status(200)
              .json(new apiResponse(200,posts,"Posts successfully fetched"))
})

export {
    updateCommunityPostContent,
    updateCommunityPostImage,
    deleteCommunityPost,
    getUserPosts
}