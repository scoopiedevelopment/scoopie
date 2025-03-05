import { Router } from "express";
import { validateRequest } from "../middleware/validatorMiddleware";
import { registerSchema } from "../schemas/authenticationSchemas";
import authController from "../controller/Authentication/authController";
import passport from "passport";
import { LoginRequest } from "../controller/Authentication/types";



const router = Router();

router.route('/register').post(validateRequest(registerSchema), authController.register)

router.route('/google').get(passport.authenticate('google', { scope: ["profile", "email"]}));
router.route('/google/callback').get(passport.authenticate('google'), (req, res, next) => authController.login(req as LoginRequest, res, next));

router.route('/login').post(passport.authenticate('local'), (req, res, next) => authController.login(req as LoginRequest, res, next))


export default router;