import * as scheduleService from '../services/scheduleService.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { sendResponse } from '../utils/apiResponse.js';
import { getRequestDetails } from '../utils/requestDetails.js';

export const getDoctorSchedule = asyncHandler(async (req, res) => {
  const data = await scheduleService.getDoctorSchedule(req.params.id, req.user);
  return sendResponse(res, { message: 'Doctor schedule retrieved', data });
});

export const setDoctorSchedule = asyncHandler(async (req, res) => {
  const data = await scheduleService.setDoctorSchedule(
    req.params.id,
    req.body,
    req.user,
    getRequestDetails(req),
  );
  return sendResponse(res, { message: 'Doctor schedule saved', data });
});
