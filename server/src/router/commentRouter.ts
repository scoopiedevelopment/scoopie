import { Router } from "express";
import authentication from "../middleware/authentication";
import commentController from "../controller/Comment/commentController";




const router = Router();

router.use(authentication);

router.post("/create", commentController.comment);
router.get("/get-post-comments/:postId", commentController.getComments);
router.delete("/delete/:commentId", commentController.deleteComment)

export default router;
