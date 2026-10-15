import * as patientService from '../services/patientService.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { sendResponse } from '../utils/apiResponse.js';
import { getRequestDetails } from '../utils/requestDetails.js';

export const listPatients = asyncHandler(async (req, res) => {
  const result = await patientService.listPatients(req.query);
  return sendResponse(res, {
    message: 'Patients retrieved',
    data: result.items,
    meta: result.meta,
  });
});

export const createPatient = asyncHandler(async (req, res) => {
  const data = await patientService.registerPatient(req.body, req.user, getRequestDetails(req));
  return sendResponse(res, { statusCode: 201, message: 'Patient created', data });
});

export const updatePatient = asyncHandler(async (req, res) => {
  const data = await patientService.updatePatient(
    req.params.patientId,
    req.body,
    req.user,
    getRequestDetails(req),
  );
  return sendResponse(res, { message: 'Patient updated', data });
});
