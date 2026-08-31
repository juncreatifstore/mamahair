import { z } from "zod";

export const quizSchema = z.object({
  goal: z.enum(["WIG", "BUNDLE", "CLOSURE", "FRONTAL", "HAIR_CARE"]).optional(),
  texture: z.string().max(40).optional(),
  length: z.enum(["short", "medium", "long", "extra"]).optional(),
  budget: z.enum(["low", "mid", "high"]).optional(),
  usage: z.enum(["daily", "occasional"]).optional(),
  maintenance: z.enum(["low", "medium", "high"]).optional(),
});
export type QuizAnswers = z.infer<typeof quizSchema>;
