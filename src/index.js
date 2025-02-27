import connectDB from "./db/db.js";
import dotenv from "dotenv"
import {app} from "./app.js"
import cron from "node-cron"
import { syncLikes } from "./redis/syncLikes.redis.js";
dotenv.config({
    path:'./.env'
})

// cron.schedule("*/1 * * * *", async () => {
//     console.log("Running scheduled like sync...");
//     await syncLikes();
// });
connectDB().then(()=>{
    app.listen(process.env.PORT|| 8000,()=>{
        console.log(`Server running at port : ${process.env.PORT}`)
    })
}).catch((error)=>{
    console.log("MONGO DB CONNECTION ERROR",error)
})
  