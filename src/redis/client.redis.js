import { createClient } from "redis";

const client= createClient({
    username: process.env.REDIS_USERNAME,
    password: process.env.REDIS_PASSWORD,
    socket: {
        host: process.env.REDIS_HOST,
        port: process.env.REDIS_PORT
    }
})

client.on("connect", () => {
    console.log("Redis client connected")
})
client.on("error", (err) => {
    console.log("Redis client error", err)
})
const connectRedis = async () => {
    try {
        await client.connect();
        console.log("Redis connected successfully");
    } catch (error) {
        console.error("Failed to connect to Redis:", error);
    }
};

// Call the function
connectRedis();

const setCache=async (key,val,expiration) => {
    try {
        await client.setEx(key,expiration,JSON.stringify(val));
    } catch (error) {
        console.log(`Error setting cache ${key}`, error)
    }
}

const getCache=async (key) => {
    try {
        const cachedData= await client.get(key)
        if(cachedData){
            return JSON.parse(cachedData)
        }
        return null
    } catch (error) {
        console.log(`Error getting cache ${key}`, error)
        return null
    }
}

const delCache=async (key) => {
    try {
        await client.del(key)
    } catch (error) {
        console.log(`Error deleting cache ${key}`, error)
    }
}

const clearCacheByPattern=async (pattern) =>{
    try {
        const keys= await client.keys(pattern)
        if(keys.length>0){
            await client.del(keys)
        }
    } catch (error) {
        console.log(`Error clearing cache by pattern ${pattern}`, error)
    }
}

export { setCache, getCache, delCache ,clearCacheByPattern}  