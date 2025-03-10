import { Router } from "express";
import multer from 'multer';
// import authentication from "../middleware/authentication";
import uploadController from "../controller/Upload/uploadController";

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });


router.post("/profilepic",  upload.single("media"), uploadController.uploadProfilePic );
router.post("/post",  upload.array("media", 5), uploadController.uploadPost );

export default router;