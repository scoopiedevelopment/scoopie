import { Router } from "express";
import profileController from "../controller/Profile/profileController";
import { validateRequest } from "../middleware/validatorMiddleware";
import { createProfileSchema, updateProfileSchema } from "../schemas/profileSchemas";
import authentication from "../middleware/authentication";



const router = Router();

router.post('/create', authentication, validateRequest(createProfileSchema), profileController.create);
router.post('/update',authentication, validateRequest(updateProfileSchema), profileController.update);
router.get('/get-profile', authentication, profileController.getProfile);
router.delete('/delete', authentication, profileController.delete);

export default router;
