import { Router } from "express";
import authentication from "../middleware/authentication";
import likeController from "../controller/Like/toggleLikeController";




const router = Router();

router.use(authentication);

router.post("/", likeController.toggleLike);

export default router;
