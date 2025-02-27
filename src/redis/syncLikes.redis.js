import { Like } from "../models/like.model.js";
import { client } from "./client.redis.js";
import mongoose from "mongoose";

const syncLikes=async()=>{
    try {
        console.log("Syncing likes from Redis to DB...");
        const keys = await client.keys("video_likes:*");

        for (const key of keys) {
            const videoId = key.split(":")[1];
            const likedUsers = await client.sMembers(key);

            // ✅ Only insert new likes (skip existing ones)
            const newLikes = likedUsers.map(userId => ({ video: videoId, likedBy: userId }));
            await Like.insertMany(newLikes, { ordered: false }).catch(() => {}); // Ignore duplicates

            // ✅ Clear Redis after syncing
            await client.del(key);
    }
    } catch (error) {
        console.error("Error syncing likes:", error);   
    }
}

export {syncLikes}