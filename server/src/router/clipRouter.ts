import { Router } from "express";
import authentication from "../middleware/authentication";
import clipController from "../controller/Clip/clipController";



const router = Router();

router.post('/create', authentication, clipController.createClip);
router.get('/get-clip-by-id/:clipId', authentication, clipController.getClipById);
router.get('/get-user-clips/:userId', authentication, clipController.getUserClips);
router.delete('/delete/:clipId', authentication, clipController.deleteClip);

export default router;
