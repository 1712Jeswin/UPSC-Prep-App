import express from "express";
import * as upscEngineController from "./upscEngine.controller.js";
import { verifyToken } from "../../middlewares/auth.middleware.js";

const router = express.Router();

router.use(verifyToken);

router.get("/current-affairs/today", upscEngineController.getTodayAffairs);
router.post("/current-affairs/mark-read", upscEngineController.markRead);
router.get("/current-affairs/stats", upscEngineController.getStats);
router.get("/quiz/start", upscEngineController.getQuiz);
router.post("/quiz/submit", upscEngineController.submitQuiz);
router.post("/admin/process", upscEngineController.processAdmin);

export default router;
