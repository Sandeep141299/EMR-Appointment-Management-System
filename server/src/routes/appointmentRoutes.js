import { Router } from 'express';
import * as appointmentController from '../controllers/appointmentController.js';
import { authenticate, authorize } from '../middlewares/authenticate.js';
import { AppError } from '../utils/AppError.js';
import {
  validateAppointmentBody,
  validateAppointmentParams,
  validateAppointmentQuery,
} from '../validators/appointmentValidators.js';

const appointmentRouter = Router();
const staffRoles = ['SUPER_ADMIN', 'RECEPTIONIST'];
const appointmentReaders = ['SUPER_ADMIN', 'RECEPTIONIST', 'DOCTOR'];

function restrictDoctorPurposeUpdate(req, res, next) {
  if (req.user.role === 'DOCTOR' && Object.hasOwn(req.body, 'purpose')) {
    return next(new AppError('Doctors may update consultation notes only', 403));
  }
  return next();
}

appointmentRouter.use(authenticate);
appointmentRouter.post(
  '/appointments',
  authorize(...staffRoles),
  validateAppointmentBody('create'),
  appointmentController.createAppointment,
);
appointmentRouter.get(
  '/appointments',
  authorize(...appointmentReaders),
  validateAppointmentQuery('listQuery'),
  appointmentController.listAppointments,
);
appointmentRouter.get(
  '/appointments/:appointmentId',
  authorize(...appointmentReaders),
  validateAppointmentParams,
  appointmentController.getAppointment,
);
appointmentRouter.patch(
  '/appointments/:appointmentId',
  authorize(...appointmentReaders),
  validateAppointmentParams,
  validateAppointmentBody('update'),
  restrictDoctorPurposeUpdate,
  appointmentController.updateAppointment,
);
appointmentRouter.put(
  '/appointments/:appointmentId',
  authorize(...appointmentReaders),
  validateAppointmentParams,
  validateAppointmentBody('update'),
  restrictDoctorPurposeUpdate,
  appointmentController.updateAppointment,
);
appointmentRouter.post(
  '/appointments/:appointmentId/arrive',
  authorize(...staffRoles),
  validateAppointmentParams,
  appointmentController.markArrived,
);
appointmentRouter.post(
  '/appointments/:appointmentId/complete',
  authorize('SUPER_ADMIN'),
  validateAppointmentParams,
  appointmentController.completeAppointment,
);
appointmentRouter.post(
  '/appointments/:appointmentId/cancel',
  authorize(...staffRoles),
  validateAppointmentParams,
  appointmentController.cancelAppointment,
);
appointmentRouter.delete(
  '/appointments/:appointmentId',
  authorize(...staffRoles),
  validateAppointmentParams,
  appointmentController.cancelAppointment,
);

export default appointmentRouter;
