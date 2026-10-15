import { Router } from 'express';
import { listSlots } from '../controllers/slotController.js';
import { authenticate, authorize } from '../middlewares/authenticate.js';
import { validateSlotQuery } from '../validators/slotValidators.js';

const slotRouter = Router();

slotRouter.use(authenticate, authorize('SUPER_ADMIN', 'RECEPTIONIST', 'DOCTOR'));
slotRouter.get('/slots', validateSlotQuery, listSlots);

export default slotRouter;
