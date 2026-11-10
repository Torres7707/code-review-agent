import { z } from "zod";

// Schema shared by the model's structured output and the client's useObject.
export const reviewIssueSchema = z.object({
  severity: z.enum(["high", "medium", "low"]),
  title: z.string().describe("Short, specific name of the problem"),
  file: z.string(),
  startLine: z.number().int().describe("1-based line number in the new file"),
  endLine: z.number().int().optional(),
  why: z.string(),
  fix: z.string(),
});

export const reviewSchema = z.object({
  summary: z.string(),
  issues: z.array(reviewIssueSchema),
});

export type ReviewPayload = z.infer<typeof reviewSchema>;
