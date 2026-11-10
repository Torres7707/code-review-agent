import { Output, createTextStreamResponse, streamText } from "ai";
import { z } from "zod";
import { readSession } from "@/lib/github-auth";
import {
  getPull,
  githubErrorResponse,
  isValidOwner,
  isValidRepo,
  listPullFiles,
} from "@/lib/github";
import { REVIEW_PROMPT } from "@/lib/prompt";
import { buildReviewPrompt, planReview, type ReviewInput } from "@/lib/review-core";
import { reviewSchema } from "@/lib/review-schema";

export const maxDuration = 60;

/** Written into the stream when the model fails; the client treats it as an error. */
const REVIEW_FAILED_MARKER = "\n[review failed]";

// Only a PR reference is accepted. The diff is always fetched server-side
// with the caller's own token, so the endpoint cannot be used to send
// arbitrary text to the model.
const bodySchema = z.object({
  owner: z.string().refine(isValidOwner),
  repo: z.string().refine(isValidRepo),
  number: z.number().int().positive(),
});

const MAX_BODY_BYTES = 2048;

function jsonError(error: string, status: number) {
  return Response.json({ error }, { status });
}

async function loadPrInput(
  token: string,
  owner: string,
  repo: string,
  number: number,
): Promise<{ ok: true; input: ReviewInput } | { ok: false; response: Response }> {
  const [pull, files] = await Promise.all([
    getPull(token, owner, repo, number),
    listPullFiles(token, owner, repo, number),
  ]);
  if (!pull.ok) return { ok: false, response: githubErrorResponse(pull.status) };
  if (!files.ok) return { ok: false, response: githubErrorResponse(files.status) };

  const plan = planReview(files.data);
  return {
    ok: true,
    input: {
      pr: { number: pull.data.number, title: pull.data.title, branch: pull.data.head.ref },
      files: files.data.flatMap((f, i) => {
        const patch = plan[i]?.patch;
        return patch
          ? [{ path: f.filename, additions: f.additions, deletions: f.deletions, patch }]
          : [];
      }),
    },
  };
}

export async function POST(req: Request) {
  const token = await readSession(req);
  if (!token) return jsonError("unauthorized", 401);

  const raw = await req.text();
  if (raw.length > MAX_BODY_BYTES) return jsonError("Request body too large", 413);

  let json: unknown;
  try {
    json = JSON.parse(raw);
  } catch {
    return jsonError("Invalid JSON body", 400);
  }
  const body = bodySchema.safeParse(json);
  if (!body.success) return jsonError("Expected { owner, repo, number }", 400);

  if (!process.env.AI_GATEWAY_API_KEY) {
    return jsonError("AI_GATEWAY_API_KEY is not configured", 500);
  }

  const loaded = await loadPrInput(token, body.data.owner, body.data.repo, body.data.number);
  if (!loaded.ok) return loaded.response;

  try {
    const result = streamText({
      model: process.env.AI_MODEL ?? "openai/gpt-5-mini",
      instructions: REVIEW_PROMPT,
      prompt: buildReviewPrompt(loaded.input),
      abortSignal: req.signal,
      output: Output.object({ schema: reviewSchema }),
    });

    // `toTextStreamResponse` drops error parts, so a rejected schema or an
    // upstream 500 would close the body with no bytes and the client would
    // read it as "no issues found". Append a marker instead; it makes the
    // final JSON invalid, which the client reports as a failed review. The
    // upstream error details stay in the server log.
    const text = result.fullStream.pipeThrough(
      new TransformStream({
        transform(part, controller) {
          if (part.type === "text-delta") {
            controller.enqueue(part.text);
          } else if (part.type === "error") {
            console.error("Review stream failed:", part.error);
            controller.enqueue(REVIEW_FAILED_MARKER);
          }
        },
      }),
    );

    return createTextStreamResponse({ stream: text });
  } catch (error) {
    console.error(error);
    return jsonError("Review failed", 500);
  }
}
