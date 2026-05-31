import { Router } from "express";
import * as adminController from "./admin.controller.js";
import { verifyToken } from "../../middlewares/auth.middleware.js";
import { checkRole } from "../../middlewares/role.middleware.js";

const router = Router();

// Secure all admin routes behind standard JWT verify + Admin role check
router.use(verifyToken, checkRole("admin"));

// Trigger news and quiz automation compile
router.post("/sync-news", adminController.syncNewsEdition);

// Manual trigger for data lifecycle sweeper GC
router.post("/cleanup", adminController.triggerDatabaseCleanup);

export default router;
