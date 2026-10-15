import { Router } from 'express';
import { getHealthStatus } from '../controllers/healthController.js';

const healthRouter = Router();

healthRouter.get('/health', getHealthStatus);

export default healthRouter;
