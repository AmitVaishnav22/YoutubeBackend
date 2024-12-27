import {Router} from 'express';
import {toggleSubcription} from "../controllers/subcription.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router=Router()

//secured routes
router.route("/c/:channelId").post(verifyJWT,toggleSubcription)

export default router 
