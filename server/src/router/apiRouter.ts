import { Router } from 'express'
import apiController from '../controller/apiController'
import authRouter from './authRouter';
import profileRouter from './profileRouter';
import uploadRouter from './uploadRouter';
import postRouter from './postRouter';
import feedRouter from './feedRouter';
import likeRouter from './likeRouter';
import commentRouter from './commentRouter';
import clipRouter from './clipRouter';
const router = Router()

router.route('/self').get(apiController.self)
router.route('/health').get(apiController.health)

router.use('/auth', authRouter);
router.use('/profile', profileRouter);
router.use('/upload', uploadRouter);
router.use('/post', postRouter);
router.use('/feed', feedRouter);
router.use('/togglelike', likeRouter);
router.use('/comment', commentRouter);
router.use('/clip', clipRouter);

export default router