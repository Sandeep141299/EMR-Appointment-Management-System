import Joi from 'joi';
import * as auditLogController from '../controllers/auditLogController.js';
import { Router } from 'express';
import * as scheduleController from '../controllers/scheduleController.js';
import * as staffController from '../controllers/staffController.js';
import { authenticate, authorize } from '../middlewares/authenticate.js';
import {
  validateStaffBody,
  validateStaffParams,
  validateStaffQuery,
} from '../validators/staffValidators.js';

const staffRouter = Router();
const adminRouter = Router();

staffRouter.use(
  authenticate,
  authorize('SUPER_ADMIN', 'RECEPTIONIST', 'DOCTOR'),
);

adminRouter.use(authenticate, authorize('SUPER_ADMIN'));
adminRouter.post('/doctors', validateStaffBody('createDoctor'), staffController.createDoctor);
adminRouter.post('/receptionists', validateStaffBody('createReceptionist'), staffController.createReceptionist);
adminRouter.get('/users', validateStaffQuery('users'), staffController.listStaffUsers);
adminRouter.get(
  '/audit-logs',
  validateStaffQuery('auditLogs'),
  auditLogController.listAuditLogs,
);
adminRouter.patch(
  '/users/:id',
  validateStaffParams(Joi.object({
    id: Joi.string().hex().length(24).required(),
  }).unknown(false)),
  validateStaffBody('updateUser'),
  staffController.updateStaffUser,
);

staffRouter.get(
  '/doctors/:id/schedule',
  validateStaffParams(Joi.object({
    id: Joi.string().hex().length(24).required(),
  }).unknown(false)),
  scheduleController.getDoctorSchedule,
);
staffRouter.put(
  '/doctors/:id/schedule',
  authorize('SUPER_ADMIN'),
  validateStaffParams(Joi.object({
    id: Joi.string().hex().length(24).required(),
  }).unknown(false)),
  validateStaffBody('schedule'),
  scheduleController.setDoctorSchedule,
);

staffRouter.get('/doctors', validateStaffQuery('doctors'), staffController.listDoctors);

export { adminRouter };
export default staffRouter;
