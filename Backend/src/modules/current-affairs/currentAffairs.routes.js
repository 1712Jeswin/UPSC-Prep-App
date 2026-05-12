import express from "express";
import * as currentAffairsController from "./currentAffairs.controller.js";

const router = express.Router();

router.post("/admin/generate", currentAffairsController.generateDaily);
router.get("/daily", currentAffairsController.getDailyArticles);
router.get("/article/:id", currentAffairsController.getArticle);
router.get("/article/:id/mcqs", currentAffairsController.getArticleMCQs);

export default router;
