import { Router } from "express";
import authentication from "../middleware/authentication";
import feedController from "../controller/Feed/feedController";




const router = Router();

router.use(authentication);

router.get("/postFeeds/:page", feedController.feeds);
router.get("/clipsFeeds/:page", feedController.clipFeeds);
router.get("/addedFeeds/:page", feedController.addedFeeds);

export default router;
