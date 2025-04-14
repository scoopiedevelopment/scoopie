import { Router } from "express";
import authentication from "../middleware/authentication";
import commentController from "../controller/Comment/commentController";
import { validateRequest } from "../middleware/validatorMiddleware";
import { createCommentSchema } from "../schemas/commentSchemas";




const router = Router();

router.use(authentication);

router.post("/create", validateRequest(createCommentSchema), commentController.comment);
router.get("/get-comments/:type/:id/:page", commentController.getComments);
router.delete("/delete/:commentId", commentController.deleteComment)

export default router;
