import { Router } from "express";
import {createCommunityPost,updateCommunityPostImage,updateCommunityPostContent,deleteCommunityPost,getUserPosts} from "../controllers/community.controller.js"
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
router.route("/:postId").patch(upload.single("image"),updateCommunityPostImage).delete(deleteCommunityPost);
router.route("/u/:postId").patch(updateCommunityPostContent)
router.route("/user").get(getUserPosts);


export default router;
