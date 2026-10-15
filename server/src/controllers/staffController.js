import * as staffService from '../services/staffService.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { sendResponse } from '../utils/apiResponse.js';
import { getRequestDetails } from '../utils/requestDetails.js';

export const createDoctor = asyncHandler(async (req, res) => {
  const data = await staffService.createDoctor(req.body);
  return sendResponse(res, { statusCode: 201, message: 'Doctor created', data });
});

export const createReceptionist = asyncHandler(async (req, res) => {
  const data = await staffService.createReceptionist(req.body);
  return sendResponse(res, { statusCode: 201, message: 'Receptionist created', data });
});

export const listDoctors = asyncHandler(async (req, res) => {
  const data = await staffService.listDoctors(req.query.department);
  return sendResponse(res, { message: 'Doctors retrieved', data });
});

export const listStaffUsers = asyncHandler(async (req, res) => {
  const data = await staffService.listStaffUsers(req.query.role);
  return sendResponse(res, { message: 'Staff users retrieved', data });
});

export const updateStaffUser = asyncHandler(async (req, res) => {
  const data = await staffService.updateStaffUser(
    req.params.id,
    req.body,
    req.user,
    getRequestDetails(req),
  );
  return sendResponse(res, { message: 'Staff user updated', data });
});
