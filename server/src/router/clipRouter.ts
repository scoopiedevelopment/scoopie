import { Router } from "express";
import authentication from "../middleware/authentication";
import clipController from "../controller/Clip/clipController";
import { validateRequest } from "../middleware/validatorMiddleware";
import { createClipSchema } from "../schemas/clipSchemas";



const router = Router();

router.post('/create', authentication, validateRequest(createClipSchema),clipController.createClip);
router.get('/get-clip-by-id/:clipId', authentication, clipController.getClipById);
router.get('/get-user-clips/:userId/:page', authentication, clipController.getUserClips);
router.delete('/delete/:clipId', authentication, clipController.deleteClip);

export default router;
