import { NextFunction, Request, Response, Router } from "express";
import { validateRequest } from "../middleware/validatorMiddleware";
import { registerSchema } from "../schemas/authenticationSchemas";
import authController from "../controller/Authentication/authController";
import passport from "passport";
import { LoginRequest } from "../controller/Authentication/types";
import httpError from "../util/httpError";



const router = Router();

router.route('/register').post(validateRequest(registerSchema), authController.register)

router.route('/google').get(passport.authenticate('google', { scope: ["profile", "email"]}));
router.route('/google/callback').get(passport.authenticate('google'), (req, res, next) => authController.login(req as LoginRequest, res, next));

router.route("/login").post((req: Request, res: Response, next: NextFunction) => {
    passport.authenticate("local", (err: any, user: any, info: { message: string}) => {
        
        if (err) {
            console.error("Authentication error:", err);
            return httpError(next, err, req, 500)
        }
        if (!user) {
            return httpError(next, new Error(info.message || "Login failed."), req, 400)
        }
        
        req.login(user, { session: false }, (loginErr) => {
            if (loginErr) {
                return httpError(next, err, req, 500);
            }
            return authController.login(req as LoginRequest, res, next);
        });
    })(req, res, next);
});


export default router;