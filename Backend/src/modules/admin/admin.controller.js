import * as adminService from "./admin.service.js";
import { sendSuccess, sendError } from "../../utils/apiResponse.js";
import { asyncHandler } from "../../middlewares/asyncHandler.js";

/**
 * Controller to trigger daily news, editorial, and quiz compilation.
 * Gated securely by Admin tokens.
 */
export const syncNewsEdition = asyncHandler(async (req, res) => {
  const { editionType, forceDemo } = req.body;
  
  // Enforce valid edition formats
  const targetEdition = (editionType && ["MORNING", "EVENING"].includes(editionType.toUpperCase())) 
    ? editionType.toUpperCase() 
    : "MORNING";
  
  try {
    const data = await adminService.syncDailyNewsAndQuizzes(targetEdition, forceDemo === true);
    return sendSuccess(res, `Successfully compiled and published the ${targetEdition} current affairs edition.`, data, 201);
  } catch (error) {
    console.error("[Sync Error] Failed to ingest daily news:", error);
    return sendError(res, error.message || "Failed to compile the daily news edition.", [], 500);
  }
});

/**
 * Controller to trigger database cleanup manually.
 * Gated securely by Admin tokens.
 */
export const triggerDatabaseCleanup = asyncHandler(async (req, res) => {
  try {
    await adminService.runDatabaseGarbageCollector();
    return sendSuccess(res, "Database garbage collection completed successfully.", {}, 200);
  } catch (error) {
    console.error("[GC Error] Database cleanup failed:", error);
    return sendError(res, error.message || "Database garbage collection failed.", [], 500);
  }
});
