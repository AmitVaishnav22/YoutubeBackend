import {Router} from 'express';
import { createPlaylist,addVideoToPlaylist,removeVideoFromPlaylist,deletePlaylist,updatePlaylist,getPlatlistById,getUserPlaylists } from '../controllers/playlist.controller.js';
import {verifyJWT} from '../middlewares/auth.middleware.js';

const router=Router()
router.use(verifyJWT)

router.route("/").post(createPlaylist)
router
     .route("/:playlistId")
     .get(getPlatlistById)
     .patch(updatePlaylist)
     .delete(deletePlaylist)

router.route("/add/:videoId/:playlistId").patch(addVideoToPlaylist);
router.route("/remove/:videoId/:playListId").delete(removeVideoFromPlaylist)
router.route("/u/:userId").get(getUserPlaylists)

export default router   