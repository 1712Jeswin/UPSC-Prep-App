import * as dailyFlowService from "../../services/dailyFlowService.js";
import { sendSuccess, sendError } from "../../utils/apiResponse.js";
import { asyncHandler } from "../../middlewares/asyncHandler.js";
import { markReadSchema, quizSubmitSchema } from "./upscEngine.validation.js";

export const getTodayAffairs = asyncHandler(async (req, res) => {
    const data = await dailyFlowService.getTodayAffairs(req.user.id);
    return sendSuccess(res, "Today's structured affairs retrieved", data, 200);
});

export const markRead = asyncHandler(async (req, res) => {
    const validation = markReadSchema.safeParse(req.body);
    if (!validation.success) {
        return sendError(res, "Validation Error", validation.error.errors, 400);
    }
    
    const result = await dailyFlowService.markAffairRead(req.user.id, validation.data.affairId);
    return sendSuccess(res, "Article marked as read", result, 200);
});

export const getStats = asyncHandler(async (req, res) => {
    const session = await dailyFlowService.getOrCreateDailySession(req.user.id);
    return sendSuccess(res, "Daily stats retrieved", session, 200);
});

export const getQuiz = asyncHandler(async (req, res) => {
    const data = await dailyFlowService.getDailyQuiz(req.user.id);
    if (!data.quizUnlocked) {
        return sendSuccess(res, "Quiz locked", data, 200); 
    }
    return sendSuccess(res, "Quiz loaded", data, 200);
});

export const submitQuiz = asyncHandler(async (req, res) => {
    const validation = quizSubmitSchema.safeParse(req.body);
    if (!validation.success) {
        return sendError(res, "Validation Error", validation.error.errors, 400);
    }
    
    const result = await dailyFlowService.submitQuizAnswers(req.user.id, validation.data.answers);
    return sendSuccess(res, "Quiz submitted", result, 200);
});

export const processAdmin = asyncHandler(async (req, res) => {
    const result = await dailyFlowService.processDailyAdmin();
    return sendSuccess(res, "Admin processing complete", result, 200);
});
