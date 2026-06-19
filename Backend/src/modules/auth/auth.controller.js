import * as authService from './auth.service.js';
import { sendSuccess } from '../../shared/utils/apiResponse.js';

/**
 * POST /api/auth/register
 * Register a new user. Validation handled by middleware.
 */
export const register = async (req, res) => {
  const { email, password, name } = req.body;
  const data = await authService.registerUser(email, password, name);
  return sendSuccess(res, 'User registered successfully', data, 201);
};

/**
 * POST /api/auth/login
 * Authenticate an existing user. Validation handled by middleware.
 */
export const login = async (req, res) => {
  const { email, password } = req.body;
  const data = await authService.loginUser(email, password);
  return sendSuccess(res, 'Login successful', data);
};

/**
 * GET /api/auth/me
 * Get current authenticated user profile.
 */
export const me = async (req, res) => {
  return sendSuccess(res, 'User profile retrieved', { user: req.user });
};
