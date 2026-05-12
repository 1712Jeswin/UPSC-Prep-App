import * as currentAffairsService from "./currentAffairs.service.js";
import { sendSuccess, sendError } from "../../utils/apiResponse.js";
import { asyncHandler } from "../../middlewares/asyncHandler.js";

export const generateDaily = asyncHandler(async (req, res) => {
  try {
    const result = await currentAffairsService.generateDailyContent();
    return sendSuccess(res, result.message, result, 201);
  } catch (error) {
    return sendError(res, error.message || "Failed to generate daily content", [], 500);
  }
});

export const getDailyArticles = asyncHandler(async (req, res) => {
  try {
    const articles = await currentAffairsService.getDailyArticles();
    return sendSuccess(res, "Daily articles retrieved successfully", { items: articles }, 200);
  } catch (error) {
    return sendError(res, error.message || "Failed to retrieve daily articles", [], 500);
  }
});

export const getArticle = asyncHandler(async (req, res) => {
  const { id } = req.params;
  try {
    const article = await currentAffairsService.getArticleById(id);
    if (!article) return sendError(res, "Article not found", [], 404);
    return sendSuccess(res, "Article retrieved successfully", article, 200);
  } catch (error) {
    return sendError(res, error.message || "Failed to retrieve article", [], 500);
  }
});

export const getArticleMCQs = asyncHandler(async (req, res) => {
  const { id } = req.params;
  try {
    const mcqs = await currentAffairsService.getMCQsByArticleId(id);
    return sendSuccess(res, "MCQs retrieved successfully", { items: mcqs }, 200);
  } catch (error) {
    return sendError(res, error.message || "Failed to retrieve MCQs", [], 500);
  }
});
