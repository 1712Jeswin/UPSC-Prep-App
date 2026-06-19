import * as adminService from './admin.service.js';
import { sendSuccess } from '../../shared/utils/apiResponse.js';

/**
 * Controller to trigger daily news, editorial, and quiz compilation.
 * Gated securely by Admin tokens.
 */
export const syncNewsEdition = async (req, res) => {
  const { editionType, forceDemo } = req.body;
  const data = await adminService.syncDailyNewsAndQuizzes(editionType, forceDemo);
  return sendSuccess(
    res,
    `Successfully compiled and published the ${editionType} current affairs edition.`,
    data,
    201
  );
};

/**
 * Controller to trigger database cleanup manually.
 * Gated securely by Admin tokens.
 */
export const triggerDatabaseCleanup = async (req, res) => {
  await adminService.runDatabaseGarbageCollector();
  return sendSuccess(res, 'Database garbage collection completed successfully.', {});
};
