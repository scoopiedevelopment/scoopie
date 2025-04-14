import { Router } from "express";
import savedController from "../controller/Profile/savedController";
import authentication from "../middleware/authentication";



const router = Router();

router.use(authentication);
router.post('/toggle', savedController.toggleSave);
router.get('/get-saved/:page', savedController.getSaved);

export default router;