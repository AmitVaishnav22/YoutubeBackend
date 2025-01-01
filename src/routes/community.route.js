import { Router } from "express";
import {createCommunityPost,updateCommunityPost,deleteCommunityPost,getUserPosts} from "../controllers/community.controller.js"
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { upload } from "../middlewares/multer.middleware.js";

const router = Router();


router.use(verifyJWT);
 
router.route("/").post(upload.fields([
    {
        name:"image",
        maxCount:1
    }
]),createCommunityPost);
router.route("/:postId").patch(upload.single("image"),updateCommunityPost)
                        .delete(deleteCommunityPost);
router.route("/user/:userId").get(getUserPosts);


export default router;
