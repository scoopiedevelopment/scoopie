import { Router } from "express";
import multer from 'multer';
import authentication from "../middleware/authentication";
import uploadController from "../controller/Upload/uploadController";

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });


router.post("/profilepic", authentication, upload.single("media"), uploadController.uploadProfilePic );
router.post("/post", authentication, upload.array("media", 5), uploadController.uploadPost );
router.post("/clip", authentication, upload.single('media'), uploadController.uploadClip);

export default router;