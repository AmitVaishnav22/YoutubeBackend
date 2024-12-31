import { Router } from "express";
import { toggleCommentLike,getLikedVideos, toggleVideoLike } from "../controllers/like.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();

router.use(verifyJWT);

router.route("/t/v/:videoId").post(toggleVideoLike)
router.route("/t/c/:commentId").post(toggleCommentLike)
router.route("/videos").get(getLikedVideos)


export default router;
