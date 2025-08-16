import { Router } from 'express';
import followController from '../controller/Follow/followController';
import authentication from '../middleware/authentication';




const router = Router();
router.use(authentication);

router.post('/follow/:id', followController.followUser);
router.post('/unfollow/:id', followController.unfollowUser);
router.get('/followers', followController.getFollowers);
router.get('/get-user-followers/:id', followController.getOtherUserFollowers);
router.get('/get-user-following/:id', followController.getOtherUserFollowing);
router.get('/following', followController.getFollowing);
router.post('/accept-follow-request/:id', followController.acceptFollowRequest);
router.post('/reject-follow-request/:id', followController.rejectFollowRequest);
router.get('/followers', followController.getFollowers);
router.get('/following', followController.getFollowing);
router.get('/follow-requests', followController.getFollowRequests);




export default router;