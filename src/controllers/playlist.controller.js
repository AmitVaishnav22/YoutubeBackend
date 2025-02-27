import { asyncHandler } from "../utils/asyncHandler.js";
import { apiResponse } from "../utils/apiResponse.js";
import { apiError} from "../utils/apiError.js";
import { Playlist } from "../models/playlist.model.js";
import mongoose,{ isValidObjectId ,Types} from "mongoose";
import { delCache,setCache,getCache } from "../redis/client.redis.js";


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
    await delCache(`userPlaylists:${req.user._id}`);
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
    await delCache(`playlist:${playlistId}`);
    await delCache(`userPlaylists:${req.user._id}`);

    if (updatedPlaylist) {
        return res.status(200).json(new apiResponse(200, updatedPlaylist, "Video added to playlist successfully"));
    }

    return res.status(400).json(new apiResponse(400, null, "Something went wrong while adding video to playlist"));
});

const removeVideoFromPlaylist=asyncHandler(async(req,res)=>{
    const {  videoId,playListId } = req.params;
    //console.log(videoId,playListId)
    try {
        if (!playListId && !videoId) {
            return res.status(400).json(new apiResponse(400, null, "Invalid playlist or video ID"));
        }

        const updatedPlaylist = await Playlist.findByIdAndUpdate(
            playListId, 
            { $pull: { videos: videoId } },
            { new: true } 
        );
        //console.log(updatedPlaylist)

        if (!updatedPlaylist) {
            return res.status(404).json(new apiResponse(404, null, "Video not found in playlist"));
        
        }
        await delCache(`playlist:${playListId}`);
        await delCache(`userPlaylists:${req.user._id}`);
        return res
            .status(200)
            .json(new apiResponse(200, updatedPlaylist, "Video removed from playlist successfully"));
    } catch (error) {
        console.error("Error removing video from playlist:", error);
        return res.status(500).json(new apiResponse(500, null, "Internal server error"));
    }
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
    await delCache(`playlist:${playlistId}`);
    await delCache(`userPlaylists:${req.user._id}`);
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
    await delCache(`playlist:${playlistId}`);
    await delCache(`userPlaylists:${req.user._id}`);
    return res.status(200)
              .json(new apiResponse(200,playlist,"Playlist updated successfully"))
})

const getPlatlistById=asyncHandler(async(req,res)=>{
    const {playlistId}=req.params
    if(!playlistId || !isValidObjectId(playlistId)){
        throw new apiError(400,"Please provide playlistId (invalid Fetch)")
    }
    const redisKey = `playlist:${playlistId}`;
    const cachedPlaylist = await getCache(redisKey);
    if (cachedPlaylist) {
        return res.status(200).json(new apiResponse(200, cachedPlaylist, "Playlist fetched from Redis"));
    }
    const playlist=await Playlist.findById(playlistId)
    if(!playlist){
        throw new apiError(404,"Playlist not found")
    }
    await setCache(redisKey, playlist, 3600);
    return res.status(200)
              .json(new apiResponse(200,playlist,"Playlist fetched successfully"))
})

const getUserPlaylists=asyncHandler(async(req,res)=>{
    const {userId}=req.params

    if(!userId || !isValidObjectId(userId)){
        throw new apiError(400,"Please provide userId (invalid Fetch)")
    }
    const redisKey = `userPlaylists:${userId}`;
    const cachedPlaylists = await getCache(redisKey);
    if (cachedPlaylists) {
        return res.status(200).json(new apiResponse(200, cachedPlaylists, "User Playlists fetched from Redis"));
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
    await setCache(redisKey, playlist, 3600);
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