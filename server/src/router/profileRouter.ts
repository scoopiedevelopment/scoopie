import { Router } from "express";
import profileController from "../controller/Profile/profileController";
import { validateRequest } from "../middleware/validatorMiddleware";
import { updateProfileSchema } from "../schemas/profileSchemas";
import authentication from "../middleware/authentication";



const router = Router();

router.post('/update',authentication, validateRequest(updateProfileSchema), profileController.update);
router.get('/get-profile', authentication, profileController.getProfile);
router.get('/get-user-profile/:userId', authentication, profileController.getUserProfile);
router.delete('/delete', authentication, profileController.delete);

export default router;
