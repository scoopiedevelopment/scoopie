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
import searchRouter from './searchRouter';
import savedRouter from './savedRouter';
import countRouter from './countRouter';
import followRouter from './followRouter';



const router = Router()

router.route('/self').get(apiController.self)
router.route('/health').get(apiController.health)

router.use('/auth', authRouter);
router.use('/profile', profileRouter);
router.use('/upload', uploadRouter);
router.use('/post', postRouter);
router.use('/feed', feedRouter);
router.use('/like', likeRouter);
router.use('/comment', commentRouter);
router.use('/clip', clipRouter);
router.use('/search', searchRouter);
router.use('/saved', savedRouter);
router.use('/count', countRouter);
router.use('/connection', followRouter);
export default router