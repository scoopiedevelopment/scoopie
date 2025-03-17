import { Router } from "express";
import authentication from "../middleware/authentication";
import feedController from "../controller/Feed/feedController";




const router = Router();

router.use(authentication);

router.get("/", feedController.feeds);

export default router;
