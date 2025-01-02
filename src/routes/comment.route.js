import { Router} from "express";
import { addComment,updateComment,deleteComment,getVideoComments,addCommentC,getCommunityCommentsC } from "../controllers/comment.controller.js";

import { verifyJWT } from "../middlewares/auth.middleware.js"

const router = Router();

router.use(verifyJWT)

router.route("/:videoId").get(getVideoComments).post(addComment)
router.route("/c/:commentId").delete(deleteComment).patch(updateComment)

router.route("/c/:postId").get(getCommunityCommentsC).post(addCommentC)

export default router;
