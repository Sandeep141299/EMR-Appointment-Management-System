import * as appointmentService from '../services/appointmentService.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { sendResponse } from '../utils/apiResponse.js';
import { getRequestDetails } from '../utils/requestDetails.js';

export const createAppointment = asyncHandler(async (req, res) => {
  const data = await appointmentService.createAppointment(
    req.body,
    req.user,
    getRequestDetails(req),
  );
  return sendResponse(res, { statusCode: 201, message: 'Appointment created', data });
});

export const listAppointments = asyncHandler(async (req, res) => {
  const result = await appointmentService.listAppointments(req.query, req.user);
  return sendResponse(res, {
    message: 'Appointments retrieved',
    data: result.items,
    meta: result.meta,
  });
});

export const getAppointment = asyncHandler(async (req, res) => {
  const data = await appointmentService.getAppointment(req.params.appointmentId, req.user);
  return sendResponse(res, { message: 'Appointment retrieved', data });
});

export const updateAppointment = asyncHandler(async (req, res) => {
  const data = await appointmentService.updateAppointment(
    req.params.appointmentId,
    req.body,
    req.user,
    getRequestDetails(req),
  );
  return sendResponse(res, { message: 'Appointment updated', data });
});

function transition(message, operation) {
  return asyncHandler(async (req, res) => {
    const data = await operation(
      req.params.appointmentId,
      req.user,
      getRequestDetails(req),
    );
    return sendResponse(res, { message, data });
  });
}

export const markArrived = transition(
  'Patient marked as arrived',
  appointmentService.markAppointmentArrived,
);
export const completeAppointment = transition(
  'Appointment completed',
  appointmentService.completeAppointment,
);
export const cancelAppointment = transition(
  'Appointment cancelled',
  appointmentService.cancelAppointment,
);
