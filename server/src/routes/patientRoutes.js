import { Router } from 'express';
import * as patientController from '../controllers/patientController.js';
import { authenticate, authorize } from '../middlewares/authenticate.js';
import {
  validateAppointmentBody,
  validateAppointmentQuery,
  validatePatientParams,
} from '../validators/appointmentValidators.js';

const patientRouter = Router();

patientRouter.use(authenticate, authorize('SUPER_ADMIN', 'RECEPTIONIST'));
patientRouter.get('/patients', validateAppointmentQuery('patientListQuery'), patientController.listPatients);
patientRouter.post('/patients', validateAppointmentBody('patientCreate'), patientController.createPatient);
patientRouter.patch(
  '/patients/:patientId',
  validatePatientParams,
  validateAppointmentBody('patientUpdate'),
  patientController.updatePatient,
);

export default patientRouter;
