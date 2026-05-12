import { z } from "zod";

/** Maximum quiz answers allowed per submission (mirrors service-layer constant) */
const MAX_QUIZ_ANSWERS = 20;

export const markReadSchema = z.object({
  affairId: z.string().uuid("affairId must be a valid UUID")
});

export const quizSubmitSchema = z.object({
  answers: z
    .array(
      z.object({
        // Validate quizId is a non-empty string (UUID format enforced at service layer)
        quizId: z.string().min(1, "quizId is required"),
        selectedAnswer: z.string().min(1, "selectedAnswer is required")
      })
    )
    // Phase 1 hardening: reject payloads that exceed the per-request limit.
    // This is the first defence; service layer also enforces it redundantly.
    .max(MAX_QUIZ_ANSWERS, `Maximum ${MAX_QUIZ_ANSWERS} answers per submission`)
    .min(1, "At least one answer is required")
});
