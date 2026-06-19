import jwt from 'jsonwebtoken';
import { db } from '../../db/index.js';
import { user } from '../../db/schema.js';
import { eq } from 'drizzle-orm';
import { UnauthorizedError } from '../errors/AppError.js';

/**
 * JWT verification middleware.
 * Extracts the Bearer token from the Authorization header,
 * verifies it, and attaches the full user record to req.user.
 *
 * Throws UnauthorizedError on missing/invalid token or user not found.
 */
export const verifyToken = async (req, _res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new UnauthorizedError('Unauthorized - Missing token');
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const users = await db.select().from(user).where(eq(user.id, decoded.userId)).limit(1);
    const currentUser = users[0];

    if (!currentUser) {
      throw new UnauthorizedError('User not found');
    }

    req.user = currentUser;
    next();
  } catch (error) {
    if (error instanceof UnauthorizedError) throw error;
    throw new UnauthorizedError('Unauthorized - Invalid token');
  }
};
