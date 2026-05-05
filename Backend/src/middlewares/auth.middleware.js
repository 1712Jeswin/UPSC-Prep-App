import jwt from "jsonwebtoken";
import { sendError } from "../utils/apiResponse.js";
import { db } from "../db/index.js";
import { user } from "../db/schema.js";
import { eq } from "drizzle-orm";

export const verifyToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return sendError(res, "Unauthorized - Missing token", [], 401);
    }

    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const users = await db.select().from(user).where(eq(user.id, decoded.userId)).limit(1);
    const currentUser = users[0];

    if (!currentUser) {
      return sendError(res, "User not found", [], 401);
    }

    req.user = currentUser;
    next();
  } catch (error) {
    return sendError(res, "Unauthorized - Invalid token", [], 401);
  }
};
