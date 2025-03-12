import { Router } from 'express'
import apiController from '../controller/apiController'
import authRouter from './authRouter';
import profileRouter from './profileRouter';
import uploadRouter from './uploadRouter';
import postRouter from './postRouter';
const router = Router()

router.route('/self').get(apiController.self)
router.route('/health').get(apiController.health)

// Authentication
router.use('/auth', authRouter);
router.use('/profile', profileRouter);
router.use('/upload', uploadRouter);
router.use('/post', postRouter);

export default router