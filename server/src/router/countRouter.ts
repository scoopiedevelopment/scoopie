import { Router } from 'express';
import countController from '../controller/Count/countController';



const router = Router();

router.post('/post/:postId', countController.post);
router.post('/clip/:clipId', countController.clip);
router.post('/share/post/:postId', countController.sharePost);
router.post('/share/clip/:clipId', countController.shareClip);



export default router;