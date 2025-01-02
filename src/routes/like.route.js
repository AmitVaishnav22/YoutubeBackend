import { Router } from "express";
import { toggleCommentLike,getLikedVideos, toggleVideoLike ,toggleCummunityPostLike} from "../controllers/like.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();

router.use(verifyJWT);

router.route("/t/v/:videoId").post(toggleVideoLike)
router.route("/t/c/:commentId").post(toggleCommentLike)
router.route("/t/cp/:postId").post(toggleCummunityPostLike)
router.route("/videos").get(getLikedVideos)


export default router;
