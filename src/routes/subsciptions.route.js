import {Router} from 'express';
import {toggleSubcription,getUserChannelSubscriptions, getSubscribedChannels} from "../controllers/subcription.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router=Router()

//secured routes
router.route("/c/:channelId").post(verifyJWT,toggleSubcription)
router.route("/c/:channelId").get(verifyJWT,getUserChannelSubscriptions)
router.route("/u/:channelId").get(verifyJWT,getSubscribedChannels)
export default router 
