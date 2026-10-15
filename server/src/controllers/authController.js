import { sendResponse } from '../utils/apiResponse.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { getRequestDetails } from '../utils/requestDetails.js';
import * as authService from '../services/authService.js';

export const login = asyncHandler(async (req, res) => {
  const data = await authService.login(req.body, getRequestDetails(req));
  return sendResponse(res, { message: 'Login successful', data });
});

export const refresh = asyncHandler(async (req, res) => {
  const data = await authService.refresh(req.body.refreshToken);
  return sendResponse(res, { message: 'Tokens refreshed', data });
});

export const logout = asyncHandler(async (req, res) => {
  await authService.logout(req.body.refreshToken);
  return sendResponse(res, { message: 'Logout successful' });
});
