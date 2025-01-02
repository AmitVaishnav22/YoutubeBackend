import { Router } from "express";
import { getMyMemberships,createMembership,upgradeMembership,cancelMembership } from "../controllers/membership.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();

router.use(verifyJWT);

router.route("/").post(createMembership)
router.route("/").get(getMyMemberships)
router.route("/:membershipId").patch(upgradeMembership)
router.route("/:membershipId").put(cancelMembership)

export default router;
