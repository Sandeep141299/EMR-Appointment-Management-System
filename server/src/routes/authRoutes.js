import { Router } from 'express';
import * as authController from '../controllers/authController.js';
import { validateBody } from '../validators/authValidators.js';

const authRouter = Router();

authRouter.post('/login', validateBody('login'), authController.login);
authRouter.post('/refresh', validateBody('refresh'), authController.refresh);
authRouter.post('/logout', validateBody('logout'), authController.logout);

export default authRouter;
