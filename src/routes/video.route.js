import {Router} from 'express';
import {verifyJWT} from "../middlewares/auth.middleware.js";
import {publishVideo,getVideoById,updateVideo,deleteVideo,togglePublishStatus, getAllVideos} from "../controllers/video.controller.js";
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
router
    .route("/:videoId")
    .get(getVideoById)
    .patch(upload.single("thumbnail"), updateVideo)
    .delete(deleteVideo)
router.route("/publish/:videoId").patch(togglePublishStatus)
router.route("/").get(getAllVideos)
export default router