import { getDoctorSlots } from '../services/slotService.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { sendResponse } from '../utils/apiResponse.js';

export const listSlots = asyncHandler(async (req, res) => {
  const data = await getDoctorSlots(req.query.doctorId, req.query.date);
  return sendResponse(res, { message: 'Slots retrieved', data });
});
