import { Router } from 'express'
import apiController from '../controller/apiController'
import authRouter from './authRouter';
import profileRouter from './profileRouter';

const router = Router()

router.route('/self').get(apiController.self)
router.route('/health').get(apiController.health)

// Authentication
router.use('/auth', authRouter);
router.use('/profile', profileRouter)

export default router