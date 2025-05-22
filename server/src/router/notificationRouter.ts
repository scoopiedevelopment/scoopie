import { Router } from "express";
import notificationController from "../controller/Notification/notificationController";
import authentication from "../middleware/authentication";
import { validateRequest } from "../middleware/validatorMiddleware";
import { saveFcmSchema } from "../schemas/notificationSchemas";




const router = Router();

router.use(authentication);

router.post('/saveFcm', validateRequest(saveFcmSchema), notificationController.saveFcm);
router.get('/getNotifications', notificationController.getNotifications);
router.put('/markAsRead', notificationController.markRead);


export default router;