import { z } from "zod";

// Structured output servers (OpenAI's strict mode) require every property to
// be listed in `required`; a field is optional only by being nullable half the
// time. `.optional()` omits it from `required` and the whole request is rejected,
// which surfaces as an empty stream rather than an error.
export const reviewIssueSchema = z.object({
  severity: z.enum(["high", "medium", "low"]),
  title: z.string().describe("Short, specific name of the problem"),
  file: z.string(),
  startLine: z.number().int().describe("1-based line number in the new file"),
  endLine: z.number().int().nullable().describe("Null unless the issue spans lines"),
  why: z.string(),
  fix: z.string(),
});

export const reviewSchema = z.object({
  summary: z.string(),
  issues: z.array(reviewIssueSchema),
});

export type ReviewPayload = z.infer<typeof reviewSchema>;
