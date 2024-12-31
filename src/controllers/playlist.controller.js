import { asyncHandler } from "../utils/asyncHandler.js";
import { apiResponse } from "../utils/apiResponse.js";
import { apiError} from "../utils/apiError.js";
import { Playlist } from "../models/playlist.model.js";
import mongoose,{ isValidObjectId ,Types} from "mongoose";


const createPlaylist=asyncHandler(async(req,res)=>{
    const {name,description}=req.body
    if(!name || !description){
        throw new apiError(400,"Please provide name and description")
    }
    const playlist=await Playlist.create({
        name,
        description,
        owner:req.user._id
    })
    if(!playlist){
        throw new apiError(400,"Something went wrong while creating playlist")
    }
    return res.status(201)
              .json(new apiResponse(201,playlist,"Playlist created successfully"))
})

const addVideoToPlaylist = asyncHandler(async (req, res) => {
    const { videoId,playlistId } = req.params;

    // Validate playlistId and videoId
    // if (!playlistId || !videoId || !isValidObjectId(playlistId) || !isValidObjectId(videoId)) {
    //     throw new apiError(400, "Please provide valid playlistId and videoId");
    // }

    // Check if the video is already in the playlist
    const getVideo = await Playlist.findOne({ _id: playlistId, videos: videoId });

    if (getVideo) {
        return res.status(400).json(new apiResponse(400, null, "Video already added to playlist"));
    }

    const updatedPlaylist = await Playlist.findByIdAndUpdate(
        playlistId,
        { $push: { videos: videoId } },
        { new: true }
    );

    if (updatedPlaylist) {
        return res.status(200).json(new apiResponse(200, updatedPlaylist, "Video added to playlist successfully"));
    }

    return res.status(400).json(new apiResponse(400, null, "Something went wrong while adding video to playlist"));
});

const removeVideoFromPlaylist=asyncHandler(async(req,res)=>{
    const {videoId,playlistId}=req.params
    // if(!playlistId && !videoId && !isValidObjectId(playlistId) && !isValidObjectId(videoId)){
    //     throw new apiError(400,"Please provide playlistId and videoId (invalid Fetch)")
    // }
    const getVideo = await Playlist.findOne({ _id: playlistId, videos: new Types.ObjectId(videoId)  })
        if (!getVideo) {
            return res
                .status(404)
                .json(new apiResponse(404, null, "Video not found in playlist"))
        }
    console.log(getVideo)
    const removeVideoFromPlaylist = await Playlist.findByIdAndUpdate(playlistId, {
        $pull: {
                videos: videoId
            }
        },{new:true})
    if (removeVideoFromPlaylist) {
        return res
            .status(200)
            .json(new apiResponse(200, removeVideoFromPlaylist, "Video removed from playlist successfully"))
        }
    return res
        .status(500)
        .json(new apiResponse(500, null, "Something went wrong at removing video from playlist"))
})

const deletePlaylist=asyncHandler(async(req,res)=>{
    const {playlistId}=req.params
    if(!playlistId || !isValidObjectId(playlistId)){
        throw new apiError(400,"Please provide playlistId (invalid Fetch)")
    }
    const playlist=await Playlist.findByIdAndDelete(playlistId)
    if(!playlist){
        throw new apiError(404,"Playlist not found")
    }
    return res.status(200)
              .json(new apiResponse(200,{},"Playlist deleted successfully"))
})

const updatePlaylist=asyncHandler(async(req,res)=>{
    const {playlistId}=req.params
    const {name,description}=req.body
    if(!playlistId || !isValidObjectId(playlistId)){
        throw new apiError(400,"Please provide playlistId (invalid Fetch)")
    }
    if(!name || !description){
        throw new apiError(400,"Please provide name and description that you want to update")
    }
    const playlist=await Playlist.findByIdAndUpdate(playlistId,{
        name,
        description
    },{new:true})
    if(!playlist){
        throw new apiError(404,"Playlist not found")
    }
    return res.status(200)
              .json(new apiResponse(200,playlist,"Playlist updated successfully"))
})

const getPlatlistById=asyncHandler(async(req,res)=>{
    const {playlistId}=req.params
    if(!playlistId || !isValidObjectId(playlistId)){
        throw new apiError(400,"Please provide playlistId (invalid Fetch)")
    }
    const playlist=await Playlist.findById(playlistId)
    if(!playlist){
        throw new apiError(404,"Playlist not found")
    }
    return res.status(200)
              .json(new apiResponse(200,playlist,"Playlist fetched successfully"))
})

const getUserPlaylists=asyncHandler(async(req,res)=>{
    const {userId}=req.params
    if(!userId || !isValidObjectId(userId)){
        throw new apiError(400,"Please provide userId (invalid Fetch)")
    }
    const playlist=await Playlist.aggregate([{
        $match:{
            owner:new mongoose.Types.ObjectId(userId)
        },
    },{
        $project:{
            _id:1,
            name:1,
            description:1,
            videos:1
        }
    }])
    if(!playlist || playlist.length===0){
        throw new apiError(404,"Playlist not found")
    }
    return res.status(200)
              .json(new apiResponse(200,playlist,"User Playlist fetched successfully"))
})


export {
    createPlaylist,
    addVideoToPlaylist,
    removeVideoFromPlaylist,
    deletePlaylist,
    updatePlaylist,
    getPlatlistById,
    getUserPlaylists
}