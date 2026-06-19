import { db } from '../../db/index.js';
import { user, account } from '../../db/schema.js';
import { eq, and } from 'drizzle-orm';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { UnauthorizedError, ConflictError } from '../../shared/errors/AppError.js';

/**
 * Register a new user.
 * @param {string} email
 * @param {string} password
 * @param {string} [name]
 * @returns {Promise<{ accessToken: string }>}
 * @throws {ConflictError} If user already exists
 */
export const registerUser = async (email, password, name) => {
  const existingUser = await db.select().from(user).where(eq(user.email, email)).limit(1);
  if (existingUser.length > 0) {
    throw new ConflictError('User already exists');
  }

  const userId = crypto.randomUUID();
  const [newUser] = await db
    .insert(user)
    .values({
      id: userId,
      email,
      name: name || email.split('@')[0],
      emailVerified: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    })
    .returning();

  const hashedPassword = await bcrypt.hash(password, 12);
  await db.insert(account).values({
    id: crypto.randomUUID(),
    userId: newUser.id,
    accountId: userId,
    providerId: 'credential',
    password: hashedPassword,
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  const accessToken = jwt.sign({ userId: newUser.id }, process.env.JWT_SECRET, {
    expiresIn: '7d',
  });
  return { accessToken };
};

/**
 * Authenticate an existing user.
 * @param {string} email
 * @param {string} password
 * @returns {Promise<{ accessToken: string }>}
 * @throws {UnauthorizedError} If credentials are invalid
 */
export const loginUser = async (email, password) => {
  const users = await db.select().from(user).where(eq(user.email, email)).limit(1);
  const existingUser = users[0];

  if (!existingUser) {
    throw new UnauthorizedError('Invalid credentials');
  }

  const accounts = await db
    .select()
    .from(account)
    .where(and(eq(account.userId, existingUser.id), eq(account.providerId, 'credential')))
    .limit(1);
  const existingAccount = accounts[0];

  if (!existingAccount || !existingAccount.password) {
    throw new UnauthorizedError('Invalid credentials');
  }

  const isMatch = await bcrypt.compare(password, existingAccount.password);
  if (!isMatch) {
    throw new UnauthorizedError('Invalid credentials');
  }

  const accessToken = jwt.sign({ userId: existingUser.id }, process.env.JWT_SECRET, {
    expiresIn: '7d',
  });
  return { accessToken };
};
