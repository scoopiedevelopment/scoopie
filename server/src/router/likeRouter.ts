import { Router } from "express";
import authentication from "../middleware/authentication";
import likeController from "../controller/Like/toggleLikeController";
import { validateRequest } from "../middleware/validatorMiddleware";
import { likeSchema } from "../schemas/likeSchemas";




const router = Router();

router.use(authentication);

router.post("/toggle", validateRequest(likeSchema), likeController.toggleLike);

export default router;
