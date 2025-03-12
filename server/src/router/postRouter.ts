import { Router } from "express";
import authentication from "../middleware/authentication";
import postController from "../controller/Post/postController";
import { validateRequest } from "../middleware/validatorMiddleware";
import { createPostSchema } from "../schemas/postSchemas";



const router = Router();

router.post('/create', authentication, validateRequest(createPostSchema), postController.createPost);
router.delete('/delete/:postId', authentication, postController.deletePost);
router.get('/get-post-by-id/:postId', authentication, postController.getPostById);
router.get('/get-user-posts/:userId', authentication, postController.getUserPosts);

export default router;
