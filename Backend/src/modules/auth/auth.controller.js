import * as authService from "./auth.service.js";
import { sendSuccess, sendError } from "../../utils/apiResponse.js";
import { asyncHandler } from "../../middlewares/asyncHandler.js";

export const register = asyncHandler(async (req, res) => {
  const { email, password, name } = req.body;
  if (!email || !password) return sendError(res, "Email and password are required", [], 400);

  try {
    const data = await authService.registerUser(email, password, name);
    return res.status(201).json({ success: true, data });
  } catch (error) {
    return sendError(res, error.message || "Registration failed", [], 400);
  }
});

export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return sendError(res, "Email and password are required", [], 400);

  try {
    const data = await authService.loginUser(email, password);
    return res.status(200).json({ success: true, data });
  } catch (error) {
    return sendError(res, error.message || "Invalid credentials", [], 401);
  }
});


export const me = asyncHandler(async (req, res) => {
  return sendSuccess(res, "User profile retrieved", { user: req.user }, 200);
});
