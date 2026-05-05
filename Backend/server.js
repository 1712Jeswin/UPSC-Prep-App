import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import authRoutes from "./src/modules/auth/auth.routes.js";
import { auth } from "./src/lib/auth.js";
import { toNodeHandler } from "better-auth/node";

import { db } from "./src/db/index.js";
import { user } from "./src/db/schema.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors()); // Simple CORS as requested
app.use(express.json());

// Custom Auth Routes
app.use("/api/auth", authRoutes);

// Better Auth handler (Standard Express 5 mount without wildcard)
app.use("/api/auth", toNodeHandler(auth));

// Test route (Drizzle check)
app.get("/db-check", async (req, res) => {
  try {
    const allUsers = await db.select().from(user);
    res.json({ success: true, count: allUsers.length });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Test route
app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "UPSC Platform API is running 🚀"
  });
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    message: err.message || "Internal Server Error",
    errors: []
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});