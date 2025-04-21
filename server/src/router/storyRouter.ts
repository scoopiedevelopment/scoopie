import { Router } from 'express';
import authentication from '../middleware/authentication';
import storyController from '../controller/Story/storyController';



const router = Router();

router.use(authentication);

router.post('/create', storyController.createStory);
router.get('/get', storyController.getStories);

export default router;