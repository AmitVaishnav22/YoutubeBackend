import {Router} from 'express';
import {verifyJWT} from "../middlewares/auth.middleware.js";
import {publishVideo} from "../controllers/video.controller.js";
import {upload} from "../middlewares/multer.middleware.js";


const router=Router()
router.use(verifyJWT)  //apply middleware to all routes

router.post("/publish",
    upload.fields([
        {
            name:"videoFile",
            maxCount:1
        },{
            name:"thumbnail",
            maxCount:1
        }
    ]),
    publishVideo
)

export default router